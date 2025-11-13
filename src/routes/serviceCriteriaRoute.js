import express from 'express';
import { serviceCriteriaController } from '../controllers/serviceCriteriaController.js';

const serviceCriteriaRoute  = express.Router();

// Lấy tất cả tiêu chí của 1 service
serviceCriteriaRoute .get('/service/:service_id', serviceCriteriaController.getByService);

// Lấy 1 tiêu chí cụ thể
serviceCriteriaRoute .get('/:id', serviceCriteriaController.getById);

// Tạo mới tiêu chí
serviceCriteriaRoute .post('/', serviceCriteriaController.create);

// Cập nhật tiêu chí
serviceCriteriaRoute .put('/:id', serviceCriteriaController.update);

// Xóa tiêu chí
serviceCriteriaRoute .delete('/:id', serviceCriteriaController.remove);

export default serviceCriteriaRoute ;
