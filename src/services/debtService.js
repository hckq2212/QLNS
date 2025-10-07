import debts from "../models/debts.js";

const debtService = {
    getAll: async () => {
        const result = await debts.getAll();
        return result;
    },
    getById: async (debtId) => {
        const result = await debts.getById(debtId);
        return result
    }
}

export default debtService