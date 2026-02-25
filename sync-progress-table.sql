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

-- Allow public read
CREATE POLICY "Allow public read sync_progress" ON sync_progress FOR SELECT USING (true);

-- Allow all for system updates
CREATE POLICY "Allow all for sync_progress" ON sync_progress FOR ALL USING (true);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_sync_progress_last_sync ON sync_progress(last_sync_at DESC);
