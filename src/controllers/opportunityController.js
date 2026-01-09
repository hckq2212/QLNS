import { json } from 'express';
import opportunityService from '../services/opportunityService.js';


const opportunityController = {
    getAllOpportunities: async (req, res) => {
        try {
            const result = await opportunityService.getAllOpportunities();
            return res.json(result);
        } catch (err) {
            console.error('getAllOpportunities error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getByStatus: async (req, res) => {
        const status = req.params.status || req.query.status
        try {
            const result = await opportunityService.getByStatus(status);
            return res.json(result);
        } catch (err) {
            console.error('getAllOpportunities error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    getById: async (req, res) => {
        try {
            const id = req.params.id;
            const op = await opportunityService.getOpportunityById(id);
            if (!op) return res.status(404).json({ error: 'Opportunity not found' });
            return res.json(op);
        } catch (err) {
            console.error('getById error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

create: async (req, res) => {
    try {
        const payload = req.body || {};
        if (req.user && req.user.id) payload.created_by = req.user.id;

        console.log(payload)
        if (req.files && req.files.length > 0) {
            // If files are uploaded, process them
            const created = await opportunityService.createOpportunity(payload, req.files);
            return res.status(201).json(created);
        } else {
            // Handle the case when no files are uploaded
            const created = await opportunityService.createOpportunity(payload);
            return res.status(201).json(created);
        }
    } catch (err) {
        console.error('create error:', err);
        return res.status(400).json({ error: err.message || 'Bad request' });
    }
},


    update: async (req, res) => {
        try {
            const id = req.params.id;
            const fields = req.body || {};
            const updated = await opportunityService.updateOpportunity(id, fields);
            if (!updated) return res.status(404).json({ error: 'Không thấy cơ hội hoặc không có thông tin để cập nhật' });
            return res.json(updated);
        } catch (err) {
            console.error('update error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    remove: async (req, res) => {
        try {
            const id = req.params.id;
            const deleted = await opportunityService.deleteOpportunity(id);
            if (!deleted) return res.status(404).json({ error: 'Opportunity not found' });
            return res.json({ message: 'Deleted', item: deleted });
        } catch (err) {
            console.error('remove error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    approve: async (req, res) => {
        try {
            const id = req.params.id;
            console.log(id)
            const approverId =  req.user.id;
            if (!approverId) return res.status(401).json({ error: 'Unauthorized' });
            const result = await opportunityService.approveOpportunity(id, approverId);
            return res.json(result);
        } catch (err) {
            console.error('Lỗi khi duyệt cơ hội:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },
    reject: async (req, res) => {
        try {
            const id = req.params.id;
            const rejectorId = req.user && req.user.id;
            if (!rejectorId) return res.status(401).json({ error: 'Unauthorized' });
            const rejected = await opportunityService.rejectOpportunity(id, rejectorId);
            if (!rejected) {
                return res.status(404).json({ error: 'Opportunity not found or already approved/rejected' });
            }
            return res.json(rejected);
        } catch (err) {
            console.error('reject error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    submit: async (req, res) => {
        try {
            const id = req.params.id;
            const user = req.user || {};
            if (!user.id) return res.status(401).json({ error: 'Unauthorized' });
            // Only creator or sale role should submit; role middleware can handle specific checks upstream
            const updated = await opportunityService.submitToBod(id, user.id);
            return res.json(updated);
        } catch (err) {
            console.error('submit error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    getByCreator: async (req, res) => {
        try {
            const creatorId = req.params.userId || (req.user && req.user.id);
            if (!creatorId) return res.status(400).json({ error: 'creatorId required' });
            const list = await opportunityService.getOpportunitiesByCreator(creatorId);
            return res.json(list);
        } catch (err) {
            console.error('getByCreator error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getService: async (req, res) => {
        const opportunityId = req.params.id || req.params.opportunityId;
        if (!opportunityId) return res.status(400).json({ error: 'Missing opportunity id' });

        try {
            const result = await opportunityService.getServices(opportunityId);
            // normalize to array
            const services = Array.isArray(result) ? result : (result && result.rows) ? result.rows : [];
            return res.status(200).json(services);
        } catch (err) {
            console.error('getService error:', err);
            return res.status(500).json({ error: err.message || 'Internal server error' });
        }
    },
quote: async (req, res) => {
  try {
    const opportunityId = req.params.id;
    if (!opportunityId) {
      return res.status(400).json({ error: "Missing opportunity id" });
    }

    // Xử lý các dạng body có thể có
    let os = [];
    if (Array.isArray(req.body)) {
      os = req.body; // body là mảng service
    } else if (Array.isArray(req.body.services)) {
      os = req.body.services; // body có field services là mảng
    } else if (req.body.opportunityService_id && req.body.proposed_price !== undefined) {
      os = [req.body]; // body là 1 object đơn
    }

    if (!os.length) {
      return res.status(400).json({ error: "Missing opportunity services to quote" });
    }

    const body = {
      expected_price: req.body.expected_price,
      status: "quoted",
    };

    const result = await opportunityService.quote(opportunityId, body, os);
    return res.json(result);
  } catch (err) {
    console.error("Lỗi khi báo giá:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
},
getMyOpportunities: async (req, res) =>{
    try{
        const id = req.user.id;
        if(!id) return res.status(404).send('Thiếu id người gửi')
        const result = await opportunityService.getOpportunitiesByCreator(id)
        return res.json(result)
    }catch(err){
        console.error(err)
    }
},

// Add service to opportunity
addService: async (req, res) => {
    try {
        const opportunityId = req.params.id;
        const { service_id, quantity, note } = req.body;
        
        if (!service_id) {
            return res.status(400).json({ error: 'service_id is required' });
        }
        
        const result = await opportunityService.addService(opportunityId, {
            service_id,
            quantity: quantity || 1,
            note: note || null
        });
        
        return res.status(201).json(result);
    } catch (err) {
        console.error('addService error:', err);
        return res.status(400).json({ error: err.message || 'Bad request' });
    }
},

// Update service in opportunity
updateService: async (req, res) => {
    try {
        const { id: opportunityId, serviceId } = req.params;
        const fields = req.body;
        
        const result = await opportunityService.updateService(opportunityId, serviceId, fields);
        
        if (!result) {
            return res.status(404).json({ error: 'Service not found or no changes made' });
        }
        
        return res.json(result);
    } catch (err) {
        console.error('updateService error:', err);
        return res.status(400).json({ error: err.message || 'Bad request' });
    }
},

// Delete service from opportunity
deleteService: async (req, res) => {
    try {
        const { id: opportunityId, serviceId } = req.params;
        
        const result = await opportunityService.deleteService(opportunityId, serviceId);
        
        if (!result) {
            return res.status(404).json({ error: 'Service not found' });
        }
        
        return res.json({ message: 'Service deleted successfully', item: result });
    } catch (err) {
        console.error('deleteService error:', err);
        return res.status(400).json({ error: err.message || 'Bad request' });
    }
}


};

export default opportunityController;