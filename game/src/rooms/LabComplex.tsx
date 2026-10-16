import { CuboidCollider, RigidBody } from '@react-three/rapier';
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { playDoorSound } from '../gameplay/audio';
import { useGameStore } from '../gameplay/gameState';

import { CORRIDORS, type CorridorSpec, DOOR_HEIGHT, DOOR_WIDTH, LOCKED_DOORS, ROOM_LOCK_THRESHOLDS, ROOMS, type RoomSpec, type Side, WALL_HEIGHT, WALL_THICKNESS } from '../layout';

const WALL_H = WALL_HEIGHT;
const WALL_T = WALL_THICKNESS;
const DOOR_H = DOOR_HEIGHT;
const DOOR_W = DOOR_WIDTH;

function wallSegments(length: number, openingWidth: number) {
  if (!openingWidth) return [{ offset: 0, length }];
  const side = Math.max(0, (length - openingWidth) / 2);
  return [{ offset: -(openingWidth + side) / 2, length: side }, { offset: (openingWidth + side) / 2, length: side }].filter((part) => part.length > 0.1);
}

function RoomShell({ room, tileTexture }: { room: RoomSpec; tileTexture: THREE.Texture }) {
  const completedProtocolIds = useGameStore((s) => s.completedProtocolIds);
  const lockedDoor = LOCKED_DOORS[room.id];
  const requiredProtocols = lockedDoor?.requiredProtocols ?? ROOM_LOCK_THRESHOLDS[room.id];
  const locked = requiredProtocols !== undefined && completedProtocolIds.length < requiredProtocols;
  const previousLocked = useRef(locked);
  useEffect(() => { if (previousLocked.current !== locked) playDoorSound(locked); previousLocked.current = locked; }, [locked]);
  const halfW = room.width / 2;
  const halfD = room.depth / 2;
  const wallParts = useMemo(() => {
    const parts: Array<{ key: string; x: number; z: number; sx: number; sz: number }> = [];
    (['north', 'south'] as Side[]).forEach((side) => wallSegments(room.width, room.openings?.[side] ?? 0).forEach((part, i) => parts.push({ key: `${side}-${i}`, x: part.offset, z: side === 'north' ? -halfD : halfD, sx: part.length, sz: WALL_T })));
    (['east', 'west'] as Side[]).forEach((side) => wallSegments(room.depth, room.openings?.[side] ?? 0).forEach((part, i) => parts.push({ key: `${side}-${i}`, x: side === 'west' ? -halfW : halfW, z: part.offset, sx: WALL_T, sz: part.length })));
    return parts;
  }, [room, halfD, halfW]);
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ map: tileTexture, color: new THREE.Color(room.accent).lerp(new THREE.Color('#ffffff'), 0.74), roughness: 0.42, metalness: 0.08 }), [tileTexture, room.accent]);
  const wallMaterial = useMemo(() => { const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128; const ctx = canvas.getContext('2d'); if (ctx) { ctx.fillStyle = '#dfe5e9'; ctx.fillRect(0,0,128,128); for(let i=0;i<500;i++){const v=190+((i*17)%45);ctx.fillStyle=`rgba(${v},${v},${v},0.13)`;ctx.fillRect((i*37)%128,(i*53)%128,1.5,1.5);} } const map = new THREE.CanvasTexture(canvas); map.wrapS=map.wrapT=THREE.RepeatWrapping; map.repeat.set(2,1); return new THREE.MeshStandardMaterial({ map, color: new THREE.Color(room.accent).lerp(new THREE.Color('#f0f5f8'), 0.84), roughness: 0.76, metalness: 0.025 }); }, [room.accent]);
  const signTexture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 1024; canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) { context.fillStyle = '#10202d'; context.fillRect(0, 0, canvas.width, canvas.height); context.fillStyle = room.accent; context.fillRect(0, 0, 12, canvas.height); context.fillStyle = '#f1f7fb'; context.font = 'bold 42px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillText(room.name, canvas.width / 2, canvas.height / 2, canvas.width - 32); }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, [room.name, room.accent]);
  const lockSignTexture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = '#431407'; context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#fdba74'; context.fillRect(0, 0, 10, canvas.height);
      context.fillStyle = '#fff7ed'; context.font = 'bold 34px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle';
      const required = ROOM_LOCK_THRESHOLDS[room.id] ?? 0;
      context.fillText(`LOCKED · COMPLETE ${required} PROTOCOL${required === 1 ? '' : 'S'}`, canvas.width / 2, canvas.height / 2, canvas.width - 24);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, [room.id]);
  const hasLockedDoor = lockedDoor !== undefined;
  const barrierSide: Side = lockedDoor?.side ?? 'north';
  const barrierX = barrierSide === 'west' ? -halfW : barrierSide === 'east' ? halfW : 0;
  const barrierZ = barrierSide === 'north' ? -halfD : 0;
  const barrierWidth = lockedDoor?.width ?? 3.1;
  const barrierSizeX = barrierSide === 'north' || barrierSide === 'south' ? barrierWidth : WALL_T;
  const barrierSizeZ = barrierSide === 'east' || barrierSide === 'west' ? barrierWidth : WALL_T;
  const lockSignRotationY = barrierSide === 'west' ? Math.PI / 2 : barrierSide === 'east' ? -Math.PI / 2 : 0;
  const currentRoomId = useGameStore((state) => state.currentRoomId);
  const roomVisible = currentRoomId === room.id;
  return <group visible={roomVisible} position={[room.x, 0, room.z]}>
    <mesh position={[0, -0.06, 0]} receiveShadow material={floorMaterial}><boxGeometry args={[room.width, 0.12, room.depth]} /></mesh>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[halfW, 0.08, halfD]} position={[0, -0.06, 0]} />
      {wallParts.map((p) => <React.Fragment key={p.key}>
        <CuboidCollider args={[p.sx / 2, WALL_H / 2, p.sz / 2]} position={[p.x, WALL_H / 2, p.z]} />
        <mesh position={[p.x, WALL_H / 2, p.z]} castShadow receiveShadow material={wallMaterial}><boxGeometry args={[p.sx, WALL_H, p.sz]} /></mesh>
      </React.Fragment>)}
      {locked && hasLockedDoor && <>
        <CuboidCollider args={[barrierSizeX / 2, 1.3, barrierSizeZ / 2]} position={[barrierX, 1.3, barrierZ]} />
        <mesh position={[barrierX, 1.3, barrierZ]}><boxGeometry args={[barrierSizeX, 2.6, barrierSizeZ]} /><meshStandardMaterial color="#b45309" emissive="#7c2d12" emissiveIntensity={0.2} /></mesh>
        <group position={[barrierX, 2.1, barrierZ + (barrierSide === 'north' ? 0.12 : 0)]} rotation={[0, lockSignRotationY, 0]}>
          <mesh><boxGeometry args={[2.7, 0.42, 0.07]} /><meshStandardMaterial color="#431407" /></mesh>
          <mesh position={[0, 0, 0.041]}><planeGeometry args={[2.58, 0.32]} /><meshBasicMaterial map={lockSignTexture} toneMapped={false} /></mesh>
        </group>
      </>}
      {(['north', 'south', 'east', 'west'] as Side[]).filter((side) => (room.openings?.[side] ?? 0) > 0).map((side) => {
        const width = room.openings?.[side] ?? DOOR_W;
        const vertical = side === 'east' || side === 'west';
        const x = side === 'west' ? -halfW : side === 'east' ? halfW : 0;
        const z = side === 'north' ? -halfD : side === 'south' ? halfD : 0;
        const lintelX = vertical ? WALL_T : width;
        const lintelZ = vertical ? width : WALL_T;
        return <React.Fragment key={`${side}-lintel`}>
          <mesh position={[x, (WALL_H + DOOR_H) / 2, z]} castShadow material={wallMaterial}><boxGeometry args={[lintelX, WALL_H - DOOR_H, lintelZ]} /></mesh>
          <CuboidCollider args={[lintelX / 2, (WALL_H - DOOR_H) / 2, lintelZ / 2]} position={[x, (WALL_H + DOOR_H) / 2, z]} />
          <mesh position={[x, 1.3, z]}><boxGeometry args={[vertical ? 0.08 : width, 0.05, vertical ? width : 0.08]} /><meshBasicMaterial color={room.accent} /></mesh>
        </React.Fragment>;
      })}
    </RigidBody>
    <mesh position={[0, WALL_H - 0.05, 0]}><boxGeometry args={[Math.min(room.width - 1, 5.4), 0.06, 1.1]} /><meshStandardMaterial color="#dce7ed" emissive="#9fb5c7" emissiveIntensity={0.45} roughness={0.3} /></mesh>
    <mesh position={[0, 0.008, halfD - 0.32]}><boxGeometry args={[Math.max(1, room.width - 1), 0.015, 0.06]} /><meshBasicMaterial color={room.accent} /></mesh>
    <mesh position={[0, 0.006, 0]} rotation={[-Math.PI / 2,0,0]}><planeGeometry args={[Math.min(room.width*0.72, 8), Math.min(room.depth*0.45, 4)]}/><meshBasicMaterial color={room.accent} transparent opacity={0.035} depthWrite={false}/></mesh>
    {/* The sign is mounted on the north interior wall, facing into the room. */}
    <group position={[0, 2.85, -halfD + 0.14]}>
      <mesh><boxGeometry args={[Math.min(room.width - 1, 7.4), 0.38, 0.07]} /><meshStandardMaterial color="#142838" roughness={0.55} metalness={0.2} /></mesh>
      <mesh position={[0, 0, 0.041]}><boxGeometry args={[Math.min(room.width - 1.25, 6.9), 0.22, 0.012]} /><meshBasicMaterial color={room.accent} /></mesh>
      <mesh position={[0, 0, 0.05]}><planeGeometry args={[Math.min(room.width - 1.4, 6.7), 0.18]} /><meshBasicMaterial map={signTexture} toneMapped={false} /></mesh>
    </group>

  </group>;
}

function Corridor({ corridor, tileTexture }: { corridor: CorridorSpec; tileTexture: THREE.Texture }) {
  const isHorizontal = corridor.width > corridor.depth;
  const long = Math.max(corridor.width, corridor.depth);
  const cross = Math.min(corridor.width, corridor.depth);
  const sideOffset = cross / 2 - WALL_T / 2;
  const wallMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: new THREE.Color(corridor.accent).lerp(new THREE.Color('#e8eef2'), 0.82), roughness: 0.72 }), [corridor.accent]);
  const floorMaterial = useMemo(() => new THREE.MeshStandardMaterial({ map: tileTexture, color: new THREE.Color(corridor.accent).lerp(new THREE.Color('#ffffff'), 0.78), roughness: 0.4, metalness: 0.08 }), [tileTexture, corridor.accent]);
  const wallLength = long;
  return <group position={[corridor.x, 0, corridor.z]}>
    <mesh position={[0, -0.055, 0]} receiveShadow material={floorMaterial}><boxGeometry args={[corridor.width, 0.11, corridor.depth]} /></mesh>
    <RigidBody type="fixed" colliders={false}>
      <CuboidCollider args={[corridor.width / 2, 0.07, corridor.depth / 2]} position={[0, -0.055, 0]} />
      {[ -1, 1 ].map((sign) => {
        const x = isHorizontal ? 0 : sign * sideOffset;
        const z = isHorizontal ? sign * sideOffset : 0;
        const sx = isHorizontal ? wallLength : WALL_T;
        const sz = isHorizontal ? WALL_T : wallLength;
        return <React.Fragment key={sign}>
          <mesh position={[x, WALL_H / 2, z]} castShadow receiveShadow material={wallMaterial}><boxGeometry args={[sx, WALL_H, sz]} /></mesh>
          <CuboidCollider args={[sx / 2, WALL_H / 2, sz / 2]} position={[x, WALL_H / 2, z]} />
        </React.Fragment>;
      })}
    </RigidBody>
    <mesh position={[0, WALL_H + 0.02, 0]}><boxGeometry args={[corridor.width, 0.12, corridor.depth]} /><meshStandardMaterial color="#e4edf2" roughness={0.85} /></mesh>
    <mesh position={[0, 0.01, 0]}><boxGeometry args={[isHorizontal ? corridor.width - 0.1 : 0.07, 0.012, isHorizontal ? 0.07 : corridor.depth - 0.1]} /><meshBasicMaterial color={corridor.accent} /></mesh>
    <mesh position={[0, WALL_H - 0.18, 0]}><boxGeometry args={[Math.min(corridor.width - 0.25, 2.5), 0.07, Math.min(corridor.depth - 0.25, 1.25)]} /><meshStandardMaterial color="#f8fafc" emissive="#b8e5ff" emissiveIntensity={0.45} /></mesh>

  </group>;
}

export const LabComplex: React.FC = () => {
  const tileTexture = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#b9c7ce'; ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = '#dbe3e8'; ctx.lineWidth = 3;
      for (let i = 0; i <= 256; i += 64) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 256); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(256, i); ctx.stroke(); }
      ctx.fillStyle = 'rgba(40,70,85,0.04)';
      for (let i = 0; i < 180; i++) ctx.fillRect((i * 47) % 256, (i * 83) % 256, 2, 2);
    }
    const texture = new THREE.CanvasTexture(canvas); texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.colorSpace = THREE.SRGBColorSpace; return texture;
  }, []);
  return <group>
    {ROOMS.map((room) => <RoomShell key={room.id} room={room} tileTexture={tileTexture} />)}
    {CORRIDORS.map((corridor) => <Corridor key={corridor.id} corridor={corridor} tileTexture={tileTexture} />)}
    {/* A broad fixed catch floor prevents falls if a player slips outside the detailed footprint. */}
    <RigidBody type="fixed" colliders={false}><CuboidCollider args={[35, 0.5, 28]} position={[0, -1.35, 0]} /></RigidBody>
    <mesh position={[0, -0.8, 0]}><boxGeometry args={[70, 1.4, 56]} /><meshStandardMaterial color="#101b24" roughness={0.95} /></mesh>
    {/* Room-specific key lights are mounted by App; keep only low-cost ambient fill here. */}
    <ambientLight intensity={0.42} color="#dbeafe" />

  </group>;
};
