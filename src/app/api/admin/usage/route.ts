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
    
    const supabase = create_service_role_client();
    
    let query = supabase
      .from('usage')
      .select(`
        operation_type,
        tokens_used,
        created_at,
        details,
        users!inner (
          email
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

    // Transform the data to flatten the user email
    const usage_data = data?.map((item: {
      operation_type: string;
      tokens_used: number;
      created_at: string;
      details: Record<string, unknown>;
      users?: { email: string };
    }) => ({
      ...item,
      user_email: item.users?.email || 'Unknown'
    })) || [];

    return NextResponse.json({ usage: usage_data });
  } catch (error) {
    console.error('Error fetching usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}