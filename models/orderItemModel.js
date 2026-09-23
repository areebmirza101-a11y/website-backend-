const supabase = require('../config/supabase');

const OrderItemModel = {
  async findAll() {
    const { data, error } = await supabase.from('order_items').select('*');
    if (error) throw error;
    return data || [];
  },

  async findByOrderId(orderId) {
    const { data, error } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId);
    if (error) throw error;
    return data || [];
  },

  async create(data) {
    const { data: row, error } = await supabase
      .from('order_items')
      .insert(data)
      .select('*')
      .single();
    if (error) throw error;
    return row;
  },

  async bulkCreate(list) {
    const { data: rows, error } = await supabase.from('order_items').insert(list).select('*');
    if (error) throw error;
    return rows || [];
  },

  async delete(id) {
    const { error } = await supabase.from('order_items').delete().eq('id', id);
    if (error) throw error;
  },
};

module.exports = OrderItemModel;
