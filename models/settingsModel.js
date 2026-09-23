const supabase = require('../config/supabase');

const SettingsModel = {
  async findAll() {
    const { data, error } = await supabase.from('settings').select('*').order('id', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async findFirst() {
    const { data, error } = await supabase.from('settings').select('*').order('id', { ascending: true }).limit(1).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async create(data) {
    const { data: row, error } = await supabase.from('settings').insert(data).select('*').single();
    if (error) throw error;
    return row;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('settings').delete().eq('id', id);
    if (error) throw error;
  },
};

module.exports = SettingsModel;