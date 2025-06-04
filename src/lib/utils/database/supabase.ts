import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

let service_role_client: SupabaseClient | null = null
let anon_client: SupabaseClient | null = null

/**
 * Get Supabase service role client (server-side only)
 * @returns Supabase client with service role key
 */
export function get_service_role_client(): SupabaseClient {
  if (!service_role_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Supabase service configuration missing')
    }

    service_role_client = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return service_role_client
}

/**
 * Get Supabase anon client (can be used client-side)
 * @returns Supabase client with anon key
 */
export function get_anon_client(): SupabaseClient {
  if (!anon_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      throw new Error('Supabase anon configuration missing')
    }

    anon_client = createClient(url, key)
  }

  return anon_client
}

/**
 * Execute database operation with error handling
 * @param operation - Async database operation
 * @returns Result or throws formatted error
 */
export async function execute_db_operation<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T> {
  const { data, error } = await operation()
  
  if (error) {
    console.error('Database operation failed:', error)
    throw new Error(`Database error: ${error.message}`)
  }
  
  if (!data) {
    throw new Error('No data returned from database')
  }
  
  return data
}