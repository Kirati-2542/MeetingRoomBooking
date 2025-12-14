import { createClient } from '@supabase/supabase-js';

// NOTE: In a real Next.js app, use .env.local variables.
// For this standalone React demo, we rely on the environment variables being present.
// However, to prevent crashes in previews without .env, we implement a fallback.

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Check local storage for overrides/fallback (allows UI-based config)
const localUrl = typeof window !== 'undefined' ? localStorage.getItem('sb_url') : null;
const localKey = typeof window !== 'undefined' ? localStorage.getItem('sb_key') : null;

// Use Env vars first, then local storage, then dummy to prevent crash
// createClient throws error if url is empty
const supabaseUrl = envUrl || localUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = envKey || localKey || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = () => {
  return (!!envUrl && !!envKey) || (!!localUrl && !!localKey);
};
