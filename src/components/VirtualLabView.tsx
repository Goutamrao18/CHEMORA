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
  Maximize2,
  Minimize2,
  BookOpen,
  Zap,
  Activity,
  CheckCircle2,
  Camera,
  Compass,
  Footprints,
  Lightbulb,
  ArrowUp,
  Info,
  X,
  Gauge,
  FlameKindling,
  Gamepad2,
  LogOut,
  Keyboard,
  Move,
  Atom,
  Radiation,
  Dna,
  Microscope,
  Search,
  Sliders,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  NUCLEAR_REACTIONS,
  NUCLEAR_ISOTOPES,
  NuclearReaction,
  calculateReactorCriticality,
  calculateTokamakPlasma,
} from '../data/nuclearSimData';
import {
  CURATED_SCIENCE_COMPOUNDS,
  NOTABLE_PDB_STRUCTURES,
  PubChemCompoundData,
  PdbStructureData,
  queryPubChemCompound,
} from '../services/scienceService';

interface AddedReagentEntry {
  reagentId: string;
  amount: number;
  addedAt: number;
}

export type LabStationType = 'synthesis' | 'spectroscopy' | 'cryovault' | 'mainframe' | 'decon' | 'nuclear';
export type GraphicsQuality = 'smooth' | 'balanced' | 'cinematic';
export type BurnerFlameType = 'safety' | 'roaring';

interface LabStationDef {
  id: LabStationType;
  key: string;
  name: string;
  sector: string;
  position: THREE.Vector3;
  cameraPos: THREE.Vector3;
  lookAt: THREE.Vector3;
  teleportPos: THREE.Vector3;
  teleportYaw: number;
  accentColor: string;
  description: string;
}

const LAB_STATIONS: Record<LabStationType, LabStationDef> = {
  synthesis: {
    id: 'synthesis',
    key: '1',
    name: 'Wet Synthesis Island',
    sector: 'SECTOR 1 · SYNTHESIS HUB',
    position: new THREE.Vector3(0, 0, 0),
    cameraPos: new THREE.Vector3(0, 1.8, 2.3),
    lookAt: new THREE.Vector3(0, 1.1, 0),
    teleportPos: new THREE.Vector3(0, 1.65, 2.8),
    teleportYaw: 0,
    accentColor: '#00f0ff',
    description: 'Stoichiometric reaction mixing, thermal agitation, and volumetric synthesis.',
  },
  spectroscopy: {
    id: 'spectroscopy',
    key: '2',
    name: 'Flame Spectroscopy Bay',
    sector: 'SECTOR 2 · SPECTROSCOPY BAY',
    position: new THREE.Vector3(-8.5, 0, 0),
    cameraPos: new THREE.Vector3(-7.2, 1.8, 0.4),
    lookAt: new THREE.Vector3(-8.5, 1.1, 0),
    teleportPos: new THREE.Vector3(-6.2, 1.65, 0.2),
    teleportYaw: Math.PI / 2,
    accentColor: '#10b981',
    description: 'High-precision flame emission tests, spectral lines, and analytical mass measurements.',
  },
  cryovault: {
    id: 'cryovault',
    key: '3',
    name: 'Cryogenic & Hazard Vault',
    sector: 'SECTOR 3 · CRYO VAULT',
    position: new THREE.Vector3(0, 0, 8.5),
    cameraPos: new THREE.Vector3(0.4, 1.8, 7.2),
    lookAt: new THREE.Vector3(0, 1.2, 8.5),
    teleportPos: new THREE.Vector3(0, 1.65, 6.2),
    teleportYaw: Math.PI,
    accentColor: '#a855f7',
    description: 'Liquid nitrogen cryo-dewar, pressurized tanks, and reinforced chemical blast locker.',
  },
  mainframe: {
    id: 'mainframe',
    key: '4',
    name: 'Research Mainframe',
    sector: 'SECTOR 4 · MAINFRAME ARCHIVE',
    position: new THREE.Vector3(8.5, 0, 0),
    cameraPos: new THREE.Vector3(7.2, 1.8, -0.3),
    lookAt: new THREE.Vector3(8.5, 1.3, 0),
    teleportPos: new THREE.Vector3(6.2, 1.65, -0.2),
    teleportYaw: -Math.PI / 2,
    accentColor: '#f59e0b',
    description: 'Periodic Table analysis, reaction mechanism database, and synthesis protocols.',
  },
  decon: {
    id: 'decon',
    key: '5',
    name: 'Observation Deck',
    sector: 'SECTOR 5 · OBSERVATION DECK',
    position: new THREE.Vector3(0, 0, -8.5),
    cameraPos: new THREE.Vector3(0, 1.9, -7.0),
    lookAt: new THREE.Vector3(0, 1.4, -9.5),
    teleportPos: new THREE.Vector3(0, 1.65, -6.0),
    teleportYaw: 0,
    accentColor: '#3b82f6',
    description: 'Emergency decontamination station, airlock portal, and panoramic cosmic courtyard view.',
  },
  nuclear: {
    id: 'nuclear',
    key: '6',
    name: 'Atomic & Nuclear Reactor Core',
    sector: 'SECTOR 6 · NUCLEAR REACTION BAY',
    position: new THREE.Vector3(6.5, 0, -6.5),
    cameraPos: new THREE.Vector3(5.2, 1.8, -5.2),
    lookAt: new THREE.Vector3(6.5, 1.3, -6.5),
    teleportPos: new THREE.Vector3(4.8, 1.65, -4.8),
    teleportYaw: -Math.PI * 0.75,
    accentColor: '#d946ef',
    description: 'Sub-atomic tokamak magnetic fusion, Uranium fission core, and Cherenkov radiation tank.',
  },
};

// Reusable math vectors pre-allocated at module scope for ZERO garbage collection in the 60fps render loop
const _vForward = new THREE.Vector3();
const _vRight = new THREE.Vector3();
const _vDesiredVel = new THREE.Vector3();
const _vCamOffset = new THREE.Vector3();
const _qTargetQuat = new THREE.Quaternion();
const _mLookAt = new THREE.Matrix4();
const _vForwardDir = new THREE.Vector3();
const _vUp = new THREE.Vector3(0, 1, 0);
const _vStationLookAt = new THREE.Vector3();
const _eulerCam = new THREE.Euler(0, 0, 0, 'YXZ');

interface VirtualLabViewProps {
  isStandalone?: boolean;
  onExit?: () => void;
}

export const VirtualLabView: React.FC<VirtualLabViewProps> = ({ isStandalone = false, onExit }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Audio mute
  const [isMuted, setIsMuted] = useState(false);

  // Fullscreen
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Mobile / Touch controls toggle
  const [showJoystick, setShowJoystick] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.innerWidth < 1024;
  });
  const [showKeyboardGuide, setShowKeyboardGuide] = useState<boolean>(true);
  const [activeKeys, setActiveKeys] = useState<{ [key: string]: boolean }>({});

  // Graphics Quality Preset: smooth (60FPS high performance), balanced, cinematic
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>('smooth');

  // Real-time FPS measurement for UI
  const [currentFps, setCurrentFps] = useState<number>(60);

  // Active Station Interaction Mode (null = Free 3D Walk)
  const [activeStation, setActiveStation] = useState<LabStationType | null>(null);
  const [nearestStation, setNearestStation] = useState<LabStationDef | null>(null);

  // Camera perspective: First-Person vs Third-Person
  const [cameraMode, setCameraMode] = useState<'first' | 'third'>('first');

  // Flashlight / UV Blacklight state
  const [flashlightOn, setFlashlightOn] = useState(false);

  // Minimap / Radar open
  const [showRadar, setShowRadar] = useState(true);

  // Active dock tab & drawer collapse
  const [dockTab, setDockTab] = useState<'reagents' | 'thermal' | 'flame' | 'nuclear' | 'science' | 'protocols'>('reagents');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [dispenseAmount, setDispenseAmount] = useState<number>(20);

  // Nuclear Station State
  const [nuclearMode, setNuclearMode] = useState<'fission' | 'fusion' | 'decay'>('fission');
  const [selectedNuclearReaction, setSelectedNuclearReaction] = useState<NuclearReaction>(NUCLEAR_REACTIONS[0]);
  const [controlRodDepth, setControlRodDepth] = useState<number>(30); // 30% inserted (k_eff ~ 1.0)
  const [magneticFieldTesla, setMagneticFieldTesla] = useState<number>(12.0);
  const [auxHeatingPowerMW, setAuxHeatingPowerMW] = useState<number>(40);
  const [isNuclearPulsing, setIsNuclearPulsing] = useState<boolean>(false);
  const [isGeigerAudioActive, setIsGeigerAudioActive] = useState<boolean>(false);

  // BioScience & Chemical Intelligence Explorer State (Powered by Science Skill)
  const [scienceSearchQuery, setScienceSearchQuery] = useState<string>('');
  const [scienceCompound, setScienceCompound] = useState<PubChemCompoundData>(CURATED_SCIENCE_COMPOUNDS.aspirin);
  const [isScienceSearching, setIsScienceSearching] = useState<boolean>(false);
  const [scienceSubTab, setScienceSubTab] = useState<'pubchem' | 'ideas' | 'pdb'>('pubchem');
  const [selectedPdb, setSelectedPdb] = useState<PdbStructureData>(NOTABLE_PDB_STRUCTURES[0]);

  // Sprint state
  const [isSprinting, setIsSprinting] = useState(false);

  // Laboratory reaction state
  const [addedReagents, setAddedReagents] = useState<AddedReagentEntry[]>([]);
  const [vesselVolume, setVesselVolume] = useState<number>(0);
  const [vesselMass, setVesselMass] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(22);
  const [isHeating, setIsHeating] = useState(false);
  const [burnerMode, setBurnerMode] = useState<BurnerFlameType>('roaring');
  const [stirrerRPM, setStirrerRPM] = useState<number>(0);
  const [discoveredProtocols, setDiscoveredProtocols] = useState<string[]>([]);
  const [currentDiscoveredNotice, setCurrentDiscoveredNotice] = useState<ReactionProtocol | null>(null);

  // Flame test station state
  const [selectedFlameElement, setSelectedFlameElement] = useState<FlameElement | null>(null);
  const [isFlameRodInBurner, setIsFlameRodInBurner] = useState(false);

  // Action toasts & modals
  const [actionToast, setActionToast] = useState<{ id: string; text: string; sub?: string; color?: string } | null>(null);
  const [inspectingProtocol, setInspectingProtocol] = useState<ReactionProtocol | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNuclearInfoOpen, setIsNuclearInfoOpen] = useState(false);
  const [nuclearInfoTab, setNuclearInfoTab] = useState<'fission' | 'fusion' | 'decay' | 'bioscience'>('fission');

  // Pour stream trickling animation timer
  const [isPouringStream, setIsPouringStream] = useState(false);

  // Touch controls state (for mobile joystick)
  const [touchStick, setTouchStick] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStickRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const touchStickId = useRef<number | null>(null);
  const touchLookId = useRef<number | null>(null);
  const touchLookPrev = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Synchronized Simulation State Ref: Read in 60fps animate() loop WITHOUT re-creating WebGL
  const simStateRef = useRef<{
    activeStation: LabStationType | null;
    cameraMode: 'first' | 'third';
    isHeating: boolean;
    burnerMode: BurnerFlameType;
    stirrerRPM: number;
    temperature: number;
    vesselVolume: number;
    isPouringStream: boolean;
    isFlameRodInBurner: boolean;
    selectedFlameElement: FlameElement | null;
    reactionStatus: {
      liquidColor: string;
      liquidOpacity: number;
      isBubbling: boolean;
      isGlowing: boolean;
      glowColor: string;
      ph: number;
    };
    graphicsQuality: GraphicsQuality;
    nuclearControlRodDepth: number;
    nuclearMode: 'fission' | 'fusion' | 'decay';
    isNuclearPulsing: boolean;
  }>({
    activeStation: null,
    cameraMode: 'first',
    isHeating: false,
    burnerMode: 'roaring',
    stirrerRPM: 0,
    temperature: 22,
    vesselVolume: 0,
    isPouringStream: false,
    isFlameRodInBurner: false,
    selectedFlameElement: null,
    reactionStatus: {
      liquidColor: '#38bdf8',
      liquidOpacity: 0.25,
      isBubbling: false,
      isGlowing: false,
      glowColor: '#38bdf8',
      ph: 7.0,
    },
    graphicsQuality: 'smooth',
    nuclearControlRodDepth: 30,
    nuclearMode: 'fission',
    isNuclearPulsing: false,
  });

  // Three.js mutable scene graph handles
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    playerPos: THREE.Vector3;
    playerVelocity: THREE.Vector3;
    playerYaw: number;
    playerPitch: number;
    isGrounded: boolean;
    headBobTimer: number;
    isSprintingRef: boolean;
    keys: Record<string, boolean>;
    flashlight: THREE.SpotLight;
    flashlightTarget: THREE.Object3D;
    keyLight: THREE.DirectionalLight;
    // FPS Handheld items
    fpsHandGroup: THREE.Group;
    fpsFlaskLiquid: THREE.Mesh;
    fpsFlaskLiquidMat: THREE.MeshPhysicalMaterial;
    // 3rd Person Character
    characterGroup: THREE.Group;
    charLeftLeg: THREE.Mesh;
    charRightLeg: THREE.Mesh;
    charLeftArm: THREE.Mesh;
    charRightArm: THREE.Mesh;
    // Synthesis apparatus
    benchFlaskLiquid: THREE.Mesh;
    benchFlaskLiquidMat: THREE.MeshPhysicalMaterial;
    benchFlaskVortex: THREE.Mesh;
    benchFlaskVortexMat: THREE.MeshBasicMaterial;
    benchBubbles: THREE.Points;
    benchSteam: THREE.Points;
    benchPourStream: THREE.Mesh;
    benchGlowLight: THREE.PointLight;
    benchBunsenInner: THREE.Mesh;
    benchBunsenOuter: THREE.Mesh;
    benchFlameLight: THREE.PointLight;
    benchStirBar: THREE.Mesh;
    benchSampleRod: THREE.Group;
    benchThermalShimmer: THREE.Mesh;
    // Cryo mist
    cryoParticles: THREE.Points;
    // Flame test apparatus
    specBurnerFlame: THREE.Mesh;
    specFlameSparks: THREE.Points;
    specFlameLight: THREE.PointLight;
    // Nuclear apparatus
    nucTokamakPlasma: THREE.Mesh;
    nucCherenkovLight: THREE.PointLight;
    nucControlRods: THREE.Group;
    nucParticleSparks: THREE.Points;
    beacons: Record<LabStationType, THREE.Mesh>;
    animId: number;
    stepSoundTimer: number;
  } | null>(null);

  // Sync state to ref
  useEffect(() => {
    simStateRef.current.activeStation = activeStation;
  }, [activeStation]);

  useEffect(() => {
    simStateRef.current.cameraMode = cameraMode;
  }, [cameraMode]);

  useEffect(() => {
    simStateRef.current.isHeating = isHeating;
  }, [isHeating]);

  useEffect(() => {
    simStateRef.current.burnerMode = burnerMode;
  }, [burnerMode]);

  useEffect(() => {
    simStateRef.current.stirrerRPM = stirrerRPM;
  }, [stirrerRPM]);

  useEffect(() => {
    simStateRef.current.temperature = temperature;
  }, [temperature]);

  useEffect(() => {
    simStateRef.current.vesselVolume = vesselVolume;
  }, [vesselVolume]);

  useEffect(() => {
    simStateRef.current.isPouringStream = isPouringStream;
  }, [isPouringStream]);

  useEffect(() => {
    simStateRef.current.isFlameRodInBurner = isFlameRodInBurner;
  }, [isFlameRodInBurner]);

  useEffect(() => {
    simStateRef.current.selectedFlameElement = selectedFlameElement;
  }, [selectedFlameElement]);

  useEffect(() => {
    simStateRef.current.graphicsQuality = graphicsQuality;
    if (threeRef.current) {
      const dpr = graphicsQuality === 'smooth' ? 1.0 : graphicsQuality === 'balanced' ? 1.35 : Math.min(window.devicePixelRatio, 2.0);
      threeRef.current.renderer.setPixelRatio(dpr);
      threeRef.current.renderer.shadowMap.enabled = graphicsQuality !== 'smooth';
      threeRef.current.keyLight.castShadow = graphicsQuality !== 'smooth';
    }
  }, [graphicsQuality]);

  useEffect(() => {
    simStateRef.current.nuclearControlRodDepth = controlRodDepth;
  }, [controlRodDepth]);

  useEffect(() => {
    simStateRef.current.nuclearMode = nuclearMode;
  }, [nuclearMode]);

  useEffect(() => {
    simStateRef.current.isNuclearPulsing = isNuclearPulsing;
  }, [isNuclearPulsing]);

  // Nuclear Fission and Fusion calculations
  const fissionMetrics = useMemo(() => {
    return calculateReactorCriticality(controlRodDepth);
  }, [controlRodDepth]);

  const fusionMetrics = useMemo(() => {
    return calculateTokamakPlasma(magneticFieldTesla, auxHeatingPowerMW);
  }, [magneticFieldTesla, auxHeatingPowerMW]);

  // Current Radiation Level in MicroSieverts/hour (μSv/h)
  const radiationLevelUsv = useMemo(() => {
    if (nuclearMode === 'fission') {
      const base = selectedNuclearReaction.radiationDoseUsv;
      return +(base * (fissionMetrics.powerMW / 1200)).toFixed(1);
    } else if (nuclearMode === 'fusion') {
      return +(selectedNuclearReaction.radiationDoseUsv * (fusionMetrics.plasmaTempMillionK / 100)).toFixed(1);
    } else {
      return +selectedNuclearReaction.radiationDoseUsv.toFixed(1);
    }
  }, [nuclearMode, selectedNuclearReaction, fissionMetrics.powerMW, fusionMetrics.plasmaTempMillionK]);

  // Geiger Counter Procedural Audio Clicking Interval
  useEffect(() => {
    if (!isGeigerAudioActive && radiationLevelUsv < 15) return;
    const intervalMs = Math.max(65, Math.min(1200, Math.round(1800 / Math.max(1, radiationLevelUsv))));
    const timer = setInterval(() => {
      if (Math.random() < 0.88) {
        labAudio.playGeigerClick();
      }
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isGeigerAudioActive, radiationLevelUsv]);

  const handlePulseNuclearReaction = (reaction: NuclearReaction) => {
    setSelectedNuclearReaction(reaction);
    setIsNuclearPulsing(true);
    if (reaction.category === 'fission') {
      labAudio.playNuclearPulse();
    } else if (reaction.category === 'fusion') {
      labAudio.playTokamakHum();
    } else {
      labAudio.playGeigerClick();
      labAudio.playScannerBeep();
    }

    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setActionToast({
      id: String(Date.now()),
      text: `${reaction.title}`,
      sub: `${reaction.equation} · +${reaction.energyMev} MeV`,
      color: reaction.visualColor,
    });

    setTimeout(() => {
      setIsNuclearPulsing(false);
    }, 2500);
  };

  const handleSearchScienceCompound = async (query?: string) => {
    const q = query || scienceSearchQuery;
    if (!q.trim()) return;
    setIsScienceSearching(true);
    try {
      const result = await queryPubChemCompound(q);
      setScienceCompound(result);
      labAudio.playScannerBeep();
      setActionToast({
        id: String(Date.now()),
        text: `PubChem: ${result.name}`,
        sub: `Formula: ${result.molecularFormula} · ${result.molecularWeight} g/mol`,
        color: '#00f0ff',
      });
    } catch {
      // Fallback handled in service
    } finally {
      setIsScienceSearching(false);
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
      if (matches && protocol.requiredTemp && temperature < protocol.requiredTemp.min) {
        matches = false;
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

    if (activeProtocol) {
      liquidColor = activeProtocol.targetProduct.color;
      liquidOpacity = activeProtocol.targetProduct.opacity;
      isBubbling = activeProtocol.targetProduct.isBubbling;
      isPrecipitate = activeProtocol.targetProduct.isPrecipitate;
      if (activeProtocol.targetProduct.precipitateColor) precipitateColor = activeProtocol.targetProduct.precipitateColor;
      isGlowing = activeProtocol.targetProduct.isGlowing;
      if (activeProtocol.targetProduct.glowColor) glowColor = activeProtocol.targetProduct.glowColor;
      ph = activeProtocol.targetProduct.ph;
    } else if (addedReagents.length > 0) {
      const lastReagent = REAGENTS_CATALOG[addedReagents[addedReagents.length - 1].reagentId];
      if (lastReagent) {
        liquidColor = lastReagent.color;
        liquidOpacity = Math.max(0.35, lastReagent.opacity);
        ph = lastReagent.ph;
      }
      if (temperature >= 95) isBubbling = true;
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
    };
  }, [addedReagents, temperature]);

  useEffect(() => {
    simStateRef.current.reactionStatus = reactionStatus;
  }, [reactionStatus]);

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
        setTimeout(() => setCurrentDiscoveredNotice(null), 6000);
      }
    }
  }, [reactionStatus.activeProtocol, discoveredProtocols]);

  // Bunsen burner heating interval
  useEffect(() => {
    let interval: number | null = null;
    if (isHeating) {
      labAudio.setBurnerState(true);
      const heatRate = burnerMode === 'roaring' ? 3 : 1;
      const tickMs = burnerMode === 'roaring' ? 240 : 400;

      interval = window.setInterval(() => {
        setTemperature((prev) => {
          const maxTemp = burnerMode === 'roaring' ? 115 : 65;
          if (prev < maxTemp) {
            const next = prev + heatRate;
            if (next >= 100 && prev < 100) {
              labAudio.playBubbling(3000);
            }
            return Math.min(maxTemp, next);
          }
          return prev;
        });
      }, tickMs);
    } else {
      labAudio.setBurnerState(false);
      interval = window.setInterval(() => {
        setTemperature((prev) => (prev > 22 ? prev - 1 : 22));
      }, 500);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isHeating, burnerMode]);

  // Sound toggle
  const handleToggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    labAudio.setMuted(next);
  };

  // Fullscreen
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

  // Add reagent with fluid pour stream animation
  const handleAddReagent = (reagent: ChemicalReagent) => {
    if (vesselVolume >= 120) {
      setActionToast({
        id: String(Date.now()),
        text: 'Vessel Full (120 mL)',
        sub: 'Rinse flask to synthesize new compounds',
        color: '#f43f5e',
      });
      return;
    }

    labAudio.playLiquidPour();
    setIsPouringStream(true);
    setTimeout(() => setIsPouringStream(false), 600);

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
  };

  // Adjust magnetic stirrer
  const handleSetRPM = (rpm: number) => {
    setStirrerRPM(rpm);
    setActionToast({
      id: String(Date.now()),
      text: rpm === 0 ? 'Stirrer Off' : `Stirrer Active: ${rpm} RPM`,
      sub: rpm === 0 ? 'Stationary solution' : 'Hydrodynamic vortex mixing',
      color: '#38bdf8',
    });
  };

  // Rinse reaction flask
  const handleRinseFlask = useCallback(() => {
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
  }, []);

  // Exit 3D lab game back to platform
  const handleExitGame = useCallback(() => {
    labAudio.playStationInteract();
    if (onExit) {
      onExit();
    } else {
      window.location.href = '/#home';
    }
  }, [onExit]);

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
  };

  const handleRemoveFlameRod = () => {
    setIsFlameRodInBurner(false);
    setSelectedFlameElement(null);
  };

  // Toggle station engagement
  const handleToggleStation = useCallback((stationId?: LabStationType) => {
    const target = stationId || nearestStation?.id;
    if (activeStation) {
      setActiveStation(null);
      labAudio.playStationInteract();
    } else if (target) {
      setActiveStation(target);
      labAudio.playStationInteract();
      if (target === 'spectroscopy') setDockTab('flame');
      else if (target === 'mainframe') setDockTab('science');
      else if (target === 'nuclear') setDockTab('nuclear');
      else setDockTab('reagents');
    }
  }, [activeStation, nearestStation]);

  const handleExitGameRef = useRef(handleExitGame);
  handleExitGameRef.current = handleExitGame;
  const handleToggleStationRef = useRef(handleToggleStation);
  handleToggleStationRef.current = handleToggleStation;

  // Global window pointerup/cancel listener to prevent joystick or look gestures from sticking
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (touchStickId.current !== null) {
        touchStickId.current = null;
        setTouchStick({ x: 0, y: 0 });
        touchStickRef.current = { x: 0, y: 0 };
      }
      if (touchLookId.current !== null) {
        touchLookId.current = null;
      }
    };
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
    return () => {
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, []);

  // Fast Travel / Station Teleportation
  const handleFastTravel = useCallback((stationKey: LabStationType) => {
    const st = LAB_STATIONS[stationKey];
    if (!st || !threeRef.current) return;
    threeRef.current.playerPos.copy(st.teleportPos);
    threeRef.current.playerYaw = st.teleportYaw;
    threeRef.current.playerVelocity.set(0, 0, 0);
    setActiveStation(st.id);
    labAudio.playStationInteract();
    setActionToast({
      id: String(Date.now()),
      text: `Teleported to ${st.name}`,
      sub: st.sector,
      color: st.accentColor,
    });
  }, []);

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

  // Cycle Graphics Quality
  const handleCycleGraphics = useCallback(() => {
    setGraphicsQuality((prev) => {
      const next = prev === 'smooth' ? 'balanced' : prev === 'balanced' ? 'cinematic' : 'smooth';
      labAudio.playScannerBeep();
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
      -Math.PI / 2.3,
      Math.min(Math.PI / 2.3, threeRef.current.playerPitch - dy * sensitivity)
    );
  };

  const handleTouchLookUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (touchLookId.current === e.pointerId) {
      touchLookId.current = null;
    }
  };

  // --------------------------------------------------------------------------
  // ONE-TIME THREE.JS INITIALIZATION & HIGH PERFORMANCE RENDER LOOP
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // 1. Scene & Atmosphere
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x040914);
    scene.fog = new THREE.FogExp2(0x040914, 0.032);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(72, width / height, 0.1, 100);
    camera.position.set(0, 1.65, 4);

    // 3. Renderer with High Performance Configuration
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(1.0); // Defaults to smooth 1.0; adapts dynamically
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = false;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Studio Environment Reflection Map
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 5. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x1e293b, 0.65);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x090d16, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.3);
    keyLight.position.set(5, 12, 6);
    keyLight.castShadow = false;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    // Sector Beacons
    const sec1Light = new THREE.PointLight(0x00f0ff, 1.3, 16);
    sec1Light.position.set(0, 4.5, 0);
    scene.add(sec1Light);

    const sec2Light = new THREE.PointLight(0x10b981, 1.3, 16);
    sec2Light.position.set(-8.5, 4.5, 0);
    scene.add(sec2Light);

    const sec3Light = new THREE.PointLight(0xa855f7, 1.4, 16);
    sec3Light.position.set(0, 4.5, 8.5);
    scene.add(sec3Light);

    const sec4Light = new THREE.PointLight(0xf59e0b, 1.3, 16);
    sec4Light.position.set(8.5, 4.5, 0);
    scene.add(sec4Light);

    const sec5Light = new THREE.PointLight(0x3b82f6, 1.3, 16);
    sec5Light.position.set(0, 4.5, -8.5);
    scene.add(sec5Light);

    // Flashlight
    const flashlight = new THREE.SpotLight(0x93c5fd, 3.5, 25, Math.PI / 5, 0.35, 1.2);
    flashlight.position.copy(camera.position);
    flashlight.visible = false;
    scene.add(flashlight);

    const flashlightTarget = new THREE.Object3D();
    scene.add(flashlightTarget);
    flashlight.target = flashlightTarget;

    // 6. Architecture & Facilities
    const facilityGroup = new THREE.Group();
    scene.add(facilityGroup);

    // High-Gloss Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 32, 16, 16),
      new THREE.MeshPhysicalMaterial({
        color: 0x0a1424,
        metalness: 0.25,
        roughness: 0.18,
        clearcoat: 0.85,
        clearcoatRoughness: 0.12,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    facilityGroup.add(floor);

    const gridHelper = new THREE.GridHelper(32, 32, 0x00f0ff, 0x1e3a5f);
    gridHelper.position.y = 0.005;
    facilityGroup.add(gridHelper);

    // Wall Construction
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

    const createWall = (w: number, h: number, pos: [number, number, number], rotY: number = 0) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.4), wallMat);
      wall.position.set(pos[0], pos[1], pos[2]);
      wall.rotation.y = rotY;
      facilityGroup.add(wall);

      const strip = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, 0.44), wallTrimMat);
      strip.position.set(pos[0], pos[1] + 1.2, pos[2]);
      strip.rotation.y = rotY;
      facilityGroup.add(strip);
    };

    createWall(32, 5.0, [0, 2.5, -16]);
    createWall(32, 5.0, [0, 2.5, 16]);
    createWall(32, 5.0, [-16, 2.5, 0], Math.PI / 2);
    createWall(32, 5.0, [16, 2.5, 0], Math.PI / 2);

    createWall(10, 4.5, [-8, 2.25, -6]);
    createWall(10, 4.5, [8, 2.25, -6]);
    createWall(10, 4.5, [-8, 2.25, 6]);
    createWall(10, 4.5, [8, 2.25, 6]);

    const ceiling = new THREE.Mesh(
      new THREE.PlaneGeometry(32, 32),
      new THREE.MeshStandardMaterial({ color: 0x07111e, roughness: 0.8 })
    );
    ceiling.position.y = 5.0;
    ceiling.rotation.x = Math.PI / 2;
    facilityGroup.add(ceiling);

    // Beacons
    const beacons: Record<LabStationType, THREE.Mesh> = {} as any;
    const addStationBeacon = (type: LabStationType, pos: THREE.Vector3, colorHex: number) => {
      const ringGeo = new THREE.TorusGeometry(1.4, 0.04, 12, 36);
      const ringMat = new THREE.MeshBasicMaterial({ color: colorHex, transparent: true, opacity: 0.8 });
      const beacon = new THREE.Mesh(ringGeo, ringMat);
      beacon.rotation.x = Math.PI / 2;
      beacon.position.set(pos.x, 0.03, pos.z);
      facilityGroup.add(beacon);
      beacons[type] = beacon;

      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.06, 2.4, 12),
        new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
      );
      pole.position.set(pos.x + 1.2, 1.2, pos.z - 1.2);
      facilityGroup.add(pole);

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

    // --- SECTOR 1: WET SYNTHESIS ISLAND (0,0,0) ---
    addStationBeacon('synthesis', LAB_STATIONS.synthesis.position, 0x00f0ff);

    const synthBench = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.95, 2.4),
      new THREE.MeshStandardMaterial({ color: 0x0b192e, metalness: 0.3, roughness: 0.3 })
    );
    synthBench.position.set(0, 0.475, 0);
    facilityGroup.add(synthBench);

    const synthTop = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 0.1, 2.6),
      new THREE.MeshPhysicalMaterial({ color: 0x020610, roughness: 0.15, clearcoat: 0.9 })
    );
    synthTop.position.set(0, 1.0, 0);
    facilityGroup.add(synthTop);

    // Overhead shelf & bottles
    const shelfFrame = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.06, 0.6),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.2 })
    );
    shelfFrame.position.set(0, 1.9, 0);
    facilityGroup.add(shelfFrame);

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

    // Reaction Erlenmeyer Flask
    const flaskGroup = new THREE.Group();
    flaskGroup.position.set(0, 1.05, 0);
    facilityGroup.add(flaskGroup);

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

    // Liquid mesh
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

    // Vortex funnel for magnetic stirrer
    const benchFlaskVortexMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.25,
      wireframe: true,
    });
    const benchFlaskVortex = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 0.24, 16, 1, true),
      benchFlaskVortexMat
    );
    benchFlaskVortex.rotation.x = Math.PI;
    benchFlaskVortex.position.y = 0.22;
    benchFlaskVortex.visible = false;
    flaskGroup.add(benchFlaskVortex);

    // Stir bar
    const benchStirBar = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.02, 0.1, 8, 12),
      new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.5, roughness: 0.2 })
    );
    benchStirBar.rotation.z = Math.PI / 2;
    benchStirBar.position.y = 0.04;
    flaskGroup.add(benchStirBar);

    // Bubbles
    const bubbleGeo = new THREE.BufferGeometry();
    const bubbleCount = 40;
    const bubblePositions = new Float32Array(bubbleCount * 3);
    for (let i = 0; i < bubbleCount; i++) {
      bubblePositions[i * 3] = (Math.random() - 0.5) * 0.25;
      bubblePositions[i * 3 + 1] = Math.random() * 0.3;
      bubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
    }
    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));
    const benchBubbles = new THREE.Points(
      bubbleGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.035, transparent: true, opacity: 0.7 })
    );
    flaskGroup.add(benchBubbles);

    // Rising Steam / Gas Particle System
    const steamGeo = new THREE.BufferGeometry();
    const steamCount = 30;
    const steamPositions = new Float32Array(steamCount * 3);
    for (let i = 0; i < steamCount; i++) {
      steamPositions[i * 3] = (Math.random() - 0.5) * 0.15;
      steamPositions[i * 3 + 1] = 0.8 + Math.random() * 0.8;
      steamPositions[i * 3 + 2] = (Math.random() - 0.5) * 0.15;
    }
    steamGeo.setAttribute('position', new THREE.BufferAttribute(steamPositions, 3));
    const benchSteam = new THREE.Points(
      steamGeo,
      new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.06, transparent: true, opacity: 0.55 })
    );
    benchSteam.visible = false;
    flaskGroup.add(benchSteam);

    // Dynamic Pouring Stream Mesh
    const benchPourStream = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.02, 0.65, 12),
      new THREE.MeshPhysicalMaterial({ color: 0x38bdf8, transmission: 0.85, transparent: true, opacity: 0.8 })
    );
    benchPourStream.position.set(0, 1.15, 0);
    benchPourStream.visible = false;
    flaskGroup.add(benchPourStream);

    // Thermal infrared heat shimmer ring
    const benchThermalShimmer = new THREE.Mesh(
      new THREE.RingGeometry(0.38, 0.44, 24),
      new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.0, side: THREE.DoubleSide })
    );
    benchThermalShimmer.rotation.x = -Math.PI / 2;
    benchThermalShimmer.position.y = 0.02;
    flaskGroup.add(benchThermalShimmer);

    // Glow light
    const benchGlowLight = new THREE.PointLight(0x00f0ff, 0, 3.5);
    benchGlowLight.position.set(0, 1.3, 0);
    facilityGroup.add(benchGlowLight);

    // Bunsen Burner Apparatus
    const bunsenBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.18, 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.9, roughness: 0.15 })
    );
    bunsenBase.position.set(0.85, 1.025, 0);
    facilityGroup.add(bunsenBase);

    const bunsenTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.045, 0.38, 16),
      new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.85, roughness: 0.2 })
    );
    bunsenTube.position.set(0.85, 1.24, 0);
    facilityGroup.add(bunsenTube);

    // Bunsen Flames: Inner Cone and Outer Sheath
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

    // Platinum test loop rod
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

    const specConsole = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.6, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x134e4a, metalness: 0.6, roughness: 0.3 })
    );
    specConsole.position.set(-8.5, 1.25, -0.4);
    facilityGroup.add(specConsole);

    const specScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(0.7, 0.35),
      new THREE.MeshBasicMaterial({ color: 0x10b981 })
    );
    specScreen.position.set(-8.5, 1.3, -0.01 + 0.02);
    facilityGroup.add(specScreen);

    // Flame emission burner
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

    // Flame emission spark particles
    const sparkGeo = new THREE.BufferGeometry();
    const sparkCount = 20;
    const sparkPos = new Float32Array(sparkCount * 3);
    for (let i = 0; i < sparkCount; i++) {
      sparkPos[i * 3] = -7.5 + (Math.random() - 0.5) * 0.15;
      sparkPos[i * 3 + 1] = 1.4 + Math.random() * 0.4;
      sparkPos[i * 3 + 2] = 0.2 + (Math.random() - 0.5) * 0.15;
    }
    sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
    const specFlameSparks = new THREE.Points(
      sparkGeo,
      new THREE.PointsMaterial({ color: 0x10b981, size: 0.035, transparent: true, opacity: 0.8 })
    );
    facilityGroup.add(specFlameSparks);

    const specFlameLight = new THREE.PointLight(0x10b981, 1.5, 4);
    specFlameLight.position.set(-7.5, 1.6, 0.2);
    facilityGroup.add(specFlameLight);

    // --- SECTOR 3: CRYO VAULT (0, 0, 8.5) ---
    addStationBeacon('cryovault', LAB_STATIONS.cryovault.position, 0xa855f7);

    const cryoPlatform = new THREE.Mesh(
      new THREE.BoxGeometry(4.2, 0.2, 2.6),
      new THREE.MeshStandardMaterial({ color: 0x1e152a, metalness: 0.6, roughness: 0.4 })
    );
    cryoPlatform.position.set(0, 0.1, 8.5);
    facilityGroup.add(cryoPlatform);

    for (const x of [-1.2, 0, 1.2]) {
      const dewar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 1.5, 20),
        new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.15 })
      );
      dewar.position.set(x, 0.95, 8.5);
      facilityGroup.add(dewar);

      const dewarCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.24, 0.2, 16),
        new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.5, roughness: 0.3 })
      );
      dewarCap.position.set(x, 1.75, 8.5);
      facilityGroup.add(dewarCap);
    }

    const cryoGeo = new THREE.BufferGeometry();
    const cryoCount = 45;
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

    // --- SECTOR 4: RESEARCH MAINFRAME (8.5, 0, 0) ---
    addStationBeacon('mainframe', LAB_STATIONS.mainframe.position, 0xf59e0b);

    const mainDesk = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 0.9, 1.8),
      new THREE.MeshStandardMaterial({ color: 0x1f190e, metalness: 0.4, roughness: 0.3 })
    );
    mainDesk.position.set(8.5, 0.45, 0);
    facilityGroup.add(mainDesk);

    for (const offset of [-0.9, 0, 0.9]) {
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

    // --- SECTOR 5: OBSERVATION DECK (0, 0, -8.5) ---
    addStationBeacon('decon', LAB_STATIONS.decon.position, 0x3b82f6);

    const showerPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 3.2, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, metalness: 0.8, roughness: 0.2 })
    );
    showerPole.position.set(-1.8, 1.6, -8.5);
    facilityGroup.add(showerPole);

    const showerHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.25, 0.15, 14),
      new THREE.MeshStandardMaterial({ color: 0x22c55e, metalness: 0.7 })
    );
    showerHead.position.set(-1.8, 3.1, -8.1);
    showerHead.rotation.x = Math.PI / 2;
    facilityGroup.add(showerHead);

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

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 200;
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

    // --- SECTOR 6: ATOMIC & NUCLEAR REACTOR CORE (6.5, 0, -6.5) ---
    addStationBeacon('nuclear', LAB_STATIONS.nuclear.position, 0xd946ef);

    const nucPlatform = new THREE.Mesh(
      new THREE.CylinderGeometry(2.8, 3.0, 0.25, 6),
      new THREE.MeshStandardMaterial({ color: 0x150d24, metalness: 0.8, roughness: 0.25 })
    );
    nucPlatform.position.set(6.5, 0.125, -6.5);
    facilityGroup.add(nucPlatform);

    // Hazard radiation yellow-black stripe border ring
    const hazardRing = new THREE.Mesh(
      new THREE.RingGeometry(2.6, 2.9, 6),
      new THREE.MeshBasicMaterial({ color: 0xfacc15, side: THREE.DoubleSide })
    );
    hazardRing.rotation.x = -Math.PI / 2;
    hazardRing.position.set(6.5, 0.26, -6.5);
    facilityGroup.add(hazardRing);

    // Fission Cherenkov Water Tank (Cylinder)
    const tankGlass = new THREE.Mesh(
      new THREE.CylinderGeometry(0.9, 0.9, 1.3, 24),
      new THREE.MeshPhysicalMaterial({
        color: 0x00f0ff,
        transmission: 0.9,
        transparent: true,
        opacity: 0.6,
        roughness: 0.05,
      })
    );
    tankGlass.position.set(5.7, 0.75, -6.5);
    facilityGroup.add(tankGlass);

    // Internal Fuel Assemblies
    for (let fx = -0.3; fx <= 0.3; fx += 0.3) {
      for (let fz = -0.3; fz <= 0.3; fz += 0.3) {
        const fuelRod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.9, 12),
          new THREE.MeshStandardMaterial({ color: 0x38bdf8, metalness: 0.9, roughness: 0.1 })
        );
        fuelRod.position.set(5.7 + fx, 0.6, -6.5 + fz);
        facilityGroup.add(fuelRod);
      }
    }

    // Movable Cadmium Control Rods
    const nucControlRods = new THREE.Group();
    nucControlRods.position.set(5.7, 1.1, -6.5);
    for (let fx = -0.2; fx <= 0.2; fx += 0.4) {
      for (let fz = -0.2; fz <= 0.2; fz += 0.4) {
        const rod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.03, 0.03, 0.8, 12),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.85, roughness: 0.2 })
        );
        rod.position.set(fx, 0, fz);
        nucControlRods.add(rod);
      }
    }
    facilityGroup.add(nucControlRods);

    // Cherenkov Radiation Blue Light
    const nucCherenkovLight = new THREE.PointLight(0x00f0ff, 2.0, 4.5);
    nucCherenkovLight.position.set(5.7, 0.7, -6.5);
    facilityGroup.add(nucCherenkovLight);

    // Tokamak Torus Magnetic Confinement Ring
    const tokamakFrame = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.18, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 })
    );
    tokamakFrame.rotation.x = Math.PI / 4;
    tokamakFrame.position.set(7.5, 1.2, -6.5);
    facilityGroup.add(tokamakFrame);

    // Glowing Tokamak Plasma Core Ring
    const nucTokamakPlasma = new THREE.Mesh(
      new THREE.TorusGeometry(0.9, 0.07, 16, 32),
      new THREE.MeshBasicMaterial({ color: 0xd946ef, transparent: true, opacity: 0.95 })
    );
    nucTokamakPlasma.rotation.x = Math.PI / 4;
    nucTokamakPlasma.position.set(7.5, 1.2, -6.5);
    facilityGroup.add(nucTokamakPlasma);

    // Particle Sparks around nuclear core
    const nucSparksGeo = new THREE.BufferGeometry();
    const nucSparksCount = 50;
    const nucSparksPos = new Float32Array(nucSparksCount * 3);
    for (let i = 0; i < nucSparksCount; i++) {
      nucSparksPos[i * 3] = 6.5 + (Math.random() - 0.5) * 2.2;
      nucSparksPos[i * 3 + 1] = 0.5 + Math.random() * 1.5;
      nucSparksPos[i * 3 + 2] = -6.5 + (Math.random() - 0.5) * 2.2;
    }
    nucSparksGeo.setAttribute('position', new THREE.BufferAttribute(nucSparksPos, 3));
    const nucParticleSparks = new THREE.Points(
      nucSparksGeo,
      new THREE.PointsMaterial({ color: 0xd946ef, size: 0.05, transparent: true, opacity: 0.85 })
    );
    facilityGroup.add(nucParticleSparks);

    // 8. FPS View: Handheld Flask
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

    // 9. 3rd Person Character
    const characterGroup = new THREE.Group();
    scene.add(characterGroup);

    const coat = new THREE.Mesh(
      new THREE.BoxGeometry(0.48, 0.65, 0.28),
      new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
    );
    coat.position.y = 1.05;
    characterGroup.add(coat);

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 14, 14),
      new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 })
    );
    head.position.y = 1.55;
    characterGroup.add(head);

    const goggles = new THREE.Mesh(
      new THREE.BoxGeometry(0.26, 0.08, 0.08),
      new THREE.MeshPhysicalMaterial({ color: 0x00f0ff, emissive: 0x00f0ff, emissiveIntensity: 0.6 })
    );
    goggles.position.set(0, 1.56, 0.14);
    characterGroup.add(goggles);

    const pack = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 0.45, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 })
    );
    pack.position.set(0, 1.1, -0.2);
    characterGroup.add(pack);

    const armGeo = new THREE.CapsuleGeometry(0.06, 0.35, 4, 8);
    const armMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.4 });
    const charLeftArm = new THREE.Mesh(armGeo, armMat);
    charLeftArm.position.set(-0.32, 1.05, 0);
    characterGroup.add(charLeftArm);

    const charRightArm = new THREE.Mesh(armGeo, armMat);
    charRightArm.position.set(0.32, 1.05, 0);
    characterGroup.add(charRightArm);

    const legGeo = new THREE.CapsuleGeometry(0.075, 0.45, 4, 8);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.6 });
    const charLeftLeg = new THREE.Mesh(legGeo, legMat);
    charLeftLeg.position.set(-0.14, 0.45, 0);
    characterGroup.add(charLeftLeg);

    const charRightLeg = new THREE.Mesh(legGeo, legMat);
    charRightLeg.position.set(0.14, 0.45, 0);
    characterGroup.add(charRightLeg);

    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.9, 0.9),
      new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.45 })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.015;
    characterGroup.add(shadowPlane);

    // Keyboard handlers
    const keys: Record<string, boolean> = {};

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      keys[e.code] = true;
      setActiveKeys((prev) => (prev[e.code] ? prev : { ...prev, [e.code]: true }));

      // ESC or Q: Return from workstation to free roam, or exit 3D lab back to Chemora
      if (e.code === 'Escape' || e.code === 'KeyQ') {
        if (simStateRef.current.activeStation) {
          handleToggleStationRef.current();
        } else {
          handleExitGameRef.current();
        }
      }
      if (e.code === 'KeyK') setShowKeyboardGuide((prev) => !prev);
      if (e.code === 'KeyE') handleToggleStationRef.current();
      if (e.code === 'KeyF') handleToggleFlashlight();
      if (e.code === 'KeyV') handleToggleCameraMode();
      if (e.code === 'KeyP') handleCycleGraphics();
      if (e.code === 'KeyH') setIsDockCollapsed((c) => !c);
      if (e.code === 'Digit1') handleFastTravel('synthesis');
      if (e.code === 'Digit2') handleFastTravel('spectroscopy');
      if (e.code === 'Digit3') handleFastTravel('cryovault');
      if (e.code === 'Digit4') handleFastTravel('mainframe');
      if (e.code === 'Digit5') handleFastTravel('decon');
      if (e.code === 'Digit6') handleFastTravel('nuclear');
      if (e.code === 'Space') {
        e.preventDefault();
        handleJump();
      }
      if (e.code === 'KeyM') setShowRadar((prev) => !prev);
      if (e.code === 'KeyR') handleRinseFlask();
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setIsSprinting(true);
        if (threeRef.current) threeRef.current.isSprintingRef = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keys[e.code] = false;
      setActiveKeys((prev) => {
        if (!prev[e.code]) return prev;
        const next = { ...prev };
        delete next[e.code];
        return next;
      });
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        setIsSprinting(false);
        if (threeRef.current) threeRef.current.isSprintingRef = false;
      }
    };

    const handleWindowBlur = () => {
      for (const k in keys) keys[k] = false;
      setActiveKeys({});
      setIsSprinting(false);
      if (threeRef.current) threeRef.current.isSprintingRef = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleWindowBlur);

    // Mouse Pointer Lock
    const dom = renderer.domElement;
    let isMouseDown = false;
    let mousePrev = { x: 0, y: 0 };

    const handlePointerDown = (e: MouseEvent) => {
      if (e.button === 0) {
        isMouseDown = true;
        mousePrev = { x: e.clientX, y: e.clientY };
        if (!simStateRef.current.activeStation && document.pointerLockElement !== dom) {
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

    const handleResize = () => {
      if (!container || !threeRef.current) return;
      const w = container.clientWidth || window.innerWidth;
      const h = container.clientHeight || window.innerHeight;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Pre-warm WebGL shaders to avoid first-frame drop
    renderer.compile(scene, camera);

    // Initialize State Handle
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
      keyLight,
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
      benchFlaskVortex,
      benchFlaskVortexMat,
      benchBubbles,
      benchSteam,
      benchPourStream,
      benchThermalShimmer,
      benchGlowLight,
      benchBunsenInner,
      benchBunsenOuter,
      benchFlameLight,
      benchStirBar,
      benchSampleRod,
      cryoParticles,
      specBurnerFlame,
      specFlameSparks,
      specFlameLight,
      nucTokamakPlasma,
      nucCherenkovLight,
      nucControlRods,
      nucParticleSparks,
      beacons,
      animId: 0,
      stepSoundTimer: 0,
    };

    // ------------------------------------------------------------------------
    // SILKY SMOOTH 60FPS RENDER & PHYSICS LOOP
    // ------------------------------------------------------------------------
    const clock = new THREE.Clock();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const animate = () => {
      const state = threeRef.current;
      if (!state) return;

      const sim = simStateRef.current;
      const delta = Math.min(clock.getDelta(), 0.08);
      const time = performance.now() * 0.001;

      // Real-time FPS Calculation
      frameCount++;
      const now = performance.now();
      if (now - lastFpsUpdate >= 600) {
        const fps = Math.round((frameCount * 1000) / (now - lastFpsUpdate));
        setCurrentFps(fps);
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // 1. BEACON ROTATIONS
      for (const b of Object.values(state.beacons)) {
        b.rotation.z += delta * 1.5;
      }

      // 2. CRYO PARTICLES
      const cryoPos = state.cryoParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < cryoPos.length; i += 3) {
        cryoPos[i] += delta * 0.35;
        if (cryoPos[i] > 2.2) cryoPos[i] = 0.2;
      }
      state.cryoParticles.geometry.attributes.position.needsUpdate = true;

      // 3. SYNTHESIS BENCH DYNAMICS
      if (sim.isHeating) {
        state.benchBunsenInner.visible = true;
        state.benchBunsenOuter.visible = true;

        if (sim.burnerMode === 'roaring') {
          (state.benchBunsenInner.material as THREE.MeshBasicMaterial).color.set(0x38bdf8);
          (state.benchBunsenOuter.material as THREE.MeshBasicMaterial).color.set(0x2563eb);
          state.benchBunsenInner.scale.set(1.0, 0.95 + Math.sin(time * 36) * 0.2, 1.0);
          state.benchBunsenOuter.scale.set(1.0, 0.95 + Math.cos(time * 30) * 0.2, 1.0);
          state.benchFlameLight.color.set(0x38bdf8);
          state.benchFlameLight.intensity = 2.8 + Math.sin(time * 24) * 0.6;
        } else {
          // Safety Yellow Flame
          (state.benchBunsenInner.material as THREE.MeshBasicMaterial).color.set(0xfbbf24);
          (state.benchBunsenOuter.material as THREE.MeshBasicMaterial).color.set(0xf59e0b);
          state.benchBunsenInner.scale.set(1.2, 0.8 + Math.sin(time * 12) * 0.15, 1.2);
          state.benchBunsenOuter.scale.set(1.2, 0.8 + Math.cos(time * 10) * 0.15, 1.2);
          state.benchFlameLight.color.set(0xf59e0b);
          state.benchFlameLight.intensity = 1.4 + Math.sin(time * 10) * 0.3;
        }
      } else {
        state.benchBunsenInner.visible = false;
        state.benchBunsenOuter.visible = false;
        state.benchFlameLight.intensity = 0;
      }

      // Magnetic Stirrer Whirlpool Vortex
      if (sim.stirrerRPM > 0) {
        state.benchStirBar.rotation.y += (sim.stirrerRPM / 60) * Math.PI * 2 * delta;
        state.benchFlaskVortex.visible = sim.vesselVolume > 15;
        state.benchFlaskVortex.rotation.y += (sim.stirrerRPM / 60) * Math.PI * 3 * delta;
        const vortexDepth = (sim.stirrerRPM / 1200) * 0.18;
        state.benchFlaskVortex.scale.set(1.0, vortexDepth, 1.0);
      } else {
        state.benchFlaskVortex.visible = false;
      }

      // Bubbling particles
      if (sim.reactionStatus.isBubbling) {
        state.benchBubbles.visible = true;
        const bPos = state.benchBubbles.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < bPos.length; i += 3) {
          bPos[i] += delta * 0.45;
          if (bPos[i] > 0.45) bPos[i] = 0.05;
        }
        state.benchBubbles.geometry.attributes.position.needsUpdate = true;
      } else {
        state.benchBubbles.visible = false;
      }

      // Steam & Gas emission particle system
      if (sim.temperature >= 90 || sim.reactionStatus.isBubbling) {
        state.benchSteam.visible = true;
        const sPos = state.benchSteam.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < sPos.length; i += 3) {
          sPos[i] += delta * 0.55;
          if (sPos[i] > 1.8) sPos[i] = 0.8;
        }
        state.benchSteam.geometry.attributes.position.needsUpdate = true;
      } else {
        state.benchSteam.visible = false;
      }

      // Pouring Stream Mesh
      state.benchPourStream.visible = sim.isPouringStream;
      if (sim.isPouringStream) {
        (state.benchPourStream.material as THREE.MeshPhysicalMaterial).color.set(sim.reactionStatus.liquidColor);
      }

      // Reaction liquid materials
      state.benchFlaskLiquidMat.color.set(sim.reactionStatus.liquidColor);
      state.benchFlaskLiquidMat.opacity = sim.reactionStatus.liquidOpacity;
      state.fpsFlaskLiquidMat.color.set(sim.reactionStatus.liquidColor);
      state.fpsFlaskLiquidMat.opacity = sim.reactionStatus.liquidOpacity;

      // Thermal heat shimmer ring on vessel
      const thermalOpacity = Math.max(0, (sim.temperature - 60) / 50) * 0.45;
      (state.benchThermalShimmer.material as THREE.MeshBasicMaterial).opacity = thermalOpacity;

      if (sim.reactionStatus.isGlowing) {
        state.benchGlowLight.intensity = 2.5 + Math.sin(time * 6) * 0.8;
        state.benchGlowLight.color.set(sim.reactionStatus.glowColor);
      } else {
        state.benchGlowLight.intensity = 0;
      }

      // Flame spectroscopy station
      if (sim.isFlameRodInBurner && sim.selectedFlameElement) {
        state.specBurnerFlame.visible = true;
        state.specFlameSparks.visible = true;
        const col = sim.selectedFlameElement.color;
        (state.specBurnerFlame.material as THREE.MeshBasicMaterial).color.set(col);
        (state.specFlameSparks.material as THREE.PointsMaterial).color.set(col);
        state.specFlameLight.intensity = 3.2 + Math.sin(time * 25) * 0.6;
        state.specFlameLight.color.set(col);

        // Animate emission sparks rising
        const spkPos = state.specFlameSparks.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < spkPos.length; i += 3) {
          spkPos[i] += delta * 0.6;
          if (spkPos[i] > 1.9) spkPos[i] = 1.4;
        }
        state.specFlameSparks.geometry.attributes.position.needsUpdate = true;
      } else {
        state.specFlameSparks.visible = false;
        state.specBurnerFlame.visible = true;
        (state.specBurnerFlame.material as THREE.MeshBasicMaterial).color.set(0x10b981);
      }

      // Nuclear & Atomic Bay 3D dynamics
      if (state.nucTokamakPlasma) {
        state.nucTokamakPlasma.rotation.z += delta * (sim.isNuclearPulsing ? 8.0 : 2.5);
      }
      if (state.nucControlRods) {
        const depth = sim.nuclearControlRodDepth;
        state.nucControlRods.position.y = 1.3 - (depth / 100) * 0.45;
      }
      if (state.nucCherenkovLight) {
        const pulseMult = sim.isNuclearPulsing ? 3.5 : 1.0;
        state.nucCherenkovLight.intensity = (1.5 + Math.sin(time * 8) * 0.5) * pulseMult;
      }
      if (state.nucParticleSparks) {
        const sparkPos = state.nucParticleSparks.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < sparkPos.length; i += 3) {
          sparkPos[i] += delta * 0.8;
          if (sparkPos[i] > 2.2) sparkPos[i] = 0.5;
        }
        state.nucParticleSparks.geometry.attributes.position.needsUpdate = true;
      }

      // 4. ZERO-GC PLAYER MOVEMENT & KINEMATICS
      if (!sim.activeStation) {
        let moveX = 0;
        let moveZ = 0;

        if (state.keys['KeyW'] || state.keys['ArrowUp']) moveZ -= 1;
        if (state.keys['KeyS'] || state.keys['ArrowDown']) moveZ += 1;
        if (state.keys['KeyA'] || state.keys['ArrowLeft']) moveX -= 1;
        if (state.keys['KeyD'] || state.keys['ArrowRight']) moveX += 1;

        if (touchStickRef.current.x !== 0 || touchStickRef.current.y !== 0) {
          moveX += touchStickRef.current.x;
          moveZ += touchStickRef.current.y;
        }

        const inputLength = Math.hypot(moveX, moveZ);
        const isMoving = inputLength > 0.08;
        const speed = state.isSprintingRef ? 6.4 : 3.8;

        _vForward.set(-Math.sin(state.playerYaw), 0, -Math.cos(state.playerYaw));
        _vRight.set(Math.cos(state.playerYaw), 0, -Math.sin(state.playerYaw));

        if (isMoving) {
          const normX = moveX / Math.max(1, inputLength);
          const normZ = moveZ / Math.max(1, inputLength);

          _vDesiredVel.copy(_vForward).multiplyScalar(-normZ * speed).addScaledVector(_vRight, normX * speed);

          state.playerVelocity.x = THREE.MathUtils.damp(state.playerVelocity.x, _vDesiredVel.x, 11, delta);
          state.playerVelocity.z = THREE.MathUtils.damp(state.playerVelocity.z, _vDesiredVel.z, 11, delta);

          state.headBobTimer += delta * (state.isSprintingRef ? 14 : 9);
          state.stepSoundTimer += delta * (state.isSprintingRef ? 2.8 : 1.8);
          if (state.stepSoundTimer > 1.0) {
            state.stepSoundTimer = 0;
            labAudio.playFootstep();
          }

          const legAngle = Math.sin(state.headBobTimer) * 0.65;
          state.charLeftLeg.rotation.x = legAngle;
          state.charRightLeg.rotation.x = -legAngle;
          state.charLeftArm.rotation.x = -legAngle;
          state.charRightArm.rotation.x = legAngle;
        } else {
          state.playerVelocity.x = THREE.MathUtils.damp(state.playerVelocity.x, 0, 13, delta);
          state.playerVelocity.z = THREE.MathUtils.damp(state.playerVelocity.z, 0, 13, delta);
          state.charLeftLeg.rotation.x = THREE.MathUtils.damp(state.charLeftLeg.rotation.x, 0, 8, delta);
          state.charRightLeg.rotation.x = THREE.MathUtils.damp(state.charRightLeg.rotation.x, 0, 8, delta);
          state.charLeftArm.rotation.x = THREE.MathUtils.damp(state.charLeftArm.rotation.x, 0, 8, delta);
          state.charRightArm.rotation.x = THREE.MathUtils.damp(state.charRightArm.rotation.x, 0, 8, delta);
        }

        // Gravity
        state.playerVelocity.y -= 19.6 * delta;
        state.playerPos.addScaledVector(state.playerVelocity, delta);

        if (state.playerPos.y <= 1.65) {
          if (!state.isGrounded && state.playerVelocity.y < -4) {
            labAudio.playLand();
          }
          state.playerPos.y = 1.65;
          state.playerVelocity.y = 0;
          state.isGrounded = true;
        }

        // Room boundaries
        state.playerPos.x = Math.max(-14.2, Math.min(14.2, state.playerPos.x));
        state.playerPos.z = Math.max(-14.2, Math.min(14.2, state.playerPos.z));

        // Central table collision
        if (Math.abs(state.playerPos.x) < 2.3 && Math.abs(state.playerPos.z) < 1.4) {
          const pushX = state.playerPos.x > 0 ? 2.3 : -2.3;
          const pushZ = state.playerPos.z > 0 ? 1.4 : -1.4;
          if (Math.abs(state.playerPos.x) / 2.3 > Math.abs(state.playerPos.z) / 1.4) {
            state.playerPos.x = pushX;
          } else {
            state.playerPos.z = pushZ;
          }
        }

        state.characterGroup.position.set(state.playerPos.x, 0, state.playerPos.z);
        state.characterGroup.rotation.y = state.playerYaw;

        if (sim.cameraMode === 'first') {
          state.characterGroup.visible = false;
          state.fpsHandGroup.visible = true;

          const bobY = Math.sin(state.headBobTimer * 2) * 0.035;
          const bobX = Math.cos(state.headBobTimer) * 0.02;

          state.camera.position.set(state.playerPos.x + bobX, state.playerPos.y + bobY, state.playerPos.z);
          state.camera.rotation.order = 'YXZ';
          state.camera.rotation.y = state.playerYaw;
          state.camera.rotation.x = state.playerPitch;

          state.fpsHandGroup.position.set(bobX * 0.5, bobY * 0.5, 0);
          state.fpsHandGroup.rotation.z = Math.sin(state.headBobTimer) * 0.04;
        } else {
          state.characterGroup.visible = true;
          state.fpsHandGroup.visible = false;

          _eulerCam.set(state.playerPitch * 0.6, state.playerYaw, 0, 'YXZ');
          _vCamOffset.set(0.6, 0.4, 3.2).applyEuler(_eulerCam);

          state.camera.position.copy(state.playerPos).add(_vCamOffset);
          state.camera.lookAt(state.playerPos.x, state.playerPos.y + 0.1, state.playerPos.z);
        }

        // Proximity detection
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
        const st = LAB_STATIONS[sim.activeStation];
        state.camera.position.lerp(st.cameraPos, 1 - Math.exp(-6 * delta));
        _vStationLookAt.copy(st.lookAt);
        _mLookAt.lookAt(state.camera.position, _vStationLookAt, _vUp);
        _qTargetQuat.setFromRotationMatrix(_mLookAt);
        state.camera.quaternion.slerp(_qTargetQuat, 1 - Math.exp(-6 * delta));
        state.fpsHandGroup.visible = false;
        state.characterGroup.visible = false;
      }

      // Flashlight beam
      state.flashlight.position.copy(state.camera.position);
      _vForwardDir.set(0, 0, -1).applyQuaternion(state.camera.quaternion);
      state.flashlightTarget.position.copy(state.camera.position).addScaledVector(_vForwardDir, 10);

      // Render WebGL frame
      state.renderer.render(state.scene, state.camera);
      state.animId = requestAnimationFrame(animate);
    };

    threeRef.current.animId = requestAnimationFrame(animate);

    // CLEANUP
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleWindowBlur);
      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('resize', handleResize);

      if (threeRef.current) {
        cancelAnimationFrame(threeRef.current.animId);
        threeRef.current.renderer.dispose();
      }
    };
  }, [handleFastTravel, handleToggleStation, handleToggleFlashlight, handleToggleCameraMode, handleCycleGraphics, handleJump, handleRinseFlask]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden select-none font-sans bg-[#020816] ${
        isFullscreen || isStandalone ? 'fixed inset-0 z-50 h-screen w-screen' : 'h-[calc(100vh-4.5rem)] rounded-3xl border border-cyan-500/25 shadow-2xl'
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
      {/* HUD OVERLAY: TOP UTILITY BAR (ZERO BLUR STALLS) */}
      {/* -------------------------------------------------------------------- */}
      <div className="absolute top-3 left-3 right-3 z-30 pointer-events-none flex items-center justify-between gap-2">
        {/* Left: Exit Button, Sector Badge, Teleport Jump Pills & Stats */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap sm:flex-nowrap">
          {/* Prominent Exit Button in Play Game */}
          <button
            onClick={handleExitGame}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-950/90 to-red-950/90 hover:from-rose-900 hover:to-red-900 border border-rose-500/70 hover:border-rose-400 text-rose-200 hover:text-white shadow-xl transition active:scale-95 group text-xs font-mono font-bold cursor-pointer"
            title="Exit 3D Lab Simulation [ESC or Q]"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Exit Lab</span>
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-rose-900/80 text-[9px] text-rose-300 font-mono border border-rose-700/50">ESC</span>
          </button>

          <div className="px-3.5 py-1.5 rounded-xl bg-[#040e24]/95 border border-cyan-500/40 text-cyan-300 shadow-xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#38bdf8]" />
            <span className="text-xs font-mono font-bold tracking-wider uppercase truncate max-w-[120px] sm:max-w-none">
              {activeStation ? LAB_STATIONS[activeStation].sector : nearestStation ? nearestStation.sector : 'SECTOR 1 · RESEARCH OPEN WORLD'}
            </span>
          </div>

          {/* Quick Teleport Hotkeys (1-5) */}
          <div className="hidden xl:flex items-center gap-1 bg-[#040e24]/90 p-1 rounded-xl border border-slate-700/60 shadow-lg">
            {(Object.values(LAB_STATIONS) as LabStationDef[]).map((st) => (
              <button
                key={st.id}
                onClick={() => handleFastTravel(st.id)}
                className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1 ${
                  activeStation === st.id
                    ? 'bg-cyan-500 text-slate-950'
                    : 'text-slate-300 hover:text-white hover:bg-cyan-500/10'
                }`}
                title={`Fast Travel to ${st.name} [${st.key}]`}
              >
                <span className="opacity-70">[{st.key}]</span>
                <span className="truncate max-w-[80px]">{st.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Dedicated Atomic & Nuclear Reactions Information & Idea Launcher */}
          <button
            onClick={() => setIsNuclearInfoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-950/90 via-[#180424]/90 to-purple-950/90 hover:from-fuchsia-900 hover:to-purple-900 border border-fuchsia-500/70 hover:border-fuchsia-400 text-fuchsia-200 hover:text-white text-xs font-mono font-bold shadow-[0_0_15px_rgba(217,70,239,0.3)] transition active:scale-95 group cursor-pointer"
            title="Atomic & Nuclear Reaction System: Information & Research Ideas"
          >
            <Atom className="w-3.5 h-3.5 text-fuchsia-400 group-hover:rotate-180 transition-transform duration-500" />
            <span className="hidden sm:inline">Atomic &amp; Nuclear</span>
            <span>Ideas</span>
          </button>

          {/* Real-time Vessel Specs */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#040e24]/90 border border-slate-700/60 text-slate-300 text-xs font-mono shadow-lg">
            <span>Temp: <strong className={temperature > 70 ? 'text-rose-400' : 'text-cyan-300'}>{temperature}°C</strong></span>
            <span className="text-slate-600">|</span>
            <span>Vol: <strong className="text-white">{vesselVolume}mL</strong></span>
            <span className="text-slate-600">|</span>
            <span>Mass: <strong className="text-white">{vesselMass}g</strong></span>
          </div>
        </div>

        {/* Right: FPS Counter, Quality, Flashlight, Camera, Joystick Toggle, Keyboard HUD Toggle, Radar, Audio, Help, Fullscreen */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* Live 60FPS Performance Badge & Quality Switcher */}
          <button
            onClick={handleCycleGraphics}
            className={`px-2.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-lg ${
              graphicsQuality === 'smooth'
                ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300'
                : graphicsQuality === 'balanced'
                ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300'
                : 'bg-purple-950/80 border-purple-400 text-purple-300'
            }`}
            title="Click to toggle Graphics Quality (Smooth 60FPS / Balanced / Cinematic) [P]"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{currentFps} FPS</span>
            <span className="hidden md:inline uppercase text-[10px] opacity-80">· {graphicsQuality}</span>
          </button>

          {/* Flashlight button */}
          <button
            onClick={handleToggleFlashlight}
            className={`p-2.5 rounded-xl border transition shadow-lg ${
              flashlightOn
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-[#040e24]/90 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            title="Toggle Flashlight / UV Lamp (F)"
            aria-label="Toggle Flashlight"
          >
            <Lightbulb className="w-4 h-4" />
          </button>

          {/* Camera Perspective 1st/3rd person */}
          <button
            onClick={handleToggleCameraMode}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition flex items-center gap-1.5 shadow-lg ${
              cameraMode === 'third'
                ? 'bg-purple-600/30 border-purple-400 text-purple-200'
                : 'bg-[#040e24]/90 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            title="Toggle Camera Perspective (V)"
          >
            <Camera className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{cameraMode === 'first' ? '1st' : '3rd'}</span>
          </button>

          {/* Mobile Joystick Toggle */}
          <button
            onClick={() => setShowJoystick((j) => !j)}
            className={`p-2.5 rounded-xl border transition shadow-lg ${
              showJoystick
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#040e24]/90 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            title={showJoystick ? 'Hide Mobile Joystick' : 'Show Mobile Joystick'}
            aria-label="Toggle Mobile Joystick"
          >
            <Gamepad2 className="w-4 h-4" />
          </button>

          {/* PC Keyboard HUD Toggle */}
          <button
            onClick={() => setShowKeyboardGuide((k) => !k)}
            className={`hidden md:flex p-2.5 rounded-xl border transition shadow-lg ${
              showKeyboardGuide && !showJoystick
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                : 'bg-[#040e24]/90 border-slate-700/60 text-slate-300 hover:text-white'
            }`}
            title={showKeyboardGuide ? 'Hide PC Keyboard Controls HUD (K)' : 'Show PC Keyboard Controls HUD (K)'}
            aria-label="Toggle PC Keyboard Controls HUD"
          >
            <Keyboard className="w-4 h-4" />
          </button>

          {/* Radar toggle */}
          <button
            onClick={() => setShowRadar(!showRadar)}
            className="p-2.5 rounded-xl bg-[#040e24]/90 border border-slate-700/60 text-slate-300 hover:text-white transition shadow-lg"
            title="Toggle Facility Radar (M)"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Sound Toggle */}
          <button
            onClick={handleToggleSound}
            className="p-2.5 rounded-xl bg-[#040e24]/90 border border-slate-700/60 text-slate-300 hover:text-white transition shadow-lg"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Help Controls Modal */}
          <button
            onClick={() => setIsHelpOpen(true)}
            className="p-2.5 rounded-xl bg-[#040e24]/90 border border-slate-700/60 text-slate-300 hover:text-white transition shadow-lg"
            title="Controls & Instructions"
          >
            <Info className="w-4 h-4 text-cyan-300" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={handleToggleFullscreen}
            className="p-2.5 rounded-xl bg-[#040e24]/90 border border-slate-700/60 text-slate-300 hover:text-white transition shadow-lg"
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
        <div className="absolute top-16 right-3 z-30 pointer-events-auto p-2.5 rounded-2xl bg-[#020b1c]/95 border border-cyan-500/30 shadow-2xl">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider">LAB FACILITY RADAR</span>
            <span className="text-[9px] font-mono text-slate-400">SECTORS 1-6</span>
          </div>
          <div className="relative w-28 h-28 rounded-xl bg-[#030814] border border-cyan-900/60 overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-cyan-500/20 scale-75" />
            <div className="absolute inset-0 rounded-full border border-cyan-500/10 scale-50" />
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-cyan-500/15" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-cyan-500/15" />

            {/* Station icons on radar */}
            <span className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]" title="Wet Synthesis" />
            <span className="absolute left-2.5 w-2 h-2 rounded-full bg-emerald-400" title="Spectroscopy" />
            <span className="absolute bottom-2.5 w-2 h-2 rounded-full bg-purple-400" title="Cryo Vault" />
            <span className="absolute right-2.5 w-2 h-2 rounded-full bg-amber-400" title="Mainframe" />
            <span className="absolute top-2.5 w-2 h-2 rounded-full bg-blue-400" title="Observation Deck" />
            <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 rounded-full bg-fuchsia-400 shadow-[0_0_6px_#d946ef]" title="Nuclear Core" />

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
          <div className="relative w-5 h-5 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-400/80 shadow-[0_0_6px_#00f0ff]" />
            <div className="absolute w-4 h-[1px] bg-cyan-400/35" />
            <div className="absolute h-4 w-[1px] bg-cyan-400/35" />
          </div>

          {nearestStation && (
            <div className="mt-8 pointer-events-auto flex flex-col items-center gap-1.5 anim-popup">
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-3 px-5 py-2 rounded-2xl bg-[#040e24]/95 border border-cyan-400/60 shadow-2xl">
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
        <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 px-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-950/95 via-[#06241b]/95 to-cyan-950/95 border border-emerald-400/80 shadow-[0_0_50px_rgba(16,185,129,0.4)] flex items-center gap-4 anim-popup pointer-events-auto">
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
          className="absolute top-24 left-1/2 -translate-x-1/2 z-35 px-4 py-2 rounded-xl bg-[#051126]/95 border border-cyan-400/50 shadow-xl flex items-center gap-2 pointer-events-none anim-slide-down"
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
      {showJoystick && !activeStation && (
        <div className="absolute bottom-5 left-5 z-40 pointer-events-auto flex flex-col items-center select-none">
          <div
            className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#040e24]/90 to-[#020816]/95 border-2 border-cyan-400/50 flex items-center justify-center touch-none select-none shadow-[0_0_30px_rgba(0,240,255,0.25)]"
            onPointerDown={handleJoystickPointerDown}
            onPointerMove={handleJoystickPointerMove}
            onPointerUp={handleJoystickPointerUp}
            onPointerCancel={handleJoystickPointerUp}
            style={{ touchAction: 'none' }}
          >
            {/* Directional markers */}
            <span className="absolute top-1 text-[9px] font-mono font-black text-cyan-400 pointer-events-none">▲ W</span>
            <span className="absolute bottom-1 text-[9px] font-mono font-black text-cyan-400 pointer-events-none">▼ S</span>
            <span className="absolute left-1.5 text-[9px] font-mono font-black text-cyan-400 pointer-events-none">◄ A</span>
            <span className="absolute right-1.5 text-[9px] font-mono font-black text-cyan-400 pointer-events-none">► D</span>

            {/* Concentric inner guideline rings */}
            <div className="w-20 h-20 rounded-full border border-cyan-500/20 pointer-events-none" />
            <div className="absolute w-10 h-10 rounded-full border border-cyan-500/15 pointer-events-none" />

            {/* Floating Analog Thumb Stick Knob */}
            <div
              className="absolute w-14 h-14 rounded-full bg-gradient-to-br from-cyan-400 via-sky-500 to-blue-600 border-2 border-white shadow-[0_0_20px_rgba(0,240,255,0.8)] pointer-events-none flex items-center justify-center"
              style={{
                transform: `translate3d(${touchStick.x * 36}px, ${touchStick.y * 36}px, 0)`,
                transition: touchStickId.current ? 'none' : 'transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-white/90 shadow-sm" />
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold text-cyan-300 mt-1.5 tracking-wider uppercase drop-shadow">
            MOVE JOYSTICK
          </span>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* MOBILE TOUCH ACTION BUTTONS (BOTTOM RIGHT) */}
      {/* -------------------------------------------------------------------- */}
      {showJoystick && !activeStation && (
        <div className="absolute bottom-5 right-5 z-40 pointer-events-auto flex flex-col items-end gap-2.5 select-none">
          {nearestStation && (
            <button
              onClick={() => handleToggleStation(nearestStation.id)}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-600 text-slate-950 font-black text-xs tracking-wider uppercase shadow-[0_0_25px_rgba(0,240,255,0.9)] border-2 border-white active:scale-95 flex items-center gap-2 animate-pulse"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>INTERACT [E]</span>
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSprint}
              className={`px-3.5 py-3 rounded-2xl border text-xs font-mono font-bold shadow-xl active:scale-95 flex items-center gap-1.5 transition ${
                isSprinting
                  ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)]'
                  : 'bg-[#040e24]/95 border-slate-700 text-slate-300'
              }`}
              title="Toggle Sprint Run (Shift)"
            >
              <Footprints className="w-4 h-4" />
              <span className="text-[10px] font-bold">{isSprinting ? 'FAST' : 'WALK'}</span>
            </button>

            <button
              onClick={handleJump}
              className="px-4 py-3 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-cyan-400 text-white font-black text-xs shadow-xl active:scale-95 flex items-center gap-1.5"
              title="Jump (Space)"
            >
              <ArrowUp className="w-4 h-4" />
              <span className="text-[10px] font-bold">JUMP</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* PC KEYBOARD FUNCTION: TACTICAL ON-SCREEN KEYBOARD HUD (BOTTOM LEFT) */}
      {/* -------------------------------------------------------------------- */}
      {showKeyboardGuide && !showJoystick && !activeStation && (
        <div className="hidden md:flex absolute bottom-5 left-5 z-35 flex-col gap-1.5 p-3 rounded-2xl bg-[#040e24]/90 border border-cyan-500/30 shadow-2xl pointer-events-auto select-none">
          <div className="flex items-center justify-between gap-3 pb-1 border-b border-cyan-950">
            <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5 text-cyan-400" />
              PC KEYBOARD CONTROLS
            </span>
            <button
              onClick={() => setShowKeyboardGuide(false)}
              className="text-[9px] font-mono text-slate-400 hover:text-white px-1"
              title="Hide Keyboard HUD (K)"
            >
              [K] Hide
            </button>
          </div>

          {/* WASD & Action Keys Display with Real-Time Keypress Highlighting */}
          <div className="flex items-center gap-3 pt-1">
            {/* WASD cluster */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-75 ${
                  activeKeys['KeyW'] || activeKeys['ArrowUp']
                    ? 'bg-cyan-500 text-slate-950 border-white shadow-[0_0_14px_#00f0ff] scale-95'
                    : 'bg-[#06142c] border-cyan-800/60 text-slate-300'
                }`}
                title="Move Forward (W / ↑)"
              >
                W
              </div>
              <div className="flex items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-75 ${
                    activeKeys['KeyA'] || activeKeys['ArrowLeft']
                      ? 'bg-cyan-500 text-slate-950 border-white shadow-[0_0_14px_#00f0ff] scale-95'
                      : 'bg-[#06142c] border-cyan-800/60 text-slate-300'
                  }`}
                  title="Strafe Left (A / ←)"
                >
                  A
                </div>
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-75 ${
                    activeKeys['KeyS'] || activeKeys['ArrowDown']
                      ? 'bg-cyan-500 text-slate-950 border-white shadow-[0_0_14px_#00f0ff] scale-95'
                      : 'bg-[#06142c] border-cyan-800/60 text-slate-300'
                  }`}
                  title="Move Back (S / ↓)"
                >
                  S
                </div>
                <div
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center text-[10px] font-mono font-bold transition-all duration-75 ${
                    activeKeys['KeyD'] || activeKeys['ArrowRight']
                      ? 'bg-cyan-500 text-slate-950 border-white shadow-[0_0_14px_#00f0ff] scale-95'
                      : 'bg-[#06142c] border-cyan-800/60 text-slate-300'
                  }`}
                  title="Strafe Right (D / →)"
                >
                  D
                </div>
              </div>
            </div>

            {/* Action hotkey badges */}
            <div className="flex flex-col gap-1 text-[10px] font-mono">
              <div className="flex items-center gap-1">
                <div
                  className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all duration-75 ${
                    activeKeys['ShiftLeft'] || activeKeys['ShiftRight']
                      ? 'bg-amber-500 text-slate-950 border-amber-300 shadow-[0_0_12px_#f59e0b]'
                      : 'bg-[#06142c] border-slate-700 text-slate-300'
                  }`}
                >
                  SHIFT Sprint
                </div>
                <div
                  className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all duration-75 ${
                    activeKeys['Space']
                      ? 'bg-blue-500 text-white border-blue-300 shadow-[0_0_12px_#3b82f6]'
                      : 'bg-[#06142c] border-slate-700 text-slate-300'
                  }`}
                >
                  SPACE Jump
                </div>
              </div>

              <div className="flex items-center gap-1">
                <div
                  className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all duration-75 ${
                    activeKeys['KeyE']
                      ? 'bg-emerald-500 text-slate-950 border-emerald-300 shadow-[0_0_12px_#10b981]'
                      : 'bg-[#06142c] border-slate-700 text-slate-300'
                  }`}
                >
                  E Interact
                </div>
                <div
                  className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all duration-75 ${
                    activeKeys['Escape'] || activeKeys['KeyQ']
                      ? 'bg-rose-500 text-white border-rose-300 shadow-[0_0_12px_#f43f5e]'
                      : 'bg-[#06142c] border-slate-700 text-slate-300'
                  }`}
                >
                  ESC Exit
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* COLLAPSIBLE BOTTOM WORKSTATION DOCK */}
      {/* -------------------------------------------------------------------- */}
      <div
        className={`absolute bottom-3 left-1/2 -translate-x-1/2 z-30 w-full max-w-4xl px-3 transition-transform duration-300 ${
          isDockCollapsed ? 'translate-y-[calc(100%-2.2rem)]' : 'translate-y-0'
        }`}
      >
        <div className="rounded-2xl bg-[#040e24]/95 border border-cyan-500/40 shadow-2xl overflow-hidden">
          {/* Header Bar with Tabs & Collapse Toggle */}
          <div className="px-4 py-2 border-b border-cyan-950 flex items-center justify-between bg-[#030916]">
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-[calc(100%-120px)] sm:max-w-none">
              <button
                onClick={() => {
                  setDockTab('reagents');
                  setIsDockCollapsed(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  dockTab === 'reagents'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-cyan-500/10'
                }`}
              >
                <Droplet className="w-3.5 h-3.5" />
                <span>Reagents</span>
              </button>

              <button
                onClick={() => {
                  setDockTab('thermal');
                  setIsDockCollapsed(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  dockTab === 'thermal'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-amber-500/10'
                }`}
              >
                <Thermometer className="w-3.5 h-3.5" />
                <span>Thermal</span>
              </button>

              <button
                onClick={() => {
                  setDockTab('flame');
                  setIsDockCollapsed(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  dockTab === 'flame'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-emerald-500/10'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <span>Spectroscopy</span>
              </button>

              <button
                onClick={() => {
                  setDockTab('nuclear');
                  setIsDockCollapsed(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  dockTab === 'nuclear'
                    ? 'bg-fuchsia-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-fuchsia-500/10'
                }`}
              >
                <Atom className="w-3.5 h-3.5" />
                <span>Nuclear Core</span>
              </button>

              <button
                onClick={() => {
                  setDockTab('science');
                  setIsDockCollapsed(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  dockTab === 'science'
                    ? 'bg-cyan-400 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-cyan-400/10'
                }`}
              >
                <Dna className="w-3.5 h-3.5" />
                <span>BioScience Intel</span>
              </button>

              <button
                onClick={() => {
                  setDockTab('protocols');
                  setIsDockCollapsed(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
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
                title={isDockCollapsed ? 'Expand Dock (H)' : 'Collapse Dock (H)'}
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
                        {isHeating
                          ? burnerMode === 'roaring'
                            ? 'Ignited · Roaring Blue Oxidizing Flame (1100°C)'
                            : 'Ignited · Gentle Safety Yellow Flame (300°C)'
                          : 'Extinguished'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isHeating && (
                        <button
                          onClick={() => setBurnerMode((m) => (m === 'roaring' ? 'safety' : 'roaring'))}
                          className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-[#0f244a] text-cyan-300 hover:text-white border border-cyan-700/60 transition"
                          title="Switch Flame Type"
                        >
                          {burnerMode === 'roaring' ? 'BLUE ROAR' : 'YELLOW SAFETY'}
                        </button>
                      )}
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
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                    <span>Flask Temp: <strong className={temperature > 70 ? 'text-rose-400' : 'text-cyan-300'}>{temperature}°C</strong></span>
                    <div className="flex-1 bg-[#020610] h-2 rounded-full overflow-hidden border border-cyan-950">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-amber-500 to-rose-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, ((temperature - 20) / 95) * 100)}%` }}
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
                    Agitation generates a dynamic hydrodynamic liquid vortex funnel and accelerates stoichiometry.
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

            {/* TAB 4: ATOMIC & NUCLEAR REACTION BAY */}
            {dockTab === 'nuclear' && (
              <div className="space-y-3">
                {/* Nuclear Mode Switcher & Radiation Meter */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#020716] p-2 rounded-2xl border border-cyan-950">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setNuclearMode('fission');
                        setSelectedNuclearReaction(NUCLEAR_REACTIONS[0]);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                        nuclearMode === 'fission'
                          ? 'bg-cyan-500 text-slate-950 shadow-md'
                          : 'bg-[#061226] text-slate-300 hover:text-white'
                      }`}
                    >
                      <Atom className="w-3.5 h-3.5" />
                      <span>Fission Core</span>
                    </button>

                    <button
                      onClick={() => {
                        setNuclearMode('fusion');
                        setSelectedNuclearReaction(NUCLEAR_REACTIONS[2]);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                        nuclearMode === 'fusion'
                          ? 'bg-fuchsia-500 text-white shadow-md'
                          : 'bg-[#061226] text-slate-300 hover:text-white'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Tokamak Fusion</span>
                    </button>

                    <button
                      onClick={() => {
                        setNuclearMode('decay');
                        setSelectedNuclearReaction(NUCLEAR_REACTIONS[5]);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 ${
                        nuclearMode === 'decay'
                          ? 'bg-amber-500 text-slate-950 shadow-md'
                          : 'bg-[#061226] text-slate-300 hover:text-white'
                      }`}
                    >
                      <Radiation className="w-3.5 h-3.5" />
                      <span>Decay &amp; Isotopes</span>
                    </button>
                  </div>

                  {/* Geiger radiation rate readout & sound toggle */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-[#030916] border border-cyan-900/60 font-mono text-xs">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                      <span className="text-slate-400">Radiation:</span>
                      <strong className={radiationLevelUsv > 50 ? 'text-rose-400' : 'text-emerald-400'}>
                        {radiationLevelUsv} μSv/h
                      </strong>
                    </div>

                    <button
                      onClick={() => setIsGeigerAudioActive((g) => !g)}
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold border transition ${
                        isGeigerAudioActive
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-[#030916] border-slate-700 text-slate-400 hover:text-white'
                      }`}
                      title="Toggle Geiger audio clicks"
                    >
                      Geiger SFX: {isGeigerAudioActive ? 'ON' : 'OFF'}
                    </button>

                    <button
                      onClick={() => setIsNuclearInfoOpen(true)}
                      className="px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold bg-fuchsia-500/20 border border-fuchsia-400/60 text-fuchsia-300 hover:text-white transition flex items-center gap-1"
                      title="Open Atomic & Nuclear Information & Ideas Compendium"
                    >
                      <Sparkles className="w-3 h-3 text-fuchsia-400" />
                      <span>Info &amp; Ideas</span>
                    </button>
                  </div>
                </div>

                {/* MODE 1: NUCLEAR FISSION CORE */}
                {nuclearMode === 'fission' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Reaction Selection & Trigger */}
                    <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col justify-between gap-2.5">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                          Select Fission Isotope
                        </span>
                        <div className="space-y-1.5">
                          {NUCLEAR_REACTIONS.filter((r) => r.category === 'fission').map((r) => (
                            <button
                              key={r.id}
                              onClick={() => setSelectedNuclearReaction(r)}
                              className={`w-full p-2 rounded-xl text-left transition border ${
                                selectedNuclearReaction.id === r.id
                                  ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                                  : 'bg-[#030a18] border-cyan-950/70 text-slate-300 hover:border-cyan-800'
                              }`}
                            >
                              <strong className="block text-xs font-bold">{r.title}</strong>
                              <span className="text-[10px] font-mono text-cyan-300 block">{r.equation}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handlePulseNuclearReaction(selectedNuclearReaction)}
                        className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                          isNuclearPulsing
                            ? 'bg-cyan-400 text-slate-950 shadow-[0_0_20px_#00f0ff]'
                            : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg active:scale-95'
                        }`}
                      >
                        <Atom className="w-4 h-4" />
                        <span>{isNuclearPulsing ? 'CHERENKOV SURGE ACTIVE...' : 'INITIATE FISSION PULSE'}</span>
                      </button>
                    </div>

                    {/* Reactor Criticality & Control Rods */}
                    <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col justify-between gap-2.5">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold text-white">Cadmium Control Rods</span>
                          <span className="text-xs font-mono font-bold text-cyan-300">{controlRodDepth}% Inserted</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={controlRodDepth}
                          onChange={(e) => setControlRodDepth(parseInt(e.target.value, 10))}
                          className="w-full accent-cyan-400 cursor-pointer"
                        />
                        <div className="flex justify-between text-[9px] font-mono text-slate-400 mt-1">
                          <span>0% (Full Reactivity)</span>
                          <span>100% (SCRAM Shutdown)</span>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#030a18] border border-cyan-950 space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Multiplication Factor k_eff:</span>
                          <strong
                            className={
                              fissionMetrics.state === 'critical'
                                ? 'text-emerald-400'
                                : fissionMetrics.state === 'supercritical'
                                ? 'text-rose-400'
                                : 'text-amber-400'
                            }
                          >
                            {fissionMetrics.kEff} ({fissionMetrics.state.toUpperCase()})
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Thermal Output:</span>
                          <span className="text-white font-bold">{fissionMetrics.powerMW} MW_th</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Thermal Neutron Flux:</span>
                          <span className="text-cyan-300">{fissionMetrics.neutronFlux.toExponential(2)} n/cm²·s</span>
                        </div>
                      </div>
                    </div>

                    {/* Mass Defect & Energy E=mc² */}
                    <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                        Mass Defect &amp; Binding Energy (E=mc²)
                      </span>
                      <div className="space-y-1 text-xs">
                        <div className="p-2 rounded-xl bg-[#030a18] border border-cyan-950 font-mono text-[11px] space-y-1">
                          <div className="text-slate-300">
                            Reactants Mass: <strong className="text-white">236.052595 u</strong>
                          </div>
                          <div className="text-slate-300">
                            Products Mass: <strong className="text-white">235.835227 u</strong>
                          </div>
                          <div className="text-rose-300 font-bold">
                            Mass Defect Δm: +{selectedNuclearReaction.massDefectU} u
                          </div>
                          <div className="text-emerald-300 font-bold">
                            Energy Output Q: +{selectedNuclearReaction.energyMev} MeV ({selectedNuclearReaction.energyJoules.toExponential(3)} J)
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {selectedNuclearReaction.realWorldApplication}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE 2: TOKAMAK FUSION CORE */}
                {nuclearMode === 'fusion' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                    {/* Reaction Selection & Trigger */}
                    <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col justify-between gap-2.5">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider block mb-1">
                          Fusion Reactions (Plasma Confinement)
                        </span>
                        <div className="space-y-1.5">
                          {NUCLEAR_REACTIONS.filter((r) => r.category === 'fusion').map((r) => (
                            <button
                              key={r.id}
                              onClick={() => setSelectedNuclearReaction(r)}
                              className={`w-full p-2 rounded-xl text-left transition border ${
                                selectedNuclearReaction.id === r.id
                                  ? 'bg-fuchsia-500/20 border-fuchsia-400 text-white shadow-md'
                                  : 'bg-[#030a18] border-cyan-950/70 text-slate-300 hover:border-cyan-800'
                              }`}
                            >
                              <strong className="block text-xs font-bold">{r.title}</strong>
                              <span className="text-[10px] font-mono text-fuchsia-300 block">{r.equation}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => handlePulseNuclearReaction(selectedNuclearReaction)}
                        className={`w-full py-2.5 rounded-xl font-mono text-xs font-bold transition flex items-center justify-center gap-2 ${
                          isNuclearPulsing
                            ? 'bg-fuchsia-400 text-slate-950 shadow-[0_0_20px_#d946ef]'
                            : 'bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white shadow-lg active:scale-95'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                        <span>{isNuclearPulsing ? 'MAGNETIC CONFINEMENT BURST...' : 'IGNITE FUSION PLASMA'}</span>
                      </button>
                    </div>

                    {/* Magnetic Confinement & Heating Controls */}
                    <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col justify-between gap-2.5">
                      <div className="space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-white font-bold">Toroidal B-Field:</span>
                            <span className="font-mono text-fuchsia-300 font-bold">{magneticFieldTesla.toFixed(1)} Tesla</span>
                          </div>
                          <input
                            type="range"
                            min="2"
                            max="16"
                            step="0.5"
                            value={magneticFieldTesla}
                            onChange={(e) => setMagneticFieldTesla(parseFloat(e.target.value))}
                            className="w-full accent-fuchsia-500 cursor-pointer"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-white font-bold">RF &amp; Neutral Beam Power:</span>
                            <span className="font-mono text-fuchsia-300 font-bold">{auxHeatingPowerMW} MW</span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={auxHeatingPowerMW}
                            onChange={(e) => setAuxHeatingPowerMW(parseInt(e.target.value, 10))}
                            className="w-full accent-fuchsia-500 cursor-pointer"
                          />
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#030a18] border border-cyan-950 space-y-1 font-mono text-[11px]">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Plasma Temperature:</span>
                          <strong className="text-fuchsia-400">{fusionMetrics.plasmaTempMillionK} Million K</strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Fusion Energy Gain Q:</span>
                          <strong className={fusionMetrics.ignitionAchieved ? 'text-emerald-400' : 'text-amber-300'}>
                            Q = {fusionMetrics.qFactor} ({fusionMetrics.ignitionAchieved ? 'IGNITION' : 'BREAKEVEN PROGRESS'})
                          </strong>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Lawson Triple Product:</span>
                          <span className="text-cyan-300">{fusionMetrics.lawsonTripleProduct} × 10²⁰ keV·s/m³</span>
                        </div>
                      </div>
                    </div>

                    {/* Scientific Mechanism */}
                    <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col justify-between gap-2 text-xs">
                      <span className="text-[10px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider block">
                        Quantum Tunneling &amp; Coulomb Barrier
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {selectedNuclearReaction.scientificMechanism}
                      </p>
                      <div className="p-2 rounded-xl bg-[#030a18] border border-cyan-950 font-mono text-[10px] text-slate-400">
                        {selectedNuclearReaction.operatingCondition}
                      </div>
                    </div>
                  </div>
                )}

                {/* MODE 3: RADIOACTIVE DECAY & ISOTOPES */}
                {nuclearMode === 'decay' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {NUCLEAR_REACTIONS.filter((r) => r.category === 'decay').map((r) => {
                      const isSelected = selectedNuclearReaction.id === r.id;
                      return (
                        <button
                          key={r.id}
                          onClick={() => handlePulseNuclearReaction(r)}
                          className={`p-3 rounded-2xl border text-left transition ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg'
                              : 'bg-[#061226] border-cyan-950 text-slate-300 hover:border-cyan-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono font-bold text-amber-400 uppercase">
                              {r.radiationType.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] font-mono text-emerald-400 font-bold">+{r.energyMev} MeV</span>
                          </div>
                          <strong className="block text-xs font-bold text-white mb-1">{r.title}</strong>
                          <span className="text-[10px] font-mono text-cyan-300 block mb-1.5">{r.equation}</span>
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                            {r.realWorldApplication}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 5: BIOSCIENCE & CHEMICAL INTELLIGENCE (POWERED BY SCIENCE SKILLS) */}
            {dockTab === 'science' && (
              <div className="space-y-3">
                {/* Search Header Bar with PubChem / RCSB live query */}
                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#020716] p-2 rounded-2xl border border-cyan-950">
                  <div className="flex-1 min-w-[260px] flex items-center gap-1.5 bg-[#030916] px-3 py-1.5 rounded-xl border border-cyan-900/60">
                    <Search className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <input
                      type="text"
                      value={scienceSearchQuery}
                      onChange={(e) => setScienceSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearchScienceCompound()}
                      placeholder="Query PubChem / RCSB PDB (e.g. Aspirin, Dopamine, Penicillin, FDG, Caffeine, ATP)..."
                      className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none font-mono"
                    />
                    <button
                      onClick={() => handleSearchScienceCompound()}
                      disabled={isScienceSearching}
                      className="px-3 py-1 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-[11px] font-bold transition flex-shrink-0"
                    >
                      {isScienceSearching ? 'Querying...' : 'Search'}
                    </button>
                  </div>

                  {/* Sub-tab pills */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setScienceSubTab('pubchem')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                        scienceSubTab === 'pubchem'
                          ? 'bg-cyan-500 text-slate-950'
                          : 'bg-[#061226] text-slate-300 hover:text-white'
                      }`}
                    >
                      PubChem Structure
                    </button>
                    <button
                      onClick={() => setScienceSubTab('ideas')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                        scienceSubTab === 'ideas'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-[#061226] text-slate-300 hover:text-white'
                      }`}
                    >
                      Synthesis Ideas
                    </button>
                    <button
                      onClick={() => setScienceSubTab('pdb')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                        scienceSubTab === 'pdb'
                          ? 'bg-purple-500 text-white'
                          : 'bg-[#061226] text-slate-300 hover:text-white'
                      }`}
                    >
                      PDB Macromolecules
                    </button>
                  </div>
                </div>

                {/* Quick Selection Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                  <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">Quick Analytes:</span>
                  {Object.values(CURATED_SCIENCE_COMPOUNDS).map((item) => (
                    <button
                      key={item.cid}
                      onClick={() => {
                        setScienceCompound(item);
                        setScienceSearchQuery(item.name.split(' ')[0]);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition whitespace-nowrap flex-shrink-0 border ${
                        scienceCompound.cid === item.cid
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                          : 'bg-[#040e24] border-cyan-950 text-slate-300 hover:border-cyan-800'
                      }`}
                    >
                      {item.name.split(' ')[0]} ({item.molecularFormula})
                    </button>
                  ))}
                </div>

                {/* SUBTAB 1: PUBCHEM STRUCTURE & PROPERTIES */}
                {scienceSubTab === 'pubchem' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Structure 2D depiction from PubChem PUG REST API */}
                    <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col items-center justify-center text-center">
                      <div className="w-40 h-40 rounded-xl bg-white/95 p-2 flex items-center justify-center overflow-hidden shadow-inner mb-2">
                        <img
                          src={scienceCompound.structureImageUrl}
                          alt={scienceCompound.name}
                          className="max-w-full max-h-full object-contain filter contrast-125"
                          loading="lazy"
                          onError={(e) => {
                            // Fallback if network blocked
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <strong className="text-xs font-bold text-white block">{scienceCompound.name}</strong>
                      <span className="text-[10px] font-mono text-cyan-400 block">PubChem CID: {scienceCompound.cid}</span>
                    </div>

                    {/* Physicochemical Parameters */}
                    <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                          Physicochemical Parameters
                        </span>
                        <div className="space-y-1 font-mono text-[11px] p-2.5 rounded-xl bg-[#030a18] border border-cyan-950">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Formula:</span>
                            <span className="text-white font-bold">{scienceCompound.molecularFormula}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Molar Mass:</span>
                            <span className="text-white font-bold">{scienceCompound.molecularWeight} g/mol</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">XLogP (Lipophilicity):</span>
                            <span className="text-cyan-300">{scienceCompound.xLogP ?? 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">TPSA (Polar Surface Area):</span>
                            <span className="text-cyan-300">{scienceCompound.tpsa ?? 'N/A'} Å²</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">H-Bond Donors / Acceptors:</span>
                            <span className="text-white">{scienceCompound.hBondDonorCount ?? 0} / {scienceCompound.hBondAcceptorCount ?? 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-2 rounded-xl bg-[#030a18] border border-cyan-950 font-mono text-[10px] truncate text-slate-300" title={scienceCompound.canonicalSmiles}>
                        <span className="text-cyan-400 font-bold">SMILES: </span>
                        {scienceCompound.canonicalSmiles}
                      </div>
                    </div>

                    {/* Biological Action & Safety */}
                    <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">
                          Mechanism of Action
                        </span>
                        <p className="text-slate-300 text-[11px] leading-relaxed mb-2">
                          {scienceCompound.biologicalAction}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#030a18] border border-cyan-950 text-[10px]">
                        <span className="text-amber-400 font-bold block mb-0.5">GHS Classification:</span>
                        <p className="text-slate-400">{scienceCompound.ghsClassification}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 2: SYNTHESIS & REACTION IDEAS GENERATOR */}
                {scienceSubTab === 'ideas' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 space-y-2">
                      <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider block">
                        Target Synthesis Protocol for {scienceCompound.name}
                      </span>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {scienceCompound.synthesisIdea}
                      </p>
                      <div className="p-2.5 rounded-xl bg-[#030a18] border border-cyan-950 font-mono text-[10px] text-slate-400 space-y-1">
                        <span className="text-cyan-400 font-bold block">Experiment Recommendation:</span>
                        <p>1. Transfer stoichiometric equivalents to Sector 1 Wet Synthesis Flask.</p>
                        <p>2. Set magnetic stirrer to 600 RPM to optimize mass transport kinetics.</p>
                        <p>3. Apply gentle Bunsen heating up to activation barrier temperature.</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 space-y-2">
                      <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                        Molecular Idea Generator
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        Combine this compound with acid/base reagents or transition metal catalysts to observe colorimetric shifts, precipitate crystallization, and exothermic kinetics.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[10px]">
                        <div className="p-2 rounded-xl bg-[#030a18] border border-cyan-950">
                          <strong className="text-cyan-300 block mb-0.5">Aqueous Esterification</strong>
                          <span className="text-slate-400">Alcohol + Carboxylic Acid ⟹ Sweet aroma esters</span>
                        </div>
                        <div className="p-2 rounded-xl bg-[#030a18] border border-cyan-950">
                          <strong className="text-purple-300 block mb-0.5">Heavy Water Exchange</strong>
                          <span className="text-slate-400">D₂O isotopic substitution in nuclear coolant</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* SUBTAB 3: RCSB PDB MACROMOLECULAR STRUCTURES */}
                {scienceSubTab === 'pdb' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {NOTABLE_PDB_STRUCTURES.map((pdb) => {
                      const isSelected = selectedPdb.pdbId === pdb.pdbId;
                      return (
                        <button
                          key={pdb.pdbId}
                          onClick={() => setSelectedPdb(pdb)}
                          className={`p-3 rounded-2xl border text-left transition ${
                            isSelected
                              ? 'bg-purple-500/20 border-purple-400 text-white shadow-lg'
                              : 'bg-[#061226] border-cyan-950 text-slate-300 hover:border-cyan-800'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-mono font-bold text-purple-400">PDB: {pdb.pdbId}</span>
                            <span className="text-[9px] font-mono text-cyan-300">{pdb.resolution ? `${pdb.resolution} Å` : 'NMR'}</span>
                          </div>
                          <strong className="block text-xs font-bold text-white mb-1 line-clamp-1">{pdb.title}</strong>
                          <span className="text-[10px] font-mono text-slate-400 block mb-1">{pdb.organism}</span>
                          <p className="text-[10px] text-slate-400 line-clamp-2 leading-tight">
                            {pdb.biologicalSignificance}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 6: SYNTHESIS PROTOCOLS */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 pointer-events-auto">
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
      {/* ATOMIC & NUCLEAR REACTIONS INFORMATION & IDEAS COMPENDIUM MODAL */}
      {/* -------------------------------------------------------------------- */}
      {isNuclearInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md pointer-events-auto anim-fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-[#050f24] border border-fuchsia-500/50 p-6 sm:p-8 shadow-[0_0_80px_rgba(217,70,239,0.35)] relative max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-fuchsia-950/80 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-fuchsia-500/20 border border-fuchsia-400/50 flex items-center justify-center text-fuchsia-300">
                  <Atom className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-fuchsia-400 uppercase">
                    CHEMORA SCIENTIFIC COMPENDIUM
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black text-white">
                    Atomic &amp; Nuclear Reactions: Information &amp; Ideas
                  </h3>
                </div>
              </div>

              <button
                onClick={() => setIsNuclearInfoOpen(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white transition hover:bg-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 py-3 border-b border-cyan-950 overflow-x-auto no-scrollbar flex-shrink-0">
              <button
                onClick={() => setNuclearInfoTab('fission')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  nuclearInfoTab === 'fission'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-[#030916] text-slate-300 hover:text-white hover:bg-cyan-950/40'
                }`}
              >
                <Atom className="w-3.5 h-3.5" />
                <span>Nuclear Fission &amp; Criticality</span>
              </button>

              <button
                onClick={() => setNuclearInfoTab('fusion')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  nuclearInfoTab === 'fusion'
                    ? 'bg-fuchsia-500 text-white shadow-md'
                    : 'bg-[#030916] text-slate-300 hover:text-white hover:bg-fuchsia-950/40'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Tokamak Fusion &amp; Plasma</span>
              </button>

              <button
                onClick={() => setNuclearInfoTab('decay')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  nuclearInfoTab === 'decay'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-[#030916] text-slate-300 hover:text-white hover:bg-amber-950/40'
                }`}
              >
                <Radiation className="w-3.5 h-3.5" />
                <span>Decay, Half-Life &amp; PET</span>
              </button>

              <button
                onClick={() => setNuclearInfoTab('bioscience')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  nuclearInfoTab === 'bioscience'
                    ? 'bg-purple-500 text-white shadow-md'
                    : 'bg-[#030916] text-slate-300 hover:text-white hover:bg-purple-950/40'
                }`}
              >
                <Dna className="w-3.5 h-3.5" />
                <span>BioScience &amp; Synthesis Ideas</span>
              </button>
            </div>

            {/* Modal Body Content */}
            <div className="overflow-y-auto py-4 pr-1 space-y-4 text-xs text-slate-300 leading-relaxed">
              {/* TAB 1: FISSION */}
              {nuclearInfoTab === 'fission' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#020716] border border-cyan-900/60 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 tracking-wider uppercase block">
                      Core Nuclear Fission Principle
                    </span>
                    <div className="p-3 rounded-xl bg-[#051126] border border-cyan-500/30 font-mono text-cyan-200 text-xs sm:text-sm">
                      n + ²³⁵₉₂U → ²³⁶₉₂U* → ¹⁴¹₅₆Ba + ⁹²₃₆Kr + 3n + 202.5 MeV
                    </div>
                    <p>
                      When a thermal neutron is absorbed by Uranium-235, the resulting compound nucleus oscillates violently like an unstable liquid drop. The electrostatic Coulomb repulsion between protons overcomes the strong nuclear force, splitting the nucleus into Ba-141 and Kr-92, releasing an average of 2.43 fast neutrons.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#020716] border border-cyan-950 space-y-1.5">
                      <strong className="text-white text-xs block font-mono">Mass Defect &amp; E=mc²</strong>
                      <p className="text-[11px] text-slate-400">
                        Reactants mass (236.0526 u) exceeds product fragments mass (235.8352 u). The missing mass defect (Δm = 0.217368 u) is converted instantaneously into 202.5 MeV kinetic energy and Cherenkov gamma radiation.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#020716] border border-cyan-950 space-y-1.5">
                      <strong className="text-white text-xs block font-mono">Reactor Criticality (k_eff)</strong>
                      <p className="text-[11px] text-slate-400">
                        • <strong>k_eff &lt; 1.0:</strong> Subcritical (reaction dies out).<br />
                        • <strong>k_eff = 1.000:</strong> Critical (stable steady-state power).<br />
                        • <strong>k_eff &gt; 1.0:</strong> Supercritical (exponential surge). Cadmium rods absorb thermal neutrons to maintain exact criticality.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#08152a] border border-cyan-500/25">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                      Ideas &amp; Research Directions
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                      <li><strong>Thorium-232 Fuel Cycle:</strong> Fertile ²³²Th breeds fissile ²³³U, producing minimal transuranic waste with passive walk-away safety.</li>
                      <li><strong>Delayed Neutron Control:</strong> The 0.65% fraction of delayed neutrons from fission precursors provides seconds of mechanical latency for control rod insertion.</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setIsNuclearInfoOpen(false);
                      setNuclearMode('fission');
                      setDockTab('nuclear');
                      setIsDockCollapsed(false);
                      handleFastTravel('nuclear');
                    }}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs font-mono transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Atom className="w-4 h-4" />
                    <span>Launch Fission Simulator in 3D Sector 6 →</span>
                  </button>
                </div>
              )}

              {/* TAB 2: FUSION */}
              {nuclearInfoTab === 'fusion' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#020716] border border-fuchsia-900/60 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-fuchsia-400 tracking-wider uppercase block">
                      Thermonuclear Tokamak Fusion
                    </span>
                    <div className="p-3 rounded-xl bg-[#140520] border border-fuchsia-500/30 font-mono text-fuchsia-200 text-xs sm:text-sm">
                      ²₁H (Deuterium) + ³₁H (Tritium) → ⁴₂He (3.5 MeV) + n (14.1 MeV) + 17.6 MeV
                    </div>
                    <p>
                      Light hydrogen isotopes fuse under extreme temperature and pressure by penetrating the positive electrostatic Coulomb repulsion barrier through quantum mechanical tunneling. D-T fusion offers the highest cross-section at achievable temperatures (~150 Million K).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#020716] border border-fuchsia-950 space-y-1.5">
                      <strong className="text-white text-xs block font-mono">Toroidal Magnetic Confinement</strong>
                      <p className="text-[11px] text-slate-400">
                        High-temperature plasma consists of free deuterons and electrons. High magnetic fields (8–16 Tesla) force charged particles onto helical paths around the doughnut-shaped torus, preventing wall collisions.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#020716] border border-fuchsia-950 space-y-1.5">
                      <strong className="text-white text-xs block font-mono">Lawson Triple Product &amp; Q Gain</strong>
                      <p className="text-[11px] text-slate-400">
                        Ignition requires density × temperature × energy confinement time &gt; 3×10²¹ keV·s/m³. Energy gain Q = P_fusion / P_heating. Q &gt; 1 achieves scientific breakeven; Q &gt; 10 achieves self-sustaining alpha heating.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-[#140520] border border-fuchsia-500/25">
                    <span className="text-[10px] font-mono font-bold text-fuchsia-400 uppercase tracking-wider block mb-1">
                      Ideas &amp; Research Directions
                    </span>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
                      <li><strong>Aneutronic Fusion (p-¹¹B):</strong> Proton-Boron-11 produces three alpha particles with zero fast neutrons, avoiding material activation.</li>
                      <li><strong>High-Temperature Superconductors (REBCO):</strong> Rare-earth barium copper oxide tapes enable compact, high-field (20T) magnetic fusion reactors.</li>
                    </ul>
                  </div>

                  <button
                    onClick={() => {
                      setIsNuclearInfoOpen(false);
                      setNuclearMode('fusion');
                      setDockTab('nuclear');
                      setIsDockCollapsed(false);
                      handleFastTravel('nuclear');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-500 to-purple-600 hover:from-fuchsia-400 hover:to-purple-500 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Ignite Tokamak Fusion Core in 3D Sector 6 →</span>
                  </button>
                </div>
              )}

              {/* TAB 3: DECAY */}
              {nuclearInfoTab === 'decay' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#020716] border border-amber-900/60 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-amber-400 tracking-wider uppercase block">
                      Radioactive Decay Modes &amp; Applications
                    </span>
                    <p>
                      Unstable radionuclides decay toward nuclear stability via distinct particle emissions governed by the weak force and quantum barrier tunneling. Half-life equation: N(t) = N₀ · (1/2)^(t / t₁/₂).
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-[#040e24] border border-amber-500/30">
                      <span className="text-amber-400 font-mono font-bold text-[11px] block">Alpha (α) Decay</span>
                      <strong className="text-white text-xs block font-mono">²⁴¹₉₅Am → ²³⁷₉₃Np + ⁴₂He + 5.64 MeV</strong>
                      <p className="text-[10px] text-slate-400 mt-1">
                        High ionizing power, low penetration. Used in residential ionization smoke detectors; ionizes chamber air to detect combustion soot.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#040e24] border border-amber-500/30">
                      <span className="text-cyan-400 font-mono font-bold text-[11px] block">Beta-Minus (β⁻) Decay</span>
                      <strong className="text-white text-xs block font-mono">¹⁴₆C → ¹⁴₇N + e⁻ + ν̄_e + 0.156 MeV</strong>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Quark transformation d → u. Half-life of 5,730 years enables accurate carbon-14 radiometric dating of biological organic artifacts.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#040e24] border border-fuchsia-500/30">
                      <span className="text-fuchsia-400 font-mono font-bold text-[11px] block">Positron (β⁺) Emission</span>
                      <strong className="text-white text-xs block font-mono">¹⁸₉F → ¹⁸₈O + e⁺ + ν_e + 0.634 MeV</strong>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Emits positron that annihilates with tissue electron, creating two 511 keV collinear photons. Cornerstone of oncological PET imaging with [¹⁸F]-FDG.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#040e24] border border-emerald-500/30">
                      <span className="text-emerald-400 font-mono font-bold text-[11px] block">Gamma (γ) Isomeric Transition</span>
                      <strong className="text-white text-xs block font-mono">⁹⁹ᵐ₄₃Tc → ⁹⁹₄₃Tc + γ (140.5 keV)</strong>
                      <p className="text-[10px] text-slate-400 mt-1">
                        Metastable nuclear excited state de-excites without particle emission. Ideal 6-hour half-life used in 80% of all hospital diagnostic scans.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsNuclearInfoOpen(false);
                      setNuclearMode('decay');
                      setDockTab('nuclear');
                      setIsDockCollapsed(false);
                      handleFastTravel('nuclear');
                    }}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Radiation className="w-4 h-4" />
                    <span>Run Radioactive Decay Simulations in 3D Sector 6 →</span>
                  </button>
                </div>
              )}

              {/* TAB 4: BIOSCIENCE */}
              {nuclearInfoTab === 'bioscience' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-[#020716] border border-purple-900/60 space-y-2">
                    <span className="text-[10px] font-mono font-bold text-purple-400 tracking-wider uppercase block">
                      BioScience Intel &amp; Live PubChem Query
                    </span>
                    <p>
                      CHEMORA integrates directly with the official NIH PubChem PUG REST database and RCSB Protein Data Bank. Search or inspect any molecule to view authentic 2D skeletal structures, molecular formulas, SMILES notations, and biochemical mechanisms of action.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl bg-[#040e24] border border-cyan-950 space-y-1">
                      <strong className="text-cyan-300 text-xs block font-mono">Kinetic Isotope Effect in Pharmacology</strong>
                      <p className="text-[11px] text-slate-400">
                        Replacing hydrogen with deuterium (²H) forms a stronger C-D bond, slowing down cytochrome P450 CYP2D6 metabolic cleavage and extending drug half-life (e.g. Deutetrabenazine).
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#040e24] border border-cyan-950 space-y-1">
                      <strong className="text-cyan-300 text-xs block font-mono">Targeted Alpha Radiopharmaceuticals</strong>
                      <p className="text-[11px] text-slate-400">
                        Actinium-225 (²²⁵Ac) and Radium-223 (²²³Ra) conjugated to PSMA monoclonal antibodies deliver high-LET alpha particles directly to cancer cells while sparing healthy tissue.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-2xl bg-[#030916] border border-purple-900/40">
                    <span className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-wider block mb-1.5">
                      Quick Compound Lookups Available in Dock
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {['Aspirin', 'Caffeine', 'Dopamine', 'Penicillin G', 'FDG PET Tracer', 'ATP Adenosine Triphosphate'].map((c) => (
                        <span key={c} className="px-2.5 py-1 rounded-lg bg-[#08152a] border border-cyan-900/60 text-cyan-300 text-[10px] font-mono">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setIsNuclearInfoOpen(false);
                      setDockTab('science');
                      setIsDockCollapsed(false);
                      handleFastTravel('mainframe');
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs font-mono transition flex items-center justify-center gap-2 shadow-lg"
                  >
                    <Dna className="w-4 h-4" />
                    <span>Open BioScience Intel Station in Mainframe →</span>
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-cyan-950 flex items-center justify-between text-xs font-mono text-slate-400 flex-shrink-0">
              <span>CHEMORA Science Engine · Grounded in PubChem &amp; RCSB PDB</span>
              <button
                onClick={() => setIsNuclearInfoOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* CONTROLS GUIDE MODAL */}
      {/* -------------------------------------------------------------------- */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 pointer-events-auto">
          <div className="w-full max-w-md rounded-3xl bg-[#040e24] border border-cyan-500/40 p-6 shadow-2xl relative">
            <button
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <span>CHEMORA 3D Lab Controls &amp; Shortcuts</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">High-performance 60FPS exploration across desktop and mobile.</p>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-[#020816] border border-cyan-950">
                <strong className="text-cyan-300 block mb-1">PC / Computer Keyboard &amp; Mouse</strong>
                <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                  <li>• <strong className="text-rose-400">ESC or Q / Exit Button:</strong> Exit 3D Lab game back to CHEMORA Dashboard</li>
                  <li>• <strong className="text-white">W, A, S, D / Arrows:</strong> Walk &amp; strafe</li>
                  <li>• <strong className="text-white">Shift:</strong> Hold to sprint (6.4 m/s)</li>
                  <li>• <strong className="text-white">Space:</strong> Jump with gravity physics</li>
                  <li>• <strong className="text-white">Mouse Click &amp; Drag:</strong> 360° first-person/third-person camera look</li>
                  <li>• <strong className="text-white">E:</strong> Interact with nearest workstation / Free roam toggle</li>
                  <li>• <strong className="text-white">K:</strong> Show / hide PC Keyboard tactical on-screen HUD</li>
                  <li>• <strong className="text-white">1 - 6:</strong> Instant teleport to any of the 6 lab sectors (1: Synthesis, 2: Spectroscopy, 3: Cryo, 4: Mainframe, 5: Observation, 6: Nuclear Core)</li>
                  <li>• <strong className="text-white">P:</strong> Toggle Performance mode (Smooth 60FPS / Balanced / Cinematic)</li>
                  <li>• <strong className="text-white">H:</strong> Collapse / Expand bottom experiment dock</li>
                  <li>• <strong className="text-white">F:</strong> Toggle Flashlight / UV lamp</li>
                  <li>• <strong className="text-white">V:</strong> Toggle 1st / 3rd Person camera perspective</li>
                  <li>• <strong className="text-white">R:</strong> Rinse &amp; sanitize reaction flask at bench</li>
                  <li>• <strong className="text-white">M:</strong> Toggle facility radar map</li>
                </ul>
              </div>

              <div className="p-3 rounded-2xl bg-[#020816] border border-cyan-950">
                <strong className="text-emerald-300 block mb-1">Phone &amp; Tablet Mobile Controls</strong>
                <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                  <li>• <strong className="text-white">Virtual Analog Joystick:</strong> Smooth 360° analog thumb stick (bottom-left)</li>
                  <li>• <strong className="text-white">Right Screen Swipe:</strong> Fluid camera yaw &amp; pitch rotation</li>
                  <li>• <strong className="text-white">INTERACT [E]:</strong> High-visibility action button near workstations</li>
                  <li>• <strong className="text-white">JUMP &amp; FAST RUN:</strong> Dedicated touch buttons with instant response</li>
                  <li>• <strong className="text-white">Joystick Toggle:</strong> Click gamepad icon in top bar to show/hide anytime</li>
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
