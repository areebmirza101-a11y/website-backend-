const supabase = require('../config/supabase');

const SizeGuideModel = {
  async findAll() {
    const { data, error } = await supabase
      .from('size_guides')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async findActive() {
    const { data, error } = await supabase
      .from('size_guides')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('size_guides')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async create(data) {
    const { data: row, error } = await supabase
      .from('size_guides')
      .insert(data)
      .select('*')
      .single();
    if (error) throw error;
    return row;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('size_guides')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('size_guides')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

module.exports = SizeGuideModel;
