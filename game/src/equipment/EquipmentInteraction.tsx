import { useFrame, useThree } from '@react-three/fiber';
import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import * as THREE from 'three';

type EquipmentPrompt = { id: string; label: string; prompt: string; position?: [number, number, number] } | null;
let activePrompt: EquipmentPrompt = null;
let latestTarget: EquipmentPrompt = null;
const listeners = new Set<() => void>();
const interactableRoots: THREE.Object3D[] = [];
export function registerInteractable(root: THREE.Object3D) {
  if (!interactableRoots.includes(root)) interactableRoots.push(root);
  return () => { const index = interactableRoots.indexOf(root); if (index >= 0) interactableRoots.splice(index, 1); };
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
const publish = (next: EquipmentPrompt) => { activePrompt = next; listeners.forEach((listener) => listener()); };
export function useEquipmentPrompt(): EquipmentPrompt { return useSyncExternalStore(subscribe, () => activePrompt, () => null); }
export function equipmentPromptHandlers(id: string, label: string, prompt = `Inspect ${label}`) {
  return {
    onClick: (event: { stopPropagation?: () => void }) => { event.stopPropagation?.(); publish({ id, label, prompt }); },
    userData: { equipmentId: id, equipmentLabel: label, equipmentPrompt: prompt },
  };
}

/** Casts from the exact screen center, then resolves the nearest equipment parent. */
export const EquipmentRaycast: React.FC = () => {
  const { camera } = useThree();
  const raycaster = useRef(new THREE.Raycaster());
  const center = useRef(new THREE.Vector2(0, 0));
  const lastId = useRef<string | null>(null);
  const lastScan = useRef(0);
  const worldPosition = useRef(new THREE.Vector3());
  const boxCenter = useRef(new THREE.Vector3());
  const boxSize = useRef(new THREE.Vector3());
  const hitPoint = useRef(new THREE.Vector3());
  const bounds = useRef(new THREE.Box3());
  useFrame(() => {
    const now = performance.now();
    if (now - lastScan.current < 100) return;
    lastScan.current = now;
    raycaster.current.setFromCamera(center.current, camera);
    raycaster.current.far = 2.5;
    let foundNode: THREE.Object3D | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    for (const root of interactableRoots) {
      let ancestor: THREE.Object3D | null = root;
      let visible = true;
      while (ancestor) { if (!ancestor.visible) { visible = false; break; } ancestor = ancestor.parent; }
      if (!visible) continue;
      root.getWorldPosition(worldPosition.current);
      const size = root.userData.equipmentSize as [number, number, number] | undefined;
      const halfY = size ? size[1] / 2 : 0.5;
      boxCenter.current.copy(worldPosition.current);
      boxCenter.current.y += halfY;
      boxSize.current.set(size?.[0] ?? 1, size?.[1] ?? 1, size?.[2] ?? 1);
      bounds.current.setFromCenterAndSize(boxCenter.current, boxSize.current);
      const point = raycaster.current.ray.intersectBox(bounds.current, hitPoint.current);
      if (!point) continue;
      const distance = camera.position.distanceTo(point);
      if (distance <= 2.5 && distance < nearestDistance) { nearestDistance = distance; foundNode = root; }
    }
    const foundId = foundNode?.userData?.equipmentId ?? null;
    if (foundId !== lastId.current) {
      lastId.current = foundId;
      if (!foundNode) { latestTarget = null; publish(null); }
      else {
        foundNode.getWorldPosition(worldPosition.current);
        latestTarget = { id: foundId, label: foundNode.userData.equipmentLabel ?? foundId, prompt: foundNode.userData.equipmentPrompt ?? `Inspect ${foundNode.userData.equipmentLabel ?? 'equipment'}`, position: [worldPosition.current.x, worldPosition.current.y, worldPosition.current.z] };
        publish(latestTarget);
      }
    }
  });
  useEffect(() => {
    const interact = () => { if (latestTarget) { publish(latestTarget); window.dispatchEvent(new CustomEvent('chemora-equipment-action', { detail: latestTarget })); } else publish(null); };
    window.addEventListener('chemora-mobile-interact', interact);
    return () => window.removeEventListener('chemora-mobile-interact', interact);
  }, []);
  return null;
};

export const EquipmentPromptHUD: React.FC = () => {
  const prompt = useEquipmentPrompt();
  return <div aria-live="polite" style={{ position: 'fixed', left: '50%', top: '50%', transform: 'translate(-50%, 22px)', zIndex: 40, pointerEvents: 'none', padding: '8px 14px', borderRadius: 8, color: '#eefaff', background: 'rgba(8,20,31,.92)', border: '1px solid rgba(91,208,235,.65)', font: '600 12px/1.35 system-ui,sans-serif', textAlign: 'center', maxWidth: '80vw', opacity: prompt ? 1 : 0 }}>
    {prompt && <><div style={{ color: '#6be3f3', fontSize: 10, letterSpacing: 1.2 }}>{prompt.id}</div>{prompt.prompt}</>}
  </div>;
};
