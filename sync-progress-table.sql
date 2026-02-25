-- Create sync progress tracking table
CREATE TABLE IF NOT EXISTS sync_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    last_synced_cod_ofer INTEGER,
    total_synced INTEGER DEFAULT 0,
    last_sync_at TIMESTAMPTZ DEFAULT now(),
    status TEXT DEFAULT 'idle', -- 'idle' | 'syncing' | 'error'
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE sync_progress ENABLE ROW LEVEL SECURITY;

-- Allow public (anon) read
CREATE POLICY IF NOT EXISTS "Allow public read sync_progress" ON sync_progress 
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update (for server-side sync)
CREATE POLICY IF NOT EXISTS "Allow authenticated insert sync_progress" ON sync_progress 
    FOR INSERT WITH CHECK (true);

-- Allow service role (Vercel/API) to write
CREATE POLICY IF NOT EXISTS "Allow service role all sync_progress" ON sync_progress 
    FOR ALL USING (true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sync_progress_last_sync ON sync_progress(last_sync_at DESC);

-- Verify the table was created correctly
-- SELECT * FROM sync_progress LIMIT 1;
