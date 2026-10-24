import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  MessageSquare,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Trash2,
  Star,
  Clock,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface ReviewItem {
  id: string;
  user_id?: string;
  user_email?: string;
  experiment_id?: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected' | 'flagged';
  created_at: string;
}

interface AdminReviewsTabProps {
  onStatusChange?: () => void;
}

export const AdminReviewsTab: React.FC<AdminReviewsTabProps> = ({ onStatusChange }) => {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [undoItem, setUndoItem] = useState<{ id: string; prevStatus: ReviewItem['status']; timerId?: any } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reviews?status=${activeFilter === 'all' ? '' : activeFilter}`, {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
      }
    } catch (err) {
      console.error('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    const list = Array.isArray(reviews) ? reviews : [];
    const q = (searchQuery || '').trim().toLowerCase();
    return list.filter((r) => {
      if (!r) return false;
      const comment = typeof r.comment === 'string' ? r.comment.toLowerCase() : '';
      const email = typeof r.user_email === 'string' ? r.user_email.toLowerCase() : '';
      const expId = typeof r.experiment_id === 'string' ? r.experiment_id.toLowerCase() : '';
      const matchesSearch =
        !q ||
        comment.includes(q) ||
        email.includes(q) ||
        expId.includes(q);
      return matchesSearch;
    });
  }, [reviews, searchQuery]);

  // Actions
  const handleModerateSingle = async (id: string, action: 'approve' | 'reject') => {
    const target = reviews.find((r) => r.id === id);
    if (!target) return;

    const prevStatus = target.status;
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    // Optimistic update
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));

    // Setup undo
    if (undoItem?.timerId) clearTimeout(undoItem.timerId);
    const timer = setTimeout(() => {
      setUndoItem(null);
    }, 6000);
    setUndoItem({ id, prevStatus, timerId: timer });

    try {
      const res = await fetch(`/api/admin/reviews/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Action failed');
      onStatusChange?.();
    } catch (err) {
      console.error('Moderate error:', err);
      // rollback
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: prevStatus } : r)));
    }
  };

  const handleUndo = async () => {
    if (!undoItem) return;
    const { id, prevStatus, timerId } = undoItem;
    if (timerId) clearTimeout(timerId);

    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, status: prevStatus } : r)));
    setUndoItem(null);

    try {
      const action = prevStatus === 'approved' ? 'approve' : 'reject';
      await fetch(`/api/admin/reviews/${id}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      onStatusChange?.();
    } catch (err) {
      console.error('Undo failed:', err);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject' | 'delete') => {
    if (selectedIds.length === 0) return;
    const idsToProcess = [...selectedIds];
    setSelectedIds([]);

    try {
      const res = await fetch('/api/admin/reviews/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action, reviewIds: idsToProcess }),
      });
      if (res.ok) {
        await fetchReviews();
        onStatusChange?.();
      }
    } catch (err) {
      console.error('Bulk moderation error:', err);
    }
  };

  // Keyboard shortcut listener (A to approve, R to reject)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (!filteredReviews.length) return;
      const current = filteredReviews[selectedIndex] || filteredReviews[0];
      if (!current) return;

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleModerateSingle(current.id, 'approve');
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleModerateSingle(current.id, 'reject');
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredReviews.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredReviews, selectedIndex]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredReviews.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredReviews.map((r) => r.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Undo Toast */}
      <AnimatePresence>
        {undoItem && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-8 right-8 z-50 bg-[#04212b] text-white px-5 py-3.5 rounded-2xl shadow-xl flex items-center gap-4 border border-cyan-500/30"
          >
            <div className="flex items-center gap-2 text-xs">
              <Check className="w-4 h-4 text-cyan-400" />
              <span>Review moderation updated</span>
            </div>
            <button
              onClick={handleUndo}
              className="text-xs font-bold text-cyan-300 hover:text-cyan-100 flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/15 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Filter and Controls Bar */}
      <div className="bg-[var(--admin-card-bg)] rounded-[24px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-black/5 dark:bg-white/5 rounded-2xl border border-[var(--admin-card-border)] w-full md:w-auto">
          {(['pending', 'approved', 'rejected', 'all'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`flex-1 md:flex-initial px-4 py-2 rounded-xl text-xs font-semibold capitalize transition ${
                activeFilter === tab
                  ? 'bg-[var(--admin-card-bg)] text-[var(--admin-text-main)] shadow-sm'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Search input & Bulk actions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--admin-text-muted)]" />
            <input
              type="text"
              placeholder="Search comments, emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-xs text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-[var(--admin-card-border)]">
              <span className="text-[11px] font-semibold text-[var(--admin-text-muted)] px-2 tabular-nums">
                {selectedIds.length} chosen
              </span>
              <button
                onClick={() => handleBulkAction('approve')}
                title="Approve selected"
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                title="Reject selected"
                className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25 text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" /> Reject
              </button>
              <button
                onClick={() => handleBulkAction('delete')}
                title="Delete selected"
                className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Keyboard Hint banner */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl border border-[var(--admin-card-border)] text-xs text-[var(--admin-text-muted)]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
          <span>
            Pro Moderation: Press <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[var(--admin-text-main)]">A</kbd> to Approve, <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[var(--admin-text-main)]">R</kbd> to Reject, <kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[var(--admin-text-main)]">↑</kbd>/<kbd className="font-mono font-bold px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[var(--admin-text-main)]">↓</kbd> to navigate
          </span>
        </div>
        <span className="tabular-nums font-semibold">
          {filteredReviews.length} {activeFilter} reviews
        </span>
      </div>

      {/* Reviews Table / List */}
      <div className="bg-[var(--admin-card-bg)] rounded-[24px] shadow-[0_4px_24px_rgba(0,0,0,0.04)] border border-[var(--admin-card-border)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[var(--admin-text-muted)]">Loading queue...</div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-10 h-10 text-[var(--admin-text-muted)] mx-auto mb-3 opacity-40" />
            <p className="text-sm font-semibold text-[var(--admin-text-main)]">Queue is all clear</p>
            <p className="text-xs text-[var(--admin-text-muted)] mt-1">No {activeFilter} reviews matching criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--admin-card-border)]">
          <div>
            {/* Desktop Table Header */}
            <div className="hidden md:flex px-6 py-3 bg-black/[0.02] dark:bg-white/[0.02] text-[11px] font-bold text-[var(--admin-text-muted)] uppercase tracking-wider items-center gap-4">
              <input
                type="checkbox"
                checked={selectedIds.length === filteredReviews.length && filteredReviews.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
              />
              <div className="w-48">Researcher / Target</div>
              <div className="w-24">Rating</div>
              <div className="flex-1">Feedback Comment</div>
              <div className="w-24">Status</div>
              <div className="w-32 text-right">Actions</div>
            </div>

            {/* Desktop Table Rows */}
            <div className="hidden md:block divide-y divide-[var(--admin-card-border)]">
              {filteredReviews.map((item, idx) => {
                const isSelected = selectedIds.includes(item.id);
                const isKeyboardFocus = selectedIndex === idx;

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedIndex(idx)}
                    className={`px-6 py-4 flex items-center gap-4 transition text-xs ${
                      isKeyboardFocus ? 'bg-cyan-500/5 ring-1 ring-inset ring-cyan-500/30' : 'hover:bg-black/[0.015] dark:hover:bg-white/[0.015]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(item.id)}
                      className="w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                    />

                    {/* Researcher & target */}
                    <div className="w-48 shrink-0">
                      <div className="font-semibold text-[var(--admin-text-main)] truncate">
                        {item.user_email || 'Anonymous Student'}
                      </div>
                      <div className="text-[11px] text-[var(--admin-text-muted)] font-mono truncate">
                        {item.experiment_id || 'General Platform'}
                      </div>
                    </div>

                    {/* Rating */}
                    <div className="w-24 shrink-0 flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="text-[var(--admin-text-main)] line-clamp-2 leading-relaxed">
                        {item.comment}
                      </p>
                      <span className="text-[10px] text-[var(--admin-text-muted)] flex items-center gap-1 mt-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                    </div>

                    {/* Status chip */}
                    <div className="w-24 shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                          item.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            : item.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    {/* Action buttons */}
                    <div className="w-32 shrink-0 flex items-center justify-end gap-1.5">
                      {item.status !== 'approved' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModerateSingle(item.id, 'approve');
                          }}
                          title="Approve (A)"
                          className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center transition cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}

                      {item.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleModerateSingle(item.id, 'reject');
                          }}
                          title="Reject (R)"
                          className="w-8 h-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 text-rose-600 dark:text-rose-400 flex items-center justify-center transition cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile Stacked Cards (Item 16) */}
            <div className="md:hidden divide-y divide-[var(--admin-card-border)]">
              {filteredReviews.map((item, idx) => {
                const isSelected = selectedIds.includes(item.id);

                return (
                  <div key={item.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-[var(--admin-text-main)] truncate">
                            {item.user_email || 'Anonymous Student'}
                          </p>
                          <p className="text-[10px] text-[var(--admin-text-muted)] font-mono truncate">
                            {item.experiment_id || 'General Platform'}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize shrink-0 ${
                          item.status === 'approved'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : item.status === 'rejected'
                            ? 'bg-rose-500/10 text-rose-400'
                            : 'bg-amber-500/10 text-amber-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`}
                        />
                      ))}
                    </div>

                    <p className="text-xs text-[var(--admin-text-main)] leading-relaxed break-words">
                      {item.comment}
                    </p>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[var(--admin-card-border)]/50">
                      <span className="text-[10px] text-[var(--admin-text-muted)] font-mono">
                        {new Date(item.created_at).toLocaleDateString()}
                      </span>

                      <div className="flex items-center gap-2">
                        {item.status !== 'approved' && (
                          <button
                            type="button"
                            onClick={() => handleModerateSingle(item.id, 'approve')}
                            className="px-3 py-1.5 min-h-[44px] rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-semibold text-xs flex items-center gap-1 transition"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {item.status !== 'rejected' && (
                          <button
                            type="button"
                            onClick={() => handleModerateSingle(item.id, 'reject')}
                            className="px-3 py-1.5 min-h-[44px] rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 font-semibold text-xs flex items-center gap-1 transition"
                          >
                            <X className="w-3.5 h-3.5" /> Reject
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        )}
      </div>
    </div>
  );
};
