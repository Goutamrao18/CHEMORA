import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { equipmentPromptHandlers, registerInteractable } from './EquipmentInteraction';

type Reagent = { id: string; name: string; hazard: 'corrosive' | 'flammable' | 'toxic' | 'irritant' | 'oxidizer' | 'environment'; liquid: string };
const REAGENTS: Reagent[] = [
  { id: 'reagent-hcl', name: 'Hydrochloric acid', hazard: 'corrosive', liquid: '#f2f5f6' },
  { id: 'reagent-naoh', name: 'Sodium hydroxide', hazard: 'corrosive', liquid: '#d9f0f0' },
  { id: 'reagent-ethanol', name: 'Ethanol', hazard: 'flammable', liquid: '#f3f6f6' },
  { id: 'reagent-acetone', name: 'Acetone', hazard: 'flammable', liquid: '#e6f4f7' },
  { id: 'reagent-copper', name: 'Copper sulfate', hazard: 'environment', liquid: '#2b8bdb' },
  { id: 'reagent-peroxide', name: 'Hydrogen peroxide', hazard: 'oxidizer', liquid: '#e9f2f5' },
  { id: 'reagent-ammonia', name: 'Ammonia solution', hazard: 'irritant', liquid: '#edf7f5' },
  { id: 'reagent-iodine', name: 'Iodine solution', hazard: 'irritant', liquid: '#75452b' },
  { id: 'reagent-silver', name: 'Silver nitrate', hazard: 'oxidizer', liquid: '#f2f6f6' },
  { id: 'reagent-methanol', name: 'Methanol', hazard: 'toxic', liquid: '#eff6f4' },
  { id: 'reagent-sodium-carbonate', name: 'Sodium carbonate', hazard: 'irritant', liquid: '#f5f5ee' },
  { id: 'reagent-distilled-water', name: 'Distilled water', hazard: 'environment', liquid: '#d8f6ff' },
];
const SYMBOL: Record<Reagent['hazard'], string> = { corrosive: 'C', flammable: 'F', toxic: 'T', irritant: '!', oxidizer: 'O', environment: 'E' };
function makeLabelTexture(reagent: Reagent) {
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 160;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#f7fafc'; ctx.fillRect(0, 0, 256, 160);
    ctx.fillStyle = '#122433'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(reagent.name.toUpperCase().slice(0, 21), 12, 28);
    ctx.font = '14px sans-serif'; ctx.fillStyle = '#334155'; ctx.fillText(`ID: ${reagent.id.replace('reagent-', '').toUpperCase()}`, 12, 49);
    ctx.save(); ctx.translate(34, 103); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#fff'; ctx.strokeStyle = '#d71920'; ctx.lineWidth = 7; ctx.fillRect(-23, -23, 46, 46); ctx.strokeRect(-23, -23, 46, 46); ctx.restore();
    ctx.fillStyle = '#111827'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(SYMBOL[reagent.hazard], 34, 112);
    ctx.textAlign = 'left'; ctx.fillStyle = '#b91c1c'; ctx.font = 'bold 13px sans-serif'; ctx.fillText(`GHS: ${reagent.hazard.toUpperCase()}`, 72, 88);
    ctx.fillStyle = '#334155'; ctx.font = '12px sans-serif'; ctx.fillText('SIMULATED REAGENT', 72, 108); ctx.fillText('Use PPE in game', 72, 126);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
}

export const ReagentBottleShelf: React.FC = () => {
  const bodies = useRef<THREE.InstancedMesh>(null);
  const liquids = useRef<THREE.InstancedMesh>(null);
  const necks = useRef<THREE.InstancedMesh>(null);
  const shoulders = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);
  const reagentRoots = useRef<Record<string, THREE.Group | null>>({});
  const positions = useMemo(() => REAGENTS.map((_, i): [number, number, number] => [-4.15 + (i % 4) * 2.75, [1.1, 2.25, 3.35][Math.floor(i / 4)], -3.2 + Math.floor(i / 4) * 0.5]), []);
  useEffect(() => {
    const matrix = new THREE.Matrix4();
    REAGENTS.forEach((_, i) => {
      const [x, y, z] = positions[i];
      matrix.makeTranslation(x, y + 0.32, z); bodies.current?.setMatrixAt(i, matrix);
      matrix.makeTranslation(x, y + 0.16, z); liquids.current?.setMatrixAt(i, matrix);
      matrix.makeTranslation(x, y + 0.66, z); necks.current?.setMatrixAt(i, matrix);
      matrix.makeTranslation(x, y + 0.55, z); shoulders.current?.setMatrixAt(i, matrix); liquids.current?.setColorAt(i, new THREE.Color(REAGENTS[i].liquid));
      matrix.makeTranslation(x, y + 0.62, z); caps.current?.setMatrixAt(i, matrix);
    });
    if (bodies.current) bodies.current.instanceMatrix.needsUpdate = true;
    if (liquids.current) { liquids.current.instanceMatrix.needsUpdate = true; if (liquids.current.instanceColor) liquids.current.instanceColor.needsUpdate = true; }
    if (caps.current) caps.current.instanceMatrix.needsUpdate = true;
    if (necks.current) necks.current.instanceMatrix.needsUpdate = true;
    if (shoulders.current) shoulders.current.instanceMatrix.needsUpdate = true;
  }, [positions]);
  const labels = useMemo(() => REAGENTS.map((r) => makeLabelTexture(r)), []);
  useEffect(() => {
    const unregister = Object.values(reagentRoots.current).filter((root): root is THREE.Group => root !== null).map((root) => registerInteractable(root));
    return () => { unregister.forEach((cleanup) => cleanup()); labels.forEach((label) => label.dispose()); };
  }, [labels]);
  return <group position={[20, 0, 0]}>
    {/* Shared shelf frame */}
    <mesh position={[0, 1.05, -2.8]}><boxGeometry args={[10, 0.08, 2.0]} /><meshStandardMaterial color="#475569" metalness={0.55} roughness={0.34} /></mesh>
    <mesh position={[0, 2.2, -2.8]}><boxGeometry args={[10, 0.08, 2.0]} /><meshStandardMaterial color="#475569" metalness={0.55} roughness={0.34} /></mesh>
    <mesh position={[0, 3.3, -2.8]}><boxGeometry args={[10, 0.08, 2.0]} /><meshStandardMaterial color="#475569" metalness={0.55} roughness={0.34} /></mesh>
    <instancedMesh ref={bodies} args={[new THREE.CylinderGeometry(0.18, 0.23, 0.52, 16), new THREE.MeshPhysicalMaterial({ color: '#dfeaf0', roughness: 0.18, metalness: 0, transmission: 0.2, transparent: true, opacity: 0.85 }), REAGENTS.length]} castShadow receiveShadow />
    <instancedMesh ref={shoulders} args={[new THREE.CylinderGeometry(0.18,0.23,0.12,16), new THREE.MeshPhysicalMaterial({color:"#dfeaf0",roughness:0.16,transparent:true,opacity:0.8,transmission:0.22}), REAGENTS.length]} castShadow receiveShadow />
    <instancedMesh ref={necks} args={[new THREE.CylinderGeometry(0.095,0.13,0.18,16), new THREE.MeshPhysicalMaterial({color:"#dfeaf0",roughness:0.15,transparent:true,opacity:0.82,transmission:0.2}), REAGENTS.length]} castShadow receiveShadow />
    <instancedMesh ref={liquids} args={[new THREE.CylinderGeometry(0.195, 0.2, 0.3, 12), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.25, transparent: true, opacity: 0.72 }), REAGENTS.length]} />
    <instancedMesh ref={caps} args={[new THREE.CylinderGeometry(0.13, 0.13, 0.1, 12), new THREE.MeshStandardMaterial({ color: '#1e3a5f', roughness: 0.36 }), REAGENTS.length]} />
    {REAGENTS.map((reagent, i) => {
      const [x, y, z] = positions[i];
      return <group key={reagent.id} ref={(node) => { reagentRoots.current[reagent.id] = node; }} position={[x, y, z]} {...equipmentPromptHandlers(reagent.id, reagent.name, `Inspect ${reagent.name} · GHS ${reagent.hazard}`)} userData={{ equipmentId: reagent.id, equipmentLabel: reagent.name, equipmentPrompt: `Inspect ${reagent.name} · GHS ${reagent.hazard}`, equipmentSize: [0.5, 0.75, 0.5], hazard: reagent.hazard }}>
        <mesh position={[0, 0.31, 0.235]}><planeGeometry args={[0.36, 0.23]} /><meshBasicMaterial map={labels[i]} toneMapped={false} /></mesh>
        <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.24, 0.24, 0.68, 12]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
      </group>;
    })}
  </group>;
};
