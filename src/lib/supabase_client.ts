import { createClient } from '@supabase/supabase-js';

const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabase_anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase_client = createClient(supabase_url, supabase_anon_key); 