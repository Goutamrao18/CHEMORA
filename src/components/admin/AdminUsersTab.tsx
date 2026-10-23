import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'motion/react';
import { LiquidLoader } from '../ui/LiquidLoader';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Award,
  Power,
  RefreshCw,
} from 'lucide-react';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
  disabled?: boolean;
  xp?: number;
  completed_challenges_count?: number;
}

export const AdminUsersTab: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const q = encodeURIComponent(searchQuery);
      const res = await fetch(`/api/admin/users?search=${q}`, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const handleToggleDisabled = async (userId: string, currentDisabled: boolean) => {
    setTogglingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/toggle-disabled`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ disabled: !currentDisabled }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, disabled: !currentDisabled } : u))
        );
      }
    } catch (err) {
      console.error('Failed to toggle status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and summary */}
      <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
          <input
            type="text"
            placeholder="Search researchers by email or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-xs text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchUsers()}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold text-[var(--admin-text-main)] flex items-center gap-1.5 transition cursor-pointer"
          >
            {loading ? <LiquidLoader size="xs" label="Refreshing users..." /> : <RefreshCw className="w-3.5 h-3.5" />} Refresh
          </button>
          <span className="text-xs text-[var(--admin-text-muted)] font-mono tabular-nums">
            Total registered: {users.length}
          </span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[var(--admin-card-bg)] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--admin-text-muted)]">Loading researchers directory...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-[var(--admin-text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-[var(--admin-text-main)]">No researchers found</p>
            <p className="text-xs text-[var(--admin-text-muted)] mt-1">Try another search keyword.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--admin-card-border)] overflow-x-auto">
            {/* Header */}
            <div className="px-6 py-3 bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider grid grid-cols-12 gap-4 min-w-[700px]">
              <div className="col-span-4">Researcher Email</div>
              <div className="col-span-2">Role</div>
              <div className="col-span-2">Joined</div>
              <div className="col-span-2">XP Earned</div>
              <div className="col-span-2 text-right">Status / Access</div>
            </div>

            {/* Rows */}
            {users.map((user) => {
              const isDisabled = !!user.disabled;
              const isToggling = togglingId === user.id;

              return (
                <div
                  key={user.id}
                  className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition text-xs min-w-[700px]"
                >
                  {/* Email & ID */}
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold flex items-center justify-center shrink-0 uppercase text-[11px]">
                      {user.email ? user.email.slice(0, 2) : 'US'}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--admin-text-main)] truncate">
                        {user.email || 'Anonymous Student'}
                      </div>
                      <div className="text-[10px] text-[var(--admin-text-muted)] font-mono truncate">
                        ID: {user.id}
                      </div>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="col-span-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                        user.role === 'admin'
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                      }`}
                    >
                      {user.role || 'Student'}
                    </span>
                  </div>

                  {/* Joined Date */}
                  <div className="col-span-2 text-[var(--admin-text-muted)] font-mono text-[11px]">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>

                  {/* XP */}
                  <div className="col-span-2 text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                    {user.xp ? `${user.xp.toLocaleString()} XP` : '0 XP'}
                  </div>

                  {/* Status Toggle */}
                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isDisabled
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {isDisabled ? 'Disabled' : 'Active'}
                    </span>

                    {user.role !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleToggleDisabled(user.id, isDisabled)}
                        disabled={isToggling}
                        title={isDisabled ? 'Re-enable account' : 'Disable account'}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          isDisabled
                            ? 'border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10'
                            : 'border-rose-500/30 text-rose-600 hover:bg-rose-500/10'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
