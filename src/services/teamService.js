import teams from '../models/teams.js'

const teamService = {
    getAll: async() => {
        const result = await teams.getAll();
        return result
    },
    getById: async(id) => {
        const result = await teams.getById(id);
        return result;
    },
    create: async(name, description, lead_user_id) => {
        const result = await teams.create(name, description, lead_user_id)
        return result
    },
    update: async(id, payload) => {
        if (!id) throw new Error('id required');
        const result = await teams.update(id, payload);
        return result;
    },
    getMemberByTeamId: async(id) => {
        const result = await teams.getMemberByTeamId(id);
        return result
    },
    
}
export default teamService