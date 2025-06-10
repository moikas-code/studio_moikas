'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';

interface Transaction {
  id: string;
  user_email: string;
  operation: string;
  amount_cents: number;
  tokens_amount: number;
  description: string;
  created_at: string;
  stripe_payment_intent_id?: string;
}

interface RevenueStats {
  total_revenue: number;
  total_refunds: number;
  net_revenue: number;
  transaction_count: number;
  refund_count: number;
  average_transaction: number;
}

export default function AdminRevenuePage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<RevenueStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  const fetch_revenue_data = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('operation', filter);
      }

      const response = await fetch(`/api/admin/revenue?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data');
      }
      
      const data = await response.json();
      setTransactions(data.transactions);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetch_revenue_data();
  }, [filter, fetch_revenue_data]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Revenue Analytics</h1>

      {/* Revenue Stats */}
      {stats && (
        <div className="stats shadow w-full">
          <div className="stat">
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-title">Total Revenue</div>
            <div className="stat-value text-success">
              ${(stats.total_revenue / 100).toFixed(2)}
            </div>
            <div className="stat-desc">{stats.transaction_count} transactions</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-error">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m0 0l-6-6m6 6H5a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V10a2 2 0 00-2-2h-5" />
              </svg>
            </div>
            <div className="stat-title">Refunds</div>
            <div className="stat-value text-error">
              ${(stats.total_refunds / 100).toFixed(2)}
            </div>
            <div className="stat-desc">{stats.refund_count} refunds</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div className="stat-title">Net Revenue</div>
            <div className="stat-value text-primary">
              ${(stats.net_revenue / 100).toFixed(2)}
            </div>
            <div className="stat-desc">
              Avg: ${(stats.average_transaction / 100).toFixed(2)}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="form-control w-full max-w-xs">
        <label className="label">
          <span className="label-text">Transaction Type</span>
        </label>
        <select 
          className="select select-bordered"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Transactions</option>
          <option value="token_purchase">Purchases</option>
          <option value="token_refund">Refunds</option>
        </select>
      </div>

      {/* Transactions Table */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : error ? (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Date</th>
                <th>User</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Tokens</th>
                <th>Description</th>
                <th>Stripe ID</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>
                    <div className="text-sm">
                      {format(new Date(transaction.created_at), 'MMM d, yyyy HH:mm')}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm truncate max-w-[200px]">
                      {transaction.user_email}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-sm ${
                      transaction.operation === 'token_purchase' ? 'badge-success' : 'badge-error'
                    }`}>
                      {transaction.operation === 'token_purchase' ? 'Purchase' : 'Refund'}
                    </span>
                  </td>
                  <td>
                    <div className={`font-mono text-sm ${
                      transaction.operation === 'token_purchase' ? 'text-success' : 'text-error'
                    }`}>
                      {transaction.operation === 'token_purchase' ? '+' : '-'}
                      ${(transaction.amount_cents / 100).toFixed(2)}
                    </div>
                  </td>
                  <td>
                    <div className="font-mono text-sm">
                      {transaction.tokens_amount.toLocaleString()} MP
                    </div>
                  </td>
                  <td>
                    <div className="text-sm max-w-[200px] truncate">
                      {transaction.description}
                    </div>
                  </td>
                  <td>
                    {transaction.stripe_payment_intent_id && (
                      <div className="text-xs font-mono truncate max-w-[150px]">
                        {transaction.stripe_payment_intent_id}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}