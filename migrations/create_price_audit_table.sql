/**
 * Migration: Create price_audit table to track price changes
 * Run this in Supabase SQL Editor
 */

-- Create price_audit table to track all price changes
CREATE TABLE IF NOT EXISTS public.price_audit (
    id BIGSERIAL PRIMARY KEY,
    cod_ofer INTEGER NOT NULL REFERENCES property_metadata(cod_ofer) ON DELETE CASCADE,
    old_price INTEGER,
    new_price INTEGER NOT NULL,
    price_change INTEGER, -- NEW - OLD
    percentage_change NUMERIC(5,2), -- ((NEW - OLD) / OLD) * 100
    changed_by TEXT DEFAULT 'system', -- 'system' for auto-sync, or admin email
    changed_at TIMESTAMPTZ DEFAULT now(),
    notes TEXT -- Optional notes about the change
);

-- Add index for fast queries
CREATE INDEX IF NOT EXISTS idx_price_audit_cod_ofer ON public.price_audit(cod_ofer DESC);
CREATE INDEX IF NOT EXISTS idx_price_audit_changed_at ON public.price_audit(changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_price_audit_price_change ON public.price_audit(price_change);

-- RLS
ALTER TABLE public.price_audit ENABLE ROW LEVEL SECURITY;

-- Anyone can read price history
CREATE POLICY "Allow all read price_audit" ON public.price_audit FOR SELECT USING (true);

-- Only system can insert
CREATE POLICY "Allow service role insert price_audit" ON public.price_audit 
  FOR INSERT 
  WITH CHECK (true)
  USING (auth.role() = 'service_role' OR current_setting('request.jwt.claims', true)::jsonb->>'role' = 'authenticated');

-- Comments for clarity
COMMENT ON TABLE public.price_audit IS 'Audit trail for all property price changes';
COMMENT ON COLUMN public.price_audit.price_change IS 'New price minus old price (positive = increase, negative = decrease)';
COMMENT ON COLUMN public.price_audit.percentage_change IS 'Percentage change in price ((new - old) / old * 100)';
