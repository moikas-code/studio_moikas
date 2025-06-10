import { auth } from '@clerk/nextjs/server';
import { create_service_role_client } from '@/lib/supabase_server';
import { NextResponse } from 'next/server';

export interface AdminCheckResult {
  is_admin: boolean;
  user_id: string | null;
  error?: string;
}

/**
 * Check if the current authenticated user is an admin
 */
export async function check_admin_access(): Promise<AdminCheckResult> {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return {
        is_admin: false,
        user_id: null,
        error: 'Not authenticated'
      };
    }

    const supabase = create_service_role_client();
    
    // Get user data with role
    const { data: user_data, error: user_error } = await supabase
      .from('users')
      .select('id, role')
      .eq('clerk_id', userId)
      .single();

    if (user_error || !user_data) {
      return {
        is_admin: false,
        user_id: null,
        error: 'User not found'
      };
    }

    return {
      is_admin: user_data.role === 'admin',
      user_id: user_data.id
    };
  } catch (error) {
    console.error('Error checking admin access:', error);
    return {
      is_admin: false,
      user_id: null,
      error: 'Internal error checking admin access'
    };
  }
}

/**
 * Middleware function to require admin access for API routes
 */
export async function require_admin_access() {
  const admin_check = await check_admin_access();
  
  if (!admin_check.is_admin) {
    return NextResponse.json(
      { 
        error: admin_check.error || 'Unauthorized - Admin access required',
        code: 'ADMIN_ACCESS_REQUIRED'
      },
      { status: 403 }
    );
  }
  
  return null; // Access granted
}

/**
 * Get admin analytics data from the database views
 */
export async function get_admin_analytics() {
  const admin_check = await check_admin_access();
  
  if (!admin_check.is_admin) {
    throw new Error('Admin access required');
  }

  const supabase = create_service_role_client();
  
  // Fetch all analytics data in parallel
  const [
    user_stats_result,
    usage_stats_result,
    revenue_stats_result,
    daily_trends_result
  ] = await Promise.all([
    supabase.from('admin_user_stats').select('*').single(),
    supabase.from('admin_usage_stats').select('*').single(),
    supabase.from('admin_revenue_stats').select('*').single(),
    supabase.from('admin_daily_usage_trends').select('*').limit(30)
  ]);

  return {
    user_stats: user_stats_result.data,
    usage_stats: usage_stats_result.data,
    revenue_stats: revenue_stats_result.data,
    daily_trends: daily_trends_result.data || [],
    errors: {
      user_stats: user_stats_result.error,
      usage_stats: usage_stats_result.error,
      revenue_stats: revenue_stats_result.error,
      daily_trends: daily_trends_result.error
    }
  };
}

/**
 * Get detailed user list for admin dashboard
 */
export async function get_admin_user_list(
  page: number = 1,
  limit: number = 50,
  search?: string
) {
  const admin_check = await check_admin_access();
  
  if (!admin_check.is_admin) {
    throw new Error('Admin access required');
  }

  const supabase = create_service_role_client();
  const offset = (page - 1) * limit;
  
  // First, get the users
  let query = supabase
    .from('users')
    .select('*', { count: 'exact' })
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`email.ilike.%${search}%,clerk_id.ilike.%${search}%`);
  }

  const { data: users, error, count } = await query;

  if (error) {
    console.error('Error fetching admin user list:', error);
    return {
      users: [],
      total_count: 0,
      page,
      limit,
      error
    };
  }

  // Get subscriptions for each user
  if (users && users.length > 0) {
    const userIds = users.map(u => u.id);
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .in('user_id', userIds);

    // Merge subscription data with users
    const usersWithSubscriptions = users.map(user => ({
      ...user,
      subscriptions: subscriptions?.filter(s => s.user_id === user.id) || []
    }));

    return {
      users: usersWithSubscriptions,
      total_count: count || 0,
      page,
      limit,
      error: null
    };
  }

  return {
    users: users || [],
    total_count: count || 0,
    page,
    limit,
    error: null
  };
}

/**
 * Update user role (admin action)
 */
export async function update_user_role(
  user_id: string,
  new_role: 'user' | 'admin'
) {
  const admin_check = await check_admin_access();
  
  if (!admin_check.is_admin) {
    throw new Error('Admin access required');
  }

  // Prevent admin from removing their own admin role
  if (admin_check.user_id === user_id && new_role !== 'admin') {
    throw new Error('Cannot remove your own admin role');
  }

  const supabase = create_service_role_client();
  
  const { data, error } = await supabase
    .from('users')
    .update({ role: new_role })
    .eq('id', user_id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Log the action
  await supabase
    .from('audit_log')
    .insert({
      user_id: admin_check.user_id,
      action: 'update_user_role',
      details: {
        target_user_id: user_id,
        new_role,
        old_role: data.role
      }
    });

  return data;
}