import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useRapier } from '@react-three/rapier';
import * as THREE from 'three';
import { useGameStore, type LabStationId } from '../../gameplay/gameState';
import { playGlasswareClick, playFootstep } from '../../gameplay/audio';
import { detectRoomId, getFootstepFloor } from '../../layout';

export const PlayerController: React.FC = () => {
  const { camera, gl } = useThree();
  const { world, rapier } = useRapier();
  const characterCollider = useRef<ReturnType<typeof world.createCollider> | null>(null);
  const characterController = useRef<ReturnType<typeof world.createCharacterController> | null>(null);
  const activeStation = useGameStore((s) => s.activeStation);
  const isSettingsOpen = useGameStore((s) => s.isSettingsOpen);
  const setActiveStation = useGameStore((s) => s.setActiveStation);
  const mouseSensitivity = useGameStore((s) => s.mouseSensitivity);
  const setCurrentRoomId = useGameStore((s) => s.setCurrentRoomId);
  const lastRoomId = useRef('main');

  // Player position and velocity
  const playerPos = useRef(new THREE.Vector3(0, 1.65, 0));
  const velocity = useRef(new THREE.Vector3());
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const targetEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'));
  const moveVector = useRef(new THREE.Vector3());
  const turnAxis = useRef(new THREE.Vector3(0, 1, 0));
  const desiredMovement = useRef(new THREE.Vector3());
  const currentQuaternion = useRef(new THREE.Quaternion());
  const targetQuaternion = useRef(new THREE.Quaternion());
  const nextTranslation = useRef({ x: 0, y: 1.65, z: 0 });

  // Drag interaction state (guarantees mouse never gets stuck!)
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Keyboard input states
  const keys = useRef<{ [key: string]: boolean }>({});
  const mobileMove = useRef({ x: 0, y: 0 });
  const mobileRun = useRef(false);
  const lastStepAt = useRef(0);

  // Rapier character controller replaces the former hand-written AABB collision.
  useEffect(() => {
    const collider = world.createCollider(rapier.ColliderDesc.capsule(0.58, 0.28).setTranslation(0, 1.65, 0));
    const controller = world.createCharacterController(0.04);
    controller.setApplyImpulsesToDynamicBodies(false);
    controller.setSlideEnabled(true);
    characterCollider.current = collider;
    characterController.current = controller;
    return () => {
      world.removeCharacterController(controller);
      world.removeCollider(collider, true);
      characterCollider.current = null;
      characterController.current = null;
    };
  }, [world, rapier]);

  // Station camera target presets
  const stationCamPositions: Record<NonNullable<LabStationId>, { pos: THREE.Vector3; lookAt: THREE.Vector3 }> = {
    dispensing: {
      pos: new THREE.Vector3(-3.2, 1.4, 0),
      lookAt: new THREE.Vector3(-5.2, 1.1, 0),
    },
    measurement: {
      pos: new THREE.Vector3(0, 1.4, -3.2),
      lookAt: new THREE.Vector3(0, 1.1, -5.2),
    },
    workbench: {
      pos: new THREE.Vector3(3.2, 1.4, 0),
      lookAt: new THREE.Vector3(5.2, 1.1, 0),
    },
    analysis: {
      pos: new THREE.Vector3(0, 1.4, 3.2),
      lookAt: new THREE.Vector3(0, 1.1, 5.2),
    },
  };

  useEffect(() => {
    lastRoomId.current = 'main';
    setCurrentRoomId('main');
    const dom = gl.domElement;

    const onKeyDown = (e: KeyboardEvent) => {
      // Avoid intercepting when user might type in inputs
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;

      keys.current[e.code] = true;

      // L key to toggle pointer lock
      if (e.code === 'KeyL' && !activeStation) {
        if (document.pointerLockElement === dom) {
          document.exitPointerLock?.();
        } else {
          dom.requestPointerLock?.();
        }
      }

      // E interacts with the closest station only when the player is nearby.
      // Keep this separate from movement/turning so E never rotates the camera.
      if (e.code === 'KeyE' && !e.repeat) {
        if (activeStation) {
          setActiveStation(null);
        } else {
          const px = playerPos.current.x;
          const pz = playerPos.current.z;
          const stations: Array<{ id: NonNullable<LabStationId>; x: number; z: number }> = [
            { id: 'dispensing', x: -5.2, z: 0 },
            { id: 'measurement', x: 0, z: -5.2 },
            { id: 'workbench', x: 5.2, z: 0 },
            { id: 'analysis', x: 0, z: 5.2 },
          ];
          const nearest = stations
            .map((station) => ({ ...station, distance: Math.hypot(px - station.x, pz - station.z) }))
            .sort((a, b) => a.distance - b.distance)[0];
          if (nearest && nearest.distance <= 3.15) {
            setActiveStation(nearest.id);
            playGlasswareClick();
          }
        }
        window.dispatchEvent(new Event('chemora-mobile-interact'));
      }

      if (e.code === 'Escape' && activeStation) {
        setActiveStation(null);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      keys.current[e.code] = false;
    };

    const onMobileMove = (event: Event) => {
      const detail = (event as CustomEvent<{ x: number; y: number }>).detail;
      if (detail) mobileMove.current = { x: detail.x, y: detail.y };
    };
    const onMobileRun = (event: Event) => { mobileRun.current = Boolean((event as CustomEvent<boolean>).detail); };
    const onMobileLook = (event: Event) => {
      if (activeStation) return;
      const detail = (event as CustomEvent<{ dx: number; dy: number }>).detail;
      if (!detail) return;
      const sens = 0.0030 * mouseSensitivity;
      targetEuler.current.y -= detail.dx * sens;
      targetEuler.current.x -= detail.dy * sens;
      targetEuler.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetEuler.current.x));
    };
    const onMobileInteract = () => {
      if (activeStation) { setActiveStation(null); return; }
      const px = playerPos.current.x; const pz = playerPos.current.z;
      const stations: Array<{ id: NonNullable<LabStationId>; x: number; z: number }> = [
        { id: 'dispensing', x: -5.2, z: 0 }, { id: 'measurement', x: 0, z: -5.2 },
        { id: 'workbench', x: 5.2, z: 0 }, { id: 'analysis', x: 0, z: 5.2 },
      ];
      const nearest = stations.map((station) => ({ ...station, distance: Math.hypot(px - station.x, pz - station.z) })).sort((a, b) => a.distance - b.distance)[0];
      if (nearest && nearest.distance <= 3.6) { setActiveStation(nearest.id); playGlasswareClick(); }
    };

    // Pointer down starts drag rotation or pointer lock
    const onPointerDown = (e: PointerEvent) => {
      if (activeStation) return;
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const onPointerUp = () => {
      isDragging.current = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (activeStation) return;

      const isLocked = document.pointerLockElement === dom;
      const sens = 0.0022 * mouseSensitivity;

      if (isLocked) {
        targetEuler.current.y -= e.movementX * sens;
        targetEuler.current.x -= e.movementY * sens;
      } else if (isDragging.current) {
        const dx = e.clientX - lastMousePos.current.x;
        const dy = e.clientY - lastMousePos.current.y;
        lastMousePos.current = { x: e.clientX, y: e.clientY };

        targetEuler.current.y -= dx * sens * 1.2;
        targetEuler.current.x -= dy * sens * 1.2;
      }

      // Clamp vertical pitch to prevent flipping
      targetEuler.current.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, targetEuler.current.x));
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('chemora-mobile-move', onMobileMove);
    window.addEventListener('chemora-mobile-look', onMobileLook);
    window.addEventListener('chemora-mobile-run', onMobileRun);
    window.addEventListener('chemora-mobile-interact', onMobileInteract);
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointermove', onPointerMove);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('chemora-mobile-move', onMobileMove);
      window.removeEventListener('chemora-mobile-look', onMobileLook);
      window.removeEventListener('chemora-mobile-run', onMobileRun);
      window.removeEventListener('chemora-mobile-interact', onMobileInteract);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointermove', onPointerMove);
    };
  }, [gl, activeStation, setActiveStation, mouseSensitivity, setCurrentRoomId]);

  useFrame((_, delta) => {
    if (isSettingsOpen) return;
    // If focused on a station, smoothly interpolate camera to station view
    if (activeStation) {
      const preset = stationCamPositions[activeStation];
      if (preset) {
        camera.position.lerp(preset.pos, Math.min(1, delta * 6));
        currentQuaternion.current.copy(camera.quaternion);
        camera.lookAt(preset.lookAt);
        targetQuaternion.current.copy(camera.quaternion);
        camera.quaternion.copy(currentQuaternion.current);
        camera.quaternion.slerp(targetQuaternion.current, Math.min(1, delta * 6));
      }
      return;
    }

    // Smooth keyboard turning via Left/Right arrows or Q/E
    const turnSpeed = 2.0 * mouseSensitivity;
    if (keys.current['ArrowLeft'] || keys.current['KeyQ']) {
      targetEuler.current.y += turnSpeed * delta;
    }
    if (keys.current['ArrowRight']) {
      targetEuler.current.y -= turnSpeed * delta;
    }

    // Smooth rotation lerp to eliminate jitter
    euler.current.y = THREE.MathUtils.lerp(euler.current.y, targetEuler.current.y, Math.min(1, delta * 25));
    euler.current.x = THREE.MathUtils.lerp(euler.current.x, targetEuler.current.x, Math.min(1, delta * 25));
    camera.quaternion.setFromEuler(euler.current);

    // First-person movement is resolved by Rapier's capsule character controller.
    const speed = (keys.current['ShiftLeft'] || keys.current['ShiftRight'] || mobileRun.current) ? 5.5 : 3.2;
    const move = moveVector.current.set(0, 0, 0);
    if (keys.current['KeyW']) move.z -= 1;
    if (keys.current['KeyS']) move.z += 1;
    if (keys.current['KeyA']) move.x -= 1;
    if (keys.current['KeyD']) move.x += 1;
    move.x += mobileMove.current.x;
    move.z += mobileMove.current.y;
    if (move.lengthSq() > 0) {
      if (performance.now() - lastStepAt.current > (mobileRun.current || keys.current['ShiftLeft'] ? 330 : 470)) { playFootstep(getFootstepFloor(detectRoomId(playerPos.current.x, playerPos.current.z))); lastStepAt.current = performance.now(); }
      move.normalize();
      move.applyAxisAngle(turnAxis.current, euler.current.y);
      velocity.current.x = move.x * speed;
      velocity.current.z = move.z * speed;
    } else {
      velocity.current.x *= Math.max(0, 1 - delta * 12);
      velocity.current.z *= Math.max(0, 1 - delta * 12);
    }

    const collider = characterCollider.current;
    const controller = characterController.current;
    if (collider && controller) {
      const desired = desiredMovement.current.set(velocity.current.x * delta, 0, velocity.current.z * delta);
      controller.computeColliderMovement(collider, desired);
      const corrected = controller.computedMovement();
      const current = collider.translation();
      const next = nextTranslation.current;
      next.x = current.x + corrected.x; next.y = Math.max(1.2, current.y + corrected.y); next.z = current.z + corrected.z;
      collider.setTranslation(next, true);
      playerPos.current.set(next.x, 1.65, next.z);
    } else {
      playerPos.current.x += velocity.current.x * delta;
      playerPos.current.z += velocity.current.z * delta;
    }
    camera.position.copy(playerPos.current);
    const nextRoomId = detectRoomId(playerPos.current.x, playerPos.current.z);
    if (nextRoomId !== lastRoomId.current) { lastRoomId.current = nextRoomId; setCurrentRoomId(nextRoomId); }
  });

  return null;
};
