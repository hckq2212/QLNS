import opportunityService from '../services/opportunityService.js';


const opportunityController ={
    getAllTasks: async (req,res) => {
        const result = await opportunityService.getAllOpportunities();
        res.send(result)
    }
}

export default opportunityController