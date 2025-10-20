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
    update: async (req, res) => {
        const id = req.params.id;
        const payload = req.body || {};

        try {
            const result = await contractService.update(id, payload);
            res.status(200).json({ message: 'Cập nhật thành công', contract: result });
        } catch (err) {
            console.error('Lỗi khi update contract', err && (err.stack || err.message) || err);
            return res.status(500).json({ error: err.message || 'Server error' });
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
        const status = "not_assigned"
        try{
            const result = await contractService.approveByBOD(id, status, approverId)
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
    const streamUpload = (buffer, opts = {}) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          opts,
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(buffer);
      });

    const orig = req.file.originalname || 'file';
    const ext  = (orig.split('.').pop() || '').toLowerCase(); // pdf|doc|docx
    const base = orig.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-]/g, '_');

    const folder = 'QLNS/proposal_contracts';

    const uploadOpts = {
      resource_type: 'raw',
      type: 'upload',
      folder,
      public_id: base,          // KHÔNG có .ext
      format: ext,              // Cloudinary sinh secure_url có .ext
      use_filename: false,
      unique_filename: false,
      overwrite: true,
      context: { original_filename: orig }
    };

    const uploadResult = await streamUpload(req.file.buffer, uploadOpts);

    // Dùng URL do Cloudinary trả (ổn định)
    const url = uploadResult.secure_url;

    const saved = await contractService.uploadProposalContract(url, id);

    return res.status(200).json({
      message: 'Upload thành công',
      url,                                 // URL dùng trong hệ thống
      cloudinary_url: uploadResult.secure_url,
      resource_type_saved: uploadResult.resource_type, // 'raw'
      public_id: uploadResult.public_id,   // ví dụ: 'QLNS/contracts/ten_file'
      folder,
      saved: !!saved
    });
  } catch (err) {
    console.error('uploadProposalContract error:', err && (err.stack || err.message) || err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
  }
},

sign: async (req, res) => {
  const id = req.params.id;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded (field name: signedContract)' });

  console.log('uploadSigned - req.file:', {
    originalname: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size
  });

  // Thông báo lỗi khớp với danh sách allowed
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (!allowed.includes(req.file.mimetype || '')) {
    return res.status(400).json({ error: 'Only PDF/DOCX allowed', mime: req.file.mimetype });
  }

  try {
    const streamUpload = (buffer, opts = {}) => new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        opts,
        (error, result) => error ? reject(error) : resolve(result)
      );
      stream.end(buffer);
    });

    const orig = req.file.originalname || 'file';
    const ext  = (orig.split('.').pop() || '').toLowerCase();
    const base = orig.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_\-]/g, '_');

    // ✅ Đặt folder riêng; public_id không có extension
    const folder = 'QLNS/signed_contracts';

    // ✅ Ép kiểu raw để nhất quán (PDF & DOCX đều về raw)
    //    unique_filename=false để không bị _abcxyz tự động
    const uploadOpts = {
      resource_type: 'raw',
      type: 'upload',
      folder,                 // <<-- thư mục đúng mong muốn
      public_id: base,        // <<-- KHÔNG có .ext
      use_filename: false,
      unique_filename: false,
      overwrite: false,
      context: { original_filename: orig },
      // (tuỳ chọn) nếu muốn Cloudinary lưu đúng đuôi trong URL:
      // format: ext,   // Cloudinary sẽ trả secure_url có .ext
    };

    const uploadResult = await streamUpload(req.file.buffer, uploadOpts);

    // ✅ Tin cậy secure_url do Cloudinary trả về
    const url = uploadResult.secure_url;

    // Lưu DB
    const saved = await contractService.signContract(url, id);

    return res.status(200).json({
      message: 'Upload thành công',
      url,                               // URL chuẩn để dùng
      cloudinary_url: uploadResult.secure_url,
      resource_type_saved: uploadResult.resource_type, // nên là 'raw'
      public_id: uploadResult.public_id, // ví dụ: 'QLNS/signed_contracts/ten_file'
      folder,
      saved: !!saved
    });
  } catch (err) {
    console.error('Sign contract error:', err && (err.stack || err.message) || err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
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
            const rows = await contractService.getServices(contractId);
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