import tasks from '../models/tasks.js'


const taskService = {
    getAllTasks: async () =>{
        return tasks
    } 
}

export default taskService