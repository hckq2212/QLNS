import { acceptance } from '../models/acceptance.js';
import db from '../config/db.js';
// import nodemailer from 'nodemailer';

export const acceptanceService = {
  createDraft: async (payload) => {
    const { project_id, created_by, jobs } = payload;
    if (!project_id || !created_by || !jobs?.length)
      throw new Error('Thiếu thông tin project_id, created_by hoặc jobs');
    return await acceptance.createDraft(payload);
  },

  submitToBOD: async (id) => {
    const record = await acceptance.getById(id);
    if (!record) throw new Error('Không tìm thấy phiếu nghiệm thu');
    if (record.status !== 'draft')
      throw new Error('Chỉ có thể gửi BOD khi trạng thái là draft');
    return await acceptance.updateStatus(id, 'submitted_bod');
  },

  approveByBOD: async (id, userId) => {
    const record = await acceptance.getById(id);
    if (!record) throw new Error('Không tìm thấy phiếu nghiệm thu');

    // ✅ Cập nhật trạng thái approved
    const updated = await acceptance.updateStatus(id, 'approved', userId);

    // ✅ Cập nhật trạng thái job -> accepted
    const jobIds = (record.jobs || []).map(Number);
    if (jobIds.length) {
      await db.query(
        `UPDATE job SET status = 'accepted' WHERE id = ANY($1::int[])`,
        [jobIds]
      );
    }

    // // ✅ Gửi mail cho khách hàng
    // if (record.customer_email) {
    //   const transporter = nodemailer.createTransport({
    //     service: 'gmail',
    //     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    //   });

    //   const html = `
    //     <h3>Kính gửi Quý khách,</h3>
    //     <p>Dự án <b>${record.project_id}</b> đã được BOD duyệt nghiệm thu.</p>
    //     <p>Vui lòng xem tài liệu tại đường dẫn sau:</p>
    //     ${(record.result || [])
    //       .map(f => `<li><a href="${f.url}">${f.name || f.url}</a></li>`)
    //       .join('')}
    //   `;

    //   await transporter.sendMail({
    //     from: process.env.SMTP_USER,
    //     to: record.customer_email,
    //     subject: `Thông báo nghiệm thu dự án #${record.project_id}`,
    //     html
    //   });

    //   await acceptance.updateMailSent(id);
    // }

    return updated;
  },

  rejectByBOD: async (id, userId) => {
    const record = await acceptance.getById(id);
    if (!record) throw new Error('Không tìm thấy phiếu nghiệm thu');

    const updated = await acceptance.updateStatus(id, 'rejected', userId);

    // ✅ Trả các job về trạng thái review
    const jobIds = (record.jobs || []).map(Number);
    if (jobIds.length) {
      await db.query(
        `UPDATE job SET status = 'review' WHERE id = ANY($1::int[])`,
        [jobIds]
      );
    }

    return updated;
  }
};
