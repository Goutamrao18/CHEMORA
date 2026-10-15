import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  REAGENTS_CATALOG,
  PROTOCOLS,
  FLAME_ELEMENTS,
  ChemicalReagent,
  ReactionProtocol,
  FlameElement
} from '../data/chemistrySimData';
import { labAudio } from '../utils/labAudio';
import {
  Flame,
  Droplet,
  RotateCcw,
  Sparkles,
  Thermometer,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Eye,
  Maximize2,
  Minimize2,
  BookOpen,
  Zap,
  Activity,
  CheckCircle2,
  Camera,
  Layers,
  Scale,
  Compass,
  Footprints,
  Lightbulb,
  Radio,
  ArrowUp,
  Move,
  Info,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddedReagentEntry {
  reagentId: string;
  amount: number;
  addedAt: number;
}

export type LabStationType = 'synthesis' | 'spectroscopy' | 'cryovault' | 'mainframe' | 'decon';

interface LabStationDef {
  id: LabStationType;
  name: string;
  sector: string;
  position: THREE.Vector3;
  cameraPos: THREE.Vector3;
  lookAt: THREE.Vector3;
  accentColor: string;
  description: string;
}

const LAB_STATIONS: Record<LabStationType, LabStationDef> = {
  synthesis: {
    id: 'synthesis',
    name: 'Wet Synthesis Island',
    sector: 'SECTOR 1 · SYNTHESIS HUB',
    position: new THREE.Vector3(0, 0, 0),
    cameraPos: new THREE.Vector3(0, 1.8, 2.3),
    lookAt: new THREE.Vector3(0, 1.1, 0),
    accentColor: '#00f0ff',
    description: 'Stoichiometric reaction mixing, thermal agitation, and volumetric synthesis.',
  },
  spectroscopy: {
    id: 'spectroscopy',
    name: 'Flame Spectroscopy & Balance Bay',
    sector: 'SECTOR 2 · SPECTROSCOPY BAY',
    position: new THREE.Vector3(-8.5, 0, 0),
    cameraPos: new THREE.Vector3(-7.2, 1.8, 0.4),
    lookAt: new THREE.Vector3(-8.5, 1.1, 0),
    accentColor: '#10b981',
    description: 'High-precision flame emission tests, spectral lines, and analytical mass measurements.',
  },
  cryovault: {
    id: 'cryovault',
    name: 'Cryogenic & Hazard Containment',
    sector: 'SECTOR 3 · CRYO VAULT',
    position: new THREE.Vector3(0, 0, 8.5),
    cameraPos: new THREE.Vector3(0.4, 1.8, 7.2),
    lookAt: new THREE.Vector3(0, 1.2, 8.5),
    accentColor: '#a855f7',
    description: 'Liquid nitrogen cryo-dewar, pressurized tanks, and reinforced chemical blast locker.',
  },
  mainframe: {
    id: 'mainframe',
    name: 'Research Mainframe & Archives',
    sector: 'SECTOR 4 · MAINFRAME ARCHIVE',
    position: new THREE.Vector3(8.5, 0, 0),
    cameraPos: new THREE.Vector3(7.2, 1.8, -0.3),
    lookAt: new THREE.Vector3(8.5, 1.3, 0),
    accentColor: '#f59e0b',
    description: 'Periodic Table analysis, reaction mechanism database, and synthesis protocols.',
  },
  decon: {
    id: 'decon',
    name: 'Airlock & Observation Deck',
    sector: 'SECTOR 5 · OBSERVATION DECK',
    position: new THREE.Vector3(0, 0, -8.5),
    cameraPos: new THREE.Vector3(0, 1.9, -7.0),
    lookAt: new THREE.Vector3(0, 1.4, -9.5),
    accentColor: '#3b82f6',
    description: 'Emergency decontamination station, airlock portal, and panoramic cosmic courtyard view.',
  },
};

export const VirtualLabView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sound toggle
  const [isMuted, setIsMuted] = useState(false);

  // Fullscreen / Cinema mode
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Active Station Interaction Mode (null = Free 3D Walk)
  const [activeStation, setActiveStation] = useState<LabStationType | null>(null);
  const [nearestStation, setNearestStation] = useState<LabStationDef | null>(null);

  // Camera perspective: First-Person vs Third-Person
  const [cameraMode, setCameraMode] = useState<'first' | 'third'>('first');

  // Flashlight / UV Blacklight state
  const [flashlightOn, setFlashlightOn] = useState(false);

  // Minimap / Radar open
  const [showRadar, setShowRadar] = useState(true);

  // Active dock tab & drawer collapse for hands-on bench mode
  const [dockTab, setDockTab] = useState<'reagents' | 'thermal' | 'flame' | 'protocols'>('reagents');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [dispenseAmount, setDispenseAmount] = useState<number>(20);

  // Sprint state for HUD
  const [isSprinting, setIsSprinting] = useState(false);
  const [stamina, setStamina] = useState(100);

  // Laboratory reaction state
  const [addedReagents, setAddedReagents] = useState<AddedReagentEntry[]>([]);
  const [vesselVolume, setVesselVolume] = useState<number>(0);
  const [vesselMass, setVesselMass] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(22);
  const [isHeating, setIsHeating] = useState(false);
  const [stirrerRPM, setStirrerRPM] = useState<number>(0);
  const [discoveredProtocols, setDiscoveredProtocols] = useState<string[]>([]);
  const [currentDiscoveredNotice, setCurrentDiscoveredNotice] = useState<ReactionProtocol | null>(null);

  // Flame test station state
  const [selectedFlameElement, setSelectedFlameElement] = useState<FlameElement | null>(null);
  const [isFlameRodInBurner, setIsFlameRodInBurner] = useState(false);

  // Action toasts & protocol inspector
  const [actionToast, setActionToast] = useState<{ id: string; text: string; sub?: string; color?: string } | null>(null);
  const [inspectingProtocol, setInspectingProtocol] = useState<ReactionProtocol | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Observation log
  const [logs, setLogs] = useState<string[]>([
    'CHEMORA Open World 3D Chemistry Research Lab initialized.',
    'WASD or Left Joystick to walk. Space to jump. Shift to sprint.',
    'Approach any of the 5 research stations and press [E] to engage.',
  ]);

  // Touch controls state (for mobile joystick)
  const [touchStick, setTouchStick] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStickId = useRef<number | null>(null);
  const touchLookId = useRef<number | null>(null);
  const touchLookPrev = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Three.js mutable state ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    // Player exploration controller
    playerPos: THREE.Vector3;
    playerVelocity: THREE.Vector3;
    playerYaw: number;
    playerPitch: number;
    isGrounded: boolean;
    headBobTimer: number;
    isSprintingRef: boolean;
    // Keys pressed
    keys: Record<string, boolean>;
    // Flashlight & lights
    flashlight: THREE.SpotLight;
    flashlightTarget: THREE.Object3D;
    // Handheld item in FPS view
    fpsHandGroup: THREE.Group;
    fpsFlaskLiquid: THREE.Mesh;
    fpsFlaskLiquidMat: THREE.MeshPhysicalMaterial;
    // 3rd person character model
    characterGroup: THREE.Group;
    charLeftLeg: THREE.Mesh;
    charRightLeg: THREE.Mesh;
    charLeftArm: THREE.Mesh;
    charRightArm: THREE.Mesh;
    // Synthesis apparatus
    benchFlaskLiquid: THREE.Mesh;
    benchFlaskLiquidMat: THREE.MeshPhysicalMaterial;
    benchBubbles: THREE.Points;
    benchGlowLight: THREE.PointLight;
    benchBunsenInner: THREE.Mesh;
    benchBunsenOuter: THREE.Mesh;
    benchFlameLight: THREE.PointLight;
    benchStirBar: THREE.Mesh;
    benchSampleRod: THREE.Group;
    // Cryo particles
    cryoParticles: THREE.Points;
    // Flame station apparatus
    specBurnerFlame: THREE.Mesh;
    specFlameLight: THREE.PointLight;
    // Station glowing beacons & holograms
    beacons: Record<LabStationType, THREE.Mesh>;
    // Animation frame & disposal
    animId: number;
    lastTime: number;
    stepSoundTimer: number;
  } | null>(null);

  // Toggle sound
  const handleToggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    labAudio.setMuted(next);
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Determine current chemical reaction status
  const reactionStatus = useMemo(() => {
    const reagentTotals: Record<string, number> = {};
    for (const entry of addedReagents) {
      reagentTotals[entry.reagentId] = (reagentTotals[entry.reagentId] || 0) + entry.amount;
    }

    let activeProtocol: ReactionProtocol | null = null;
    for (const protocol of PROTOCOLS) {
      let matches = true;
      for (const [rId, spec] of Object.entries(protocol.requiredReagents)) {
        const amt = reagentTotals[rId] || 0;
        if (amt < spec.min) {
          matches = false;
          break;
        }
      }
      if (matches) {
        if (protocol.requiredTemp && temperature < protocol.requiredTemp.min) {
          matches = false;
        }
      }
      if (matches) {
        activeProtocol = protocol;
        break;
      }
    }

    let liquidColor = '#38bdf8';
    let liquidOpacity = 0.25;
    let isBubbling = false;
    let isPrecipitate = false;
    let precipitateColor = '#ffffff';
    let isGlowing = false;
    let glowColor = '#38bdf8';
    let ph = 7.0;
    let absorbancePeakNm = 300;

    if (activeProtocol) {
      liquidColor = activeProtocol.targetProduct.color;
      liquidOpacity = activeProtocol.targetProduct.opacity;
      isBubbling = activeProtocol.targetProduct.isBubbling;
      isPrecipitate = activeProtocol.targetProduct.isPrecipitate;
      if (activeProtocol.targetProduct.precipitateColor) {
        precipitateColor = activeProtocol.targetProduct.precipitateColor;
      }
      isGlowing = activeProtocol.targetProduct.isGlowing;
      if (activeProtocol.targetProduct.glowColor) {
        glowColor = activeProtocol.targetProduct.glowColor;
      }
      ph = activeProtocol.targetProduct.ph;
      absorbancePeakNm = activeProtocol.targetProduct.absorbancePeakNm;
    } else if (addedReagents.length > 0) {
      const lastReagent = REAGENTS_CATALOG[addedReagents[addedReagents.length - 1].reagentId];
      if (lastReagent) {
        liquidColor = lastReagent.color;
        liquidOpacity = Math.max(0.35, lastReagent.opacity);
        ph = lastReagent.ph;
        absorbancePeakNm = lastReagent.absorbancePeakNm;
      }
      if (temperature >= 95) {
        isBubbling = true;
      }
    }

    return {
      activeProtocol,
      liquidColor,
      liquidOpacity,
      isBubbling,
      isPrecipitate,
      precipitateColor,
      isGlowing,
      glowColor,
      ph,
      absorbancePeakNm,
    };
  }, [addedReagents, temperature]);

  // Protocol discovery effect
  useEffect(() => {
    if (reactionStatus.activeProtocol) {
      const proto = reactionStatus.activeProtocol;
      if (!discoveredProtocols.includes(proto.id)) {
        setDiscoveredProtocols((prev) => [...prev, proto.id]);
        setCurrentDiscoveredNotice(proto);
        labAudio.playReactionDiscovery();
        try {
          confetti({ particleCount: 75, spread: 80, origin: { y: 0.55 } });
        } catch {}
        setLogs((prev) => [
          `Discovery logged: ${proto.title}! (+${proto.xpReward} XP)`,
          proto.discoveryNotes,
          ...prev.slice(0, 8),
        ]);
        setTimeout(() => setCurrentDiscoveredNotice(null), 6000);
      }
    }
  }, [reactionStatus.activeProtocol, discoveredProtocols]);

  // Bunsen burner heating interval
  useEffect(() => {
    let interval: number | null = null;
    if (isHeating) {
      labAudio.setBurnerState(true);
      interval = window.setInterval(() => {
        setTemperature((prev) => {
          if (prev < 110) {
            const next = prev + 2;
            if (next === 100) {
              setLogs((p) => ['Vessel boiling point (100°C) reached. Vigorous vapor evolution.', ...p.slice(0, 8)]);
              labAudio.playBubbling(3000);
            }
            return next;
          }
          return prev;
        });
      }, 300);
    } else {
      labAudio.setBurnerState(false);
      interval = window.setInterval(() => {
        setTemperature((prev) => (prev > 22 ? prev - 1 : 22));
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHeating]);

  // Add reagent
  const handleAddReagent = (reagent: ChemicalReagent) => {
    if (vesselVolume >= 120) {
      setLogs((p) => ['Warning: Reaction flask full (120 mL). Rinse flask to mix new reagents.', ...p.slice(0, 8)]);
      setActionToast({
        id: String(Date.now()),
        text: 'Vessel Full (120 mL)',
        sub: 'Rinse flask to synthesize new compounds',
        color: '#f43f5e',
      });
      return;
    }

    labAudio.playLiquidPour();
    const actualAdd = Math.min(dispenseAmount, 120 - vesselVolume);
    const addedMass = Number((actualAdd * reagent.density).toFixed(1));

    setAddedReagents((prev) => [...prev, { reagentId: reagent.id, amount: actualAdd, addedAt: Date.now() }]);
    setVesselVolume((prev) => prev + actualAdd);
    setVesselMass((prev) => Number((prev + addedMass).toFixed(1)));

    setActionToast({
      id: String(Date.now()),
      text: `Added +${actualAdd} mL ${reagent.name}`,
      sub: `${reagent.formula} · Molar mass: ${reagent.molarMass} g/mol`,
      color: reagent.color,
    });

    setLogs((prev) => [
      `Dispensed ${actualAdd} mL of ${reagent.name} (${reagent.formula}) into reaction vessel.`,
      ...prev.slice(0, 8),
    ]);
  };

  // Adjust magnetic stirrer
  const handleSetRPM = (rpm: number) => {
    setStirrerRPM(rpm);
    setActionToast({
      id: String(Date.now()),
      text: rpm === 0 ? 'Stirrer Off' : `Stirrer Active: ${rpm} RPM`,
      sub: rpm === 0 ? 'Stationary solution' : 'Homogeneous stoichiometric mixing',
      color: '#38bdf8',
    });
    setLogs((p) => [`Magnetic stirrer adjusted to ${rpm} RPM.`, ...p.slice(0, 8)]);
  };

  // Rinse reaction flask
  const handleRinseFlask = () => {
    labAudio.playGlassClink();
    setVesselVolume(0);
    setVesselMass(0);
    setAddedReagents([]);
    setIsHeating(false);
    setTemperature(22);
    setStirrerRPM(0);
    setActionToast({
      id: String(Date.now()),
      text: 'Erlenmeyer Flask Rinsed',
      sub: 'Sanitized with deionized H₂O and dried',
      color: '#34d399',
    });
    setLogs((p) => ['Erlenmeyer flask washed, rinsed with distilled water, and dried.', ...p.slice(0, 8)]);
  };

  // Flame test insertion
  const handleInsertFlameRod = (element: FlameElement) => {
    setSelectedFlameElement(element);
    setIsFlameRodInBurner(true);
    labAudio.playBurnerHissOnce();
    setActionToast({
      id: String(Date.now()),
      text: `Flame: ${element.flameName}`,
      sub: `${element.name} (${element.ion}) · ${element.wavelength}`,
      color: element.color,
    });
    setLogs((p) => [
      `Clean platinum wire dipped into ${element.name} salt (${element.ion}) and placed in Bunsen flame.`,
      `Observed characteristic emission: ${element.flameName} at ${element.wavelength} (${element.electronTransition}).`,
      ...p.slice(0, 8),
    ]);
  };

  const handleRemoveFlameRod = () => {
    setIsFlameRodInBurner(false);
    setSelectedFlameElement(null);
    setLogs((p) => ['Platinum wire removed from flame and quenched in dilute HCl.', ...p.slice(0, 8)]);
  };

  // Toggle station engagement
  const handleToggleStation = useCallback((stationId?: LabStationType) => {
    const target = stationId || nearestStation?.id;
    if (activeStation) {
      // Exit station back to free walking
      setActiveStation(null);
      labAudio.playStationInteract();
      setLogs((p) => ['Exited workstation. Free 3D exploration resumed.', ...p.slice(0, 8)]);
    } else if (target) {
      // Enter station hands-on mode
      setActiveStation(target);
      labAudio.playStationInteract();
      setLogs((p) => [`Engaged workstation: ${LAB_STATIONS[target].name}.`, ...p.slice(0, 8)]);
      if (target === 'spectroscopy') setDockTab('flame');
      else if (target === 'mainframe') setDockTab('protocols');
      else setDockTab('reagents');
    }
  }, [activeStation, nearestStation]);

  // Flashlight toggle
  const handleToggleFlashlight = useCallback(() => {
    setFlashlightOn((prev) => {
      const next = !prev;
      labAudio.playFlashlightToggle();
      if (threeRef.current) {
        threeRef.current.flashlight.visible = next;
      }
      return next;
    });
  }, []);

  // Camera perspective toggle (1st vs 3rd person)
  const handleToggleCameraMode = useCallback(() => {
    setCameraMode((prev) => (prev === 'first' ? 'third' : 'first'));
    labAudio.playScannerBeep();
  }, []);

  // Jump trigger
  const handleJump = useCallback(() => {
    if (!threeRef.current) return;
    if (threeRef.current.isGrounded && !activeStation) {
      threeRef.current.playerVelocity.y = 7.5;
      threeRef.current.isGrounded = false;
      labAudio.playJump();
    }
  }, [activeStation]);

  // Sprint toggle
  const handleToggleSprint = useCallback(() => {
    setIsSprinting((prev) => {
      const next = !prev;
      if (threeRef.current) threeRef.current.isSprintingRef = next;
      return next;
    });
  }, []);

  // Touch joystick events
  const handleJoystickPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    touchStickId.current = e.pointerId;

    const rect = target.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const maxR = rect.width * 0.42;
    const dist = Math.hypot(dx, dy);
    const clampedR = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const nx = (Math.cos(angle) * clampedR) / maxR;
    const ny = (Math.sin(angle) * clampedR) / maxR;

    setTouchStick({ x: nx, y: ny });
    touchStickRef.current = { x: nx, y: ny };
  };

  const handleJoystickPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchStickId.current !== e.pointerId) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const maxR = rect.width * 0.42;
    const dist = Math.hypot(dx, dy);
    const clampedR = Math.min(dist, maxR);
    const angle = Math.atan2(dy, dx);
    const nx = (Math.cos(angle) * clampedR) / maxR;
    const ny = (Math.sin(angle) * clampedR) / maxR;

    setTouchStick({ x: nx, y: ny });
    touchStickRef.current = { x: nx, y: ny };
  };

  const handleJoystickPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchStickId.current === e.pointerId) {
      touchStickId.current = null;
      setTouchStick({ x: 0, y: 0 });
      touchStickRef.current = { x: 0, y: 0 };
    }
  };

  // Touch look drag events on right screen half
  const handleTouchLookDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchLookId.current !== null) return;
    touchLookId.current = e.pointerId;
    touchLookPrev.current = { x: e.clientX, y: e.clientY };
  };

  const handleTouchLookMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchLookId.current !== e.pointerId || !threeRef.current) return;
    const dx = e.clientX - touchLookPrev.current.x;
    const dy = e.clientY - touchLookPrev.current.y;
    touchLookPrev.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.005;
    threeRef.current.playerYaw -= dx * sensitivity;
    threeRef.current.playerPitch = Math.max(
      -Math.PI / 2.5,
      Math.min(Math.PI / 2.5, threeRef.current.playerPitch - dy * sensitivity)
    );
  };

  const handleTouchLookUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchLookId.current === e.pointerId) {
      touchLookId.current = null;
    }
  };

  // --------------------------------------------------------------------------
  // THREE.JS INITIALIZATION & GAME LOOP
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040914);
    scene.fog = new THREE.FogExp2(0x040914, 0.035);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 100);
    camera.position.set(0, 1.65, 4);

    // 3. Renderer with PBR Color Pipeline
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Environment Reflections
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.5);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 0.7);
    scene.add(hemiLight);

    // Main central ceiling fixture
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(5, 12, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    // Sector accent overhead spot/point lights
    const sec1Light = new THREE.PointLight(0x00f0ff, 1.2, 16);
    sec1Light.position.set(0, 4.5, 0);
    scene.add(sec1Light);

    const sec2Light = new THREE.PointLight(0x10b981, 1.2, 16);
    sec2Light.position.set(-8.5, 4.5, 0);
    scene.add(sec2Light);

    const sec3Light = new THREE.PointLight(0xa855f7, 1.4, 16);
    sec3Light.position.set(0, 4.5, 8.5);
    scene.add(sec3Light);

    const sec4Light = new THREE.PointLight(0xf59e0b, 1.2, 16);
    sec4Light.position.set(8.5, 4.5, 0);
    scene.add(sec4Light);

    const sec5Light = new THREE.PointLight(0x3b82f6, 1.2, 16);
    sec5Light.position.set(0, 4.5, -8.5);
    scene.add(sec5Light);

    // Flashlight / UV lamp attached to camera
    const flashlight = new THREE.SpotLight(0x93c5fd, 3.5, 25, Math.PI / 5, 0.35, 1.2);
    flashlight.position.copy(camera.position);
    flashlight.visible = false;
    scene.add(flashlight);

    const flashlightTarget = new THREE.Object3D();
    scene.add(flashlightTarget);
    flashlight.target = flashlightTarget;

    // 6. PROCEDURAL OPEN-WORLD LABORATORY ARCHITECTURE
    const facilityGroup = new THREE.Group();
    scene.add(facilityGroup);

    // A. Floor: High-Gloss Polished Epoxy Tile with Grid
    const floorGeo = new THREE.PlaneGeometry(32, 32, 32, 32);
    const floorMat = new THREE.MeshPhysicalMaterial({
      color: 0x0a1424,
      metalness: 0.25,
      roughness: 0.18,
      clearcoat: 0.85,
      clearcoatRoughness: 0.12,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    facilityGroup.add(floor);

    // Floor navigation grid lines
    const gridHelper = new THREE.GridHelper(32, 32, 0x00f0ff, 0x1e3a5f);
    gridHelper.position.y = 0.005;
    facilityGroup.add(gridHelper);

    // B. Walls & Perimeter Bulkheads
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f1c30,
      metalness: 0.4,
      roughness: 0.45,
    });
    const wallTrimMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      emissive: 0x00f0ff,
      emissiveIntensity: 0.4,
      metalness: 0.8,
      roughness: 0.2,
    });

    const createWall = (width: number, height: number, pos: [number, number, number], rotY: number = 0) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(width, height, 0.4), wallMat);
      wall.position.set(pos[0], pos[1], pos[2]);
      wall.rotation.y = rotY;
      wall.castShadow = true;
      wall.receiveShadow = true;
      facilityGroup.add(wall);

      // Accent glowing LED strip
      const strip = new THREE.Mesh(new THREE.BoxGeometry(width, 0.08, 0.44), wallTrimMat);
      strip.position.set(pos[0], pos[1] + 1.2, pos[2]);
      strip.rotation.y = rotY;
      facilityGroup.add(strip);
    };

    // Outer perimeter walls (30x30 facility with 4.5m ceiling)
    createWall(32, 5.0, [0, 2.5, -16]); // North wall
    createWall(32, 5.0, [0, 2.5, 16]); // South wall
    createWall(32, 5.0, [-16, 2.5, 0], Math.PI / 2); // West wall
    createWall(32, 5.0, [16, 2.5, 0], Math.PI / 2); // East wall

    // Internal Sector Divider Partitions with Archways
    createWall(10, 4.5, [-8, 2.25, -6]);
    createWall(10, 4.5, [8, 2.25, -6]);
    createWall(10, 4.5, [-8, 2.25, 6]);
    createWall(10, 4.5, [8, 2.25, 6]);

    // Ceiling Structure with Skylight Grids
    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 32),
      new THREE.MeshStandardMaterial({ color: 0x07111e, roughness: 0.8 })
    );
    ceiling.position.y = 5.0;
    ceiling.rotation.x = Math.PI / 2;
    facilityGroup.add(ceiling);

    // 7. INTERACTIVE STATIONS 3D MODELS & BEACONS
    const beacons: Record<LabStationType, THREE.Mesh> = {} as any;

    // Helper to generate station holographic ring beacon
    const addStationBeacon = (type: LabStationType, pos: THREE.Vector3, colorHex: number) => {
      const ringGeo = new THREE.TorusGeometry(1.4, 0.04, 16, 48);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.8,
      });
      const beacon = new THREE.Mesh(ringGeo, ringMat);
      beacon.rotation.x = Math.PI / 2;
      beacon.position.set(pos.x, 0.03, pos.z);
      facilityGroup.add(beacon);
      beacons[type] = beacon;

      // Vertical station label pedestal
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.4, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
      );
      pole.position.set(pos.x + 1.2, 1.2, pos.z - 1.2);
      facilityGroup.add(pole);

      // Illuminated station header plate
      const plate = new THREE.Mesh(
        new THREE.BoxGeometry(0.8, 0.35, 0.06),
        new THREE.MeshStandardMaterial({
          color: 0x020816,
          emissive: colorHex,
          emissiveIntensity: 0.5,
          metalness: 0.5,
          roughness: 0.3,
        })
      );
      plate.position.set(pos.x + 1.2, 2.2, pos.z - 1.2);
      facilityGroup.add(plate);
    };

    // --- SECTOR 1: WET SYNTHESIS ISLAND (Center: 0, 0, 0) ---
    addStationBeacon('synthesis', LAB_STATIONS.synthesis.position, 0x00f0ff);

    // Heavy laboratory island bench
    const synthBench = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.95, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x0b192e, metalness: 0.3, roughness: 0.3 })
    );
    synthBench.position.set(0, 0.475, 0);
    synthBench.castShadow = true;
    synthBench.receiveShadow = true;
    facilityGroup.add(synthBench);

    // Black chemical-resistant countertop
    const synthTop = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.1, 2.6),
      new THREE.MeshPhysicalMaterial({ color: 0x020610, roughness: 0.15, clearcoat: 0.9 })
    );
    synthTop.position.set(0, 0.95 + 0.05, 0);
    synthTop.receiveShadow = true;
    facilityGroup.add(synthTop);

    // Overhead reagent shelf rack
    const shelfFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.06, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 })
    );
    shelfFrame.position.set(0, 1.9, 0);
    facilityGroup.add(shelfFrame);

    // Rows of reagent bottles on shelf
    for (let i = -1.5; i <= 1.5; i += 0.4) {
      const bottle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.08, 0.28, 12),
        new THREE.MeshPhysicalMaterial({
          color: i < 0 ? 0x38bdf8 : i === 0 ? 0xec4899 : 0xf59e0b,
          transmission: 0.75,
          roughness: 0.15,
        })
      );
      bottle.position.set(i, 2.05, 0);
      facilityGroup.add(bottle);
    }

    // Synthesis Erlenmeyer Reaction Flask
    const flaskGroup = new THREE.Group();
    flaskGroup.position.set(0, 1.05, 0);
    facilityGroup.add(flaskGroup);

    // Glass body
    const flaskBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.38, 0.55, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.94,
        roughness: 0.05,
        ior: 1.5,
        thickness: 0.8,
        transparent: true,
        opacity: 0.6,
      })
    );
    flaskBody.position.y = 0.275;
    flaskGroup.add(flaskBody);

    // Glass neck
    const flaskNeck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.11, 0.11, 0.25, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.94,
        roughness: 0.05,
        ior: 1.5,
        transparent: true,
        opacity: 0.6,
      })
    );
    flaskNeck.position.y = 0.55 + 0.125;
    flaskGroup.add(flaskNeck);

    // Reaction liquid inside synthesis flask
    const benchFlaskLiquidMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.45,
      roughness: 0.1,
      metalness: 0.1,
      ior: 1.33,
    });
    const benchFlaskLiquid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.34, 0.3, 24),
      benchFlaskLiquidMat
    );
    benchFlaskLiquid.position.y = 0.18;
    flaskGroup.add(benchFlaskLiquid);

    // Magnetic stir bar
    const benchStirBar = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.02, 0.1, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2 })
    );
    benchStirBar.rotation.z = Math.PI / 2;
    benchStirBar.position.y = 0.04;
    flaskGroup.add(benchStirBar);

    // Reaction bubbling particles
    const bubbleGeo = new THREE.BufferGeometry();
    const bubbleCount = 45;
    const bubblePositions = new Float32Array(bubbleCount * 3);
    for (let i = 0; i < bubbleCount; i++) {
      bubblePositions[i * 3] = (Math.random() - 0.5) * 0.25;
      bubblePositions[i * 3 + 1] = Math.random() * 0.3;
      bubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
    }
    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
    const benchBubbles = new THREE.Points(
      bubbleGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.03, transparent: true, opacity: 0.6 })
    );
    flaskGroup.add(benchBubbles);

    // Reaction glow light
    const benchGlowLight = new THREE.PointLight(0x00f0ff, 0, 3.5);
    benchGlowLight.position.set(0, 1.3, 0);
    facilityGroup.add(benchGlowLight);

    // Bunsen burner beside flask
    const bunsenBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.05, 20),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.15 })
    );
    bunsenBase.position.set(0.85, 1.025, 0);
    facilityGroup.add(bunsenBase);

    const bunsenTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.38, 20),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 })
    );
    bunsenTube.position.set(0.85, 1.24, 0);
    facilityGroup.add(bunsenTube);

    // Bunsen Flame
    const benchBunsenInner = new THREE.Mesh(
      new THREE.ConeGeometry(0.035, 0.22, 16),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.9 })
    );
    benchBunsenInner.position.set(0.85, 1.43 + 0.11, 0);
    benchBunsenInner.visible = false;
    facilityGroup.add(benchBunsenInner);

    const benchBunsenOuter = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.34, 16),
      new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.55 })
    );
    benchBunsenOuter.position.set(0.85, 1.43 + 0.17, 0);
    benchBunsenOuter.visible = false;
    facilityGroup.add(benchBunsenOuter);

    const benchFlameLight = new THREE.PointLight(0x38bdf8, 0, 3.5);
    benchFlameLight.position.set(0.85, 1.6, 0);
    facilityGroup.add(benchFlameLight);

    // Platinum test wire rod
    const benchSampleRod = new THREE.Group();
    benchSampleRod.position.set(1.4, 1.05, 0.4);
    const rodHandle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, 0.25, 12),
      new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.4 })
    );
    const rodWire = new THREE.Mesh(
      new THREE.CylinderGeometry(0.005, 0.005, 0.35, 8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.95, roughness: 0.1 })
    );
    rodWire.position.y = 0.3;
    benchSampleRod.add(rodHandle);
    benchSampleRod.add(rodWire);
    facilityGroup.add(benchSampleRod);

    // --- SECTOR 2: SPECTROSCOPY & ANALYTICAL BAY (-8.5, 0, 0) ---
    addStationBeacon('spectroscopy', LAB_STATIONS.spectroscopy.position, 0x10b981);

    const specBench = new THREE.Mesh(
      new THREE.BoxGeometry(4.0, 0.95, 2.2),
      new THREE.MeshStandardMaterial({ color: 0x091e1d, metalness: 0.3, roughness: 0.3 })
    );
    specBench.position.set(-8.5, 0.475, 0);
    facilityGroup.add(specBench);

    // Spectrometer housing console
    const specConsole = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.6, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x134e4a, metalness: 0.6, roughness: 0.3 })
    );
    specConsole.position.set(-8.5, 1.25, -0.4);
    facilityGroup.add(specConsole);

    // Spectrometer digital screen
    const specScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.35),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    specScreen.position.set(-8.5, 1.3, -0.01 + 0.02);
    facilityGroup.add(specScreen);

    // Flame emission testing burner
    const specBurner = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.35, 16),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 })
    );
    specBurner.position.set(-7.5, 1.15, 0.2);
    facilityGroup.add(specBurner);

    const specBurnerFlame = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.32, 16),
      new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.85 })
    );
    specBurnerFlame.position.set(-7.5, 1.45, 0.2);
    facilityGroup.add(specBurnerFlame);

    const specFlameLight = new THREE.PointLight(0x10b981, 1.5, 4);
    specFlameLight.position.set(-7.5, 1.6, 0.2);
    facilityGroup.add(specFlameLight);

    // Analytical balance glass enclosure
    const balanceBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.1, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
    );
    balanceBase.position.set(-9.5, 1.0, 0.2);
    facilityGroup.add(balanceBase);

    const balanceGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.55, 0.45, 0.55),
      new THREE.MeshPhysicalMaterial({ transmission: 0.92, transparent: true, opacity: 0.3, roughness: 0.05 })
    );
    balanceGlass.position.set(-9.5, 1.25, 0.2);
    facilityGroup.add(balanceGlass);

    // --- SECTOR 3: CRYO VAULT & HAZARDS (0, 0, 8.5) ---
    addStationBeacon('cryovault', LAB_STATIONS.cryovault.position, 0xa855f7);

    // Cryo storage platform & dewars
    const cryoPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.2, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x1e152a, metalness: 0.6, roughness: 0.4 })
    );
    cryoPlatform.position.set(0, 0.1, 8.5);
    facilityGroup.add(cryoPlatform);

    // Giant Liquid Nitrogen Dewar Cylinders
    for (let x of [-1.2, 0, 1.2]) {
      const dewar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 1.5, 24),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 })
      );
      dewar.position.set(x, 0.95, 8.5);
      dewar.castShadow = true;
      facilityGroup.add(dewar);

      const dewarCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.24, 0.2, 16),
        new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.5, roughness: 0.3 })
      );
      dewarCap.position.set(x, 1.75, 8.5);
      facilityGroup.add(dewarCap);
    }

    // Cryo Vapor Mist Particle System
    const cryoGeo = new THREE.BufferGeometry();
    const cryoCount = 60;
    const cryoPositions = new Float32Array(cryoCount * 3);
    for (let i = 0; i < cryoCount; i++) {
      cryoPositions[i * 3] = (Math.random() - 0.5) * 3.0;
      cryoPositions[i * 3 + 1] = Math.random() * 1.8;
      cryoPositions[i * 3 + 2] = 8.5 + (Math.random() - 0.5) * 1.8;
    }
    cryoGeo.setAttribute('position', new THREE.BufferAttribute(cryoPositions, 3));
    const cryoParticles = new THREE.Points(
      cryoGeo,
      new THREE.PointsMaterial({ color: 0xd8b4fe, size: 0.08, transparent: true, opacity: 0.45 })
    );
    facilityGroup.add(cryoParticles);

    // Hazard Containment Pod with warning stripes
    const hazardLocker = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 2.4, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x581c87, metalness: 0.7, roughness: 0.3 })
    );
    hazardLocker.position.set(2.8, 1.2, 8.5);
    facilityGroup.add(hazardLocker);

    // --- SECTOR 4: RESEARCH MAINFRAME & ARCHIVES (8.5, 0, 0) ---
    addStationBeacon('mainframe', LAB_STATIONS.mainframe.position, 0xf59e0b);

    // High-tech curved workstation desk
    const mainDesk = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.9, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x1f190e, metalness: 0.4, roughness: 0.3 })
    );
    mainDesk.position.set(8.5, 0.45, 0);
    facilityGroup.add(mainDesk);

    // Triple-screen terminal displays
    for (let offset of [-0.9, 0, 0.9]) {
      const monitor = new THREE.Mesh(
        new THREE.BoxGeometry(0.75, 0.5, 0.05),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
      );
      monitor.position.set(8.5 + (offset === 0 ? 0 : -0.1), 1.25, offset);
      monitor.rotation.y = offset === 0 ? -Math.PI / 2 : offset > 0 ? -Math.PI / 2 + 0.3 : -Math.PI / 2 - 0.3;
      facilityGroup.add(monitor);

      const screenFace = new THREE.Mesh(
        new THREE.PlaneGeometry(0.7, 0.45),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      screenFace.position.copy(monitor.position);
      screenFace.rotation.copy(monitor.rotation);
      screenFace.translateZ(0.03);
      facilityGroup.add(screenFace);
    }

    // Giant Illuminated Periodic Table Wall Board
    const pTableBoard = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 2.8, 5.0),
      new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.25,
        roughness: 0.4,
      })
    );
    pTableBoard.position.set(15.7, 2.5, 0);
    facilityGroup.add(pTableBoard);

    // --- SECTOR 5: DECONTAMINATION & OBSERVATION (0, 0, -8.5) ---
    addStationBeacon('decon', LAB_STATIONS.decon.position, 0x3b82f6);

    // Emergency Eyewash & Safety Shower Station
    const showerPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3.2, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 })
    );
    showerPole.position.set(-1.8, 1.6, -8.5);
    facilityGroup.add(showerPole);

    const showerHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.7 })
    );
    showerHead.position.set(-1.8, 3.1, -8.1);
    showerHead.rotation.x = Math.PI / 2;
    facilityGroup.add(showerHead);

    // Panoramic Observation Window looking into cosmic sky
    const windowFrame = new THREE.Mesh(
      new THREE.BoxGeometry(10, 3.2, 0.2),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
    );
    windowFrame.position.set(0, 2.5, -15.8);
    facilityGroup.add(windowFrame);

    const windowGlass = new THREE.Mesh(
      new THREE.PlaneGeometry(9.6, 2.8),
      new THREE.MeshPhysicalMaterial({
        color: 0x38bdf8,
        transmission: 0.9,
        transparent: true,
        opacity: 0.5,
        roughness: 0.05,
      })
    );
    windowGlass.position.set(0, 2.5, -15.7);
    facilityGroup.add(windowGlass);

    // Cosmic sky backdrop beyond window
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 300;
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      starPos[i * 3] = (Math.random() - 0.5) * 40;
      starPos[i * 3 + 1] = Math.random() * 25 - 5;
      starPos[i * 3 + 2] = -25 - Math.random() * 30;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starField = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ color: 0x93c5fd, size: 0.15, transparent: true, opacity: 0.8 })
    );
    scene.add(starField);

    // 8. FIRST-PERSON VIEW: CARRIED HANDHELD FLASK / SCANNER
    const fpsHandGroup = new THREE.Group();
    camera.add(fpsHandGroup);
    scene.add(camera);

    const fpsFlaskGeo = new THREE.CylinderGeometry(0.04, 0.12, 0.22, 16);
    const fpsFlaskMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.95,
      roughness: 0.05,
      thickness: 0.4,
      transparent: true,
      opacity: 0.7,
    });
    const fpsFlask = new THREE.Mesh(fpsFlaskGeo, fpsFlaskMat);
    fpsFlask.position.set(0.28, -0.25, -0.55);
    fpsFlask.rotation.z = -0.15;
    fpsHandGroup.add(fpsFlask);

    const fpsFlaskLiquidMat = new THREE.MeshPhysicalMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.6,
      roughness: 0.1,
    });
    const fpsFlaskLiquid = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.11, 0.12, 16), fpsFlaskLiquidMat);
    fpsFlaskLiquid.position.set(0.28, -0.28, -0.55);
    fpsHandGroup.add(fpsFlaskLiquid);

    // 9. THIRD-PERSON VIEW: CHEMIST CHARACTER MODEL
    const characterGroup = new THREE.Group();
    scene.add(characterGroup);

    // Torso / Lab coat
    const coat = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.65, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
    );
    coat.position.y = 1.05;
    coat.castShadow = true;
    characterGroup.add(coat);

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 })
    );
    head.position.y = 1.55;
    head.castShadow = true;
    characterGroup.add(head);

    // Cyan Safety Goggles
    const goggles = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.08, 0.08),
      new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.6 })
    );
    goggles.position.set(0, 1.56, 0.14);
    characterGroup.add(goggles);

    // Chemical Backpack with containment tubes
    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.45, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
    );
    pack.position.set(0, 1.1, -0.2);
    characterGroup.add(pack);

    // Arms
    const armGeo = new THREE.CapsuleGeometry(0.06, 0.35, 6, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });

    const charLeftArm = new THREE.Mesh(armGeo, armMat);
    charLeftArm.position.set(-0.32, 1.05, 0);
    characterGroup.add(charLeftArm);

    const charRightArm = new THREE.Mesh(armGeo, armMat);
    charRightArm.position.set(0.32, 1.05, 0);
    characterGroup.add(charRightArm);

    // Legs
    const legGeo = new THREE.CapsuleGeometry(0.075, 0.45, 6, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });

    const charLeftLeg = new THREE.Mesh(legGeo, legMat);
    charLeftLeg.position.set(-0.14, 0.45, 0);
    charLeftLeg.castShadow = true;
    characterGroup.add(charLeftLeg);

    const charRightLeg = new THREE.Mesh(legGeo, legMat);
    charRightLeg.position.set(0.14, 0.45, 0);
    charRightLeg.castShadow = true;
    characterGroup.add(charRightLeg);

    // Ground contact shadow
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.015;
    characterGroup.add(shadowPlane);

    // Keyboard state
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      keys[e.code] = true;

      // Hotkey E to interact
      if (e.code === 'KeyE') {
        handleToggleStation();
      }
      // Hotkey F for Flashlight
      if (e.code === 'KeyF') {
        handleToggleFlashlight();
      }
      // Hotkey V for Camera View mode
      if (e.code === 'KeyV') {
        handleToggleCameraMode();
      }
      // Hotkey Space for Jump
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
      // Hotkey M for Map / Radar
      if (e.code === 'KeyM') {
        setShowRadar((prev) => !prev);
      }
      // Hotkey R for Rinse flask
      if (e.code === 'KeyR') {
        handleRinseFlask();
      }
      // Hotkey Shift for Sprint
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setIsSprinting(true);
        if (threeRef.current) threeRef.current.isSprintingRef = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setIsSprinting(false);
        if (threeRef.current) threeRef.current.isSprintingRef = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Mouse Pointer Lock & Look
    const dom = renderer.domElement;
    let isMouseDown = false;
    let mousePrev = { x: 0, y: 0 };

    const handlePointerDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown = true;
        mousePrev = { x: e.clientX, y: e.clientY };
        // Request pointer lock for desktop FPS experience
        if (!activeStation && document.pointerLockElement !== dom) {
          dom.requestPointerLock?.();
        }
      }
    };

    const handlePointerMove = (e: MouseEvent) => {
      if (!threeRef.current) return;
      let dx = 0;
      let dy = 0;

      if (document.pointerLockElement === dom) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (isMouseDown) {
        dx = e.clientX - mousePrev.x;
        dy = e.clientY - mousePrev.y;
        mousePrev = { x: e.clientX, y: e.clientY };
      }

      if (dx !== 0 || dy !== 0) {
        const sens = 0.0024;
        threeRef.current.playerYaw -= dx * sens;
        threeRef.current.playerPitch = Math.max(
          -Math.PI / 2.3,
          Math.min(Math.PI / 2.3, threeRef.current.playerPitch - dy * sens)
        );
      }
    };

    const handlePointerUp = () => {
      isMouseDown = false;
    };

    dom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);

    // Resize handler
    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Save mutable reference
    threeRef.current = {
      scene,
      camera,
      renderer,
      playerPos: new THREE.Vector3(0, 1.65, 4),
      playerVelocity: new THREE.Vector3(),
      playerYaw: 0,
      playerPitch: 0,
      isGrounded: true,
      headBobTimer: 0,
      isSprintingRef: false,
      keys,
      flashlight,
      flashlightTarget,
      fpsHandGroup,
      fpsFlaskLiquid,
      fpsFlaskLiquidMat,
      characterGroup,
      charLeftLeg,
      charRightLeg,
      charLeftArm,
      charRightArm,
      benchFlaskLiquid,
      benchFlaskLiquidMat,
      benchBubbles,
      benchGlowLight,
      benchBunsenInner,
      benchBunsenOuter,
      benchFlameLight,
      benchStirBar,
      benchSampleRod,
      cryoParticles,
      specBurnerFlame,
      specFlameLight,
      beacons,
      animId: 0,
      lastTime: performance.now(),
      stepSoundTimer: 0,
    };

    // ------------------------------------------------------------------------
    // ANIMATION & PHYSICS TICK LOOP
    // ------------------------------------------------------------------------
    const clock = new THREE.Clock();

    const animate = () => {
      const state = threeRef.current;
      if (!state) return;

      const delta = Math.min(clock.getDelta(), 0.1);
      const time = performance.now() * 0.001;

      // 1. BEACON ROTATION & PULSE
      for (const b of Object.values(state.beacons)) {
        b.rotation.z += delta * 1.5;
      }

      // 2. CRYO PARTICLES RISING
      const cryoPos = state.cryoParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < cryoPos.length; i += 3) {
        cryoPos[i] += delta * 0.35;
        if (cryoPos[i] > 2.2) cryoPos[i] = 0.2;
      }
      state.cryoParticles.geometry.attributes.position.needsUpdate = true;

      // 3. SYNTHESIS BENCH DYNAMICS
      if (isHeating) {
        state.benchBunsenInner.visible = true;
        state.benchBunsenOuter.visible = true;
        state.benchBunsenInner.scale.y = 0.85 + Math.sin(time * 30) * 0.15;
        state.benchBunsenOuter.scale.y = 0.85 + Math.cos(time * 24) * 0.15;
        state.benchFlameLight.intensity = 2.2 + Math.sin(time * 20) * 0.4;
      } else {
        state.benchBunsenInner.visible = false;
        state.benchBunsenOuter.visible = false;
        state.benchFlameLight.intensity = 0;
      }

      // Magnetic stirrer rotation
      if (stirrerRPM > 0) {
        state.benchStirBar.rotation.y += (stirrerRPM / 60) * Math.PI * 2 * delta;
      }

      // Bubbling particles in flask
      if (reactionStatus.isBubbling) {
        state.benchBubbles.visible = true;
        const bPos = state.benchBubbles.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < bPos.length; i += 3) {
          bPos[i] += delta * 0.4;
          if (bPos[i] > 0.45) bPos[i] = 0.05;
        }
        state.benchBubbles.geometry.attributes.position.needsUpdate = true;
      } else {
        state.benchBubbles.visible = false;
      }

      // Reaction liquid colors
      state.benchFlaskLiquidMat.color.set(reactionStatus.liquidColor);
      state.benchFlaskLiquidMat.opacity = reactionStatus.liquidOpacity;
      state.fpsFlaskLiquidMat.color.set(reactionStatus.liquidColor);
      state.fpsFlaskLiquidMat.opacity = reactionStatus.liquidOpacity;

      if (reactionStatus.isGlowing) {
        state.benchGlowLight.intensity = 2.5 + Math.sin(time * 6) * 0.8;
        state.benchGlowLight.color.set(reactionStatus.glowColor);
      } else {
        state.benchGlowLight.intensity = 0;
      }

      // Flame spectroscopy station flame
      if (isFlameRodInBurner && selectedFlameElement) {
        state.specBurnerFlame.visible = true;
        (state.specBurnerFlame.material as THREE.MeshBasicMaterial).color.set(selectedFlameElement.color);
        state.specFlameLight.intensity = 3.0 + Math.sin(time * 25) * 0.5;
        state.specFlameLight.color.set(selectedFlameElement.color);
      } else {
        state.specBurnerFlame.visible = true;
        (state.specBurnerFlame.material as THREE.MeshBasicMaterial).color.set(0x10b981);
        state.specFlameLight.intensity = 1.0;
        state.specFlameLight.color.set(0x10b981);
      }

      // 4. PLAYER MOVEMENT & PHYSICS
      if (!activeStation) {
        // Collect keyboard inputs
        let moveX = 0;
        let moveZ = 0;

        if (state.keys['KeyW'] || state.keys['ArrowUp']) moveZ -= 1;
        if (state.keys['KeyS'] || state.keys['ArrowDown']) moveZ += 1;
        if (state.keys['KeyA'] || state.keys['ArrowLeft']) moveX -= 1;
        if (state.keys['KeyD'] || state.keys['ArrowRight']) moveX += 1;

        // Merge touch joystick input
        if (touchStickRef.current.x !== 0 || touchStickRef.current.y !== 0) {
          moveX += touchStickRef.current.x;
          moveZ += touchStickRef.current.y;
        }

        const inputLength = Math.hypot(moveX, moveZ);
        const isMoving = inputLength > 0.08;

        const speed = state.isSprintingRef ? 6.2 : 3.6;
        const forward = new THREE.Vector3(-Math.sin(state.playerYaw), 0, -Math.cos(state.playerYaw));
        const right = new THREE.Vector3(Math.cos(state.playerYaw), 0, -Math.sin(state.playerYaw));

        if (isMoving) {
          const normX = moveX / Math.max(1, inputLength);
          const normZ = moveZ / Math.max(1, inputLength);
          const desiredVel = forward
            .clone()
            .multiplyScalar(-normZ * speed)
            .add(right.clone().multiplyScalar(normX * speed));

          state.playerVelocity.x = THREE.MathUtils.damp(state.playerVelocity.x, desiredVel.x, 10, delta);
          state.playerVelocity.z = THREE.MathUtils.damp(state.playerVelocity.z, desiredVel.z, 10, delta);

          // Head bobbing & footstep audio cadence
          state.headBobTimer += delta * (state.isSprintingRef ? 14 : 9);
          state.stepSoundTimer += delta * (state.isSprintingRef ? 2.8 : 1.8);
          if (state.stepSoundTimer > 1.0) {
            state.stepSoundTimer = 0;
            labAudio.playFootstep();
          }

          // Animate 3rd person character limbs
          const legAngle = Math.sin(state.headBobTimer) * 0.65;
          state.charLeftLeg.rotation.x = legAngle;
          state.charRightLeg.rotation.x = -legAngle;
          state.charLeftArm.rotation.x = -legAngle;
          state.charRightArm.rotation.x = legAngle;
        } else {
          state.playerVelocity.x = THREE.MathUtils.damp(state.playerVelocity.x, 0, 12, delta);
          state.playerVelocity.z = THREE.MathUtils.damp(state.playerVelocity.z, 0, 12, delta);
          state.charLeftLeg.rotation.x = THREE.MathUtils.damp(state.charLeftLeg.rotation.x, 0, 8, delta);
          state.charRightLeg.rotation.x = THREE.MathUtils.damp(state.charRightLeg.rotation.x, 0, 8, delta);
          state.charLeftArm.rotation.x = THREE.MathUtils.damp(state.charLeftArm.rotation.x, 0, 8, delta);
          state.charRightArm.rotation.x = THREE.MathUtils.damp(state.charRightArm.rotation.x, 0, 8, delta);
        }

        // Apply gravity & jumping
        state.playerVelocity.y -= 19.6 * delta;
        state.playerPos.addScaledVector(state.playerVelocity, delta);

        // Ground floor collision (eye level = 1.65)
        if (state.playerPos.y <= 1.65) {
          if (!state.isGrounded && state.playerVelocity.y < -4) {
            labAudio.playLand();
          }
          state.playerPos.y = 1.65;
          state.playerVelocity.y = 0;
          state.isGrounded = true;
        }

        // Facility perimeter wall collision boundaries (-14.5 to +14.5)
        state.playerPos.x = Math.max(-14.2, Math.min(14.2, state.playerPos.x));
        state.playerPos.z = Math.max(-14.2, Math.min(14.2, state.playerPos.z));

        // Prevent walking through central wet synthesis bench box
        if (Math.abs(state.playerPos.x) < 2.3 && Math.abs(state.playerPos.z) < 1.4) {
          const pushX = state.playerPos.x > 0 ? 2.3 : -2.3;
          const pushZ = state.playerPos.z > 0 ? 1.4 : -1.4;
          if (Math.abs(state.playerPos.x) / 2.3 > Math.abs(state.playerPos.z) / 1.4) {
            state.playerPos.x = pushX;
          } else {
            state.playerPos.z = pushZ;
          }
        }

        // Update 3rd person character position & yaw
        state.characterGroup.position.set(state.playerPos.x, 0, state.playerPos.z);
        state.characterGroup.rotation.y = state.playerYaw;

        // Position camera based on mode
        if (cameraMode === 'first') {
          state.characterGroup.visible = false;
          state.fpsHandGroup.visible = true;

          // Head bobbing offset
          const bobY = Math.sin(state.headBobTimer * 2) * 0.035;
          const bobX = Math.cos(state.headBobTimer) * 0.02;

          state.camera.position.set(state.playerPos.x + bobX, state.playerPos.y + bobY, state.playerPos.z);

          // Camera rotation from Yaw & Pitch
          state.camera.rotation.order = 'YXZ';
          state.camera.rotation.y = state.playerYaw;
          state.camera.rotation.x = state.playerPitch;

          // FPS Handheld flask sway
          state.fpsHandGroup.position.set(bobX * 0.5, bobY * 0.5, 0);
          state.fpsHandGroup.rotation.z = Math.sin(state.headBobTimer) * 0.04;
        } else {
          // Third-Person Over-the-Shoulder Camera
          state.characterGroup.visible = true;
          state.fpsHandGroup.visible = false;

          const dist = 3.2;
          const camOffset = new THREE.Vector3(
            0.6,
            0.4,
            dist
          ).applyEuler(new THREE.Euler(state.playerPitch * 0.6, state.playerYaw, 0, 'YXZ'));

          state.camera.position.copy(state.playerPos).add(camOffset);
          state.camera.lookAt(state.playerPos.x, state.playerPos.y + 0.1, state.playerPos.z);
        }

        // Proximity detection to nearest laboratory station
        let closest: LabStationDef | null = null;
        let minDist = 3.2;

        for (const st of Object.values(LAB_STATIONS)) {
          const d = state.playerPos.distanceTo(st.position);
          if (d < minDist) {
            minDist = d;
            closest = st;
          }
        }
        setNearestStation(closest);
      } else {
        // STATION HANDS-ON BENCH CAMERA VIEW
        const st = LAB_STATIONS[activeStation];
        state.camera.position.lerp(st.cameraPos, 1 - Math.exp(-6 * delta));
        const targetQuat = new THREE.Quaternion().setFromRotationMatrix(
          new THREE.Matrix4().lookAt(state.camera.position, st.lookAt, new THREE.Vector3(0, 1, 0))
        );
        state.camera.quaternion.slerp(targetQuat, 1 - Math.exp(-6 * delta));
        state.fpsHandGroup.visible = false;
        state.characterGroup.visible = false;
      }

      // Update Flashlight beam position & target
      state.flashlight.position.copy(state.camera.position);
      const forwardDir = new THREE.Vector3(0, 0, -1).applyQuaternion(state.camera.quaternion);
      state.flashlightTarget.position.copy(state.camera.position).add(forwardDir.multiplyScalar(10));

      // Render frame
      state.renderer.render(state.scene, state.camera);
      state.animId = requestAnimationFrame(animate);
    };

    threeRef.current.animId = requestAnimationFrame(animate);

    // CLEANUP
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('resize', handleResize);

      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animId);
        threeRef.current.renderer.dispose();
      }
    };
  }, [activeStation, cameraMode, isHeating, stirrerRPM, reactionStatus, isFlameRodInBurner, selectedFlameElement, handleToggleStation, handleToggleFlashlight, handleToggleCameraMode, handleJump, handleRinseFlask]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none font-sans bg-[#020816] ${
        isFullscreen ? 'fixed inset-0 z-50 h-screen' : 'h-[calc(100vh-4.5rem)] rounded-3xl border border-cyan-500/20 shadow-2xl'
      }`}
    >
      {/* 3D WebGL Canvas Mount Container */}
      <div ref={mountRef} className="w-full h-full cursor-crosshair" />

      {/* Touch Screen Right Half: Swipe to Look Drag Zone for Mobile */}
      <div
        className="lg:hidden absolute top-0 right-0 w-1/2 h-full z-20 pointer-events-auto"
        onPointerDown={handleTouchLookDown}
        onPointerMove={handleTouchLookMove}
        onPointerUp={handleTouchLookUp}
        onPointerCancel={handleTouchLookUp}
      />

      {/* -------------------------------------------------------------------- */}
      {/* HUD OVERLAY: TOP BAR */}
      {/* -------------------------------------------------------------------- */}
      <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none flex items-center justify-between">
        {/* Left: Sector & Station Badge */}
        <div className="flex items-center gap-2.5">
          <div className="pointer-events-auto px-3.5 py-1.5 rounded-xl bg-[#030d22]/90 border border-cyan-500/40 text-cyan-300 backdrop-blur-md shadow-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase">
              {activeStation ? LAB_STATIONS[activeStation].sector : nearestStation ? nearestStation.sector : 'SECTOR 1 · RESEARCH OPEN WORLD'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 pointer-events-auto px-3 py-1.5 rounded-xl bg-[#030d22]/80 border border-slate-700/60 text-slate-300 text-xs font-mono backdrop-blur-md">
            <span>Temp: {temperature}°C</span>
            <span className="text-slate-600">|</span>
            <span>Mass: {vesselMass}g</span>
          </div>
        </div>

        {/* Right: Sound, Fullscreen, Help, Mode Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Flashlight button */}
          <button
            onClick={handleToggleFlashlight}
            className={`p-2.5 rounded-xl border backdrop-blur-md transition shadow-lg ${
              flashlightOn
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-[#030d22]/80 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            title="Toggle Flashlight / UV Lamp (F)"
            aria-label="Toggle Flashlight"
          >
            <Lightbulb className="w-4 h-4" />
          </button>

          {/* Camera Perspective 1st/3rd person */}
          <button
            onClick={handleToggleCameraMode}
            className={`px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-lg ${
              cameraMode === 'third'
                ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                : 'bg-[#030d22]/80 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            title="Toggle Camera Perspective (V)"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{cameraMode === 'first' ? '1st Person' : '3rd Person'}</span>
          </button>

          {/* Radar toggle */}
          <button
            onClick={() => setShowRadar(!showRadar)}
            className="p-2.5 rounded-xl bg-[#030d22]/80 border border-slate-700/60 text-slate-300 hover:text-white backdrop-blur-md transition shadow-lg"
            title="Toggle Facility Radar (M)"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2.5 rounded-xl bg-[#030d22]/80 border border-slate-700/60 text-slate-300 hover:text-white backdrop-blur-md transition shadow-lg"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Help Controls Modal */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2.5 rounded-xl bg-[#030d22]/80 border border-slate-700/60 text-slate-300 hover:text-white backdrop-blur-md transition shadow-lg"
            title="Controls & Instructions"
          >
            <Info className="w-4 h-4 text-cyan-300" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2.5 rounded-xl bg-[#030d22]/80 border border-slate-700/60 text-slate-300 hover:text-white backdrop-blur-md transition shadow-lg"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Cinema Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* MINI-RADAR / FACILITY COMPASS (TOP RIGHT) */}
      {/* -------------------------------------------------------------------- */}
      {showRadar && (
        <div className="absolute top-16 right-3 z-30 pointer-events-auto p-2.5 rounded-2xl bg-[#020b1c]/90 border border-cyan-500/30 backdrop-blur-md shadow-2xl">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">LAB FACILITY RADAR</span>
            <span className="text-[9px] font-mono text-slate-400">SECTORS 1-5</span>
          </div>
          <div className="relative w-28 h-28 rounded-xl bg-[#030814] border border-cyan-900/60 overflow-hidden flex items-center justify-center">
            {/* Radar concentric sweep lines */}
            <div className="absolute inset-0 rounded-full border border-cyan-500/20 scale-75" />
            <div className="absolute inset-0 rounded-full border border-cyan-500/10 scale-50" />
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/15" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/15" />

            {/* Station icons on radar */}
            {/* Center: Synthesis */}
            <span className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" title="Wet Synthesis" />
            {/* West: Spectroscopy */}
            <span className="absolute left-2.5 w-2 h-2 rounded-full bg-emerald-400" title="Spectroscopy" />
            {/* North: Cryo Vault */}
            <span className="absolute bottom-2.5 w-2 h-2 rounded-full bg-purple-400" title="Cryo Vault" />
            {/* East: Mainframe */}
            <span className="absolute right-2.5 w-2 h-2 rounded-full bg-amber-400" title="Mainframe" />
            {/* South: Observation */}
            <span className="absolute top-2.5 w-2 h-2 rounded-full bg-blue-400" title="Observation Deck" />

            {/* Player indicator */}
            <div
              className="absolute w-2.5 h-2.5 bg-rose-500 rounded-full border border-white shadow-[0_0_6px_#f43f5e] transition-transform"
              style={{
                transform: `translate(${((threeRef.current?.playerPos.x || 0) / 16) * 42}px, ${
                  ((threeRef.current?.playerPos.z || 0) / 16) * 42
                }px)`,
              }}
            />
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* CROSSHAIR & PROXIMITY INTERACTION PROMPT (CENTER) */}
      {/* -------------------------------------------------------------------- */}
      {!activeStation && (
        <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center z-25">
          {/* Subtle sci-fi center crosshair */}
          <div className="relative w-5 h-5 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/70 shadow-[0_0_6px_#00f0ff]" />
            <div className="absolute w-4 h-[1px] bg-cyan-400/30" />
            <div className="absolute h-4 w-[1px] bg-cyan-400/30" />
          </div>

          {/* Interactive Proximity Callout when near a station */}
          {nearestStation && (
            <div className="mt-8 pointer-events-auto animate-bounce flex flex-col items-center gap-1.5">
              <button
                onClick={() => handleToggleStation(nearestStation.id)}
                className="px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-slate-950 font-black text-xs tracking-wider uppercase shadow-[0_0_30px_rgba(0,240,255,0.6)] border border-white/60 transition transform hover:scale-105 active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <span className="w-5 h-5 rounded-md bg-slate-950 text-cyan-300 flex items-center justify-center text-[10px] font-mono font-bold">
                  E
                </span>
                <span>INTERACT WITH {nearestStation.name}</span>
              </button>
              <span className="text-[10px] font-mono text-cyan-300 drop-shadow-md">
                {nearestStation.description}
              </span>
            </div>
          )}
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* ACTIVE STATION BANNER (WHEN DOCKED AT A WORKSTATION) */}
      {/* -------------------------------------------------------------------- */}
      {activeStation && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 px-5 py-2 rounded-2xl bg-[#040e24]/95 border border-cyan-400/60 backdrop-blur-xl shadow-2xl">
          <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
          <div>
            <span className="text-xs font-bold text-white block">{LAB_STATIONS[activeStation].name} Active</span>
            <span className="text-[10px] text-cyan-300 font-mono">Use controls below or press [E] to return to free exploration</span>
          </div>
          <button
            onClick={() => handleToggleStation()}
            className="ml-3 px-3 py-1 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition"
          >
            FREE ROAM (E)
          </button>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* DISCOVERY / CELEBRATION TOAST */}
      {/* -------------------------------------------------------------------- */}
      {currentDiscoveredNotice && (
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-[#06241b]/95 to-cyan-950/95 border border-emerald-400/80 shadow-[0_0_50px_rgba(16,185,129,0.4)] backdrop-blur-xl flex items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-300 text-2xl font-bold">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-widest text-emerald-400 uppercase">
              REACTION DISCOVERY UNLOCKED (+{currentDiscoveredNotice.xpReward} XP)
            </span>
            <h4 className="text-base font-extrabold text-white">{currentDiscoveredNotice.title}</h4>
            <p className="text-xs text-emerald-200/90 font-mono mt-0.5 max-w-sm">
              {currentDiscoveredNotice.discoveryNotes}
            </p>
          </div>
        </div>
      )}

      {/* ACTION TOAST */}
      {actionToast && (
        <div
          key={actionToast.id}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-35 px-4 py-2 rounded-xl bg-[#051126]/90 border border-cyan-400/40 backdrop-blur-md shadow-xl flex items-center gap-2 pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {actionToast.color && (
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: actionToast.color }} />
          )}
          <div>
            <span className="text-xs font-bold text-white block">{actionToast.text}</span>
            {actionToast.sub && <span className="text-[10px] font-mono text-cyan-300 block">{actionToast.sub}</span>}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MOBILE CONTROLS: VIRTUAL ANALOG JOYSTICK (BOTTOM LEFT) */}
      {/* -------------------------------------------------------------------- */}
      {!activeStation && (
        <div className="lg:hidden absolute bottom-5 left-5 z-35 pointer-events-auto">
          <div
            className="relative w-28 h-28 rounded-full bg-[#040e24]/75 border-2 border-cyan-500/40 backdrop-blur-md flex items-center justify-center touch-none shadow-2xl"
            onPointerDown={handleJoystickPointerDown}
            onPointerMove={handleJoystickPointerMove}
            onPointerUp={handleJoystickPointerUp}
            onPointerCancel={handleJoystickPointerUp}
          >
            {/* Center resting ring */}
            <div className="w-8 h-8 rounded-full border border-cyan-500/25 pointer-events-none" />
            {/* Movable thumb knob */}
            <div
              className="absolute w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 border-2 border-white/80 shadow-[0_0_15px_rgba(0,240,255,0.7)] pointer-events-none transition-transform duration-75"
              style={{
                transform: `translate(${touchStick.x * 28}px, ${touchStick.y * 28}px)`,
              }}
            />
          </div>
          <span className="block text-center text-[9px] font-mono font-bold text-cyan-400 mt-1 tracking-wider">
            MOVE JOYSTICK
          </span>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MOBILE TOUCH ACTION BUTTONS (BOTTOM RIGHT) */}
      {/* -------------------------------------------------------------------- */}
      {!activeStation && (
        <div className="lg:hidden absolute bottom-5 right-5 z-35 pointer-events-auto flex flex-col items-end gap-2.5">
          {/* Proximity Interact Button on Mobile */}
          {nearestStation && (
            <button
              onClick={() => handleToggleStation(nearestStation.id)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-slate-950 font-black text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(0,240,255,0.8)] border border-white active:scale-95 flex items-center gap-2"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>INTERACT (E)</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            {/* Sprint toggle button */}
            <button
              onClick={handleToggleSprint}
              className={`p-3 rounded-2xl border text-xs font-mono font-bold backdrop-blur-md shadow-lg active:scale-95 ${
                isSprinting
                  ? 'bg-amber-500 text-slate-950 border-amber-300'
                  : 'bg-[#030d22]/90 border-slate-700 text-slate-300'
              }`}
            >
              <Footprints className="w-5 h-5" />
            </button>

            {/* Jump button */}
            <button
              onClick={handleJump}
              className="p-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-cyan-400 text-white font-black text-xs shadow-lg active:scale-95"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* COLLAPSIBLE BOTTOM WORKSTATION DOCK (FOR HANDS-ON BENCH EXPERIMENTATION) */}
      {/* -------------------------------------------------------------------- */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-3 transition-transform duration-300 ${
          isDockCollapsed ? 'translate-y-[calc(100%-2.2rem)]' : 'translate-y-0'
        }`}
      >
        <div className="rounded-2xl bg-[#040e24]/95 border border-cyan-500/40 backdrop-blur-xl shadow-2xl overflow-hidden">
          {/* Header Bar with Tabs & Collapse Toggle */}
          <div className="px-4 py-2 border-b border-cyan-950 flex items-center justify-between bg-[#030916]">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setDockTab('reagents');
                  setIsDockCollapsed(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  dockTab === 'reagents'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-cyan-500/10'
                }`}
              >
                <Droplet className="w-3.5 h-3.5" />
                <span>Reagents Catalog</span>
              </button>

              <button
                onClick={() => {
                  setDockTab('thermal');
                  setIsDockCollapsed(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  dockTab === 'thermal'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-amber-500/10'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5" />
                <span>Thermal &amp; Stirrer</span>
              </button>

              <button
                onClick={() => {
                  setDockTab('flame');
                  setIsDockCollapsed(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  dockTab === 'flame'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-emerald-500/10'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Flame Spectroscopy</span>
              </button>

              <button
                onClick={() => {
                  setDockTab('protocols');
                  setIsDockCollapsed(false);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                  dockTab === 'protocols'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-purple-500/10'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Synthesis Log ({discoveredProtocols.length}/{PROTOCOLS.length})</span>
              </button>
            </div>

            {/* Right: Rinse Flask & Collapse Trigger */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRinseFlask}
                className="px-2.5 py-1 rounded-lg bg-rose-950/60 border border-rose-500/50 hover:bg-rose-900/60 text-rose-300 text-xs font-mono transition flex items-center gap-1"
                title="Rinse & Sanitize Reaction Flask (R)"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Rinse Flask</span>
              </button>

              <button
                onClick={() => setIsDockCollapsed(!isDockCollapsed)}
                className="p-1.5 rounded-lg bg-[#0b172d] text-slate-300 hover:text-white transition"
                title={isDockCollapsed ? 'Expand Dock' : 'Collapse Dock'}
              >
                {isDockCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* DOCK CONTENT BODY */}
          <div className="p-3 max-h-56 overflow-y-auto">
            {/* TAB 1: REAGENTS CATALOG */}
            {dockTab === 'reagents' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">Select dispense quantity:</span>
                  <div className="flex items-center gap-1">
                    {[10, 20, 50].map((amt) => (
                      <button
                        key={amt}
                        onClick={() => setDispenseAmount(amt)}
                        className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold transition ${
                          dispenseAmount === amt
                            ? 'bg-cyan-500 text-slate-950'
                            : 'bg-[#09152a] text-slate-400 hover:text-white'
                        }`}
                      >
                        +{amt} mL
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                  {Object.values(REAGENTS_CATALOG).map((reagent) => (
                    <button
                      key={reagent.id}
                      onClick={() => handleAddReagent(reagent)}
                      className="p-2 rounded-xl bg-[#061226] border border-cyan-950 hover:border-cyan-500/60 transition text-left group hover:scale-102 active:scale-98 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: reagent.color }} />
                        <span className="text-xs font-bold text-white truncate">{reagent.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-cyan-400 block">{reagent.formula}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.5 truncate">{reagent.description}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 2: THERMAL & STIRRER */}
            {dockTab === 'thermal' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Bunsen Burner Control */}
                <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Bunsen Burner Flame</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isHeating ? 'Ignited · Oxidizing flame (1100°C)' : 'Extinguished'}
                      </span>
                    </div>
                    <button
                      onClick={() => setIsHeating(!isHeating)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                        isHeating
                          ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                          : 'bg-[#0a1833] text-slate-300 hover:text-white'
                      }`}
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span>{isHeating ? 'EXTINGUISH' : 'IGNITE FLAME'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                    <span>Flask Temp: {temperature}°C</span>
                    <div className="flex-1 bg-[#020610] h-2 rounded-full overflow-hidden border border-cyan-950">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, ((temperature - 20) / 90) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Magnetic Stirrer Control */}
                <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Magnetic Stirrer Agitation</span>
                      <span className="text-[10px] text-slate-400 font-mono">Vortex speed: {stirrerRPM} RPM</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[0, 300, 600, 1200].map((rpm) => (
                        <button
                          key={rpm}
                          onClick={() => handleSetRPM(rpm)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                            stirrerRPM === rpm
                              ? 'bg-cyan-500 text-slate-950'
                              : 'bg-[#0a1833] text-slate-300 hover:text-white'
                          }`}
                        >
                          {rpm === 0 ? 'OFF' : `${rpm}`}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    Agitation accelerates stoichiometric dissolution and ensures uniform heat distribution.
                  </p>
                </div>
              </div>
            )}

            {/* TAB 3: FLAME SPECTROSCOPY */}
            {dockTab === 'flame' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    Select a metallic salt to insert into the platinum wire flame test loop:
                  </span>
                  {isFlameRodInBurner && (
                    <button
                      onClick={handleRemoveFlameRod}
                      className="text-xs font-mono font-bold text-rose-400 hover:text-rose-300"
                    >
                      ✕ Remove wire from flame
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                  {FLAME_ELEMENTS.map((elem) => {
                    const isSelected = selectedFlameElement?.id === elem.id && isFlameRodInBurner;
                    return (
                      <button
                        key={elem.id}
                        onClick={() => handleInsertFlameRod(elem)}
                        className={`p-2.5 rounded-xl border text-center transition ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg'
                            : 'bg-[#071329] border-cyan-950 text-slate-300 hover:border-cyan-800'
                        }`}
                      >
                        <div
                          className="w-3.5 h-3.5 rounded-full mx-auto mb-1 border border-white/40"
                          style={{ backgroundColor: elem.color }}
                        />
                        <strong className="block text-xs font-bold">{elem.name}</strong>
                        <span className="text-[10px] font-mono text-cyan-400 block">{elem.ion}</span>
                        <span className="text-[9px] text-slate-400 block mt-0.5">{elem.wavelength}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: SYNTHESIS PROTOCOLS */}
            {dockTab === 'protocols' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {PROTOCOLS.map((p) => {
                  const isUnlocked = discoveredProtocols.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setInspectingProtocol(p)}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        isUnlocked
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 shadow-md'
                          : 'bg-[#061226] border-cyan-950 text-slate-400 hover:border-cyan-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold text-cyan-400">
                          Tier {p.tier} · +{p.xpReward} XP
                        </span>
                        {isUnlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <strong className={`block text-xs font-bold ${isUnlocked ? 'text-white' : 'text-slate-300'}`}>
                        {p.title}
                      </strong>
                      <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{p.description}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* PROTOCOL INSPECTOR MODAL */}
      {/* -------------------------------------------------------------------- */}
      {inspectingProtocol && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-lg rounded-3xl bg-[#040e24] border border-cyan-500/40 p-6 shadow-2xl relative">
            <button
              onClick={() => setInspectingProtocol(null)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase block mb-1">
              PROTOCOL BLUEPRINT · TIER {inspectingProtocol.tier} (+{inspectingProtocol.xpReward} XP)
            </span>
            <h3 className="text-xl font-bold text-white mb-2">{inspectingProtocol.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">{inspectingProtocol.description}</p>

            <div className="p-3 rounded-2xl bg-[#030916] border border-cyan-950 mb-4">
              <span className="text-[10px] font-mono font-bold text-slate-400 block mb-1.5 uppercase">
                Required Reagents &amp; Stoichiometry
              </span>
              <ul className="space-y-1 text-xs font-mono text-cyan-300">
                {Object.entries(inspectingProtocol.requiredReagents).map(([rId, spec]) => (
                  <li key={rId} className="flex items-center justify-between">
                    <span>{REAGENTS_CATALOG[rId]?.name || rId}:</span>
                    <span>
                      {spec.min} - {spec.max} {spec.unit}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono text-slate-400">
                Product: <strong className="text-white">{inspectingProtocol.targetProduct.name}</strong>
              </span>
              <button
                onClick={() => setInspectingProtocol(null)}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
              >
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* CONTROLS GUIDE MODAL */}
      {/* -------------------------------------------------------------------- */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm pointer-events-auto">
          <div className="w-full max-w-md rounded-3xl bg-[#040e24] border border-cyan-500/40 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <span>Indie Game Controls</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Full player controls across desktop and mobile devices.</p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#020816] border border-cyan-950">
                <strong className="text-cyan-300 block mb-1">Laptop &amp; Desktop (Keyboard &amp; Mouse)</strong>
                <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                  <li>• <strong className="text-white">W, A, S, D / Arrows:</strong> Walk &amp; strafe</li>
                  <li>• <strong className="text-white">Shift:</strong> Hold to sprint</li>
                  <li>• <strong className="text-white">Space:</strong> Jump with physics</li>
                  <li>• <strong className="text-white">Mouse:</strong> Click to lock pointer &amp; look 360°</li>
                  <li>• <strong className="text-white">E:</strong> Interact with nearest station</li>
                  <li>• <strong className="text-white">F:</strong> Toggle Flashlight / UV lamp</li>
                  <li>• <strong className="text-white">V:</strong> Toggle 1st / 3rd Person view</li>
                  <li>• <strong className="text-white">R:</strong> Rinse flask at bench</li>
                  <li>• <strong className="text-white">M:</strong> Toggle facility radar map</li>
                </ul>
              </div>

              <div className="p-3 rounded-2xl bg-[#020816] border border-cyan-950">
                <strong className="text-emerald-300 block mb-1">Phone &amp; Tablet (Touch Screen)</strong>
                <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                  <li>• <strong className="text-white">Left Joystick:</strong> Analog 360° walking</li>
                  <li>• <strong className="text-white">Right Screen Swipe:</strong> Swipe to rotate camera</li>
                  <li>• <strong className="text-white">Interact Button [E]:</strong> Appears near stations</li>
                  <li>• <strong className="text-white">Action Buttons:</strong> Dedicated Jump &amp; Sprint</li>
                </ul>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition"
            >
              Resume Game
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
