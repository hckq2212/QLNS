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

            // ensure new opportunities created via the 'services' path receive the
            // expected status. When not provided by the caller, default to
            // 'waiting_bod_approval'.
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
            // Accept either legacy 'pending' or the canonical 'waiting_bod_approval'
            if (op.status && op.status !== 'waiting_bod_approval' && op.status !== 'pending') throw new Error('Opportunity is not pending');

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
                "UPDATE opportunity SET status = 'approved', approved_by = $1, updated_at = now() WHERE id = $2 AND status = 'waiting_bod_approval' RETURNING *",
                [approverId, id]
            );
            const approved = approveRes.rows[0];
            if (!approved) throw new Error('Opportunity not found or not pending');
            approved.customer_id = customerId;

            // Create contract linked to this opportunity and customer. We'll
            // populate jobs from opportunity_service afterwards so triggers
            // can recalculate totals.
            const contractRes = await client.query(
                "INSERT INTO contract (opportunity_id, customer_id, total_cost, created_by, status) VALUES ($1, $2, $3, $4, 'waiting_bod_approval') RETURNING *",
                [id, customerId, 0, approverId]
            );
            const contract = contractRes.rows[0];

            // Generate contract code immediately on approval and mark as waiting_hr_confirm
            try {
                // Use contract.created_at if present; otherwise now()
                const partDate = contract.created_at ? new Date(contract.created_at) : new Date();
                const yy = String(partDate.getUTCFullYear()).slice(-2);
                const mm = String(partDate.getUTCMonth() + 1).padStart(2, '0');
                // acquire an advisory lock for this year-month to serialize sequence generation
                // use numeric key = yy * 100 + mm (yy and mm are small integers)
                await client.query('SELECT pg_advisory_xact_lock(($1::int * 100) + $2::int)', [yy, mm]);
                // now safely compute max sequence without FOR UPDATE (we hold the advisory lock)
                const seqRes = await client.query('SELECT COALESCE(MAX(code_seq),0) as maxseq FROM contract WHERE code_year = $1 AND code_month = $2', [yy, mm]);
                const maxseq = seqRes && seqRes.rows && seqRes.rows[0] ? seqRes.rows[0].maxseq : 0;
                const nextSeq = Number(maxseq || 0) + 1;
                const seqStr = String(nextSeq).padStart(3, '0');
                const code = `SGMK-${yy}-${mm}-${seqStr}`;
                const updRes = await client.query('UPDATE contract SET code = $1, code_year = $2, code_month = $3, code_seq = $4, status = $5, updated_at = now() WHERE id = $6 RETURNING *', [code, yy, mm, nextSeq, 'waiting_hr_confirm', contract.id]);
                // replace contract with updated row
                if (updRes.rows && updRes.rows.length > 0) {
                    contract.code = updRes.rows[0].code;
                    contract.code_year = updRes.rows[0].code_year;
                    contract.code_month = updRes.rows[0].code_month;
                    contract.code_seq = updRes.rows[0].code_seq;
                    contract.status = updRes.rows[0].status;
                }
            } catch (codeErr) {
                // DB errors here (e.g. invalid enum value, constraint violation) will
                // abort the current transaction. Don't swallow them silently — rethrow
                // so the outer catch can rollback and avoid subsequent "current
                // transaction is aborted" errors.
                console.error('Failed to auto-generate contract code during approval:', codeErr);
                throw codeErr;
            }

            // Create a project linked to this contract so HR/PM can manage jobs
            const projectName = `Project for Contract ${contract.id}`;
            const projectDesc = op.description || null;
            const projectRes = await client.query(
                'INSERT INTO project (contract_id, name, description, start_date, status, created_by, created_at) VALUES ($1, $2, $3, $4, $5, $6, now()) RETURNING *',
                [contract.id, projectName, projectDesc, null, 'planned', approverId]
            );
            const project = projectRes.rows[0];

            // Immediately assign a contract code and set status to waiting_hr_confirm
            // Use the same transactional client to avoid nested transactions.
            try {
                const createdRes = await client.query('SELECT created_at FROM contract WHERE id = $1 FOR UPDATE', [contract.id]);
                let partDate = null;
                if (createdRes.rows && createdRes.rows.length > 0 && createdRes.rows[0].created_at) {
                    partDate = new Date(createdRes.rows[0].created_at);
                } else {
                    partDate = new Date();
                }
                const yy = String(partDate.getUTCFullYear()).slice(-2);
                const mm = String(partDate.getUTCMonth() + 1).padStart(2, '0');

                // acquire advisory lock to serialize code_seq generation for this month
                await client.query('SELECT pg_advisory_xact_lock(($1::int * 100) + $2::int)', [yy, mm]);
                const seqRes = await client.query('SELECT COALESCE(MAX(code_seq),0) as maxseq FROM contract WHERE code_year = $1 AND code_month = $2', [yy, mm]);
                const maxseq = seqRes && seqRes.rows && seqRes.rows[0] ? seqRes.rows[0].maxseq : 0;
                const nextSeq = Number(maxseq || 0) + 1;
                const seqStr = String(nextSeq).padStart(3, '0');
                const code = `SGMK-${yy}-${mm}-${seqStr}`;

                const codeUpd = await client.query('UPDATE contract SET code = $1, code_year = $2, code_month = $3, code_seq = $4, status = $5, updated_at = now() WHERE id = $6 RETURNING *', [code, yy, mm, nextSeq, 'waiting_hr_confirm', contract.id]);
                if (codeUpd.rows && codeUpd.rows.length > 0) {
                    // replace contract reference with updated row
                    contract.code = codeUpd.rows[0].code;
                    contract.code_year = codeUpd.rows[0].code_year;
                    contract.code_month = codeUpd.rows[0].code_month;
                    contract.code_seq = codeUpd.rows[0].code_seq;
                    contract.status = codeUpd.rows[0].status;
                }
            } catch (codeErr) {
                // As above: do not swallow DB errors which put the transaction into
                // an aborted state. Rethrow so the outer transaction handling can
                // rollback cleanly.
                console.error('Failed to assign contract code during approval:', codeErr);
                throw codeErr;
            }

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

                // Do NOT auto-create job rows here. Creating jobs before the
                // project lead acknowledges can trigger DB-level guards or
                // workflows that require lead ack. Instead compute aggregated
                // totals from opportunity_service and let HR/PM create jobs
                // explicitly after team selection and lead ack.
                // jobName and jobDesc preserved for potential future use.
                const jobName = (serviceJob && serviceJob.name) || svc.name || `Service ${s.service_id}`;
                const jobDesc = op.description || null;
            }

            // Update contract totals computed from opportunity_service aggregation
            const totalRevenue = aggregatedSalePrice;
            const totalCost = aggregatedBaseCost;
            await client.query('UPDATE contract SET total_revenue = $1, total_cost = $2, updated_at = now() WHERE id = $3', [totalRevenue, totalCost, contract.id]);
            // re-fetch contract to return accurate totals
            const refreshedContractRes = await client.query('SELECT * FROM contract WHERE id = $1', [contract.id]);
            const refreshedContract = refreshedContractRes.rows[0] || contract;
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