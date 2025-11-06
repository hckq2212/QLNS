import opportunities from '../models/opportunities.js'
import db from '../config/db.js'
import opportunityServices from '../models/opportunityServices.js'
import cloudinary from '../config/cloudinary.js'



const opportunityService = {
    getAllOpportunities: async () => {
        return await opportunities.getAll();
    },
    getByStatus: async (status) =>{
        return await opportunities.getByStatus(status);
    },
    getOpportunityById: async (id) => {
        if (!id) throw new Error('id required');
        return await opportunities.getById(id);
    },

createOpportunity: async (payload, files = []) => {
    if (!payload) throw new Error('Thiếu thông tin để tạo cơ hội');

// normalize services coming from payload (works for JSON body or FormData where services is JSON string)
let services = payload.services;

// If services is present as a JSON string (FormData), parse it
if (typeof services === 'string') {
  try {
    services = JSON.parse(services);
  } catch (err) {
    throw new Error('Invalid services JSON');
  }
}

// Ensure services is an array
if (!Array.isArray(services) || services.length === 0) {
  throw new Error('Chưa chọn dịch vụ');
}

// Normalize each service object
services = services.map((s, i) => {
  const service_id = Number(s.service_id);
  // parseInt then ensure >=1, fallback to 1
  const q = Number.isFinite(Number(s.quantity)) ? parseInt(s.quantity, 10) : NaN;
  const quantity = Number.isInteger(q) && q > 0 ? q : 1;
  return {
    service_id,
    quantity,
    note: s.note || null,
    // keep other fields if you need them
  };
});

    try {
        // 1️ Tạo cơ hội 
        const opportunityCreateResult = await opportunities.create(payload);
        if (!opportunityCreateResult) {
            throw new Error("Không thể tạo cơ hội");
        }

        const opportunity_id = opportunityCreateResult.id;

        // 2️ Upload files to Cloudinary and prepare the JSON for storing in the database
        const attachments = [];
        for (const file of files) {
            if (file && file.buffer) {
                const uploadResult = await new Promise((resolve, reject) => {
                    cloudinary.uploader.upload_stream(
                        { 
                            folder: 'QLNS/attachments',
                            resource_type: 'auto', // Automatically detect file type
                            public_id: `opportunity_${opportunity_id}_${file.originalname.replace(/\s+/g, '_')}`,
                        },
                        (error, result) => {
                            if (error) reject(error);
                            resolve(result);
                        }
                    ).end(file.buffer);
                });

                // Add file info (name and URL) to the attachments array
                attachments.push({
                    name: file.originalname,
                    url: uploadResult.secure_url,
                    type: file.mimetype // File MIME type
                });
            }
        }

        // 3️ Save the JSON array in the opportunity table
        if (attachments.length) {
            await db.query(
                `UPDATE opportunity SET attachments = $1 WHERE id = $2`,
                [JSON.stringify(attachments), opportunity_id] // Convert the array to JSON string
            );
        }

        // 4️ Tạo các dòng opportunity_service kèm opportunity_id
        const oppServiceCreateResult = await opportunityServices.createMany(
            opportunity_id,
            services
        );

        return {
            opportunity: opportunityCreateResult,
            services: oppServiceCreateResult,
            attachments: attachments // Return the attachment details
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