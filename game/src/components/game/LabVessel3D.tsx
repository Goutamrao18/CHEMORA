import { useFrame } from '@react-three/fiber';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { VesselState } from '../../gameplay/gameState';
import { useGameStore } from '../../gameplay/gameState';
import { registerVesselRoot } from '../../gameplay/vesselRegistry';


/** A lightweight animated meniscus. Geometry is updated in place to avoid
 * allocating new meshes every frame; amplitude is intentionally subtle. */
const AnimatedLiquidSurface: React.FC<{
  radius: number;
  height: number;
  color: string;
  opacity: number;
  mixing: boolean;
}> = ({ radius, height, color, opacity, mixing }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const geometry = useMemo(() => new THREE.CircleGeometry(radius, 32), [radius]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;
    const position = geometry.getAttribute('position') as THREE.BufferAttribute;
    const t = clock.elapsedTime;
    const amplitude = mixing ? 0.006 : 0.002;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const r = Math.sqrt(x * x + y * y);
      position.setZ(i, Math.sin(r * 42 - t * (mixing ? 5.5 : 2.2)) * amplitude * (r / radius));
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
    mesh.position.y = height + Math.sin(t * (mixing ? 5 : 1.8)) * (mixing ? 0.003 : 0.001);
  });

  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} renderOrder={2}>
      <primitive object={geometry} attach="geometry" />
      <meshPhysicalMaterial color={color} transparent opacity={opacity} roughness={0.12} metalness={0.02} clearcoat={0.8} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
};

const BubbleEffects: React.FC<{ radius: number; height: number; color: string; active: boolean }> = ({ radius, height, color, active }) => {
  const refs = useRef<Array<THREE.Mesh | null>>([]);
  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    refs.current.forEach((bubble, i) => {
      if (!bubble) return;
      bubble.visible = active;
      if (!active) return;
      const phase = (t * (0.24 + (i % 3) * 0.06) + i / 5) % 1;
      const angle = i * 2.399;
      const radial = radius * (0.18 + (i % 3) * 0.16);
      bubble.position.set(Math.cos(angle) * radial, 0.025 + phase * Math.max(0.04, height - 0.04), Math.sin(angle) * radial);
      const size = 0.008 + (i % 3) * 0.003;
      bubble.scale.setScalar(size * (0.7 + phase * 0.5));
    });
  });
  return (
    <group>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} ref={(node) => { refs.current[i] = node; }} visible={active}>
          <sphereGeometry args={[1, 8, 8]} />
          <meshPhysicalMaterial color={color} transparent opacity={0.55} roughness={0.08} metalness={0.05} transmission={0.25} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
};

interface LabVessel3DProps {
  vessel: VesselState;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export const LabVessel3D: React.FC<LabVessel3DProps> = ({
  vessel,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  isSelected = false,
  onClick,
}) => {
  const { content, capacityMl, type } = vessel;
  const rootRef = useRef<THREE.Group>(null);
  useEffect(() => {
    registerVesselRoot(vessel.id, rootRef.current);
    return () => registerVesselRoot(vessel.id, null);
  }, [vessel.id]);
  const isStirrerOn = useGameStore((state) => state.isStirrerOn);
  const fillRatio = Math.min(1, Math.max(0, content.volumeMl / capacityMl));
  // Rendered volume eases toward the authoritative chemistry-store volume.
  // This is visual interpolation only; it never changes chemistry quantities.
  const [displayFillRatio, setDisplayFillRatio] = useState(fillRatio);
  useFrame((_state, delta) => {
    setDisplayFillRatio((current) => {
      const next = THREE.MathUtils.damp(current, fillRatio, 5.5, Math.min(delta, 0.05));
      if (Math.abs(next - fillRatio) < 0.002) return fillRatio;
      return Math.abs(next - current) > 0.003 ? next : current;
    });
  });

  return (
    <group
      ref={rootRef}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
    >
      {/* Selection Halo */}
      {isSelected && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.2, 0.24, 24]} />
          <meshBasicMaterial color="#0ea5e9" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Glass Vessel Geometry - Optimized with MeshStandardMaterial for high FPS */}
      {type.startsWith('beaker') && (
        <group>
          {/* Beaker Wall */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.44, 24, 1, true]} />
            <meshStandardMaterial
              color="#e2e8f0"
              transparent
              opacity={0.35}
              roughness={0.1}
              metalness={0.1}
              side={THREE.DoubleSide}
            />
          </mesh>
          {/* Beaker Bottom */}
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.158, 0.158, 0.02, 24]} />
            <meshStandardMaterial color="#cbd5e1" transparent opacity={0.4} roughness={0.2} />
          </mesh>
          {/* Rim */}
          <mesh position={[0, 0.44, 0]}>
            <torusGeometry args={[0.16, 0.01, 12, 24]} />
            <meshStandardMaterial color="#e2e8f0" roughness={0.2} />
          </mesh>
          {/* Volume Ticks */}
          {[0.1, 0.2, 0.3, 0.4].map((y, idx) => (
            <mesh key={idx} position={[0.161, y, 0]}>
              <boxGeometry args={[0.002, 0.008, 0.03]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          ))}
        </group>
      )}

      {type === 'flask_250' && (
        <group>
          <mesh position={[0, 0.18, 0]}>
            <coneGeometry args={[0.22, 0.36, 24, 1, true]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.35} roughness={0.1} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.44, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.2, 24, 1, true]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.35} roughness={0.1} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.01, 0]}>
            <cylinderGeometry args={[0.218, 0.218, 0.02, 24]} />
            <meshStandardMaterial color="#cbd5e1" transparent opacity={0.4} roughness={0.2} />
          </mesh>
        </group>
      )}

      {type === 'cylinder_50' && (
        <group>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 24, 1, true]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.35} roughness={0.1} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.015, 0]}>
            <cylinderGeometry args={[0.14, 0.14, 0.03, 6]} />
            <meshStandardMaterial color="#475569" roughness={0.3} />
          </mesh>
        </group>
      )}

      {type === 'vial_30' && (
        <group>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.24, 16, 1, true]} />
            <meshStandardMaterial color="#e2e8f0" transparent opacity={0.35} roughness={0.1} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.245, 0]}>
            <cylinderGeometry args={[0.065, 0.065, 0.03, 16]} />
            <meshStandardMaterial color="#0284c7" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.008, 0]}>
            <cylinderGeometry args={[0.058, 0.058, 0.016, 16]} />
            <meshStandardMaterial color="#cbd5e1" transparent opacity={0.4} />
          </mesh>
        </group>
      )}

      {/* Liquid Content */}
      {displayFillRatio > 0.02 && (
        <group position={[0, 0.01, 0]}>
          <mesh position={[0, (displayFillRatio * 0.4) / 2, 0]}>
            <cylinderGeometry
              args={[
                type === 'flask_250' ? 0.2 - displayFillRatio * 0.08 : 0.155,
                type === 'flask_250' ? 0.21 : 0.155,
                displayFillRatio * 0.4,
                24,
              ]}
            />
            <meshStandardMaterial
              color={content.color}
              transparent
              opacity={content.opacity}
              roughness={0.2}
              metalness={0.1}
            />
          </mesh>

          {/* Animated meniscus: subtle ripples become stronger while the stirrer runs. */}
          <AnimatedLiquidSurface
            radius={type === 'flask_250' ? 0.2 - displayFillRatio * 0.08 : type === 'cylinder_50' ? 0.075 : type === 'vial_30' ? 0.055 : 0.154}
            height={displayFillRatio * 0.4}
            color={content.color}
            opacity={Math.min(1, content.opacity + 0.2)}
            mixing={isStirrerOn}
          />

          {/* Gas bubbles are only shown when the chemistry model flags bubbling. */}
          <BubbleEffects
            radius={type === 'flask_250' ? 0.14 : type === 'cylinder_50' ? 0.06 : type === 'vial_30' ? 0.045 : 0.12}
            height={displayFillRatio * 0.36}
            color={content.color}
            active={content.isBubbling && displayFillRatio > 0.02}
          />

          {/* Precipitate sediment */}
          {content.isPrecipitate && (
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.154, 0.154, 0.035, 24]} />
              <meshStandardMaterial color={content.precipitateColor || '#0369a1'} roughness={0.8} />
            </mesh>
          )}

          {/* Cold Glow */}
          {content.isGlowing && (
            <pointLight
              position={[0, (displayFillRatio * 0.4) / 2, 0]}
              color={content.glowColor || '#38bdf8'}
              intensity={2.5}
              distance={3.5}
            />
          )}
        </group>
      )}
    </group>
  );
};
