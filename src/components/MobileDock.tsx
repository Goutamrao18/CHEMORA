import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ActiveTab } from './Navbar';
import {
  Home,
  BookOpen,
  FlaskConical,
  Trophy,
  User,
} from 'lucide-react';

interface MobileDockProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
}

interface DockTab {
  id: 'home' | 'know' | 'experiments' | 'challenge' | 'profile';
  targetTab: ActiveTab;
  label: string;
  icon: (active: boolean) => React.ReactNode;
}

const DOCK_TABS: DockTab[] = [
  {
    id: 'home',
    targetTab: 'home',
    label: 'Home',
    icon: (active) => (
      <Home
        className={`w-[19px] h-[19px] transition-transform duration-200 ${
          active ? 'scale-110 fill-cyan-400/25 stroke-cyan-400' : 'stroke-slate-400'
        }`}
      />
    ),
  },
  {
    id: 'know',
    targetTab: 'know',
    label: 'Know',
    icon: (active) => (
      <BookOpen
        className={`w-[19px] h-[19px] transition-transform duration-200 ${
          active ? 'scale-110 fill-cyan-400/25 stroke-cyan-400' : 'stroke-slate-400'
        }`}
      />
    ),
  },
  {
    id: 'experiments',
    targetTab: 'experiments',
    label: 'Labs',
    icon: (active) => (
      <FlaskConical
        className={`w-[19px] h-[19px] transition-transform duration-200 ${
          active ? 'scale-110 fill-cyan-400/25 stroke-cyan-400' : 'stroke-slate-400'
        }`}
      />
    ),
  },
  {
    id: 'challenge',
    targetTab: 'challenge',
    label: 'Arena',
    icon: (active) => (
      <Trophy
        className={`w-[19px] h-[19px] transition-transform duration-200 ${
          active ? 'scale-110 fill-cyan-400/25 stroke-cyan-400' : 'stroke-slate-400'
        }`}
      />
    ),
  },
  {
    id: 'profile',
    targetTab: 'progress',
    label: 'Profile',
    icon: (active) => (
      <User
        className={`w-[19px] h-[19px] transition-transform duration-200 ${
          active ? 'scale-110 fill-cyan-400/25 stroke-cyan-400' : 'stroke-slate-400'
        }`}
      />
    ),
  },
];

export const MobileDock: React.FC<MobileDockProps> = ({
  activeTab,
  onSelectTab,
}) => {
  const dockRef = useRef<HTMLElement>(null);
  const blobRef = useRef<HTMLDivElement>(null);
  const [isHidden, setIsHidden] = useState(false);
  const [blobStyle, setBlobStyle] = useState<{ transform: string; width: string }>({
    transform: 'translateX(0px)',
    width: '20%',
  });

  // Determine active dock tab
  const getActiveDockTabId = useCallback((): DockTab['id'] => {
    if (activeTab === 'progress' || activeTab === 'account') {
      return 'profile';
    }
    return activeTab as DockTab['id'];
  }, [activeTab]);

  const activeDockId = getActiveDockTabId();

  // Update sliding blob position
  const updateBlobPosition = useCallback((animate = true) => {
    const dockEl = dockRef.current;
    if (!dockEl) return;

    const activeIndex = DOCK_TABS.findIndex((t) => t.id === activeDockId);
    if (activeIndex === -1) return;

    const trackWidth = dockEl.clientWidth - 6; // minus 3px padding on both sides
    const itemWidth = trackWidth / DOCK_TABS.length;
    const targetX = 3 + (activeIndex * itemWidth);

    setBlobStyle({
      transform: `translateX(${targetX}px)`,
      width: `${itemWidth}px`,
    });

    if (blobRef.current) {
      if (!animate || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        blobRef.current.style.transition = 'none';
      } else {
        blobRef.current.style.willChange = 'transform';
        blobRef.current.style.transition = 'transform 260ms cubic-bezier(0.16, 1, 0.3, 1), width 260ms cubic-bezier(0.16, 1, 0.3, 1)';
        setTimeout(() => {
          if (blobRef.current) blobRef.current.style.willChange = 'auto';
        }, 300);
      }
    }
  }, [activeDockId]);

  useEffect(() => {
    updateBlobPosition(true);
  }, [updateBlobPosition]);

  // Recalculate on screen resize or orientation change
  useEffect(() => {
    const handleResize = () => updateBlobPosition(false);
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, [updateBlobPosition]);

  // Passive RAF scroll listener: Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    let lastScrollY = window.pageYOffset || document.documentElement.scrollTop;
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const currentY = window.pageYOffset || document.documentElement.scrollTop;

        // Always show near top
        if (currentY <= 40) {
          setIsHidden(false);
          lastScrollY = currentY;
          ticking = false;
          return;
        }

        const delta = currentY - lastScrollY;
        if (Math.abs(delta) > 8) {
          if (delta > 0 && currentY > 80) {
            // Scrolling down -> hide dock
            setIsHidden(true);
          } else {
            // Scrolling up -> show dock
            setIsHidden(false);
          }
          lastScrollY = currentY;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard avoidance: Hide dock when text input is focused
  useEffect(() => {
    const isTextInput = (el: Element | null): boolean => {
      if (!el || !el.tagName) return false;
      const tag = el.tagName.toLowerCase();
      if (tag === 'textarea') return true;
      if (tag === 'input') {
        const type = (el.getAttribute('type') || 'text').toLowerCase();
        return ['text', 'search', 'email', 'password', 'number', 'tel', 'url'].includes(type);
      }
      return false;
    };

    const handleFocusIn = (e: FocusEvent) => {
      if (isTextInput(e.target as Element)) {
        setIsHidden(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (isTextInput(e.target as Element)) {
        setTimeout(() => {
          if (!isTextInput(document.activeElement)) {
            setIsHidden(false);
          }
        }, 120);
      }
    };

    document.addEventListener('focusin', handleFocusIn, { passive: true });
    document.addEventListener('focusout', handleFocusOut, { passive: true });
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const handleTabClick = (tab: DockTab) => {
    if (tab.id === 'profile') {
      // Toggle between progress and account if already on profile
      const nextTarget = activeTab === 'progress' ? 'account' : 'progress';
      onSelectTab(nextTarget);
    } else {
      onSelectTab(tab.targetTab);
    }
  };

  return (
    <nav
      ref={dockRef}
      aria-label="Main"
      className={`chemora-mobile-dock ${isHidden ? 'chemora-dock--hidden' : ''}`}
    >
      <div className="chemora-dock-track">
        {/* Sliding Blob Indicator */}
        <div
          ref={blobRef}
          className="chemora-dock-blob"
          style={blobStyle}
          aria-hidden="true"
        />

        {/* 5 Tab Items */}
        {DOCK_TABS.map((tab) => {
          const isActive = tab.id === activeDockId;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab)}
              className="chemora-dock-item"
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
            >
              <span className="chemora-dock-icon">
                {tab.icon(isActive)}
              </span>
              <span className="chemora-dock-label">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
