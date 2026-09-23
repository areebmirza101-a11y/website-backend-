const supabase = require('../config/supabase');

const PageViewModel = {
  async create(data) {
    const { data: row, error } = await supabase
      .from('page_views')
      .insert(data)
      .select('*')
      .single();
    if (error) throw error;
    return row;
  },

  // All views since a given ISO timestamp (used to build traffic time series
  // and the country breakdown).
  async findSince(sinceIso) {
    const { data, error } = await supabase
      .from('page_views')
      .select('path, visitor_id, session_id, referrer, country, ip, created_at')
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async count() {
    const { count, error } = await supabase
      .from('page_views')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  },
};

module.exports = PageViewModel;
