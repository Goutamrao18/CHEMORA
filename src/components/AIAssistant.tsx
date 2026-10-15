import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Bot, User, BookOpen, AlertTriangle } from 'lucide-react';

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

// Built-in intelligent chemistry tutor responses for immediate, reliable offline assistance
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
      // First attempt server endpoint if configured
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
        // Simulate thoughtful tutor pause
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
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          onClick={onOpen}
          aria-label="Open CHEMORA AI Assistant"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all duration-200 border border-cyan-400/30"
        >
          <Sparkles className="w-5 h-5 animate-pulse text-cyan-200" />
          <span className="text-sm font-bold tracking-wide">CHEMORA AI</span>
        </button>
      )}

      {/* Assistant Modal Drawer */}
      {isOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[420px] bg-[#0c121e] border-l border-cyan-900/50 shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-900/40 bg-gradient-to-r from-[#0d1728] to-[#0c121e]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base leading-tight">CHEMORA AI</h3>
                <span className="text-xs text-cyan-400 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Active Chemistry Tutor
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
              aria-label="Close Assistant"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Prompts */}
          <div className="p-3 bg-[#0a0f18] border-b border-cyan-950/60 overflow-x-auto flex gap-2 no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="whitespace-nowrap text-xs px-3 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/40 text-cyan-200 hover:bg-cyan-900/50 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-cyan-900/40 border border-cyan-700/50 flex items-center justify-center text-cyan-300 flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-[#131d2e] border border-cyan-900/40 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span className={`block text-[10px] mt-1.5 ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-500'}`}>
                    {msg.time}
                  </span>
                </div>
                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-blue-700 flex items-center justify-center text-white flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-3 items-center">
                <div className="w-7 h-7 rounded-lg bg-cyan-900/40 border border-cyan-700/50 flex items-center justify-center text-cyan-300">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-[#131d2e] border border-cyan-900/40 rounded-2xl rounded-tl-none px-4 py-2.5 text-cyan-400 text-xs flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-1 text-slate-400">Synthesizing chemistry response...</span>
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
            className="p-3 bg-[#0a0f18] border-t border-cyan-900/40 flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask any chemistry question..."
              className="flex-1 bg-[#131c2c] border border-cyan-900/60 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="p-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 transition"
              aria-label="Send query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
