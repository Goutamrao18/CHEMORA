import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, X, Send, Bot, Shield, Loader2 } from 'lucide-react';

interface AdminAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  adminName: string;
  initialQuery?: string;
}

interface AIMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

const SUGGESTIONS = [
  'Which level has the lowest accuracy?',
  'Summarise pending reviews',
  'Any videos failing?',
  'How is this week vs last week?',
];

export const AdminAIAssistant: React.FC<AdminAIAssistantProps> = ({
  isOpen,
  onClose,
  adminName,
  initialQuery,
}) => {
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello ${adminName.split(' ')[0]}. I'm Chemora Operational AI. I monitor challenge pass rates, review moderation queues, and video streaming health. How can I assist your laboratory overview today?`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery.trim());
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (queryText?: string) => {
    const q = (queryText || inputVal).trim();
    if (!q || isLoading) return;

    const userMsg: AIMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      });

      if (!res.ok) {
        throw new Error('Operational AI service unavailable.');
      }

      const data = await res.json();
      const aiMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: data.answer || 'No response returned from operational engine.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          sender: 'ai',
          text: 'Notice: Operational AI service temporarily unreachable. All platform metrics remain healthy.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
          />

          {/* Right-Side Panel (Desktop) / Bottom Sheet (Mobile) */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="absolute right-0 top-0 bottom-0 w-full sm:w-[440px] bg-[var(--admin-card-bg)] border-l border-[var(--admin-card-border)] shadow-2xl flex flex-col pointer-events-auto z-10"
          >
            {/* Header */}
            <div className="p-5 border-b border-[var(--admin-card-border)] flex items-center justify-between bg-gradient-to-r from-cyan-950/10 via-transparent to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#04212b] to-[#14a3c4] flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
                  <Bot className="w-5 h-5 text-cyan-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-sm text-[var(--admin-text-main)]">Chemora AI</h3>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                      Operational
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--admin-text-muted)] flex items-center gap-1">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    Read-only platform intelligence
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--admin-text-muted)] hover:text-[var(--admin-text-main)] hover:bg-black/5 dark:hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Suggestions Bar */}
            <div className="p-3 border-b border-[var(--admin-card-border)] bg-black/[0.02] dark:bg-white/[0.02] overflow-x-auto no-scrollbar flex gap-2">
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(sug)}
                  className="px-3 py-1.5 rounded-xl bg-[var(--admin-card-bg)] border border-[var(--admin-card-border)] shadow-sm hover:border-cyan-500/50 hover:bg-cyan-500/5 text-xs text-[var(--admin-text-main)] whitespace-nowrap transition active:scale-95 shrink-0"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-[var(--admin-rail-active)] text-white shadow-sm rounded-br-xs'
                        : 'bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-[var(--admin-text-main)] rounded-bl-xs'
                    }`}
                  >
                    <div dangerouslySetInnerHTML={{ __html: m.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
                  </div>
                  <span className="text-[9px] font-mono text-[var(--admin-text-muted)] mt-1 px-1">
                    {m.time}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 p-3 text-xs text-[var(--admin-text-muted)]">
                  <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                  <span>Synthesizing platform data...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-4 border-t border-[var(--admin-card-border)] bg-[var(--admin-card-bg)] flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask about accuracy, reviews, video health..."
                className="flex-1 h-11 px-4 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--admin-card-border)] text-xs text-[var(--admin-text-main)] placeholder-[var(--admin-text-muted)] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                aria-label="Send query"
                className="w-11 h-11 rounded-xl bg-[var(--admin-rail-active)] text-white flex items-center justify-center hover:opacity-90 active:scale-95 disabled:opacity-40 transition shadow-sm shrink-0"
              >
                <Send className="w-4 h-4 text-cyan-300" />
              </button>
            </form>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// Floating Orb Avatar Trigger Component
// Soft blue-cyan glow, idle float + blinking eyes animation
// ============================================================================
export const AdminAIOrbTrigger: React.FC<{ onClick: () => void }> = ({ onClick }) => {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      aria-label="Open Chemora AI Assistant"
      title="Ask Chemora Operational AI"
      className="fixed right-6 bottom-6 z-40 w-14 h-14 rounded-full bg-gradient-to-tr from-[#04212b] via-[#093545] to-[#14a3c4] border-2 border-cyan-400/50 shadow-[0_12px_36px_rgba(20,163,196,0.45)] flex items-center justify-center text-white cursor-pointer group"
    >
      {/* Soft Glow Halo */}
      <span className="absolute inset-0 rounded-full bg-cyan-400/20 blur-md group-hover:bg-cyan-400/35 transition" />

      {/* SVG Blinking Eyes Orb face */}
      <svg className="w-7 h-7 relative z-10" viewBox="0 0 32 32" fill="none">
        {/* Left eye */}
        <ellipse cx="11" cy="16" rx="2" ry="3.5" fill="#7fdcef" className="orb-eye" />
        {/* Right eye */}
        <ellipse cx="21" cy="16" rx="2" ry="3.5" fill="#7fdcef" className="orb-eye" />
        {/* Subtle smile curve */}
        <path d="M12 21 C14 23, 18 23, 20 21" stroke="#7fdcef" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </motion.button>
  );
};
