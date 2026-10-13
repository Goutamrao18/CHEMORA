import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../gameplay/gameState';
import { getVesselPourPoints } from '../../gameplay/vesselRegistry';

/**
 * Visual-only pouring effect. The chemistry store remains authoritative for quantities.
 * Optional event.durationMs controls animation length; defaults to 900ms.
 */
export const LiquidPourStream: React.FC = () => {
  const event = useGameStore((s) => s.pourVisualEvent);
  const vessels = useGameStore((s) => s.vessels);
  const groupRef = useRef<THREE.Group>(null);
  const streamRef = useRef<THREE.Mesh>(null);
  const impactRef = useRef<THREE.Mesh>(null);
  const lastEventId = useRef<number | null>(null);
  const elapsed = useRef(0);
  const curve = useRef(new THREE.QuadraticBezierCurve3(new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()));
  const dots = useMemo(() => Array.from({ length: 6 }, (_, i) => ({ t: (i + 1) / 7, phase: i * 1.6 })), []);
  const dropletRefs = useRef<Array<THREE.Mesh | null>>([]);
  const tiltRef = useRef<{ root: THREE.Group; rotation: THREE.Euler } | null>(null);
  const [active, setActive] = useState(false);
  const [color, setColor] = useState('#38bdf8');

  const restoreTilt = () => {
    if (tiltRef.current) {
      tiltRef.current.root.rotation.copy(tiltRef.current.rotation);
      tiltRef.current = null;
    }
  };

  useEffect(() => {
    if (!event || event.id === lastEventId.current) return;
    restoreTilt();
    lastEventId.current = event.id;
    elapsed.current = 0;
    setColor(event.color || '#38bdf8');
    setActive(true);
  }, [event]);

  useEffect(() => () => {
    restoreTilt();
    streamRef.current?.geometry.dispose();
  }, []);

  useFrame((_state, delta) => {
    if (!active || !event || !groupRef.current || !streamRef.current) return;
    elapsed.current += Math.min(delta, 0.05);
    const t = elapsed.current;
    const duration = Math.max(0.35, Math.min(3, (event.durationMs ?? 900) / 1000));
    const progress = Math.min(1, t / duration);
    const sourceState = vessels[event.sourceId];
    const targetState = vessels[event.targetId];
    const a = getVesselPourPoints(event.sourceId, sourceState ? sourceState.content.volumeMl / sourceState.capacityMl : 0.5);
    const b = getVesselPourPoints(event.targetId, targetState ? targetState.content.volumeMl / targetState.capacityMl : 0.5);

    if (!a || !b) {
      groupRef.current.visible = false;
      restoreTilt();
      if (t > 0.2) setActive(false);
      return;
    }

    // Tilt the source vessel around its base during the active transfer, then restore it.
    if (!tiltRef.current) tiltRef.current = { root: a.root, rotation: a.root.rotation.clone() };
    const original = tiltRef.current.rotation;
    const targetInSourceLocal = a.root.worldToLocal(b.liquidSurface.clone());
    const tiltDirection = Math.sign(targetInSourceLocal.x || 1);
    const tiltAmount = Math.sin(Math.PI * Math.min(1, progress / 0.9)) * 0.24;
    a.root.rotation.set(original.x, original.y, original.z + tiltDirection * tiltAmount, original.order);
    a.root.updateWorldMatrix(true, false);

    // Recompute mouth after tilt so the stream follows the animated source rim.
    const updatedA = getVesselPourPoints(event.sourceId, sourceState ? sourceState.content.volumeMl / sourceState.capacityMl : 0.5);
    if (!updatedA) return;
    curve.current.v0.copy(updatedA.mouth);
    curve.current.v2.copy(b.liquidSurface);
    curve.current.v1.copy(updatedA.mouth).lerp(b.liquidSurface, 0.5);
    curve.current.v1.y -= Math.min(0.18, updatedA.mouth.distanceTo(b.liquidSurface) * 0.08);

    const nextGeometry = new THREE.TubeGeometry(curve.current, 20, 0.006 + Math.min(event.volumeMl / 3000, 0.008), 6, false);
    const oldGeometry = streamRef.current.geometry;
    streamRef.current.geometry = nextGeometry;
    oldGeometry.dispose();

    const fadeIn = Math.min(1, t / 0.09);
    const fadeOut = Math.min(1, Math.max(0, (duration - t) / 0.18));
    const fade = fadeIn * fadeOut;
    (streamRef.current.material as THREE.MeshBasicMaterial).opacity = fade * 0.78;
    groupRef.current.visible = t < duration;

    if (impactRef.current) {
      impactRef.current.position.copy(b.liquidSurface);
      impactRef.current.position.y += 0.006;
      impactRef.current.scale.setScalar(0.55 + Math.min(progress * 1.25, 1.25));
      (impactRef.current.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.4 * (1 - progress));
    }

    dots.forEach((dot, i) => {
      const mesh = dropletRefs.current[i];
      if (!mesh) return;
      const u = Math.min(0.98, Math.max(0.02, dot.t + Math.sin(t * 18 + dot.phase) * 0.018));
      mesh.position.copy(curve.current.getPoint(u));
      mesh.visible = t < duration * 0.92 && i < Math.min(5, Math.ceil(event.volumeMl / 20));
    });

    if (t >= duration) {
      restoreTilt();
      setActive(false);
    }
  });

  if (!active || !event) return null;
  return (
    <group ref={groupRef}>
      <mesh ref={streamRef}>
        <tubeGeometry args={[curve.current, 20, 0.008, 6, false]} />
        <meshBasicMaterial color={color} transparent opacity={0.78} depthWrite={false} toneMapped={false} />
      </mesh>
      {dots.map((_dot, i) => (
        <mesh key={i} ref={(node) => { dropletRefs.current[i] = node; }}>
          <sphereGeometry args={[0.012 + (i % 2) * 0.005, 7, 7]} />
          <meshBasicMaterial color={color} transparent opacity={0.62} depthWrite={false} />
        </mesh>
      ))}
      <mesh ref={impactRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.04, 0.1, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
