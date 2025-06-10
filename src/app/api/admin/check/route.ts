import { NextResponse } from 'next/server';
import { check_admin_access } from '@/lib/utils/api/admin';

export async function GET() {
  const admin_check = await check_admin_access();
  
  return NextResponse.json({
    is_admin: admin_check.is_admin,
    user_id: admin_check.user_id
  });
}