import teams from '../models/teams.js'

const teamService = {
    getAll: async() => {
        const result = await teams.getAll();
        return result
    },
    getById: async(id) => {
        const result = await teams.getyById(id);
        return result;
    },
    create: async(name, description, lead_user_id) => {
        const result = await teams.create(name, description, lead_user_id)
        return result
    }
}
export default teamService