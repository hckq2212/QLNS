import debts from "../models/debts.js";

const debtService = {
    getAll: async () => {
        const result = await debts.getAll();
        return result;
    },
    getById: async (debtId) => {
        const result = await debts.getById(debtId);
        return result;
    },
    updateStatus: async (debtId, debtStatus) => {
        const result = await debts.updateStatus(debtId, debtStatus);
        return result;
    }
    ,
    create: async (contractId, amount, dueDate) => {
        const result = await debts.create(contractId, amount, dueDate);
        return result;
    }
    ,
    payPartial: async (debtId, payAmount) => {
        return await debts.payPartial(debtId, payAmount);
    },

    runReminders: async () => {
        // simple implementation: find pending debts with due dates and return them for external processing
        const rows = await debts.findDebtsForReminders();
        return rows;
    },
}

export default debtService