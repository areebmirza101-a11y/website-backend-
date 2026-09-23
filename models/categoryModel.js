const supabase = require('../config/supabase');

const CategoryModel = {
  async findAll(opts = {}) {
    let query = supabase.from('categories').select('*');
    if (opts.order) {
      const [field, dir] = opts.order[0];
      query = query.order(field, { ascending: dir === 'ASC' });
    }
    const { data, error } = await query;
    if (error) throw error;
    let items = data || [];

    if (opts.include?.some(i => i.as === 'subcategories')) {
      const catIds = items.map(c => c.id);
      const { data: subs } = await supabase
        .from('categories')
        .select('*')
        .in('parent_id', catIds.length ? catIds : [-1]);

      const subsByParent = {};
      (subs || []).forEach(s => {
        if (!subsByParent[s.parent_id]) subsByParent[s.parent_id] = [];
        subsByParent[s.parent_id].push({ ...s });
      });

      items = items.map(c => ({ ...c, subcategories: subsByParent[c.id] || [] }));
    }

    return items;
  },

  async findById(id) {
    const { data, error } = await supabase.from('categories').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async findBySlug(slug) {
    const { data, error } = await supabase.from('categories').select('*').eq('slug', slug).maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async findChildren(parentId) {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async findWithChildren() {
    const parents = await this.findAll({ order: [['name', 'ASC']] });
    const { data: children, error } = await supabase
      .from('categories')
      .select('*')
      .in('parent_id', parents.map((p) => p.id));
    if (error) throw error;
    const childMap = {};
    (children || []).forEach((c) => {
      if (!childMap[c.parent_id]) childMap[c.parent_id] = [];
      childMap[c.parent_id].push(c);
    });
    return parents.map((p) => ({ ...p, subcategories: childMap[p.id] || [] }));
  },

  async create({ name, description, slug, parent_id, bg_image, show_on_home }) {
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, description, slug, parent_id: parent_id || null, bg_image: bg_image || null, show_on_home: show_on_home ?? true })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
  },

  async count() {
    const { count, error } = await supabase.from('categories').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },
};

module.exports = CategoryModel;
