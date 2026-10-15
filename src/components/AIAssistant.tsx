import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User } from 'lucide-react';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

const QUICK_PROMPTS = [
  "How does acid-base titration work?",
  "Why does copper burn blue-green?",
  "What is the difference between ionic and covalent bonding?",
  "What safety precautions are needed for concentrated HCl?"
];

function getOfflineChemistryAnswer(prompt: string): string {
  const q = prompt.toLowerCase();
  
  if (q.includes("titration") || q.includes("neutralis") || q.includes("neutraliz")) {
    return "Acid-base titration measures the unknown concentration of an acid or alkali by precisely reacting it with a standard solution of known concentration. Using a burette, you add the titrant dropwise into the analyte in a conical flask with a pH indicator (like phenolphthalein). At the equivalence point, the moles of H⁺ exactly balance the moles of OH⁻: HCl + NaOH → NaCl + H₂O.";
  }
  if (q.includes("flame") || q.includes("copper") || q.includes("colour") || q.includes("color")) {
    return "In flame tests, heat energy excites valence electrons to higher electronic orbitals. When these electrons transition back to lower ground energy states, they emit light at characteristic wavelengths: Sodium (Na⁺) emits persistent brilliant yellow (589 nm), Potassium (K⁺) emits pale lilac, Calcium (Ca²⁺) gives brick red/orange, and Copper(II) (Cu²⁺) gives an intense blue-green flame!";
  }
  if (q.includes("bond") || q.includes("covalent") || q.includes("ionic")) {
    return "Ionic bonding occurs between metals and non-metals via electrostatic attraction after complete electron transfer (e.g. Na⁺ and Cl⁻ forming crystalline lattices). Covalent bonding occurs when non-metal atoms share pairs of valence electrons to achieve stable octet noble gas configurations (such as H₂O or CH₄).";
  }
  if (q.includes("safety") || q.includes("hazard") || q.includes("acid") || q.includes("goggles")) {
    return "Laboratory Safety Rules: Always wear chemical-resistant splash goggles, a lab coat, and nitrile gloves. Never add water to concentrated acid ('Always add Acid to water - AAA'). Work inside a fume hood when volatile vapors or chlorine/nitrogen oxides are evolved. Wash any skin splashes with copious water immediately.";
  }
  if (q.includes("golden rain") || q.includes("lead")) {
    return "The 'Golden Rain' reaction: Lead(II) nitrate reacts with potassium iodide to produce bright yellow lead(II) iodide: Pb(NO₃)₂ + 2KI → PbI₂(s) + 2KNO₃. Because lead iodide is much more soluble in boiling water than cold water, heating it dissolves the solid, and slow cooling crystallizes shimmering hexagonal golden flakes!";
  }
  if (q.includes("rate") || q.includes("catalyst") || q.includes("collision")) {
    return "Collision Theory dictates that chemical reactions require particles to collide with kinetic energy exceeding activation energy (Ea) and with correct geometric orientation. Catalysts provide an alternate lower activation energy pathway without being consumed. Increasing temperature boosts both collision frequency and the fraction of collisions with sufficient energy.";
  }
  return `Great chemistry question! When analyzing "${prompt}", always consider fundamental principles: electron configurations, conservation of mass and charge in balanced equations, thermodynamics (enthalpy & entropy), and reaction kinetics. Feel free to explore our Know Library or Guided Experiments for interactive visual demonstrations!`;
}

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, onOpen }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: "Hello! I'm CHEMORA AI, your interactive chemistry tutor. Ask me about reactions, apparatus, chemical equations, lab safety, or any of our 100 challenge questions!",
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      let answer = '';
      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: query, context: 'CHEMORA Chemistry Learning Workspace' })
        });
        if (res.ok) {
          const data = await res.json();
          if (data?.answer) answer = data.answer;
        }
      } catch {
        // Fall back to offline assistant
      }

      if (!answer) {
        await new Promise(r => setTimeout(r, 600));
        answer = getOfflineChemistryAnswer(query);
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: answer,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch {
      const fallbackMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: getOfflineChemistryAnswer(query),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      {/* Floating Launcher Button - Bottom Right */}
      {!isOpen && (
        <button
          onClick={onOpen}
          aria-label="Open CHEMORA AI"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-[#216d9b] via-[#39d7ff] to-[#6d5dfc] text-white font-bold text-xs uppercase tracking-wider shadow-[0_12px_34px_rgba(0,0,0,0.4)] hover:shadow-[0_16px_40px_rgba(57,215,255,0.4)] hover:scale-105 active:scale-95 transition-all duration-200 border border-cyan-300/40"
        >
          <Sparkles className="w-4 h-4 text-cyan-100" />
          <span>CHEMORA AI</span>
        </button>
      )}

      {/* Assistant Modal Window - Anchored Cleanly Below TopBar without Overlap */}
      {isOpen && (
        <div className="fixed top-20 right-4 sm:right-6 bottom-6 z-50 w-[min(400px,calc(100vw-32px))] bg-[#0a121f]/95 border border-cyan-500/40 rounded-[24px] shadow-[0_24px_70px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden backdrop-blur-2xl anim-popup">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-900/40 bg-gradient-to-r from-[#0c182d] to-[#0a121f]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-[0_0_15px_rgba(57,215,255,0.4)] font-bold text-sm">
                ✦
              </div>
              <div>
                <strong className="block text-sm text-white font-bold">CHEMORA AI</strong>
                <small className="block text-[10px] text-cyan-400 font-mono">Text chemistry tutor</small>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 flex items-center justify-center transition hover:scale-105 active:scale-95"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-[#070d17] border-b border-cyan-950/60 overflow-x-auto flex gap-1.5 no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full bg-[#0c1a2e] border border-cyan-800/40 text-cyan-200 hover:bg-cyan-900/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 anim-slide-up ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 flex-shrink-0 mt-0.5 text-xs font-bold">
                    ✦
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3 text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#216d9b] to-[#4b3eb5] text-white rounded-tr-none shadow-md'
                      : 'bg-white/[0.08] border border-cyan-900/30 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className={`block text-[9px] mt-1 ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-500'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 items-center">
                <div className="w-6 h-6 rounded-md bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 text-xs">
                  ✦
                </div>
                <div className="bg-white/[0.08] border border-cyan-900/30 rounded-2xl rounded-tl-none px-3.5 py-2 text-cyan-300 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]" />
                  <span className="ml-1 text-slate-400 text-[11px]">Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#070d17] border-t border-cyan-900/40 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a chemistry question..."
              className="flex-1 bg-white/[0.06] border border-cyan-900/50 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-9 h-9 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 text-white font-bold flex items-center justify-center disabled:opacity-40 transition shadow-sm"
              aria-label="Send"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
};
