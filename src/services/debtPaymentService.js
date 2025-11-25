import debtPayment from "../models/debtPayment.js";
import db from "../config/db.js";

const debtPaymentService = {
    create: async (debtId, { paid_amount, paid_at, method, note }) => {
        if (!paid_amount || paid_amount <= 0)
            throw new Error("paid_amount must be > 0");

        return await debtPayment.create(debtId, {
            paid_amount,
            paid_at,
            method,
            note
        });
    },

    getByDebt: async (debtId) => {
        return await debtPayment.getByDebt(debtId);
    },

    update: async (paymentId, fields) => {
        return await debtPayment.update(paymentId, fields);
    },

    remove: async (paymentId) => {
        return await debtPayment.remove(paymentId);
    }
};
export default debtPaymentService;