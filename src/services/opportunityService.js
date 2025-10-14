import opportunities from '../models/opportunities.js'
import db from '../config/db.js'
import opportunityServices from '../models/opportunityServices.js'
import customers from '../models/customers.js'
import projects from '../models/projects.js'
import contracts from '../models/contracts.js'



const opportunityService = {
    getAllOpportunities: async () => {
        return await opportunities.getAll();
    },
    getAllPendingOpportunities: async () =>{
        return await opportunities.getAllPending();
    },
    getOpportunityById: async (id) => {
        if (!id) throw new Error('id required');
        return await opportunities.getById(id);
    },

    createOpportunity: async (payload) => {
        // minimal validation
        if (!payload) throw new Error('payload required');

        // If services are provided, create opportunity and services in a transaction
        const services = payload.services || [];
        if (!services || services.length === 0) {
            // ensure we create with explicit 'waiting_bod_approval' status unless caller provided one
            payload.status = payload.status || 'waiting_bod_approval';
            return await opportunities.create(payload);
        }

        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // compute expected_price as sum over services: (proposed_price || base_cost) * quantity
            let computedExpected = 0;
            for (const s of services) {
                const serviceId = s.service_id;
                const quantityRaw = s.quantity != null ? Number(s.quantity) : 1;
                const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
                const proposed = s.proposed_price != null ? Number(s.proposed_price) : null;

                // fetch base_cost for service
                const svcRes = await client.query('SELECT id, base_cost FROM service WHERE id = $1', [serviceId]);
                if (!svcRes.rows || svcRes.rows.length === 0) {
                    throw new Error(`service id ${serviceId} not found`);
                }
               let baseCostPerUnit = svcRes.rows[0].base_cost != null ? Number(svcRes.rows[0].base_cost) : 0;
                if (s.service_job_id) {
                    const sjRes = await client.query('SELECT service_id, base_cost FROM service_job WHERE id = $1', [s.service_job_id]);
                    if (!sjRes.rows || sjRes.rows.length === 0) {
                        throw new Error(`service_job id ${s.service_job_id} not found`);
                    }
                    const sjServiceId = sjRes.rows[0].service_id;
                    if (sjServiceId != null && Number(sjServiceId) !== Number(serviceId)) {
                        throw new Error('service_job does not belong to the provided service');
                    }
                    if (sjRes.rows[0].base_cost != null) {
                        baseCostPerUnit = Number(sjRes.rows[0].base_cost);
                    }
                }
                const unitPrice = proposed != null ? proposed : baseCostPerUnit;
                computedExpected += unitPrice * quantity;
            }

            const expectedToInsert = computedExpected > 0
                ? computedExpected
                : (payload.expected_price != null ? Number(payload.expected_price) : null);


            const statusToInsert = payload.status || 'waiting_bod_approval';

            let createdOppRes;
            try {
                createdOppRes = await client.query(
                    `INSERT INTO opportunity (customer_id, customer_temp, expected_price, description, created_by, status)
                     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                    [payload.customer_id || null, payload.customer_temp || null, expectedToInsert, payload.description || null, payload.created_by || null, statusToInsert]
                );
            } catch (err) {
                const msg = (err && err.message) ? String(err.message) : '';
                if (msg.includes('invalid input value for enum') && msg.includes('opportunity_status')) {
                    // The current transaction is now aborted; rollback and retry the whole
                    // opportunity + services insert inside a fresh transaction using a new client.
                    console.warn('opportunityService.createOpportunity: DB enum did not accept status, retrying full create in a fresh transaction with fallback "pending"; consider running migration to add missing enum values.');
                    try {
                        await client.query('ROLLBACK');
                    } catch (rbErr) {
                        // ignore rollback errors, we'll release and try again
                        console.warn('Rollback after enum error failed:', rbErr);
                    }
                    client.release();

                    const client2 = await db.connect();
                    try {
                        await client2.query('BEGIN');
                        const createdOppRes2 = await client2.query(
                            `INSERT INTO opportunity (customer_id, customer_temp, expected_price, description, created_by, status)
                             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                            [payload.customer_id || null, payload.customer_temp || null, expectedToInsert, payload.description || null, payload.created_by || null, 'pending']
                        );
                        const createdOpp2 = createdOppRes2.rows[0];
                        const createdServices2 = await opportunityServices.createMany(createdOpp2.id, services, client2);
                        await client2.query('COMMIT');
                        createdOpp2.services = createdServices2;
                        return createdOpp2;
                    } catch (err2) {
                        await client2.query('ROLLBACK');
                        throw err2;
                    } finally {
                        client2.release();
                    }
                }
                throw err;
            }
            const createdOpp = createdOppRes.rows[0];

            // insert opportunity_service rows
            const createdServices = await opportunityServices.createMany(createdOpp.id, services, client);

            await client.query('COMMIT');
            createdOpp.services = createdServices;
            return createdOpp;
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    },

    updateOpportunity: async (id, fields) => {
        if (!id) throw new Error('id required');
        return await opportunities.update(id, fields);
    },

    // Submit a draft opportunity to BOD for review
    submitToBod: async (id, userId) => {
        if (!id) throw new Error('id required');
        // Only allow submission from draft status
        const op = await opportunities.getById(id);
        if (!op) throw new Error('Opportunity not found');
        // If it's already submitted, treat as idempotent
        if (op.status === 'waiting_bod_approval') return op;
        if (op.status && op.status !== 'draft') throw new Error('Only draft opportunities can be submitted');
        // use the canonical 'waiting_bod_approval' status used elsewhere in the codebase
        return await opportunities.update(id, { status: 'waiting_bod_approval', approved_by: userId });
    },

    deleteOpportunity: async (id) => {
        if (!id) throw new Error('id required');
        return await opportunities.remove(id);
    },

    approveOpportunity: async (id, approverId) => {
        if (!id || !approverId) throw new Error('id and approverId required');

        // Load opportunity (model returns the row)
        const op = await opportunities.getById(id);
        if (!op) throw new Error('Opportunity not found');
        if (op.status && op.status !== 'waiting_bod_approval') throw new Error('Opportunity is not pending');

        // Ensure customer exists
        let customerId = op.customer_id;
        if (!customerId) {
            if (!op.customer_temp) throw new Error('No customer info');
            let temp = op.customer_temp;
            if (typeof temp === 'string') {
                try { temp = JSON.parse(temp); } catch (e) { /* use raw */ }
            }
            if (!temp || (!temp.name && !temp.email && !temp.phone)) throw new Error('customer_temp missing required fields');
            const cust = await customers.create(temp.name || null, temp.phone || null, temp.email || null, temp.company || null, temp.note || null);
            customerId = cust.id;
            await opportunities.update(id, { customer_id: customerId });
        }

        // Approve opportunity (model handles update)
        const approved = await opportunities.approve(id, approverId);
        if (!approved) throw new Error('Unable to approve opportunity');
        approved.customer_id = customerId;

        // Create contract and project via models (no manual client)
        let contract = await contracts.create(id, customerId, 0, approverId);
        const project = await projects.create({ contract_id: contract.id, name: `Project for Contract ${contract.id}`, description: op.description || null, start_date: null, status: 'planned', created_by: approverId });

        // Assign contract code idempotently using model helper
        if (typeof contracts.assignCodeIfMissing === 'function') {
            contract = await contracts.assignCodeIfMissing(contract.id, contract.created_at || new Date());
        }

        // Aggregate opportunity_service entries
        const oppServices = await opportunityServices.getByOpportunity(id);
        let aggregatedSalePrice = 0;
        let aggregatedBaseCost = 0;
        const svcAggMap = new Map();

        for (const s of oppServices) {
            // fetch service and optional service_job
            const svcRes = await db.query('SELECT id, name, base_cost FROM service WHERE id = $1', [s.service_id]);
            if (!svcRes.rows || svcRes.rows.length === 0) throw new Error(`service id ${s.service_id} not found`);
            const svc = svcRes.rows[0];

            let baseCostPerUnit = svc.base_cost != null ? Number(svc.base_cost) : 0;
            let serviceJob = null;
            if (s.service_job_id) {
                const sjRes = await db.query('SELECT id, service_id, base_cost, margin FROM service_job WHERE id = $1', [s.service_job_id]);
                if (!sjRes.rows || sjRes.rows.length === 0) throw new Error(`service_job id ${s.service_job_id} not found`);
                serviceJob = sjRes.rows[0];
                if (serviceJob.service_id != null && Number(serviceJob.service_id) !== Number(s.service_id)) throw new Error('service_job does not belong to the provided service');
                if (serviceJob.base_cost != null) baseCostPerUnit = Number(serviceJob.base_cost);
            }

            const quantity = s.quantity != null ? Number(s.quantity) : 1;
            const proposed = s.proposed_price != null ? Number(s.proposed_price) : null;

            let saleTotal;
            if (proposed != null) {
                // treat proposed_price as total for the line if present
                saleTotal = proposed;
            } else {
                let unit = baseCostPerUnit;
                if (serviceJob && serviceJob.margin != null && !Number.isNaN(Number(serviceJob.margin))) {
                    unit = Math.round(baseCostPerUnit * (1 + Number(serviceJob.margin) / 100) * 100) / 100;
                }
                saleTotal = unit * quantity;
            }
            const baseCostTotal = baseCostPerUnit * quantity;

            aggregatedSalePrice += saleTotal;
            aggregatedBaseCost += baseCostTotal;

            const key = String(s.service_id);
            const existing = svcAggMap.get(key) || { total_jobs: 0, total_sale_price: 0, total_cost: 0, progressSum: 0, progressCount: 0, service_name: svc.name };
            existing.total_jobs += quantity;
            existing.total_sale_price += saleTotal;
            existing.total_cost += baseCostTotal;
            if (s.progress_percent != null && !Number.isNaN(Number(s.progress_percent))) { existing.progressSum += Number(s.progress_percent); existing.progressCount += 1; }
            if (!existing.service_name) existing.service_name = svc.name;
            svcAggMap.set(key, existing);
        }

        // update contract totals
        await contracts.update(contract.id, { total_revenue: aggregatedSalePrice, total_cost: aggregatedBaseCost });
        // refresh contract
        try { contract = await contracts.getById(contract.id); } catch (e) { /* ignore */ }

        // upsert contract_service aggregates using model helper
        const aggregates = Array.from(svcAggMap.entries()).map(([serviceId, agg]) => ({
            contract_id: contract.id,
            service_id: Number(serviceId),
            service_name: agg.service_name,
            total_jobs: agg.total_jobs,
            total_sale_price: agg.total_sale_price,
            total_cost: agg.total_cost,
            avg_progress: agg.progressCount ? Math.round((agg.progressSum / agg.progressCount) * 100) / 100 : null,
            qty: agg.total_jobs,
            quantity: agg.total_jobs
        }));
        if (aggregates.length > 0 && typeof contracts.upsertContractServicesFromAggregates === 'function') {
            await contracts.upsertContractServicesFromAggregates(aggregates);
        }

        // create default debt
        let createdDebt = null;
        if (typeof contracts.createDefaultDebt === 'function') {
            createdDebt = await contracts.createDefaultDebt(contract.id, aggregatedSalePrice);
        }

        return { opportunity: approved, contract, project, debts: createdDebt ? [createdDebt] : [] };
    },
    rejectOpportunity: async (id, rejectorId) => {
        if (!id || !rejectorId) throw new Error('id and rejectorId required');
        return await opportunities.reject(id, rejectorId);
    },
    getOpportunitiesByCreator: async (createdBy) => {
        if (!createdBy) throw new Error('createdBy required');
        return await opportunities.getByCreator(createdBy);
    },

    getPendingOpportunities: async () => {
        return await opportunities.getPending();
    }
}

export default opportunityService;