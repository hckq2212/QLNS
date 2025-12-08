// models/referralModel.js
import db from '../config/db.js'

const ReferralModel = {
  async findAll({ keyword, active }) {
    const params = [];
    let where = 'WHERE 1=1';

    if (keyword) {
      params.push(`%${keyword}%`);
      where += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length})`;
    }

    if (active !== undefined) {
      params.push(active);
      where += ` AND is_active = $${params.length}`;
    }

    const sql = `
      SELECT 
        id,
        name,
        tax_code,
        phone,
        email,
        address,
        contact_person,
        commission_rate,
        note,
        is_active,
        created_at,
        updated_at
      FROM referral_partner
      ${where}
      ORDER BY created_at DESC
    `;

    const { rows } = await db.query(sql, params);
    return rows;
  },

  async findById(id) {
    const sql = `
      SELECT 
        id,
        name,
        tax_code,
        phone,
        email,
        address,
        contact_person,
        commission_rate,
        note,
        is_active,
        created_at,
        updated_at
      FROM referral_partner
      WHERE id = $1
    `;
    const { rows } = await db.query(sql, [id]);
    return rows[0] || null;
  },

  async create(data) {
    const sql = `
      INSERT INTO referral_partner (
        name,
        tax_code,
        phone,
        email,
        address,
        contact_person,
        commission_rate,
        note,
        is_active
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING *
    `;
    const values = [
      data.name,
      data.tax_code || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.contact_person || null,
      data.commission_rate || null,
      data.note || null,
      data.is_active ?? true
    ];

    const { rows } = await db.query(sql, values);
    return rows[0];
  },

  async update(id, data) {
    const sql = `
      UPDATE referral_partner
      SET
        name = $1,
        tax_code = $2,
        phone = $3,
        email = $4,
        address = $5,
        contact_person = $6,
        commission_rate = $7,
        note = $8,
        is_active = $9,
        updated_at = now()
      WHERE id = $10
      RETURNING *
    `;
    const values = [
      data.name,
      data.tax_code || null,
      data.phone || null,
      data.email || null,
      data.address || null,
      data.contact_person || null,
      data.commission_rate || null,
      data.note || null,
      data.is_active ?? true,
      id
    ];

    const { rows } = await db.query(sql, values);
    return rows[0] || null;
  },

  async softDelete(id) {
    const sql = `
      UPDATE referral_partner
      SET is_active = false,
          updated_at = now()
      WHERE id = $1
      RETURNING *
    `;
    const { rows } = await db.query(sql, [id]);
    return rows[0] || null;
  },

  // (optional) lấy danh sách khách hàng của 1 referral
  async findCustomers(referralId) {
    const sql = `
      SELECT
        c.id,
        c.name,
        c.tax_code,
        c.phone,
        c.email,
        c.address,
        c.customer_source,
        c.referral_partner_id,
        c.created_at,
        c.updated_at
      FROM customer c
      WHERE c.referral_partner_id = $1
      ORDER BY c.created_at DESC
    `;
    const { rows } = await db.query(sql, [referralId]);
    return rows;
  }
};

export default ReferralModel;
