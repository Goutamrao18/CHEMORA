// Nuclear & Atomic Reactions Data Model for CHEMORA Virtual 3D Lab
// Comprehensive scientific models of Nuclear Fission, Fusion, Radioactive Decay, and Atomic Structure

export type NuclearReactionType = 'fission' | 'fusion' | 'alpha_decay' | 'beta_decay' | 'gamma_decay' | 'positron_decay';

export interface Isotope {
  symbol: string;
  elementName: string;
  z: number; // Atomic number (protons)
  n: number; // Neutrons
  a: number; // Mass number (A = Z + N)
  exactMassU: number; // Atomic mass in unified atomic mass units (u)
  halfLife: string;
  halfLifeSeconds: number; // for decay kinetics
  stability: 'stable' | 'radioactive';
  decayModes?: string[];
  color: string;
}

export interface NuclearReaction {
  id: string;
  title: string;
  category: 'fission' | 'fusion' | 'decay' | 'transmutation';
  type: NuclearReactionType;
  equation: string;
  subTitle: string;
  reactants: Array<{ isotope: string; count: number; z: number; a: number; massU: number }>;
  products: Array<{ isotope: string; count: number; z: number; a: number; massU: number }>;
  energyMev: number; // Net Q-value in MeV
  energyJoules: number; // Net Q-value in Joules
  massDefectU: number; // Δm in unified atomic mass units (u)
  neutronsProduced: number;
  radiationType: 'alpha' | 'beta_minus' | 'beta_plus' | 'gamma' | 'fast_neutron' | 'high_energy_plasma';
  visualColor: string;
  radiationDoseUsv: number; // MicroSieverts per event scale
  operatingCondition: string; // e.g. "Thermal Neutron Flux · 10¹⁴ n/cm²s", "Tokamak Toroidal Field 12.5 T · 150 Million K"
  realWorldApplication: string;
  scientificMechanism: string;
  historicalContext: string;
  xpReward: number;
}

// Canonical isotopic masses (CODATA fundamental physical constants)
// 1 u = 931.494102 MeV/c² = 1.66053906660e-27 kg
export const U_TO_MEV = 931.494102;
export const MEV_TO_JOULE = 1.602176634e-13;

export const NUCLEAR_ISOTOPES: Record<string, Isotope> = {
  n0: {
    symbol: '¹₀n',
    elementName: 'Neutron',
    z: 0,
    n: 1,
    a: 1,
    exactMassU: 1.008665,
    halfLife: '14.7 minutes (free)',
    halfLifeSeconds: 882,
    stability: 'radioactive',
    decayModes: ['β⁻'],
    color: '#94a3b8',
  },
  H1: {
    symbol: '¹₁H',
    elementName: 'Protium',
    z: 1,
    n: 0,
    a: 1,
    exactMassU: 1.007825,
    halfLife: 'Stable',
    halfLifeSeconds: Infinity,
    stability: 'stable',
    color: '#38bdf8',
  },
  H2: {
    symbol: '²₁H (D)',
    elementName: 'Deuterium',
    z: 1,
    n: 1,
    a: 2,
    exactMassU: 2.014102,
    halfLife: 'Stable (0.015% abundance)',
    halfLifeSeconds: Infinity,
    stability: 'stable',
    color: '#06b6d4',
  },
  H3: {
    symbol: '³₁H (T)',
    elementName: 'Tritium',
    z: 1,
    n: 2,
    a: 3,
    exactMassU: 3.016049,
    halfLife: '12.32 years',
    halfLifeSeconds: 3.885e8,
    stability: 'radioactive',
    decayModes: ['β⁻ (18.6 keV)'],
    color: '#00f0ff',
  },
  He3: {
    symbol: '³₂He',
    elementName: 'Helium-3',
    z: 2,
    n: 1,
    a: 3,
    exactMassU: 3.016029,
    halfLife: 'Stable (Lunar Regolith Isotope)',
    halfLifeSeconds: Infinity,
    stability: 'stable',
    color: '#a7f3d0',
  },
  He4: {
    symbol: '⁴₂He (α)',
    elementName: 'Alpha Particle / Helium-4',
    z: 2,
    n: 2,
    a: 4,
    exactMassU: 4.001506,
    halfLife: 'Stable (Extremely High Binding Energy 28.3 MeV)',
    halfLifeSeconds: Infinity,
    stability: 'stable',
    color: '#34d399',
  },
  C12: {
    symbol: '¹²₆C',
    elementName: 'Carbon-12',
    z: 6,
    n: 6,
    a: 12,
    exactMassU: 12.000000,
    halfLife: 'Stable (Atomic mass standard)',
    halfLifeSeconds: Infinity,
    stability: 'stable',
    color: '#cbd5e1',
  },
  C14: {
    symbol: '¹⁴₆C',
    elementName: 'Carbon-14',
    z: 6,
    n: 8,
    a: 14,
    exactMassU: 14.003241,
    halfLife: '5,730 years',
    halfLifeSeconds: 1.808e11,
    stability: 'radioactive',
    decayModes: ['β⁻ (156 keV)'],
    color: '#fbbf24',
  },
  N14: {
    symbol: '¹⁴₇N',
    elementName: 'Nitrogen-14',
    z: 7,
    n: 7,
    a: 14,
    exactMassU: 14.003074,
    halfLife: 'Stable (99.63% abundance)',
    halfLifeSeconds: Infinity,
    stability: 'stable',
    color: '#60a5fa',
  },
  O18: {
    symbol: '¹⁸₈O',
    elementName: 'Oxygen-18',
    z: 8,
    n: 10,
    a: 18,
    exactMassU: 17.999160,
    halfLife: 'Stable',
    halfLifeSeconds: Infinity,
    stability: 'stable',
    color: '#818cf8',
  },
  F18: {
    symbol: '¹⁸₉F',
    elementName: 'Fluorine-18',
    z: 9,
    n: 9,
    a: 18,
    exactMassU: 18.000938,
    halfLife: '109.77 minutes',
    halfLifeSeconds: 6586,
    stability: 'radioactive',
    decayModes: ['β⁺ (634 keV)'],
    color: '#f43f5e',
  },
  Kr92: {
    symbol: '⁹²₃₆Kr',
    elementName: 'Krypton-92',
    z: 36,
    n: 56,
    a: 92,
    exactMassU: 91.926156,
    halfLife: '1.84 seconds',
    halfLifeSeconds: 1.84,
    stability: 'radioactive',
    decayModes: ['β⁻'],
    color: '#38bdf8',
  },
  Ba141: {
    symbol: '¹⁴¹₅₆Ba',
    elementName: 'Barium-141',
    z: 56,
    n: 85,
    a: 141,
    exactMassU: 140.914411,
    halfLife: '18.27 minutes',
    halfLifeSeconds: 1096,
    stability: 'radioactive',
    decayModes: ['β⁻'],
    color: '#a855f7',
  },
  U235: {
    symbol: '²³⁵₉₂U',
    elementName: 'Uranium-235',
    z: 92,
    n: 143,
    a: 235,
    exactMassU: 235.043930,
    halfLife: '703.8 million years',
    halfLifeSeconds: 2.22e16,
    stability: 'radioactive',
    decayModes: ['α (4.68 MeV)', 'Thermal Fission'],
    color: '#00f0ff',
  },
  U238: {
    symbol: '²³⁸₉₂U',
    elementName: 'Uranium-238',
    z: 92,
    n: 146,
    a: 238,
    exactMassU: 238.050788,
    halfLife: '4.468 billion years',
    halfLifeSeconds: 1.41e17,
    stability: 'radioactive',
    decayModes: ['α (4.27 MeV)'],
    color: '#10b981',
  },
  Th234: {
    symbol: '²³⁴₉₀Th',
    elementName: 'Thorium-234',
    z: 90,
    n: 144,
    a: 234,
    exactMassU: 234.043601,
    halfLife: '24.10 days',
    halfLifeSeconds: 2.08e6,
    stability: 'radioactive',
    decayModes: ['β⁻'],
    color: '#f59e0b',
  },
  Pu239: {
    symbol: '²³⁹₉₄Pu',
    elementName: 'Plutonium-239',
    z: 94,
    n: 145,
    a: 239,
    exactMassU: 239.052163,
    halfLife: '24,110 years',
    halfLifeSeconds: 7.61e11,
    stability: 'radioactive',
    decayModes: ['α (5.24 MeV)', 'Fast Fission'],
    color: '#e11d48',
  },
  Xe134: {
    symbol: '¹³⁴₅₄Xe',
    elementName: 'Xenon-134',
    z: 54,
    n: 80,
    a: 134,
    exactMassU: 133.905395,
    halfLife: 'Stable',
    halfLifeSeconds: Infinity,
    stability: 'stable',
    color: '#67e8f9',
  },
  Zr103: {
    symbol: '¹⁰³₄₀Zr',
    elementName: 'Zirconium-103',
    z: 40,
    n: 63,
    a: 103,
    exactMassU: 102.92660,
    halfLife: '1.53 seconds',
    halfLifeSeconds: 1.53,
    stability: 'radioactive',
    decayModes: ['β⁻'],
    color: '#cbd5e1',
  },
  Tc99m: {
    symbol: '⁹⁹ᵐ₄₃Tc',
    elementName: 'Technetium-99m (Metastable)',
    z: 43,
    n: 56,
    a: 99,
    exactMassU: 98.906255,
    halfLife: '6.01 hours',
    halfLifeSeconds: 21636,
    stability: 'radioactive',
    decayModes: ['γ (140.5 keV isomeric transition)'],
    color: '#22c55e',
  },
  Tc99: {
    symbol: '⁹⁹₄₃Tc',
    elementName: 'Technetium-99 (Ground State)',
    z: 43,
    n: 56,
    a: 99,
    exactMassU: 98.906254,
    halfLife: '211,000 years',
    halfLifeSeconds: 6.66e12,
    stability: 'radioactive',
    decayModes: ['β⁻'],
    color: '#15803d',
  },
  Co60: {
    symbol: '⁶⁰₂₇Co',
    elementName: 'Cobalt-60',
    z: 27,
    n: 33,
    a: 60,
    exactMassU: 59.933817,
    halfLife: '5.27 years',
    halfLifeSeconds: 1.663e8,
    stability: 'radioactive',
    decayModes: ['β⁻', '2× γ (1.17 & 1.33 MeV)'],
    color: '#3b82f6',
  },
};

export const NUCLEAR_REACTIONS: NuclearReaction[] = [
  // 1. THERMAL NEUTRON FISSION OF URANIUM-235
  {
    id: 'fission_u235',
    title: 'Uranium-235 Thermal Neutron Induced Fission',
    category: 'fission',
    type: 'fission',
    subTitle: 'Commercial Pressurized Water Reactor (PWR) & Boiling Water Reactor (BWR) Core Reaction',
    equation: '²³⁵₉₂U + ¹₀n_thermal → ¹⁴¹₅₆Ba + ⁹²₃₆Kr + 3 ¹₀n + 202.5 MeV',
    reactants: [
      { isotope: 'U235', count: 1, z: 92, a: 235, massU: 235.043930 },
      { isotope: 'n0', count: 1, z: 0, a: 1, massU: 1.008665 },
    ],
    products: [
      { isotope: 'Ba141', count: 1, z: 56, a: 141, massU: 140.914411 },
      { isotope: 'Kr92', count: 1, z: 36, a: 92, massU: 91.926156 },
      { isotope: 'n0', count: 3, z: 0, a: 1, massU: 1.008665 },
    ],
    energyMev: 202.5,
    energyJoules: 202.5 * MEV_TO_JOULE,
    massDefectU: 0.217368,
    neutronsProduced: 3,
    radiationType: 'fast_neutron',
    visualColor: '#00f0ff', // Cherenkov radiation blue glow
    radiationDoseUsv: 450.0,
    operatingCondition: 'Moderated by H₂O at 15.5 MPa, 310°C · Thermal neutron velocity ~2,200 m/s (0.025 eV)',
    realWorldApplication: 'Provides ~10% of world electricity. Fuel rods enriched to 3-5% ²³⁵U generate gigawatts of thermal power.',
    scientificMechanism: 'A low-energy thermal neutron is captured by ²³⁵U to form compound nucleus ²³⁶U*, which undergoes violent asymmetric liquid-drop deformation and splits into Barium-141 and Krypton-92, releasing 3 prompt high-energy neutrons that sustain a critical chain reaction (k_eff = 1.000).',
    historicalContext: 'Discovered in December 1938 by Otto Hahn and Fritz Strassmann; theoretically explained by Lise Meitner and Otto Frisch.',
    xpReward: 250,
  },

  // 2. PLUTONIUM-239 FAST FISSION
  {
    id: 'fission_pu239',
    title: 'Plutonium-239 Fast Neutron Fission',
    category: 'fission',
    type: 'fission',
    subTitle: 'Fast Breeder Reactor (FBR) & Generation-IV Liquid Sodium Cooled Transmutation',
    equation: '²³⁹₉₄Pu + ¹₀n_fast → ¹³⁴₅₄Xe + ¹⁰³₄₀Zr + 3 ¹₀n + 207.1 MeV',
    reactants: [
      { isotope: 'Pu239', count: 1, z: 94, a: 239, massU: 239.052163 },
      { isotope: 'n0', count: 1, z: 0, a: 1, massU: 1.008665 },
    ],
    products: [
      { isotope: 'Xe134', count: 1, z: 54, a: 134, massU: 133.905395 },
      { isotope: 'Zr103', count: 1, z: 40, a: 103, massU: 102.926600 },
      { isotope: 'n0', count: 3, z: 0, a: 1, massU: 1.008665 },
    ],
    energyMev: 207.1,
    energyJoules: 207.1 * MEV_TO_JOULE,
    massDefectU: 0.222338,
    neutronsProduced: 3,
    radiationType: 'fast_neutron',
    visualColor: '#f43f5e',
    radiationDoseUsv: 620.0,
    operatingCondition: 'Fast unmoderated neutron spectrum (E > 0.1 MeV) · Liquid Sodium (Na) coolant at 550°C',
    realWorldApplication: 'Fast breeder reactors can breed more fissile fuel than they consume by transmuting abundant ²³⁸U into ²³⁹Pu, extending nuclear fuel reserves for millennia.',
    scientificMechanism: 'High-energy fast neutrons overcome the fission barrier of ²³⁹Pu with an extraordinarily high fission cross section, producing 2.9 prompt neutrons per fission on average.',
    historicalContext: 'First synthesized in 1940 by Glenn T. Seaborg, Arthur Wahl, and Joseph Kennedy by deuteron bombardment of Uranium.',
    xpReward: 300,
  },

  // 3. DEUTERIUM-TRITIUM MAGNETIC CONFINEMENT FUSION (ITER / TOKAMAK)
  {
    id: 'fusion_dt',
    title: 'Deuterium-Tritium (D-T) Tokamak Fusion',
    category: 'fusion',
    type: 'fusion',
    subTitle: 'ITER, SPARC & High-Field Toroidal Magnetic Confinement Plasma',
    equation: '²₁H + ³₁H → ⁴₂He (3.5 MeV) + ¹₀n (14.1 MeV) + 17.59 MeV',
    reactants: [
      { isotope: 'H2', count: 1, z: 1, a: 2, massU: 2.014102 },
      { isotope: 'H3', count: 1, z: 1, a: 3, massU: 3.016049 },
    ],
    products: [
      { isotope: 'He4', count: 1, z: 2, a: 4, massU: 4.001506 },
      { isotope: 'n0', count: 1, z: 0, a: 1, massU: 1.008665 },
    ],
    energyMev: 17.59,
    energyJoules: 17.59 * MEV_TO_JOULE,
    massDefectU: 0.018880,
    neutronsProduced: 1,
    radiationType: 'high_energy_plasma',
    visualColor: '#d946ef', // Superheated hydrogen fusion magenta plasma
    radiationDoseUsv: 120.0,
    operatingCondition: 'Core temperature: 150 Million K (15 keV) · Toroidal B-field: 12.0 Tesla · Density: 10²⁰ ions/m³',
    realWorldApplication: 'Primary reaction pursued by international ITER and commercial fusion startups for carbon-free baseline power. 1 gram of D-T fuel produces energy equivalent to 8 tons of petroleum.',
    scientificMechanism: 'At temperatures exceeding 100 Million K, positive deuterium and tritium ions overcome the Coulomb electrostatic repulsion barrier and tunnel through via quantum wave mechanics. The strong nuclear force fuses them into an excited ⁵He* state which instantly decays into an alpha particle and a 14.1 MeV fast neutron.',
    historicalContext: 'Demonstrated in JET (Joint European Torus) in 1997 achieving 16.1 MW fusion power; now scaled up in ITER Cadarache, France.',
    xpReward: 350,
  },

  // 4. DEUTERIUM-HELIUM-3 ANEUTRONIC CLEAN FUSION
  {
    id: 'fusion_d_he3',
    title: 'Deuterium - Helium-3 Aneutronic Clean Fusion',
    category: 'fusion',
    type: 'fusion',
    subTitle: 'Next-Generation Advanced Direct Energy Conversion (Non-Neutron Producing)',
    equation: '²₁H + ³₂He → ⁴₂He (3.6 MeV) + ¹₁p (14.7 MeV) + 18.35 MeV',
    reactants: [
      { isotope: 'H2', count: 1, z: 1, a: 2, massU: 2.014102 },
      { isotope: 'He3', count: 1, z: 2, a: 3, massU: 3.016029 },
    ],
    products: [
      { isotope: 'He4', count: 1, z: 2, a: 4, massU: 4.001506 },
      { isotope: 'H1', count: 1, z: 1, a: 1, massU: 1.007825 },
    ],
    energyMev: 18.35,
    energyJoules: 18.35 * MEV_TO_JOULE,
    massDefectU: 0.019700,
    neutronsProduced: 0,
    radiationType: 'high_energy_plasma',
    visualColor: '#10b981', // Clean aneutronic emerald plasma
    radiationDoseUsv: 5.0,
    operatingCondition: 'Ion temperature ~500 Million K (50 keV) · Magnetic Field Confinement > 14 Tesla',
    realWorldApplication: 'The holy grail of clean fusion. Products are solely charged particles (alpha and proton), allowing direct electrostatic energy conversion at up to 70% efficiency with virtually zero radioactive activation of reactor walls.',
    scientificMechanism: 'Deuteron and Helium-3 nuclei undergo resonant nuclear interaction. The absence of primary neutron emission eliminates long-lived material structural activation, making maintenance safe and straightforward.',
    historicalContext: 'Helium-3 is exceedingly rare on Earth but is trapped in massive quantities on the Moon surface by billions of years of solar wind deposition.',
    xpReward: 400,
  },

  // 5. PROTON-PROTON CHAIN (SOLAR CORE FUSION)
  {
    id: 'fusion_pp',
    title: 'Solar Core Proton-Proton Chain Fusion (p-p)',
    category: 'fusion',
    type: 'fusion',
    subTitle: 'Stellar Nucleosynthesis Powering the Sun & Main-Sequence Stars',
    equation: '4 ¹₁H → ⁴₂He + 2 e⁺ + 2 ν_e + 2 γ + 26.73 MeV',
    reactants: [
      { isotope: 'H1', count: 4, z: 1, a: 1, massU: 1.007825 * 4 },
    ],
    products: [
      { isotope: 'He4', count: 1, z: 2, a: 4, massU: 4.001506 },
    ],
    energyMev: 26.73,
    energyJoules: 26.73 * MEV_TO_JOULE,
    massDefectU: 0.028700,
    neutronsProduced: 0,
    radiationType: 'gamma',
    visualColor: '#fbbf24', // Solar golden brilliance
    radiationDoseUsv: 85.0,
    operatingCondition: 'Solar core density ~150 g/cm³ · Core temperature: 15.7 Million K · Core pressure: 250 billion atmospheres',
    realWorldApplication: 'Powers our solar system. The Sun converts 600 million tons of hydrogen into helium every second, producing 3.846 × 10²⁶ Watts of electromagnetic radiation.',
    scientificMechanism: 'Two protons fuse through weak-force beta-plus decay into a deuteron (the bottleneck reaction with an average lifetime of 9 billion years per proton). Deuterons quickly capture another proton to form ³He, and two ³He nuclei fuse into ⁴He and two regenerated protons.',
    historicalContext: 'Theoretical formulation pioneered by Hans Bethe in 1939 (awarded the 1967 Nobel Prize in Physics).',
    xpReward: 350,
  },

  // 6. URANIUM-238 ALPHA DECAY CASCADE
  {
    id: 'decay_alpha_u238',
    title: 'Uranium-238 Alpha Decay (4n+2 Series)',
    category: 'decay',
    type: 'alpha_decay',
    subTitle: 'Geological Primordial Radioactivity & Earth Geothermal Heat Origin',
    equation: '²³⁸₉₂U → ²³⁴₉₀Th + ⁴₂He²⁺ (α, 4.27 MeV)',
    reactants: [
      { isotope: 'U238', count: 1, z: 92, a: 238, massU: 238.050788 },
    ],
    products: [
      { isotope: 'Th234', count: 1, z: 90, a: 234, massU: 234.043601 },
      { isotope: 'He4', count: 1, z: 2, a: 4, massU: 4.001506 },
    ],
    energyMev: 4.27,
    energyJoules: 4.27 * MEV_TO_JOULE,
    massDefectU: 0.004584,
    neutronsProduced: 0,
    radiationType: 'alpha',
    visualColor: '#ef4444',
    radiationDoseUsv: 25.0,
    operatingCondition: 'Half-life: 4.468 Billion Years · Spontaneous quantum tunneling through Coulomb barrier',
    realWorldApplication: 'Drives Uranium-Lead radiometric dating of planetary meteorites and Earth crust rocks. Along with ²³²Th and ⁴⁰K, maintains mantle convection and Earth magnetic dynamo.',
    scientificMechanism: 'An alpha particle (²He₄ nucleus) pre-forms inside the heavy nucleus and escapes through the Coulomb potential barrier via Gamow quantum mechanical tunneling.',
    historicalContext: 'Alpha radiation was first identified by Ernest Rutherford in 1899.',
    xpReward: 200,
  },

  // 7. CARBON-14 BETA-MINUS DECAY (RADIOCARBON CLOCK)
  {
    id: 'decay_beta_c14',
    title: 'Carbon-14 Beta-Minus (β⁻) Decay',
    category: 'decay',
    type: 'beta_decay',
    subTitle: 'Radiocarbon Archeological Chronometer & Cosmic Ray Cosmogenic Isotope',
    equation: '¹⁴₆C → ¹⁴₇N + e⁻ (β⁻, 156 keV) + ν̄_e (antineutrino)',
    reactants: [
      { isotope: 'C14', count: 1, z: 6, a: 14, massU: 14.003241 },
    ],
    products: [
      { isotope: 'N14', count: 1, z: 7, a: 14, massU: 14.003074 },
    ],
    energyMev: 0.156,
    energyJoules: 0.156 * MEV_TO_JOULE,
    massDefectU: 0.000167,
    neutronsProduced: 0,
    radiationType: 'beta_minus',
    visualColor: '#f59e0b',
    radiationDoseUsv: 1.2,
    operatingCondition: 'Half-life: 5,730 ± 40 Years · Weak nuclear interaction down-quark transmutation',
    realWorldApplication: 'Enables accurate dating of organic artifacts up to 50,000 years old (Egyptian papyri, Neanderthal remains, Dead Sea Scrolls).',
    scientificMechanism: 'A down quark inside an excess neutron transmutates into an up quark via emission of a virtual W⁻ boson, converting the neutron into a proton (Z increases from 6 to 7) while ejecting an electron and electron antineutrino.',
    historicalContext: 'Discovered in February 1940 by Martin Kamen and Sam Ruben; dating technique invented by Willard Libby (Nobel Prize 1960).',
    xpReward: 220,
  },

  // 8. FLUORINE-18 POSITRON EMISSION & ANNIHILATION (PET SCAN)
  {
    id: 'decay_pet_f18',
    title: 'Fluorine-18 Positron Emission & Matter-Antimatter Annihilation',
    category: 'decay',
    type: 'positron_decay',
    subTitle: 'Clinical Positron Emission Tomography (PET) Oncology & Molecular Imaging',
    equation: '¹⁸₉F → ¹⁸₈O + e⁺ (β⁺) + ν_e  ⟹  e⁺ + e⁻ → 2 γ (511 keV back-to-back photons)',
    reactants: [
      { isotope: 'F18', count: 1, z: 9, a: 18, massU: 18.000938 },
    ],
    products: [
      { isotope: 'O18', count: 1, z: 8, a: 18, massU: 17.999160 },
    ],
    energyMev: 1.655, // Decay Q-value + 1.022 MeV annihilation
    energyJoules: 1.655 * MEV_TO_JOULE,
    massDefectU: 0.001777,
    neutronsProduced: 0,
    radiationType: 'beta_plus',
    visualColor: '#8b5cf6', // High-energy positron annihilation violet
    radiationDoseUsv: 8.5,
    operatingCondition: 'Half-life: 109.8 minutes · Cyclotron produced via ¹⁸O(p,n)¹⁸F target reaction',
    realWorldApplication: 'Synthesized into [¹⁸F]-Fluorodeoxyglucose (FDG) tracer. Hyper-metabolic cancer tumors avidly take up glucose, glowing brightly on clinical PET-CT scans.',
    scientificMechanism: 'A proton in the nucleus decays via weak force into a neutron, emitting a positron (antimatter counterpart of electron) and neutrino. Within ~1 mm in tissue, the positron encounters an ambient electron and annihilates into two 511 keV gamma rays emitted at exactly 180° opposite angles for coincidence detection.',
    historicalContext: 'Key biomedical tracer utilized in hundreds of thousands of life-saving medical scans worldwide every month.',
    xpReward: 280,
  },

  // 9. TECHNETIUM-99m ISOMERIC TRANSITION (GAMMA CARDIOLOGY)
  {
    id: 'decay_gamma_tc99m',
    title: 'Technetium-99m Isomeric De-Excitation (Pure Gamma)',
    category: 'decay',
    type: 'gamma_decay',
    subTitle: 'Nuclear Cardiology & SPECT Radiopharmaceutical Imaging Standard',
    equation: '⁹⁹ᵐ₄₃Tc (Metastable nuclear isomer) → ⁹⁹₄₃Tc + γ (140.5 keV pure photon)',
    reactants: [
      { isotope: 'Tc99m', count: 1, z: 43, a: 99, massU: 98.906255 },
    ],
    products: [
      { isotope: 'Tc99', count: 1, z: 43, a: 99, massU: 98.906254 },
    ],
    energyMev: 0.1405,
    energyJoules: 0.1405 * MEV_TO_JOULE,
    massDefectU: 0.000151,
    neutronsProduced: 0,
    radiationType: 'gamma',
    visualColor: '#10b981',
    radiationDoseUsv: 4.0,
    operatingCondition: 'Half-life: 6.01 hours · Generated on-site using ⁹⁹Mo/⁹⁹ᵐTc "cow" generator columns',
    realWorldApplication: 'Accounts for over 85% of all diagnostic nuclear medicine procedures globally (myocardial perfusion imaging, bone scintigraphy).',
    scientificMechanism: 'The metastable excited nuclear isomer relaxes to its nuclear ground state by emitting a single monochromatic 140.5 keV gamma photon without damaging beta or alpha particulate emission, minimizing patient radiation dose.',
    historicalContext: 'Discovered in 1937 by Emilio Segrè and Glenn Seaborg; the first artificially produced element (Technētos = synthetic).',
    xpReward: 260,
  },
];

// Helper calculations for interactive nuclear reactor
export function calculateReactorCriticality(controlRodDepthPercent: number, moderatorPurity: number = 0.99): {
  kEff: number;
  state: 'subcritical' | 'critical' | 'supercritical';
  powerMW: number;
  cherenkovIntensity: number;
  neutronFlux: number;
} {
  // Depth 0% = rods fully withdrawn (maximum reactivity)
  // Depth 100% = rods fully inserted (reactor SCRAM shut down)
  const withdrawnFraction = (100 - controlRodDepthPercent) / 100;
  // Criticality factor k_effective
  const kEff = +(0.85 + withdrawnFraction * 0.35 * (moderatorPurity / 0.99)).toFixed(4);

  let state: 'subcritical' | 'critical' | 'supercritical' = 'critical';
  if (kEff < 0.995) state = 'subcritical';
  else if (kEff > 1.005) state = 'supercritical';

  // Steady-state thermal power model (MW)
  const powerMW = state === 'subcritical' 
    ? Math.max(5, Math.round(withdrawnFraction * 300))
    : state === 'critical'
    ? 1200 + Math.round(withdrawnFraction * 150)
    : Math.min(3400, Math.round(1400 + (kEff - 1.0) * 15000));

  // Cherenkov radiation intensity (0.0 to 1.0 scale)
  const cherenkovIntensity = Math.min(1.0, Math.max(0.05, powerMW / 3000));
  // Thermal neutron flux in n/cm²·s
  const neutronFlux = Math.round(powerMW * 1e11);

  return { kEff, state, powerMW, cherenkovIntensity, neutronFlux };
}

export function calculateTokamakPlasma(magneticFieldTesla: number, heatingPowerMW: number): {
  plasmaTempMillionK: number;
  qFactor: number;
  ignitionAchieved: boolean;
  fusionPowerMW: number;
  lawsonTripleProduct: number;
} {
  // Plasma confinement scaling: T ~ B * P_aux^0.5
  const plasmaTempMillionK = Math.min(300, Math.round((magneticFieldTesla / 12) * Math.sqrt(heatingPowerMW / 20) * 150));
  // Lawson triple product in 10²⁰ keV·s/m³
  const lawsonTripleProduct = +((magneticFieldTesla / 12) ** 2 * (plasmaTempMillionK / 150) * 3.2).toFixed(2);
  
  // Q-factor (Fusion Power / Auxiliary Heating Power)
  // Breakeven Q = 1.0, ITER goal Q = 10, Commercial ignition Q > 25
  let qFactor = 0.1;
  if (plasmaTempMillionK > 80 && magneticFieldTesla >= 6) {
    qFactor = +((plasmaTempMillionK / 100) ** 2.2 * (magneticFieldTesla / 8) ** 1.8).toFixed(2);
  }
  const ignitionAchieved = qFactor >= 10.0;
  const fusionPowerMW = Math.round(heatingPowerMW * qFactor);

  return { plasmaTempMillionK, qFactor, ignitionAchieved, fusionPowerMW, lawsonTripleProduct };
}
