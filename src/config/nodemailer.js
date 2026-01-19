import nodemailer from "nodemailer";
import db from '../config/db.js'



const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS, // App Password
  },
});

function formatVND(n) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(n || 0));
}

export async function sendDebtDueReminders() {
  try {
    // 1) Lấy danh sách cần gửi hôm nay
    const { rows } = await db.query(`
      SELECT
        d.id AS debt_id,
        d.title AS debt_title,
        d.amount,
        d.paid_amount,
        (d.amount - d.paid_amount) AS remaining_amount,
        d.due_date,
        c.email AS customer_email,
        c.name AS customer_name,
        ct.code AS contract_code,
        ct.name AS contract_name
      FROM debt d
      JOIN contract ct ON ct.id = d.contract_id
      JOIN customer c ON c.id = ct.customer_id
      WHERE d.status = 'pending'
        AND d.due_date IS NOT NULL
        AND c.email IS NOT NULL
        AND CURRENT_DATE BETWEEN (d.due_date - INTERVAL '7 days') AND d.due_date
        AND (d.reminder_last_sent_on IS DISTINCT FROM CURRENT_DATE)
    `);

    for (const r of rows) {
      const subject = `Nhắc thanh toán sắp đến hạn - ${r.contract_code || "Hợp đồng"}`;
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5">
          <h2>Nhắc thanh toán sắp đến hạn</h2>
          <p>Chào ${r.customer_name || "quý khách"},</p>

          <p>Khoản công nợ <b>#${r.debt_id}</b>${r.debt_title ? ` - <b>${r.debt_title}</b>` : ""} sắp đến hạn thanh toán.</p>

          <ul>
            <li>Hợp đồng: <b>${r.contract_code || ""}</b> ${r.contract_name ? `- ${r.contract_name}` : ""}</li>
            <li>Ngày đến hạn: <b>${new Date(r.due_date).toLocaleDateString("vi-VN")}</b></li>
            <li>Số tiền cần thanh toán: <b>${formatVND(r.remaining_amount)}</b></li>
          </ul>

          <p>Vui lòng sắp xếp thanh toán trước ngày đến hạn để tránh phát sinh quá hạn.</p>
          <p>Trân trọng.</p>
        </div>
      `;

      // 2) Gửi mail
      await transporter.sendMail({
        from: `"Billing" <${process.env.MAIL_USER}>`,
        to: r.customer_email,
        subject,
        html,
      });

      // 3) Mark đã gửi hôm nay (chống trùng)
      await db.query(
        `UPDATE debt SET reminder_last_sent_on = CURRENT_DATE, updated_at = now() WHERE id = $1`,
        [r.debt_id]
      );
    }

    return { sent: rows.length };
  } finally {
    db.release();
  }
}
