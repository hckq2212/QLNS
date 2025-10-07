import users from '../models/users.js'
import authService from './authService.js'

const userService = {
	getAllUsers: async () => {
		return await users.getAll();
	},

	getUserById: async (id) => {
		if (!id) throw new Error('thiếu id')
		return await users.getUserById(id)
	},
}

export default userService