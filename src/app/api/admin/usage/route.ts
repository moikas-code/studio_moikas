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
    const include_admin = searchParams.get('include_admin') === 'true';
    const admin_only = searchParams.get('admin_only') === 'true';
    
    const supabase = create_service_role_client();
    
    let query = supabase
      .from('usage')
      .select(`
        operation_type,
        tokens_used,
        created_at,
        description,
        metadata,
        users!inner (
          email,
          role
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (operation_type && operation_type !== 'all') {
      query = query.eq('operation_type', operation_type);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform and filter the data
    let usage_data = data?.map((item: {
      operation_type: string;
      tokens_used: number;
      created_at: string;
      description: string;
      metadata: Record<string, unknown>;
      users: { email: string; role: string }[];
    }) => {
      const is_admin_usage = item.metadata?.is_admin_usage === true;
      const user_is_admin = item.users?.[0]?.role === 'admin';
      const counted_as_plan = item.metadata?.counted_as_plan || 'unknown';
      
      return {
        ...item,
        user_email: item.users?.[0]?.email || 'Unknown',
        user_role: item.users?.[0]?.role || 'user',
        is_admin_usage,
        user_is_admin,
        counted_as_plan,
        effective_cost: is_admin_usage ? 0 : item.tokens_used // Admin usage doesn't count toward revenue
      };
    }) || [];

    // Apply filtering based on admin preferences
    if (admin_only) {
      usage_data = usage_data.filter(item => item.is_admin_usage || item.user_is_admin);
    } else if (!include_admin) {
      usage_data = usage_data.filter(item => !item.is_admin_usage && !item.user_is_admin);
    }

    // Calculate summary stats
    const stats = {
      total_usage: usage_data.reduce((sum, item) => sum + item.tokens_used, 0),
      total_revenue_usage: usage_data.reduce((sum, item) => sum + item.effective_cost, 0),
      admin_usage: usage_data.filter(item => item.is_admin_usage).reduce((sum, item) => sum + item.tokens_used, 0),
      regular_usage: usage_data.filter(item => !item.is_admin_usage).reduce((sum, item) => sum + item.tokens_used, 0),
      operation_breakdown: usage_data.reduce((acc, item) => {
        acc[item.operation_type] = (acc[item.operation_type] || 0) + item.tokens_used;
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