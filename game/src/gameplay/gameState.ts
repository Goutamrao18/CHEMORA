// Unified Game State and Progression Store
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { playBubbleEffervescence, playPickupClink, playPlaceClink, playWarningBeep, setBurnerActive } from './audio';
import {
  addReagentToContainer,
  type ContainerContent,
  createEmptyContainer,measurePH, 
  PROTOCOLS_LIST,
  REAGENTS_CATALOG,simulateFiltration, simulateHeating, simulateStirring, 
  simulateTitration, transferBetweenContainers,
} from './chemistry';

export type LabStationId = 'dispensing' | 'measurement' | 'workbench' | 'analysis' | null;

export interface VesselState {
  id: string;
  name: string;
  type: 'beaker_100' | 'beaker_250' | 'flask_250' | 'cylinder_50' | 'vial_30';
  capacityMl: number;
  content: ContainerContent;
}

export interface PourVisualEvent {
  id: number;
  sourceId: string;
  targetId: string;
  color: string;
  volumeMl: number;
  durationMs?: number;
}

export interface AnalysisReport {
  id: string;
  timestamp: string;
  sampleName: string;
  sampleFormula: string;
  volumeMl: number;
  massG: number;
  ph: number;
  absorbancePeakNm: number;
  purity: number;
  isReactionVerified: boolean;
  notes: string;
}

export interface GameStoreState {
  // Navigation & View
  hasStartedGame: boolean;
  activeStation: LabStationId;
  isJournalOpen: boolean;
  isSettingsOpen: boolean;
  audioMuted: boolean;
  audioVolume: number;
  mouseSensitivity: number;

  // Equipment & Lab Vessels on benches
  heldVesselId: string | null;
  vessels: Record<string, VesselState>;
  pourVisualEvent: PourVisualEvent | null;
  reactionVisualEvent: { id: number; vesselId: string; color: string; title: string; kind: 'mix' | 'gas' | 'precipitate' | 'glow' } | null;

  // Lab Station internal workbench state
  workbenchVesselId: string | null;
  scaleVesselId: string | null;
  analysisVesselId: string | null;

  // Station controls
  hotplateTempC: number;
  isHotplateOn: boolean;
  isStirrerOn: boolean;
  scaleTareMassG: number;

  // Dispenser active selections
  selectedDispenserReagentId: string;
  dispenseVolumeMl: number;

  // Research Progression
  unlockedTier: number;
  activeProtocolIndex: number;
  completedProtocolIds: string[];
  analysisReports: AnalysisReport[];
  latestNotification: string | null;
  heldEquipmentId: string | null;
  equipmentPositions: Record<string, { position: [number, number, number]; homePosition: [number, number, number]; placedOn?: string; slotIndex?: number }>;
  ppe: { goggles: boolean; gloves: boolean; coat: boolean };
  safetyScore: number;
  safetyWarnings: string[];
  activeIncident: 'spill' | 'fire' | 'broken-glass' | null;
  massDisplayG: number;
  phDisplay: number | null;
  completedTasks: string[];
  currentRoomId: 'main' | 'storage' | 'weighing' | 'instrument' | 'safety' | 'waste' | 'office';
  setCurrentRoomId: (roomId: GameStoreState['currentRoomId']) => void;

  // Actions
  startGame: () => void;
  setActiveStation: (station: LabStationId) => void;
  setJournalOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setAudioMuted: (muted: boolean) => void;
  setAudioVolume: (volume: number) => void;
  resetProgress: () => void;
  setMouseSensitivity: (sens: number) => void;

  pickUpVessel: (id: string) => void;
  placeVessel: (target: 'held' | 'workbench' | 'scale' | 'analysis' | 'bench', id: string) => void;
  dropHeldVessel: () => void;

  setSelectedDispenserReagent: (reagentId: string) => void;
  setDispenseVolume: (vol: number) => void;
  dispenseReagentIntoVessel: (targetVesselId: string, reagentId: string, amount: number) => void;
  pourBetweenVessels: (sourceId: string, targetId: string, amountMl: number) => void;
  emptyVessel: (vesselId: string) => void;
  addLabVessel: (type: VesselState['type']) => void;

  setHotplateTemp: (temp: number) => void;
  toggleHotplate: () => void;
  toggleStirrer: () => void;
  tareScale: () => void;

  runSpectrophotometerAnalysis: (vesselId: string) => AnalysisReport | null;
  clearNotification: () => void;
  pickUpEquipment: (id: string, homePosition?: [number, number, number]) => void;
  placeOrDropEquipment: (targetId?: string, targetPosition?: [number, number, number]) => void;
  togglePPE: (item: 'goggles' | 'gloves' | 'coat') => void;
  recordLabAction: (action: 'titrate' | 'filter' | 'heat' | 'stir' | 'weigh' | 'measure-ph' | 'dispose') => void;
  triggerIncident: (incident: 'spill' | 'fire' | 'broken-glass') => void;
  respondToIncident: (response: 'spill-kit' | 'extinguisher' | 'cleanup') => void;
  completeTask: (id: string) => void;
}

type PersistedGameState = Partial<Pick<GameStoreState,
  'unlockedTier' | 'activeProtocolIndex' | 'completedProtocolIds' | 'completedTasks' | 'analysisReports' |
  'heldEquipmentId' | 'equipmentPositions' | 'ppe' | 'safetyScore' | 'safetyWarnings' | 'activeIncident' |
  'massDisplayG' | 'phDisplay' | 'audioMuted' | 'audioVolume' | 'vessels' | 'heldVesselId' |
  'workbenchVesselId' | 'scaleVesselId' | 'analysisVesselId' | 'hotplateTempC' | 'isHotplateOn' |
  'isStirrerOn' | 'scaleTareMassG' | 'currentRoomId'>>;

function partializeGameState(state: GameStoreState): PersistedGameState {
  return {
    unlockedTier: state.unlockedTier, activeProtocolIndex: state.activeProtocolIndex,
    completedProtocolIds: state.completedProtocolIds, completedTasks: state.completedTasks,
    analysisReports: state.analysisReports, heldEquipmentId: state.heldEquipmentId,
    equipmentPositions: state.equipmentPositions, ppe: state.ppe, safetyScore: state.safetyScore,
    safetyWarnings: state.safetyWarnings.slice(-20), activeIncident: state.activeIncident,
    massDisplayG: state.massDisplayG, phDisplay: state.phDisplay, audioMuted: state.audioMuted,
    audioVolume: state.audioVolume, vessels: state.vessels, heldVesselId: state.heldVesselId,
    workbenchVesselId: state.workbenchVesselId, scaleVesselId: state.scaleVesselId,
    analysisVesselId: state.analysisVesselId, hotplateTempC: state.hotplateTempC,
    isHotplateOn: state.isHotplateOn, isStirrerOn: state.isStirrerOn, scaleTareMassG: state.scaleTareMassG,
    currentRoomId: state.currentRoomId,
  };
}

export const useGameStore = create<GameStoreState>()(persist((set, get) => ({
  hasStartedGame: false,
  activeStation: null,
  isJournalOpen: false,
  isSettingsOpen: false,
  audioMuted: false,
  audioVolume: 0.65,
  mouseSensitivity: 1.0,

  heldVesselId: 'beaker_main',
  pourVisualEvent: null,
  reactionVisualEvent: null,
  vessels: {
    beaker_main: {
      id: 'beaker_main',
      name: 'Reaction Beaker (250mL)',
      type: 'beaker_250',
      capacityMl: 250,
      content: createEmptyContainer('beaker'),
    },
    cylinder_measuring: {
      id: 'cylinder_measuring',
      name: 'Graduated Cylinder (50mL)',
      type: 'cylinder_50',
      capacityMl: 50,
      content: createEmptyContainer('cylinder'),
    },
    flask_stock: {
      id: 'flask_stock',
      name: 'Erlenmeyer Flask (250mL)',
      type: 'flask_250',
      capacityMl: 250,
      content: createEmptyContainer('flask'),
    },
    vial_sample: {
      id: 'vial_sample',
      name: 'Analysis Sample Vial (30mL)',
      type: 'vial_30',
      capacityMl: 30,
      content: createEmptyContainer('vial'),
    },
  },

  workbenchVesselId: null,
  scaleVesselId: null,
  analysisVesselId: null,

  hotplateTempC: 22,
  isHotplateOn: false,
  isStirrerOn: false,
  scaleTareMassG: 0,

  selectedDispenserReagentId: 'naoh',
  dispenseVolumeMl: 20,

  unlockedTier: 1,
  activeProtocolIndex: 0,
  completedProtocolIds: [],
  analysisReports: [],
  latestNotification: 'Welcome to CHEMORA Research Laboratory. Follow Protocol 1 in your Journal.',
  heldEquipmentId: null,
  equipmentPositions: {},
  ppe: { goggles: false, gloves: false, coat: false },
  safetyScore: 100,
  safetyWarnings: [],
  activeIncident: null,
  massDisplayG: 0,
  phDisplay: null,
  completedTasks: [],
  currentRoomId: 'main',
  setCurrentRoomId: (currentRoomId) => set((state) => state.currentRoomId === currentRoomId ? state : { currentRoomId }),

  startGame: () => set({ hasStartedGame: true }),

  setActiveStation: (station) => set({ activeStation: station }),

  setJournalOpen: (open) => set({ isJournalOpen: open }),

  setSettingsOpen: (open) => set({ isSettingsOpen: open }),

  setAudioMuted: (muted) => set({ audioMuted: muted }),
  setAudioVolume: (volume) => set({ audioVolume: Math.max(0, Math.min(1, volume)) }),
  resetProgress: () => { setBurnerActive(false); set({ unlockedTier: 1, activeProtocolIndex: 0, completedProtocolIds: [], analysisReports: [], heldEquipmentId: null, equipmentPositions: {}, ppe: { goggles: false, gloves: false, coat: false }, safetyScore: 100, safetyWarnings: [], activeIncident: null, completedTasks: [], massDisplayG: 0, phDisplay: null, isHotplateOn: false, latestNotification: 'Progress reset.' }); },

  setMouseSensitivity: (sens) => set({ mouseSensitivity: sens }),

  pickUpVessel: (id) => {
    const { workbenchVesselId, scaleVesselId, analysisVesselId } = get();
    set({
      heldVesselId: id,
      workbenchVesselId: workbenchVesselId === id ? null : workbenchVesselId,
      scaleVesselId: scaleVesselId === id ? null : scaleVesselId,
      analysisVesselId: analysisVesselId === id ? null : analysisVesselId,
      latestNotification: `Holding ${get().vessels[id]?.name || 'vessel'}`,
    });
  },

  placeVessel: (target, id) => {
    if (target === 'workbench') {
      set({ workbenchVesselId: id, heldVesselId: get().heldVesselId === id ? null : get().heldVesselId });
    } else if (target === 'scale') {
      set({ scaleVesselId: id, heldVesselId: get().heldVesselId === id ? null : get().heldVesselId });
    } else if (target === 'analysis') {
      set({ analysisVesselId: id, heldVesselId: get().heldVesselId === id ? null : get().heldVesselId });
    } else {
      set({ heldVesselId: null });
    }
  },

  dropHeldVessel: () => set({ heldVesselId: null }),

  setSelectedDispenserReagent: (reagentId) => set({ selectedDispenserReagentId: reagentId }),

  setDispenseVolume: (vol) => set({ dispenseVolumeMl: vol }),

  dispenseReagentIntoVessel: (targetVesselId, reagentId, amount) => {
    const { vessels } = get();
    const targetVessel = vessels[targetVesselId];
    const reagent = REAGENTS_CATALOG[reagentId];

    if (!targetVessel) {
      set({ latestNotification: 'Dispensing failed: target vessel was not found.' });
      return;
    }
    if (!reagent) {
      set({ latestNotification: 'Dispensing failed: unknown reagent.' });
      return;
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      set({ latestNotification: 'Enter a valid quantity greater than zero.' });
      return;
    }

    // Liquids are measured in mL; solids are measured in grams and occupy an
    // approximate volume based on the catalog density for capacity checks.
    const addedVolumeMl = reagent.state === 'solid' ? amount / reagent.density : amount;
    if (targetVessel.content.volumeMl + addedVolumeMl > targetVessel.capacityMl + 1e-6) {
      set({ latestNotification: `Dispensing blocked: ${targetVessel.name} only holds ${targetVessel.capacityMl} mL.` });
      return;
    }

    const updatedContent = addReagentToContainer(targetVessel.content, reagentId, amount);
    if (updatedContent.isBubbling) playBubbleEffervescence();
    set({
      vessels: {
        ...vessels,
        [targetVesselId]: {
          ...targetVessel,
          content: updatedContent,
        },
      },
      latestNotification: `Dispensed ${amount}${reagent.state === 'solid' ? 'g' : 'mL'} of ${reagent.name}`,
      reactionVisualEvent: { id: Date.now(), vesselId: targetVesselId, color: updatedContent.color || reagent.color, title: updatedContent.productName || `${reagent.name} added`, kind: updatedContent.isGlowing ? 'glow' : updatedContent.isPrecipitate ? 'precipitate' : updatedContent.isBubbling ? 'gas' : 'mix' },
    });
  },

  pourBetweenVessels: (sourceId, targetId, amountMl) => {
    const { vessels } = get();
    const source = vessels[sourceId];
    const target = vessels[targetId];
    if (!source || !target) {
      set({ latestNotification: 'Transfer failed: source or target vessel was not found.' });
      return;
    }
    if (sourceId === targetId) {
      set({ latestNotification: 'Choose two different vessels for a transfer.' });
      return;
    }
    const transfer = transferBetweenContainers(source.content, target.content, amountMl, target.capacityMl);
    if (!transfer.ok) {
      const messages = {
        'invalid-volume': 'Transfer failed: enter a valid volume greater than zero.',
        'empty-source': `Transfer failed: ${source.name} is empty.`,
        'insufficient-source': `Transfer failed: only ${source.content.volumeMl.toFixed(1)} mL is available.`,
        'destination-overflow': `Transfer blocked: ${target.name} has only ${Math.max(0, target.capacityMl - target.content.volumeMl).toFixed(1)} mL of capacity remaining.`,
      };
      set({ latestNotification: messages[transfer.reason] });
      return;
    }
    const actualTransferMl = amountMl;
    const newSourceContent = transfer.source;
    const newTargetContent = transfer.target;
    if (newTargetContent.isBubbling) playBubbleEffervescence();

    set({
      vessels: {
        ...vessels,
        [sourceId]: { ...source, content: newSourceContent },
        [targetId]: { ...target, content: newTargetContent },
      },
      latestNotification: `Transferred ${Math.round(actualTransferMl)}mL into ${target.name}`,
      reactionVisualEvent: { id: Date.now() + 1, vesselId: targetId, color: newTargetContent.color || source.content.color, title: newTargetContent.productName || 'Solutions mixing', kind: newTargetContent.isGlowing ? 'glow' : newTargetContent.isPrecipitate ? 'precipitate' : newTargetContent.isBubbling ? 'gas' : 'mix' },
      pourVisualEvent: {
        id: Date.now(),
        sourceId,
        targetId,
        color: source.content.color || '#38bdf8',
        volumeMl: actualTransferMl,
        durationMs: Math.min(2400, Math.max(650, actualTransferMl * 18)),
      },
    });
  },

  addLabVessel: (type) => {
    const current = get().vessels;
    const definitions: Record<VesselState['type'], { label: string; capacity: number; contentType: 'beaker' | 'flask' | 'cylinder' | 'vial' }> = {
      beaker_100: { label: 'Beaker 100 mL', capacity: 100, contentType: 'beaker' },
      beaker_250: { label: 'Beaker 250 mL', capacity: 250, contentType: 'beaker' },
      flask_250: { label: 'Erlenmeyer Flask 250 mL', capacity: 250, contentType: 'flask' },
      cylinder_50: { label: 'Graduated Cylinder 50 mL', capacity: 50, contentType: 'cylinder' },
      vial_30: { label: 'Sample Vial 30 mL', capacity: 30, contentType: 'vial' },
    };
    const definition = definitions[type];
    const count = Object.keys(current).length + 1;
    const id = `lab_${type}_${Date.now()}`;
    const name = `${definition.label} #${count}`;
    set({ vessels: { ...current, [id]: { id, name, type, capacityMl: definition.capacity, content: createEmptyContainer(definition.contentType) } }, heldVesselId: id, latestNotification: `Added ${name} to your lab inventory.` });
  },

  emptyVessel: (vesselId) => {
    const { vessels } = get();
    const target = vessels[vesselId];
    if (!target) return;
    set({
      vessels: {
        ...vessels,
        [vesselId]: {
          ...target,
          content: createEmptyContainer(target.type.startsWith('cylinder') ? 'cylinder' : 'beaker'),
        },
      },
      latestNotification: `Rinsed and emptied ${target.name}`,
    });
  },

  setHotplateTemp: (temp) => {
    set({ hotplateTempC: temp });
    const { workbenchVesselId, vessels } = get();
    if (workbenchVesselId && vessels[workbenchVesselId]) {
      const target = vessels[workbenchVesselId];
      set({
        vessels: {
          ...vessels,
          [workbenchVesselId]: {
            ...target,
            content: { ...target.content, temperatureC: temp },
          },
        },
      });
    }
  },

  toggleHotplate: () => { const next = !get().isHotplateOn; setBurnerActive(next); set({ isHotplateOn: next }); },

  toggleStirrer: () => set((state) => ({ isStirrerOn: !state.isStirrerOn })),

  tareScale: () => {
    const { scaleVesselId, vessels } = get();
    const curMass = scaleVesselId && vessels[scaleVesselId] ? vessels[scaleVesselId].content.massG : 0;
    set({ scaleTareMassG: curMass });
  },

  runSpectrophotometerAnalysis: (vesselId) => {
    const { vessels, completedProtocolIds, unlockedTier } = get();
    const vessel = vessels[vesselId];
    if (!vessel || (vessel.content.volumeMl === 0 && vessel.content.massG === 0)) {
      set({ latestNotification: 'Error: Analysis chamber sample container is empty.' });
      return null;
    }

    const { content } = vessel;
    const matchedProtocol = PROTOCOLS_LIST.find((p) => p.id === content.completedReactionId);
    const isVerified = Boolean(matchedProtocol && content.purity >= 75);

    const report: AnalysisReport = {
      id: `report_${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      sampleName: content.productName || 'Uncharacterized Solution',
      sampleFormula: content.productFormula || 'Complex Mixture',
      volumeMl: content.volumeMl,
      massG: content.massG,
      ph: content.ph,
      absorbancePeakNm: content.absorbancePeakNm,
      purity: content.purity,
      isReactionVerified: isVerified,
      notes: isVerified
        ? matchedProtocol?.discoveryNotes || 'Spectrometric verification passed target criteria.'
        : 'Spectral absorption profile does not match target protocol parameters. Adjust stoichiometry or reagents.',
    };

    let nextCompleted = [...completedProtocolIds];
    let nextTier = unlockedTier;

    if (isVerified && matchedProtocol && !completedProtocolIds.includes(matchedProtocol.id)) {
      nextCompleted.push(matchedProtocol.id);
      if (nextCompleted.length >= 1 && nextTier === 1) nextTier = 2;
      if (nextCompleted.length >= 3 && nextTier === 2) nextTier = 3;
      if (nextCompleted.length >= 4 && nextTier === 3) nextTier = 4;
    }

    set((state) => ({
      analysisReports: [report, ...state.analysisReports],
      completedProtocolIds: nextCompleted,
      unlockedTier: nextTier,
      latestNotification: isVerified
        ? `Verification SUCCESS! Protocol "${matchedProtocol?.title}" completed and logged!`
        : 'Spectrophotometric scan recorded. Reaction outcome incomplete or off-target.',
    }));

    return report;
  },

  clearNotification: () => set({ latestNotification: null }),
  pickUpEquipment: (id, homePosition) => {
    const state = get();
    if (state.heldEquipmentId) { set({ latestNotification: `Hands occupied with ${state.heldEquipmentId}. Place or drop it first.` }); return; }
    const current = state.equipmentPositions[id];
    const home: [number, number, number] = current?.homePosition ?? homePosition ?? [0, 0, 0];
    const positions = { ...state.equipmentPositions, [id]: { position: current?.position ?? home, homePosition: home } };
    playPickupClink();
    set({ heldEquipmentId: id, equipmentPositions: positions, latestNotification: `Picked up ${id}. Carrying one item.` });
  },
  placeOrDropEquipment: (targetId, targetPosition) => {
    const state = get();
    const id = state.heldEquipmentId;
    if (!id) { set({ latestNotification: 'Nothing is being carried.' }); return; }
    const record = state.equipmentPositions[id] ?? { position: [0,0,0] as [number,number,number], homePosition: [0,0,0] as [number,number,number] };
    if (targetId && targetPosition && /bench|table|workbench|balance/i.test(targetId)) {
      const occupiedSlots = new Set(Object.entries(state.equipmentPositions)
        .filter(([otherId, placed]) => otherId !== id && placed.placedOn === targetId && typeof placed.slotIndex === 'number')
        .map(([, placed]) => placed.slotIndex as number));
      const slotIndex = Array.from({ length: 6 }, (_, index) => index).find((index) => !occupiedSlots.has(index));
      if (slotIndex === undefined) {
        set({ latestNotification: `${targetId} is full. Choose another bench or balance.` });
        return;
      }
      const [x, y, z] = targetPosition;
      const column = slotIndex % 3;
      const row = Math.floor(slotIndex / 3);
      const supportHeight = y > 0.5 ? y + 0.35 : y + 1.0;
      const snapped: [number, number, number] = [
        Math.round((x + (column - 1) * 0.48) * 100) / 100,
        Math.max(0.95, Math.round(supportHeight * 2) / 2),
        Math.round((z + (row === 0 ? -0.28 : 0.28)) * 100) / 100,
      ];
      playPlaceClink();
      set({ heldEquipmentId: null, equipmentPositions: { ...state.equipmentPositions, [id]: { ...record, position: snapped, placedOn: targetId, slotIndex } }, latestNotification: `Placed ${id} in slot ${slotIndex + 1} on ${targetId}.` });
    } else {
      playPlaceClink();
      set({ heldEquipmentId: null, equipmentPositions: { ...state.equipmentPositions, [id]: { ...record, position: record.homePosition, placedOn: undefined, slotIndex: undefined } }, latestNotification: `Returned ${id} to its home rack.` });
    }
  },
  togglePPE: (item) => set((state) => {
    const ppe = { ...state.ppe, [item]: !state.ppe[item] };
    return { ppe, latestNotification: `${ppe[item] ? 'Put on' : 'Removed'} ${item}.` };
  }),
  recordLabAction: (action) => set((state) => {
    const ppeComplete = state.ppe.goggles && state.ppe.gloves && state.ppe.coat;
    const safetyScore = Math.max(0, state.safetyScore - (ppeComplete ? 0 : 5));
    const tasks = state.completedTasks.includes(action) ? state.completedTasks : [...state.completedTasks, action];
    let massDisplayG = state.massDisplayG;
    let phDisplay = state.phDisplay;
    let vessels = state.vessels;
    let notification = '';
    const vesselId = state.workbenchVesselId ?? state.scaleVesselId ?? state.analysisVesselId ?? 'beaker_main';
    const vessel = vessels[vesselId];
    if (vessel && ['titrate','filter','heat','stir'].includes(action)) {
      let content = vessel.content;
      if (action === 'titrate') content = simulateTitration(content, 1);
      else if (action === 'filter') content = simulateFiltration(content);
      else if (action === 'heat') content = simulateHeating(content, 10);
      else if (action === 'stir') content = simulateStirring(content);
      vessels = { ...vessels, [vesselId]: { ...vessel, content } };
    }
    if (action === 'titrate') {
      const vessel = vessels[state.workbenchVesselId ?? 'beaker_main'];
      const hasAcid = Boolean(vessel?.content.reagents.hcl || vessel?.content.reagents.vinegar || vessel?.content.reagents.citric_acid);
      const hasBase = Boolean(vessel?.content.reagents.naoh);
      notification = hasAcid && hasBase ? 'Titration endpoint reached: indicator shifts toward fuchsia near the basic endpoint.' : 'Titration ready: add an acid, base, and indicator to the vessel.';
    } else if (action === 'filter') notification = 'Filtration completed in the educational simulation.';
    else if (action === 'heat') notification = `Heating simulated: vessel temperature now ${(vessels[vesselId]?.content.temperatureC ?? state.hotplateTempC + 10).toFixed(1)} °C.`;
    else if (action === 'stir') notification = 'Stirring simulated: mixture is homogenized.';
    else if (action === 'weigh') { const id = state.scaleVesselId ?? state.workbenchVesselId ?? 'beaker_main'; massDisplayG = Math.max(0, (vessels[id]?.content.massG ?? 0) - state.scaleTareMassG); notification = `Balance reading: ${massDisplayG.toFixed(3)} g.`; }
    else if (action === 'measure-ph') { const id = state.analysisVesselId ?? state.workbenchVesselId ?? 'beaker_main'; phDisplay = measurePH(vessels[id]?.content ?? createEmptyContainer('beaker')); notification = `pH meter reading: ${phDisplay.toFixed(2)}.`; }
    else notification = 'Select the waste container matching the waste class before disposal.';
    if (!ppeComplete) playWarningBeep();
    const safetyWarnings = (ppeComplete ? state.safetyWarnings : [...new Set([...state.safetyWarnings, 'PPE incomplete: goggles, gloves and lab coat are required.'])]).slice(-20);
    return { vessels, completedTasks: tasks, safetyScore, safetyWarnings, massDisplayG, phDisplay, latestNotification: notification };
  }),
  triggerIncident: (incident) => { playWarningBeep(); return set((state) => ({ activeIncident: incident, safetyScore: Math.max(0, state.safetyScore - 8), safetyWarnings: [...state.safetyWarnings, `Safety event: ${incident}`].slice(-20), latestNotification: incident === 'spill' ? 'Small spill! Retrieve the spill kit and respond.' : incident === 'fire' ? 'Small fire! Use the extinguisher.' : 'Broken glass! Keep clear and use the cleanup kit.' })); },
  respondToIncident: (response) => set((state) => {
    const correct = (state.activeIncident === 'spill' && response === 'spill-kit') || (state.activeIncident === 'fire' && response === 'extinguisher') || (state.activeIncident === 'broken-glass' && response === 'cleanup');
    return { activeIncident: correct ? null : state.activeIncident, safetyScore: Math.min(100, Math.max(0, state.safetyScore + (correct ? 5 : -5))), latestNotification: correct ? 'Incident handled correctly. Safety score improved.' : 'Incorrect response. Review the safety protocol.' };
  }),
  completeTask: (id) => set((state) => {
    if (state.completedTasks.includes(id)) return state;
    const completedTasks = [...state.completedTasks, id];
    const completedProtocolIds = id.startsWith('protocol:') ? [...new Set([...state.completedProtocolIds, id.slice(9)])] : state.completedProtocolIds;
    return { completedTasks, completedProtocolIds, unlockedTier: Math.min(4, 1 + Math.floor(completedProtocolIds.length / 2)), latestNotification: `Progress saved: ${id}` };
  }),
}), {
  name: 'chemora-progress',
  version: 2,
  storage: createJSONStorage(() => ({
    getItem: (name) => {
      const current = localStorage.getItem(name);
      if (current !== null) return current;
      if (name === 'chemora-progress') {
        const legacy = localStorage.getItem('chemora-phase5-progress-v1');
        if (legacy !== null) return JSON.stringify({ state: JSON.parse(legacy), version: 1 });
      }
      return null;
    },
    setItem: (name, value) => localStorage.setItem(name, value),
    removeItem: (name) => localStorage.removeItem(name),
  })),
  partialize: partializeGameState,
  migrate: (persistedState, _version) => {
    const saved = (persistedState ?? {}) as Partial<GameStoreState>;
    return {
      ...saved,
      heldEquipmentId: saved.heldEquipmentId ?? null,
      equipmentPositions: saved.equipmentPositions ?? {},
      safetyWarnings: (saved.safetyWarnings ?? []).slice(-20),
      ppe: saved.ppe ?? { goggles: false, gloves: false, coat: false },
      currentRoomId: saved.currentRoomId ?? 'main',
    } as PersistedGameState;
  },
}));

// Legacy manual persistence removed; Zustand persist is the single persistence owner.
