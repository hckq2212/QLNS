import jobService from "../services/jobService.js";
import cloudinary from '../config/cloudinary.js'
import streamifier from 'streamifier'

const jobController = {
    getAll: async (req, res) => {
        try{
            const result = await jobService.getAll();
            console.log('[GET] Lấy danh sách tất cả công việc thành công');
            return res.json(result);
        }catch(err){
            console.error('[GET] Lấy danh sách tất cả công việc - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getById: async (req, res) => {
        const jobId = req.params.id;
        try{
            const result = await jobService.getById(jobId);
            console.log(`[GET] Lấy chi tiết công việc ID ${jobId} thành công`);
            return res.json(result);
        }catch(err){
            console.error(`[GET] Lấy chi tiết công việc ID ${jobId} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    create: async (req, res) => {
        const payload = req.body || {}
        try{
            const result = await jobService.create(payload);
            console.log('[POST] Tạo công việc thành công');
            return res.json(result)
        }catch(err){
            console.error('[POST] Tạo công việc - LỖI:', err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    update: async (req, res) => {
        try {
            const jobId = req.params.id;
            console.log(jobId)
            const payload = req.body || {}
            console.log(payload)
            const result = await jobService.update(jobId, payload);
            if (!result) return res.status(404).json({ error: 'Job not found' });
            console.log(`[PATCH] Cập nhật công việc ID ${jobId} thành công`);
            return res.status(200).json(result);
        } catch (err) {
            console.error(`[PATCH] Cập nhật công việc ID ${jobId} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    getByProject: async(req, res) => {
        try{
            const id = req.params.projectId;
            const result = await jobService.getByProject(id);
            console.log(`[GET] Lấy danh sách công việc theo dự án ID ${id} thành công`);
            return res.json(result)
        }catch(err){
            console.error(`[GET] Lấy danh sách công việc theo dự án ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: 'Internal server error' });

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
        priority: req.body.priority
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
      console.log(`[POST] Phân công công việc ID ${id} thành công`);
      return res.status(200).json(result);
    } catch (err) {
      console.error(`[POST] Phân công công việc ID ${id} - LỖI:`, err.message || err);
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
            console.log('[GET] Lấy danh sách công việc của tôi thành công');
            return res.status(200).json(result)
        } catch (error) {
            console.error('[GET] Lấy danh sách công việc của tôi - LỖI:', error.message || error);
        }
    },
    getJobByUserId: async (req, res) => {
        const userId = req.params.userId;
        try {
            const result = await jobService.getJobByUserId(userId);
            console.log(`[GET] Lấy danh sách công việc của người dùng ID ${userId} thành công`);
            return res.status(200).json(result);
        } catch (error) {
            console.error(`[GET] Lấy danh sách công việc của người dùng ID ${userId} - LỖI:`, error.message || error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },
    finish:async (req, res) => {
         try {
            const id = req.params.id;
            const evidenceData = [];

            // 1. Lấy files từ multer.fields([{ name: 'evidence' }])
            let files = [];
            if (Array.isArray(req.files)) {
              files = req.files;
            } else if (req.files && typeof req.files === 'object') {
              files = Array.isArray(req.files.evidence) ? req.files.evidence : [];
            }

            // 2. Upload files lên Cloudinary nếu có
            if (files.length > 0) {
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
                  evidenceData.push({ filename, url });
                } catch (e) {
                  console.error('Upload evidence failed', e);
                }
              }
            }

            // 3. Lấy URLs từ body nếu FE chỉ gửi URL (không upload file)
            // Expect: { evidenceUrls: [{ url: "https://..." }, ...] }
            if (req.body.evidenceUrls) {
              try {
                const urls = typeof req.body.evidenceUrls === 'string' 
                  ? JSON.parse(req.body.evidenceUrls) 
                  : req.body.evidenceUrls;
                
                if (Array.isArray(urls)) {
                  for (const item of urls) {
                    if (item && item.url) {
                      // Trích xuất filename từ URL nếu không có
                      let filename = item.filename || item.name;
                      if (!filename) {
                        try {
                          const urlPath = new URL(item.url).pathname;
                          filename = urlPath.split('/').pop() || 'file';
                        } catch {
                          filename = 'file';
                        }
                      }
                      
                      evidenceData.push({
                        filename: filename,
                        url: item.url
                      });
                    }
                  }
                }
              } catch (e) {
                console.error('Parse evidenceUrls failed', e);
              }
            }

            // 4. Gọi service: set status='review' + merge evidence
            const result = await jobService.finish(id, evidenceData, req.user?.id || null);
            console.log(`[POST] Hoàn thành công việc ID ${id} thành công`);
            return res.status(200).json(result);
        } catch (err) {
            console.error(`[POST] Hoàn thành công việc ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: err.message || 'Internal server error' });
        }
    }

    ,
    rework: async (req, res) => {
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
                console.error('Upload evidence failed in rework', e);
              }
            }

            // Gọi service: replace evidence (not merge) + set status='review'
            const result = await jobService.rework(id, uploaded, req.user?.id || null);
            console.log(`[POST] Làm lại công việc ID ${id} thành công`);
            return res.status(200).json(result);
        } catch (err) {
            console.error(`[POST] Làm lại công việc ID ${id} - LỖI:`, err.message || err);
            return res.status(500).json({ error: err.message || 'Internal server error' });
        }
    }
}

export default jobController;