const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

const UserModel = {
  async findAll() {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async findByEmail(email) {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async create({ name, email, password, role = 'customer' }) {
    const { data, error } = await supabase
      .from('users')
      .insert({ name, email, password, role })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
  },

  async count(where = {}) {
    let query = supabase.from('users').select('*', { count: 'exact', head: true });
    if (where.role) query = query.eq('role', where.role);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },

  async comparePassword(plain, hashed) {
    return bcrypt.compare(plain, hashed);
  },
};

module.exports = UserModel;
