import opportunities from '../models/opportunities.js'


const opportunityService = {
    getAllOpportunities: async () =>{
        // simply proxy to the model for now
        return await opportunities.getAll();
    }
}

export default opportunityService;