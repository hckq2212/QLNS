import contractService from "../services/contractService.js";
import cloudinary from "../config/cloudinary.js";

const contractController = {
    getAll: async (req, res) => {
        try {
            const result = await contractService.getAll();
            return res.json(result);
        }catch(err){
            console.error('getAll contracts error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getAllPending: async (req, res) => {
        try {
            const result = await contractService.getAllPending();
            return res.json(result);
        }catch(err){
            console.error('getAllPending contracts error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById: async (req, res) => {
        const contractId =  req.params.id;

        try{   
            const result = await contractService.getById(contractId);
            if (!result) return res.status(404).json({ error: 'Contract not found' });
            return res.json(result);
        }catch(err){
            console.error('getById contract error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    createFromOpportunity: async (req, res) => {
        if (!req.user?.id) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const creatorId = req.user.id;
        const opportunityId = req.params?.opportunityId;

        // destructuring an toàn: nếu req.body undefined -> dùng {}
        const {
            customerId = null,
            totalCost,
            totalRevenue,
            customer_temp: customerTemp,
        } = req.body ?? {};

        const body = { totalCost, totalRevenue, customerTemp };

        try {
            const result = await contractService.createFromOpportunity(
            opportunityId,
            customerId,
            body.totalCost,
            body.totalRevenue,
            body.customerTemp,
            creatorId
            );
            return res.status(201).json(result);
        } catch (err) {
            console.error('create contract error:', err);
            return res.status(400).json({ error: err.message || 'Bad request' });
        }
    },

    approveByBod: async (req, res) => {
        const approverId = req.user.id;
        const id = req.params.id;
        const status = "bod_approved"
        try{
            const result = await contractService.updateStatus(status, approverId, id)
            if(result){
                return res.status(200).send("Đã duyệt")
            }
        }catch(err){
            console.error(err)
        }
    },

uploadProposalContract: async (req, res) => {
  const id = req.params.id;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name: proposalContract)' });

  console.log('uploadProposalContract - req.file:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });

  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (!allowed.includes(req.file.mimetype || '')) {
    return res.status(400).json({ error: 'Only PDF/DOC/DOCX allowed', mime: req.file.mimetype });
  }

  try {
    const streamUpload = (buffer, opts = {}) => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(opts, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
      stream.end(buffer);
    });

    const orig = req.file.originalname || 'file';
    const ext = (orig.split('.').pop() || '').toLowerCase(); // 'pdf' | 'doc' | 'docx'
    const base = orig.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-]/g, '_');

    const folder = 'QLNS/contracts'; // nên ascii để URL gọn, tránh ký tự có dấu
    const publicId = `${folder}/${base}.${ext}`; // <-- CÓ ĐUÔI

    const uploadOpts = {
      resource_type: 'auto',       // auto ok, có đuôi thì Cloudinary nhận đúng
      public_id: publicId,         // giữ nguyên tên mình đặt
      use_filename: false,
      unique_filename: false,
      overwrite: false,
      context: `original_filename=${orig}`
    };

    const uploadResult = await streamUpload(req.file.buffer, uploadOpts);

    // Ép sinh URL đúng /raw/ + đúng ext, phòng trường hợp secure_url trả /image/
    const url = cloudinary.url(publicId, {
      resource_type: 'raw',        // <-- đảm bảo raw
      secure: true
      // không cần format vì publicId đã có .pdf/.docx
    });

    const saved = await contractService.uploadProposalContract(url, id);

    return res.status(200).json({
      message: 'Upload thành công',
      url,                                   // dùng url đã ép raw
      cloudinary_url: uploadResult.secure_url, // để debug xem Cloudinary trả gì
      resource_type_saved: uploadResult.resource_type,
      public_id: uploadResult.public_id,
      folder,
      saved: !!saved
    });
  } catch (err) {
    console.error('uploadProposalContract error:', err && (err.stack || err.message) || err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
},

    sign: async (req, res) => {
        try {
            const id = req.params.id;
            const { signed_file_url } = req.body;
            if (!signed_file_url) return res.status(400).json({ error: 'signed_file_url required' });
            const user = req.user || {};
            // only HR or admin can sign
            if (!user.role || (user.role !== 'hr' && user.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' });
            const updated = await contractService.signContract(id, signed_file_url);
            if (!updated) return res.status(404).json({ error: 'Contract not found' });
            return res.json(updated);
        } catch (err) {
            console.error('sign err', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    // helper endpoint for lead to ack a project (used by tests)
    ackProject: async (req, res) => {
        try {
            const projectId = req.params.id;
            const user = req.user || {};
            if (!user.role || (user.role !== 'lead' && user.role !== 'admin')) return res.status(403).json({ error: 'Forbidden' });
            // update project lead_ack_at
            const result = await contractService.ackProject(projectId, user.id);
            if (!result) return res.status(404).json({ error: 'Project not found' });
            return res.json(result);
        } catch (err) {
            console.error('ackProject err', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    hrConfirm: async (req, res) => {
        const approverId = req.user.id;
        const id = req.params.id;
        const status = "hr_approved"
        try{
            const result = await contractService.updateStatus(status, approverId, id)
        }catch(err){
            console.error(err)
        }
    },
    getServices: async (req, res) => {
        try {
            const contractId = req.params.id;
            const rows = await contractService.getServicesByContractId(contractId);
            return res.json(rows);
        } catch (err) {
            console.error('getServices err', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getByStatus : async (req, res) => {
        try{
            const status =  req.query.status || req.params.status ;
            const result = await contractService.getByStatus(status);
            return res.json(result)
        }catch(err){
            console.error('Lỗi khi get bởi status')
        }
    }
    
}

export default contractController;