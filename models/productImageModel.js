const supabase = require('../config/supabase');

const ProductImageModel = {
  async findAll() {
    const { data, error } = await supabase.from('product_images').select('*');
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase.from('product_images').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async findByProductId(productId) {
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async create(data) {
    const { data: row, error } = await supabase.from('product_images').insert(data).select('*').single();
    if (error) throw error;
    return row;
  },

  async bulkCreate(list) {
    const { data, error } = await supabase.from('product_images').insert(list).select('*');
    if (error) throw error;
    return data || [];
  },

  async update(id, data) {
    const { data: row, error } = await supabase
      .from('product_images')
      .update(data)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return row;
  },

  async delete(id) {
    const { error } = await supabase.from('product_images').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteByProductId(productId) {
    const { error } = await supabase.from('product_images').delete().eq('product_id', productId);
    if (error) throw error;
  },
};

module.exports = ProductImageModel;
