import { auth, currentUser } from '@clerk/nextjs/server'
import { get_service_role_client } from '../database/supabase'
import { api_error } from './response'

interface AuthUser {
  clerk_id: string
  user_id: string
  email?: string | null
}

/**
 * Ensure user exists in Supabase database
 * @param clerk_id - Clerk user ID
 * @param email - User's email address
 * @returns User ID
 */
export async function ensure_user_exists(clerk_id: string, email: string): Promise<string> {
  const supabase = get_service_role_client()
  
  // Check if user exists
  const { data: existing_user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_id', clerk_id)
    .single()
  
  if (existing_user) {
    return existing_user.id
  }
  
  // Create new user
  const { data: new_user, error: user_error } = await supabase
    .from('users')
    .insert({
      clerk_id,
      email,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single()
  
  if (user_error) {
    throw new Error(`Failed to create user: ${user_error.message}`)
  }
  
  // Create subscription for new user
  const { error: sub_error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: new_user.id,
      plan: 'free',
      renewable_tokens: 125,
      permanent_tokens: 0,
      created_at: new Date().toISOString()
    })
  
  if (sub_error) {
    console.error('Failed to create subscription:', sub_error)
  }
  
  return new_user.id
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
    const email = clerk_user?.emailAddresses[0]?.emailAddress
    
    if (!email) {
      console.error('No email found for authenticated user')
      return null
    }
    
    // Ensure user exists in database
    const user_id = await ensure_user_exists(userId, email)
    
    return {
      clerk_id: userId,
      user_id,
      email
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
  
  // Check if user is banned
  const supabase = get_service_role_client()
  const { data: user_data } = await supabase
    .from('users')
    .select('metadata')
    .eq('id', user.user_id)
    .single()
  
  if (user_data?.metadata?.banned) {
    throw api_error('Your account has been suspended for violating our Terms of Service', 403)
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
  
  // Admin users always have sufficient tokens
  if (subscription.plan === 'admin') {
    return true
  }
  
  const total_tokens = (subscription.renewable_tokens || 0) + 
                      (subscription.permanent_tokens || 0)
  
  return total_tokens >= required_tokens
}