/**
 * NFPA 704 Standard Fire Diamond & GHS Hazard Classification
 */

export interface NFPARating {
  health: number; // 0-4
  flammability: number; // 0-4
  instability: number; // 0-4
  special?: string; // 'OX', 'W', 'COR', 'BIO', ''
}

export interface HazardProfile {
  nfpa: NFPARating;
  ghs: ('flammable' | 'corrosive' | 'toxic' | 'oxidizer' | 'irritant')[];
  warning: string;
}

const HAZARD_MAP: Record<string, HazardProfile> = {
  hcl: {
    nfpa: { health: 3, flammability: 0, instability: 1, special: 'COR' },
    ghs: ['corrosive', 'toxic'],
    warning: 'Corrosive liquid and vapor. Causes severe skin burns and serious eye damage.',
  },
  'sulfuric-acid': {
    nfpa: { health: 3, flammability: 0, instability: 2, special: 'W' },
    ghs: ['corrosive', 'toxic'],
    warning: 'Reacts violently with water. Strong oxidizing agent when concentrated.',
  },
  'nitric-acid': {
    nfpa: { health: 4, flammability: 0, instability: 0, special: 'OX' },
    ghs: ['oxidizer', 'corrosive', 'toxic'],
    warning: 'Strong oxidizer. Contact with combustible material may cause fire.',
  },
  naoh: {
    nfpa: { health: 3, flammability: 0, instability: 1, special: 'COR' },
    ghs: ['corrosive'],
    warning: 'Causes severe skin burns and eye damage. Highly exothermic upon dissolution.',
  },
  ethanol: {
    nfpa: { health: 2, flammability: 3, instability: 0 },
    ghs: ['flammable'],
    warning: 'Highly flammable liquid and vapor. Keep away from open flame or sparks.',
  },
  acetone: {
    nfpa: { health: 2, flammability: 3, instability: 0 },
    ghs: ['flammable', 'irritant'],
    warning: 'Extremely flammable liquid and vapor. Causes serious eye irritation.',
  },
  'potassium-permanganate': {
    nfpa: { health: 2, flammability: 0, instability: 0, special: 'OX' },
    ghs: ['oxidizer', 'corrosive'],
    warning: 'May intensify fire; oxidizer. Harmful if swallowed and causes skin burns.',
  },
  'hydrogen-peroxide': {
    nfpa: { health: 3, flammability: 0, instability: 1, special: 'OX' },
    ghs: ['oxidizer', 'corrosive'],
    warning: 'Strong oxidizing liquid. Accelerated decomposition upon contamination.',
  },
  iodine: {
    nfpa: { health: 3, flammability: 0, instability: 0 },
    ghs: ['corrosive', 'toxic'],
    warning: 'Corrosive to respiratory tract and skin. Sublimes to toxic purple vapor.',
  },
  ammonia: {
    nfpa: { health: 3, flammability: 1, instability: 0 },
    ghs: ['corrosive', 'toxic'],
    warning: 'Toxic if inhaled. Causes severe skin burns and eye damage.',
  },
};

export function getChemicalHazard(id: string, name: string, formula?: string): HazardProfile {
  const key = id.toLowerCase();
  if (HAZARD_MAP[key]) return HAZARD_MAP[key];

  const lowerName = name.toLowerCase();
  const lowerFormula = (formula || '').toLowerCase();

  if (lowerName.includes('acid') || lowerFormula.includes('hcl') || lowerFormula.includes('h2so4') || lowerFormula.includes('hno3')) {
    return {
      nfpa: { health: 3, flammability: 0, instability: 1, special: 'COR' },
      ghs: ['corrosive'],
      warning: 'Corrosive reagent. Handle under fume hood with acid-resistant gloves.',
    };
  }
  if (lowerName.includes('hydroxide') || lowerFormula.includes('oh')) {
    return {
      nfpa: { health: 3, flammability: 0, instability: 1, special: 'COR' },
      ghs: ['corrosive'],
      warning: 'Caustic base. Causes severe skin burns and irreversible eye damage.',
    };
  }
  if (lowerName.includes('alcohol') || lowerName.includes('ether') || lowerName.includes('benzene') || lowerName.includes('acetone')) {
    return {
      nfpa: { health: 2, flammability: 3, instability: 0 },
      ghs: ['flammable'],
      warning: 'Flammable solvent. Vapor forms explosive mixtures with air.',
    };
  }
  if (lowerName.includes('permanganate') || lowerName.includes('peroxide') || lowerName.includes('nitrate') || lowerName.includes('chlorate')) {
    return {
      nfpa: { health: 2, flammability: 0, instability: 1, special: 'OX' },
      ghs: ['oxidizer'],
      warning: 'Oxidizing agent. Keep separated from combustible and reducing materials.',
    };
  }

  // General chemical default
  return {
    nfpa: { health: 1, flammability: 0, instability: 0 },
    ghs: ['irritant'],
    warning: 'Standard laboratory chemical. Wear safety goggles and lab coat.',
  };
}
