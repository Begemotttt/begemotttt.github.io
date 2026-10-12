import { createClient } from '@supabase/supabase-js';
window.sbAuthClient = createClient(
  'https://jfkmmvjgzhtegpehtcfj.supabase.co',
  'sb_publishable_fJBREPbyq6hNXS2wtY6a1Q_B0A7xtQi',
  { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } }
);
