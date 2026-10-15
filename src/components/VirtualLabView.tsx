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
  BookOpen,
  Zap,
  Activity,
  CheckCircle2,
  Camera,
  Layers,
  Scale
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddedReagentEntry {
  reagentId: string;
  amount: number;
  addedAt: number;
}

export const VirtualLabView: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  // Sound toggle
  const [isMuted, setIsMuted] = useState(false);

  // Active dock tab & drawer collapse
  const [dockTab, setDockTab] = useState<'reagents' | 'thermal' | 'flame' | 'protocols'>('reagents');
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [dispenseAmount, setDispenseAmount] = useState<number>(20); // mL or g

  // Laboratory state
  const [addedReagents, setAddedReagents] = useState<AddedReagentEntry[]>([]);
  const [vesselVolume, setVesselVolume] = useState<number>(0);
  const [vesselMass, setVesselMass] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(22);
  const [isHeating, setIsHeating] = useState(false);
  const [stirrerRPM, setStirrerRPM] = useState<number>(0);
  const [discoveredProtocols, setDiscoveredProtocols] = useState<string[]>([]);
  const [currentDiscoveredNotice, setCurrentDiscoveredNotice] = useState<ReactionProtocol | null>(null);

  // Animated Action Toast Popup & Protocol Inspector Modal
  const [actionToast, setActionToast] = useState<{ id: string; text: string; sub?: string; color?: string } | null>(null);
  const [inspectingProtocol, setInspectingProtocol] = useState<ReactionProtocol | null>(null);

  // Flame test station state
  const [selectedFlameElement, setSelectedFlameElement] = useState<FlameElement | null>(null);
  const [isFlameRodInBurner, setIsFlameRodInBurner] = useState(false);

  // Observation log
  const [logs, setLogs] = useState<string[]>([
    '3D Chemistry Workstation ready.',
    'Epoxy laboratory bench sanitized and Erlenmeyer reaction flask primed.',
  ]);

  // Three.js mutable references
  const threeState = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    liquidMesh: THREE.Mesh;
    liquidMaterial: THREE.MeshPhysicalMaterial;
    precipitateMesh: THREE.Mesh;
    precipitateMaterial: THREE.MeshStandardMaterial;
    bubbleParticles: THREE.Points;
    glowLight: THREE.PointLight;
    flameLight: THREE.PointLight;
    bunsenInnerFlame: THREE.Mesh;
    bunsenOuterFlame: THREE.Mesh;
    stirBar: THREE.Mesh;
    sampleRod: THREE.Group;
    targetCameraPos: THREE.Vector3;
    targetLookAt: THREE.Vector3;
    currentLookAt: THREE.Vector3;
    isDragging: boolean;
    prevMousePos: { x: number; y: number };
    spherical: { radius: number; theta: number; phi: number };
    animFrameId: number;
  } | null>(null);

  // Toggle sound
  const handleToggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    labAudio.setMuted(next);
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

    // Default or calculated color
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
      // Blend based on last reagents
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

  // Check for newly unlocked protocol
  useEffect(() => {
    if (reactionStatus.activeProtocol) {
      const proto = reactionStatus.activeProtocol;
      if (!discoveredProtocols.includes(proto.id)) {
        setDiscoveredProtocols((prev) => [...prev, proto.id]);
        setCurrentDiscoveredNotice(proto);
        labAudio.playReactionDiscovery();
        try {
          confetti({ particleCount: 60, spread: 75, origin: { y: 0.6 } });
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
            if (next === 68) {
              setLogs((p) => ['Reaction solution reaching 68°C. Thermal excitation active.', ...p.slice(0, 8)]);
            } else if (next === 100) {
              setLogs((p) => ['Vessel reached boiling temperature (100°C). Vigorous vapor evolution.', ...p.slice(0, 8)]);
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

  // Add reagent action
  const handleAddReagent = (reagent: ChemicalReagent) => {
    if (vesselVolume >= 120) {
      setLogs((p) => ['Warning: Reaction flask maximum capacity reached! Rinse vessel before adding more.', ...p.slice(0, 8)]);
      setActionToast({
        id: String(Date.now()),
        text: 'Vessel Capacity Limit (120 mL)',
        sub: 'Please rinse flask to synthesize new compounds',
        color: '#f43f5e',
      });
      return;
    }

    labAudio.playGlassClink();
    setTimeout(() => labAudio.playLiquidPour(), 100);

    const addedVol = reagent.state === 'solid' ? dispenseAmount / reagent.density : dispenseAmount;
    const addedM = reagent.state === 'solid' ? dispenseAmount : dispenseAmount * reagent.density;

    setVesselVolume((v) => Math.min(120, Math.round((v + addedVol) * 10) / 10));
    setVesselMass((m) => Math.round((m + addedM) * 10) / 10);
    setAddedReagents((prev) => [
      ...prev,
      { reagentId: reagent.id, amount: dispenseAmount, addedAt: Date.now() },
    ]);

    setActionToast({
      id: String(Date.now()),
      text: `+ ${dispenseAmount}${reagent.state === 'solid' ? 'g' : 'mL'} ${reagent.name}`,
      sub: reagent.formula,
      color: reagent.color,
    });

    setLogs((prev) => [
      `Dispensed ${dispenseAmount}${reagent.state === 'solid' ? 'g' : 'mL'} of ${reagent.name} (${reagent.formula}) into reaction flask.`,
      ...prev.slice(0, 8),
    ]);
  };

  // Toggle burner
  const handleToggleBurner = () => {
    setIsHeating((prev) => {
      const next = !prev;
      setActionToast({
        id: String(Date.now()),
        text: next ? 'Bunsen Burner Ignited' : 'Burner Extinguished',
        sub: next ? 'Heating to 95°C' : 'Cooling to room temperature',
        color: next ? '#f59e0b' : '#38bdf8',
      });
      setLogs((p) => [
        next ? 'Bunsen burner ignited with non-luminous blue heating flame.' : 'Bunsen burner extinguished. Cooling to room temperature.',
        ...p.slice(0, 8),
      ]);
      return next;
    });
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

  // Camera Presets
  const handleSetCameraPreset = useCallback((preset: 'bench' | 'flask' | 'burner' | 'top') => {
    if (!threeState.current) return;
    const { targetCameraPos, targetLookAt } = threeState.current;

    switch (preset) {
      case 'flask':
        targetCameraPos.set(0, 1.8, 2.2);
        targetLookAt.set(0, 1.2, 0);
        break;
      case 'burner':
        targetCameraPos.set(1.4, 1.6, 2.0);
        targetLookAt.set(0.9, 1.1, 0);
        break;
      case 'top':
        targetCameraPos.set(0, 4.2, 0.5);
        targetLookAt.set(0, 1.0, 0);
        break;
      case 'bench':
      default:
        targetCameraPos.set(0, 2.8, 4.5);
        targetLookAt.set(0, 1.0, 0);
        break;
    }
  }, []);

  // THREE.JS INITIALIZATION & LIFECYCLE
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060c18);
    scene.fog = new THREE.FogExp2(0x060c18, 0.08);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 50);
    camera.position.set(0, 2.8, 4.5);

    // 2. Renderer with PBR color pipeline
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Environment Reflection via RoomEnvironment
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 4. Lighting Rig
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 0.4);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x0f172a, 0.6);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
    keyLight.position.set(3, 6, 4);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x0284c7, 0.9);
    rimLight.position.set(-4, 3, -2);
    scene.add(rimLight);

    // Dynamic reaction glow light
    const glowLight = new THREE.PointLight(0x38bdf8, 0, 4);
    glowLight.position.set(0, 1.4, 0);
    scene.add(glowLight);

    // Dynamic Bunsen flame light
    const flameLight = new THREE.PointLight(0x38bdf8, 0, 3);
    flameLight.position.set(0.9, 1.5, 0);
    scene.add(flameLight);

    // 5. PROCEDURAL 3D LABORATORY BENCH & APPARATUS (Composite 3-12 parts)
    const labGroup = new THREE.Group();
    scene.add(labGroup);

    // A. Epoxy Resin Countertop
    const benchTopGeo = new THREE.BoxGeometry(5.0, 0.12, 2.4);
    const benchTopMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.25,
      metalness: 0.15,
    });
    const benchTop = new THREE.Mesh(benchTopGeo, benchTopMat);
    benchTop.position.set(0, 0.94, 0);
    benchTop.receiveShadow = true;
    labGroup.add(benchTop);

    // B. Countertop Bevel Edging & Steel Legs
    const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.94, 16);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.85, roughness: 0.2 });
    const legPositions = [
      [-2.3, 0.47, 1.0],
      [2.3, 0.47, 1.0],
      [-2.3, 0.47, -1.0],
      [2.3, 0.47, -1.0],
    ];
    legPositions.forEach(([x, y, z]) => {
      const leg = new THREE.Mesh(legGeo, legMat);
      leg.position.set(x, y, z);
      leg.castShadow = true;
      labGroup.add(leg);
    });

    // C. Backsplash Shelf & Reagent Rack
    const splashGeo = new THREE.BoxGeometry(4.8, 0.5, 0.1);
    const splashMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.35 });
    const splash = new THREE.Mesh(splashGeo, splashMat);
    splash.position.set(0, 1.25, -1.1);
    labGroup.add(splash);

    const shelfGeo = new THREE.BoxGeometry(4.6, 0.04, 0.3);
    const shelf = new THREE.Mesh(shelfGeo, benchTopMat);
    shelf.position.set(0, 1.35, -0.95);
    shelf.castShadow = true;
    shelf.receiveShadow = true;
    labGroup.add(shelf);

    // D. Reagent Bottles on Back Shelf (Composite 4 parts each)
    const bottleColors = [0x0284c7, 0xfacc15, 0xec4899, 0xca8a04, 0x991b1b, 0x06b6d4, 0x1e1b4b, 0x38bdf8];
    bottleColors.forEach((color, i) => {
      const bottleGroup = new THREE.Group();
      const bodyGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.22, 16);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        transmission: 0.85,
        opacity: 1,
        transparent: true,
        roughness: 0.1,
        ior: 1.5,
      });
      const bottleBody = new THREE.Mesh(bodyGeo, glassMat);
      bottleGroup.add(bottleBody);

      // Liquid inside bottle
      const liqGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.15, 16);
      const liqMat = new THREE.MeshStandardMaterial({ color, roughness: 0.2, transparent: true, opacity: 0.8 });
      const liq = new THREE.Mesh(liqGeo, liqMat);
      liq.position.y = -0.03;
      bottleGroup.add(liq);

      // Cap & Dropper
      const capGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.06, 16);
      const capMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.4 });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.y = 0.14;
      bottleGroup.add(cap);

      const bulbGeo = new THREE.SphereGeometry(0.035, 16, 16);
      const bulbMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
      const bulb = new THREE.Mesh(bulbGeo, bulbMat);
      bulb.position.y = 0.18;
      bottleGroup.add(bulb);

      bottleGroup.position.set(-1.8 + i * 0.5, 1.48, -0.95);
      labGroup.add(bottleGroup);
    });

    // E. Retort Stand for Main Reaction Station
    const standBaseGeo = new THREE.BoxGeometry(0.45, 0.04, 0.35);
    const standBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6, metalness: 0.5 });
    const standBase = new THREE.Mesh(standBaseGeo, standBaseMat);
    standBase.position.set(0, 1.02, 0);
    standBase.castShadow = true;
    standBase.receiveShadow = true;
    labGroup.add(standBase);

    const rodGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.2, 16);
    const rodMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.15 });
    const rod = new THREE.Mesh(rodGeo, rodMat);
    rod.position.set(-0.16, 1.62, -0.1);
    rod.castShadow = true;
    labGroup.add(rod);

    // Retort Bosshead and Ring Clamp
    const bossheadGeo = new THREE.BoxGeometry(0.05, 0.06, 0.05);
    const bosshead = new THREE.Mesh(bossheadGeo, standBaseMat);
    bosshead.position.set(-0.16, 1.55, -0.1);
    labGroup.add(bosshead);

    const ringGeo = new THREE.TorusGeometry(0.16, 0.012, 16, 32);
    const ring = new THREE.Mesh(ringGeo, rodMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 1.55, 0);
    labGroup.add(ring);

    // F. Magnetic Stirrer Base underneath Flask
    const stirrerGroup = new THREE.Group();
    const stirrerBaseGeo = new THREE.BoxGeometry(0.5, 0.1, 0.45);
    const stirrerBaseMat = new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.3, metalness: 0.3 });
    const stirrerBase = new THREE.Mesh(stirrerBaseGeo, stirrerBaseMat);
    stirrerGroup.add(stirrerBase);

    // Ceramic top heating plate
    const plateGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.02, 32);
    const plateMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.25, metalness: 0.1 });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.y = 0.06;
    stirrerGroup.add(plate);

    // Digital LED display on front
    const ledGeo = new THREE.PlaneGeometry(0.18, 0.04);
    const ledMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
    const led = new THREE.Mesh(ledGeo, ledMat);
    led.position.set(0, 0, 0.23);
    stirrerGroup.add(led);

    stirrerGroup.position.set(0, 1.05, 0);
    labGroup.add(stirrerGroup);

    // G. MAIN REACTION VESSEL (Erlenmeyer Flask in high-refraction glass)
    const flaskGroup = new THREE.Group();
    flaskGroup.position.set(0, 1.12, 0);

    // Conical Body (using LatheGeometry with wall thickness)
    const flaskPoints: THREE.Vector2[] = [];
    flaskPoints.push(new THREE.Vector2(0, 0));
    flaskPoints.push(new THREE.Vector2(0.24, 0.02));
    flaskPoints.push(new THREE.Vector2(0.22, 0.08));
    flaskPoints.push(new THREE.Vector2(0.07, 0.42));
    flaskPoints.push(new THREE.Vector2(0.07, 0.6));
    flaskPoints.push(new THREE.Vector2(0.085, 0.62));
    flaskPoints.push(new THREE.Vector2(0.08, 0.63));
    flaskPoints.push(new THREE.Vector2(0.065, 0.6));
    flaskPoints.push(new THREE.Vector2(0.065, 0.42));
    flaskPoints.push(new THREE.Vector2(0.2, 0.08));
    flaskPoints.push(new THREE.Vector2(0.21, 0.04));
    flaskPoints.push(new THREE.Vector2(0, 0.03));

    const flaskGeo = new THREE.LatheGeometry(flaskPoints, 36);
    flaskGeo.computeVertexNormals();

    const flaskGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transmission: 0.94,
      opacity: 1,
      transparent: true,
      roughness: 0.05,
      ior: 1.52,
      thickness: 0.5,
      attenuationColor: new THREE.Color(0xf8fafc),
      depthWrite: false,
    });
    const flaskMesh = new THREE.Mesh(flaskGeo, flaskGlassMat);
    flaskMesh.castShadow = true;
    flaskGroup.add(flaskMesh);

    // Liquid Mesh inside flask
    const liquidGeo = new THREE.CylinderGeometry(0.18, 0.22, 0.28, 32);
    const liquidMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x38bdf8),
      transmission: 0.7,
      transparent: true,
      opacity: 0.7,
      roughness: 0.15,
      ior: 1.333,
      depthWrite: true,
    });
    const liquidMesh = new THREE.Mesh(liquidGeo, liquidMat);
    liquidMesh.position.y = 0.16;
    liquidMesh.scale.set(1, 0.01, 1); // initially empty
    flaskGroup.add(liquidMesh);

    // Precipitate Layer at bottom
    const precipGeo = new THREE.CylinderGeometry(0.215, 0.225, 0.03, 32);
    const precipMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      roughness: 0.6,
      transparent: true,
      opacity: 0,
    });
    const precipitateMesh = new THREE.Mesh(precipGeo, precipMat);
    precipitateMesh.position.y = 0.035;
    flaskGroup.add(precipitateMesh);

    // Magnetic Teflon Stir Bar
    const stirBarGeo = new THREE.CapsuleGeometry(0.015, 0.07, 8, 16);
    const stirBarMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2 });
    const stirBar = new THREE.Mesh(stirBarGeo, stirBarMat);
    stirBar.rotation.x = Math.PI / 2;
    stirBar.position.y = 0.04;
    flaskGroup.add(stirBar);

    // Effervescence Bubble Particle System
    const bubbleCount = 70;
    const bubbleGeo = new THREE.BufferGeometry();
    const bubblePositions = new Float32Array(bubbleCount * 3);
    const bubbleVelocities: number[] = [];

    for (let i = 0; i < bubbleCount; i++) {
      bubblePositions[i * 3 + 0] = (Math.random() - 0.5) * 0.25;
      bubblePositions[i * 3 + 1] = 0.05 + Math.random() * 0.25;
      bubblePositions[i * 3 + 2] = (Math.random() - 0.5) * 0.25;
      bubbleVelocities.push(0.005 + Math.random() * 0.01);
    }
    bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePositions, 3));

    const bubbleMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.018,
      transparent: true,
      opacity: 0,
    });
    const bubbleParticles = new THREE.Points(bubbleGeo, bubbleMat);
    flaskGroup.add(bubbleParticles);

    labGroup.add(flaskGroup);

    // H. BUNSEN BURNER (Interactive Station to the right)
    const burnerGroup = new THREE.Group();
    burnerGroup.position.set(1.1, 1.0, 0);

    const bBaseGeo = new THREE.CylinderGeometry(0.14, 0.16, 0.04, 24);
    const bBaseMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.3 });
    const bBase = new THREE.Mesh(bBaseGeo, bBaseMat);
    burnerGroup.add(bBase);

    const bCollarGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 16);
    const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3 });
    const bCollar = new THREE.Mesh(bCollarGeo, brassMat);
    bCollar.position.y = 0.05;
    burnerGroup.add(bCollar);

    const bTubeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.3, 24);
    const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.95, roughness: 0.1 });
    const bTube = new THREE.Mesh(bTubeGeo, chromeMat);
    bTube.position.y = 0.22;
    burnerGroup.add(bTube);

    // Bunsen Animated Flame Meshes (Inner cone and Outer flame)
    const flameGeo = new THREE.ConeGeometry(0.045, 0.24, 16);
    flameGeo.translate(0, 0.12, 0);

    const innerFlameMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0,
    });
    const bunsenInnerFlame = new THREE.Mesh(flameGeo, innerFlameMat);
    bunsenInnerFlame.position.y = 0.37;
    bunsenInnerFlame.scale.set(0.6, 0.6, 0.6);
    burnerGroup.add(bunsenInnerFlame);

    const outerFlameMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      transparent: true,
      opacity: 0,
    });
    const bunsenOuterFlame = new THREE.Mesh(flameGeo, outerFlameMat);
    bunsenOuterFlame.position.y = 0.37;
    burnerGroup.add(bunsenOuterFlame);

    // Platinum Wire Test Loop Assembly
    const sampleRod = new THREE.Group();
    const handleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.4, 12);
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.6 });
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.rotation.z = Math.PI / 3;
    sampleRod.add(handle);

    const wireGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.35, 8);
    const wire = new THREE.Mesh(wireGeo, chromeMat);
    wire.position.set(-0.25, 0.15, 0);
    wire.rotation.z = Math.PI / 3;
    sampleRod.add(wire);

    const loopGeo = new THREE.TorusGeometry(0.012, 0.003, 8, 16);
    const loop = new THREE.Mesh(loopGeo, brassMat);
    loop.position.set(-0.4, 0.24, 0);
    sampleRod.add(loop);

    sampleRod.position.set(0.5, 0.3, 0); // resting position
    burnerGroup.add(sampleRod);

    labGroup.add(burnerGroup);

    // I. Floor Grid Plane
    const gridHelper = new THREE.GridHelper(10, 20, 0x0284c7, 0x0f172a);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // 6. Camera Interaction State
    const targetCameraPos = new THREE.Vector3(0, 2.8, 4.5);
    const targetLookAt = new THREE.Vector3(0, 1.0, 0);
    const currentLookAt = new THREE.Vector3(0, 1.0, 0);

    const spherical = { radius: 5.2, theta: 0, phi: Math.PI / 3 };
    const prevMousePos = { x: 0, y: 0 };
    let isDragging = false;

    // Mouse / Touch Handlers for Orbit
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      isDragging = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      prevMousePos.x = clientX;
      prevMousePos.y = clientY;
    };

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDragging) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      const deltaX = clientX - prevMousePos.x;
      const deltaY = clientY - prevMousePos.y;

      prevMousePos.x = clientX;
      prevMousePos.y = clientY;

      spherical.theta -= deltaX * 0.006;
      spherical.phi = Math.max(0.15, Math.min(Math.PI / 2.1, spherical.phi - deltaY * 0.006));

      targetCameraPos.x = targetLookAt.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      targetCameraPos.y = targetLookAt.y + spherical.radius * Math.cos(spherical.phi);
      targetCameraPos.z = targetLookAt.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    };

    const handlePointerUp = () => {
      isDragging = false;
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      spherical.radius = Math.max(2.0, Math.min(8.0, spherical.radius + e.deltaY * 0.003));
      targetCameraPos.x = targetLookAt.x + spherical.radius * Math.sin(spherical.phi) * Math.sin(spherical.theta);
      targetCameraPos.y = targetLookAt.y + spherical.radius * Math.cos(spherical.phi);
      targetCameraPos.z = targetLookAt.z + spherical.radius * Math.sin(spherical.phi) * Math.cos(spherical.theta);
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    dom.addEventListener('touchstart', handlePointerDown);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('touchend', handlePointerUp);
    dom.addEventListener('wheel', handleWheel, { passive: false });

    // Store state
    threeState.current = {
      scene,
      camera,
      renderer,
      liquidMesh,
      liquidMaterial: liquidMat,
      precipitateMesh,
      precipitateMaterial: precipMat,
      bubbleParticles,
      glowLight,
      flameLight,
      bunsenInnerFlame,
      bunsenOuterFlame,
      stirBar,
      sampleRod,
      targetCameraPos,
      targetLookAt,
      currentLookAt,
      isDragging: false,
      prevMousePos,
      spherical,
      animFrameId: 0,
    };

    // 7. Render & Physics/Particle Game Loop
    const clock = new THREE.Clock();

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const elapsedTime = clock.getElapsedTime();

      // Camera smooth damping
      camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCameraPos.x, 5.0, delta);
      camera.position.y = THREE.MathUtils.damp(camera.position.y, targetCameraPos.y, 5.0, delta);
      camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCameraPos.z, 5.0, delta);

      currentLookAt.x = THREE.MathUtils.damp(currentLookAt.x, targetLookAt.x, 5.0, delta);
      currentLookAt.y = THREE.MathUtils.damp(currentLookAt.y, targetLookAt.y, 5.0, delta);
      currentLookAt.z = THREE.MathUtils.damp(currentLookAt.z, targetLookAt.z, 5.0, delta);
      camera.lookAt(currentLookAt);

      // Bubble particle simulation
      const posAttr = bubbleParticles.geometry.attributes.position as THREE.BufferAttribute;
      const positions = posAttr.array as Float32Array;
      const isEffervescing = bubbleParticles.material.opacity > 0.05;

      if (isEffervescing) {
        for (let i = 0; i < bubbleCount; i++) {
          positions[i * 3 + 1] += bubbleVelocities[i];
          // Wobble slightly
          positions[i * 3 + 0] += Math.sin(elapsedTime * 6 + i) * 0.001;
          // Reset when reaching surface
          if (positions[i * 3 + 1] > 0.32) {
            positions[i * 3 + 1] = 0.05;
          }
        }
        posAttr.needsUpdate = true;
      }

      // Bunsen flame flicker
      if (bunsenOuterFlame.material.opacity > 0.1) {
        const flicker = 0.9 + Math.sin(elapsedTime * 30) * 0.08 + Math.cos(elapsedTime * 45) * 0.05;
        bunsenOuterFlame.scale.y = flicker;
        bunsenInnerFlame.scale.y = flicker * 0.95;
      }

      renderer.render(scene, camera);
      threeState.current!.animFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !threeState.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      if (threeState.current) {
        cancelAnimationFrame(threeState.current.animFrameId);
      }
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseup', handlePointerUp);
      dom.removeEventListener('touchstart', handlePointerDown);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('touchend', handlePointerUp);
      dom.removeEventListener('wheel', handleWheel);
      renderer.dispose();
      labAudio.dispose();
    };
  }, []);

  // Update 3D Materials & Visuals when React State Changes
  useEffect(() => {
    if (!threeState.current) return;
    const {
      liquidMesh,
      liquidMaterial,
      precipitateMesh,
      precipitateMaterial,
      bubbleParticles,
      glowLight,
      flameLight,
      bunsenInnerFlame,
      bunsenOuterFlame,
      stirBar,
      sampleRod,
    } = threeState.current;

    // 1. Liquid volume scale & vertical offset
    const fillRatio = Math.min(1.0, vesselVolume / 100);
    if (fillRatio > 0.01) {
      liquidMesh.visible = true;
      liquidMesh.scale.set(1, Math.max(0.08, fillRatio * 1.1), 1);
      liquidMesh.position.y = 0.08 + (fillRatio * 0.14);
    } else {
      liquidMesh.visible = false;
    }

    // 2. Liquid Color & Opacity
    liquidMaterial.color.set(reactionStatus.liquidColor);
    liquidMaterial.opacity = reactionStatus.liquidOpacity;

    // 3. Precipitate layer
    if (reactionStatus.isPrecipitate && vesselVolume > 10) {
      precipitateMesh.visible = true;
      precipitateMaterial.opacity = 0.95;
      precipitateMaterial.color.set(reactionStatus.precipitateColor);
    } else {
      precipitateMesh.visible = false;
      precipitateMaterial.opacity = 0;
    }

    // 4. Bubbles / Effervescence
    (bubbleParticles.material as THREE.PointsMaterial).opacity = reactionStatus.isBubbling ? 0.85 : 0;

    // 5. Chemiluminescent Glow
    if (reactionStatus.isGlowing) {
      glowLight.intensity = 3.5;
      glowLight.color.set(reactionStatus.glowColor);
      liquidMaterial.emissive = new THREE.Color(reactionStatus.glowColor);
      liquidMaterial.emissiveIntensity = 0.8;
    } else {
      glowLight.intensity = 0;
      liquidMaterial.emissiveIntensity = 0;
    }

    // 6. Bunsen Burner & Flame Spectroscopy
    if (isHeating || isFlameRodInBurner) {
      (bunsenInnerFlame.material as THREE.MeshBasicMaterial).opacity = 0.9;
      (bunsenOuterFlame.material as THREE.MeshBasicMaterial).opacity = 0.8;

      if (isFlameRodInBurner && selectedFlameElement) {
        // Flame color shift from metal element
        (bunsenOuterFlame.material as THREE.MeshBasicMaterial).color.set(selectedFlameElement.color);
        (bunsenInnerFlame.material as THREE.MeshBasicMaterial).color.set(selectedFlameElement.glowColor);
        flameLight.intensity = 3.2;
        flameLight.color.set(selectedFlameElement.color);
        sampleRod.position.set(-0.35, 0.44, 0); // inside flame!
      } else {
        // Standard clean blue flame
        (bunsenOuterFlame.material as THREE.MeshBasicMaterial).color.set(0x38bdf8);
        (bunsenInnerFlame.material as THREE.MeshBasicMaterial).color.set(0x0284c7);
        flameLight.intensity = 1.6;
        flameLight.color.set(0x38bdf8);
        sampleRod.position.set(0.5, 0.3, 0); // resting
      }
    } else {
      (bunsenInnerFlame.material as THREE.MeshBasicMaterial).opacity = 0;
      (bunsenOuterFlame.material as THREE.MeshBasicMaterial).opacity = 0;
      flameLight.intensity = 0;
      sampleRod.position.set(0.5, 0.3, 0);
    }

    // 7. Stir Bar Rotation
    if (stirrerRPM > 0) {
      stirBar.rotation.z += (stirrerRPM / 60) * 0.1;
    }
  }, [reactionStatus, vesselVolume, isHeating, isFlameRodInBurner, selectedFlameElement, stirrerRPM]);

  return (
    <div className="relative w-full h-[calc(100vh-6rem)] min-h-[640px] rounded-3xl overflow-hidden bg-[#040914] border border-cyan-500/20 shadow-2xl flex flex-col select-none">
      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* TOP SCIENTIFIC HUD (Sensors & Camera Presets) */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Real-time Scientific Telemetry readout */}
        <div className="flex items-center gap-2 pointer-events-auto bg-[#071328]/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-cyan-500/30 text-xs font-mono shadow-lg">
          <div className="flex items-center gap-1.5 pr-3 border-r border-cyan-900/60">
            <Thermometer className="w-4 h-4 text-rose-400" />
            <span className="text-white font-bold">{temperature}°C</span>
            <span className="text-[10px] text-slate-400">({isHeating ? 'Heating' : 'Ambient'})</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 border-r border-cyan-900/60">
            <Droplet className="w-4 h-4 text-cyan-400" />
            <span className="text-white font-bold">{vesselVolume} mL</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 border-r border-cyan-900/60">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span className="text-white font-bold">{vesselMass} g</span>
          </div>

          <div className="flex items-center gap-1.5 pl-3">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-slate-400">pH</span>
            <span
              className={`font-black ${
                reactionStatus.ph < 6
                  ? 'text-rose-400'
                  : reactionStatus.ph > 8
                  ? 'text-purple-400'
                  : 'text-emerald-400'
              }`}
            >
              {reactionStatus.ph.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-400">({reactionStatus.absorbancePeakNm}nm)</span>
          </div>
        </div>

        {/* Camera Views & Audio Control */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Audio Mute toggle */}
          <button
            onClick={handleToggleSound}
            aria-label="Toggle lab audio"
            className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#071328]/85 border border-cyan-500/30 text-cyan-300 hover:text-white hover:border-cyan-400 transition"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Camera View Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-[#071328]/85 border border-cyan-500/30 gap-1 text-[11px] font-bold">
            <button
              onClick={() => handleSetCameraPreset('bench')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 transition"
            >
              Bench
            </button>
            <button
              onClick={() => handleSetCameraPreset('flask')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 transition"
            >
              Flask
            </button>
            <button
              onClick={() => handleSetCameraPreset('burner')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 transition"
            >
              Flame
            </button>
            <button
              onClick={() => handleSetCameraPreset('top')}
              className="px-2.5 py-1 rounded-lg text-slate-300 hover:text-white hover:bg-cyan-500/20 transition"
            >
              Top
            </button>
          </div>

          {/* Rinse Flask action */}
          <button
            onClick={handleRinseFlask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#071328]/85 border border-cyan-500/30 text-xs font-bold text-slate-200 hover:text-white hover:border-cyan-400 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rinse</span>
          </button>
        </div>
      </div>

      {/* FLOATING ACTION TOAST POPUP (Dispensing & Interaction Feedback) */}
      {actionToast && (
        <div
          key={actionToast.id}
          className="absolute top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none anim-slide-down anim-popup"
        >
          <div
            className="px-4 py-2 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center gap-2.5 bg-[#071328]/95"
            style={{
              borderColor: actionToast.color ? `${actionToast.color}80` : '#38bdf880',
              boxShadow: actionToast.color
                ? `0 0 25px ${actionToast.color}40`
                : '0 0 25px rgba(56, 189, 248, 0.3)',
            }}
          >
            <span
              className="w-2.5 h-2.5 rounded-full animate-ping"
              style={{ backgroundColor: actionToast.color || '#38bdf8' }}
            />
            <div>
              <div className="text-xs font-black text-white">{actionToast.text}</div>
              {actionToast.sub && (
                <div className="text-[10px] font-mono text-slate-300 font-semibold">{actionToast.sub}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* DISCOVERY CELEBRATION BANNER */}
      {currentDiscoveredNotice && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 max-w-xl w-[90%] bg-gradient-to-r from-amber-950/95 via-[#181124]/95 to-cyan-950/95 border-2 border-amber-400 rounded-3xl p-4 sm:p-5 shadow-[0_0_50px_rgba(251,191,36,0.5)] backdrop-blur-xl anim-popup anim-slide-down">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-400/80 flex items-center justify-center text-2xl flex-shrink-0 animate-bounce-subtle">
                ⚗
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-mono font-black text-amber-300 uppercase tracking-widest">
                    NEW REACTION SYNTHESIZED!
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px]">
                    +{currentDiscoveredNotice.xpReward} XP
                  </span>
                </div>
                <h3 className="text-base font-black text-white mt-0.5">
                  {currentDiscoveredNotice.title}
                </h3>
                <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                  {currentDiscoveredNotice.discoveryNotes}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => {
                  setInspectingProtocol(currentDiscoveredNotice);
                  setCurrentDiscoveredNotice(null);
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition hover:scale-105 active:scale-95"
              >
                Inspect
              </button>
              <button
                onClick={() => setCurrentDiscoveredNotice(null)}
                className="w-7 h-7 rounded-xl bg-slate-900/80 border border-slate-700 text-slate-400 hover:text-white flex items-center justify-center text-sm transition"
              >
                &times;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYNTHESIS PROTOCOL INSPECTOR MODAL POPUP */}
      {inspectingProtocol && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-xl w-full bg-gradient-to-b from-[#09152b] to-[#040914] border-2 border-cyan-500/60 rounded-3xl p-6 sm:p-7 shadow-[0_25px_60px_rgba(0,0,0,0.8)] anim-popup">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800 text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                    Synthesis Protocol · Tier {inspectingProtocol.tier}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold">
                    +{inspectingProtocol.xpReward} XP
                  </span>
                </div>
                <h2 className="text-xl font-black text-white">{inspectingProtocol.title}</h2>
              </div>
              <button
                onClick={() => setInspectingProtocol(null)}
                className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-base transition hover:scale-105"
              >
                &times;
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#030712] border border-cyan-950 font-mono text-xs text-amber-300 font-bold mb-4 overflow-x-auto">
              <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-0.5 font-sans">
                Discovery &amp; Stoichiometric Notes
              </span>
              <code>{inspectingProtocol.discoveryNotes}</code>
            </div>

            <div className="space-y-3 mb-6 text-xs">
              <div className="p-3 rounded-2xl bg-[#071329] border border-cyan-950/80">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                  Target Product &amp; Physical Phase
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-white/40"
                    style={{ backgroundColor: inspectingProtocol.targetProduct.color }}
                  />
                  <span className="text-white font-bold">{inspectingProtocol.targetProduct.name}</span>
                  <span className="text-slate-400">({inspectingProtocol.targetProduct.formula})</span>
                  <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] text-cyan-300 uppercase font-mono">
                    {inspectingProtocol.targetProduct.isPrecipitate
                      ? 'Precipitate'
                      : inspectingProtocol.targetProduct.isBubbling
                      ? 'Effervescent'
                      : inspectingProtocol.targetProduct.isGlowing
                      ? 'Luminescent'
                      : 'Aqueous'}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[#071329] border border-cyan-950/80">
                <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block mb-1.5">
                  Required Reagents
                </span>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(inspectingProtocol.requiredReagents).map(([reagentId, req]) => {
                    const r = REAGENTS_CATALOG[reagentId];
                    const isAdded = addedReagents.some((ar) => ar.reagentId === reagentId);
                    return (
                      <div
                        key={reagentId}
                        className={`px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-xs font-mono transition ${
                          isAdded
                            ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                            : 'bg-[#050e1e] border-slate-800 text-slate-300'
                        }`}
                      >
                        {isAdded ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Droplet className="w-3.5 h-3.5 text-cyan-400" />}
                        <span>{r ? r.name.split(' (')[0] : reagentId}</span>
                        <span className="text-[10px] text-slate-400 font-bold">({req.min}{req.unit})</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <p className="text-slate-300 leading-relaxed text-xs">
                {inspectingProtocol.description}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-cyan-950">
              <div className="text-[11px] text-slate-400 font-mono">
                Required Temp: {inspectingProtocol.requiredTemp ? `${inspectingProtocol.requiredTemp.min}-${inspectingProtocol.requiredTemp.max}°C` : 'Ambient (20-25°C)'}
              </div>
              <button
                onClick={() => setInspectingProtocol(null)}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs transition hover:scale-105 active:scale-95"
              >
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LEFT MINIMAL WORKBENCH LOG (Floating observation terminal) */}
      <div className="hidden md:flex flex-col gap-1.5 absolute top-20 left-4 z-20 max-w-[280px] bg-[#050e1e]/80 border border-cyan-900/40 rounded-2xl p-3 backdrop-blur-md pointer-events-none">
        <span className="text-[9px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
          <Activity className="w-3 h-3" /> Live Observation Stream
        </span>
        <div className="space-y-1 font-mono text-[11px] text-slate-300 max-h-36 overflow-y-auto">
          {logs.slice(0, 4).map((log, i) => (
            <div key={i} className="flex items-start gap-1.5 leading-snug">
              <span className="text-cyan-400 mt-0.5">›</span>
              <span className="text-slate-300">{log}</span>
            </div>
          ))}
        </div>
      </div>

      {/* UNIFIED COLLAPSIBLE BOTTOM CONTROL DOCK (Zero Viewport Occlusion Constitution) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[95%] max-w-[960px] pointer-events-auto">
        {/* Drawer Toggle Header */}
        <div className="flex items-center justify-between mb-1.5 px-3">
          <div className="flex items-center gap-1.5 bg-[#050e1e]/90 border border-cyan-500/30 rounded-full px-3 py-1 shadow-md">
            <span className="text-[11px] font-mono font-bold text-cyan-300 uppercase">
              {dockTab.toUpperCase()} CONTROLS
            </span>
            {reactionStatus.activeProtocol && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-mono">
                {reactionStatus.activeProtocol.targetProduct.name}
              </span>
            )}
          </div>

          <button
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#050e1e]/90 hover:bg-[#0c1c38] border border-cyan-500/30 text-[11px] font-semibold text-slate-300 hover:text-white transition shadow-md"
          >
            {isDockCollapsed ? (
              <>
                <span>▲ Show Laboratory Dock</span>
                <ChevronUp className="w-3.5 h-3.5 text-cyan-400" />
              </>
            ) : (
              <>
                <span>▼ Minimize Dock</span>
                <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
              </>
            )}
          </button>
        </div>

        {/* Collapsible Dock Card */}
        {!isDockCollapsed && (
          <div className="rounded-3xl bg-gradient-to-b from-[#08152e]/95 via-[#040c1a]/95 to-[#020610]/95 border border-cyan-500/30 p-3 sm:p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl anim-drawer">
            {/* Dock Navigation Tabs */}
            <div className="flex items-center justify-between gap-2 border-b border-cyan-900/40 pb-3 mb-3 overflow-x-auto">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setDockTab('reagents')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    dockTab === 'reagents'
                      ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                      : 'bg-[#0a162b] text-slate-300 hover:text-white border border-cyan-950'
                  }`}
                >
                  <Droplet className="w-3.5 h-3.5" />
                  <span>Reagents Shelf</span>
                </button>

                <button
                  onClick={() => setDockTab('thermal')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    dockTab === 'thermal'
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-[#0a162b] text-slate-300 hover:text-white border border-cyan-950'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>Thermal &amp; Stirrer</span>
                </button>

                <button
                  onClick={() => setDockTab('flame')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    dockTab === 'flame'
                      ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
                      : 'bg-[#0a162b] text-slate-300 hover:text-white border border-cyan-950'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Flame Spectroscopy</span>
                </button>

                <button
                  onClick={() => setDockTab('protocols')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    dockTab === 'protocols'
                      ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                      : 'bg-[#0a162b] text-slate-300 hover:text-white border border-cyan-950'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Synthesis Codex ({discoveredProtocols.length}/{PROTOCOLS.length})</span>
                </button>
              </div>

              {/* Volume dispensing selector */}
              {dockTab === 'reagents' && (
                <div className="flex items-center gap-1 bg-[#050f21] px-2 py-1 rounded-xl border border-cyan-950 text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">Dose:</span>
                  {[5, 10, 20, 30].map((amt) => (
                    <button
                      key={amt}
                      onClick={() => setDispenseAmount(amt)}
                      className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-bold ${
                        dispenseAmount === amt
                          ? 'bg-cyan-500 text-slate-950'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {amt}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* TAB CONTENT: 1. REAGENTS */}
            {dockTab === 'reagents' && (
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2 max-h-48 overflow-y-auto pr-1">
                {Object.values(REAGENTS_CATALOG).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => handleAddReagent(r)}
                    className="p-2 rounded-2xl bg-[#071329] hover:bg-[#0c1f3d] border border-cyan-950 hover:border-cyan-500/50 text-left transition flex items-center gap-2.5 group"
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] flex-shrink-0 border"
                      style={{
                        backgroundColor: `${r.color}25`,
                        borderColor: r.color,
                        color: r.color === '#f8fafc' ? '#38bdf8' : r.color,
                      }}
                    >
                      {r.formula.slice(0, 2)}
                    </div>
                    <div className="min-w-0">
                      <strong className="block text-xs font-bold text-white truncate group-hover:text-cyan-300">
                        {r.name.split(' (')[0]}
                      </strong>
                      <span className="text-[10px] font-mono text-slate-400 block truncate">
                        {r.formula}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* TAB CONTENT: 2. THERMAL & STIRRER */}
            {dockTab === 'thermal' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Bunsen Burner Control */}
                <div className="p-3 rounded-2xl bg-[#061226] border border-cyan-950 flex flex-col justify-between gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">Bunsen Burner Station</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {isHeating ? 'Ignited — heating Erlenmeyer flask' : 'Extinguished — ambient room temp'}
                      </span>
                    </div>
                    <button
                      onClick={handleToggleBurner}
                      className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
                        isHeating
                          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950'
                      }`}
                    >
                      <Flame className="w-4 h-4" />
                      <span>{isHeating ? 'Extinguish Flame' : 'Ignite Burner'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-300">
                    <span>Temp: {temperature}°C</span>
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
                      <span className="text-xs font-bold text-white block">Magnetic Stirrer Hotplate</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Vortex agitation: {stirrerRPM} RPM
                      </span>
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
                    Agitation accelerates dissolution and ensures homogeneous stoichiometric interaction.
                  </p>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. FLAME SPECTROSCOPY */}
            {dockTab === 'flame' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300">
                    Select a metal salt to insert into the Bunsen flame on the platinum test wire:
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
                        className={`p-2.5 rounded-2xl border text-center transition ${
                          isSelected
                            ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-lg'
                            : 'bg-[#071329] border-cyan-950 text-slate-300 hover:border-cyan-800'
                        }`}
                      >
                        <div
                          className="w-4 h-4 rounded-full mx-auto mb-1.5 border border-white/40"
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

            {/* TAB CONTENT: 4. SYNTHESIS PROTOCOLS */}
            {dockTab === 'protocols' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {PROTOCOLS.map((p) => {
                  const isUnlocked = discoveredProtocols.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setInspectingProtocol(p)}
                      className={`p-3 rounded-2xl border text-left transition-all duration-200 hover:scale-102 hover:border-cyan-400 active:scale-98 cursor-pointer ${
                        isUnlocked
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 hover:bg-emerald-950/60 shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                          : 'bg-[#061226] border-cyan-950 hover:border-cyan-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-400">
                          Tier {p.tier} · +{p.xpReward} XP
                        </span>
                        {isUnlocked && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                      </div>
                      <strong className={`block text-xs font-bold ${isUnlocked ? 'text-white' : 'text-slate-300'}`}>
                        {p.title}
                      </strong>
                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                        {p.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
