import roles from "../models/roles.js";

const meService = {
    getMyRole: async(id) => {
        const result = await roles.getMyRole(id)
        return result
    }
}
export default meService
