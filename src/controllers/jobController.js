import jobService from "../services/jobService.js";
import cloudinary from '../config/cloudinary.js'
import streamifier from 'streamifier'

const jobController = {
    getAll: async (req, res) => {
        try{
            const result = await jobService.getAll();
            return res.json(result);
        }catch(err){
            console.error(`Lỗi khi get all công việc: ${err}`)
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById: async (req, res) => {
        const jobId = req.params.id;
        try{
            const result = await jobService.getById(jobId);
            return res.json(result);
        }catch(err){
            console.error(`Looix khi get Job by id: ${err}`)
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    create: async (req, res) => {
        const payload = req.body || {}
        try{
            const result = await jobService.create(payload);
            return res.json(result)
        }catch(err){
            console.error("Lỗi khi tạo job")
        }
    },
    update: async (req, res) => {
        try {
            const jobId = req.params.id;
            const payload = req.body || {}
            const result = await jobService.update(jobId, payload);
            if (!result) return res.status(404).json({ error: 'Job not found' });
            return res.status(200).json(result);
        } catch (err) {
            console.error('Error in jobController.update', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getByProject: async(req, res) => {
        try{
            const id = req.params.projectId;
            const result = await jobService.getByProject(id);
            return res.json(result)
        }catch(err){

        }
    },
   assign: async (req, res) => {
    try {
      const id = req.params.id;

      // parse body
      const body = {
        assigned_id: req.body.assigned_id,
        description: req.body.description ?? null,
        status: 'in_progress',
        start_date: req.body.start_date,
        deadline: req.body.deadline,
      };

      // ---- LẤY FILES TỪ multer.fields([{ name: 'files' }]) ----
      // req.files có dạng { files: [ ... ] } hoặc mảng nếu cấu hình khác
      let files = [];
      if (Array.isArray(req.files)) {
        files = req.files;
      } else if (req.files && typeof req.files === 'object') {
        files = Array.isArray(req.files.files) ? req.files.files : [];
      }

      // ---- UP CLOUDINARY + CHỈ LƯU { filename, url } ----
      const uploaded = [];
      if (files.length) {
        for (const f of files) {
          if (!f?.buffer) continue;
          try {
            const uploadResult = await new Promise((resolve, reject) => {
              const uploadStream = cloudinary.uploader.upload_stream(
                { folder: `QLNS/job_attachments/${id}`, resource_type: 'auto' },
                (error, result) => (error ? reject(error) : resolve(result))
              );
              streamifier.createReadStream(f.buffer).pipe(uploadStream);
            });

            const filename = (f.originalname || uploadResult.original_filename || 'file')
              .replace(/\s+/g, '_');
            const url = uploadResult.secure_url || uploadResult.url;
            uploaded.push({ filename, url });
          } catch (err) {
            console.error('Upload file to Cloudinary failed', err);
          }
        }
      }

      // ---- MERGE VỚI ATTACHMENTS CŨ (unique theo url) ----
      if (uploaded.length) {
        try {
          const existing = await jobService.getById(id);
          const existingAttachments = Array.isArray(existing?.attachments) ? existing.attachments : [];
          const normalizedExisting = existingAttachments
            .map(a => ({ filename: a.filename || a.original_name || 'file', url: a.url }))
            .filter(a => a.url);

          const map = new Map();
          for (const it of normalizedExisting) map.set(it.url, it);
          for (const it of uploaded) map.set(it.url, it);
          body.attachments = Array.from(map.values());
        } catch (err) {
          body.attachments = uploaded;
        }
      }

      // ---- VALIDATION ----
      if (!body.assigned_id) return res.status(400).json({ error: 'Thiếu assigned_id' });
      if (!body.start_date) return res.status(400).json({ error: 'Thiếu ngày bắt đầu' });
      if (!body.deadline) return res.status(400).json({ error: 'Thiếu deadline' });

      // ---- UPDATE ----
      const result = await jobService.assign(id, body);
      return res.status(200).json(result);
    } catch (err) {
      console.error('Lỗi khi assign job', err);
      return res.status(500).json({ error: err.message || 'Internal server error' });
    }
  },

        getMyJob: async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Không tìm thấy người dùng từ token' });
        }
        const id = req.user.id
        try {
            const result = await jobService.getMyJob(id);
            return res.status(200).json(result)
        } catch (error) {
            console.error('Lỗi khi get công việc', error)
        }
    },
    finish:async (req, res) => {
         try {
            const id = req.params.id;

            // Lấy files từ multer.fields([{ name: 'evidence' }])
            let files = [];
            if (Array.isArray(req.files)) {
            files = req.files;
            } else if (req.files && typeof req.files === 'object') {
            files = Array.isArray(req.files.evidence) ? req.files.evidence : [];
            }

            // Upload lên Cloudinary, chỉ lưu { filename, url }
            const uploaded = [];
            for (const f of files) {
            if (!f?.buffer) continue;
            try {
                const uploadResult = await new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    { folder: `QLNS/job_evidence/${id}`, resource_type: 'auto' },
                    (error, result) => (error ? reject(error) : resolve(result))
                );
                streamifier.createReadStream(f.buffer).pipe(uploadStream);
                });

                const filename = (f.originalname || uploadResult.original_filename || 'file').replace(/\s+/g, '_');
                const url = uploadResult.secure_url || uploadResult.url;
                uploaded.push({ filename, url });
            } catch (e) {
                console.error('Upload evidence failed', e);
            }
            }

            // Gọi service: set status='done' + merge evidence
            const result = await jobService.finish(id, uploaded, req.user?.id || null);
            return res.status(200).json(result);
        } catch (err) {
            console.error('finish error:', err);
            return res.status(500).json({ error: err.message || 'Internal server error' });
        }
    }


}

export default jobController;