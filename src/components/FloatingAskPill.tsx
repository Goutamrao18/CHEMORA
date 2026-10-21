import React, { useState, useEffect } from 'react';
import { Sparkles, FlaskConical } from 'lucide-react';

interface FloatingAskPillProps {
  onOpen: () => void;
  isAssistantOpen: boolean;
}

export const FloatingAskPill: React.FC<FloatingAskPillProps> = ({
  onOpen,
  isAssistantOpen,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Collapse while scrolling, expand after idle
  useEffect(() => {
    let scrollTimeout: number | null = null;

    const handleScroll = () => {
      setIsCollapsed(true);
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
      scrollTimeout = window.setTimeout(() => {
        setIsCollapsed(false);
      }, 550);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout) window.clearTimeout(scrollTimeout);
    };
  }, []);

  // Keyboard avoidance
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
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      if (isTextInput(e.target as Element)) {
        setTimeout(() => {
          if (!isTextInput(document.activeElement)) {
            setIsKeyboardOpen(false);
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

  // Hidden when assistant is open or keyboard is open
  const isHidden = isAssistantOpen || isKeyboardOpen;

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Ask CHEMORA AI Chemistry Assistant"
      className={`chemora-floating-ask ${isCollapsed ? 'chemora-ask--collapsed' : ''} ${
        isHidden ? 'chemora-ask--hidden' : ''
      }`}
    >
      <FlaskConical className="ask-icon" aria-hidden="true" />
      <span className="ask-text">Ask CHEMORA</span>
    </button>
  );
};
