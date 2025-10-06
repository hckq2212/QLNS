import taskService from '../services/taskService.js';


const taskController ={
    getAllTasks: async (req,res) => {
        const result = await taskService.getAllTasks();
        res.send(result)
    }
}

export default taskController