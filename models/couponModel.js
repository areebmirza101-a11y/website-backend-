const supabase = require('../config/supabase');

const CouponModel = {
  async findAll() {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('applies_to', 'coupon')
      .order('id', { ascending: false });
    if (error) throw error;
    return (data || []).map(this.mapToCoupon);
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', id)
      .eq('applies_to', 'coupon')
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapToCoupon(data) : null;
  },

  async findByCode(rawCode) {
    if (!rawCode) return null;
    const clean = String(rawCode).trim().toUpperCase();
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('applies_to', 'coupon')
      .ilike('banner_title', clean)
      .maybeSingle();
    if (error) throw error;
    return data ? this.mapToCoupon(data) : null;
  },

  async create(payload) {
    const code = String(payload.code || payload.banner_title || '').trim().toUpperCase();
    const minOrder = parseFloat(payload.min_order_amount || 0) || 0;
    const record = {
      name: payload.name || `${code} Promo Code`,
      banner_title: code,
      banner_subtitle: minOrder > 0 ? `Min order $${minOrder}` : 'No minimum spend',
      discount_type: payload.discount_type === 'flat' || payload.discount_type === 'fixed' ? 'flat' : 'percentage',
      discount_value: parseFloat(payload.discount_value) || 0,
      applies_to: 'coupon',
      target_ids: minOrder > 0 ? [Math.round(minOrder)] : [],
      start_date: payload.start_date ? new Date(payload.start_date).toISOString() : null,
      end_date: payload.end_date ? new Date(payload.end_date).toISOString() : null,
      active: payload.active !== undefined ? Boolean(payload.active) : true,
    };

    const { data, error } = await supabase.from('promotions').insert(record).select('*').single();
    if (error) throw error;
    return this.mapToCoupon(data);
  },

  async update(id, payload) {
    const updates = { updated_at: new Date().toISOString() };
    if (payload.code) updates.banner_title = String(payload.code).trim().toUpperCase();
    if (payload.name) updates.name = payload.name;
    if (payload.discount_type) {
      updates.discount_type = payload.discount_type === 'flat' || payload.discount_type === 'fixed' ? 'flat' : 'percentage';
    }
    if (payload.discount_value !== undefined) updates.discount_value = parseFloat(payload.discount_value) || 0;
    if (payload.min_order_amount !== undefined) {
      const minOrder = parseFloat(payload.min_order_amount) || 0;
      updates.banner_subtitle = minOrder > 0 ? `Min order $${minOrder}` : 'No minimum spend';
      updates.target_ids = minOrder > 0 ? [Math.round(minOrder)] : [];
    }
    if (payload.start_date !== undefined) {
      updates.start_date = payload.start_date ? new Date(payload.start_date).toISOString() : null;
    }
    if (payload.end_date !== undefined) {
      updates.end_date = payload.end_date ? new Date(payload.end_date).toISOString() : null;
    }
    if (payload.active !== undefined) updates.active = Boolean(payload.active);

    const { data, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('id', id)
      .eq('applies_to', 'coupon')
      .select('*')
      .single();
    if (error) throw error;
    return this.mapToCoupon(data);
  },

  async delete(id) {
    const { error } = await supabase.from('promotions').delete().eq('id', id).eq('applies_to', 'coupon');
    if (error) throw error;
  },

  mapToCoupon(row) {
    let minOrder = 0;
    if (Array.isArray(row.target_ids) && row.target_ids.length > 0) {
      minOrder = Number(row.target_ids[0]) || 0;
    } else if (row.banner_subtitle && row.banner_subtitle.includes('$')) {
      const match = row.banner_subtitle.match(/\$([0-9.]+)/);
      if (match) minOrder = parseFloat(match[1]) || 0;
    }

    return {
      id: row.id,
      code: row.banner_title,
      name: row.name,
      discount_type: row.discount_type === 'flat' ? 'fixed' : 'percentage',
      discount_value: Number(row.discount_value),
      min_order_amount: minOrder,
      active: row.active,
      start_date: row.start_date,
      end_date: row.end_date,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  },
};

module.exports = CouponModel;

