import React, { Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { useGameStore } from './gameplay/gameState';
import { LabRoom } from './components/game/LabRoom';
import { Stations3D } from './components/game/Stations3D';
import { PlayerController } from './components/game/PlayerController';
import { HandsView3D } from './components/game/HandsView3D';
import { LiquidPourStream } from './components/game/LiquidPourStream';
import { MainHUD } from './components/game/MainHUD';
import { StationHUD } from './components/game/StationHUD';
import { ResearchJournal } from './components/game/ResearchJournal';
import { MainMenu } from './components/game/MainMenu';
import { ChemicalLabLibrary } from './components/game/ChemicalLabLibrary';
import { ReactionAnimation } from './components/game/ReactionAnimation';
import { MobileControls } from './components/game/MobileControls';
import { EquipmentComplex } from './equipment/EquipmentComplex';
import { EquipmentPromptHUD, EquipmentRaycast } from './equipment/EquipmentInteraction';
import { GraphicsPipeline } from './graphics/GraphicsPipeline';
import { GameplayHUD } from './gameplay/GameplayHUD';
import { EquipmentCarryView3D } from './equipment/EquipmentCarryView3D';
import { initAudio, setAudioMuted, setAudioVolume } from './gameplay/audio';
import { TutorialGuide } from './gameplay/TutorialGuide';
import { detectQuality, qualityDpr, setGraphicsSettings, useGraphicsSettings } from './graphics/quality';
import { detectRoomId, ROOM_BY_ID, ROOM_ADJACENCY } from './layout';

const LoadingFallback: React.FC = () => {
  return (
    <mesh position={[0, 1.5, -2]}>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#0ea5e9" wireframe />
    </mesh>
  );
};

export default function App() {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const setJournalOpen = useGameStore((s) => s.setJournalOpen);
  const isJournalOpen = useGameStore((s) => s.isJournalOpen);
  const setActiveStation = useGameStore((s) => s.setActiveStation);
  const graphics = useGraphicsSettings();
  const audioMuted = useGameStore((s) => s.audioMuted);
  const audioVolume = useGameStore((s) => s.audioVolume);


  useEffect(() => { setAudioMuted(audioMuted); setAudioVolume(audioVolume); }, [audioMuted, audioVolume]);

  // Audio context is only created/resumed after an explicit user gesture.
  useEffect(() => {
    const unlockAudio = () => { void initAudio().then(() => { setAudioMuted(useGameStore.getState().audioMuted); setAudioVolume(useGameStore.getState().audioVolume); }); };
    window.addEventListener('pointerdown', unlockAudio, { once: true });
    window.addEventListener('keydown', unlockAudio, { once: true });
    return () => { window.removeEventListener('pointerdown', unlockAudio); window.removeEventListener('keydown', unlockAudio); };
  }, []);

  // Adapt render resolution to device capability; lower DPR saves GPU time on phones.
  useEffect(() => {
    let cancelled = false;
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    void detectQuality().then((preset) => { if (!cancelled) { setGraphicsSettings({ quality: preset, postprocessing: !coarsePointer && preset === 'High' }); } });

    // Orientation lock is supported only in some browsers and usually after a user gesture.
    const tryLandscape = () => {
      const orientation = screen.orientation as ScreenOrientation & { lock?: (value: string) => Promise<void> };
      orientation?.lock?.('landscape').catch(() => undefined);
    };
    window.addEventListener('pointerdown', tryLandscape, { once: true });
    return () => { cancelled = true; window.removeEventListener('pointerdown', tryLandscape); };
  }, []);

  // Global hotkeys (TAB for journal, 1-4 for fast station travel, ESC for return)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasStartedGame) return;

      if (e.code === 'Tab') {
        e.preventDefault();
        setJournalOpen(!isJournalOpen);
      } else if (e.code === 'Digit1') {
        setActiveStation('dispensing');
      } else if (e.code === 'Digit2') {
        setActiveStation('measurement');
      } else if (e.code === 'Digit3') {
        setActiveStation('workbench');
      } else if (e.code === 'Digit4') {
        setActiveStation('analysis');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStartedGame, isJournalOpen, setJournalOpen, setActiveStation]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#0b0e12] select-none">
      {/* 2D HUD Overlays outside Canvas */}
      <MainMenu />
      <MainHUD />
      <StationHUD />
      <ResearchJournal />
      <ChemicalLabLibrary />
      <ReactionAnimation />
      <MobileControls />
      <EquipmentPromptHUD />
      {import.meta.env.DEV && graphics.showStats && <div id="chemora-render-stats" style={{position:'fixed',right:12,top:52,zIndex:45,background:'rgba(8,20,31,.9)',color:'#dffaff',padding:'6px 9px',borderRadius:6,font:'11px monospace'}}>Measuring…</div>}
      <GameplayHUD />
      <TutorialGuide />

      {/* High-Performance 3D WebGL Canvas */}
      <Canvas
        dpr={qualityDpr[graphics.quality]}
        shadows={graphics.quality === 'High'}
        camera={{ fov: 70, near: 0.1, far: 100, position: [0, 1.65, 0] }}
        gl={{
          antialias: graphics.quality !== 'Low',
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
      >
        <Physics gravity={[0, -9.81, 0]} timeStep={1 / 60}>
        {/* Optimized Lighting setup without heavy shadow map loops */}
        <ambientLight intensity={graphics.quality === 'Low' ? 0.38 : 0.58} color="#e0f2fe" />
        <directionalLight position={[1, 8, 3]} intensity={graphics.quality === 'Low' ? 0.62 : 1.1} color="#ffffff" castShadow={graphics.quality === 'High'} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
        <RoomLighting quality={graphics.quality} />

        <Suspense fallback={<LoadingFallback />}>
          <LabRoom />
          <Stations3D />
          <EquipmentComplex />
          <EquipmentRaycast />
          <EquipmentCarryView3D />
          <RenderStatsOverlay enabled={import.meta.env.DEV && graphics.showStats} />
          <GraphicsPipeline />
          <PlayerController />
          <HandsView3D />
          <LiquidPourStream />
        </Suspense>
        </Physics>
      </Canvas>
    </div>
  );
}

const RenderStatsOverlay: React.FC<{ enabled: boolean }> = ({ enabled }) => {
  const { gl, camera } = useThree();
  const frames = React.useRef(0);
  const last = React.useRef(performance.now());

  useFrame(() => { frames.current += 1; });
  React.useEffect(() => {
    if (!enabled) return;
    const id = window.setInterval(() => {
      const now = performance.now();
      const fps = Math.round(frames.current * 1000 / Math.max(1, now - last.current)); const calls = gl.info.render.calls; const el = document.getElementById('chemora-render-stats');
      const p = camera.position; const room = ROOM_BY_ID[detectRoomId(p.x, p.z)].name;
      const held = useGameStore.getState().heldEquipmentId ?? 'none';
      if (el) el.textContent = `DEV · ${room} · Held: ${held} · FPS ${fps} · Draw calls ${calls}`;
      frames.current = 0; last.current = now;
    }, 500);
    return () => window.clearInterval(id);
  }, [enabled, gl, camera]);
  return null;
};

const RoomLighting: React.FC<{ quality: 'Low' | 'Medium' | 'High' }> = ({ quality }) => {
  const currentRoomId = useGameStore((state) => state.currentRoomId);
  const neighborId = ROOM_ADJACENCY[currentRoomId];
  const current = ROOM_BY_ID[currentRoomId];
  const neighbor = neighborId ? ROOM_BY_ID[neighborId] : null;
  const intensity = quality === 'Low' ? 0.8 : quality === 'Medium' ? 1.35 : 1.8;
  return <group>
    <pointLight position={[current.x, 3.2, current.z]} intensity={intensity} distance={quality === 'Low' ? 13 : 18} color={current.accent} />
    {neighbor && <pointLight position={[neighbor.x, 3.2, neighbor.z]} intensity={intensity * 0.55} distance={quality === 'Low' ? 9 : 13} color={neighbor.accent} />}
  </group>;
};
