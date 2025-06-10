'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { PlanBadge } from '@/components/common/plan_badge';

interface User {
  id: string;
  clerk_id: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
  subscriptions: {
    plan: string;
    renewable_tokens: number;
    permanent_tokens: number;
    tokens_reset_at: string | null;
  }[];
}

interface UsersResponse {
  users: User[];
  total_count: number;
  page: number;
  limit: number;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total_count, setTotalCount] = useState(0);
  const [search, setSearch] = useState('');
  const [updating_role, setUpdatingRole] = useState<string | null>(null);

  const limit = 50;

  const fetch_users = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/users?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data: UsersResponse = await response.json();
      setUsers(data.users);
      setTotalCount(data.total_count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetch_users();
  }, [fetch_users]);

  const update_user_role = async (user_id: string, new_role: 'user' | 'admin') => {
    try {
      setUpdatingRole(user_id);
      
      const response = await fetch(`/api/admin/users/${user_id}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: new_role }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update user role');
      }
      
      // Refresh the user list
      await fetch_users();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update user role');
    } finally {
      setUpdatingRole(null);
    }
  };

  const total_pages = Math.ceil(total_count / limit);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">User Management</h1>
        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">Total Users</div>
            <div className="stat-value">{total_count.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="form-control">
        <div className="input-group">
          <input
            type="text"
            placeholder="Search by email or clerk ID..."
            className="input input-bordered w-full max-w-xs"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
          />
          <button className="btn btn-square">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Users Table */}
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
                <th>Email</th>
                <th>Role</th>
                <th>Plan</th>
                <th>Tokens (Renewable/Permanent)</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const subscription = user.subscriptions[0];
                return (
                  <tr key={user.id}>
                    <td>
                      <div>
                        <div className="font-bold">{user.email}</div>
                        <div className="text-sm opacity-50">{user.clerk_id}</div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${user.role === 'admin' ? 'badge-error' : 'badge-ghost'}`}>
                        {user.role === 'admin' ? '🛡️ Admin' : '👤 User'}
                      </span>
                    </td>
                    <td>
                      {subscription?.plan ? (
                        <PlanBadge plan={subscription.plan} size="sm" />
                      ) : (
                        <span className="text-sm opacity-50">No plan</span>
                      )}
                    </td>
                    <td>
                      {subscription ? (
                        <div className="text-sm">
                          <div>{subscription.renewable_tokens.toLocaleString()} / {subscription.permanent_tokens.toLocaleString()}</div>
                          {subscription.tokens_reset_at && (
                            <div className="opacity-50">
                              Resets: {format(new Date(subscription.tokens_reset_at), 'MMM d')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm opacity-50">No subscription</span>
                      )}
                    </td>
                    <td>
                      <div className="text-sm">
                        {format(new Date(user.created_at), 'MMM d, yyyy')}
                      </div>
                    </td>
                    <td>
                      <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-xs">
                          actions
                        </label>
                        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li>
                            <button
                              onClick={() => update_user_role(user.id, user.role === 'admin' ? 'user' : 'admin')}
                              disabled={updating_role === user.id}
                              className={updating_role === user.id ? 'loading' : ''}
                            >
                              {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {total_pages > 1 && (
        <div className="btn-group justify-center w-full">
          <button
            className="btn"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            «
          </button>
          <button className="btn">Page {page} of {total_pages}</button>
          <button
            className="btn"
            onClick={() => setPage(Math.min(total_pages, page + 1))}
            disabled={page === total_pages}
          >
            »
          </button>
        </div>
      )}
    </div>
  );
}