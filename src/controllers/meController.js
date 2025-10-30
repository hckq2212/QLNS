import meService from "../services/meService.js";

const meController = {
    getMyJob: async (req, res) => {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ message: 'Không tìm thấy người dùng từ token' });
        }
        const id = req.user.id
        try {
            const result = await meService.getMyJob(id);
            return res.status(200).json(result)
        } catch (error) {
            console.error('Lỗi khi get công việc', error)
        }
    }
}
export default meController;