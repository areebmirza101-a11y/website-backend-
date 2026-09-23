-- Page views table for lightweight, self-hosted website traffic analytics.
-- Every visit to a public page inserts one row via POST /api/track.

CREATE TABLE IF NOT EXISTS public.page_views (
  id BIGSERIAL PRIMARY KEY,
  path TEXT NOT NULL,
  visitor_id TEXT,            -- anonymous id kept in the browser (localStorage)
  session_id TEXT,            -- per-tab/session id (sessionStorage)
  referrer TEXT,
  user_agent TEXT,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON public.page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON public.page_views(path);
