// Authoritative Chemistry Simulation Engine for CHEMORA

export type PhysicalState = 'liquid' | 'solid' | 'gas';

export interface ChemicalReagent {
  id: string;
  name: string;
  formula: string;
  color: string; // Hex or rgba
  opacity: number;
  state: PhysicalState;
  density: number; // g/mL
  molarMass: number; // g/mol
  ph: number;
  absorbancePeakNm: number; // Wavelength peak in nanometers
  description: string;
  hazard: 'corrosive' | 'irritant' | 'flammable' | 'none';
  tier: number; // 1 to 4
}

export interface ContainerContent {
  volumeMl: number; // current volume in mL
  massG: number; // mass in grams
  temperatureC: number; // temperature in Celsius
  reagents: { [reagentId: string]: number }; // reagentId -> amount in mL or grams
  productName?: string;
  productFormula?: string;
  color: string;
  opacity: number;
  isBubbling: boolean;
  isPrecipitate: boolean;
  precipitateColor?: string;
  isGlowing: boolean;
  glowColor?: string;
  ph: number;
  absorbancePeakNm: number;
  purity: number; // 0 to 100%
  completedReactionId?: string;
}

export interface ReactionDefinition {
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
    purityTarget: number;
  };
  discoveryNotes: string;
  spectralFeatures: { peakWavelength: number; bandwidth: number; expectedAbsorbance: number };
}

export const REAGENTS_CATALOG: Record<string, ChemicalReagent> = {
  h2o: {
    id: 'h2o',
    name: 'Distilled Water',
    formula: 'H₂O',
    color: '#38bdf8',
    opacity: 0.35,
    state: 'liquid',
    density: 1.0,
    molarMass: 18.015,
    ph: 7.0,
    absorbancePeakNm: 300,
    description: 'Ultrapure deionized solvent for aqueous reactions.',
    hazard: 'none',
    tier: 1,
  },
  naoh: {
    id: 'naoh',
    name: 'Sodium Hydroxide 1M',
    formula: 'NaOH (aq)',
    color: '#e0f2fe',
    opacity: 0.45,
    state: 'liquid',
    density: 1.04,
    molarMass: 39.997,
    ph: 13.5,
    absorbancePeakNm: 310,
    description: 'Strong alkaline base. Use with protective eyewear.',
    hazard: 'corrosive',
    tier: 1,
  },
  hcl: {
    id: 'hcl',
    name: 'Hydrochloric Acid 1M',
    formula: 'HCl (aq)',
    color: '#fef08a',
    opacity: 0.4,
    state: 'liquid',
    density: 1.02,
    molarMass: 36.46,
    ph: 1.0,
    absorbancePeakNm: 315,
    description: 'Strong mineral acid, highly reactive with carbonates and bases.',
    hazard: 'corrosive',
    tier: 1,
  },
  phenolphthalein: {
    id: 'phenolphthalein',
    name: 'Phenolphthalein 1%',
    formula: 'C₂₀H₁₄O₄',
    color: '#f8fafc',
    opacity: 0.3,
    state: 'liquid',
    density: 0.98,
    molarMass: 318.32,
    ph: 7.2,
    absorbancePeakNm: 552,
    description: 'Acid-base indicator that shifts to vibrant fuchsia in basic solutions (pH > 8.2).',
    hazard: 'irritant',
    tier: 1,
  },
  cuso4: {
    id: 'cuso4',
    name: 'Copper(II) Sulfate 0.5M',
    formula: 'CuSO₄ (aq)',
    color: '#0284c7', // Sky cyan-blue
    opacity: 0.75,
    state: 'liquid',
    density: 1.08,
    molarMass: 159.609,
    ph: 4.5,
    absorbancePeakNm: 620,
    description: 'Vibrant azure transition metal solution with strong coordination properties.',
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
    molarMass: 84.007,
    ph: 8.3,
    absorbancePeakNm: 330,
    description: 'Fine crystalline solid base. Readily releases CO₂ in contact with acids.',
    hazard: 'none',
    tier: 2,
  },
  fe_no3_3: {
    id: 'fe_no3_3',
    name: 'Iron(III) Nitrate 0.1M',
    formula: 'Fe(NO₃)₃ (aq)',
    color: '#ca8a04', // Amber yellowish
    opacity: 0.7,
    state: 'liquid',
    density: 1.05,
    molarMass: 241.86,
    ph: 2.2,
    absorbancePeakNm: 410,
    description: 'Pale yellow trivalent iron solution, highly sensitive to thiocyanate ligands.',
    hazard: 'irritant',
    tier: 3,
  },
  kscn: {
    id: 'kscn',
    name: 'Potassium Thiocyanate 0.1M',
    formula: 'KSCN (aq)',
    color: '#e2e8f0',
    opacity: 0.3,
    state: 'liquid',
    density: 1.03,
    molarMass: 97.18,
    ph: 6.8,
    absorbancePeakNm: 320,
    description: 'Clear inorganic salt solution forming intensely colored charge-transfer complexes.',
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
    description: 'Chemiluminescent reagent that emits cold blue light upon catalytic oxidation.',
    hazard: 'irritant',
    tier: 4,
  },
  h2o2: {
    id: 'h2o2',
    name: 'Hydrogen Peroxide 3%',
    formula: 'H₂O₂ (aq)',
    color: '#f0f9ff',
    opacity: 0.35,
    state: 'liquid',
    density: 1.01,
    molarMass: 34.014,
    ph: 6.0,
    absorbancePeakNm: 280,
    description: 'Active oxidizing agent capable of powering chemiluminescent electron transfer.',
    hazard: 'irritant',
    tier: 4,
  },
  nacl: { id: 'nacl', name: 'Sodium Chloride', formula: 'NaCl', color: '#f8fafc', opacity: 0.85, state: 'solid', density: 2.16, molarMass: 58.44, ph: 7, absorbancePeakNm: 300, description: 'Common ionic salt for dissolution and conductivity demonstrations.', hazard: 'none', tier: 1 },
  sugar: { id: 'sugar', name: 'Sucrose', formula: 'C₁₂H₂₂O₁₁', color: '#fff7ed', opacity: 0.9, state: 'solid', density: 1.59, molarMass: 342.30, ph: 7, absorbancePeakNm: 320, description: 'Water-soluble molecular solid used to explore concentration.', hazard: 'none', tier: 1 },
  vinegar: { id: 'vinegar', name: 'Acetic Acid Solution (5%)', formula: 'CH₃COOH (aq)', color: '#fef3c7', opacity: 0.25, state: 'liquid', density: 1.01, molarMass: 60.05, ph: 2.8, absorbancePeakNm: 310, description: 'Dilute weak acid for safe virtual acid-base demonstrations.', hazard: 'irritant', tier: 1 },
  citric_acid: { id: 'citric_acid', name: 'Citric Acid Solution', formula: 'C₆H₈O₇ (aq)', color: '#fef9c3', opacity: 0.3, state: 'liquid', density: 1.03, molarMass: 192.12, ph: 2.5, absorbancePeakNm: 315, description: 'Weak organic acid found in citrus fruits.', hazard: 'irritant', tier: 1 },
  glucose: { id: 'glucose', name: 'Glucose Solution', formula: 'C₆H₁₂O₆ (aq)', color: '#f8fafc', opacity: 0.25, state: 'liquid', density: 1.02, molarMass: 180.16, ph: 6.8, absorbancePeakNm: 300, description: 'Simple sugar solution for concentration and diffusion experiments.', hazard: 'none', tier: 1 },
  starch: { id: 'starch', name: 'Starch Suspension', formula: '(C₆H₁₀O₅)ₙ', color: '#e2e8f0', opacity: 0.55, state: 'liquid', density: 1.02, molarMass: 0, ph: 6.5, absorbancePeakNm: 450, description: 'Suspension for virtual indicator and colloid observations.', hazard: 'none', tier: 1 },
  kcl: { id: 'kcl', name: 'Potassium Chloride', formula: 'KCl', color: '#f1f5f9', opacity: 0.9, state: 'solid', density: 1.98, molarMass: 74.55, ph: 7, absorbancePeakNm: 300, description: 'Ionic salt used for dissolution and conductivity comparisons.', hazard: 'none', tier: 1 },
  caco3: { id: 'caco3', name: 'Calcium Carbonate', formula: 'CaCO₃', color: '#f8fafc', opacity: 0.95, state: 'solid', density: 2.71, molarMass: 100.09, ph: 9, absorbancePeakNm: 320, description: 'Carbonate solid; virtual acid-contact demos may release gas.', hazard: 'irritant', tier: 1 },
  mgso4: { id: 'mgso4', name: 'Magnesium Sulfate', formula: 'MgSO₄', color: '#f8fafc', opacity: 0.8, state: 'solid', density: 2.66, molarMass: 120.37, ph: 6.5, absorbancePeakNm: 300, description: 'Soluble salt for dissolution and ion demonstrations.', hazard: 'none', tier: 1 },
  kio3: { id: 'kio3', name: 'Potassium Iodate Solution', formula: 'KIO₃ (aq)', color: '#f8fafc', opacity: 0.25, state: 'liquid', density: 1.02, molarMass: 214, ph: 7, absorbancePeakNm: 330, description: 'Oxidizing salt solution for supervised virtual reaction studies.', hazard: 'irritant', tier: 2 },
  ki: { id: 'ki', name: 'Potassium Iodide Solution', formula: 'KI (aq)', color: '#f8fafc', opacity: 0.25, state: 'liquid', density: 1.02, molarMass: 166, ph: 7, absorbancePeakNm: 330, description: 'Iodide source for ionic reaction and precipitation simulations.', hazard: 'none', tier: 2 },
  agno3: { id: 'agno3', name: 'Silver Nitrate Solution', formula: 'AgNO₃ (aq)', color: '#f8fafc', opacity: 0.25, state: 'liquid', density: 1.04, molarMass: 169.87, ph: 6, absorbancePeakNm: 320, description: 'Light-sensitive analytical reagent for virtual precipitation tests.', hazard: 'irritant', tier: 2 },
  bacl2: { id: 'bacl2', name: 'Barium Chloride Solution', formula: 'BaCl₂ (aq)', color: '#f8fafc', opacity: 0.25, state: 'liquid', density: 1.03, molarMass: 208.23, ph: 7, absorbancePeakNm: 320, description: 'Reference reagent for sulfate precipitation simulations; toxic if ingested.', hazard: 'irritant', tier: 2 },
  na2so4: { id: 'na2so4', name: 'Sodium Sulfate Solution', formula: 'Na₂SO₄ (aq)', color: '#f8fafc', opacity: 0.25, state: 'liquid', density: 1.03, molarMass: 142.04, ph: 7, absorbancePeakNm: 320, description: 'Soluble sulfate salt for ionic reaction simulations.', hazard: 'none', tier: 2 },
  nh4cl: { id: 'nh4cl', name: 'Ammonium Chloride', formula: 'NH₄Cl', color: '#f8fafc', opacity: 0.9, state: 'solid', density: 1.53, molarMass: 53.49, ph: 5.5, absorbancePeakNm: 320, description: 'Salt used to demonstrate dissolution and temperature changes conceptually.', hazard: 'irritant', tier: 2 },
  feso4: { id: 'feso4', name: 'Iron(II) Sulfate Solution', formula: 'FeSO₄ (aq)', color: '#bbf7d0', opacity: 0.6, state: 'liquid', density: 1.05, molarMass: 151.91, ph: 4, absorbancePeakNm: 430, description: 'Pale green transition-metal salt solution.', hazard: 'irritant', tier: 2 },
  nacl_solution: { id: 'nacl_solution', name: 'Sodium Chloride Solution', formula: 'NaCl (aq)', color: '#e0f2fe', opacity: 0.2, state: 'liquid', density: 1.01, molarMass: 58.44, ph: 7, absorbancePeakNm: 300, description: 'Clear salt solution for dilution and conductivity concepts.', hazard: 'none', tier: 1 },
  bromothymol_blue: { id: 'bromothymol_blue', name: 'Bromothymol Blue Indicator', formula: 'C₂₇H₂₈Br₂O₅S', color: '#fde68a', opacity: 0.35, state: 'liquid', density: 0.99, molarMass: 624.38, ph: 7, absorbancePeakNm: 615, description: 'pH indicator with yellow-to-blue transition range near neutral pH.', hazard: 'irritant', tier: 1 },
  universal_indicator: { id: 'universal_indicator', name: 'Universal Indicator', formula: 'indicator blend', color: '#4ade80', opacity: 0.4, state: 'liquid', density: 1, molarMass: 0, ph: 7, absorbancePeakNm: 520, description: 'Mixed indicator for visual pH range demonstrations.', hazard: 'irritant', tier: 1 },
  acetone: { id: 'acetone', name: 'Acetone (virtual sample)', formula: 'C₃H₆O', color: '#e0f2fe', opacity: 0.18, state: 'liquid', density: 0.79, molarMass: 58.08, ph: 7, absorbancePeakNm: 300, description: 'Volatile, highly flammable solvent shown for hazard-label education only.', hazard: 'flammable', tier: 2 },
  ethanol: { id: 'ethanol', name: 'Ethanol (virtual sample)', formula: 'C₂H₅OH', color: '#f8fafc', opacity: 0.18, state: 'liquid', density: 0.79, molarMass: 46.07, ph: 7, absorbancePeakNm: 300, description: 'Flammable solvent reference for hazard-label education.', hazard: 'flammable', tier: 2 },
  nh4oh: { id: 'nh4oh', name: 'Ammonia Water (dilute)', formula: 'NH₃ (aq)', color: '#e0f2fe', opacity: 0.2, state: 'liquid', density: 0.99, molarMass: 17.03, ph: 11, absorbancePeakNm: 300, description: 'Dilute alkaline solution for acid-base concepts; avoid inhalation in real labs.', hazard: 'irritant', tier: 2 },
  znso4: { id: 'znso4', name: 'Zinc Sulfate Solution', formula: 'ZnSO₄ (aq)', color: '#f8fafc', opacity: 0.25, state: 'liquid', density: 1.04, molarMass: 161.44, ph: 5.5, absorbancePeakNm: 320, description: 'Colorless metal-salt solution for precipitation and ion tests.', hazard: 'irritant', tier: 2 },
  al2so43: { id: 'al2so43', name: 'Aluminium Sulfate Solution', formula: 'Al₂(SO₄)₃ (aq)', color: '#f8fafc', opacity: 0.25, state: 'liquid', density: 1.04, molarMass: 342.15, ph: 4, absorbancePeakNm: 320, description: 'Colorless salt solution for hydrolysis and precipitation concepts.', hazard: 'irritant', tier: 2 },
  k2co3: { id: 'k2co3', name: 'Potassium Carbonate', formula: 'K₂CO₃', color: '#f8fafc', opacity: 0.9, state: 'solid', density: 2.43, molarMass: 138.21, ph: 11.5, absorbancePeakNm: 320, description: 'Alkaline carbonate salt for acid-base concept demonstrations.', hazard: 'irritant', tier: 2 },
  borax: { id: 'borax', name: 'Borax Solution', formula: 'Na₂B₄O₇ (aq)', color: '#f8fafc', opacity: 0.25, state: 'liquid', density: 1.02, molarMass: 201.22, ph: 9.2, absorbancePeakNm: 320, description: 'Mildly alkaline borate solution for polymer and pH concepts.', hazard: 'irritant', tier: 2 },
  co2_water: { id: 'co2_water', name: 'Carbonated Water', formula: 'CO₂ (aq)', color: '#e0f2fe', opacity: 0.22, state: 'liquid', density: 1, molarMass: 44.01, ph: 4, absorbancePeakNm: 320, description: 'Dissolved carbon dioxide forming a weakly acidic solution.', hazard: 'none', tier: 1 },
  red_cabbage: { id: 'red_cabbage', name: 'Red Cabbage Indicator', formula: 'anthocyanins', color: '#a78bfa', opacity: 0.45, state: 'liquid', density: 1, molarMass: 0, ph: 7, absorbancePeakNm: 540, description: 'Natural pH indicator that shifts color across acidic and basic solutions.', hazard: 'none', tier: 1 },
  iodine: { id: 'iodine', name: 'Iodine Indicator Solution', formula: 'I₂ (aq)', color: '#a16207', opacity: 0.6, state: 'liquid', density: 1.03, molarMass: 253.81, ph: 5, absorbancePeakNm: 460, description: 'Amber indicator solution for starch-test concepts.', hazard: 'irritant', tier: 2 },
  calcium_chloride: { id: 'calcium_chloride', name: 'Calcium Chloride', formula: 'CaCl₂', color: '#f8fafc', opacity: 0.9, state: 'solid', density: 2.15, molarMass: 110.98, ph: 7, absorbancePeakNm: 320, description: 'Hygroscopic salt used to discuss dissolution and heat transfer.', hazard: 'irritant', tier: 1 }
};

export const PROTOCOLS_LIST: ReactionDefinition[] = [
  {
    id: 'protocol_1_neutralization',
    title: 'Tier 1: Indicator Shift & Neutralization',
    tier: 1,
    description: 'Demonstrate acid-base equilibrium. Add 20mL NaOH with 2mL Phenolphthalein to produce intense fuchsia, then titrate with 20mL HCl to neutralize.',
    requiredReagents: {
      naoh: { min: 15, max: 25, unit: 'mL' },
      phenolphthalein: { min: 1, max: 5, unit: 'mL' },
      hcl: { min: 15, max: 25, unit: 'mL' },
    },
    targetProduct: {
      name: 'Neutral Saline Solution (NaCl + H₂O)',
      formula: 'NaCl (aq) + H₂O',
      color: '#f8fafc', // clear neutral
      opacity: 0.3,
      isBubbling: false,
      isPrecipitate: false,
      isGlowing: false,
      ph: 7.0,
      absorbancePeakNm: 300,
      purityTarget: 95,
    },
    discoveryNotes: 'Stoichiometric neutralization achieved. Phenolphthalein transitioned through basic fuchsia (pH > 8.2) to neutral colorless clarity at pH 7.0.',
    spectralFeatures: { peakWavelength: 300, bandwidth: 40, expectedAbsorbance: 0.08 },
  },
  {
    id: 'protocol_2_copper_precipitation',
    title: 'Tier 2: Transition Metal Hydroxide Precipitation',
    tier: 2,
    description: 'Synthesize copper(II) hydroxide. Measure 25mL Copper(II) Sulfate and react with 25mL Sodium Hydroxide at room temperature.',
    requiredReagents: {
      cuso4: { min: 20, max: 30, unit: 'mL' },
      naoh: { min: 20, max: 30, unit: 'mL' },
    },
    targetProduct: {
      name: 'Copper(II) Hydroxide Gel Precipitate',
      formula: 'Cu(OH)₂ (s) + Na₂SO₄ (aq)',
      color: '#0284c7',
      opacity: 0.88,
      isBubbling: false,
      isPrecipitate: true,
      precipitateColor: '#0369a1',
      isGlowing: false,
      ph: 9.2,
      absorbancePeakNm: 620,
      purityTarget: 92,
    },
    discoveryNotes: 'Cu²⁺ ions rapidly precipitated as gelatinous royal-blue Cu(OH)₂. Demonstrates solubility product Ksp limitation in alkaline media.',
    spectralFeatures: { peakWavelength: 620, bandwidth: 50, expectedAbsorbance: 0.84 },
  },
  {
    id: 'protocol_3_effervescence',
    title: 'Tier 2B: Carbonate Gas Effervescence',
    tier: 2,
    description: 'Measure 5.0g Sodium Bicarbonate and react with 25mL Hydrochloric Acid to generate vigorous carbon dioxide effervescence.',
    requiredReagents: {
      nahco3: { min: 3, max: 8, unit: 'g' },
      hcl: { min: 20, max: 30, unit: 'mL' },
    },
    targetProduct: {
      name: 'Carbonated Brine & CO₂ Evolution',
      formula: 'CO₂ (g) + NaCl (aq) + H₂O',
      color: '#e0f2fe',
      opacity: 0.45,
      isBubbling: true,
      isPrecipitate: false,
      isGlowing: false,
      ph: 6.5,
      absorbancePeakNm: 320,
      purityTarget: 96,
    },
    discoveryNotes: 'Vigorous bubbling evolved CO₂ gas bubbles, neutralizing hydrochloric acid to aqueous sodium chloride.',
    spectralFeatures: { peakWavelength: 320, bandwidth: 45, expectedAbsorbance: 0.15 },
  },
  {
    id: 'protocol_4_thiocyanate_complex',
    title: 'Tier 3: Blood-Red Iron Thiocyanate Complex',
    tier: 3,
    description: 'Coordinate iron(III) with thiocyanate ligand. Mix 20mL Iron(III) Nitrate with 20mL Potassium Thiocyanate to form [Fe(SCN)]²⁺.',
    requiredReagents: {
      fe_no3_3: { min: 15, max: 25, unit: 'mL' },
      kscn: { min: 15, max: 25, unit: 'mL' },
    },
    targetProduct: {
      name: 'Pentaaquathiocyanatoiron(III) Complex',
      formula: '[Fe(H₂O)₅(SCN)]²⁺ (aq)',
      color: '#991b1b', // Intense deep crimson / blood red
      opacity: 0.9,
      isBubbling: false,
      isPrecipitate: false,
      isGlowing: false,
      ph: 2.8,
      absorbancePeakNm: 450,
      purityTarget: 98,
    },
    discoveryNotes: 'Spectacular charge-transfer absorption at 450nm. Complex ion formation yields high-affinity blood-red coloration.',
    spectralFeatures: { peakWavelength: 450, bandwidth: 35, expectedAbsorbance: 0.96 },
  },
  {
    id: 'protocol_5_chemiluminescence',
    title: 'Tier 4: Cold Light Chemiluminescence',
    tier: 4,
    description: 'Synthesize cold light! In a beaker, combine 25mL Luminol solution, 15mL Hydrogen Peroxide, and 5mL Iron(III) Nitrate catalyst on the stirrer.',
    requiredReagents: {
      luminol: { min: 20, max: 30, unit: 'mL' },
      h2o2: { min: 10, max: 20, unit: 'mL' },
      fe_no3_3: { min: 3, max: 8, unit: 'mL' },
    },
    requiredTemp: { min: 20, max: 45 },
    targetProduct: {
      name: 'Excited 3-Aminophthalate (Chemiluminescent Light)',
      formula: '3-APA* + N₂ + hν (425nm)',
      color: '#06b6d4',
      opacity: 0.8,
      isBubbling: true,
      isPrecipitate: false,
      isGlowing: true,
      glowColor: '#38bdf8',
      ph: 10.5,
      absorbancePeakNm: 425,
      purityTarget: 99,
    },
    discoveryNotes: 'Catalytic oxidation by hydrogen peroxide produced excited 3-aminophthalate dianion, relaxing to ground state by emitting 425nm cold cyan photons.',
    spectralFeatures: { peakWavelength: 425, bandwidth: 25, expectedAbsorbance: 0.99 },
  },
];

export function createEmptyContainer(_type: 'beaker' | 'flask' | 'cylinder' | 'vial'): ContainerContent {
  return {
    volumeMl: 0,
    massG: 0,
    temperatureC: 22,
    reagents: {},
    color: '#94a3b8',
    opacity: 0.2,
    isBubbling: false,
    isPrecipitate: false,
    isGlowing: false,
    ph: 7.0,
    absorbancePeakNm: 300,
    purity: 100,
  };
}

export function addReagentToContainer(
  current: ContainerContent,
  reagentId: string,
  amount: number // mL or grams
): ContainerContent {
  const reagent = REAGENTS_CATALOG[reagentId];
  // Keep this domain helper safe even when called outside the UI/store.
  if (!reagent || !Number.isFinite(amount) || amount < 0) return current;

  const updatedReagents = { ...current.reagents };
  updatedReagents[reagentId] = (updatedReagents[reagentId] || 0) + amount;

  const addedVolume = reagent.state === 'solid' ? amount / reagent.density : amount;
  const addedMass = reagent.state === 'solid' ? amount : amount * reagent.density;
  const newVolume = Math.round((current.volumeMl + addedVolume) * 10) / 10;
  const newMass = Math.round((current.massG + addedMass) * 10) / 10;

  // Recalculate physical characteristics
  const result = recalculateMixture(updatedReagents, newVolume, newMass, current.temperatureC);
  return result;
}

export function recalculateMixture(
  reagents: { [reagentId: string]: number },
  volumeMl: number,
  massG: number,
  temperatureC: number
): ContainerContent {
  const reagentKeys = Object.keys(reagents).filter((k) => reagents[k] > 0);
  if (reagentKeys.length === 0) {
    return {
      volumeMl: 0,
      massG: 0,
      temperatureC,
      reagents: {},
      color: '#94a3b8',
      opacity: 0.2,
      isBubbling: false,
      isPrecipitate: false,
      isGlowing: false,
      ph: 7.0,
      absorbancePeakNm: 300,
      purity: 100,
    };
  }

  // Check against reaction definitions
  for (const protocol of PROTOCOLS_LIST) {
    let matches = true;
    let totalReq = 0;
    let totalAct = 0;

    for (const [reqId, range] of Object.entries(protocol.requiredReagents)) {
      const actAmount = reagents[reqId] || 0;
      if (actAmount < range.min * 0.75) {
        matches = false;
        break;
      }
      totalReq += (range.min + range.max) / 2;
      totalAct += actAmount;
    }

    // Also check unexpected contaminants
    for (const actId of reagentKeys) {
      if (!protocol.requiredReagents[actId]) {
        // Minor tolerance for solvent H2O
        if (actId === 'h2o' && reagents[actId] <= 10) continue;
        matches = false;
        break;
      }
    }

    if (matches) {
      // Calculate purity based on ratio proximity
      const deviation = Math.abs(totalAct - totalReq) / totalReq;
      const calculatedPurity = Math.max(50, Math.min(100, Math.round((1 - deviation * 0.6) * 100)));

      return {
        volumeMl,
        massG,
        temperatureC,
        reagents,
        productName: protocol.targetProduct.name,
        productFormula: protocol.targetProduct.formula,
        color: protocol.targetProduct.color,
        opacity: protocol.targetProduct.opacity,
        isBubbling: protocol.targetProduct.isBubbling,
        isPrecipitate: protocol.targetProduct.isPrecipitate,
        precipitateColor: protocol.targetProduct.precipitateColor,
        isGlowing: protocol.targetProduct.isGlowing,
        glowColor: protocol.targetProduct.glowColor,
        ph: protocol.targetProduct.ph,
        absorbancePeakNm: protocol.targetProduct.absorbancePeakNm,
        purity: calculatedPurity,
        completedReactionId: protocol.id,
      };
    }
  }

  // Additional educational reaction visuals for the expanded chemical inventory.
  const hasAcid = Boolean(reagents.hcl || reagents.vinegar || reagents.citric_acid);
  if (hasAcid && (reagents.nahco3 || reagents.caco3 || reagents.k2co3)) {
    const carbonate = reagents.nahco3 ? 'Sodium bicarbonate' : reagents.caco3 ? 'Calcium carbonate' : 'Potassium carbonate';
    return { volumeMl, massG, temperatureC, reagents, productName: `${carbonate} + acid: gas evolution`, productFormula: 'CO₂ ↑ + H₂O + salt', color: '#dbeafe', opacity: 0.42, isBubbling: true, isPrecipitate: false, isGlowing: false, ph: 6.2, absorbancePeakNm: 390, purity: 86, completedReactionId: 'visual_carbonate_acid' };
  }
  if ((reagents.agno3 && (reagents.nacl || reagents.nacl_solution || reagents.hcl)) || (reagents.bacl2 && reagents.na2so4)) {
    const silver = Boolean(reagents.agno3);
    return { volumeMl, massG, temperatureC, reagents, productName: silver ? 'Silver chloride precipitate' : 'Barium sulfate precipitate', productFormula: silver ? 'AgCl (s) ↓' : 'BaSO₄ (s) ↓', color: '#f8fafc', opacity: 0.72, isBubbling: false, isPrecipitate: true, precipitateColor: '#f8fafc', isGlowing: false, ph: 7, absorbancePeakNm: 430, purity: 90, completedReactionId: silver ? 'visual_agcl_precipitate' : 'visual_baso4_precipitate' };
  }
  if (reagents.iodine && reagents.starch) {
    return { volumeMl, massG, temperatureC, reagents, productName: 'Starch–iodine blue complex', productFormula: 'starch · I₃⁻ complex', color: '#1d4ed8', opacity: 0.88, isBubbling: false, isPrecipitate: false, isGlowing: false, ph: 6.5, absorbancePeakNm: 610, purity: 92, completedReactionId: 'visual_starch_iodine' };
  }

  // Intermediate state 1: NaOH + Phenolphthalein without sufficient HCl yet (Intense pink indicator)
  if (reagents.naoh && reagents.phenolphthalein && (!reagents.hcl || reagents.hcl < 10)) {
    return {
      volumeMl,
      massG,
      temperatureC,
      reagents,
      productName: 'Alkaline Phenolphthalein Solution',
      productFormula: 'C₂₀H₁₂O₄²⁻ (aq)',
      color: '#f43f5e', // vivid rose fuchsia!
      opacity: 0.8,
      isBubbling: false,
      isPrecipitate: false,
      isGlowing: false,
      ph: 12.0,
      absorbancePeakNm: 552,
      purity: 88,
    };
  }

  // Default mixture: weighted blend of component colors
  let dominantReagent = REAGENTS_CATALOG[reagentKeys[0]];
  let maxAmount = 0;
  let weightedPh = 0;
  let totalReagentAmount = 0;

  for (const rId of reagentKeys) {
    const r = REAGENTS_CATALOG[rId];
    if (r) {
      const amt = reagents[rId];
      if (amt > maxAmount) {
        maxAmount = amt;
        dominantReagent = r;
      }
      weightedPh += r.ph * amt;
      totalReagentAmount += amt;
    }
  }

  const avgPh = totalReagentAmount > 0 ? Math.round((weightedPh / totalReagentAmount) * 10) / 10 : 7.0;

  return {
    volumeMl,
    massG,
    temperatureC,
    reagents,
    color: dominantReagent ? dominantReagent.color : '#38bdf8',
    opacity: dominantReagent ? dominantReagent.opacity : 0.4,
    isBubbling: false,
    isPrecipitate: false,
    isGlowing: false,
    ph: avgPh,
    absorbancePeakNm: dominantReagent ? dominantReagent.absorbancePeakNm : 300,
    purity: 70,
  };
}

// Generate realistic spectrophotometer absorption spectra data for 250nm - 750nm

export type TransferFailure = 'invalid-volume' | 'empty-source' | 'insufficient-source' | 'destination-overflow';
export type TransferResult = { ok: true; source: ContainerContent; target: ContainerContent } | { ok: false; reason: TransferFailure };

/** Pure, validated liquid transfer helper shared by the store and unit tests. */
export function transferBetweenContainers(source: ContainerContent, target: ContainerContent, amountMl: number, targetCapacityMl: number): TransferResult {
  if (!Number.isFinite(amountMl) || amountMl <= 0) return { ok: false, reason: 'invalid-volume' };
  if (source.volumeMl <= 0) return { ok: false, reason: 'empty-source' };
  if (amountMl > source.volumeMl + 1e-6) return { ok: false, reason: 'insufficient-source' };
  if (target.volumeMl + amountMl > targetCapacityMl + 1e-6) return { ok: false, reason: 'destination-overflow' };
  const fraction = amountMl / source.volumeMl;
  const sourceReagents: Record<string, number> = { ...source.reagents };
  const targetReagents: Record<string, number> = { ...target.reagents };
  for (const [reagentId, amount] of Object.entries(source.reagents)) {
    const transferred = amount * fraction;
    sourceReagents[reagentId] = Math.max(0, amount - transferred);
    targetReagents[reagentId] = (targetReagents[reagentId] ?? 0) + transferred;
  }
  const nextSource = recalculateMixture(sourceReagents, Math.max(0, source.volumeMl - amountMl), source.massG * (1 - fraction), source.temperatureC);
  const nextTarget = recalculateMixture(targetReagents, target.volumeMl + amountMl, target.massG + source.massG * fraction, target.temperatureC);
  return { ok: true, source: nextSource, target: nextTarget };
}

export function generateSpectrumData(peakNm: number, bandwidth: number, maxAbsorbance: number) {
  const points: { wavelength: number; absorbance: number }[] = [];
  for (let wl = 280; wl <= 720; wl += 10) {
    // Gaussian absorption peak
    const dist = (wl - peakNm) / bandwidth;
    const gaussian = Math.exp(-0.5 * dist * dist);
    const baselineNoise = 0.02 + 0.01 * Math.sin(wl * 0.05);
    const absorbance = Math.max(0, Math.min(1.5, Math.round((gaussian * maxAbsorbance + baselineNoise) * 1000) / 1000));
    points.push({ wavelength: wl, absorbance });
  }
  return points;
}

/** Procedure helpers return educational simulation results without changing reaction matching rules. */
export function simulateTitration(content: ContainerContent, addedBaseMl = 1): ContainerContent {
  const next = { ...content, reagents: { ...content.reagents } };
  const acidAmount = (next.reagents.hcl ?? 0) + (next.reagents.vinegar ?? 0) + (next.reagents.citric_acid ?? 0);
  const baseAmount = (next.reagents.naoh ?? 0) + Math.max(0, addedBaseMl);
  next.reagents.naoh = baseAmount;
  next.volumeMl += Math.max(0, addedBaseMl);
  next.massG += Math.max(0, addedBaseMl) * 1.04;
  const ratio = acidAmount > 0 ? baseAmount / acidAmount : 1;
  next.ph = acidAmount === 0 ? 13 : Math.max(1, Math.min(13.5, 7 + (ratio - 1) * 5.5));
  next.color = next.ph >= 8.2 ? '#f472b6' : '#fef08a';
  next.opacity = 0.45;
  next.purity = Math.min(100, next.purity + 2);
  return next;
}
export function simulateFiltration(content: ContainerContent): ContainerContent {
  return { ...content, isPrecipitate: false, purity: Math.min(100, content.purity + 8), productName: content.productName ? `Filtered ${content.productName}` : 'Filtered sample' };
}
export function simulateHeating(content: ContainerContent, deltaC = 10): ContainerContent {
  return { ...content, temperatureC: Math.min(100, content.temperatureC + Math.max(0, deltaC)), isBubbling: content.temperatureC + deltaC >= 80 };
}
export function simulateStirring(content: ContainerContent): ContainerContent {
  return { ...content, isBubbling: false, purity: Math.min(100, content.purity + 1) };
}
export function measurePH(content: ContainerContent): number { return Math.round(Math.max(0, Math.min(14, content.ph)) * 100) / 100; }
