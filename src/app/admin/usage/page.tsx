'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';

interface UsageData {
  operation_type: string;
  user_email: string;
  tokens_used: number;
  created_at: string;
  details: Record<string, unknown>;
}

export default function AdminUsagePage() {
  const [usage_data, setUsageData] = useState<UsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetch_usage_data();
  }, [filter, fetch_usage_data]);

  const fetch_usage_data = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') {
        params.append('operation_type', filter);
      }

      const response = await fetch(`/api/admin/usage?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }
      
      const data = await response.json();
      setUsageData(data.usage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const operation_types = [
    { value: 'all', label: 'All Operations' },
    { value: 'image_generation', label: 'Image Generation' },
    { value: 'video_generation', label: 'Video Generation' },
    { value: 'audio_generation', label: 'Audio Generation' },
    { value: 'text_analysis', label: 'Text Analysis' },
    { value: 'memu_chat', label: 'MEMU Chat' }
  ];

  const total_tokens = usage_data.reduce((sum, item) => sum + item.tokens_used, 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Usage Analytics</h1>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Tokens (Page)</div>
            <div className="stat-value text-primary">
              {(total_tokens / 1000).toFixed(1)}K
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
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
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {usage_data.map((item, idx) => (
                <tr key={idx}>
                  <td>
                    <div className="text-sm">
                      {format(new Date(item.created_at), 'MMM d, HH:mm')}
                    </div>
                  </td>
                  <td>
                    <div className="text-sm truncate max-w-[200px]">
                      {item.user_email}
                    </div>
                  </td>
                  <td>
                    <span className={`badge badge-sm ${
                      item.operation_type === 'image_generation' ? 'badge-primary' :
                      item.operation_type === 'video_generation' ? 'badge-secondary' :
                      item.operation_type === 'audio_generation' ? 'badge-accent' :
                      item.operation_type === 'text_analysis' ? 'badge-info' :
                      'badge-warning'
                    }`}>
                      {item.operation_type.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div className="font-mono text-sm">
                      {item.tokens_used.toLocaleString()}
                    </div>
                  </td>
                  <td>
                    {item.details && (
                      <details className="cursor-pointer">
                        <summary className="text-sm">View</summary>
                        <pre className="text-xs mt-2 p-2 bg-base-200 rounded">
                          {JSON.stringify(item.details, null, 2)}
                        </pre>
                      </details>
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