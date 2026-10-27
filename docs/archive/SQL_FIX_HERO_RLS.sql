-- 🔧 Supabase SQL Console - Run this to fix hero_slides RLS issue

-- Step 1: Disable RLS on hero_slides table
ALTER TABLE public.hero_slides DISABLE ROW LEVEL SECURITY;

-- Step 2: Verify RLS is disabled  
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'hero_slides';

-- Step 3: Now try updating from your scripts/application

-- If you want to re-enable RLS later with proper policies:
-- ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "allow_public_read" ON public.hero_slides FOR SELECT USING (true);
-- CREATE POLICY "allow_authenticated_write" ON public.hero_slides FOR UPDATE TO authenticated USING (auth.uid() IN (SELECT user_id FROM admin_users));
