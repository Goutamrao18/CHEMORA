import React from 'react';
import { EquipmentItem, type EquipmentSpec } from './EquipmentPrimitives';
import { ReagentBottleShelf } from './ReagentBottleShelf';
import { useGameStore } from '../gameplay/gameState';
import { useShallow } from 'zustand/react/shallow';
import { detectRoomId, type LabRoomId } from '../layout';

const MAIN: EquipmentSpec[] = [
  { id: 'safety-ppe-rack', label: 'Goggles, gloves and coat rack', kind: 'rack', position: [5.35, 0, 6.35], size: [2.2, 1.7, 0.45], accent: '#22c55e' },
  { id: 'safety-eyewash', label: 'Eyewash station', kind: 'safety', position: [-4.9, 0, -0.9], size: [0.75, 1.1, 0.55], accent: '#22c55e', collider: true },
  { id: 'safety-shower', label: 'Emergency shower', kind: 'shower', position: [-3.5, 0, -0.9], size: [0.65, 1.35, 0.65], accent: '#22c55e', collider: true },
  { id: 'safety-extinguisher', label: 'Fire extinguisher', kind: 'extinguisher', position: [-4.9, 0, 1.1], size: [0.3, 0.8, 0.3], accent: '#ef4444' },
  { id: 'safety-first-aid', label: 'First-aid kit', kind: 'kit', position: [-3.5, 0, 1.1], size: [0.75, 0.6, 0.3], accent: '#22c55e' },
  { id: 'safety-spill-kit', label: 'Chemical spill kit', kind: 'kit', position: [-4.2, 0, 2.5], size: [0.8, 0.65, 0.45], accent: '#facc15' },
  { id: 'main-sink-01', label: 'Bench sink A', kind: 'sink', position: [-6.35, 0, 3.25], size: [1.2, 1.05, 0.85], accent: '#38bdf8', collider: true },
  { id: 'main-gas-tap-01', label: 'Gas tap A', kind: 'gasTap', position: [5.2, 0.96, -1.2], size: [0.24, 0.42, 0.24], color: '#d7e0e5', accent: '#f97316' },
  { id: 'main-sink-02', label: 'Bench sink B', kind: 'sink', position: [6.3, 0, 3.25], size: [1.2, 1.05, 0.85], accent: '#38bdf8', collider: true },
  { id: 'main-gas-tap-02', label: 'Gas tap B', kind: 'gasTap', position: [5.2, 0.96, 1.2], size: [0.24, 0.42, 0.24], accent: '#f97316' },
  { id: 'main-fume-hood-01', label: 'Fume hood A', kind: 'hood', position: [-6.3, 0, -4.3], size: [2.25, 2.5, 1.2], accent: '#38bdf8', collider: true },
  { id: 'main-fume-hood-02', label: 'Fume hood B', kind: 'hood', position: [6.3, 0, 4.3], size: [2.25, 2.5, 1.2], accent: '#38bdf8', collider: true },
  { id: 'main-ring-stand-01', label: 'Ring stand A', kind: 'stand', position: [-1.35, 0.96, 5.2], size: [0.55, 0.95, 0.55], accent: '#cbd5e1' },
  { id: 'main-clamp-01', label: 'Clamp A', kind: 'clamp', position: [-1.35, 1.8, 5.2], size: [0.25, 0.18, 0.25], accent: '#94a3b8' },
  { id: 'main-bunsen-01', label: 'Bunsen burner A', kind: 'burner', position: [-0.55, 0.96, 5.2], size: [0.3, 0.34, 0.3], accent: '#60a5fa' },
  { id: 'main-ring-stand-02', label: 'Ring stand B', kind: 'stand', position: [1.35, 0.96, 5.2], size: [0.55, 0.95, 0.55], accent: '#cbd5e1' },
  { id: 'main-clamp-02', label: 'Clamp B', kind: 'clamp', position: [1.35, 1.8, 5.2], size: [0.25, 0.18, 0.25], accent: '#94a3b8' },
  { id: 'main-bunsen-02', label: 'Bunsen burner B', kind: 'burner', position: [0.55, 0.96, 5.2], size: [0.3, 0.34, 0.3], accent: '#60a5fa' },
  { id: 'main-glassware-01', label: 'Glassware set A', kind: 'glassware', position: [-1.3, 2.42, -6.55], size: [0.42, 0.48, 0.42], accent: '#bae6fd' },
  { id: 'main-glassware-02', label: 'Glassware set B', kind: 'glassware', position: [1.3, 2.42, -6.55], size: [0.42, 0.48, 0.42], accent: '#bae6fd' },
  { id: 'glass-beaker-set', label: 'Beaker set', kind: 'glassware', position: [-2.0, 2.42, -6.55], size: [0.3, 0.42, 0.3], accent: '#bae6fd' },
  { id: 'glass-erlenmeyer-flask', label: 'Erlenmeyer flask', kind: 'glassware', position: [-1.55, 2.42, -6.55], size: [0.3, 0.45, 0.3], accent: '#bae6fd' },
  { id: 'glass-volumetric-flask', label: 'Volumetric flask', kind: 'glassware', position: [-0.9, 2.42, -6.55], size: [0.28, 0.45, 0.28], accent: '#bae6fd' },
  { id: 'glass-round-bottom-flask', label: 'Round-bottom flask', kind: 'glassware', position: [-0.45, 2.42, -6.55], size: [0.3, 0.42, 0.3], accent: '#bae6fd' },
  { id: 'glass-test-tube-rack', label: 'Test tubes and rack', kind: 'rack', position: [0.0, 2.42, -6.55], size: [0.42, 0.36, 0.32], accent: '#bae6fd' },
  { id: 'glass-graduated-cylinder', label: 'Graduated cylinder', kind: 'glassware', position: [0.45, 2.42, -6.55], size: [0.22, 0.48, 0.22], accent: '#bae6fd' },
  { id: 'glass-burette', label: 'Burette', kind: 'glassware', position: [1.8, 2.42, -6.55], size: [0.18, 0.52, 0.18], accent: '#bae6fd' },
  { id: 'glass-pipettes', label: 'Pipettes', kind: 'glassware', position: [2.2, 2.42, -6.55], size: [0.18, 0.42, 0.18], accent: '#bae6fd' },
  { id: 'glass-funnel-set', label: 'Funnels', kind: 'glassware', position: [2.6, 2.42, -6.55], size: [0.28, 0.32, 0.28], accent: '#bae6fd' },
  { id: 'glass-watch-glass', label: 'Watch glasses', kind: 'glassware', position: [3.0, 2.42, -6.55], size: [0.32, 0.16, 0.32], accent: '#bae6fd' },
  { id: 'glass-petri-dishes', label: 'Petri dishes', kind: 'glassware', position: [3.4, 2.42, -6.55], size: [0.3, 0.18, 0.3], accent: '#bae6fd' },
  { id: 'glass-condenser', label: 'Condenser', kind: 'glassware', position: [3.8, 2.42, -6.55], size: [0.3, 0.42, 0.3], accent: '#bae6fd' },
  { id: 'tool-spatula-tongs', label: 'Spatula and tongs', kind: 'stand', position: [-3.4, 2.42, -6.55], size: [0.3, 0.28, 0.3], accent: '#94a3b8' },
  { id: 'tool-stirring-rod', label: 'Stirring rod', kind: 'stand', position: [-3.0, 2.42, -6.55], size: [0.2, 0.3, 0.2], accent: '#94a3b8' },
  { id: 'tool-wash-bottle', label: 'Wash bottle', kind: 'glassware', position: [-2.6, 2.42, -6.55], size: [0.24, 0.38, 0.24], accent: '#bae6fd' },
  { id: 'tool-thermometer', label: 'Thermometer', kind: 'glassware', position: [-2.25, 2.42, -6.55], size: [0.12, 0.42, 0.12], accent: '#f97316' },
  { id: 'tool-filter-paper', label: 'Filter paper pack', kind: 'rack', position: [-3.8, 2.42, -6.55], size: [0.3, 0.2, 0.3], accent: '#e2e8f0' },
  { id: 'main-shelf-01', label: 'Wall shelving', kind: 'rack', position: [0, 1.7, -7.0], size: [9.4, 1.4, 0.42], accent: '#38bdf8', collider: true },
];
const STORAGE: EquipmentSpec[] = [
  { id: 'storage-acid-base-cabinet', label: 'Acid and base cabinet', kind: 'cabinet', position: [24.1, 0, 1.6], size: [1.7, 2.2, 1.1], color: '#e4e9ec', accent: '#f5b942', collider: true },
  { id: 'storage-flammables-cabinet', label: 'Flammables cabinet', kind: 'cabinet', position: [24.1, 0, -1.4], size: [1.7, 2.2, 1.1], color: '#f4c46b', accent: '#f97316', collider: true },
  { id: 'storage-fridge', label: 'Reagent refrigerator', kind: 'fridge', position: [15.8, 0, 3.2], size: [1.3, 2.25, 1.25], color: '#dfe7eb', accent: '#60a5fa', collider: true },
];
const WEIGHING: EquipmentSpec[] = [
  { id: 'weigh-table-01', label: 'Anti-vibration table A', kind: 'bench', position: [-2.15, 0, 18.5], size: [2.3, 0.92, 1.6], color: '#e2e8ec', accent: '#7dd3fc', collider: true },
  { id: 'weigh-balance-01', label: 'Analytical balance A', kind: 'balance', position: [-2.15, 0.92, 18.5], size: [0.8, 0.8, 0.8], accent: '#54f4c6', collider: false },
  { id: 'weigh-table-02', label: 'Anti-vibration table B', kind: 'bench', position: [2.15, 0, 18.5], size: [2.3, 0.92, 1.6], color: '#e2e8ec', accent: '#7dd3fc', collider: true },
  { id: 'weigh-balance-02', label: 'Analytical balance B', kind: 'balance', position: [2.15, 0.92, 18.5], size: [0.8, 0.8, 0.8], accent: '#54f4c6' },
  { id: 'weigh-draft-shield', label: 'Balance draft shield', kind: 'glassware', position: [0, 0, 22.6], size: [0.8, 1.1, 0.8], accent: '#bae6fd' },
];
const INSTRUMENTS: EquipmentSpec[] = [
  { id: 'instrument-bench-a', label: 'Instrument bench A', kind: 'bench', position: [-22.5, 0, -4.5], size: [5.2, 0.92, 1.6], color: '#e0e7eb', accent: '#a78bfa', collider: true },
  { id: 'instrument-bench-b', label: 'Instrument bench B', kind: 'bench', position: [-22.5, 0, 1.8], size: [5.2, 0.92, 1.6], color: '#e0e7eb', accent: '#a78bfa', collider: true },
  { id: 'instrument-bench-c', label: 'Instrument bench C', kind: 'bench', position: [-20.4, 0, -1.2], size: [5.2, 0.92, 1.4], color: '#e0e7eb', accent: '#a78bfa', collider: true },
  { id: 'instrument-ph-meter', label: 'Digital pH meter', kind: 'meter', position: [-24.4, 0.95, -4.5], size: [0.65, 0.62, 0.5], accent: '#54f4c6' },
  { id: 'instrument-hotplate', label: 'Hot plate stirrer', kind: 'instrument', position: [-21.5, 0.96, -4.5], size: [0.9, 0.75, 0.75], accent: '#f97316' },
  { id: 'instrument-centrifuge', label: 'Centrifuge', kind: 'instrument', position: [-17.2, 0, -4.2], size: [1.1, 1.05, 1.1], accent: '#60a5fa', collider: true },
  { id: 'instrument-spectrophotometer', label: 'Spectrophotometer', kind: 'instrument', position: [-24.2, 0.92, 1.7], size: [1.3, 1.15, 0.9], accent: '#a78bfa' },
  { id: 'instrument-microscope', label: 'Microscope', kind: 'instrument', position: [-20.5, 0.96, 2.3], size: [0.6, 0.9, 0.65], accent: '#a78bfa' },
  { id: 'instrument-rotovap', label: 'Rotary evaporator', kind: 'instrument', position: [-16.3, 0, 1.8], size: [1.2, 1.9, 1.1], accent: '#38bdf8', collider: true },
  { id: 'instrument-titration-stand', label: 'Titration stand', kind: 'stand', position: [-20.4, 0.96, -0.8], size: [0.65, 1.0, 0.55], accent: '#cbd5e1' },
  { id: 'instrument-distillation', label: 'Distillation glassware setup', kind: 'glassware', position: [-17.1, 0.96, -0.8], size: [0.9, 1.25, 0.7], accent: '#bae6fd' },
  { id: 'instrument-melting-point', label: 'Melting point apparatus', kind: 'instrument', position: [-24.2, 0.92, -1.2], size: [0.85, 0.8, 0.65], accent: '#a78bfa' },
];
const SAFETY: EquipmentSpec[] = [];
const WASTE: EquipmentSpec[] = [
  { id: 'waste-organic', label: 'Organic waste container', kind: 'bin', position: [16.7, 0, 11.2], size: [0.8, 1.1, 0.8], color: '#2563eb', accent: '#2563eb' },
  { id: 'waste-acid', label: 'Acid waste container', kind: 'bin', position: [18.8, 0, 11.2], size: [0.8, 1.1, 0.8], color: '#facc15', accent: '#facc15' },
  { id: 'waste-base', label: 'Base waste container', kind: 'bin', position: [20.9, 0, 11.2], size: [0.8, 1.1, 0.8], color: '#22c55e', accent: '#22c55e' },
  { id: 'waste-solid', label: 'Solid waste container', kind: 'bin', position: [16.7, 0, 14.6], size: [0.8, 1.1, 0.8], color: '#64748b', accent: '#64748b' },
  { id: 'waste-sharps', label: 'Sharps container', kind: 'bin', position: [18.8, 0, 14.6], size: [0.8, 1.1, 0.8], color: '#dc2626', accent: '#dc2626' },
];
const OFFICE: EquipmentSpec[] = [
  { id: 'office-desk', label: 'Research desk', kind: 'desk', position: [0, 0, -20.7], size: [3.5, 0.9, 1.4], color: '#b8c5cc', accent: '#60a5fa', collider: true },
  { id: 'office-computer', label: 'Research journal computer', kind: 'computer', position: [0, 0.92, -20.7], size: [0.85, 0.8, 0.55], accent: '#60a5fa' },
  { id: 'office-whiteboard', label: 'Protocol whiteboard', kind: 'board', position: [0, 1.45, -23.3], size: [3.8, 1.6, 0.12], color: '#f8fafc', accent: '#60a5fa', collider: true },
];

const ROOM_GROUPS: Array<{ items: EquipmentSpec[]; id: LabRoomId }> = [
  { id: 'main', items: MAIN }, { id: 'storage', items: STORAGE }, { id: 'weighing', items: WEIGHING },
  { id: 'instrument', items: INSTRUMENTS }, { id: 'safety', items: SAFETY }, { id: 'waste', items: WASTE }, { id: 'office', items: OFFICE },
];
const EquipmentRoom: React.FC<{ room: typeof ROOM_GROUPS[number] }> = ({ room }) => {
  const held = useGameStore((state) => state.heldEquipmentId);
  const currentRoomId = useGameStore((state) => state.currentRoomId);
  const positions = useGameStore(useShallow((state) => Object.fromEntries(room.items.map((item) => [item.id, state.equipmentPositions[item.id]]))));
  return <group>{room.items.filter((item) => item.id !== held).map((item) => { const saved = positions[item.id]; const positioned = saved ? { ...item, position: saved.position } : item; const visibleRoomId = detectRoomId(positioned.position[0], positioned.position[2]); return <group key={item.id} visible={visibleRoomId === currentRoomId}><EquipmentItem item={positioned} /></group>; })}</group>;
};
export const EquipmentComplex: React.FC = () => <group>
  {ROOM_GROUPS.map((room) => <EquipmentRoom key={room.id} room={room} />)}
  <ReagentBottleShelf />
</group>;
