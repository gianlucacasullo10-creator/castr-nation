import { createClient } from '@supabase/supabase-js';

// Hardcoding these values to resolve the "Invalid API key" connection issue
const supabaseUrl = "https://fmgpbsowzwxhchedzpur.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZtZ3Bic293end4aGNoZWR6cHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NjA5MjAsImV4cCI6MjA4NDQzNjkyMH0.nPreEE5kKs3i6klS7bIplb6W1fWs_NjTtl2e6sEhcAQ";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
