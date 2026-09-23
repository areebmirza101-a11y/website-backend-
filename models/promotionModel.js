const supabase = require('../config/supabase');

const PromotionModel = {
  async findAll(opts = {}) {
    let query = supabase.from('promotions').select('*');
    if (opts.where) {
      if (opts.where.active !== undefined) query = query.eq('active', opts.where.active);
    }
    query = query.order('id', { ascending: false });
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase.from('promotions').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async create(data) {
    const { data: row, error } = await supabase.from('promotions').insert(data).select('*').single();
    if (error) throw error;
    return row;
  },

  async update(id, data) {
    const { data: row, error } = await supabase
      .from('promotions')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return row;
  },

  async delete(id) {
    const { error } = await supabase.from('promotions').delete().eq('id', id);
    if (error) throw error;
  }
};

module.exports = PromotionModel;
