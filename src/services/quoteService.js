import quote from '../models/quote.js';
import opportunities from '../models/opportunities.js';

const quoteService = {
  // Tạo quote mới
  create: async (opportunity_id, note = null) => {
    try {
      // Kiểm tra opportunity tồn tại
      const opportunity = await opportunities.getById(opportunity_id);
      if (!opportunity) {
        throw new Error('Opportunity not found');
      }

      // Kiểm tra đã có quote chưa
      const existingQuote = await quote.getByOpportunityId(opportunity_id);
      if (existingQuote) {
        // Nếu đã có quote, trả về quote hiện có thay vì throw error
        return existingQuote;
      }

      // Tạo quote mới
      const newQuote = await quote.create(opportunity_id, note);

      // Cập nhật trạng thái opportunity thành 'quote_pending'
      // await opportunities.update(opportunity_id, { status: 'quoted' });

      return newQuote;
    } catch (error) {
      throw error;
    }
  },

  // Lấy tất cả quotes
  getAll: async (filters) => {
    return await quote.getAll(filters);
  },

  // Lấy quote theo ID
  getById: async (id) => {
    const quoteData = await quote.getById(id);
    if (!quoteData) {
      throw new Error('Quote not found');
    }
    return quoteData;
  },

  // Lấy quote theo opportunity_id
  getByOpportunityId: async (opportunityId) => {
    return await quote.getByOpportunityId(opportunityId);
  },

  // Cập nhật quote
  update: async (id, data) => {
    const existing = await quote.getById(id);
    if (!existing) {
      throw new Error('Quote not found');
    }

    return await quote.update(id, data);
  },

  reject: async (id, data) => {
    const existing = await quote.getById(id);
    if (!existing) {
      throw new Error('Quote not found');
    }else{
      await opportunities.update(existing.opportunity_id, { status: 'quote_rejected' });
    }  

    return await quote.update(id, data);
  },

  // Xóa quote
  delete: async (id) => {
    const existing = await quote.getById(id);
    if (!existing) {
      throw new Error('Quote not found');
    }

    const result = await quote.delete(id);
    if (!result) {
      throw new Error('Failed to delete quote');
    }

    return true;
  }
};
export default quoteService
