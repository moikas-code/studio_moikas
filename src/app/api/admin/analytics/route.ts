import { NextResponse } from 'next/server';
import { require_admin_access, get_admin_analytics } from '@/lib/utils/api/admin';

export async function GET() {
  // Check admin access
  const admin_error = await require_admin_access();
  if (admin_error) {
    return admin_error;
  }

  try {
    const analytics = await get_admin_analytics();
    
    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error fetching admin analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}