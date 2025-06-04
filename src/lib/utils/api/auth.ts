import { auth, currentUser } from '@clerk/nextjs/server'
import { get_service_role_client } from '../database/supabase'
import { api_error } from './response'

interface AuthUser {
  clerk_id: string
  user_id: string
  email?: string | null
}

/**
 * Verify user authentication and get user details
 * @returns User details or null
 */
export async function get_authenticated_user(): Promise<AuthUser | null> {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return null
    }
    
    const clerk_user = await currentUser()
    const supabase = get_service_role_client()
    
    // Get user from database
    const { data: user_data, error } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single()
    
    if (error || !user_data) {
      console.error('User not found in database:', error)
      return null
    }
    
    return {
      clerk_id: userId,
      user_id: user_data.id,
      email: clerk_user?.emailAddresses[0]?.emailAddress
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

/**
 * Require authentication for API route
 * @returns User details or throws error response
 */
export async function require_auth(): Promise<AuthUser> {
  const user = await get_authenticated_user()
  
  if (!user) {
    throw api_error('Unauthorized', 401)
  }
  
  return user
}

/**
 * Get user's subscription details
 * @param user_id - Internal user ID
 * @returns Subscription data
 */
export async function get_user_subscription(user_id: string) {
  const supabase = get_service_role_client()
  
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user_id)
    .single()
  
  if (error) {
    throw new Error('Failed to fetch subscription')
  }
  
  return data
}

/**
 * Check if user has required tokens
 * @param user_id - Internal user ID
 * @param required_tokens - Number of tokens required
 * @returns boolean
 */
export async function has_sufficient_tokens(
  user_id: string,
  required_tokens: number
): Promise<boolean> {
  const subscription = await get_user_subscription(user_id)
  const total_tokens = (subscription.renewable_tokens || 0) + 
                      (subscription.permanent_tokens || 0)
  
  return total_tokens >= required_tokens
}