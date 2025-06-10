'use client';

import { useEffect, useState } from 'react';

interface AdminStats {
  user_stats: {
    total_users: number;
    paid_users: number;
    free_users: number;
    new_users_last_week: number;
    new_users_last_month: number;
  };
  usage_stats: {
    total_operations: number;
    total_tokens_used: number;
    avg_tokens_per_operation: number;
    active_users: number;
    image_generations: number;
    video_generations: number;
    audio_generations: number;
    text_analyses: number;
    memu_chats: number;
  };
  revenue_stats: {
    paying_customers: number;
    total_revenue: number;
    avg_transaction_value: number;
    total_purchases: number;
    total_refunds: number;
    refund_count: number;
  };
  daily_trends: Array<{
    date: string;
    daily_active_users: number;
    total_operations: number;
    tokens_consumed: number;
    images_generated: number;
    videos_generated: number;
  }>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch_admin_stats();
  }, []);

  const fetch_admin_stats = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      
      if (!response.ok) {
        throw new Error('Failed to fetch admin stats');
      }
      
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="alert alert-error">
        <span>{error || 'Failed to load admin dashboard'}</span>
      </div>
    );
  }

  // Format date for display
  const format_date = (date_string: string) => {
    return new Date(date_string).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      {/* User Stats */}
      <div className="stats shadow w-full">
        <div className="stat">
          <div className="stat-figure text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <div className="stat-title">Total Users</div>
          <div className="stat-value">{stats.user_stats.total_users.toLocaleString()}</div>
          <div className="stat-desc">
            {stats.user_stats.new_users_last_week} new this week
          </div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="stat-title">Paid Users</div>
          <div className="stat-value">{stats.user_stats.paid_users.toLocaleString()}</div>
          <div className="stat-desc">
            {((stats.user_stats.paid_users / stats.user_stats.total_users) * 100).toFixed(1)}% conversion
          </div>
        </div>
        
        <div className="stat">
          <div className="stat-figure text-accent">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div className="stat-title">Active Users</div>
          <div className="stat-value">{stats.usage_stats.active_users.toLocaleString()}</div>
          <div className="stat-desc">Last 30 days</div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Usage Statistics (Last 30 Days)</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {stats.usage_stats.image_generations.toLocaleString()}
              </div>
              <div className="text-sm opacity-70">Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {stats.usage_stats.video_generations.toLocaleString()}
              </div>
              <div className="text-sm opacity-70">Videos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                {stats.usage_stats.audio_generations.toLocaleString()}
              </div>
              <div className="text-sm opacity-70">Audio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-info">
                {stats.usage_stats.text_analyses.toLocaleString()}
              </div>
              <div className="text-sm opacity-70">Text Analysis</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-warning">
                {stats.usage_stats.memu_chats.toLocaleString()}
              </div>
              <div className="text-sm opacity-70">MEMU Chats</div>
            </div>
          </div>
          
          <div className="divider"></div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm opacity-70">Total Operations</div>
              <div className="text-xl font-bold">
                {stats.usage_stats.total_operations.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm opacity-70">Tokens Consumed</div>
              <div className="text-xl font-bold">
                {(stats.usage_stats.total_tokens_used / 1000000).toFixed(2)}M
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Stats */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Revenue (Last 30 Days)</h2>
          <div className="stats stats-vertical lg:stats-horizontal shadow">
            <div className="stat">
              <div className="stat-title">Total Revenue</div>
              <div className="stat-value text-success">
                ${stats.revenue_stats.total_revenue?.toFixed(2) || '0.00'}
              </div>
              <div className="stat-desc">
                {stats.revenue_stats.total_purchases} purchases
              </div>
            </div>
            
            <div className="stat">
              <div className="stat-title">Average Transaction</div>
              <div className="stat-value text-primary">
                ${stats.revenue_stats.avg_transaction_value?.toFixed(2) || '0.00'}
              </div>
              <div className="stat-desc">Per purchase</div>
            </div>
            
            <div className="stat">
              <div className="stat-title">Refunds</div>
              <div className="stat-value text-error">
                ${stats.revenue_stats.total_refunds?.toFixed(2) || '0.00'}
              </div>
              <div className="stat-desc">
                {stats.revenue_stats.refund_count} refunds
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Trends Table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title mb-4">30-Day Activity Trends</h2>
          <div className="overflow-x-auto">
            <table className="table table-compact w-full">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Daily Active Users</th>
                  <th>Operations</th>
                  <th>Tokens Used</th>
                  <th>Images</th>
                  <th>Videos</th>
                </tr>
              </thead>
              <tbody>
                {stats.daily_trends.slice(0, 10).map((trend, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-base-200' : ''}>
                    <td>{format_date(trend.date)}</td>
                    <td className="font-mono">{trend.daily_active_users}</td>
                    <td className="font-mono">{trend.total_operations}</td>
                    <td className="font-mono">{(trend.tokens_consumed / 1000).toFixed(1)}K</td>
                    <td className="font-mono">{trend.images_generated}</td>
                    <td className="font-mono">{trend.videos_generated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {stats.daily_trends.length > 10 && (
              <div className="text-center mt-4 text-sm opacity-70">
                Showing most recent 10 days of {stats.daily_trends.length} days total
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}