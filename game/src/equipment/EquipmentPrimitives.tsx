import { CuboidCollider, RigidBody } from '@react-three/rapier';
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGraphicsSettings } from '../graphics/quality';
import { equipmentPromptHandlers, registerInteractable } from './EquipmentInteraction';

export type EquipmentKind = 'bench' | 'cabinet' | 'fridge' | 'balance' | 'meter' | 'instrument' | 'safety' | 'bin' | 'desk' | 'computer' | 'board' | 'sink' | 'hood' | 'stand' | 'burner' | 'shower' | 'extinguisher' | 'kit' | 'rack' | 'glassware' | 'clamp' | 'gasTap';
export type EquipmentSpec = { id: string; label: string; prompt?: string; kind: EquipmentKind; position: [number, number, number]; size?: [number, number, number]; color?: string; accent?: string; rotationY?: number; collider?: boolean };

const MATERIALS: Record<string, { color: string; metalness?: number; roughness?: number }> = {
  steel: { color: '#91a5ae', metalness: 0.82, roughness: 0.24 }, dark: { color: '#20313c', metalness: 0.45, roughness: 0.38 }, epoxy: { color: '#243b49', metalness: 0.22, roughness: 0.22 }, white: { color: '#e7edf0', metalness: 0.06, roughness: 0.45 }, glass: { color: '#a9e9f2', metalness: 0, roughness: 0.12 },
};


const sharedSurfaceCanvas = document.createElement('canvas');
sharedSurfaceCanvas.width = sharedSurfaceCanvas.height = 128;
const sharedSurfaceContext = sharedSurfaceCanvas.getContext('2d');
if (sharedSurfaceContext) {
  sharedSurfaceContext.fillStyle = '#b7b7b7'; sharedSurfaceContext.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 900; i++) { const v = (i * 37) % 90 + 80; sharedSurfaceContext.fillStyle = `rgba(${v},${v},${v},0.22)`; sharedSurfaceContext.fillRect((i * 29) % 128, (i * 53) % 128, 1 + (i % 3), 1 + (i % 2)); }
}
const sharedRoughnessTexture = new THREE.CanvasTexture(sharedSurfaceCanvas);
const sharedNormalTexture = new THREE.CanvasTexture(sharedSurfaceCanvas);
for (const texture of [sharedRoughnessTexture, sharedNormalTexture]) { texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.repeat.set(2, 2); }
const SHARED_STEEL = new THREE.MeshStandardMaterial({ ...MATERIALS.steel, roughnessMap: sharedRoughnessTexture, bumpMap: sharedNormalTexture, bumpScale: 0.012 });
const SHARED_DARK = new THREE.MeshStandardMaterial({ ...MATERIALS.dark, roughnessMap: sharedRoughnessTexture });
const surfaceMaterials = new Map<string, THREE.MeshStandardMaterial>();
function surfaceMaterial(kind: EquipmentKind, color: string) {
  const base = kind === 'bench' ? MATERIALS.epoxy : MATERIALS.white;
  const key = `${kind}|${color}`; let material = surfaceMaterials.get(key);
  if (!material) { material = new THREE.MeshStandardMaterial({ ...base, color, roughnessMap: sharedRoughnessTexture, bumpMap: sharedNormalTexture, bumpScale: kind === 'bench' ? 0.018 : 0.006 }); surfaceMaterials.set(key, material); }
  return material;
}
const SHARED_GLASS = new THREE.MeshPhysicalMaterial({ color: '#bdeef4', transparent: true, opacity: 0.48, roughness: 0.12, transmission: 0.35 });
const SHARED_GLASS_PANEL = new THREE.MeshPhysicalMaterial({ color: '#bfeaf1', transparent: true, opacity: 0.24, roughness: 0.08, transmission: 0.72, thickness: 0.08 });
const SHARED_BALANCE_PANEL = new THREE.MeshPhysicalMaterial({ color: '#bdeef5', transparent: true, opacity: 0.18, roughness: 0.06, transmission: 0.82, thickness: 0.04 });
const SHARED_INSTRUMENT_DIAL = new THREE.MeshStandardMaterial({ color: '#252c32', metalness: 0.38, roughness: 0.24 });
const accentMaterials = new Map<string, THREE.MeshStandardMaterial>();
function accentMaterial(color: string) { let material = accentMaterials.get(color); if (!material) { material = new THREE.MeshStandardMaterial({ color, metalness: 0.2, roughness: 0.4 }); accentMaterials.set(color, material); } return material; }
const basicMaterials = new Map<string, THREE.MeshBasicMaterial>();
function basicMaterial(color: string) { let material = basicMaterials.get(color); if (!material) { material = new THREE.MeshBasicMaterial({ color }); basicMaterials.set(color, material); } return material; }
const labelMaterials = new Map<THREE.Texture, THREE.MeshBasicMaterial>();
function labelMaterialFor(texture: THREE.Texture | null) {
  if (!texture) return basicMaterial('#ffffff');
  let material = labelMaterials.get(texture); if (!material) { material = new THREE.MeshBasicMaterial({ map: texture, color: '#ffffff' }); labelMaterials.set(texture, material); } return material;
}
const SHARED_WHITE_PANEL = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.25, metalness: 0.03 });
const labelTextures = new Map<string, THREE.CanvasTexture>();
function labelTextureFor(label: string, accent: string) {
  const key = `${label}|${accent}`; const cached = labelTextures.get(key); if (cached) return cached;
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 96; const context = canvas.getContext('2d');
  if (context) { context.fillStyle = '#f8fafc'; context.fillRect(0, 0, 256, 96); context.fillStyle = accent; context.fillRect(0, 0, 18, 96); context.fillStyle = '#10202d'; context.font = 'bold 20px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(label.toUpperCase(), 140, 48, 220); }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; labelTextures.set(key, texture); return texture;
}
if (import.meta.hot) import.meta.hot.dispose(() => {
  for (const texture of [sharedRoughnessTexture, sharedNormalTexture, ...labelTextures.values()]) texture.dispose();
  for (const material of [SHARED_STEEL, SHARED_DARK, SHARED_GLASS, SHARED_GLASS_PANEL, SHARED_BALANCE_PANEL, SHARED_INSTRUMENT_DIAL, ...surfaceMaterials.values(), ...accentMaterials.values(), ...basicMaterials.values(), ...labelMaterials.values(), SHARED_WHITE_PANEL]) material.dispose();
});

export const EquipmentItem: React.FC<{ item: EquipmentSpec }> = ({ item }) => {
  const graphics = useGraphicsSettings();
  const shadow = graphics.quality === 'High';
  const size = item.size ?? [1, 1, 1];
  const color = item.color ?? '#dbe5ea';
  const accent = item.accent ?? '#38bdf8';
  const handlers = equipmentPromptHandlers(item.id, item.label, item.prompt ?? `Inspect ${item.label}`);
  const rootRef = useRef<THREE.Group>(null);
  const labelTexture = item.kind === 'bin' ? labelTextureFor(item.label, accent) : null;
  const steel = SHARED_STEEL;
  const dark = SHARED_DARK;
  const surface = surfaceMaterial(item.kind, color);
  useEffect(() => { if (!rootRef.current) return; return registerInteractable(rootRef.current); }, [item.id]);
  const small = Math.min(size[0], size[2]);
  return <group ref={rootRef} position={item.position} rotation={[0, item.rotationY ?? 0, 0]} {...handlers} userData={{ equipmentId: item.id, equipmentLabel: item.label, equipmentPrompt: item.prompt ?? `Inspect ${item.label}`, equipmentSize: size, prompt: item.prompt ?? `Inspect ${item.label}` }}>
    {item.collider && <RigidBody type="fixed" colliders={false}><CuboidCollider args={[size[0] / 2, size[1] / 2, size[2] / 2]} position={[0, size[1] / 2, 0]} /></RigidBody>}
    {(item.kind === 'bench' || item.kind === 'desk') && <>
      <mesh position={[0, size[1] * 0.48, 0]} castShadow={shadow} receiveShadow material={dark}><boxGeometry args={[size[0] * 0.94, size[1] * 0.82, size[2] * 0.9]} /></mesh>
      <mesh position={[0, size[1] * 0.93, 0]} castShadow={shadow} receiveShadow material={surface}><boxGeometry args={[size[0], 0.1, size[2]]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * size[0] * 0.39, size[1] * 0.2, 0]} material={steel}><boxGeometry args={[0.08, size[1] * 0.4, size[2] * 0.72]} /></mesh>)}
      {[-1,1].flatMap((x)=>[-1,1].map((z)=><mesh key={`foot-${x}-${z}`} position={[x*size[0]*0.39,0.035,z*size[2]*0.32]} material={dark}><cylinderGeometry args={[0.065,0.065,0.07,10]}/></mesh>))}
    </>}
    {(item.kind === 'cabinet' || item.kind === 'fridge') && <>
      <mesh position={[0, size[1] / 2, 0]} castShadow={shadow} receiveShadow material={surface}><boxGeometry args={size} /></mesh>
      <mesh position={[0, size[1] * 0.55, size[2] / 2 + 0.008]} material={dark}><boxGeometry args={[size[0] * 0.84, size[1] * 0.58, 0.025]} /></mesh>
      <mesh position={[size[0] * 0.3, size[1] * 0.55, size[2] / 2 + 0.035]} material={steel}><sphereGeometry args={[0.035, 10, 8]} /></mesh>
    </>}
    {item.kind === 'hood' && <>
      <mesh position={[0,size[1]*0.18,0]} material={dark} castShadow={shadow}><boxGeometry args={[size[0]*0.96,size[1]*0.36,size[2]*0.96]}/></mesh>
      <mesh position={[0,size[1]*0.63,-size[2]*0.22]} material={surface} castShadow={shadow}><boxGeometry args={[size[0]*0.98,size[1]*0.62,size[2]*0.48]}/></mesh>
      <mesh position={[0,size[1]*0.66,size[2]*0.29]} material={steel}><boxGeometry args={[size[0]*0.92,size[1]*0.04,0.05]}/></mesh>
      <mesh position={[0,size[1]*0.44,size[2]*0.29]} material={SHARED_GLASS_PANEL}><boxGeometry args={[size[0]*0.82,size[1]*0.38,0.025]}/></mesh>
      <mesh position={[0,size[1]*0.84,-size[2]*0.12]} material={dark}><boxGeometry args={[size[0]*0.72,size[1]*0.08,size[2]*0.55]}/></mesh>
      {Array.from({length:9},(_,i)=><mesh key={i} position={[-size[0]*0.36+i*size[0]*0.09,size[1]*0.84,size[2]*0.18]} material={steel}><boxGeometry args={[0.025,size[1]*0.07,0.28]}/></mesh>)}
      <mesh position={[size[0]*0.39,size[1]*0.23,size[2]*0.5]} material={steel}><boxGeometry args={[0.045,size[1]*0.12,0.04]}/></mesh>
      <mesh position={[-size[0]*0.39,size[1]*0.23,size[2]*0.5]} material={steel}><boxGeometry args={[0.045,size[1]*0.12,0.04]}/></mesh>
      <mesh position={[0,size[1]*0.31,size[2]*0.5]} material={dark}><boxGeometry args={[size[0]*0.35,size[1]*0.025,0.035]}/></mesh>
    </>}
    {item.kind === 'rack' && <>{[-1, 1].map((s) => <mesh key={`post-${s}`} position={[s * size[0] * 0.48, size[1] * 0.5, 0]} material={steel}><boxGeometry args={[0.045, Math.max(0.18, size[1]), Math.max(0.08, size[2] * 0.7)]} /></mesh>)}{[0.1, 0.5, 0.9].map((level) => <mesh key={level} position={[0, size[1] * level, 0]} material={dark}><boxGeometry args={[size[0], Math.max(0.035, size[1] * 0.04), size[2]]} /></mesh>)}</>}
    {item.kind === 'gasTap' && <><mesh position={[0, size[1] * 0.45, 0]} material={steel}><cylinderGeometry args={[0.025, 0.025, size[1] * 0.9, 10]} /></mesh><mesh position={[size[0] * 0.35, size[1] * 0.8, 0]} rotation={[0, 0, Math.PI / 2]} material={steel}><cylinderGeometry args={[0.022, 0.022, size[0] * 0.7, 10]} /></mesh><mesh position={[size[0] * 0.12, size[1] * 0.63, 0]} material={accentMaterial(accent)}><sphereGeometry args={[0.07, 10, 8]} /></mesh></>}
    {item.kind === 'clamp' && <><mesh position={[0, size[1] * 0.5, 0]} material={steel}><boxGeometry args={[size[0], 0.035, 0.035]} /></mesh><mesh position={[-size[0] * 0.28, size[1] * 0.7, 0]} material={steel}><boxGeometry args={[0.035, size[1] * 0.55, 0.035]} /></mesh></>}
    {item.kind === 'board' && <>
      <mesh position={[0, size[1] * 0.5, 0]} material={steel}><boxGeometry args={[size[0], size[1], size[2]]} /></mesh>
      <mesh position={[0, size[1] * 0.5, size[2] * 0.51]} material={SHARED_WHITE_PANEL}><planeGeometry args={[size[0] * 0.92, size[1] * 0.84]} /></mesh>
      <mesh position={[-size[0] * 0.22, size[1] * 0.56, size[2] * 0.53]} material={basicMaterial(accent)}><boxGeometry args={[size[0] * 0.36, 0.025, 0.008]} /></mesh>
      <mesh position={[size[0] * 0.15, size[1] * 0.4, size[2] * 0.53]} material={basicMaterial("#334155")}><boxGeometry args={[size[0] * 0.48, 0.025, 0.008]} /></mesh>
    </>}
    {item.kind === 'sink' && <>
      <mesh position={[0, 0.93, 0]} material={dark}><boxGeometry args={[size[0], 0.1, size[2]]} /></mesh>
      <mesh position={[0, 0.99, 0]} material={steel}><boxGeometry args={[size[0] * 0.55, 0.04, size[2] * 0.58]} /></mesh>
      <mesh position={[0, 1.16, -size[2] * 0.2]} material={steel}><cylinderGeometry args={[0.025, 0.025, 0.32, 10]} /></mesh>
      <mesh position={[0, 1.31, -size[2] * 0.08]} material={steel}><boxGeometry args={[0.18, 0.025, 0.025]} /></mesh>
    </>}
    {item.kind === 'balance' && <>
      <mesh position={[0, 0.12, 0]} material={surface}><boxGeometry args={[size[0], 0.24, size[2]]} /></mesh>
      <mesh position={[0, 0.27, -size[2] * 0.08]} material={steel}><cylinderGeometry args={[small * 0.24, small * 0.24, 0.025, 24]} /></mesh>
      <mesh position={[0, 0.28, size[2] * 0.27]} material={dark}><boxGeometry args={[size[0] * 0.55, 0.06, 0.08]} /></mesh>
      <mesh position={[0, 0.29, size[2] * 0.28]} material={basicMaterial("#54f4c6")}><planeGeometry args={[size[0] * 0.3, 0.035]} /></mesh>
      {[-1, 1].map((s) => <mesh key={s} position={[s * size[0] * 0.42, 0.34, 0]} material={steel}><boxGeometry args={[0.025, 0.34, size[2] * 0.75]} /></mesh>)}
      <mesh position={[0, 0.51, 0]} material={steel}><boxGeometry args={[size[0] * 0.9, 0.025, 0.035]} /></mesh>
    </>}
    {(item.kind === 'meter' || item.kind === 'computer') && <>
      <mesh position={[0, size[1] * 0.3, 0]} material={dark}><boxGeometry args={[size[0], size[1] * 0.45, size[2] * 0.5]} /></mesh>
      <mesh position={[0, size[1] * 0.72, -size[2] * 0.05]} rotation={[-0.12, 0, 0]} material={dark}><boxGeometry args={[size[0] * 0.84, size[1] * 0.45, 0.07]} /></mesh>
      <mesh position={[0, size[1] * 0.72, -size[2] * 0.005]} rotation={[-0.12, 0, 0]} material={basicMaterial(accent)}><planeGeometry args={[size[0] * 0.72, size[1] * 0.32]} /></mesh>
      {item.kind === 'meter' && <mesh position={[size[0] * 0.35, size[1] * 0.12, size[2] * 0.42]} material={steel}><cylinderGeometry args={[0.025, 0.025, 0.22, 10]} /></mesh>}
    </>}
    {item.kind === 'instrument' && <>
      <mesh position={[0, size[1] * 0.32, 0]} material={surface}><boxGeometry args={[size[0], size[1] * 0.64, size[2]]} /></mesh>
      <mesh position={[0, size[1] * 0.72, 0]} material={steel}><cylinderGeometry args={[small * 0.26, small * 0.3, size[1] * 0.22, 24]} /></mesh>
      <mesh position={[0, size[1] * 0.92, 0]} material={dark}><cylinderGeometry args={[small * 0.24, small * 0.24, 0.04, 24]} /></mesh>
      <mesh position={[size[0] * 0.25, size[1] * 0.65, size[2] * 0.51]} material={basicMaterial(accent)}><planeGeometry args={[size[0] * 0.24, size[1] * 0.14]} /></mesh>
    </>}
    {item.kind === 'safety' && <>
      <mesh position={[0, size[1] * 0.4, 0]} material={surface}><boxGeometry args={size} /></mesh>
      <mesh position={[0, size[1] * 0.82, size[2] * 0.51]} material={steel}><boxGeometry args={[size[0] * 0.62, 0.08, 0.06]} /></mesh>
      <mesh position={[0, size[1] * 0.43, size[2] * 0.52]} material={basicMaterial(accent)}><planeGeometry args={[size[0] * 0.42, size[1] * 0.34]} /></mesh>
    </>}
    {item.kind === 'bin' && <>
      <mesh position={[0, size[1] * 0.45, 0]} material={surface}><cylinderGeometry args={[size[0] * 0.45, size[0] * 0.36, size[1] * 0.9, 16]} /></mesh>
      <mesh position={[0, size[1] * 0.92, 0]} material={dark}><cylinderGeometry args={[size[0] * 0.47, size[0] * 0.47, 0.06, 16]} /></mesh>
      <mesh position={[0, size[1] * 0.58, size[2] * 0.46]} material={labelMaterialFor(labelTexture)}><planeGeometry args={[size[0] * 0.72, size[1] * 0.22]} /></mesh>
    </>}
    {(item.kind === 'stand' || item.kind === 'shower' || item.kind === 'extinguisher' || item.kind === 'kit' || item.kind === 'burner' || item.kind === 'glassware') && <>
      <mesh position={[0, size[1] * 0.45, 0]} material={surface}><boxGeometry args={[size[0] * 0.8, size[1] * 0.9, size[2] * 0.8]} /></mesh>
      {item.kind === 'stand' && <><mesh position={[0, size[1] * 1.08, 0]} material={steel}><cylinderGeometry args={[0.025, 0.025, size[1] * 1.1, 10]} /></mesh><mesh position={[size[0] * 0.18, size[1] * 1.15, 0]} material={steel}><boxGeometry args={[size[0] * 0.5, 0.035, 0.035]} /></mesh></>}
      {item.kind === 'shower' && <><mesh position={[0, size[1] * 1.05, 0]} material={steel}><cylinderGeometry args={[0.035, 0.035, size[1] * 1.1, 10]} /></mesh><mesh position={[0, size[1] * 1.6, 0]} material={steel}><cylinderGeometry args={[size[0] * 0.42, size[0] * 0.42, 0.08, 16]} /></mesh></>}
      {item.kind === 'extinguisher' && <><mesh position={[0, size[1] * 0.55, 0]} material={accentMaterial('#c62929')}><cylinderGeometry args={[size[0] * 0.36, size[0] * 0.4, size[1] * 0.9, 16]} /></mesh><mesh position={[0, size[1] * 1.05, 0]} material={steel}><cylinderGeometry args={[0.035, 0.035, 0.13, 8]} /></mesh></>}
      {item.kind === 'burner' && <mesh position={[0, size[1] * 0.98, 0]} material={steel}><cylinderGeometry args={[size[0] * 0.2, size[0] * 0.28, 0.12, 16]} /></mesh>}
      {item.kind === 'glassware' && <mesh position={[0, size[1] * 0.92, 0]} material={SHARED_GLASS}><cylinderGeometry args={[size[0] * 0.32, size[0] * 0.42, size[1] * 0.8, 16, 1, true]} /></mesh>}
    </>}
    {item.kind === 'burner' && <>
      <mesh position={[0,size[1]*0.62,0]} material={steel}><cylinderGeometry args={[size[0]*0.17,size[0]*0.24,size[1]*0.6,20]}/></mesh>
      <mesh position={[size[0]*0.35,size[1]*0.28,0]} material={dark} rotation={[0,0,Math.PI/2]}><cylinderGeometry args={[0.035,0.035,0.11,12]} /></mesh>
      <mesh position={[0,size[1]*1.02,0]} material={steel}><cylinderGeometry args={[size[0]*0.19,size[0]*0.19,0.045,20]}/></mesh>
    </>}
    {item.kind === 'balance' && <mesh position={[0,size[1]*0.66,-size[2]*0.05]} material={SHARED_BALANCE_PANEL}><boxGeometry args={[size[0]*0.94,size[1]*0.65,size[2]*0.62]}/></mesh>}
    {item.kind === 'instrument' && item.label.toLowerCase().includes('hot plate') && <>
      <mesh position={[0,size[1]*0.73,0]} material={dark}><boxGeometry args={[size[0]*0.76,0.07,size[2]*0.76]}/></mesh>
      <mesh position={[0,size[1]*0.79,0]} material={SHARED_INSTRUMENT_DIAL}><cylinderGeometry args={[small*0.32,small*0.32,0.035,32]}/></mesh>
      {[-1,1].map((side)=><mesh key={side} position={[side*size[0]*0.32,size[1]*0.52,size[2]*0.51]} material={steel}><cylinderGeometry args={[0.055,0.055,0.07,12]}/></mesh>)}
      <mesh position={[size[0]*0.24,size[1]*0.4,size[2]*0.51]} material={basicMaterial("#f97316")}><planeGeometry args={[size[0]*0.2,0.1]}/></mesh>
    </>}
    {item.kind === 'instrument' && item.label.toLowerCase().includes('centrifuge') && <>
      <mesh position={[0,size[1]*0.78,0]} material={steel}><cylinderGeometry args={[small*0.37,small*0.37,0.1,24]}/></mesh>
      <mesh position={[0,size[1]*0.88,0]} material={SHARED_GLASS}><cylinderGeometry args={[small*0.32,small*0.32,0.12,24]}/></mesh>
      <mesh position={[size[0]*0.28,size[1]*0.45,size[2]*0.51]} material={basicMaterial("#67e8f9")}><planeGeometry args={[size[0]*0.24,0.13]}/></mesh>
    </>}
    {item.kind === 'instrument' && item.label.toLowerCase().includes('microscope') && <>
      <mesh position={[0,size[1]*0.82,0]} material={steel}><cylinderGeometry args={[size[0]*0.12,size[0]*0.16,size[1]*0.36,16]}/></mesh>
      <mesh position={[0,size[1]*1.01,-size[2]*0.13]} rotation={[0.22,0,0]} material={dark}><cylinderGeometry args={[size[0]*0.09,size[0]*0.09,size[1]*0.22,16]}/></mesh>
      <mesh position={[size[0]*0.2,size[1]*0.48,0]} material={steel}><cylinderGeometry args={[0.045,0.045,0.16,12]}/></mesh>
      <mesh position={[0,size[1]*0.2,0]} material={dark}><boxGeometry args={[size[0]*0.9,0.07,size[2]*0.88]}/></mesh>
    </>}
    {item.kind === 'bin' && <mesh position={[0,size[1]*0.94,0]} material={steel}><cylinderGeometry args={[size[0]*0.48,size[0]*0.48,0.035,18]}/></mesh>}
    {item.kind === 'extinguisher' && <>
      <mesh position={[size[0]*0.26,size[1]*1.03,0]} material={dark}><torusGeometry args={[0.08,0.015,6,12,Math.PI]}/></mesh>
      <mesh position={[size[0]*0.36,size[1]*0.87,0]} material={dark}><cylinderGeometry args={[0.018,0.018,size[1]*0.32,8]}/></mesh>
      <mesh position={[0,size[1]*0.55,size[2]*0.39]} material={basicMaterial("#fff1f2")}><planeGeometry args={[size[0]*0.55,size[1]*0.28]}/></mesh>
    </>}
    {item.kind === 'hood' && <mesh position={[0,size[1]*0.2,size[2]*0.51]} material={steel}><boxGeometry args={[size[0]*0.2,0.035,0.04]}/></mesh>}
    <mesh position={[0, size[1] + 0.04, 0]} material={basicMaterial(accent)}><sphereGeometry args={[0.018, 6, 4]} /></mesh>
  </group>;
};
