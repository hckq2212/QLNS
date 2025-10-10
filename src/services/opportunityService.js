import opportunities from '../models/opportunities.js'
import db from '../config/db.js'
import opportunityServices from '../models/opportunityServices.js'


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
            // ensure we create with default 'draft' status unless caller provided one
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

            const createdOppRes = await client.query(
                `INSERT INTO opportunity (customer_id, customer_temp, expected_price, description, created_by)
                 VALUES ($1, $2, $3, $4, $5) RETURNING *`,
                [payload.customer_id || null, payload.customer_temp || null, expectedToInsert, payload.description || null, payload.created_by || null]
            );
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
        if (op.status && op.status !== 'draft') throw new Error('Only draft opportunities can be submitted');
        return await opportunities.update(id, { status: 'waiting_bod_review', approved_by: userId });
    },

    deleteOpportunity: async (id) => {
        if (!id) throw new Error('id required');
        return await opportunities.remove(id);
    },

    approveOpportunity: async (id, approverId, paymentPlan = null) => {
        if (!id || !approverId) throw new Error('id and approverId required');

        // Use a DB transaction to ensure atomicity: create customer (if needed),
        // update opportunity, approve, create contract and debt as one unit.
        const client = await db.connect();
        try {
            await client.query('BEGIN');

            // Load and lock opportunity row to avoid concurrent approvals
            const opRes = await client.query('SELECT * FROM opportunity WHERE id = $1 FOR UPDATE', [id]);
            const op = opRes.rows[0];
            if (!op) throw new Error('Opportunity not found');
            if (op.status && op.status !== 'pending') throw new Error('Opportunity is not pending');

            // create customer if missing
            let customerId = op.customer_id;
            if (!customerId) {
                if (!op.customer_temp) throw new Error('No customer info to create customer');
                // minimal validation: ensure name exists
                let temp = op.customer_temp;
                if (temp && typeof temp === 'string') {
                    try {
                        temp = JSON.parse(temp);
                    } catch (parseErr) {
                        console.warn('Failed to parse customer_temp JSON, using raw value');
                    }
                }
                if (!temp || (!temp.name && !temp.email && !temp.phone)) {
                    throw new Error('customer_temp missing required fields');
                }
                const custRes = await client.query(
                    'INSERT INTO customer(name, phone, email, company, note) VALUES($1,$2,$3,$4,$5) RETURNING *',
                    [temp.name || null, temp.phone || null, temp.email || null, temp.company || null, temp.note || null]
                );
                customerId = custRes.rows[0].id;
                // update opportunity.customer_id
                await client.query('UPDATE opportunity SET customer_id = $1, updated_at = now() WHERE id = $2', [customerId, id]);
            }

            // Approve opportunity (only if still pending)
            const approveRes = await client.query(
                "UPDATE opportunity SET status = 'approved', approved_by = $1, updated_at = now() WHERE id = $2 AND status = 'pending' RETURNING *",
                [approverId, id]
            );
            const approved = approveRes.rows[0];
            if (!approved) throw new Error('Opportunity not found or not pending');
            approved.customer_id = customerId;

            // Create contract linked to this opportunity and customer. We'll
            // populate jobs from opportunity_service afterwards so triggers
            // can recalculate totals.
            const contractRes = await client.query(
                "INSERT INTO contract (opportunity_id, customer_id, total_cost, created_by, status) VALUES ($1, $2, $3, $4, 'pending') RETURNING *",
                [id, customerId, 0, approverId]
            );
            const contract = contractRes.rows[0];

            // Create a project linked to this contract so HR/PM can manage jobs
            const projectName = `Project for Contract ${contract.id}`;
            const projectDesc = op.description || null;
            const projectRes = await client.query(
                'INSERT INTO project (contract_id, name, description, start_date, status, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING *',
                [contract.id, projectName, projectDesc, null, 'planned', approverId]
            );
            const project = projectRes.rows[0];

            // Lock opportunity_service rows for this opportunity to avoid concurrent edits, then fetch
            const oppServicesLockRes = await client.query('SELECT * FROM opportunity_service WHERE opportunity_id = $1 FOR UPDATE', [id]);
            const oppServices = oppServicesLockRes.rows || [];

            let aggregatedSalePrice = 0;
            let aggregatedBaseCost = 0;


            for (const s of oppServices) {
                // get service defaults
                // fetch service and optional service_job if provided in opportunity_service
               const svcRes = await client.query(
                    'SELECT name, base_cost, min_price, max_price FROM service WHERE id = $1',
                    [s.service_id]
                );
                if (!svcRes.rows || svcRes.rows.length === 0) {
                    throw new Error(`service id ${s.service_id} not found when creating jobs`);
                }
                const svc = svcRes.rows[0];

                const quantityRaw = s.quantity != null ? Number(s.quantity) : 1;
                const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? quantityRaw : 1;
                const proposed = s.proposed_price != null ? Number(s.proposed_price) : null;

                // if opportunity_service has service_job_id, try to load it
                let serviceJobId = null;
                let serviceJob = null;
                if (s.service_job_id) {
                    const sjRes = await client.query(
                        'SELECT id, service_id, name, base_cost, min_price, max_price, margin FROM service_job WHERE id = $1',
                        [s.service_job_id]
                    );
                    if (!sjRes.rows || sjRes.rows.length === 0) {
                        throw new Error(`service_job id ${s.service_job_id} not found when creating jobs`);
                    }
                    serviceJob = sjRes.rows[0];
                    if (serviceJob.service_id != null && Number(serviceJob.service_id) !== Number(s.service_id)) {
                        throw new Error('service_job does not belong to the provided service');
                    }
                    serviceJobId = serviceJob.id;
                }

                const baseCostPerUnit = serviceJob && serviceJob.base_cost != null
                    ? Number(serviceJob.base_cost)
                    : (svc.base_cost != null ? Number(svc.base_cost) : 0);

                const minPricePerUnit = serviceJob && serviceJob.min_price != null
                    ? Number(serviceJob.min_price)
                    : (svc.min_price != null ? Number(svc.min_price) : null);
                const maxPricePerUnit = serviceJob && serviceJob.max_price != null
                    ? Number(serviceJob.max_price)
                    : (svc.max_price != null ? Number(svc.max_price) : null);

                let salePricePerUnit;
                if (proposed != null) {
                    if (minPricePerUnit != null && proposed < minPricePerUnit) {
                        throw new Error('Proposed price is lower than allowed minimum');
                    }
                    if (maxPricePerUnit != null && proposed > maxPricePerUnit) {
                        throw new Error('Proposed price exceeds allowed maximum');
                    }
                    salePricePerUnit = Number(proposed);
                } else {
                    // No proposed price: default to base cost per unit. If the service_job defines a margin, apply it.
                    const base = Number(baseCostPerUnit || 0);
                    if (!Number.isFinite(base)) {
                        throw new Error('Invalid base cost calculated for job');
                    }
                    if (serviceJob && serviceJob.margin != null && !Number.isNaN(Number(serviceJob.margin))) {
                        const marg = Number(serviceJob.margin);
                        salePricePerUnit = Math.round(base * (1 + marg / 100) * 100) / 100; // round to 2 decimals
                    } else {
                        salePricePerUnit = base;
                    }
                }

                // aggregate by quantity: compute sale_price and base_cost
                const salePrice = Number(salePricePerUnit) * quantity;
                const baseCost = Number(baseCostPerUnit) * quantity;
                if (!Number.isFinite(baseCost) || baseCost < 0) {
                    throw new Error('Invalid base cost calculated for job');
                }
                if (!Number.isFinite(salePrice) || salePrice < 0) {
                    throw new Error('Invalid sale price calculated for job');
                }
                aggregatedSalePrice += salePrice;
                aggregatedBaseCost += baseCost;

                const jobName = (serviceJob && serviceJob.name) || svc.name || `Service ${s.service_id}`;
                const jobDesc = op.description || null;

                // assigned to approver by default (assigned_type 'user') — use approverId as temporary assignee
                await client.query(
                    `INSERT INTO job (contract_id, service_id, service_job_id, project_id, name, description, base_cost, external_cost, sale_price, status, progress_percent, assigned_type, assigned_id, created_by, created_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, $8, 'pending', 0, 'user', $9, $9, now()) RETURNING *`,
                    [
                        contract.id,
                        s.service_id,
                        serviceJobId,
                        project.id,
                        jobName,
                        jobDesc,
                        baseCost,
                        salePrice,
                        approverId
                    ]
                );
            }

            // After inserting jobs, the DB trigger (trg_job_sync_contract) will
            // have updated contract.total_cost and contract.total_revenue. Re-fetch
            // the contract to get the updated totals.
            const refreshedContractRes = await client.query('SELECT * FROM contract WHERE id = $1', [contract.id]);
            const refreshedContract = refreshedContractRes.rows[0] || contract;

            // Create debt(s) for this contract.
            const contractRevenue = refreshedContract.total_revenue != null ? Number(refreshedContract.total_revenue) : null;
            const contractCost = refreshedContract.total_cost != null ? Number(refreshedContract.total_cost) : null;

            const revenueDiffers = contractRevenue == null || Number.isNaN(contractRevenue) || Math.abs(contractRevenue - aggregatedSalePrice) > 0.01;
            const costDiffers = contractCost == null || Number.isNaN(contractCost) || Math.abs(contractCost - aggregatedBaseCost) > 0.01;

            if (revenueDiffers || costDiffers) {
                await client.query('UPDATE contract SET total_revenue = $1, total_cost = $2, updated_at = now() WHERE id = $3', [aggregatedSalePrice, aggregatedBaseCost, contract.id]);
                refreshedContract.total_revenue = aggregatedSalePrice;
                refreshedContract.total_cost = aggregatedBaseCost;
            }

            const totalRevenue = refreshedContract.total_revenue != null ? Number(refreshedContract.total_revenue) : aggregatedSalePrice;
            let createdDebts = [];

            if (paymentPlan && Array.isArray(paymentPlan.debts) && paymentPlan.debts.length > 0) {
                // use explicit debts array: [{ amount, due_date }, ...]
                let sum = 0;
                for (const d of paymentPlan.debts) {
                    const amt = Number(d.amount || 0);
                    if (!Number.isFinite(amt) || amt < 0) {
                        throw new Error('Debt amount must be a non-negative number');
                    }
                    sum += amt;
                }
                if (totalRevenue > 0 && Math.abs(sum - totalRevenue) > 0.01) {
                    throw new Error('Tổng các đợt thanh toán phải bằng tổng doanh thu hợp đồng');
                }
                for (const d of paymentPlan.debts) {
                    const amt = Number(d.amount || 0);
                    const due = d.due_date || d.dueDate || null;
                    const r = await client.query(
                        'INSERT INTO debt (contract_id, amount, due_date, status) VALUES ($1, $2, $3, $4) RETURNING id, contract_id, amount, due_date, status',
                        [contract.id, amt, due, 'pending']
                    );
                     createdDebts.push(r.rows[0]);
                }
            } else if (paymentPlan && Number.isInteger(paymentPlan.installments) && paymentPlan.installments > 1) {
                // split into equal installments (last installment gets remainder)
                const n = paymentPlan.installments;
                const base = Math.floor((totalRevenue / n) * 100) / 100; // two decimals
                let accumulated = 0;
                for (let i = 0; i < n; i++) {
                    let amt = base;
                    if (i === n - 1) {
                        amt = Math.round((totalRevenue - accumulated) * 100) / 100;
                    }
                    accumulated += amt;
                    const due = null; // allow client to update due_date later or send via paymentPlan.debts
                    const r = await client.query(
                        'INSERT INTO debt (contract_id, amount, due_date, status) VALUES ($1, $2, $3, $4) RETURNING id, contract_id, amount, due_date, status',
                        [contract.id, amt, due, 'pending']
                    );
                    createdDebts.push(r.rows[0]);
                }
            } else {
                // default: single debt with entire amount
                const debtAmount = totalRevenue;
                const r = await client.query(
                    'INSERT INTO debt (contract_id, amount, due_date, status) VALUES ($1, $2, $3, $4) RETURNING id, contract_id, amount, due_date, status',
                    [contract.id, debtAmount, null, 'pending']
                );
                createdDebts.push(r.rows[0]);
            }

            // Notify HR/PM (users with role 'hr' or 'staff') to assign jobs
            try {
                // role is now stored in separate table; join to resolve users with role names
                const notifyUsersRes = await client.query("SELECT u.id FROM \"user\" u JOIN \"role\" r ON r.id = u.role_id WHERE r.name IN ('hr','staff')");
                const notifyUsers = notifyUsersRes.rows || [];
                const title = 'Cần phân công job';
                const payload = JSON.stringify({ contractId: contract.id, projectId: project.id, opportunityId: id });
                for (const u of notifyUsers) {
                    await client.query('INSERT INTO notification (user_id, title, type, payload, is_read, created_at) VALUES ($1,$2,$3,$4,false, now())', [u.id, title, 'assignment_request', payload]);
                }
            } catch (nerr) {
                // non-fatal: log and continue; notification failure shouldn't roll back the whole approval
                console.error('Failed to create notifications for HR/PM:', nerr);
            }

            await client.query('COMMIT');

            return { opportunity: approved, contract: refreshedContract, project, debts: createdDebts };
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
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