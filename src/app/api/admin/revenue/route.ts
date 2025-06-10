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
    const operation = searchParams.get('operation');
    
    const supabase = create_service_role_client();
    
    let query = supabase
      .from('revenue_transactions')
      .select(`
        id,
        operation,
        amount_cents,
        tokens_amount,
        description,
        created_at,
        stripe_payment_intent_id,
        users!inner (
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100);

    if (operation && operation !== 'all') {
      query = query.eq('operation', operation);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Transform the data to flatten the user email
    const transactions = data?.map((item: {
      id: string;
      operation: string;
      amount_cents: number;
      tokens_amount: number;
      description: string;
      created_at: string;
      stripe_payment_intent_id?: string;
      users?: { email: string };
    }) => ({
      ...item,
      user_email: item.users?.email || 'Unknown'
    })) || [];

    // Calculate stats
    const stats = {
      total_revenue: 0,
      total_refunds: 0,
      net_revenue: 0,
      transaction_count: 0,
      refund_count: 0,
      average_transaction: 0
    };

    transactions.forEach((t: typeof transactions[0]) => {
      if (t.operation === 'token_purchase') {
        stats.total_revenue += t.amount_cents;
        stats.transaction_count++;
      } else if (t.operation === 'token_refund') {
        stats.total_refunds += t.amount_cents;
        stats.refund_count++;
      }
    });

    stats.net_revenue = stats.total_revenue - stats.total_refunds;
    stats.average_transaction = stats.transaction_count > 0 
      ? stats.total_revenue / stats.transaction_count 
      : 0;

    return NextResponse.json({ 
      transactions,
      stats 
    });
  } catch (error) {
    console.error('Error fetching revenue data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue data' },
      { status: 500 }
    );
  }
}