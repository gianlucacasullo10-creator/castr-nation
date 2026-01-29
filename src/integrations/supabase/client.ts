import { createClient } from '@supabase/supabase-js';

// These must match the names in your Vercel screenshot exactly
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// This line will fail if the keys above are empty or wrong
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
