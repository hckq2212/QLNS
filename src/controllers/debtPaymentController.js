import debtPaymentService from "../services/debtPaymentService.js";

const debtPaymentController = {
    create: async (req, res) => {
        try {
            const { debtId } = req.params;
            const payment = await debtPaymentService.create(debtId, req.body);
            res.json(payment);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    },

    getByDebt: async (req, res) => {
        try {
            const { debtId } = req.params;
            const list = await debtPaymentService.getByDebt(debtId);
            res.json(list);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    },

    update: async (req, res) => {
        try {
            const { paymentId } = req.params;
            const updated = await debtPaymentService.update(paymentId, req.body);
            res.json(updated);
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    },

    remove: async (req, res) => {
        try {
            const { paymentId } = req.params;
            await debtPaymentService.remove(paymentId);
            res.json({ message: "Deleted" });
        } catch (err) {
            res.status(400).json({ message: err.message });
        }
    }
};
export default debtPaymentController;