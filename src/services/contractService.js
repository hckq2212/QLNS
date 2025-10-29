import contracts  from "../models/contracts.js";
import customers from "../models/customers.js";
import db from "../config/db.js";
import opportunities from "../models/opportunities.js";
import projects from "../models/projects.js";

const contractService = {
    getAll: async () => {
        const result = await contracts.getAllContracts();
        return result;
    },
    getAllPending: async () =>{
        const result = await contracts.getAllPendingContracts();
        return result;
    },
    getById: async (contractId) => {
        const result = await contracts.getById(contractId);
        return result;
    },
    getServices: async(contractId) => {
        if (!contractId) throw new Error('contractId is required');
        const rows = await contracts.getServices(contractId);
        return rows
    },
    update: async(id, payload) => {
        const result = await contracts.update(id, payload);
        return result;
    },
    createFromOpportunity: async (opportunityId, customerId, totalCost, totalRevenue, customerTemp, creatorId ) => {
        try {
            // ensure customer id (handle different return shapes from customers.create)
            let cid = customerId;
            if (!cid) {
                const createdCustomer = await customers.create(customerTemp);
                cid = createdCustomer && (
                    createdCustomer.id ||
                    (createdCustomer.rows && createdCustomer.rows[0] && createdCustomer.rows[0].id) ||
                    (Array.isArray(createdCustomer) && createdCustomer[0] && createdCustomer[0].id)
                );
            }

            // compute totals from opportunity_service (existing logic)
            let computedTotalRevenue = 0;
            let computedTotalCost = 0;
            try {
                const rowsRes = await db.query(
                    `SELECT os.quantity, os.proposed_price,
                            s.base_cost AS service_base_cost,
                            sj.base_cost AS sj_base_cost
                     FROM opportunity_service os
                     LEFT JOIN service s ON s.id = os.service_id
                     LEFT JOIN service_job sj ON sj.id = os.service_job_id
                     WHERE os.opportunity_id = $1`,
                    [opportunityId]
                );
                const rows = (rowsRes && rowsRes.rows) ? rowsRes.rows : (Array.isArray(rowsRes) ? rowsRes : []);
                for (const r of rows) {
                    const qty = r.quantity != null ? Number(r.quantity) : 1;
                    const proposed = r.proposed_price != null ? Number(r.proposed_price) : 0;
                    computedTotalRevenue += proposed * qty;
                    const baseUnit = (r.sj_base_cost != null ? Number(r.sj_base_cost) : (r.service_base_cost != null ? Number(r.service_base_cost) : 0));
                    computedTotalCost += baseUnit * qty;
                }
            } catch (e) {
                console.warn('Failed to compute totals from opportunity_service, falling back to provided totals:', e);
            }

            const finalTotalRevenue = Number.isFinite(computedTotalRevenue) && computedTotalRevenue > 0 ? computedTotalRevenue : (Number(totalRevenue) || 0);
            const finalTotalCost = Number.isFinite(computedTotalCost) && computedTotalCost > 0 ? computedTotalCost : (Number(totalCost) || 0);

            // update opportunity status
            const opStatus = "contract_created";
            const opStatusRes = await opportunities.update(opportunityId, { status: opStatus });
            if (!opStatusRes) throw new Error("Không thể cập nhật trạng thái cơ hội");

            // create contract (contracts.create should return row or {rows})
            const created = await contracts.create(opportunityId, cid, finalTotalCost, finalTotalRevenue, creatorId);
            const createdRow = created && (created.rows ? created.rows[0] : (Array.isArray(created) ? created[0] : created));
            if (!createdRow) {
                console.error('contracts.create returned unexpected value:', created);
                throw new Error('Failed to create contract (unexpected model return)');
            }

            // create contract_service entries copied from opportunity_service
            try {
                const client = await db.connect();
                try {
                    await client.query('BEGIN');

                    const osRes = await client.query(
                        `SELECT os.service_id, os.service_job_id, os.quantity, os.proposed_price,
                                s.base_cost AS service_base_cost,
                                sj.base_cost AS sj_base_cost
                         FROM opportunity_service os
                         LEFT JOIN service s ON s.id = os.service_id
                         LEFT JOIN service_job sj ON sj.id = os.service_job_id
                         WHERE os.opportunity_id = $1`,
                        [opportunityId]
                    );

                    const osRows = (osRes && osRes.rows) ? osRes.rows : [];
                    for (const r of osRows) {
                        const qty = r.quantity != null ? Number(r.quantity) : 1;
                        const salePrice = r.proposed_price != null ? Number(r.proposed_price) : 0;
                        const baseUnit = (r.sj_base_cost != null ? Number(r.sj_base_cost) : (r.service_base_cost != null ? Number(r.service_base_cost) : 0));
                        const costPrice = baseUnit;

                        await client.query(
                            `INSERT INTO contract_service
                             (contract_id, service_id, service_job_id, qty, sale_price, cost_price, created_at, updated_at)
                             VALUES ($1,$2,$3,$4,$5,$6, now(), now())`,
                            [createdRow.id, r.service_id || null, r.service_job_id || null, qty, salePrice, costPrice]
                        );
                    }

                    await client.query('COMMIT');
                } catch (e) {
                    try { await client.query('ROLLBACK'); } catch (_) {}
                    console.error('Failed to create contract_service rows, rolling back:', e);
                    throw e;
                } finally {
                    client.release();
                }
            } catch (e) {
                // non-fatal for contract creation, but surface error
                console.error('Error while inserting contract_service rows:', e && (e.stack || e.message) || e);
                throw e;
            }

            // assign code atomically if model helper exists (preferred)
            if (typeof contracts.assignCodeIfMissing === 'function') {
                // pass created_at if available so model can derive year/month
                const ts = createdRow.created_at || new Date();
                const updated = await contracts.assignCodeIfMissing(createdRow.id, ts);
                return updated || createdRow;
            }

            // fallback: if no assign helper, return created row (you may call contracts.update(...) to set code fields)
            return createdRow;
        } catch (err) {
            console.error('contractService.create error:', err && err.stack ? err.stack : err);
            throw err;
        }
    },
    updateStatus: async (id, status, approverId = null) => {
        // call model with normalized arg order (id, status, approverId)
        const updated = await contracts.updateStatus(id, status, approverId);
        return updated;
    },
    approveByBOD: async (id, status, approverId) => {
        try{
            const updateStatus = await contracts.updateStatus(id, status, approverId)
            const contract = await contracts.getById(id);
            const project = await projects.create({
                contract_id: contract.id,
                name: `Dự án cho hợp đồng ${contract.code}` ,
                description: contract.description || null,
                created_by: approverId
            });

            if(!project){
                console.error("Tạo project fail")
            }
            return {
                success:"true", message:"Duyệt thành công"
            }
        }catch(err){
            console.error("Lỗi",err)
        }
    },

    uploadProposalContract: async (proposalContractURL, id) => {
        const result = await contracts.uploadProposalContract(proposalContractURL, id);
        if (!result) return null;

        const status = 'waiting_bod_approval';
        try {
            // update contract status using normalized model method
            const statusRes = await contracts.updateStatus(id, status, null);
            return statusRes || result;
        } catch (err) {
            console.error('Lỗi khi thay đổi trạng thái cho hợp đồng', err && (err.stack || err.message) || err);
            return result;
        }
    },
    signContract: async (signedFileUrl, id) => {
        const result = await contracts.signContract(signedFileUrl, id);
        if (!result) return null;

        const status = 'deployed';
    try {
            // update contract status
            const statusRes = await contracts.updateStatus(id, status, null);

            // update related project (if any)
            let projectRes = null;
            if (typeof projects.getByContract === 'function') {
                const proj = await projects.getByContract(id);
                if (proj && proj.id && typeof projects.update === 'function') {
                    projectRes = await projects.update(proj.id, { status: 'not_assigned' });
                }
            } else {
                console.warn('projects.getByContract not implemented - skipping project status update');
            }

            return { contract: statusRes || result, project: projectRes };
        } catch (err) {
            console.error('Lỗi khi thay đổi trạng thái cho hợp đồng hoặc dự án', err && (err.stack || err.message) || err);
            return result;
        }
    },

    setContractNumberAndStatus: async (id, manualCode, actorId = null) => {
        // write the given code into contract.code and set status to waiting_hr_confirm
        // do a simple update: extract year/month and seq if the code follows SGMK-YY-MM-XXX format, otherwise store code as-is
        const parsed = String(manualCode).match(/SGMK-(\d{2})-(\d{2})-(\d{3})/);
        let fields = { status: 'waiting_hr_confirm' };
        if (parsed) {
            fields.code = manualCode;
            fields.code_year = parsed[1];
            fields.code_month = parsed[2];
            fields.code_seq = Number(parsed[3]);
        } else {
            fields.code = manualCode;
        }
        const updated = await contracts.update(id, fields);
        return updated;
    },

    getByStatus: async (status) => {
        const result = await contracts.getByStatus(status);
        return result
    }
   
}

export default contractService;