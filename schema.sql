-- ============================================
-- BYZAN SIGNAGE - DATABASE SCHEMA
-- Jalankan di Supabase SQL Editor
-- ============================================

-- Institutions
CREATE TABLE IF NOT EXISTS institutions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Screens
CREATE TABLE IF NOT EXISTS screens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  screen_key TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos
CREATE TABLE IF NOT EXISTS videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'education',
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlists
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Playlist Items
CREATE TABLE IF NOT EXISTS playlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  display_duration_seconds INTEGER NOT NULL DEFAULT 30,
  loop_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedules
CREATE TABLE IF NOT EXISTS schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  repeat_type TEXT DEFAULT 'none',
  repeat_days INTEGER[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Play Logs
CREATE TABLE IF NOT EXISTS play_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  screen_id UUID REFERENCES screens(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  played_at TIMESTAMPTZ DEFAULT NOW(),
  duration_played_seconds INTEGER DEFAULT 0
);

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT DO NOTHING;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_logs ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users full access (simplify for now)
CREATE POLICY "auth_all_institutions" ON institutions FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_screens" ON screens FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_videos" ON videos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_playlists" ON playlists FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_playlist_items" ON playlist_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_schedules" ON schedules FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "auth_all_play_logs" ON play_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow anonymous read for display page
CREATE POLICY "anon_read_screens" ON screens FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_schedules" ON schedules FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_playlists" ON playlists FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_playlist_items" ON playlist_items FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read_videos" ON videos FOR SELECT TO anon USING (true);
CREATE POLICY "anon_update_screens" ON screens FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Storage policy
CREATE POLICY "public_read_videos" ON storage.objects FOR SELECT TO public USING (bucket_id = 'videos');
CREATE POLICY "auth_upload_videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'videos');
CREATE POLICY "auth_delete_videos" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'videos');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE schedules;
ALTER PUBLICATION supabase_realtime ADD TABLE screens;
