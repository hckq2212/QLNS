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
}

export default debtService