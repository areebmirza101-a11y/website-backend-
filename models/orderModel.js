const supabase = require('../config/supabase');

const OrderModel = {
  async findAll(opts = {}) {
    let query = supabase.from('orders').select('*');
    const where = opts.where || {};
    if (where.user_id) query = query.eq('user_id', where.user_id);
    if (opts.order) {
      const [field, dir] = opts.order[0];
      query = query.order(field, { ascending: dir === 'ASC' });
    }
    const { data, error } = await query;
    if (error) throw error;
    let items = data || [];

    if (opts.include?.some(i => i.as === 'items')) {
      const orderIds = items.map(o => o.id);
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('*')
        .in('order_id', orderIds.length ? orderIds : [-1]);

      const itemsByOrder = {};
      (orderItems || []).forEach(it => {
        if (!itemsByOrder[it.order_id]) itemsByOrder[it.order_id] = [];
        itemsByOrder[it.order_id].push({ ...it });
      });

      items = items.map(o => ({ ...o, items: itemsByOrder[o.id] || [] }));
    }

    return items;
  },

  async findById(id) {
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async create(data) {
    const { data: row, error } = await supabase.from('orders').insert(data).select('*').single();
    if (error) throw error;
    return row;
  },

  async update(id, data) {
    const { data: row, error } = await supabase
      .from('orders')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return row;
  },

  async count(where = {}) {
    let query = supabase.from('orders').select('*', { count: 'exact', head: true });
    if (where.user_id) query = query.eq('user_id', where.user_id);
    const { count, error } = await query;
    if (error) throw error;
    return count || 0;
  },
};

module.exports = OrderModel;
