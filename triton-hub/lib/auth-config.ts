export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
export const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
export const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey);
