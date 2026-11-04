ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paypal_capture_id TEXT;

