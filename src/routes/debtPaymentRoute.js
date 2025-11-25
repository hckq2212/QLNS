import express from "express";
import debtPaymentController from "../controllers/debtPaymentController.js";

const debtPaymentRoute = express.Router();

// thêm 1 lần trả nợ
debtPaymentRoute.post("/:debtId/payments", debtPaymentController.create);

// xem tất cả lịch sử trả nợ của 1 debt
debtPaymentRoute.get("/:debtId/payments", debtPaymentController.getByDebt);

// cập nhật 1 lần trả
debtPaymentRoute.put("/payment/:paymentId", debtPaymentController.update);

// xóa 1 lần trả
debtPaymentRoute.delete("/payment/:paymentId", debtPaymentController.remove);

export default debtPaymentRoute;
