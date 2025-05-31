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

// Service role client for server-side operations that bypass RLS
export function create_service_role_client(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  );
} 