import jobs from "../models/jobs.js";

const jobService = {
    getAll: async () => {
        const result = await jobs.getAll();
        return result;
    },
    getById: async (jobId) => {
        const result = await jobs.getById(jobId);
        return result;
    },
    update: async(id, payload) => {
        const result = await jobs.update(id, payload);
        return result
    },
    create: async(payload) => {
        const result = await jobs.create(payload);
        return result;
    },
    getByProject: async(id) => {
        const result = await jobs.getByProject(id);
        return result;
    },

    assign: async(id, body) => {
        const result = await jobs.update(id, body);
        if(!result) throw new Error('Lỗi khi thực hiện assign job')
        return result
    },
    getMyJob: async(id) => {
        const result = await jobs.getMyJob(id);
        return result;
    },
    finish: async (jobId, newEvidence = [], userId = null) => {
        // use model getter to fetch current evidence
        const job = await jobs.getById(jobId);
        if (!job) throw new Error('Job không tồn tại');

        const current = Array.isArray(job.evidence) ? job.evidence : [];

        // Merge (unique by url). Normalize fields to { filename, url }
        const map = new Map();
        for (const it of current) if (it && it.url) map.set(it.url, { filename: it.filename || it.name || 'file', url: it.url });
        for (const it of newEvidence) if (it && it.url) map.set(it.url, { filename: it.filename || it.name || 'file', url: it.url });
        const merged = Array.from(map.values());

        // Update status='done', evidence, updated_by
        const payload = {
            status: 'review',
            evidence: merged,
            updated_by: userId,
        };

        const updated = await jobs.update(jobId, payload);
        if (!updated) throw new Error('Không thể cập nhật job');
        return updated;
    },

}

export default jobService