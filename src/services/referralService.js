// services/referralService.js
import ReferralModel from '../models/referralModel.js';

const referralService = {
  async list(query) {
    const { keyword, active } = query;

    let activeFlag;
    if (active === 'true') activeFlag = true;
    else if (active === 'false') activeFlag = false;
    else activeFlag = undefined;

    return ReferralModel.findAll({
      keyword: keyword || undefined,
      active: activeFlag
    });
  },

  async detail(id) {
    return ReferralModel.findById(id);
  },

  async create(payload, user) {
    // Validate đơn giản
    if (!payload.name || !payload.name.trim()) {
      throw new Error('Tên đối tác referral là bắt buộc');
    }

    // Có thể thêm validate commission_rate: 0–100
    if (payload.commission_rate != null) {
      const rate = Number(payload.commission_rate);
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        throw new Error('commission_rate phải từ 0 đến 100');
      }
    }

    // Nếu muốn lưu created_by thì thêm cột trong DB, ở đây tạm bỏ qua
    const data = {
      name: payload.name.trim(),
      tax_code: payload.tax_code,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      contact_person: payload.contact_person,
      commission_rate: payload.commission_rate,
      note: payload.note,
      is_active: payload.is_active
    };

    return ReferralModel.create(data);
  },

  async update(id, payload, user) {
    const existing = await ReferralModel.findById(id);
    if (!existing) {
      throw new Error('Referral partner không tồn tại');
    }

    if (!payload.name || !payload.name.trim()) {
      throw new Error('Tên đối tác referral là bắt buộc');
    }

    if (payload.commission_rate != null) {
      const rate = Number(payload.commission_rate);
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        throw new Error('commission_rate phải từ 0 đến 100');
      }
    }

    const data = {
      name: payload.name.trim(),
      tax_code: payload.tax_code,
      phone: payload.phone,
      email: payload.email,
      address: payload.address,
      contact_person: payload.contact_person,
      commission_rate: payload.commission_rate,
      note: payload.note,
      is_active:
        payload.is_active !== undefined ? payload.is_active : existing.is_active
    };

    return ReferralModel.update(id, data);
  },

  async softDelete(id, user) {
    const existing = await ReferralModel.findById(id);
    if (!existing) {
      throw new Error('Referral partner không tồn tại');
    }
    return ReferralModel.softDelete(id);
  },

  async listCustomers(id) {
    const existing = await ReferralModel.findById(id);
    if (!existing) {
      throw new Error('Referral partner không tồn tại');
    }
    return ReferralModel.findCustomers(id);
  }
};

export default referralService;
