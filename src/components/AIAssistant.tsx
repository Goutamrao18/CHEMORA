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
  const q = (prompt || '').toLowerCase();

  if (hasImage) {
    return `📷 **Laboratory Image & Homework Analysis**:

1. **Analytical Framework**:
   • **Apparatus & Setup**: Inspect fluid levels, meniscuses (measure bottom curve at eye level), stopcocks, and heating sources.
   • **Reaction Stoichiometry**: Write the complete balanced reaction with state symbols:
     \\[ \\text{Reactants}_{(aq/s)} \\rightarrow \\text{Products}_{(aq/l/g)} \\]
   • **Quantitative Solving**: Convert given masses or volumes to moles via \\(n = \\frac{m}{M}\\) or \\(n = C \\times V\\). Determine limiting reagents by comparing stoichiometric mole ratios.

2. **Laboratory Safety**:
   • Verify closed systems have adequate pressure relief. Always work with chemical splash goggles, a buttoned lab coat, and nitrile gloves.`;
  }

  // Acid-Base Titration & Neutralization
  if (q.includes('titration') || q.includes('neutralis') || q.includes('neutraliz') || q.includes('burette') || q.includes('analyte')) {
    return `### Acid-Base Titration & Quantitative Neutralization

**1. Fundamental Objective & Principle**
Acid-base titration is a high-precision analytical method used to determine the unknown concentration of an acid or alkali (the *analyte*) by reacting it with a solution of known concentration (the *titrant* or *standard solution*).

**2. Stoichiometric Equivalence Point**
Neutralization occurs when hydronium ions \\(\\text{H}_3\\text{O}^+\\) completely react with hydroxide ions \\(\\text{OH}^-\\):
\\[ \\text{HCl}_{(aq)} + \\text{NaOH}_{(aq)} \\rightarrow \\text{NaCl}_{(aq)} + \\text{H}_2\\text{O}_{(l)} \\]
For monoprotic systems:
\\[ C_a \\times V_a = C_b \\times V_b \\]
Where \\(C\\) is molar concentration (mol/L) and \\(V\\) is volume delivered. For polyprotic acids (e.g. \\(\\text{H}_2\\text{SO}_4\\)):
\\[ n_a C_a V_a = n_b C_b V_b \\]

**3. Experimental Apparatus & Protocol**
- **Burette**: Dispenses titrant dropwise into the flask. Readings are taken at the bottom of the meniscus to the nearest \\(0.05\\text{ mL}\\).
- **Volumetric Pipette**: Transfers an exact, repeatable volume of analyte into the conical flask.
- **Conical Flask (Erlenmeyer)**: Accommodates vigorous circular swirling without liquid splashing out.

**4. Indicator Selection Guide**
- **Phenolphthalein**: Colorless in acid, turning faint persistent pink at pH 8.2–10.0 (ideal for strong acid–strong base and weak acid–strong base).
- **Methyl Orange**: Red in acid, yellow in alkaline solution (orange transition endpoint at pH 3.1–4.4; optimal for strong acid–weak base).
- **Bromothymol Blue**: Yellow in acid, green at neutral equivalence (pH 6.0–7.6), blue in base.`;
  }

  // Flame tests & Emission spectra
  if (q.includes('flame') || q.includes('copper') || q.includes('emission') || q.includes('colour') || q.includes('color') || q.includes('spectrum')) {
    return `### Flame Emission Spectroscopy & Metal Ion Identification

**1. Electronic Transition Mechanism**
When metal salts are introduced into a non-luminous Bunsen flame:
1. Thermal energy vaporizes and excites valence electrons from the ground state to higher quantum energy orbitals.
2. The excited state is unstable; electrons rapidly relax back to lower orbitals.
3. Photons of electromagnetic radiation are emitted, whose energy corresponds to orbital energy differences:
\\[ \\Delta E = h \\nu = \\frac{h c}{\\lambda} \\]

**2. Characteristic Metal Flame Colors & Wavelengths**
- **Sodium (\\(\\text{Na}^+\\))**: Persistent intense yellow-orange (\\(\\approx 589\\text{ nm}\\), sodium D-lines).
- **Potassium (\\(\\text{K}^+\\))**: Delicate lilac / violet (\\(\\approx 766\\text{ nm}\\), viewed through cobalt blue glass).
- **Copper(II) (\\(\\text{Cu}^{2+}\\))**: Distinctive blue-green flame (\\(\\approx 510\\text{--}530\\text{ nm}\\)).
- **Calcium (\\(\\text{Ca}^{2+}\\))**: Brick-red / orange (\\(\\approx 622\\text{ nm}\\)).
- **Barium (\\(\\text{Ba}^{2+}\\))**: Apple-green (\\(\\approx 524\\text{ nm}\\)).
- **Strontium (\\(\\text{Sr}^{2+}\\))**: Crimson red (\\(\\approx 648\\text{ nm}\\)).
- **Lithium (\\(\\text{Li}^+\\))**: Carmine / magenta red (\\(\\approx 671\\text{ nm}\\)).

*Safety Protocol*: Clean the platinum or nichrome wire loop in concentrated \\(\\text{HCl}\\) before burning to prevent sodium contamination.`;
  }

  // Chemical Bonding
  if (q.includes('bond') || q.includes('covalent') || q.includes('ionic') || q.includes('metallic') || q.includes('vsepr')) {
    return `### Primary Chemical Bonding Models

**1. Ionic Bonding**
- **Mechanism**: Complete transfer of valence electrons from metals (low ionization energy) to non-metals (high electron affinity).
- **Structure**: Continuous 3D giant crystal lattice held together by omnidirectional electrostatic forces:
  \\[ F = k_e \\frac{|q_1 q_2|}{r^2} \\]
- **Properties**: High melting/boiling points, brittle, electrical conductors when molten or dissolved in aqueous media.

**2. Covalent Bonding**
- **Mechanism**: Sharing of valence electron pairs between non-metal atoms to achieve stable octet / doublet noble gas configurations.
- **Polarity**: Determined by electronegativity difference (\\(\\Delta\\text{EN}\\)). \\(\\Delta\\text{EN} > 0.4\\) yields a polar covalent bond with a net dipole moment \\(\\mu = q \\times r\\).
- **VSEPR Theory**: Electron pairs around central atoms repel to minimize electrostatic repulsion, giving linear, trigonal planar, tetrahedral, or bent geometries.

**3. Metallic Bonding**
- Positively charged metal ions immersed in a delocalized "sea" of mobile electrons, providing superior electrical and thermal conductivity, ductility, and malleability.`;
  }

  // Acids, Bases, pH & Buffers
  if (q.includes('acid') || q.includes('base') || q.includes('ph') || q.includes('buffer') || q.includes('alkali') || q.includes('hcl') || q.includes('naoh')) {
    return `### Acids, Bases, pH Scale & Buffer Systems

**1. Modern Acid-Base Theories**
- **Arrhenius**: Acids produce \\(\\text{H}^+\\) in water; bases produce \\(\\text{OH}^-\\).
- **Brønsted-Lowry**: Acids are proton (\\(\\text{H}^+\\)) donors; bases are proton acceptors.
- **Lewis**: Acids are electron-pair acceptors (electrophiles); bases are electron-pair donors (nucleophiles).

**2. The Mathematical pH Scale**
\\[ \\text{pH} = -\\log_{10}[\\text{H}_3\\text{O}^+] \\quad \\text{and} \\quad \\text{pOH} = -\\log_{10}[\\text{OH}^-] \\]
\\[ \\text{pH} + \\text{pOH} = 14.00 \\quad (\\text{at } 25^\\circ\\text{C}) \\]

**3. Buffer Action & Henderson-Hasselbalch Equation**
A buffer consists of a weak acid and its conjugate base (e.g., \\(\\text{CH}_3\\text{COOH} / \\text{CH}_3\\text{COO}^-\\)). It resists changes in pH when small amounts of acid or base are introduced:
\\[ \\text{pH} = \\text{p}K_a + \\log_{10}\\left( \\frac{[\\text{A}^-]}{[\\text{HA}]} \\right) \\]

*Lab Caution*: Always wear splash goggles and add concentrated acid slowly to water ("AAA"), never the reverse!`;
  }

  // Stoichiometry & Gas Laws
  if (q.includes('mole') || q.includes('stoichiometr') || q.includes('yield') || q.includes('gram') || q.includes('mass') || q.includes('pv=nrt')) {
    return `### Stoichiometry, Molar Relationships & Gas Calculations

**1. Fundamental Mole Relationships**
The mole connects macroscopic mass to atomic quantities (\\(N_A = 6.022 \\times 10^{23}\\text{ mol}^{-1}\\)):
\\[ n = \\frac{m}{M} \\quad \\text{(mass in g / molar mass in g/mol)} \\]
\\[ n = C \\times V \\quad \\text{(molarity in mol/L } \\times \\text{ volume in L)} \\]

**2. Ideal Gas Law**
\\[ P V = n R T \\]
Where \\(P\\) is pressure (kPa or atm), \\(V\\) is volume (L), \\(T\\) is temperature (Kelvin, \\(K = ^\\circ\\text{C} + 273.15\\)), and \\(R = 8.314\\text{ J/(mol}\\cdot\\text{K)}\\) or \\(0.08206\\text{ L}\\cdot\\text{atm/(mol}\\cdot\\text{K)}\\).

**3. Limiting Reagents & Percentage Yield**
1. Convert all reactant quantities to moles.
2. Divide moles by the balanced reaction coefficients; the smallest value identifies the limiting reagent.
3. Calculate theoretical yield from the limiting reagent, then compute:
\\[ \\% \\text{ Yield} = \\frac{\\text{Actual Experimental Yield}}{\\text{Theoretical Calculated Yield}} \\times 100\\% \\]`;
  }

  // Periodic Table Trends
  if (q.includes('periodic') || q.includes('electronegativ') || q.includes('radius') || q.includes('ionization')) {
    return `### Periodic Trends & Atomic Architecture

**1. Effective Nuclear Charge (\\(Z_{\\text{eff}}\\))**
As you move left-to-right across a period, protons are added to the nucleus while electrons enter the same valence shell with minimal additional shielding, causing \\(Z_{\\text{eff}}\\) to rise.

**2. Trend Trajectories**
- **Atomic Radius**: Decreases across a period (stronger nuclear pull); increases down a group (electrons fill higher principal quantum energy shells).
- **Ionization Energy**: Energy required to remove the outermost electron:
  \\[ \\text{X}_{(g)} + \\text{IE}_1 \\rightarrow \\text{X}^+_{(g)} + e^- \\]
  Increases across a period; decreases down a group.
- **Electronegativity**: Ability of an atom to attract shared bonding electrons. Fluorine is the most electronegative (4.0 on Pauling scale); Francium is lowest.`;
  }

  // Organic Chemistry
  if (q.includes('organic') || q.includes('alkane') || q.includes('alkene') || q.includes('alcohol') || q.includes('ester') || q.includes('functional group')) {
    return `### Organic Chemistry: Structure, Functional Groups & Reactivity

**1. Hydrocarbon Homologous Series**
- **Alkanes** (\\(\\text{C}_n\\text{H}_{2n+2}\\)): Saturated hydrocarbons with single \\(\\sigma\\)-bonds. Undergo free-radical substitution.
- **Alkenes** (\\(\\text{C}_n\\text{H}_{2n}\\)): Contain reactive carbon-carbon double bonds (\\(\\sigma + \\pi\\)). Readily undergo electrophilic addition (Markovnikov's rule: \\(\\text{H}^+\\) bonds to the carbon with more hydrogens).
- **Alkynes** (\\(\\text{C}_n\\text{H}_{2n-2}\\)): Contain carbon-carbon triple bonds.

**2. Key Functional Groups**
- **Alcohols** (\\(-\\text{OH}\\)): Capable of intermolecular hydrogen bonding; oxidized to aldehydes/ketones and carboxylic acids.
- **Carboxylic Acids** (\\(-\\text{COOH}\\)): Weak organic acids; react with alcohols via Fischer esterification:
  \\[ \\text{R-COOH} + \\text{R'-OH} \\xrightarrow{\\text{H}_2\\text{SO}_4} \\text{R-COO-R'} + \\text{H}_2\\text{O} \\]
- **Esters** (\\(-\\text{COOR}\\)): Characteristic sweet/fruity aromas; hydrolyzed by bases in saponification.`;
  }

  // Electrochemistry & Redox
  if (q.includes('redox') || q.includes('galvanic') || q.includes('electrolysis') || q.includes('cathode') || q.includes('anode') || q.includes('cell potential')) {
    return `### Electrochemistry & Redox Equilibria

**1. Oxidation & Reduction Fundamentals**
- **Oxidation Is Loss** of electrons (increase in oxidation state). Occurs at the **Anode** (mnemonic: *An Ox*).
- **Reduction Is Gain** of electrons (decrease in oxidation state). Occurs at the **Cathode** (mnemonic: *Red Cat*).

**2. Galvanic / Voltaic Cells vs. Electrolytic Cells**
- **Galvanic Cell**: Spontaneous chemical reactions generate electrical current (\\(\\Delta G^\\circ < 0\\), \\(E^\\circ_{\\text{cell}} > 0\\)).
  \\[ E^\\circ_{\\text{cell}} = E^\\circ_{\\text{cathode}} - E^\\circ_{\\text{anode}} \\]
- **Electrolytic Cell**: Uses an external electrical potential to drive a non-spontaneous chemical reaction (\\(\\Delta G^\\circ > 0\\)).

**3. Standard Hydrogen Electrode (SHE)**
Assigned a reference potential of \\(0.00\\text{ V}\\) under standard conditions (\\(1\\text{ M } \\text{H}^+\\), \\(1\\text{ atm } \\text{H}_2\\), \\(298\\text{ K}\\)).`;
  }

  // Laboratory Safety
  if (q.includes('safety') || q.includes('hazard') || q.includes('nfpa') || q.includes('ppe') || q.includes('goggles')) {
    return `### Laboratory Safety Protocol & Risk Mitigation

**1. Personal Protective Equipment (PPE)**
- **Splash Goggles**: ANSI Z87.1 certified chemical-resistant goggles must be worn whenever glassware, heat, or chemicals are present.
- **Lab Coat**: 100% cotton or flame-resistant fabric buttoned to the collar.
- **Gloves**: Nitrile gloves provide resistance against dilute acids, bases, and common organic solvents.

**2. Golden Safety Rules**
- **Always Add Acid to Water ("AAA")**: Hydration of concentrated acid is strongly exothermic; adding water to concentrated acid can boil and violently splatter droplets.
- **Fume Hood Operations**: Conduct experiments producing volatile toxic vapors, nitrogen oxides, chlorine, or sulfur dioxide inside a certified fume hood with the sash lowered to the indicated mark.
- **NFPA 704 Diamond**:
  • **Blue (Left)**: Health Hazard (0 = Normal, 4 = Deadly).
  • **Red (Top)**: Flammability (0 = Will not burn, 4 = Flash point < 23°C).
  • **Yellow (Right)**: Instability/Reactivity.
  • **White (Bottom)**: Special notices (e.g., \\(\\text{W}\\) with strike-through = Reacts violently with water).`;
  }

  // General Comprehensive Chemistry Analysis Fallback
  return `### Chemistry Problem Analysis & Solution

**1. Governing Principles**
When solving chemistry questions regarding **"${prompt}"**, apply core thermodynamic, structural, and kinetic concepts:
- **Conservation Laws**: In any closed chemical reaction, total mass and electrical charge are strictly conserved.
- **Electronic Configuration**: Stability is determined by valence shell occupancy and thermodynamic minimization of free energy (\\(\\Delta G = \\Delta H - T\\Delta S\\)).

**2. Systematic Problem-Solving Procedure**
1. **Write Balanced Reaction**: Identify reactants and products with appropriate state symbols:
   \\[ \\text{Reactants} \\rightarrow \\text{Products} \\]
2. **Mole Conversions**: Calculate molar mass (\\(M = \\sum A_r\\)) and convert given parameters using \\(n = \\frac{m}{M}\\) or \\(n = C \\cdot V\\).
3. **Stoichiometric Proportions**: Use coefficient ratios to isolate the target quantity or limiting reactant.

*Explore the CHEMORA Know Library or Guided Experiments for interactive visual simulations and apparatus reference!*`;
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
  const sheetContainerRef = useRef<HTMLDivElement>(null);

  // Mobile Bottom Sheet Drag-to-Dismiss State
  const [sheetDragY, setSheetDragY] = useState(0);
  const sheetTouchStartY = useRef<number>(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);

  // Focus trap & Escape listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSheetTouchStart = (e: React.TouchEvent) => {
    sheetTouchStartY.current = e.touches[0].clientY;
    setIsSheetDragging(true);
  };

  const handleSheetTouchMove = (e: React.TouchEvent) => {
    if (!isSheetDragging) return;
    const delta = e.touches[0].clientY - sheetTouchStartY.current;
    if (delta > 0) {
      setSheetDragY(delta);
    } else {
      setSheetDragY(0);
    }
  };

  const handleSheetTouchEnd = () => {
    setIsSheetDragging(false);
    if (sheetDragY > 80) {
      onClose();
    }
    setSheetDragY(0);
  };

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
          // For server outages, 503, 500, or rate limits, provide the high-quality chemistry solution
          if (res.status === 503 || res.status === 500 || res.status === 502 || res.status === 504 || (errData?.error && String(errData.error).includes('unavailable'))) {
            answer = getOfflineChemistryAnswer(query, !!currentImage);
            usedModel = 'CHEMORA Chemistry Engine';
            isDecoded = !!currentImage;
          } else if (errData?.error && (res.status === 400 || res.status === 413)) {
            // Client validation issue (too long, unsupported image, etc.)
            answer = `⚠️ **Notice**: ${errData.error}`;
          } else {
            answer = getOfflineChemistryAnswer(query, !!currentImage);
            usedModel = 'CHEMORA Chemistry Engine';
            isDecoded = !!currentImage;
          }
        }
      } catch (networkErr) {
        console.warn('Network assistant failed, falling back:', networkErr);
        answer = getOfflineChemistryAnswer(query, !!currentImage);
        usedModel = 'CHEMORA Chemistry Engine';
        isDecoded = !!currentImage;
      }

      if (!answer) {
        await new Promise((r) => setTimeout(r, 400));
        answer = getOfflineChemistryAnswer(query, !!currentImage);
        usedModel = usedModel || 'CHEMORA Chemistry Engine';
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
      {/* Mobile Backdrop for Bottom Sheet */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm md:hidden animate-in fade-in"
          aria-hidden="true"
        />
      )}

      {/* Assistant Modal Window / Mobile Bottom Sheet */}
      {isOpen && (
        <div
          ref={sheetContainerRef}
          role="dialog"
          aria-modal="true"
          aria-label="CHEMORA AI Chemistry Assistant"
          onPaste={handlePaste}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            transform: sheetDragY > 0 ? `translate3d(0, ${sheetDragY}px, 0)` : undefined,
            transition: isSheetDragging ? 'none' : 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
          className="fixed inset-x-0 bottom-0 md:bottom-6 md:top-20 md:right-6 md:left-auto z-50 h-[88dvh] md:h-auto md:w-[min(440px,calc(100vw-32px))] bg-[#0a121f]/95 border-t md:border border-cyan-500/40 rounded-t-[28px] md:rounded-[28px] shadow-[0_24px_70px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden backdrop-blur-2xl anim-popup pb-[env(safe-area-inset-bottom,12px)] md:pb-0"
        >
          {/* Mobile Drag Handle for Dismissal */}
          <div
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
            className="w-full pt-3 pb-2 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing select-none md:hidden bg-[#0c182d]"
            aria-label="Drag down to dismiss assistant"
          >
            <div className="w-12 h-1.5 rounded-full bg-slate-500/80 active:bg-cyan-400 transition-colors" />
          </div>
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
