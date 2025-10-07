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
    update: async (userId, username, fullName, phoneNumber, email) => {
		if (!userId) throw new Error('userId required');
		const fields = {
			username,
			full_name: fullName,
			phone: phoneNumber,
			email
		};
		const result = await users.update(userId, fields);
		return result;
    }
}

export default userService