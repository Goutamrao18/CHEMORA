import React, { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../gameplay/gameState';
import { LabVessel3D } from './LabVessel3D';

export const HandsView3D: React.FC = () => {
  const { camera } = useThree();
  const heldVesselId = useGameStore((s) => s.heldVesselId);
  const vessels = useGameStore((s) => s.vessels);
  const activeStation = useGameStore((s) => s.activeStation);
  const groupRef = useRef<THREE.Group>(null);

  const heldVessel = heldVesselId ? vessels[heldVesselId] : null;

  useFrame(() => {
    if (!groupRef.current) return;
    if (!heldVessel || activeStation) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;
    // Position lower right in front of camera
    const offset = new THREE.Vector3(0.28, -0.22, -0.55);
    offset.applyQuaternion(camera.quaternion);
    groupRef.current.position.copy(camera.position).add(offset);
    groupRef.current.quaternion.copy(camera.quaternion);
  });

  if (!heldVessel) return null;

  return (
    <group ref={groupRef}>
      <LabVessel3D vessel={heldVessel} scale={0.7} />
    </group>
  );
};
