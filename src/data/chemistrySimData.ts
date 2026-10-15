// Comprehensive Chemistry Simulation Model for CHEMORA Virtual 3D Lab

export type PhysicalState = 'liquid' | 'solid' | 'gas';

export interface ChemicalReagent {
  id: string;
  name: string;
  formula: string;
  color: string; // Hex color
  opacity: number;
  state: PhysicalState;
  density: number; // g/mL
  molarMass: number; // g/mol
  ph: number;
  absorbancePeakNm: number;
  description: string;
  hazard: 'corrosive' | 'irritant' | 'flammable' | 'none';
  tier: number;
}

export interface ReactionProtocol {
  id: string;
  title: string;
  tier: number;
  description: string;
  requiredReagents: { [reagentId: string]: { min: number; max: number; unit: 'mL' | 'g' } };
  requiredTemp?: { min: number; max: number };
  targetProduct: {
    name: string;
    formula: string;
    color: string;
    opacity: number;
    isBubbling: boolean;
    isPrecipitate: boolean;
    precipitateColor?: string;
    isGlowing: boolean;
    glowColor?: string;
    ph: number;
    absorbancePeakNm: number;
  };
  discoveryNotes: string;
  xpReward: number;
}

export const REAGENTS_CATALOG: Record<string, ChemicalReagent> = {
  water: {
    id: 'water',
    name: 'Distilled Water',
    formula: 'H₂O',
    color: '#38bdf8',
    opacity: 0.25,
    state: 'liquid',
    density: 1.0,
    molarMass: 18.015,
    ph: 7.0,
    absorbancePeakNm: 300,
    description: 'Ultrapure deionized solvent for aqueous chemistry.',
    hazard: 'none',
    tier: 1,
  },
  hcl: {
    id: 'hcl',
    name: 'Hydrochloric Acid (1M)',
    formula: 'HCl (aq)',
    color: '#fef08a',
    opacity: 0.35,
    state: 'liquid',
    density: 1.02,
    molarMass: 36.46,
    ph: 1.0,
    absorbancePeakNm: 315,
    description: 'Strong monoprotic mineral acid; neutralizes bases and dissolves metal oxides.',
    hazard: 'corrosive',
    tier: 1,
  },
  naoh: {
    id: 'naoh',
    name: 'Sodium Hydroxide (1M)',
    formula: 'NaOH (aq)',
    color: '#e0f2fe',
    opacity: 0.4,
    state: 'liquid',
    density: 1.04,
    molarMass: 39.997,
    ph: 13.8,
    absorbancePeakNm: 310,
    description: 'Caustic alkaline solution; precipitating agent for transition metals.',
    hazard: 'corrosive',
    tier: 1,
  },
  phenolphthalein: {
    id: 'phenolphthalein',
    name: 'Phenolphthalein 1%',
    formula: 'C₂₀H₁₄O₄',
    color: '#fdf2f8',
    opacity: 0.2,
    state: 'liquid',
    density: 0.98,
    molarMass: 318.32,
    ph: 7.0,
    absorbancePeakNm: 552,
    description: 'Sensitive acid-base indicator; turns vibrant fuchsia at pH > 8.2.',
    hazard: 'none',
    tier: 1,
  },
  cuso4: {
    id: 'cuso4',
    name: 'Copper(II) Sulfate (0.5M)',
    formula: 'CuSO₄ (aq)',
    color: '#0284c7',
    opacity: 0.75,
    state: 'liquid',
    density: 1.08,
    molarMass: 159.61,
    ph: 4.5,
    absorbancePeakNm: 620,
    description: 'Vibrant azure solution forming hydroxide and ammonia coordination complexes.',
    hazard: 'irritant',
    tier: 2,
  },
  ki: {
    id: 'ki',
    name: 'Potassium Iodide (0.5M)',
    formula: 'KI (aq)',
    color: '#f8fafc',
    opacity: 0.2,
    state: 'liquid',
    density: 1.03,
    molarMass: 166.0,
    ph: 7.0,
    absorbancePeakNm: 330,
    description: 'Clear halide salt solution; reacts with lead to yield golden crystals.',
    hazard: 'none',
    tier: 2,
  },
  pbno3: {
    id: 'pbno3',
    name: 'Lead(II) Nitrate (0.5M)',
    formula: 'Pb(NO₃)₂ (aq)',
    color: '#f8fafc',
    opacity: 0.2,
    state: 'liquid',
    density: 1.05,
    molarMass: 331.2,
    ph: 4.8,
    absorbancePeakNm: 320,
    description: 'Heavy metal nitrate used in analytical qualitative precipitation.',
    hazard: 'irritant',
    tier: 2,
  },
  nahco3: {
    id: 'nahco3',
    name: 'Sodium Bicarbonate',
    formula: 'NaHCO₃ (s)',
    color: '#f8fafc',
    opacity: 0.95,
    state: 'solid',
    density: 2.2,
    molarMass: 84.01,
    ph: 8.4,
    absorbancePeakNm: 310,
    description: 'White crystalline solid releasing vigorous CO₂ effervescence upon acid contact.',
    hazard: 'none',
    tier: 1,
  },
  fe_no3: {
    id: 'fe_no3',
    name: 'Iron(III) Nitrate (0.1M)',
    formula: 'Fe(NO₃)₃ (aq)',
    color: '#ca8a04',
    opacity: 0.65,
    state: 'liquid',
    density: 1.05,
    molarMass: 241.86,
    ph: 2.2,
    absorbancePeakNm: 410,
    description: 'Amber trivalent iron solution; coordinates with thiocyanate ligands.',
    hazard: 'irritant',
    tier: 3,
  },
  kscn: {
    id: 'kscn',
    name: 'Potassium Thiocyanate (0.1M)',
    formula: 'KSCN (aq)',
    color: '#e2e8f0',
    opacity: 0.25,
    state: 'liquid',
    density: 1.03,
    molarMass: 97.18,
    ph: 6.8,
    absorbancePeakNm: 320,
    description: 'Clear ligand solution yielding intense blood-red charge transfer with iron.',
    hazard: 'irritant',
    tier: 3,
  },
  luminol: {
    id: 'luminol',
    name: 'Luminol Solution',
    formula: 'C₈H₇N₃O₂ (aq)',
    color: '#e0e7ff',
    opacity: 0.5,
    state: 'liquid',
    density: 1.02,
    molarMass: 177.16,
    ph: 11.0,
    absorbancePeakNm: 425,
    description: 'Chemiluminescent probe emitting cold blue light when catalytically oxidized.',
    hazard: 'irritant',
    tier: 4,
  },
  h2o2: {
    id: 'h2o2',
    name: 'Hydrogen Peroxide (3%)',
    formula: 'H₂O₂ (aq)',
    color: '#f0f9ff',
    opacity: 0.3,
    state: 'liquid',
    density: 1.01,
    molarMass: 34.01,
    ph: 6.0,
    absorbancePeakNm: 280,
    description: 'Oxidizing agent; decomposes to water and oxygen gas when heated or catalyzed.',
    hazard: 'irritant',
    tier: 2,
  },
  agno3: {
    id: 'agno3',
    name: 'Silver Nitrate (0.1M)',
    formula: 'AgNO₃ (aq)',
    color: '#f8fafc',
    opacity: 0.2,
    state: 'liquid',
    density: 1.04,
    molarMass: 169.87,
    ph: 6.0,
    absorbancePeakNm: 310,
    description: 'Analytical silver salt; precipitates halides instantaneously.',
    hazard: 'irritant',
    tier: 2,
  },
  starch: {
    id: 'starch',
    name: 'Starch Indicator (1%)',
    formula: '(C₆H₁₀O₅)ₙ',
    color: '#e2e8f0',
    opacity: 0.5,
    state: 'liquid',
    density: 1.01,
    molarMass: 0,
    ph: 6.8,
    absorbancePeakNm: 450,
    description: 'Amylose colloid forming intense deep blue-black charge inclusion with triiodide.',
    hazard: 'none',
    tier: 2,
  },
  iodine: {
    id: 'iodine',
    name: 'Lugol’s Iodine (I₂/KI)',
    formula: 'I₃⁻ (aq)',
    color: '#92400e',
    opacity: 0.75,
    state: 'liquid',
    density: 1.05,
    molarMass: 253.8,
    ph: 5.5,
    absorbancePeakNm: 460,
    description: 'Amber iodine-potassium iodide solution used in redox and starch testing.',
    hazard: 'irritant',
    tier: 2,
  },
};

export const PROTOCOLS: ReactionProtocol[] = [
  {
    id: 'golden_rain',
    title: 'Golden Rain Crystallization',
    tier: 2,
    description: 'Combine Lead(II) Nitrate and Potassium Iodide to precipitate radiant crystalline Lead(II) Iodide.',
    requiredReagents: {
      pbno3: { min: 10, max: 40, unit: 'mL' },
      ki: { min: 10, max: 40, unit: 'mL' },
    },
    targetProduct: {
      name: 'Lead(II) Iodide Crystals (Golden Rain)',
      formula: 'Pb(NO₃)₂ + 2KI → PbI₂(s)↓ + 2KNO₃',
      color: '#facc15',
      opacity: 0.9,
      isBubbling: false,
      isPrecipitate: true,
      precipitateColor: '#eab308',
      isGlowing: false,
      ph: 5.2,
      absorbancePeakNm: 410,
    },
    discoveryNotes: 'Pb²⁺ combines with I⁻ to exceed the solubility product Ksp (1.4×10⁻⁸), precipitating glittering golden-yellow hexagonal plates.',
    xpReward: 200,
  },
  {
    id: 'acid_base_neutralization',
    title: 'Acid-Base Neutralization & Indicator Shift',
    tier: 1,
    description: 'Add Sodium Hydroxide with Phenolphthalein to produce intense magenta, then neutralize with Hydrochloric Acid.',
    requiredReagents: {
      naoh: { min: 10, max: 30, unit: 'mL' },
      phenolphthalein: { min: 2, max: 10, unit: 'mL' },
      hcl: { min: 10, max: 30, unit: 'mL' },
    },
    targetProduct: {
      name: 'Neutralized Brine Solution',
      formula: 'HCl + NaOH → NaCl + H₂O',
      color: '#f0f9ff',
      opacity: 0.25,
      isBubbling: false,
      isPrecipitate: false,
      isGlowing: false,
      ph: 7.0,
      absorbancePeakNm: 300,
    },
    discoveryNotes: 'Equimolar hydronium and hydroxide ions neutralized to pure water; indicator shifted from basic fuchsia back to colorless clarity.',
    xpReward: 150,
  },
  {
    id: 'fuchsia_alkaline_indicator',
    title: 'Alkaline Indicator Activation',
    tier: 1,
    description: 'Dispense Sodium Hydroxide and Phenolphthalein without acid to observe intense deprotonation.',
    requiredReagents: {
      naoh: { min: 10, max: 40, unit: 'mL' },
      phenolphthalein: { min: 2, max: 10, unit: 'mL' },
    },
    targetProduct: {
      name: 'Deprotonated Phenolphthalein Dianion',
      formula: 'In²⁻ (Alkaline Chromophore)',
      color: '#ec4899', // Brilliant hot fuchsia pink
      opacity: 0.85,
      isBubbling: false,
      isPrecipitate: false,
      isGlowing: false,
      ph: 13.2,
      absorbancePeakNm: 552,
    },
    discoveryNotes: 'In basic media (pH > 8.2), lactone ring opens and phenolic protons dissociate, establishing a conjugated chromophore absorbing green light at 552nm.',
    xpReward: 100,
  },
  {
    id: 'copper_hydroxide_precipitate',
    title: 'Transition Metal Hydroxide Gel',
    tier: 2,
    description: 'React Copper(II) Sulfate with Sodium Hydroxide to yield gelatinous royal blue copper hydroxide.',
    requiredReagents: {
      cuso4: { min: 10, max: 40, unit: 'mL' },
      naoh: { min: 10, max: 40, unit: 'mL' },
    },
    targetProduct: {
      name: 'Copper(II) Hydroxide Gel',
      formula: 'CuSO₄ + 2NaOH → Cu(OH)₂(s)↓ + Na₂SO₄',
      color: '#0284c7',
      opacity: 0.95,
      isBubbling: false,
      isPrecipitate: true,
      precipitateColor: '#0369a1',
      isGlowing: false,
      ph: 9.8,
      absorbancePeakNm: 620,
    },
    discoveryNotes: 'Hydroxide ions coordinate with Cu²⁺ to precipitate light blue gelatinous Cu(OH)₂, demonstrating insolubility of d-block hydroxides.',
    xpReward: 180,
  },
  {
    id: 'co2_effervescence',
    title: 'Carbonate Gas Effervescence',
    tier: 1,
    description: 'Combine Sodium Bicarbonate solid with Hydrochloric Acid to release carbon dioxide effervescence.',
    requiredReagents: {
      nahco3: { min: 2, max: 15, unit: 'g' },
      hcl: { min: 10, max: 40, unit: 'mL' },
    },
    targetProduct: {
      name: 'Carbonated Brine & CO₂ Gas Evolution',
      formula: 'NaHCO₃ + HCl → NaCl + H₂O + CO₂(g)↑',
      color: '#e0f2fe',
      opacity: 0.4,
      isBubbling: true,
      isPrecipitate: false,
      isGlowing: false,
      ph: 6.4,
      absorbancePeakNm: 320,
    },
    discoveryNotes: 'Unstable carbonic acid H₂CO₃ rapidly decomposes into water and vigorous CO₂ gas bubbles that fizz up the vessel.',
    xpReward: 150,
  },
  {
    id: 'iron_thiocyanate_complex',
    title: 'Blood-Red Iron Thiocyanate Complex',
    tier: 3,
    description: 'Coordinate Iron(III) Nitrate with Potassium Thiocyanate to form the blood-red complex [Fe(SCN)]²⁺.',
    requiredReagents: {
      fe_no3: { min: 10, max: 30, unit: 'mL' },
      kscn: { min: 10, max: 30, unit: 'mL' },
    },
    targetProduct: {
      name: 'Pentaaquathiocyanatoiron(III) Complex',
      formula: 'Fe³⁺ + SCN⁻ ⇌ [Fe(H₂O)₅(SCN)]²⁺',
      color: '#991b1b', // Blood red / deep crimson
      opacity: 0.95,
      isBubbling: false,
      isPrecipitate: false,
      isGlowing: false,
      ph: 2.5,
      absorbancePeakNm: 450,
    },
    discoveryNotes: 'Intense charge-transfer transition where an electron shifts from the thiocyanate ligand to the iron center upon absorbing 450nm light.',
    xpReward: 250,
  },
  {
    id: 'cold_chemiluminescence',
    title: 'Cold Light Chemiluminescence',
    tier: 4,
    description: 'Combine Luminol solution, Hydrogen Peroxide, and Iron(III) catalyst to generate brilliant cold cyan photons.',
    requiredReagents: {
      luminol: { min: 15, max: 35, unit: 'mL' },
      h2o2: { min: 10, max: 25, unit: 'mL' },
      fe_no3: { min: 2, max: 10, unit: 'mL' },
    },
    targetProduct: {
      name: 'Excited 3-Aminophthalate Photons',
      formula: 'Luminol + H₂O₂ + [Fe³⁺] → 3-APA* + N₂ + hν (425nm)',
      color: '#06b6d4',
      opacity: 0.85,
      isBubbling: true,
      isPrecipitate: false,
      isGlowing: true,
      glowColor: '#38bdf8',
      ph: 10.8,
      absorbancePeakNm: 425,
    },
    discoveryNotes: 'Chemical energy directly converted to electronic excitation without heat; relaxation back to ground state emits intense 425nm cyan luminescence!',
    xpReward: 400,
  },
  {
    id: 'iodine_starch_complex',
    title: 'Amylose-Triiodide Inclusion Complex',
    tier: 2,
    description: 'Add Lugol’s Iodine into Starch colloid to witness the iconic blue-black color shift.',
    requiredReagents: {
      starch: { min: 10, max: 40, unit: 'mL' },
      iodine: { min: 2, max: 15, unit: 'mL' },
    },
    targetProduct: {
      name: 'Amylose-Polyiodide Inclusion Complex',
      formula: '(C₆H₁₀O₅)ₙ · I₅⁻ (Blue-Black Complex)',
      color: '#1e1b4b', // Deep midnight indigo / blue-black
      opacity: 0.95,
      isBubbling: false,
      isPrecipitate: false,
      isGlowing: false,
      ph: 6.2,
      absorbancePeakNm: 620,
    },
    discoveryNotes: 'Triiodide and pentaiodide linear ions slip inside the hydrophobic helical coils of amylose starch, inducing intense charge-transfer absorption.',
    xpReward: 180,
  },
  {
    id: 'silver_chloride_curd',
    title: 'Curdy Silver Halide Precipitation',
    tier: 2,
    description: 'React Silver Nitrate with Hydrochloric Acid to form insoluble curdy white Silver Chloride.',
    requiredReagents: {
      agno3: { min: 10, max: 30, unit: 'mL' },
      hcl: { min: 10, max: 30, unit: 'mL' },
    },
    targetProduct: {
      name: 'Silver Chloride Precipitate',
      formula: 'AgNO₃ + HCl → AgCl(s)↓ + HNO₃',
      color: '#f8fafc',
      opacity: 0.95,
      isBubbling: false,
      isPrecipitate: true,
      precipitateColor: '#ffffff',
      isGlowing: false,
      ph: 1.5,
      absorbancePeakNm: 310,
    },
    discoveryNotes: 'Ag⁺ reacts with Cl⁻ to instantly form curdy white AgCl (Ksp = 1.8×10⁻¹⁰), sensitive to photochemical decomposition.',
    xpReward: 200,
  },
  {
    id: 'thermal_decomposition',
    title: 'Thermal Decomposition of Peroxide',
    tier: 2,
    description: 'Heat Hydrogen Peroxide to > 60°C on the Bunsen burner to decompose it into water and oxygen vapor.',
    requiredReagents: {
      h2o2: { min: 15, max: 50, unit: 'mL' },
    },
    requiredTemp: { min: 60, max: 120 },
    targetProduct: {
      name: 'Decomposed Steam & Oxygen Gas',
      formula: '2H₂O₂ —(Δ)→ 2H₂O + O₂(g)↑',
      color: '#f0f9ff',
      opacity: 0.3,
      isBubbling: true,
      isPrecipitate: false,
      isGlowing: false,
      ph: 6.8,
      absorbancePeakNm: 290,
    },
    discoveryNotes: 'Thermal energy overcomes activation barrier to decompose peroxide into pure steam and oxygen gas effervescence.',
    xpReward: 160,
  },
];

export interface FlameElement {
  id: string;
  name: string;
  ion: string;
  color: string;
  glowColor: string;
  flameName: string;
  wavelength: string;
  electronTransition: string;
}

export const FLAME_ELEMENTS: FlameElement[] = [
  {
    id: 'sodium',
    name: 'Sodium',
    ion: 'Na⁺',
    color: '#fbbf24',
    glowColor: '#f59e0b',
    flameName: 'Intense Yellow-Orange D-Line',
    wavelength: '589.0 nm',
    electronTransition: '3p → 3s electronic relaxation',
  },
  {
    id: 'copper',
    name: 'Copper',
    ion: 'Cu²⁺',
    color: '#06b6d4',
    glowColor: '#0891b2',
    flameName: 'Brilliant Blue-Green Emerald',
    wavelength: '510.5 nm',
    electronTransition: 'Cu(I) & CuOH radical emission',
  },
  {
    id: 'potassium',
    name: 'Potassium',
    ion: 'K⁺',
    color: '#c084fc',
    glowColor: '#a855f7',
    flameName: 'Pale Lilac-Violet',
    wavelength: '766.5 nm',
    electronTransition: '4p → 4s doublet transition',
  },
  {
    id: 'calcium',
    name: 'Calcium',
    ion: 'Ca²⁺',
    color: '#f97316',
    glowColor: '#ea580c',
    flameName: 'Brick Red-Orange',
    wavelength: '622.0 nm',
    electronTransition: 'CaOH band system resonance',
  },
  {
    id: 'barium',
    name: 'Barium',
    ion: 'Ba²⁺',
    color: '#84cc16',
    glowColor: '#65a30d',
    flameName: 'Apple Spring Green',
    wavelength: '524.2 nm',
    electronTransition: 'BaCl & BaOH green emission',
  },
  {
    id: 'lithium',
    name: 'Lithium',
    ion: 'Li⁺',
    color: '#f43f5e',
    glowColor: '#e11d48',
    flameName: 'Vibrant Carmine Red',
    wavelength: '670.8 nm',
    electronTransition: '2p → 2s orbital relaxation',
  },
];
