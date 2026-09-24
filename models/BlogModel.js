const supabase = require('../config/supabase');

class BlogModel {
  async getAll(includeDrafts = false) {
    let query = supabase.from('blogs').select('*').order('created_at', { ascending: false });
    if (!includeDrafts) {
      query = query.eq('is_published', true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getBySlug(slug, includeDrafts = false) {
    let query = supabase.from('blogs').select('*').eq('slug', slug).single();
    if (!includeDrafts) {
      // If we only want published, this will fail if it's a draft
      query = query.eq('is_published', true);
    }
    const { data, error } = await query;
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is not found
    return data;
  }

  async getById(id) {
    const { data, error } = await supabase.from('blogs').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async create(blogData) {
    const { data, error } = await supabase
      .from('blogs')
      .insert([blogData])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id, blogData) {
    // Add updated_at
    blogData.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('blogs')
      .update(blogData)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id) {
    const { error } = await supabase
      .from('blogs')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return true;
  }
}

module.exports = new BlogModel();
