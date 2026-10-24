import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LiquidLoader } from '../ui/LiquidLoader';
import {
  Video,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Clock,
  Layers,
  Sparkles,
  Server,
} from 'lucide-react';

interface VideoResult {
  id: string;
  title: string;
  url: string;
  status: 'ok' | 'missing' | 'error';
  httpStatus?: number;
  contentType?: string;
  responseTimeMs?: number;
  error?: string;
}

interface VideoHealthResponse {
  checkedAt: string;
  total: number;
  ok: number;
  failed: number;
  results: VideoResult[];
}

export const AdminVideosTab: React.FC = () => {
  const [data, setData] = useState<VideoHealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const endpoint = force ? '/api/admin/videos/check' : '/api/admin/videos/health';
      const method = force ? 'POST' : 'GET';
      const res = await fetch(endpoint, { method, credentials: 'include' });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load video health:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth(false);
  }, []);

  const videoResults: VideoResult[] = Array.isArray(data?.results)
    ? data.results
    : Array.isArray((data as any)?.videos)
    ? (data as any).videos
    : [];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--admin-text-muted)]">Manifest Manifested</div>
            <div className="text-2xl font-bold tracking-tight text-[var(--admin-text-main)] tabular-nums">
              {data?.total || (videoResults.length > 0 ? videoResults.length : 21)}
            </div>
          </div>
        </div>

        <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--admin-text-muted)]">Healthy (200 OK)</div>
            <div className="text-2xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
              {data?.ok ?? (data as any)?.healthy ?? (videoResults.filter((v) => v.status === 'ok').length)}
            </div>
          </div>
        </div>

        <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-[var(--admin-text-muted)]">Failing / Missing</div>
            <div className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400 tabular-nums">
              {data?.failed ?? (data as any)?.missing ?? (videoResults.filter((v) => v.status !== 'ok').length)}
            </div>
          </div>
        </div>

        <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] flex items-center justify-between">
          <div>
            <div className="text-xs text-[var(--admin-text-muted)]">Last Verified</div>
            <div className="text-xs font-mono font-semibold text-[var(--admin-text-main)] mt-1">
              {data?.checkedAt ? new Date(data.checkedAt).toLocaleTimeString() : 'Pending'}
            </div>
          </div>
          <button
            onClick={() => fetchHealth(true)}
            disabled={refreshing}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#04212b] to-[#14a3c4] text-white hover:opacity-90 disabled:opacity-50 text-xs font-semibold flex items-center gap-2 shadow-sm transition cursor-pointer"
          >
            {refreshing ? <LiquidLoader size="xs" label="Scanning..." /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>{refreshing ? 'Scanning...' : 'Re-check All'}</span>
          </button>
        </div>
      </div>

      {/* Video Stream Detail Table */}
      <div className="bg-[var(--admin-card-bg)] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--admin-text-muted)] space-y-3">
            <LiquidLoader size="md" label="Executing server-side HEAD requests across storage bucket..." />
            <p>Executing server-side HEAD requests across storage bucket...</p>
          </div>
        ) : !data || videoResults.length === 0 ? (
          <div className="p-12 text-center text-xs text-[var(--admin-text-muted)]">
            No video manifest entries loaded.
          </div>
        ) : (
          <div className="divide-y divide-[var(--admin-card-border)] overflow-x-auto">
            {/* Header */}
            <div className="px-6 py-3.5 bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider grid grid-cols-12 gap-4 min-w-[760px]">
              <div className="col-span-4">Video Asset / Experiment</div>
              <div className="col-span-3">Target Storage URL</div>
              <div className="col-span-2">HTTP / Content-Type</div>
              <div className="col-span-1">Latency</div>
              <div className="col-span-2 text-right">Status</div>
            </div>

            {/* Rows */}
            {videoResults.map((vid) => {
              const isOk = vid.status === 'ok';

              return (
                <div
                  key={vid.id}
                  className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-black/[0.015] dark:hover:bg-white/[0.015] transition text-xs min-w-[760px]"
                >
                  {/* Asset name & ID */}
                  <div className="col-span-4 min-w-0 flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                        isOk
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      <Video className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-[var(--admin-text-main)] truncate">
                        {vid.title}
                      </div>
                      <div className="text-[10px] text-[var(--admin-text-muted)] font-mono truncate">
                        ID: {vid.id}
                      </div>
                    </div>
                  </div>

                  {/* URL */}
                  <div className="col-span-3 min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] text-[var(--admin-text-muted)] font-mono truncate">
                      <span className="truncate">{vid.url}</span>
                      <a
                        href={vid.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-500 hover:text-cyan-600 shrink-0"
                        title="Open direct asset in browser"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>

                  {/* HTTP Status & Content-Type */}
                  <div className="col-span-2">
                    <span className="font-mono font-semibold text-[11px] text-[var(--admin-text-main)]">
                      {vid.httpStatus ? `HTTP ${vid.httpStatus}` : 'N/A'}
                    </span>
                    <div className="text-[10px] text-[var(--admin-text-muted)] font-mono truncate">
                      {vid.contentType || 'video/mp4'}
                    </div>
                  </div>

                  {/* Latency */}
                  <div className="col-span-1 font-mono text-[11px] text-[var(--admin-text-muted)] tabular-nums">
                    {vid.responseTimeMs ? `${vid.responseTimeMs}ms` : '--'}
                  </div>

                  {/* Status chip */}
                  <div className="col-span-2 flex items-center justify-end">
                    <span
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        isOk
                          ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      {isOk ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Healthy
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" /> Degraded
                        </>
                      )}
                    </span>
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
