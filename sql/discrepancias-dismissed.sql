-- Table to track dismissed discrepancies between encargos and web data
-- so they don't show as warnings again in the admin panel.

CREATE TABLE IF NOT EXISTS discrepancias_dismissed (
  id SERIAL PRIMARY KEY,
  ref TEXT NOT NULL,
  campo TEXT NOT NULL,           -- 'precio', 'tipo', 'habitaciones', 'baños'
  valor_encargo TEXT NOT NULL,   -- the encargo value when dismissed
  valor_web TEXT NOT NULL,       -- the web value when dismissed
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(ref, campo, valor_encargo, valor_web)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_discrepancias_dismissed_ref ON discrepancias_dismissed(ref);
