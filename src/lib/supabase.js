import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "Missing Supabase environment variables. " +
    "Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY variables in your production environment."
  );
}

// Ensure the app doesn't crash during build or startup if env vars are missing
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    realtime: { params: { eventsPerSecond: 10 } }
  }
);
