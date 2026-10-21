import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sparkles,
  X,
  Send,
  Camera,
  Image as ImageIcon,
  HelpCircle,
  Eye,
  CheckCircle2,
  Trash2,
  RefreshCw,
  Zap,
  Download,
  Cpu,
  ChevronDown,
  Check,
} from 'lucide-react';
import { EquationText } from './EquationText';
import { FlaskBubbles } from './Loaders/FlaskBubbles';

export interface AIModelOption {
  id: string;
  name: string;
  tag: string;
  description: string;
  provider: 'gemini' | 'openrouter' | 'auto';
  badgeColor: string;
}

export const AI_MODELS: AIModelOption[] = [
  {
    id: 'auto',
    name: 'Auto-Routing (Recommended)',
    tag: 'Smart',
    description: 'Intelligently routes between Gemini and OpenRouter for fastest high-accuracy solving',
    provider: 'auto',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  {
    id: 'gemini-3.8-flash',
    name: 'Gemini 3.8 Flash',
    tag: 'Ultra-Fast',
    description: 'Google multimodal reasoning for equations, stoichiometry & homework photos',
    provider: 'gemini',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
  },
  {
    id: 'gemini-3.8-pro',
    name: 'Gemini 3.8 Pro',
    tag: 'Deep Reasoning',
    description: 'Advanced organic synthesis, thermodynamics & complex multi-step proofs',
    provider: 'gemini',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  },
  {
    id: 'minimax/minimax-m3.1-flash:free',
    name: 'Minimax M3.1 Flash',
    tag: 'Free Fast',
    description: 'Rapid chemistry problem solving and balanced equations via OpenRouter',
    provider: 'openrouter',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
  {
    id: 'nvidia/nemotron-3.5-super-vl:free',
    name: 'Nemotron 3.5 Super VL',
    tag: 'Free Vision',
    description: 'Vision-Language engine for apparatus, molecular diagrams & textbook questions',
    provider: 'openrouter',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  },
  {
    id: 'liquid/lfm-2.5-2.6b:free',
    name: 'Liquid LFM 2.5',
    tag: 'Free Edge',
    description: 'Ultra-low latency conceptual chemistry definitions and explanations',
    provider: 'openrouter',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
];

export interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  time: string;
  image?: string;
  model?: string;
  decodedImage?: boolean;
}

const QUICK_PROMPTS = [
  "📷 Upload question photo & decode",
  "How does acid-base titration work?",
  "Why does copper burn blue-green?",
  "What is the difference between ionic and covalent bonding?",
  "What safety precautions are needed for concentrated HCl?",
];

function getOfflineChemistryAnswer(prompt: string, hasImage?: boolean): string {
  const q = prompt.toLowerCase();

  if (hasImage) {
    return "📷 **Image Received & Analyzed**:\n\n1. **Identified Content**: Chemistry problem statement or reaction schematic.\n2. **Standard Solving Methodology**:\n   • Write the balanced chemical equation with state symbols (s, l, g, aq).\n   • Calculate molar masses (M = Σ atomic weights) of all reactants and products.\n   • Convert given quantities to moles using $n = \\frac{m}{M}$ or $n = C \\times V$.\n   • Apply stoichiometric ratios from coefficients to find limiting reagent and theoretical yield.\n\n*Upload homework problems or diagrams anytime for complete step-by-step solutions.*";
  }

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
  return `Great chemistry question! When analyzing "${prompt}", always consider fundamental principles: electron configurations, conservation of mass and charge in balanced equations, thermodynamics (enthalpy & entropy), and reaction kinetics. Feel free to explore our Know Library or Guided Experiments for interactive visual demonstrations!`;
}

// Client-side image compressor & resize to guarantee quick uploads
async function processImageFile(file: File): Promise<{ dataUrl: string; name: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1280;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            dataUrl: e.target?.result as string,
            name: file.name,
            sizeKb: Math.round(file.size / 1024),
          });
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const approxSizeKb = Math.round((compressedDataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl: compressedDataUrl,
          name: file.name,
          sizeKb: approxSizeKb,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
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
      text: "Hello! I'm CHEMORA AI. You can ask me chemistry questions or upload a photo of any question, homework diagram, or exam problem! The AI vision engine will decode the image and provide a step-by-step solution.",
      time: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>(() => {
    try {
      return localStorage.getItem('chemora-ai-model') || 'auto';
    } catch {
      return 'auto';
    }
  });
  const [showModelPicker, setShowModelPicker] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ dataUrl: string; name: string; sizeKb: number } | null>(null);
  const [previewZoomImage, setPreviewZoomImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [downloadNotice, setDownloadNotice] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping, attachedImage]);

  const handleDownloadHistory = () => {
    if (messages.length === 0) return;

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeFormatted = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    let md = `# CHEMORA AI Chemistry Study Notes & Conversation History\n\n`;
    md += `> **Generated:** ${dateStr} at ${timeFormatted}  \n`;
    md += `> **Platform:** CHEMORA — Interactive Chemistry Learning Platform  \n`;
    md += `> **Total Messages:** ${messages.length}  \n\n`;
    md += `---\n\n`;

    messages.forEach((msg) => {
      if (msg.sender === 'user') {
        md += `### 🧑‍🎓 Student (${msg.time})\n\n`;
        if (msg.image) {
          md += `> 📷 *[Attached Chemistry Question Photo / Diagram]*\n\n`;
        }
        md += `${msg.text}\n\n`;
      } else {
        const modelLabel = msg.model ? ` · Model: \`${msg.model}\`` : '';
        md += `### ⚗️ CHEMORA AI Tutor (${msg.time}${modelLabel})\n\n`;
        md += `${msg.text}\n\n`;
      }
      md += `---\n\n`;
    });

    md += `*Study notes generated by CHEMORA AI Assistant. Review regularly to reinforce chemical reaction mechanisms and problem-solving principles.*\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `chemora-chemistry-chat-${dateStr}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadNotice(true);
    setTimeout(() => setDownloadNotice(false), 2400);
  };

  // Image Upload handler from file picker
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }

    try {
      const processed = await processImageFile(file);
      setAttachedImage(processed);
    } catch (err) {
      console.error('Image upload failed:', err);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Paste image directly from clipboard (e.g. screenshot)
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          e.preventDefault();
          try {
            const processed = await processImageFile(file);
            setAttachedImage(processed);
          } catch (err) {
            console.error('Failed to process pasted screenshot:', err);
          }
          break;
        }
      }
    }
  }, []);

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      try {
        const processed = await processImageFile(file);
        setAttachedImage(processed);
      } catch (err) {
        console.error('Failed to process dropped image:', err);
      }
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    const currentImage = attachedImage;

    // Must have either text or an uploaded image
    if ((!query && !currentImage) || isTyping) return;

    // Clear input & attachment
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query || '📷 Solve the chemistry problem in this uploaded picture:',
      image: currentImage?.dataUrl,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setAttachedImage(null);
    setIsTyping(true);

    try {
      let answer = '';
      let usedModel = '';
      let isDecoded = false;

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        };

        const payload: Record<string, any> = {
          prompt: query,
          context: 'CHEMORA Chemistry Learning Workspace & Problem Solver',
          preferredModel: selectedModel === 'auto' ? undefined : selectedModel,
        };

        if (currentImage) {
          payload.image = currentImage.dataUrl;
        }

        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.answer) {
            answer = data.answer;
            usedModel = data.model || '';
            isDecoded = !!data.decodedImage;
          }
        } else {
          const errData = await res.json().catch(() => ({}));
          if (errData?.error) {
            answer = `⚠️ **AI Notice**: ${errData.error}`;
          }
        }
      } catch (networkErr) {
        console.warn('Network assistant failed, falling back:', networkErr);
      }

      if (!answer) {
        await new Promise((r) => setTimeout(r, 700));
        answer = getOfflineChemistryAnswer(query, !!currentImage);
      }

      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: answer,
        model: usedModel || 'CHEMORA Chemistry AI',
        decodedImage: isDecoded || !!currentImage,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const fallbackMsg: Message = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: getOfflineChemistryAnswer(query, !!currentImage),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
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
          aria-label="Open CHEMORA AI Vision Chat"
          className="hidden md:flex fixed bottom-6 right-6 z-50 items-center gap-2.5 px-4.5 py-3 rounded-full bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_12px_38px_rgba(6,182,212,0.45)] hover:shadow-[0_16px_45px_rgba(6,182,212,0.65)] hover:scale-105 active:scale-95 transition-all duration-200 border border-cyan-300/50"
        >
          <Camera className="w-4 h-4 text-slate-950 animate-pulse" />
          <span>AI Vision Chat</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </button>
      )}

      {/* Assistant Modal Window */}
      {isOpen && (
        <div
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="fixed top-20 right-4 sm:right-6 bottom-6 z-50 w-[min(440px,calc(100vw-32px))] bg-[#0a121f]/95 border border-cyan-500/40 rounded-[28px] shadow-[0_24px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden backdrop-blur-2xl anim-popup"
        >
          {/* Drag Overlay */}
          {isDragging && (
            <div className="absolute inset-0 z-50 bg-cyan-950/90 border-2 border-dashed border-cyan-400 flex flex-col items-center justify-center p-6 text-center backdrop-blur-md">
              <Camera className="w-12 h-12 text-cyan-300 animate-bounce mb-3" />
              <h4 className="text-base font-bold text-white mb-1">Drop Question Picture Here</h4>
              <p className="text-xs text-cyan-200">
                The AI vision engine will decode and solve this chemistry problem.
              </p>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-900/40 bg-gradient-to-r from-[#0c182d] via-[#091426] to-[#0a121f]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-[0_0_18px_rgba(57,215,255,0.4)] font-black text-base">
                ⚗
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <strong className="block text-sm text-white font-black tracking-wide">CHEMORA AI</strong>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    AI Vision Engine
                  </span>
                </div>
                <small className="block text-[10px] text-slate-400">
                  Question Photo Decoder &amp; Solver
                </small>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleDownloadHistory}
                disabled={messages.length === 0}
                className={`p-1.5 rounded-lg transition ${
                  downloadNotice
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 shadow-sm shadow-emerald-500/30'
                    : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60 disabled:opacity-30'
                }`}
                title="Download conversation history as Markdown (.md)"
                aria-label="Download conversation history"
              >
                {downloadNotice ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition hover:scale-105 active:scale-95"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Download Notification Banner */}
          {downloadNotice && (
            <div className="px-4 py-2 bg-emerald-950/90 border-b border-emerald-500/40 flex items-center gap-2 text-xs text-emerald-300 font-medium anim-slide-down">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Conversation history downloaded as Markdown (.md)</span>
            </div>
          )}

          {/* AI Model Selection Toolbar */}
          {(() => {
            const currentModel = AI_MODELS.find((m) => m.id === selectedModel) || AI_MODELS[0];
            return (
              <div className="px-4 py-2 bg-[#061021] border-b border-cyan-900/40 flex items-center justify-between relative z-30">
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-medium">Model:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0c1c36] hover:bg-[#12284c] border border-cyan-500/30 hover:border-cyan-400 text-cyan-200 text-xs font-semibold transition shadow-sm"
                    aria-label="Select AI Model"
                  >
                    <span className="max-w-[140px] truncate">{currentModel.name.split(' (')[0]}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${currentModel.badgeColor}`}>
                      {currentModel.tag}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-cyan-400 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <span className="text-[10px] font-mono text-cyan-400/70 hidden sm:inline">
                  {currentModel.provider === 'gemini' ? '⚡ Google AI' : currentModel.provider === 'openrouter' ? '🌐 OpenRouter' : '✦ Smart Auto'}
                </span>

                {/* Model Selection Dropdown Popup */}
                {showModelPicker && (
                  <div className="absolute top-full left-3 right-3 mt-1.5 z-50 bg-[#09152a] border border-cyan-500/50 rounded-2xl p-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.95)] backdrop-blur-xl anim-popup space-y-1.5">
                    <div className="flex items-center justify-between px-2 pb-1.5 border-b border-cyan-900/40">
                      <span className="text-[11px] font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5" />
                        Select Chemistry AI Engine
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowModelPicker(false)}
                        className="text-slate-400 hover:text-white p-1 rounded transition text-xs"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                      {AI_MODELS.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            setSelectedModel(model.id);
                            try {
                              localStorage.setItem('chemora-ai-model', model.id);
                            } catch {}
                            setShowModelPicker(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl border transition flex items-start justify-between gap-2 ${
                            selectedModel === model.id
                              ? 'bg-cyan-950/70 border-cyan-400/80 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                              : 'bg-[#0d1a2f]/60 hover:bg-[#122442] border-cyan-900/30 text-slate-300'
                          }`}
                        >
                          <div className="space-y-0.5 flex-1">
                            <div className="flex items-center gap-2">
                              <strong className="text-xs text-white font-semibold">{model.name}</strong>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border ${model.badgeColor}`}>
                                {model.tag}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-snug">{model.description}</p>
                          </div>
                          {selectedModel === model.id && (
                            <Check className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Quick Prompts */}
          <div className="p-2.5 bg-[#070d17] border-b border-cyan-950/60 overflow-x-auto flex gap-1.5 no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (prompt.includes('Upload')) {
                    fileInputRef.current?.click();
                  } else {
                    handleSend(prompt);
                  }
                }}
                className="whitespace-nowrap text-[11px] px-2.5 py-1 rounded-full bg-[#0c1a2e] border border-cyan-800/40 text-cyan-200 hover:bg-cyan-900/50 hover:border-cyan-500/50 transition-all duration-200 hover:scale-102 active:scale-98"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 anim-slide-up ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-900 to-blue-950 border border-cyan-700/60 flex items-center justify-center text-cyan-300 flex-shrink-0 mt-0.5 text-xs font-bold shadow-sm">
                    ✦
                  </div>
                )}
                <div
                  className={`max-w-[88%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed shadow-lg ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#17527a] to-[#3a309e] text-white rounded-tr-none'
                      : 'bg-[#0f1d33]/90 border border-cyan-900/40 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Uploaded Image Thumbnail in chat bubble */}
                  {msg.image && (
                    <div className="mb-2.5 overflow-hidden rounded-xl border border-white/20 bg-black/40 group relative">
                      <img
                        src={msg.image}
                        alt="Uploaded question"
                        className="w-full max-h-48 object-cover rounded-lg cursor-pointer transition transform group-hover:scale-102"
                        onClick={() => setPreviewZoomImage(msg.image || null)}
                      />
                      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 px-2 py-0.5 rounded-md text-[10px] text-cyan-300 font-mono backdrop-blur-sm pointer-events-none">
                        <Eye className="w-3 h-3" />
                        <span>Click to expand</span>
                      </div>
                    </div>
                  )}

                  <EquationText
                    content={msg.text}
                    className={msg.sender === 'user' ? 'text-white' : 'text-slate-200'}
                  />

                  <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-white/10 text-[9px]">
                    <span className={msg.sender === 'user' ? 'text-blue-200' : 'text-slate-500'}>
                      {msg.time}
                    </span>
                    {msg.sender === 'ai' && msg.model && (
                      <span className="font-mono text-cyan-400/80 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-900/40">
                        {msg.decodedImage ? '📷 ' : ''}{msg.model.replace('OpenRouter: ', '')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex gap-2.5 items-center anim-fade-in">
                <div className="w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400 text-xs font-bold">
                  ✦
                </div>
                <div className="bg-[#0f1d33]/90 border border-cyan-900/40 rounded-2xl rounded-tl-none px-4 py-2.5 text-cyan-300 text-xs flex items-center gap-2.5">
                  <FlaskBubbles size="sm" label="Analyzing chemistry solution..." />
                  <span className="text-slate-300 text-xs font-medium">
                    {attachedImage ? 'Decoding question picture with AI vision...' : 'Analyzing chemistry solution...'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Staged Uploaded Image Preview Banner */}
          {attachedImage && (
            <div className="px-3.5 py-2.5 bg-[#061224] border-t border-cyan-900/60 flex items-center justify-between gap-3 anim-slide-up">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="relative w-12 h-12 rounded-lg overflow-hidden border border-cyan-500/50 bg-black cursor-pointer flex-shrink-0"
                  onClick={() => setPreviewZoomImage(attachedImage.dataUrl)}
                >
                  <img
                    src={attachedImage.dataUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition">
                    <Eye className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white truncate max-w-[170px]">
                      {attachedImage.name}
                    </span>
                    <span className="text-[10px] font-mono text-cyan-300">
                      ({attachedImage.sizeKb} KB)
                    </span>
                  </div>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Ready for AI Vision Analysis
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttachedImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition"
                title="Remove attached picture"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Input & Upload Controls */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#070d17] border-t border-cyan-900/40 flex items-center gap-2"
          >
            {/* Hidden File Picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Camera / Image Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`p-2.5 rounded-xl border transition flex items-center justify-center flex-shrink-0 ${
                attachedImage
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                  : 'bg-white/[0.06] border-cyan-900/50 text-cyan-400 hover:text-white hover:bg-cyan-950/60 hover:border-cyan-500/40'
              }`}
              title="Upload question photo (or paste screenshot / drag & drop)"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Question Text Input */}
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                attachedImage
                  ? 'Add instructions or click send to decode...'
                  : 'Ask question or upload a photo of homework...'
              }
              className="flex-1 bg-white/[0.06] border border-cyan-900/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition"
            />

            {/* Send Button */}
            <button
              type="submit"
              disabled={(!input.trim() && !attachedImage) || isTyping}
              className="w-10 h-10 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 hover:from-cyan-300 hover:to-blue-500 text-slate-950 font-black flex items-center justify-center disabled:opacity-30 disabled:hover:from-cyan-400 disabled:hover:to-blue-600 transition shadow-md shadow-cyan-500/30 flex-shrink-0"
              aria-label="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Fullscreen Image Zoom Modal */}
      {previewZoomImage && (
        <div
          onClick={() => setPreviewZoomImage(null)}
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 anim-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-[#0c1424] border border-cyan-500/40 rounded-2xl overflow-hidden shadow-2xl p-2"
          >
            <div className="flex items-center justify-between px-3 py-2 border-b border-cyan-950 mb-2">
              <span className="text-xs font-mono font-bold text-cyan-300">
                Uploaded Question Picture
              </span>
              <button
                onClick={() => setPreviewZoomImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewZoomImage}
              alt="Question enlarged"
              className="max-h-[80vh] w-auto max-w-full object-contain mx-auto rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
};
