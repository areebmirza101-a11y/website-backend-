const supabase = require('../config/supabase');

const ContactMessageModel = {
  async findAll() {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async create(data) {
    const { data: row, error } = await supabase
      .from('contact_messages')
      .insert(data)
      .select('*')
      .single();
    if (error) throw error;
    return row;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async countUnread() {
    const { count, error } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .eq('read', false);
    if (error) throw error;
    return count || 0;
  },
};

module.exports = ContactMessageModel;
