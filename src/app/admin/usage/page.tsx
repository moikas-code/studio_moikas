'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';

interface UsageData {
  operation_type: string;
  user_email: string;
  user_role: string;
  tokens_used: number;
  created_at: string;
  description: string;
  metadata: Record<string, unknown>;
  is_admin_usage: boolean;
  user_is_admin: boolean;
  counted_as_plan: string;
  effective_cost: number;
}

interface UsageStats {
  total_usage: number;
  total_revenue_usage: number;
  admin_usage: number;
  regular_usage: number;
  operation_breakdown: Record<string, number>;
}

export default function AdminUsagePage() {
  const [usage_data, setUsageData] = useState<UsageData[]>([]);
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');
  const [admin_filter, setAdminFilter] = useState('all'); // 'all', 'admin_only', 'exclude_admin'

  const fetch_usage_data = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('operation_type', filter);
      }
      
      // Add admin filtering parameters
      if (admin_filter === 'admin_only') {
        params.append('admin_only', 'true');
      } else if (admin_filter === 'exclude_admin') {
        params.append('include_admin', 'false');
      } else {
        params.append('include_admin', 'true');
      }

      const response = await fetch(`/api/admin/usage?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }
      
      const data = await response.json();
      setUsageData(data.usage);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filter, admin_filter]);

  useEffect(() => {
    fetch_usage_data();
  }, [fetch_usage_data]);

  const operation_types = [
    { value: 'all', label: 'All Operations' },
    { value: 'image_generation', label: 'Image Generation' },
    { value: 'video_generation', label: 'Video Generation' },
    { value: 'audio_generation', label: 'Audio Generation' },
    { value: 'text_analysis', label: 'Text Analysis' },
    { value: 'memu_chat', label: 'MEMU Chat' }
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Usage Analytics</h1>

      {/* Stats Cards */}
      {stats && (
        <div className="stats shadow w-full">
          <div className="stat">
            <div className="stat-figure text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <div className="stat-title">Total Usage</div>
            <div className="stat-value text-primary">
              {(stats.total_usage / 1000).toFixed(1)}K MP
            </div>
            <div className="stat-desc">All user activity</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-success">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="stat-title">Revenue Usage</div>
            <div className="stat-value text-success">
              {(stats.total_revenue_usage / 1000).toFixed(1)}K MP
            </div>
            <div className="stat-desc">Paid user usage</div>
          </div>
          
          <div className="stat">
            <div className="stat-figure text-warning">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="stat-title">Admin Usage</div>
            <div className="stat-value text-warning">
              {(stats.admin_usage / 1000).toFixed(1)}K MP
            </div>
            <div className="stat-desc">Free admin testing</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">Operation Type</span>
          </label>
          <select 
            className="select select-bordered"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {operation_types.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="form-control w-full max-w-xs">
          <label className="label">
            <span className="label-text">User Filter</span>
          </label>
          <select 
            className="select select-bordered"
            value={admin_filter}
            onChange={(e) => setAdminFilter(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="exclude_admin">Regular Users Only</option>
            <option value="admin_only">Admin Users Only</option>
          </select>
        </div>
      </div>

      {/* Usage Table */}
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
                <th>Time</th>
                <th>User</th>
                <th>Operation</th>
                <th>Tokens Used</th>
                <th>Cost Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {usage_data.map((item, idx) => (
                <tr key={idx} className={item.is_admin_usage ? 'opacity-75' : ''}>
                  <td>
                    <div className="text-sm">
                      {format(new Date(item.created_at), 'MMM d, HH:mm')}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="text-sm truncate max-w-[200px]">
                        {item.user_email}
                      </div>
                      {item.user_is_admin && (
                        <span className="badge badge-xs badge-warning">ADMIN</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-sm ${
                      !item.operation_type ? 'badge-ghost' :
                      item.operation_type === 'image_generation' ? 'badge-primary' :
                      item.operation_type === 'video_generation' ? 'badge-secondary' :
                      item.operation_type === 'audio_generation' ? 'badge-accent' :
                      item.operation_type === 'text_analysis' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                      {item.operation_type?.replace('_', ' ') || 'unknown'}
                    </span>
                  </td>
                  <td>
                    <div className="font-mono text-sm">
                      {item.tokens_used.toLocaleString()} MP
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-xs ${
                      item.is_admin_usage ? 'badge-warning' : 
                      item.counted_as_plan === 'free' ? 'badge-info' :
                      item.counted_as_plan === 'standard' ? 'badge-success' :
                      'badge-neutral'
                    }`}>
                      {item.is_admin_usage ? 'FREE (Admin)' : 
                       (item.counted_as_plan || 'unknown').toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="text-sm max-w-[300px] truncate">
                      {item.description}
                    </div>
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