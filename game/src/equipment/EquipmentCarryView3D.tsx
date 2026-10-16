import { useFrame, useThree } from '@react-three/fiber';
import React, { useRef } from 'react';
import * as THREE from 'three';
import { useGameStore } from '../gameplay/gameState';

/** Small camera-attached hand model; the world item itself is hidden while held. */
export const EquipmentCarryView3D: React.FC = () => {
  const group = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const held = useGameStore((s) => s.heldEquipmentId);
  const category = /bottle|reagent|wash/i.test(held ?? '')
    ? 'bottle'
    : /flask/i.test(held ?? '')
      ? 'flask'
      : /beaker|glassware|cylinder|vial|test-tube/i.test(held ?? '')
        ? 'beaker'
        : held ? 'tool' : 'none';

  useFrame(() => {
    if (!group.current) return;
    group.current.visible = category !== 'none';
    if (category !== 'none') {
      const offset = new THREE.Vector3(0.32, -0.28, -0.62).applyQuaternion(camera.quaternion);
      group.current.position.copy(camera.position).add(offset);
      group.current.quaternion.copy(camera.quaternion);
    }
  });

  return <group ref={group} visible={false}>
    {category === 'bottle' && <>
      <mesh position={[0, -0.015, 0]}><cylinderGeometry args={[0.075, 0.09, 0.22, 14]} /><meshPhysicalMaterial color="#8bd7e8" transparent opacity={0.58} roughness={0.18} transmission={0.2} /></mesh>
      <mesh position={[0, 0.125, 0]}><cylinderGeometry args={[0.032, 0.04, 0.07, 12]} /><meshPhysicalMaterial color="#8bd7e8" transparent opacity={0.6} /></mesh>
      <mesh position={[0, 0.17, 0]}><cylinderGeometry args={[0.04, 0.04, 0.035, 12]} /><meshStandardMaterial color="#fbbf24" /></mesh>
      <mesh position={[0, -0.015, 0.046]}><boxGeometry args={[0.09, 0.065, 0.004]} /><meshStandardMaterial color="#f8fafc" /></mesh>
    </>}
    {category === 'beaker' && <>
      <mesh position={[0, -0.005, 0]}><cylinderGeometry args={[0.082, 0.092, 0.19, 18, 1, true]} /><meshPhysicalMaterial color="#a8e8f3" transparent opacity={0.4} roughness={0.12} transmission={0.25} side={THREE.DoubleSide} /></mesh>
      <mesh position={[0, 0.092, 0]}><torusGeometry args={[0.083, 0.008, 6, 18]} /><meshStandardMaterial color="#d5e2e8" metalness={0.3} roughness={0.25} /></mesh>
      <mesh position={[0.055, 0.08, 0]} rotation={[0, 0, -0.35]}><boxGeometry args={[0.055, 0.012, 0.028]} /><meshPhysicalMaterial color="#a8e8f3" transparent opacity={0.45} /></mesh>
      <mesh position={[0, -0.035, 0]}><cylinderGeometry args={[0.083, 0.083, 0.004, 18]} /><meshPhysicalMaterial color="#64cbe2" transparent opacity={0.25} /></mesh>
    </>}
    {category === 'flask' && <>
      <mesh position={[0, -0.035, 0]} scale={[1, 1.05, 1]}><sphereGeometry args={[0.095, 18, 14]} /><meshPhysicalMaterial color="#a8e8f3" transparent opacity={0.48} roughness={0.12} transmission={0.25} /></mesh>
      <mesh position={[0, 0.09, 0]}><cylinderGeometry args={[0.027, 0.04, 0.12, 12]} /><meshPhysicalMaterial color="#a8e8f3" transparent opacity={0.52} /></mesh>
      <mesh position={[0, 0.155, 0]}><torusGeometry args={[0.029, 0.006, 6, 14]} /><meshStandardMaterial color="#d5e2e8" metalness={0.35} roughness={0.25} /></mesh>
    </>}
    {category === 'tool' && <>
      <mesh rotation={[0, 0, -0.16]}><cylinderGeometry args={[0.012, 0.012, 0.34, 8]} /><meshStandardMaterial color="#cbd5e1" metalness={0.65} roughness={0.28} /></mesh>
      <mesh position={[0, -0.15, 0]} rotation={[0, 0, -0.16]}><boxGeometry args={[0.055, 0.075, 0.018]} /><meshStandardMaterial color="#94a3b8" metalness={0.5} roughness={0.3} /></mesh>
      <mesh position={[0, 0.17, 0]}><sphereGeometry args={[0.018, 8, 8]} /><meshStandardMaterial color="#94a3b8" metalness={0.6} roughness={0.25} /></mesh>
    </>}
  </group>;
};
