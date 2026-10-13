import * as THREE from 'three';

/** Runtime-only registry of rendered vessel roots. It does not own chemistry state. */
const vesselRoots = new Map<string, THREE.Group>();

export function registerVesselRoot(id: string, root: THREE.Group | null): void {
  if (!id) return;
  if (root) vesselRoots.set(id, root);
  else vesselRoots.delete(id);
}

export function getVesselPourPoints(
  id: string,
  fillRatio: number,
): { mouth: THREE.Vector3; liquidSurface: THREE.Vector3; root: THREE.Group } | null {
  const root = vesselRoots.get(id);
  if (!root) return null;

  root.updateWorldMatrix(true, false);
  // Vessel models are authored with the base at local y=0 and rim at y≈0.44.
  // Use world transforms so station movement/rotation/scale are respected.
  const mouth = root.localToWorld(new THREE.Vector3(0, 0.44, 0));
  const liquidSurface = root.localToWorld(new THREE.Vector3(0, 0.02 + Math.max(0.02, Math.min(1, fillRatio)) * 0.4, 0));
  return { mouth, liquidSurface, root };
}
