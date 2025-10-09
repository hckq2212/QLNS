import debtService from '../services/debtService.js'

const debtPaymentController = {
    payPartial: async (req, res) => {
        try {
            const id = req.params.id;
            const amount = req.body.amount;
            if (!amount) return res.status(400).json({ error: 'amount required' });
            const result = await debtService.payPartial(id, amount);
            if (!result) return res.status(404).json({ error: 'Debt not found' });
            return res.json(result);
        } catch (err) {
            console.error('payPartial error', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    },

    reminders: async (req, res) => {
        try {
            const rows = await debtService.runReminders();
            return res.json(rows);
        } catch (err) {
            console.error('reminders error', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
    }
}

export default debtPaymentController;
