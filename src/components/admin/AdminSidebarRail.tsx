import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Video,
  Trophy,
  ShieldCheck,
  Settings,
  LogOut,
  MoreHorizontal,
  X,
} from 'lucide-react';

export type AdminTab = 'dashboard' | 'reviews' | 'users' | 'content' | 'challenges' | 'audit' | 'settings';

interface AdminSidebarRailProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  onLogout: () => void;
  adminName: string;
  adminEmail: string;
  pendingReviewsCount: number;
}

interface RailItem {
  id: AdminTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const AdminSidebarRail: React.FC<AdminSidebarRailProps> = ({
  activeTab,
  onSelectTab,
  onLogout,
  adminName,
  adminEmail,
  pendingReviewsCount,
}) => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  const mainItems: RailItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'reviews', label: 'Reviews', icon: MessageSquare, badge: pendingReviewsCount },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'content', label: 'Content Health', icon: Video },
    { id: 'challenges', label: 'Challenges', icon: Trophy },
    { id: 'audit', label: 'Audit Log', icon: ShieldCheck },
  ];

  const adminInitials = adminName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  return (
    <>
      {/* =========================================================================
          DESKTOP STICKY LEFT RAIL (CSS GRID COLUMN)
          - Never overlaps content (resides in reserved grid track)
          - 72px collapsed on tablet / small desktop (<1280px)
          - 220px expanded on large desktop (>=1280px)
          - No stray vertical lines or subpixel border glitches
          ========================================================================= */}
      <aside
        aria-label="Admin Navigation Rail"
        className="admin-sticky-rail hidden md:flex flex-col justify-between py-4 px-2 xl:px-3 w-full rounded-[28px] bg-[var(--admin-rail-bg)] border border-[var(--admin-rail-border)] shadow-xl overflow-y-auto overflow-x-hidden backdrop-blur-xl select-none"
      >
        {/* Top: Logo with tooltip "Admin" / "Chemora Admin" (No clipped "ADM" text) */}
        <div className="flex flex-col items-center xl:items-start xl:px-1 shrink-0">
          <div
            className="relative flex items-center gap-3 w-full justify-center xl:justify-start"
            onMouseEnter={() => setActiveTooltip('logo')}
            onMouseLeave={() => setActiveTooltip(null)}
            onFocus={() => setActiveTooltip('logo')}
            onBlur={() => setActiveTooltip(null)}
            tabIndex={0}
            role="banner"
            aria-label="Chemora Admin"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#04212b] to-[#14a3c4] flex items-center justify-center text-white shadow-md shadow-cyan-950/40 font-black text-lg select-none shrink-0 border border-cyan-400/30">
              ⚗
            </div>
            <div className="hidden xl:flex flex-col min-w-0">
              <span className="font-black text-sm text-[var(--admin-text-main)] tracking-tight leading-tight">
                CHEMORA
              </span>
              <span className="text-[10px] font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Admin Portal
              </span>
            </div>

            {/* Collapsed Tooltip on hover / keyboard focus */}
            <AnimatePresence>
              {activeTooltip === 'logo' && (
                <motion.div
                  initial={{ opacity: 0, x: -6, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -6, scale: 0.94 }}
                  transition={{ duration: 0.15 }}
                  className="xl:hidden absolute left-[calc(100%+14px)] px-3 py-1.5 rounded-xl bg-[#071325] text-white text-xs font-semibold whitespace-nowrap shadow-xl pointer-events-none z-50 border border-cyan-500/30"
                >
                  Chemora Admin
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Middle: Navigation Items */}
        <nav aria-label="Main Administration" className="flex flex-col items-center xl:items-stretch gap-1.5 my-auto py-4 w-full">
          {mainItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="relative flex items-center justify-center xl:justify-start w-full"
                onMouseEnter={() => setActiveTooltip(item.id)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
                <button
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  onFocus={() => setActiveTooltip(item.id)}
                  onBlur={() => setActiveTooltip(null)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative z-10 w-11 h-11 xl:w-full xl:h-11 xl:px-3 rounded-2xl flex items-center justify-center xl:justify-start gap-3 transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none min-h-[44px] min-w-[44px] ${
                    isActive
                      ? 'text-white'
                      : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />

                  {/* Text label visible at >=1280px (xl) */}
                  <span className="hidden xl:inline text-xs font-semibold whitespace-nowrap truncate flex-1 text-left">
                    {item.label}
                  </span>

                  {/* Badge for Pending items */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute top-1 right-1 xl:static xl:top-auto xl:right-auto px-1.5 py-0.5 min-w-[18px] h-[18px] rounded-full bg-cyan-400 text-slate-950 font-black text-[10px] flex items-center justify-center shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Dark filled pill that slides between active items */}
                {isActive && (
                  <motion.div
                    layoutId="admin-active-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-2xl bg-[var(--admin-rail-active)] shadow-sm"
                  />
                )}

                {/* Hover / Focus Tooltip (active in collapsed mode) */}
                <AnimatePresence>
                  {activeTooltip === item.id && (
                    <motion.div
                      initial={{ opacity: 0, x: -6, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -6, scale: 0.94 }}
                      transition={{ duration: 0.15 }}
                      className="xl:hidden absolute left-[calc(100%+14px)] px-3 py-1.5 rounded-xl bg-[#071325] text-white text-xs font-semibold whitespace-nowrap shadow-xl pointer-events-none z-50 border border-cyan-500/30"
                    >
                      {item.label}
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-black">
                          {item.badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Clean Divider */}
        <div className="w-full h-px bg-[var(--admin-rail-border)] my-2 shrink-0" role="separator" />

        {/* Bottom Group: Settings, Sign Out, Admin Avatar */}
        <div className="flex flex-col items-center xl:items-stretch gap-1.5 shrink-0 w-full pt-1">
          {/* Settings */}
          <div
            className="relative flex items-center justify-center xl:justify-start w-full"
            onMouseEnter={() => setActiveTooltip('settings')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <button
              type="button"
              onClick={() => onSelectTab('settings')}
              onFocus={() => setActiveTooltip('settings')}
              onBlur={() => setActiveTooltip(null)}
              aria-label="Admin Settings"
              aria-current={activeTab === 'settings' ? 'page' : undefined}
              className={`w-11 h-11 xl:w-full xl:h-11 xl:px-3 rounded-2xl flex items-center justify-center xl:justify-start gap-3 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none min-h-[44px] min-w-[44px] ${
                activeTab === 'settings'
                  ? 'bg-[var(--admin-rail-active)] text-white shadow-sm'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              <span className="hidden xl:inline text-xs font-semibold whitespace-nowrap">
                Settings
              </span>
            </button>

            <AnimatePresence>
              {activeTooltip === 'settings' && (
                <motion.div
                  initial={{ opacity: 0, x: -6, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -6, scale: 0.94 }}
                  transition={{ duration: 0.15 }}
                  className="xl:hidden absolute left-[calc(100%+14px)] px-3 py-1.5 rounded-xl bg-[#071325] text-white text-xs font-semibold whitespace-nowrap shadow-xl pointer-events-none z-50 border border-cyan-500/30"
                >
                  Settings
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sign Out */}
          <div
            className="relative flex items-center justify-center xl:justify-start w-full"
            onMouseEnter={() => setActiveTooltip('logout')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <button
              type="button"
              onClick={onLogout}
              onFocus={() => setActiveTooltip('logout')}
              onBlur={() => setActiveTooltip(null)}
              aria-label="Sign out"
              title="Sign out of administration"
              className="w-11 h-11 xl:w-full xl:h-11 xl:px-3 rounded-2xl flex items-center justify-center xl:justify-start gap-3 text-[var(--admin-text-muted)] hover:text-rose-400 hover:bg-rose-500/10 transition-colors focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none min-h-[44px] min-w-[44px]"
            >
              <LogOut className="w-5 h-5 shrink-0" />
              <span className="hidden xl:inline text-xs font-semibold whitespace-nowrap">
                Sign Out
              </span>
            </button>

            <AnimatePresence>
              {activeTooltip === 'logout' && (
                <motion.div
                  initial={{ opacity: 0, x: -6, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -6, scale: 0.94 }}
                  transition={{ duration: 0.15 }}
                  className="xl:hidden absolute left-[calc(100%+14px)] px-3 py-1.5 rounded-xl bg-[#071325] text-white text-xs font-semibold whitespace-nowrap shadow-xl pointer-events-none z-50 border border-rose-500/30"
                >
                  Sign Out
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admin Avatar & Profile Details */}
          <div
            className="relative flex items-center justify-center xl:justify-start w-full pt-1"
            onMouseEnter={() => setActiveTooltip('avatar')}
            onMouseLeave={() => setActiveTooltip(null)}
          >
            <div
              tabIndex={0}
              role="figure"
              aria-label={`Administrator: ${adminName}`}
              onFocus={() => setActiveTooltip('avatar')}
              onBlur={() => setActiveTooltip(null)}
              className="w-11 h-11 xl:w-full xl:h-12 xl:px-2 rounded-2xl flex items-center justify-center xl:justify-start gap-2.5 bg-black/10 dark:bg-white/5 border border-[var(--admin-card-border)] select-none cursor-default focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-xs shrink-0">
                {adminInitials}
              </div>
              <div className="hidden xl:flex flex-col min-w-0 flex-1 text-left">
                <span className="text-xs font-bold text-[var(--admin-text-main)] truncate leading-tight">
                  {adminName}
                </span>
                <span className="text-[10px] text-[var(--admin-text-muted)] truncate font-mono">
                  {adminEmail}
                </span>
              </div>
            </div>

            <AnimatePresence>
              {activeTooltip === 'avatar' && (
                <motion.div
                  initial={{ opacity: 0, x: -6, scale: 0.94 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -6, scale: 0.94 }}
                  transition={{ duration: 0.15 }}
                  className="xl:hidden absolute left-[calc(100%+14px)] px-3 py-2 rounded-xl bg-[#071325] text-white text-xs whitespace-nowrap shadow-xl pointer-events-none z-50 border border-cyan-500/30 text-left"
                >
                  <p className="font-bold text-white">{adminName}</p>
                  <p className="text-[10px] text-cyan-300 font-mono">{adminEmail}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE FLOATING BOTTOM DOCK (< 768px)
          - Single column mobile layout
          - 44px tap targets with dvh unit awareness
          ========================================================================= */}
      <nav
        aria-label="Mobile Admin Navigation"
        className="md:hidden fixed bottom-[calc(14px+env(safe-area-inset-bottom,12px))] inset-x-0 mx-auto w-fit max-w-[calc(100vw-24px)] z-40"
      >
        <div className="relative h-[60px] px-2.5 rounded-[30px] bg-[var(--admin-rail-bg)] border border-[var(--admin-rail-border)] shadow-[0_16px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl flex items-center justify-center gap-1.5 select-none">
          {[
            { id: 'dashboard' as AdminTab, label: 'Dash', icon: LayoutDashboard },
            { id: 'reviews' as AdminTab, label: 'Reviews', icon: MessageSquare, badge: pendingReviewsCount },
            { id: 'users' as AdminTab, label: 'Users', icon: Users },
          ].map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
                className={`relative min-w-[52px] h-[44px] px-3 rounded-[22px] flex items-center justify-center gap-1.5 text-xs font-bold transition-all focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
                  isActive
                    ? 'bg-[var(--admin-rail-active)] text-white shadow-sm'
                    : 'text-[var(--admin-text-muted)]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 font-black text-[9px] flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* More menu trigger for Phone */}
          <button
            type="button"
            onClick={() => setIsMobileMoreOpen(true)}
            aria-label="More admin options"
            className="min-w-[48px] h-[44px] px-2.5 rounded-[22px] flex items-center justify-center text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* Mobile More Bottom Sheet */}
      <AnimatePresence>
        {isMobileMoreOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMoreOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute inset-x-0 bottom-0 bg-[var(--admin-card-bg)] rounded-t-[32px] p-6 space-y-4 border-t border-[var(--admin-card-border)] shadow-2xl max-h-[80dvh] overflow-y-auto pb-[calc(24px+env(safe-area-inset-bottom,12px))]"
            >
              <div className="flex items-center justify-between pb-3 border-b border-[var(--admin-card-border)]">
                <div>
                  <h3 className="font-bold text-base text-[var(--admin-text-main)]">More Controls</h3>
                  <p className="text-xs text-[var(--admin-text-muted)]">{adminName} ({adminEmail})</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMoreOpen(false)}
                  aria-label="Close menu"
                  className="p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { id: 'content' as AdminTab, label: 'Content Health', icon: Video },
                  { id: 'challenges' as AdminTab, label: 'Challenges', icon: Trophy },
                  { id: 'audit' as AdminTab, label: 'Audit Log', icon: ShieldCheck },
                  { id: 'settings' as AdminTab, label: 'Settings', icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(item.id);
                        setIsMobileMoreOpen(false);
                      }}
                      className="p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] flex items-center gap-2.5 font-bold text-xs text-[var(--admin-text-main)] active:scale-95 transition"
                    >
                      <Icon className="w-4 h-4 text-cyan-500" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-[var(--admin-card-border)]">
                <button
                  type="button"
                  onClick={onLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 text-xs font-bold transition active:scale-95"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
