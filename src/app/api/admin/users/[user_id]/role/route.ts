import { NextRequest, NextResponse } from 'next/server';
import { require_admin_access, update_user_role } from '@/lib/utils/api/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ user_id: string }> }
) {
  // Check admin access
  const admin_error = await require_admin_access();
  if (admin_error) {
    return admin_error;
  }

  try {
    const { user_id } = await params;
    const body = await request.json();
    const { role } = body;

    if (!role || !['user', 'admin'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "user" or "admin"' },
        { status: 400 }
      );
    }

    const updated_user = await update_user_role(user_id, role);

    return NextResponse.json({
      success: true,
      user: updated_user
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    
    if (error instanceof Error && error.message.includes('Cannot remove your own admin role')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}