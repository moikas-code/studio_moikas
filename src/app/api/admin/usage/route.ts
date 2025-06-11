import { NextRequest, NextResponse } from 'next/server';
import { require_admin_access } from '@/lib/utils/api/admin';
import { create_service_role_client } from '@/lib/supabase_server';

export async function GET(request: NextRequest) {
  // Check admin access
  const admin_error = await require_admin_access();
  if (admin_error) {
    return admin_error;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const operation_type = searchParams.get('operation_type');
    const include_admin = searchParams.get('include_admin') !== 'false'; // Default to true
    const admin_only = searchParams.get('admin_only') === 'true';
    
    const supabase = create_service_role_client();
    
    // First, get usage data
    let usageQuery = supabase
      .from('usage')
      .select(`
        id,
        user_id,
        operation_type,
        tokens_used,
        created_at,
        description,
        metadata
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (operation_type && operation_type !== 'all') {
      usageQuery = usageQuery.eq('operation_type', operation_type);
    }

    const { data: usageData, error: usageError } = await usageQuery;

    if (usageError) {
      console.error('Usage query error:', usageError);
      throw usageError;
    }
    
    if (!usageData || usageData.length === 0) {
      console.log('No usage data found');
      return NextResponse.json({ 
        usage: [],
        stats: {
          total_usage: 0,
          total_revenue_usage: 0,
          admin_usage: 0,
          regular_usage: 0,
          operation_breakdown: {}
        }
      });
    }
    
    // Get unique user IDs
    const userIds = [...new Set(usageData.map(item => item.user_id))].filter(Boolean);
    
    // Fetch user details separately
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .in('id', userIds);
      
    if (usersError) {
      console.error('Users query error:', usersError);
      // Continue without user data
    }
    
    // Create a map of user data
    const usersMap = new Map((usersData || []).map(user => [user.id, user]));
    
    // Transform and filter the data
    let usage_data: any[] = [];
    
    try {
      usage_data = usageData.map((item) => {
        const user = usersMap.get(item.user_id) || { email: 'Unknown', role: 'user' };
        const metadata = (item.metadata as Record<string, unknown>) || {};
        const is_admin_usage = metadata.is_admin_usage === true;
        const user_is_admin = user.role === 'admin';
        const counted_as_plan = (metadata.counted_as_plan as string) || 'unknown';
        
        return {
          operation_type: item.operation_type || 'unknown',
          tokens_used: item.tokens_used || 0,
          created_at: item.created_at || new Date().toISOString(),
          description: item.description || '',
          metadata: item.metadata || {},
          user_email: user.email,
          user_role: user.role,
          is_admin_usage,
          user_is_admin,
          counted_as_plan,
          effective_cost: is_admin_usage ? 0 : (item.tokens_used || 0) // Admin usage doesn't count toward revenue
        };
      });
    } catch (mapError) {
      console.error('Error mapping usage data:', mapError);
      throw new Error('Failed to process usage data');
    }

    // Apply filtering based on admin preferences
    if (admin_only) {
      usage_data = usage_data.filter(item => item.is_admin_usage || item.user_is_admin);
    } else if (!include_admin) {
      usage_data = usage_data.filter(item => !item.is_admin_usage && !item.user_is_admin);
    }

    // Calculate summary stats
    const stats = {
      total_usage: usage_data.reduce((sum, item) => sum + (item.tokens_used || 0), 0),
      total_revenue_usage: usage_data.reduce((sum, item) => sum + (item.effective_cost || 0), 0),
      admin_usage: usage_data.filter(item => item.is_admin_usage).reduce((sum, item) => sum + (item.tokens_used || 0), 0),
      regular_usage: usage_data.filter(item => !item.is_admin_usage).reduce((sum, item) => sum + (item.tokens_used || 0), 0),
      operation_breakdown: usage_data.reduce((acc, item) => {
        const op_type = item.operation_type || 'unknown';
        acc[op_type] = (acc[op_type] || 0) + (item.tokens_used || 0);
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({ 
      usage: usage_data,
      stats 
    });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}