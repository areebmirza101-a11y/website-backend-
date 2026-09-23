const supabase = require('../config/supabase');

const ProductModel = {
  async findAll(opts = {}) {
    let query = supabase.from('products').select('*', { count: 'exact' });
    const where = opts.where || {};

    if (where.active !== undefined) query = query.eq('active', where.active);
    if (where.featured !== undefined) query = query.eq('featured', where.featured);
    if (where.show_in_hero !== undefined) query = query.eq('show_in_hero', where.show_in_hero);
    if (where.category_id) query = query.eq('category_id', where.category_id);
    if (where.id) query = query.eq('id', where.id);
    if (where.slug) query = query.eq('slug', where.slug);
    if (where.sku) query = query.eq('sku', where.sku);
    if (where.name && where.name.ilike) query = query.ilike('name', where.name.ilike);

    const { data, error, count } = await query;
    if (error) throw error;

    let items = data || [];

    if (opts.include?.some(i => i.as === 'images')) {
      const productIds = items.map(p => p.id);
      const { data: imgs } = await supabase
        .from('product_images')
        .select('*')
        .in('product_id', productIds.length ? productIds : [-1]);

      const imagesByProduct = {};
      (imgs || []).forEach(img => {
        if (!imagesByProduct[img.product_id]) imagesByProduct[img.product_id] = [];
        imagesByProduct[img.product_id].push({ ...img });
      });

      items = items.map(p => ({ ...p, images: imagesByProduct[p.id] || [] }));
    }

    if (opts.include?.some(i => i.as === 'category')) {
      const catInclude = opts.include.find(i => i.as === 'category');
      if (catInclude?.where?.slug) {
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .eq('slug', catInclude.where.slug)
          .maybeSingle();
        items = items.map(p => ({ ...p, category: cats || null }));
      } else {
        const catIds = [...new Set(items.map(p => p.category_id).filter(Boolean))];
        let cats = [];
        if (catIds.length) {
          const { data } = await supabase.from('categories').select('*').in('id', catIds);
          cats = data || [];
        }
        const catMap = {};
        cats.forEach(c => (catMap[c.id] = c));
        items = items.map(p => ({ ...p, category: catMap[p.category_id] || null }));
      }
    }

    if (opts.include?.some(i => i.as === 'size_guide')) {
      const guideIds = [...new Set(items.map(p => p.size_guide_id).filter(Boolean))];
      let guides = [];
      if (guideIds.length) {
        const { data } = await supabase.from('size_guides').select('*').in('id', guideIds);
        guides = data || [];
      }
      const guideMap = {};
      guides.forEach(g => (guideMap[g.id] = g));
      items = items.map(p => ({ ...p, size_guide: guideMap[p.size_guide_id] || null }));
    }

    if (opts.order) {
      const [field, dir] = opts.order[0];
      items = [...items].sort((a, b) => {
        const av = a[field] || '';
        const bv = b[field] || '';
        return dir === 'DESC' ? String(bv).localeCompare(String(av)) : String(av).localeCompare(String(bv));
      });
    }

    const total = count || items.length;
    const hasPagination = opts.limit || opts.page || opts.offset;
    if (!hasPagination) return items;

    const page = parseInt(opts.page || 1, 10);
    const limit = parseInt(opts.limit || 12, 10);
    const offset = parseInt(opts.offset || 0, 10);
    const rows = items.slice(offset, offset + limit);

    return { rows, count: total, page, pages: Math.ceil(total / limit) };
  },

  async findOne(opts) {
    const result = await this.findAll(opts);
    if (Array.isArray(result)) return result[0] || null;
    return result.rows[0] || null;
  },

  async findById(id) {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async findBySlug(slug) {
    const { data, error } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async findBySku(sku) {
    const { data, error } = await supabase.from('products').select('*').eq('sku', sku).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async create(data) {
    const { data: row, error } = await supabase.from('products').insert(data).select('*').single();
    if (error) throw error;
    return row;
  },

  async update(id, data) {
    const { data: row, error } = await supabase
      .from('products')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return row;
  },

  async delete(id) {
    await supabase.from('product_images').delete().eq('product_id', id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },

  async count(where = {}) {
    const result = await this.findAll({ where });
    return Array.isArray(result) ? result.length : result.rows.length;
  },

  async increment(field, { by = 1, where = {} }) {
    const { data, error } = await supabase.from('products').select(field).eq('id', where.id).maybeSingle();
    if (error || !data) return;
    const current = parseFloat(data[field]) || 0;
    const { error: updateError } = await supabase
      .from('products')
      .update({ [field]: current + by, updated_at: new Date().toISOString() })
      .eq('id', where.id);
    if (updateError) throw updateError;
  },
};

module.exports = ProductModel;
