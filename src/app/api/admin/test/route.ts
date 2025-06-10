import { NextResponse } from 'next/server';
import { create_service_role_client } from '@/lib/supabase_server';
import { check_admin_access } from '@/lib/utils/api/admin';

export async function GET() {
  try {
    // Test 1: Check admin access
    const admin_check = await check_admin_access();
    
    // Test 2: Try to query users table directly
    const supabase = create_service_role_client();
    const { data: users, error: users_error } = await supabase
      .from('users')
      .select('*')
      .limit(5);

    // Test 3: Try to query subscriptions table
    const { data: subscriptions, error: subs_error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(5);

    return NextResponse.json({
      admin_check,
      users: {
        data: users,
        error: users_error?.message || null
      },
      subscriptions: {
        data: subscriptions,
        error: subs_error?.message || null
      },
      env_check: {
        has_supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        has_anon_key: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        has_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : null
    }, { status: 500 });
  }
}