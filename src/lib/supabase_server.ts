import { auth } from '@clerk/nextjs/server';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Server-side Supabase client with Clerk integration
export async function create_clerk_supabase_client_ssr(): Promise<SupabaseClient> {
  const auth_obj = await auth();
  const clerk_token = await auth_obj.getToken({ template: 'supabase' });
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${clerk_token}`,
        },
      },
    }
  );
} 