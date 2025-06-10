import { NextRequest, NextResponse } from 'next/server';
import { require_admin_access, get_admin_user_list } from '@/lib/utils/api/admin';

export async function GET(request: NextRequest) {
  // Check admin access
  const admin_error = await require_admin_access();
  if (admin_error) {
    return admin_error;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || undefined;

    const result = await get_admin_user_list(page, limit, search);
    
    if (result.error) {
      throw result.error;
    }

    return NextResponse.json({
      users: result.users,
      total_count: result.total_count,
      page: result.page,
      limit: result.limit
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}