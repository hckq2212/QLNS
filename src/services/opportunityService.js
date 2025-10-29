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
        if (!payload) throw new Error('Thiếu thông tin để tạo cơ hội');

        const services = payload.services;
        if (!services || !services.length) {
            throw new Error('Chưa chọn dịch vụ');
        }

        try {
            // 1️ Tạo cơ hội 
            const opportunityCreateResult = await opportunities.create(payload);
            if (!opportunityCreateResult) {
                throw new Error("Không thể tạo cơ hội");
            }

            const opportunity_id = opportunityCreateResult.id;

            // 2️ Tạo các dòng opportunity_service kèm opportunity_id
            const oppServiceCreateResult = await opportunityServices.createMany(
                opportunity_id,
                services
            );

            return {
                opportunity: opportunityCreateResult,
                services: oppServiceCreateResult
            };
        } catch (err) {
            console.error('Lỗi khi tạo cơ hội:', err);
            throw err;
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
        const result = opportunities.approve(id, approverId)
        return result;
    },
    rejectOpportunity: async (id, rejectorId) => {
        if (!id || !rejectorId) throw new Error('id and rejectorId required');
        return await opportunities.reject(id, rejectorId);
    },
    getOpportunitiesByCreator: async (createdBy) => {
        if (!createdBy) throw new Error('createdBy required');
        return await opportunities.getByCreator(createdBy);
    },
    getServices: async (opportunityId) => {
        if (!opportunityId) throw new Error('opportunityId is required');
        const rows = await opportunityServices.getOpportunityService(opportunityId);
        return Array.isArray(rows) ? rows : (rows && rows.rows) ? rows.rows : [];
    },

    getPendingOpportunities: async () => {
        return await opportunities.getPending();
    },
    quote: async (opportunityId, body, os) => {
    try {
        const osUpdated = [];

        for (const o of os) {
        const id = Number(o.opportunityService_id);
        if (!Number.isFinite(id)) continue; // id không hợp lệ thì bỏ qua

        // Chỉ lấy các field DB cho phép: proposed_price, quantity, note
        const fields = {};
        if (o.proposed_price != null) fields.proposed_price = Number(o.proposed_price);
        if (o.quantity != null)      fields.quantity = Number(o.quantity);
        if (o.note != null)          fields.note = String(o.note);

        // Không có field hợp lệ để update -> bỏ qua
        if (Object.keys(fields).length === 0) continue;

        const osRes = await opportunityServices.update(id, fields); // <- (id, fields)
        if (osRes) osUpdated.push(osRes); // update trả về RETURNING *; nếu null thì bỏ qua
        }

        const oRes = await opportunities.update(opportunityId, body);
        if (!oRes) throw new Error('Lỗi khi update cơ hội');

        return { osUpdated, oRes };
    } catch (err) {
        console.error('Lỗi khi thực hiện báo giá:', err);
        throw err;
    }
},


}

export default opportunityService;