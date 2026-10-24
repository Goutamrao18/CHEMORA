import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { LiquidLoader } from '../ui/LiquidLoader';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  Terminal,
  Globe,
  User,
  SlidersHorizontal,
  Download,
  Calendar,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  Database,
  Lock,
  MessageSquare,
  Settings,
  Sparkles,
  Activity,
  AlertTriangle,
  FileSpreadsheet,
  FileCode,
  ExternalLink,
} from 'lucide-react';

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target?: string;
  metadata?: Record<string, any>;
  ip?: string;
  created_at: string;
}

interface AuditStats {
  totalCount: number;
  uniqueAdmins: number;
  last24hCount: number;
  authCount: number;
  moderationCount: number;
  settingsCount: number;
  securityCount: number;
}

type CategoryFilter = 'all' | 'auth' | 'reviews' | 'security' | 'settings' | 'system';
type TimeFilter = 'all' | '24h' | '7d' | '30d';

export const AdminAuditTab: React.FC = () => {
  // State
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('supabase:admin_audit_logs');
  const [stats, setStats] = useState<AuditStats | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [timeRange, setTimeRange] = useState<TimeFilter>('all');
  const [adminEmailFilter, setAdminEmailFilter] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [totalCount, setTotalCount] = useState(0);

  // Inspector Drawer & UI Helpers
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [autoRefreshSecs, setAutoRefreshSecs] = useState<number>(0); // 0 = off

  // Calculate Start Date from Time Range
  const startDate = useMemo(() => {
    const now = Date.now();
    if (timeRange === '24h') return new Date(now - 24 * 60 * 60 * 1000).toISOString();
    if (timeRange === '7d') return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
    if (timeRange === '30d') return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
    return '';
  }, [timeRange]);

  // Fetch audit logs
  const fetchLogs = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', String(pageSize));
      params.set('offset', String((page - 1) * pageSize));

      if (category !== 'all') params.set('category', category);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (adminEmailFilter) params.set('email', adminEmailFilter);
      if (startDate) params.set('startDate', startDate);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`, {
        credentials: 'include',
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      setLogs(data.logs || []);
      setTotalCount(data.total || (data.logs ? data.logs.length : 0));
      if (data.source) setDataSource(data.source);
      if (data.stats) setStats(data.stats);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError(err?.message || 'Failed to fetch audit log records from Supabase.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, category, searchQuery, adminEmailFilter, startDate]);

  // Initial load and filter change trigger
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset page to 1 when filters change
  const handleCategoryChange = (newCat: CategoryFilter) => {
    setCategory(newCat);
    setPage(1);
  };

  const handleTimeRangeChange = (newRange: TimeFilter) => {
    setTimeRange(newRange);
    setPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshSecs <= 0) return;
    const interval = setInterval(() => {
      fetchLogs(true);
    }, autoRefreshSecs * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshSecs, fetchLogs]);

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Export handlers
  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    try {
      const url = `/api/admin/audit-logs/export?format=${format}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Export request failed.');
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `chemora-audit-logs-${new Date().toISOString().slice(0, 10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Audit export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Action badge visual styling
  const getActionBadge = (action: string) => {
    const act = action.toUpperCase();
    if (act.includes('LOGIN_SUCCESS')) {
      return {
        bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        icon: ShieldCheck,
      };
    }
    if (act.includes('FAILED') || act.includes('LOCKOUT') || act.includes('REJECT') || act.includes('DELETE')) {
      return {
        bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
        icon: AlertTriangle,
      };
    }
    if (act.includes('OTP') || act.includes('AUTH') || act.includes('2FA')) {
      return {
        bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        icon: Lock,
      };
    }
    if (act.includes('REVIEW') || act.includes('APPROVE')) {
      return {
        bg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
        icon: MessageSquare,
      };
    }
    if (act.includes('SETTINGS') || act.includes('CONFIG')) {
      return {
        bg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
        icon: Settings,
      };
    }
    if (act.includes('VIDEO') || act.includes('HEALTH') || act.includes('SCAN')) {
      return {
        bg: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20',
        icon: Activity,
      };
    }
    return {
      bg: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
      icon: Terminal,
    };
  };

  // Relative time helper
  const formatRelativeTime = (isoString: string) => {
    try {
      const ms = Date.now() - new Date(isoString).getTime();
      const secs = Math.floor(ms / 1000);
      if (secs < 60) return `${Math.max(secs, 1)}s ago`;
      const mins = Math.floor(secs / 60);
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    } catch {
      return isoString;
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <div className="space-y-6">
      {/* =========================================================================
          SECTION 1: HEADER & STATS HERO
          ========================================================================= */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-black tracking-tight text-[var(--admin-text-main)]">
              Administrative Audit Log
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
              {dataSource.includes('supabase') ? 'Supabase admin_audit_logs' : 'Tamper-Evident Memory Store'}
            </span>
          </div>
          <p className="text-xs text-[var(--admin-text-muted)] mt-1">
            Complete cryptographic audit trail of administrative authentications, review moderations, and platform configuration changes.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Auto Refresh Selector */}
          <div className="flex items-center rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] p-1 text-xs">
            <button
              type="button"
              onClick={() => setAutoRefreshSecs(0)}
              className={`px-2 py-1 rounded-lg font-semibold transition ${
                autoRefreshSecs === 0
                  ? 'bg-white dark:bg-zinc-800 text-[var(--admin-text-main)] shadow-xs'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
              }`}
            >
              Manual
            </button>
            <button
              type="button"
              onClick={() => setAutoRefreshSecs(15)}
              className={`px-2 py-1 rounded-lg font-semibold transition ${
                autoRefreshSecs === 15
                  ? 'bg-white dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
              }`}
            >
              15s
            </button>
            <button
              type="button"
              onClick={() => setAutoRefreshSecs(30)}
              className={`px-2 py-1 rounded-lg font-semibold transition ${
                autoRefreshSecs === 30
                  ? 'bg-white dark:bg-zinc-800 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
              }`}
            >
              30s
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchLogs()}
            disabled={loading}
            className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-[var(--admin-text-main)] flex items-center gap-1.5 transition border border-[var(--admin-card-border)] cursor-pointer disabled:opacity-50"
          >
            {loading ? <LiquidLoader size="xs" label="Refreshing logs..." /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Refresh</span>
          </button>

          {/* Export Dropdown Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-cyan-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="px-3 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-[var(--admin-text-main)] flex items-center gap-1.5 transition border border-[var(--admin-card-border)] cursor-pointer disabled:opacity-50"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-[20px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--admin-text-muted)] font-medium">
            <span>Total Logged Actions</span>
            <Database className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[var(--admin-text-main)] font-mono tabular-nums">
              {stats?.totalCount ?? totalCount}
            </div>
            <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
              Across all administrative sessions
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-[20px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--admin-text-muted)] font-medium">
            <span>Active Administrators</span>
            <User className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-[var(--admin-text-main)] font-mono tabular-nums">
              {stats?.uniqueAdmins ?? 1}
            </div>
            <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
              Authenticated operators with access
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-[20px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--admin-text-muted)] font-medium">
            <span>Security & Auth Events</span>
            <Lock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              {stats?.authCount ?? 0}
            </div>
            <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
              Stateless HMAC & Email OTP verifications
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-[20px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-[var(--admin-text-muted)] font-medium">
            <span>Past 24 Hours Volume</span>
            <Clock className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono tabular-nums">
              {stats?.last24hCount ?? logs.length}
            </div>
            <p className="text-[11px] text-[var(--admin-text-muted)] mt-0.5">
              Recent forensic audit throughput
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SECTION 2: FILTER & CONTROL BAR
          ========================================================================= */}
      <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-4 shadow-[var(--admin-card-shadow)] border border-[var(--admin-card-border)] space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
            <input
              type="text"
              placeholder="Filter by action name, actor email, target resource, IP..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full h-10 pl-10 pr-9 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-xs text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] p-1 text-xs">
              {(
                [
                  { id: 'all', label: 'All Time' },
                  { id: '24h', label: '24 Hours' },
                  { id: '7d', label: '7 Days' },
                  { id: '30d', label: '30 Days' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTimeRangeChange(t.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                    timeRange === t.id
                      ? 'bg-white dark:bg-zinc-800 text-[var(--admin-text-main)] shadow-xs font-bold'
                      : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Pills Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <span className="text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider mr-1 shrink-0">
            Domain:
          </span>
          {(
            [
              { id: 'all', label: 'All Actions' },
              { id: 'auth', label: 'Authentication & OTP' },
              { id: 'reviews', label: 'Review Moderation' },
              { id: 'security', label: 'Security & Lockouts' },
              { id: 'settings', label: 'System Settings' },
              { id: 'system', label: 'Health & Diagnostics' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryChange(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition cursor-pointer ${
                category === cat.id
                  ? 'bg-cyan-600 text-white shadow-xs shadow-cyan-600/30'
                  : 'bg-black/5 dark:bg-white/5 text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-black/10 dark:hover:bg-white/10'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* =========================================================================
          SECTION 3: MAIN AUDIT LOG TABLE
          ========================================================================= */}
      <div className="bg-[var(--admin-card-bg)] rounded-[24px] shadow-[var(--admin-card-shadow)] border border-[var(--admin-card-border)] overflow-hidden">
        {loading && logs.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <LiquidLoader size="md" label="Querying cryptographic records from Supabase admin_audit_logs..." />
            <p className="text-xs font-medium text-[var(--admin-text-muted)]">
              Querying cryptographic records from Supabase <code className="font-mono text-cyan-600 dark:text-cyan-400">admin_audit_logs</code>...
            </p>
          </div>
        ) : error ? (
          <div className="p-12 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
            <p className="text-sm font-bold text-rose-600 dark:text-rose-400">{error}</p>
            <p className="text-xs text-[var(--admin-text-muted)]">
              Ensure that <code className="font-mono">admin_audit_logs</code> exists in Supabase or run migration <code className="font-mono">20261022020000_admin_audit_logs.sql</code>.
            </p>
            <button
              type="button"
              onClick={() => fetchLogs()}
              className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 transition"
            >
              Retry Query
            </button>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <ShieldCheck className="w-10 h-10 text-[var(--admin-text-muted)] opacity-30 mx-auto" />
            <h4 className="text-sm font-bold text-[var(--admin-text-main)]">No Audit Records Found</h4>
            <p className="text-xs text-[var(--admin-text-muted)] max-w-sm mx-auto">
              No administrative operations match the selected category and search criteria.
            </p>
            {(searchQuery || category !== 'all' || timeRange !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCategory('all');
                  setTimeRange('all');
                  setPage(1);
                }}
                className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[880px]">
                <thead>
                  <tr className="border-b border-[var(--admin-card-border)] bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider">
                    <th className="py-3.5 px-6">Timestamp</th>
                    <th className="py-3.5 px-4">Admin Actor</th>
                    <th className="py-3.5 px-4">Action</th>
                    <th className="py-3.5 px-4">Target Resource</th>
                    <th className="py-3.5 px-4">IP Origin</th>
                    <th className="py-3.5 px-6 text-right">Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--admin-card-border)] text-xs">
                  {logs.map((entry) => {
                    const badge = getActionBadge(entry.action);
                    const ActionIcon = badge.icon;
                    const metaKeys = entry.metadata ? Object.keys(entry.metadata) : [];
                    const adminInitials = (entry.admin_email || 'AD')
                      .split('@')[0]
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={entry.id}
                        className="hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition-colors"
                      >
                        {/* 1. Timestamp */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-mono text-xs font-semibold text-[var(--admin-text-main)]">
                              {new Date(entry.created_at).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            <span className="text-[10px] text-[var(--admin-text-muted)] flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(entry.created_at)}
                            </span>
                          </div>
                        </td>

                        {/* 2. Admin Actor */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-900 to-cyan-600 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0">
                              {adminInitials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-xs text-[var(--admin-text-main)] truncate max-w-[180px]">
                                {entry.admin_email || 'admin@chemora.edu'}
                              </span>
                              <span className="text-[10px] text-[var(--admin-text-muted)] font-mono">
                                {entry.admin_id && !entry.admin_id.startsWith('admin_')
                                  ? `${entry.admin_id.slice(0, 8)}...`
                                  : 'system-actor'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 3. Action Badge */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${badge.bg}`}
                          >
                            <ActionIcon className="w-3 h-3 shrink-0" />
                            <span>{entry.action}</span>
                          </span>
                        </td>

                        {/* 4. Target Resource */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className="font-mono text-[11px] text-[var(--admin-text-main)] bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md border border-[var(--admin-card-border)]">
                            {entry.target || 'system'}
                          </span>
                        </td>

                        {/* 5. IP Address */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--admin-text-muted)]">
                            <Globe className="w-3 h-3 shrink-0 opacity-60" />
                            <span>{entry.ip || '127.0.0.1'}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(entry.ip || '127.0.0.1', `ip-${entry.id}`)}
                              title="Copy IP"
                              className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] transition cursor-pointer ml-1"
                            >
                              {copiedId === `ip-${entry.id}` ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* 6. Payload / Metadata view */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          {metaKeys.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setSelectedEntry(entry)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-[var(--admin-card-border)] text-xs font-semibold transition cursor-pointer"
                            >
                              <Terminal className="w-3 h-3" />
                              <span>Inspect ({metaKeys.length})</span>
                            </button>
                          ) : (
                            <span className="text-[11px] text-[var(--admin-text-muted)] font-mono">
                              (none)
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked Cards (Item 16) */}
            <div className="md:hidden divide-y divide-[var(--admin-card-border)]">
              {logs.map((entry) => {
                const badge = getActionBadge(entry.action);
                const ActionIcon = badge.icon;
                const metaKeys = entry.metadata ? Object.keys(entry.metadata) : [];

                return (
                  <div key={entry.id} className="p-4 space-y-2.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${badge.bg}`}>
                        <ActionIcon className="w-3 h-3 shrink-0" />
                        <span>{entry.action}</span>
                      </span>
                      <span className="font-mono text-[10px] text-[var(--admin-text-muted)]">
                        {formatRelativeTime(entry.created_at)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--admin-text-muted)]">Actor:</span>
                        <span className="font-semibold text-[var(--admin-text-main)] truncate max-w-[200px]">
                          {entry.admin_email || 'admin@chemora.edu'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--admin-text-muted)]">Target:</span>
                        <span className="font-mono text-[var(--admin-text-main)] bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded border border-[var(--admin-card-border)]">
                          {entry.target || 'system'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--admin-text-muted)]">IP Origin:</span>
                        <span className="font-mono text-[var(--admin-text-muted)]">{entry.ip || '127.0.0.1'}</span>
                      </div>
                    </div>

                    {metaKeys.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSelectedEntry(entry)}
                        className="w-full min-h-[44px] mt-2 flex items-center justify-center gap-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-cyan-500/10 text-cyan-400 border border-[var(--admin-card-border)] font-semibold text-xs transition"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>Inspect Payload Details ({metaKeys.length} fields)</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Pagination Footer */}
            <div className="py-3.5 px-6 border-t border-[var(--admin-card-border)] bg-black/[0.01] dark:bg-white/[0.01] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[var(--admin-text-muted)] font-mono">
                <span>
                  Showing {Math.min((page - 1) * pageSize + 1, totalCount)}–
                  {Math.min(page * pageSize, totalCount)} of {totalCount} events
                </span>
                <span className="text-black/20 dark:text-white/20">&bull;</span>
                <div className="flex items-center gap-1">
                  <span>Page size:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPage(1);
                    }}
                    className="bg-transparent border border-[var(--admin-card-border)] rounded-md px-1.5 py-0.5 text-xs text-[var(--admin-text-main)] focus:outline-none"
                  >
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* Page Controls */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-lg border border-[var(--admin-card-border)] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-3 py-1 font-mono text-xs font-bold text-[var(--admin-text-main)]">
                  {page} / {totalPages}
                </span>

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-lg border border-[var(--admin-card-border)] hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SECTION 4: INSPECT JSON DETAIL MODAL / DRAWER
          ========================================================================= */}
      <AnimatePresence>
        {selectedEntry && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] rounded-[24px] max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3 border-b border-[var(--admin-card-border)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-mono font-bold border ${
                        getActionBadge(selectedEntry.action).bg
                      }`}
                    >
                      {selectedEntry.action}
                    </span>
                    <span className="font-mono text-xs text-[var(--admin-text-muted)]">
                      {selectedEntry.id}
                    </span>
                  </div>
                  <h3 className="font-bold text-base text-[var(--admin-text-main)] mt-1">
                    Audit Event Payload Inspector
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="p-1.5 rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-black/5 dark:hover:bg-white/5 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Event Metadata Key-Value Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-black/[0.02] dark:bg-white/[0.02] p-3 rounded-xl border border-[var(--admin-card-border)]">
                <div>
                  <span className="text-[10px] text-[var(--admin-text-muted)] uppercase tracking-wider block">
                    Admin Actor
                  </span>
                  <span className="font-semibold text-[var(--admin-text-main)] truncate block">
                    {selectedEntry.admin_email}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--admin-text-muted)] uppercase tracking-wider block">
                    Target Resource
                  </span>
                  <span className="font-mono font-semibold text-[var(--admin-text-main)] truncate block">
                    {selectedEntry.target || 'system'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[var(--admin-text-muted)] uppercase tracking-wider block">
                    Client IP Origin
                  </span>
                  <span className="font-mono font-semibold text-[var(--admin-text-main)] block">
                    {selectedEntry.ip || '127.0.0.1'}
                  </span>
                </div>
                <div className="col-span-2 sm:col-span-3">
                  <span className="text-[10px] text-[var(--admin-text-muted)] uppercase tracking-wider block">
                    Recorded Timestamp (UTC ISO 8601)
                  </span>
                  <span className="font-mono text-[var(--admin-text-main)] block">
                    {selectedEntry.created_at} ({new Date(selectedEntry.created_at).toLocaleString()})
                  </span>
                </div>
              </div>

              {/* Syntax-Highlighted JSON Viewer */}
              <div className="flex-1 min-h-0 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs text-[var(--admin-text-muted)] font-mono">
                  <span>Structured Context & Params:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(JSON.stringify(selectedEntry, null, 2));
                      setCopiedJson(true);
                      setTimeout(() => setCopiedJson(false), 2000);
                    }}
                    className="inline-flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-semibold hover:underline cursor-pointer"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-500" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy JSON
                      </>
                    )}
                  </button>
                </div>

                <div className="overflow-auto rounded-xl bg-zinc-950 p-4 border border-zinc-800 flex-1 max-h-72">
                  <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
                    {JSON.stringify(selectedEntry.metadata || {}, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedEntry(null)}
                  className="px-4 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold text-[var(--admin-text-main)] transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminAuditTab;
