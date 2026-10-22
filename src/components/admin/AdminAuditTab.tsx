import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Search,
  RefreshCw,
  Clock,
  Terminal,
  Activity,
  Globe,
  User,
} from 'lucide-react';

interface AuditLogEntry {
  id: string;
  admin_id: string;
  action: string;
  target?: string;
  metadata?: any;
  ip?: string;
  created_at: string;
}

export const AdminAuditTab: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/audit?limit=100', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      l.action.toLowerCase().includes(q) ||
      (l.target && l.target.toLowerCase().includes(q)) ||
      (l.ip && l.ip.toLowerCase().includes(q)) ||
      l.admin_id.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
          <input
            type="text"
            placeholder="Search action, target, IP address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-xs text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-xs font-semibold text-[var(--admin-text-main)] flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <span className="text-xs text-[var(--admin-text-muted)] font-mono tabular-nums">
            {logs.length} operations recorded
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-[var(--admin-card-bg)] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--admin-text-muted)]">
            Loading secure administrative audit trail...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-10 h-10 text-[var(--admin-text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-[var(--admin-text-main)]">No matching audit events</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--admin-card-border)] overflow-x-auto">
            {/* Header */}
            <div className="px-6 py-3.5 bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider grid grid-cols-12 gap-4 min-w-[760px]">
              <div className="col-span-3">Timestamp</div>
              <div className="col-span-3">Action</div>
              <div className="col-span-3">Target Resource</div>
              <div className="col-span-2">IP Origin</div>
              <div className="col-span-1 text-right">Details</div>
            </div>

            {/* List */}
            {filteredLogs.map((entry) => (
              <div
                key={entry.id}
                className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition text-xs min-w-[760px]"
              >
                {/* Timestamp */}
                <div className="col-span-3 font-mono text-[11px] text-[var(--admin-text-muted)] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{new Date(entry.created_at).toLocaleString()}</span>
                </div>

                {/* Action */}
                <div className="col-span-3">
                  <span className="font-mono font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                    {entry.action}
                  </span>
                </div>

                {/* Target */}
                <div className="col-span-3 font-mono text-[11px] text-[var(--admin-text-main)] truncate">
                  {entry.target || 'system'}
                </div>

                {/* IP Origin */}
                <div className="col-span-2 font-mono text-[11px] text-[var(--admin-text-muted)] flex items-center gap-1">
                  <Globe className="w-3 h-3 shrink-0" />
                  <span className="truncate">{entry.ip || '127.0.0.1'}</span>
                </div>

                {/* Details view */}
                <div className="col-span-1 flex justify-end">
                  {entry.metadata && Object.keys(entry.metadata).length > 0 ? (
                    <button
                      onClick={() => setSelectedEntry(entry)}
                      className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                    >
                      View
                    </button>
                  ) : (
                    <span className="text-[11px] text-[var(--admin-text-muted)]">--</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metadata Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm text-[var(--admin-text-main)] flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-500" /> Audit Log Payload
              </h4>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-xs font-semibold text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]"
              >
                Close
              </button>
            </div>
            <pre className="p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-xs font-mono text-[var(--admin-text-main)] overflow-x-auto max-h-80">
              {JSON.stringify(selectedEntry, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
