import React, { useState } from 'react';
import { Search, Bell, Sparkles } from 'lucide-react';

interface AdminTopBarProps {
  adminName: string;
  pendingReviewsCount: number;
  onOpenNotifications?: () => void;
  onOpenReviewsTab?: () => void;
  onOpenAssistant: (initialQuery?: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const AdminTopBar: React.FC<AdminTopBarProps> = ({
  adminName,
  pendingReviewsCount,
  onOpenNotifications,
  onOpenReviewsTab,
  onOpenAssistant,
  onSearchSubmit,
}) => {
  const [searchVal, setSearchVal] = useState('');

  const firstName = typeof adminName === 'string' && adminName.trim() ? (adminName.split(' ')[0] || 'Administrator') : 'Administrator';

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      if (onSearchSubmit) {
        onSearchSubmit(searchVal.trim());
      } else {
        onOpenAssistant(searchVal.trim());
      }
      setSearchVal('');
    }
  };

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 pt-2">
      {/* Left: Large Greeting Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--admin-text-main)]">
          Hey, {firstName}
        </h1>
        <p className="text-xs sm:text-sm text-[var(--admin-text-muted)] mt-0.5">
          Platform activity at a glance
        </p>
      </div>

      {/* Right: Pill Search & Notification Bell */}
      <div className="flex items-center gap-3">
        {/* Pill Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex items-center w-full sm:w-[320px] lg:w-[380px]"
        >
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search or ask Chemora AI..."
            className="w-full h-11 pl-4 pr-12 rounded-full bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] text-xs font-medium text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
          />
          <button
            type="submit"
            aria-label="Search or Ask AI"
            className="absolute right-1 w-9 h-9 rounded-full bg-[var(--admin-rail-active)] text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
          </button>
        </form>

        {/* Notification Bell with Count Badge */}
        <button
          type="button"
          onClick={onOpenReviewsTab || onOpenNotifications}
          aria-label="Pending reviews notifications"
          className="relative w-11 h-11 rounded-full bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-sm flex items-center justify-center text-[var(--admin-text-main)] hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition shrink-0"
        >
          <Bell className="w-5 h-5 text-[var(--admin-text-muted)]" />
          {pendingReviewsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-md animate-pulse">
              {pendingReviewsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
