import express from 'express';
import partnerServiceJobController from '../controllers/partnerServiceJobController.js';

const  partnerServiceJobRoute = express.Router();

// Tạo mới (Partner đăng ký cung cấp Service Job)
partnerServiceJobRoute.post('/', partnerServiceJobController.create);

// Lấy danh sách tất cả mapping
partnerServiceJobRoute.get('/', partnerServiceJobController.getAll);

// Cập nhật mapping
partnerServiceJobRoute.patch('/:id', partnerServiceJobController.update);

// Lấy danh sách service_job mà 1 partner có thể cung cấp
partnerServiceJobRoute.get('/partner/:partner_id', partnerServiceJobController.getByPartner);

// Lấy danh sách partner có thể cung cấp 1 service_job
partnerServiceJobRoute.get('/service-job/:service_job_id', partnerServiceJobController.getByServiceJob);

export default partnerServiceJobRoute
