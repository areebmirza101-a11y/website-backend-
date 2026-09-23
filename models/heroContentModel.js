const supabase = require('../config/supabase');

const HeroContentModel = {
  async findAll() {
    const { data, error } = await supabase
      .from('hero_content')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase.from('hero_content').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async create(data) {
    const { data: row, error } = await supabase.from('hero_content').insert(data).select('*').single();
    if (error) throw error;
    return row;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('hero_content')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('hero_content').delete().eq('id', id);
    if (error) throw error;
  },
};

module.exports = HeroContentModel;