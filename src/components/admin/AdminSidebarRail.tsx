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
  Sun,
  Moon,
  MoreHorizontal,
  X,
} from 'lucide-react';

export type AdminTab = 'dashboard' | 'reviews' | 'users' | 'content' | 'challenges' | 'audit' | 'settings';

interface AdminSidebarRailProps {
  activeTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  isDark: boolean;
  onToggleTheme: () => void;
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
  isDark,
  onToggleTheme,
  onLogout,
  adminName,
  adminEmail,
  pendingReviewsCount,
}) => {
  const [hoveredTab, setHoveredTab] = useState<AdminTab | null>(null);
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
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'AD';

  return (
    <>
      {/* =========================================================================
          DESKTOP FLOATING LEFT ICON RAIL
          Pill, white, ~64px wide, vertically centered, detached from the edge.
          ========================================================================= */}
      <aside
        aria-label="Admin Navigation Rail"
        className="hidden md:flex fixed left-5 top-1/2 -translate-y-1/2 z-40 flex-col items-center justify-between w-[68px] py-4 rounded-[36px] bg-[var(--admin-rail-bg)] border border-[var(--admin-rail-border)] shadow-[0_12px_36px_rgba(0,0,0,0.06),0_0_0_1px_rgba(0,0,0,0.02)] backdrop-blur-xl h-[86vh] max-h-[720px]"
      >
        {/* Top: Chemora Flask Badge */}
        <div className="flex flex-col items-center gap-1">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#04212b] to-[#14a3c4] flex items-center justify-center text-white shadow-md shadow-cyan-900/20 font-black text-sm select-none">
            ⚗
          </div>
          <span className="text-[9px] font-mono font-bold tracking-widest text-[var(--admin-text-muted)] uppercase">
            ADM
          </span>
        </div>

        {/* Middle: Navigation Items */}
        <nav className="flex flex-col items-center gap-2.5 my-auto">
          {mainItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <div
                key={item.id}
                className="relative flex items-center justify-center"
                onMouseEnter={() => setHoveredTab(item.id)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <button
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-label={item.label}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative z-10 w-11 h-11 rounded-full flex items-center justify-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-cyan-500 ${
                    isActive
                      ? 'text-white'
                      : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />

                  {/* Badge for Pending items */}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-500 text-slate-950 font-black text-[9px] flex items-center justify-center shadow-sm">
                      {item.badge}
                    </span>
                  )}
                </button>

                {/* Dark filled circle that slides between items */}
                {isActive && (
                  <motion.div
                    layoutId="admin-active-pill"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    className="absolute inset-0 rounded-full bg-[var(--admin-rail-active)] shadow-md"
                  />
                )}

                {/* Hover Tooltip Label */}
                <AnimatePresence>
                  {hoveredTab === item.id && (
                    <motion.div
                      initial={{ opacity: 0, x: -6, scale: 0.94 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -6, scale: 0.94 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-[calc(100%+14px)] px-3 py-1.5 rounded-xl bg-[#09152a] text-white text-xs font-semibold whitespace-nowrap shadow-xl pointer-events-none z-50 border border-cyan-500/30"
                    >
                      {item.label}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Bottom Group: Theme Toggle, Settings, Sign Out, Admin Avatar */}
        <div className="flex flex-col items-center gap-2 pt-2 border-t border-[var(--admin-card-border)] w-full">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle theme"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => onSelectTab('settings')}
            aria-label="Settings"
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              activeTab === 'settings'
                ? 'bg-[var(--admin-rail-active)] text-white'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-black/5 dark:hover:bg-white/10'
            }`}
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Sign Out */}
          <button
            type="button"
            onClick={onLogout}
            aria-label="Sign Out"
            title="Sign out of administration"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--admin-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Admin Avatar */}
          <div
            title={`${adminName} (${adminEmail})`}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-600 to-teal-500 text-slate-950 font-black text-xs flex items-center justify-center shadow-sm select-none cursor-default"
          >
            {adminInitials}
          </div>
        </div>
      </aside>

      {/* =========================================================================
          MOBILE FLOATING BOTTOM DOCK
          (Dashboard, Reviews, Users, More) with 44px tap targets, dvh units
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
                className={`relative min-w-[52px] h-[44px] px-3 rounded-[22px] flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
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
            className="min-w-[48px] h-[44px] px-2.5 rounded-[22px] flex items-center justify-center text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)]"
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

              <div className="flex items-center justify-between pt-3 border-t border-[var(--admin-card-border)]">
                <button
                  type="button"
                  onClick={onToggleTheme}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 text-xs font-semibold"
                >
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
                  <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
                </button>

                <button
                  type="button"
                  onClick={onLogout}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-500 text-xs font-bold"
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
