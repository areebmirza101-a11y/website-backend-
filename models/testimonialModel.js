const supabase = require('../config/supabase');

const TestimonialModel = {
  async findAll() {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async findById(id) {
    const { data, error } = await supabase
      .from('testimonials')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data || null;
  },

  async create(testimonialData) {
    const { data, error } = await supabase
      .from('testimonials')
      .insert({
        name: testimonialData.name,
        role: testimonialData.role,
        subject: testimonialData.subject,
        content: testimonialData.content,
        image_url: testimonialData.image_url
      })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async update(id, updates) {
    const { data, error } = await supabase
      .from('testimonials')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id) {
    const { error } = await supabase
      .from('testimonials')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};

module.exports = TestimonialModel;
