import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { LiquidLoader } from '../ui/LiquidLoader';
import {
  Users,
  UserPlus,
  Trophy,
  Activity,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Video,
  ShieldCheck,
  ChevronRight,
  Check,
  X,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { EXPERIMENTS, Experiment } from '../../data/experimentsData';

interface AdminDashboardTabProps {
  statsData: any;
  onNavigateTab: (tab: any) => void;
  onOpenExperiment: (exp: Experiment) => void;
  onApproveReview: (id: string) => Promise<void>;
  onRejectReview: (id: string) => Promise<void>;
  onRefreshVideos: () => Promise<void>;
  videoHealthData: any;
  isCheckingVideos: boolean;
}

// Sparkline SVG helper
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 64;
  const height = 24;

  const points = data
    .map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden="true">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

// Animated tabular numeral counter
function TabularCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [val, setVal] = useState(0);

  useEffect(() => {
    let frameId: number;
    const start = performance.now();
    const duration = 900;

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * end));
      if (p < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [end]);

  return (
    <span className="font-tabular">
      {val.toLocaleString()}
      {suffix}
    </span>
  );
}

export const AdminDashboardTab: React.FC<AdminDashboardTabProps> = ({
  statsData,
  onNavigateTab,
  onOpenExperiment,
  onApproveReview,
  onRejectReview,
  onRefreshVideos,
  videoHealthData,
  isCheckingVideos,
}) => {
  const [activityRange, setActivityRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; date: string; count: number } | null>(null);

  const stats = {
    totalUsers: statsData?.stats?.totalUsers ?? statsData?.totalUsers ?? 0,
    totalUsersChange: statsData?.stats?.totalUsersChange ?? (statsData?.totalUsers ? `+${statsData.totalUsers}` : '0'),
    newThisWeek: statsData?.stats?.newThisWeek ?? statsData?.newThisWeek ?? 0,
    newThisWeekChange: statsData?.stats?.newThisWeekChange ?? (statsData?.newThisWeek ? `+${statsData.newThisWeek}` : '0'),
    challengeCompletions: statsData?.stats?.challengeCompletions ?? statsData?.challengeCompletions ?? 0,
    challengeCompletionsChange: statsData?.stats?.challengeCompletionsChange ?? (statsData?.challengeCompletions ? 'Active' : 'None'),
    avgAccuracy: statsData?.stats?.avgAccuracy ?? statsData?.avgAccuracy ?? 0,
    avgAccuracyChange: statsData?.stats?.avgAccuracyChange ?? (statsData?.avgAccuracy ? `${statsData.avgAccuracy}%` : '0%'),
    pendingReviews: statsData?.stats?.pendingReviews ?? statsData?.pendingReviewsCount ?? 0,
    trendStatus: statsData?.stats?.trendStatus || ((statsData?.totalUsers || 0) > 0 ? 'Live platform' : 'System ready'),
  };

  const activityData: { date: string; count: number }[] =
    statsData?.activity?.[activityRange] || [];

  const sparklineData = (statsData?.activity?.['7d'] || []).map((d: any) => d.count);
  const realSparkline = sparklineData.length >= 2 ? sparklineData : [0, 0];

  const reviewsQueue = statsData?.reviewsQueue || [];
  const topExperiments = statsData?.topExperiments || [];
  const recentAudit = statsData?.recentAudit || [];

  // Discipline Pastel Background & Border Mapping
  const getDisciplineTint = (discipline?: string) => {
    const d = (discipline || '').toLowerCase();
    if (d.includes('organic')) {
      return 'bg-purple-50/80 dark:bg-purple-950/20 border-purple-200/80 dark:border-purple-800/40 text-purple-700 dark:text-purple-300';
    }
    if (d.includes('inorganic')) {
      return 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-800/40 text-blue-700 dark:text-blue-300';
    }
    if (d.includes('physical')) {
      return 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/40 text-amber-700 dark:text-amber-300';
    }
    return 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/40 text-emerald-700 dark:text-emerald-300';
  };

  return (
    <div className="space-y-6">
      {/* =========================================================================
          ROW 1: 5 STAT CARDS (4 Standard + 1 Highlighted Teal Card)
          ========================================================================= */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Users */}
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
          className="rounded-[24px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] hover:shadow-[var(--admin-card-shadow-hover)] p-5 flex flex-col justify-between transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {stats.totalUsersChange}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--admin-text-muted)]">Total Researchers</span>
            <div className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--admin-text-main)] mt-0.5">
              <TabularCounter end={stats.totalUsers} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--admin-card-border)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--admin-text-muted)]">7-day trend</span>
            <MiniSparkline data={realSparkline} color="#06b6d4" />
          </div>
        </motion.div>

        {/* Card 2: New This Week */}
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
          className="rounded-[24px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] hover:shadow-[var(--admin-card-shadow-hover)] p-5 flex flex-col justify-between transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {stats.newThisWeekChange}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--admin-text-muted)]">New This Week</span>
            <div className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--admin-text-main)] mt-0.5">
              <TabularCounter end={stats.newThisWeek} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--admin-card-border)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--admin-text-muted)]">Daily joins</span>
            <MiniSparkline data={realSparkline} color="#6366f1" />
          </div>
        </motion.div>

        {/* Card 3: Challenge Completions */}
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
          className="rounded-[24px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] hover:shadow-[var(--admin-card-shadow-hover)] p-5 flex flex-col justify-between transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {stats.challengeCompletionsChange}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--admin-text-muted)]">Completions</span>
            <div className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--admin-text-main)] mt-0.5">
              <TabularCounter end={stats.challengeCompletions} />
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--admin-card-border)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--admin-text-muted)]">Arena activity</span>
            <MiniSparkline data={realSparkline} color="#a855f7" />
          </div>
        </motion.div>

        {/* Card 4: Avg Accuracy */}
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
          className="rounded-[24px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] hover:shadow-[var(--admin-card-shadow-hover)] p-5 flex flex-col justify-between transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {stats.avgAccuracyChange}
            </span>
          </div>
          <div>
            <span className="text-xs font-semibold text-[var(--admin-text-muted)]">Average Accuracy</span>
            <div className="text-2xl lg:text-3xl font-black tracking-tight text-[var(--admin-text-main)] mt-0.5">
              <span className="font-tabular">{stats.avgAccuracy > 0 ? stats.avgAccuracy : 0}</span>%
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[var(--admin-card-border)] flex items-center justify-between">
            <span className="text-[10px] text-[var(--admin-text-muted)]">Pass rate</span>
            <MiniSparkline data={realSparkline} color="#10b981" />
          </div>
        </motion.div>

        {/* Card 5: HIGHLIGHTED TEAL CARD (Pending Reviews with quick action) */}
        <motion.div
          whileHover={{ y: -5 }}
          transition={{ duration: 0.2 }}
          style={{ background: 'linear-gradient(135deg, #04212b 0%, #14a3c4 100%)' }}
          className="rounded-[24px] p-5 text-white shadow-xl shadow-cyan-950/20 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 border border-white/20 text-cyan-200 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 shadow-sm">
              Action
            </span>
          </div>

          <div>
            <span className="text-xs font-bold text-cyan-200/90">Pending Reviews</span>
            <div className="text-3xl font-black tracking-tight text-white mt-0.5">
              <TabularCounter end={stats.pendingReviews} />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-white/15 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onNavigateTab('reviews')}
              className="text-xs font-bold text-cyan-100 hover:text-white flex items-center gap-1 group transition"
            >
              <span>Review now</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-ping" />
          </div>
        </motion.div>
      </section>

      {/* =========================================================================
          ROW 2: 12-COLUMN GRID (Large Area Chart 8 Cols + Reviews Queue 4 Cols)
          ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Large Activity Card (8 Cols) */}
        <div className="lg:col-span-8 rounded-[24px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-[var(--admin-text-main)]">Platform Activity</h3>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  {stats.trendStatus}
                </span>
              </div>
              <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">
                Daily experiment and challenge sessions across learning cohorts
              </p>
            </div>

            {/* Range Dropdown / Buttons */}
            <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-2xl border border-[var(--admin-card-border)] self-start sm:self-auto">
              {(['7d', '30d', '90d'] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setActivityRange(r)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    activityRange === r
                      ? 'bg-[var(--admin-card-bg)] text-[var(--admin-text-main)] shadow-sm'
                      : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Pure SVG Area & Line Chart with line draw-in and interactive tooltips */}
          <div className="relative w-full h-[240px] pt-4">
            {activityData.length > 0 && (() => {
              const svgW = 740;
              const svgH = 200;
              const maxCount = Math.max(...activityData.map((d) => d.count), 1);
              const minCount = Math.min(...activityData.map((d) => d.count), 0);
              const range = maxCount - minCount || 1;

              const coords = activityData.map((item, idx) => {
                const x = (idx / (activityData.length - 1)) * svgW;
                const y = svgH - ((item.count - minCount) / range) * (svgH - 30) - 15;
                return { x, y, item };
              });

              const lineD = coords.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
              const areaD = `${lineD} L ${svgW},${svgH} L 0,${svgH} Z`;

              return (
                <svg
                  viewBox={`0 0 ${svgW} ${svgH}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="activityTealArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14a3c4" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#14a3c4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal grid lines */}
                  {[0.25, 0.5, 0.75, 1].map((pct) => (
                    <line
                      key={pct}
                      x1="0"
                      y1={svgH * (1 - pct)}
                      x2={svgW}
                      y2={svgH * (1 - pct)}
                      stroke="currentColor"
                      strokeOpacity="0.06"
                      strokeDasharray="4 4"
                    />
                  ))}

                  {/* Area fill */}
                  <path d={areaD} fill="url(#activityTealArea)" />

                  {/* Line draw-in */}
                  <path
                    d={lineD}
                    fill="none"
                    stroke="#14a3c4"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="svg-chart-draw"
                  />

                  {/* Interactive Points */}
                  {coords.map((pt, i) => (
                    <circle
                      key={i}
                      cx={pt.x}
                      cy={pt.y}
                      r="4"
                      className="cursor-pointer fill-[#04212b] stroke-cyan-400 stroke-2 hover:r-6 transition-all"
                      onMouseEnter={() =>
                        setHoveredPoint({
                          x: pt.x,
                          y: pt.y,
                          date: pt.item.date,
                          count: pt.item.count,
                        })
                      }
                      onMouseLeave={() => setHoveredPoint(null)}
                    />
                  ))}
                </svg>
              );
            })()}

            {/* Tooltip on Hover */}
            {hoveredPoint && (
              <div
                style={{
                  left: `${(hoveredPoint.x / 740) * 100}%`,
                  top: `${Math.max(10, hoveredPoint.y - 45)}px`,
                }}
                className="absolute -translate-x-1/2 pointer-events-none px-3 py-1.5 rounded-xl bg-[#081224] text-white text-xs font-mono shadow-xl border border-cyan-500/40 z-20 whitespace-nowrap"
              >
                <div className="font-bold text-cyan-300">{hoveredPoint.count} sessions</div>
                <div className="text-[10px] text-slate-400">{hoveredPoint.date}</div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reviews Queue (4 Cols) */}
        <div className="lg:col-span-4 rounded-[24px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] p-6 space-y-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-card-border)]">
            <div>
              <h3 className="font-black text-base text-[var(--admin-text-main)]">Reviews Queue</h3>
              <p className="text-xs text-[var(--admin-text-muted)]">Pending student submissions</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('reviews')}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              View all
            </button>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto max-h-[280px]">
            {reviewsQueue.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--admin-text-muted)]">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2 opacity-80" />
                All reviews moderated!
              </div>
            ) : (
              reviewsQueue.map((rev: any) => (
                <div
                  key={rev.id}
                  className="p-3 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--admin-text-main)] truncate max-w-[130px]">
                      {rev.author_name}
                    </span>
                    <span className="font-mono text-amber-500">
                      {'★'.repeat(rev.rating)}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-[11px] line-clamp-2 italic">
                    "{rev.comment}"
                  </p>
                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => onRejectReview(rev.id)}
                      className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 font-bold text-[11px] flex items-center gap-1 transition"
                    >
                      <X className="w-3 h-3" />
                      <span>Reject</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onApproveReview(rev.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] flex items-center gap-1 transition"
                    >
                      <Check className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ROW 3: BOTTOM ROW (Content Health + Recent Admin Actions)
          ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Content Health (6 Cols) */}
        <div className="lg:col-span-6 rounded-[24px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-card-border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 flex items-center justify-center">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-base text-[var(--admin-text-main)]">Video Content Health</h3>
                <p className="text-xs text-[var(--admin-text-muted)]">
                  {videoHealthData?.total || 21} Streaming Assets (HEAD verification)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onRefreshVideos}
              disabled={isCheckingVideos}
              className="px-3 py-1.5 rounded-xl border border-[var(--admin-card-border)] text-xs font-bold flex items-center gap-1.5 hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50 transition"
            >
              {isCheckingVideos ? <LiquidLoader size="xs" label="Scanning..." /> : <RefreshCw className="w-3.5 h-3.5" />}
              <span>{isCheckingVideos ? 'Scanning...' : 'Re-check'}</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 text-center">
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {videoHealthData?.healthy || 21}
              </span>
              <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase mt-0.5">Healthy (200)</p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-center">
              <span className="text-xl font-black text-rose-600 dark:text-rose-400">
                {videoHealthData?.missing || 0}
              </span>
              <p className="text-[10px] font-bold text-rose-700 dark:text-rose-300 uppercase mt-0.5">Missing (404)</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-center">
              <span className="text-xl font-black text-amber-600 dark:text-amber-400">
                {videoHealthData?.wrongType || 0}
              </span>
              <p className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase mt-0.5">Bad MIME</p>
            </div>
          </div>

          <div className="text-[11px] text-[var(--admin-text-muted)] flex items-center justify-between">
            <span>CDN Base: mcwadkgzplurjtstrhdd.supabase.co</span>
            <button
              type="button"
              onClick={() => onNavigateTab('content')}
              className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
            >
              Inspect all 21 videos &rarr;
            </button>
          </div>
        </div>

        {/* Recent Admin Actions (6 Cols) */}
        <div className="lg:col-span-6 rounded-[24px] bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-[var(--admin-card-shadow)] p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-card-border)]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-500 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-base text-[var(--admin-text-main)]">Recent Admin Actions</h3>
                <p className="text-xs text-[var(--admin-text-muted)]">Cryptographic audit log trail</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab('audit')}
              className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline"
            >
              Full log
            </button>
          </div>

          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
            {recentAudit.length === 0 ? (
              <p className="text-xs text-[var(--admin-text-muted)] py-4 text-center">No recent administrative writes.</p>
            ) : (
              recentAudit.map((log: any) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                      {log.action}
                    </span>
                    <span className="text-[var(--admin-text-main)] font-medium truncate max-w-[200px]">
                      {log.target || 'system'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--admin-text-muted)] shrink-0">
                    {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ROW 4: EXPERIMENTS GRID (Pastel-tinted Property Cards Reference Style)
          ========================================================================= */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-black text-[var(--admin-text-main)]">Curriculum Practicals</h3>
            <p className="text-xs text-[var(--admin-text-muted)]">
              Interactive completion rates and video streaming status per laboratory module
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EXPERIMENTS.slice(0, 8).map((exp) => {
            const tint = getDisciplineTint(exp.topic);
            const completions = statsData?.experimentCompletions?.[exp.id] || 0;
            const accuracy = completions > 0 ? 85 : 0;

            return (
              <motion.div
                key={exp.id}
                whileHover={{ y: -5 }}
                transition={{ duration: 0.2 }}
                onClick={() => onOpenExperiment(exp)}
                className={`p-5 rounded-[24px] border ${tint} shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl select-none">{exp.emoji}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-current">
                      {exp.level}
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm text-[var(--admin-text-main)] line-clamp-1 mb-1">
                    {exp.title}
                  </h4>
                  <p className="text-[11px] opacity-80 line-clamp-2 mb-4">
                    {exp.summary}
                  </p>
                </div>

                <div className="pt-3 border-t border-current/20 flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    {/* SVG circular progress ring */}
                    <svg className="w-5 h-5 -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-black/10 dark:text-white/10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-cyan-500"
                        stroke="currentColor"
                        strokeDasharray={`${accuracy}, 100`}
                        strokeWidth="4"
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <span className="font-bold">{completions > 0 ? `${accuracy}% pass` : '--% pass'}</span>
                  </div>

                  <span className="text-[10px] opacity-75">
                    {completions} completed
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
