import React, { useState } from 'react';
import {
  useGameStore,
  type LabStationId,
} from '../../gameplay/gameState';
import {
  REAGENTS_CATALOG,
  generateSpectrumData,
} from '../../gameplay/chemistry';
import {
  playPourLiquid,
  playScaleBeep,
  playGlasswareClick,
  playAnalysisScan,
  playReactionComplete,
  playBubbleEffervescence,
} from '../../gameplay/audio';
import {
  FlaskConical,
  Flame,
  Scale,
  ArrowRightLeft,
  Trash2,
  CheckCircle2,
  XCircle,
  Activity,
  Layers,
  Sparkles,
} from 'lucide-react';

export const StationHUD: React.FC = () => {
  const activeStation = useGameStore((s) => s.activeStation);
  const setActiveStation = useGameStore((s) => s.setActiveStation);
  const vessels = useGameStore((s) => s.vessels);
  const workbenchVesselId = useGameStore((s) => s.workbenchVesselId);
  const scaleVesselId = useGameStore((s) => s.scaleVesselId);
  const analysisVesselId = useGameStore((s) => s.analysisVesselId);
  const placeVessel = useGameStore((s) => s.placeVessel);
  const emptyVessel = useGameStore((s) => s.emptyVessel);
  const dispenseReagentIntoVessel = useGameStore((s) => s.dispenseReagentIntoVessel);
  const pourBetweenVessels = useGameStore((s) => s.pourBetweenVessels);
  const hotplateTempC = useGameStore((s) => s.hotplateTempC);
  const setHotplateTemp = useGameStore((s) => s.setHotplateTemp);
  const isHotplateOn = useGameStore((s) => s.isHotplateOn);
  const toggleHotplate = useGameStore((s) => s.toggleHotplate);
  const isStirrerOn = useGameStore((s) => s.isStirrerOn);
  const toggleStirrer = useGameStore((s) => s.toggleStirrer);
  const tareScale = useGameStore((s) => s.tareScale);
  const scaleTareMassG = useGameStore((s) => s.scaleTareMassG);
  const runSpectrophotometerAnalysis = useGameStore((s) => s.runSpectrophotometerAnalysis);
  const unlockedTier = useGameStore((s) => s.unlockedTier);

  // Local station states
  const [selectedReagentId, setSelectedReagentId] = useState<string>('naoh');
  const [dispenseAmount, setDispenseAmount] = useState<number>(20);
  const [selectedTargetVesselId, setSelectedTargetVesselId] = useState<string>('beaker_main');
  const [pourSourceId, setPourSourceId] = useState<string>('cylinder_measuring');
  const [pourTargetId, setPourTargetId] = useState<string>('beaker_main');
  const [pourAmount, setPourAmount] = useState<number>(20);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [latestScanReport, setLatestScanReport] = useState<any>(null);

  if (!activeStation) return null;

  const currentReagent = REAGENTS_CATALOG[selectedReagentId] || REAGENTS_CATALOG.naoh;
  const targetVessel = vessels[selectedTargetVesselId];
  const scaleVessel = scaleVesselId ? vessels[scaleVesselId] : null;
  const netScaleMass = scaleVessel ? Math.max(0, scaleVessel.content.massG - scaleTareMassG) : 0;
  const workbenchVessel = workbenchVesselId ? vessels[workbenchVesselId] : null;
  const analysisVessel = analysisVesselId ? vessels[analysisVesselId] : null;

  // Station titles and icons
  const stationMeta: Record<NonNullable<LabStationId>, { title: string; subtitle: string; icon: any }> = {
    dispensing: {
      title: 'REAGENT DISPENSING & STORAGE BENCH',
      subtitle: 'Select chemical containers, measure volumes, and prepare stock solutions.',
      icon: FlaskConical,
    },
    measurement: {
      title: 'PRECISION MEASUREMENT STATION',
      subtitle: 'Calibrated digital analytical balance, tare calibration, and graduated volumetric transfers.',
      icon: Scale,
    },
    workbench: {
      title: 'CHEMICAL REACTION WORKBENCH',
      subtitle: 'Thermal hotplate, magnetic stirring, multi-component synthesis, and dynamic reaction monitoring.',
      icon: Flame,
    },
    analysis: {
      title: 'UV-VIS SPECTROPHOTOMETER & SENSOR STATION',
      subtitle: 'Molecular absorption spectrophotometry, wavelength sweep, and stoichiometric verification.',
      icon: Activity,
    },
  };

  const meta = stationMeta[activeStation];

  const handleDispense = () => {
    if (!targetVessel) return;
    playPourLiquid();
    dispenseReagentIntoVessel(selectedTargetVesselId, selectedReagentId, dispenseAmount);
  };

  const handlePour = () => {
    if (pourSourceId === pourTargetId) return;
    playPourLiquid();
    pourBetweenVessels(pourSourceId, pourTargetId, pourAmount);
  };

  const handleScan = () => {
    if (!analysisVessel) return;
    setIsScanning(true);
    playAnalysisScan();
    setTimeout(() => {
      setIsScanning(false);
      const report = runSpectrophotometerAnalysis(analysisVessel.id);
      setLatestScanReport(report);
      if (report?.isReactionVerified) {
        playReactionComplete();
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-30 flex flex-col justify-between p-4 md:p-6 bg-gradient-to-t from-[#111418]/90 via-transparent to-[#111418]/70">
      {/* Top Header of the Station */}
      <div className="pointer-events-auto flex items-center justify-between bg-[#111418]/95 border border-[#2A323D] px-4 py-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 text-[#0ea5e9]">
            <meta.icon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-semibold tracking-wider text-[#E2E8F0] font-mono">
              {meta.title}
            </h2>
            <p className="text-xs text-slate-400">{meta.subtitle}</p>
          </div>
        </div>

        <button
          onClick={() => setActiveStation(null)}
          className="px-4 py-1.5 text-xs font-mono font-medium tracking-wide bg-[#1e242c] hover:bg-[#2A323D] text-[#0ea5e9] border border-[#2A323D] transition-colors"
        >
          [ESC] EXIT TO FREE ROAM
        </button>
      </div>

      {/* Main Station Interaction Body */}
      <div className="pointer-events-auto my-auto max-w-4xl w-full mx-auto bg-[#111418]/95 border border-[#2A323D] p-4 md:p-6 shadow-2xl backdrop-blur-md text-[#E2E8F0]">
        {/* =======================================================
            STATION 1: REAGENT DISPENSING
        ======================================================= */}
        {activeStation === 'dispensing' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Reagents Shelf Selection */}
            <div className="md:col-span-7 space-y-3">
              <div className="flex items-center justify-between border-b border-[#2A323D] pb-2">
                <span className="text-xs font-mono text-slate-400">AVAILABLE REAGENTS (TIER {unlockedTier})</span>
                <span className="text-xs font-mono text-[#0ea5e9]">10 IN STOCK</span>
              </div>

              <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {Object.values(REAGENTS_CATALOG).map((r) => {
                  const isUnlocked = r.tier <= unlockedTier;
                  const isSelected = r.id === selectedReagentId;
                  return (
                    <button
                      key={r.id}
                      disabled={!isUnlocked}
                      onClick={() => {
                        setSelectedReagentId(r.id);
                        playGlasswareClick();
                      }}
                      className={`text-left p-2.5 border transition-all text-xs font-mono ${
                        isSelected
                          ? 'border-[#0ea5e9] bg-[#0ea5e9]/10 text-white'
                          : isUnlocked
                          ? 'border-[#2A323D] bg-[#1a202c]/60 hover:border-slate-500 text-slate-300'
                          : 'border-[#2A323D]/40 bg-[#1a202c]/20 text-slate-600 opacity-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold">{r.formula}</span>
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black/40"
                          style={{ backgroundColor: r.color }}
                        />
                      </div>
                      <div className="truncate text-[11px] text-slate-400 mt-0.5">{r.name}</div>
                      <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                        <span>pH: {r.ph}</span>
                        <span>{r.state.toUpperCase()}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Chemical Info Box */}
              <div className="p-3 bg-[#161c24] border border-[#2A323D] text-xs font-mono space-y-1">
                <div className="text-[#0ea5e9] font-bold">{currentReagent.name} [{currentReagent.formula}]</div>
                <div className="text-slate-400 text-[11px] leading-relaxed">{currentReagent.description}</div>
                <div className="flex gap-4 pt-1 text-[10px] text-slate-400">
                  <span>MOLAR MASS: {currentReagent.molarMass} g/mol</span>
                  <span>DENSITY: {currentReagent.density} g/mL</span>
                  <span className={currentReagent.hazard === 'corrosive' ? 'text-amber-400' : 'text-slate-400'}>
                    HAZARD: {currentReagent.hazard.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>

            {/* Dispense Controls & Target Vessel */}
            <div className="md:col-span-5 space-y-4 border-l border-[#2A323D] md:pl-6">
              <div className="text-xs font-mono text-slate-400 border-b border-[#2A323D] pb-2">
                DISPENSING CONTROLS
              </div>

              {/* Target Vessel Selection */}
              <div>
                <label className="text-xs font-mono text-slate-300 block mb-1">RECEIVING VESSEL</label>
                <select
                  value={selectedTargetVesselId}
                  onChange={(e) => setSelectedTargetVesselId(e.target.value)}
                  className="w-full bg-[#161c24] border border-[#2A323D] text-xs font-mono text-[#E2E8F0] px-3 py-2 focus:border-[#0ea5e9] outline-none"
                >
                  {Object.values(vessels).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({Math.round(v.content.volumeMl)}/{v.capacityMl}mL)
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount slider */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-300">MEASURE QUANTITY</span>
                  <span className="text-[#0ea5e9] font-bold">
                    {dispenseAmount} {currentReagent.state === 'solid' ? 'g' : 'mL'}
                  </span>
                </div>
                <input
                  type="range"
                  min={currentReagent.state === 'solid' ? 1 : 2}
                  max={currentReagent.state === 'solid' ? 20 : 50}
                  step={currentReagent.state === 'solid' ? 1 : 2}
                  value={dispenseAmount}
                  onChange={(e) => setDispenseAmount(Number(e.target.value))}
                  className="w-full accent-[#0ea5e9] bg-[#2A323D] h-1.5 rounded cursor-pointer"
                />
                <div className="flex justify-between gap-2 mt-2">
                  {[5, 10, 20, 25, 50].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setDispenseAmount(preset)}
                      className="flex-1 py-1 text-[10px] font-mono bg-[#1a202c] border border-[#2A323D] hover:border-[#0ea5e9] text-slate-300"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target vessel current content status */}
              {targetVessel && (
                <div className="p-2.5 bg-[#161c24] border border-[#2A323D] text-xs font-mono space-y-1">
                  <div className="text-slate-400">Current Volume: {targetVessel.content.volumeMl}mL</div>
                  <div className="text-slate-400">Current Mass: {targetVessel.content.massG}g</div>
                  <div className="text-slate-400">Current pH: {targetVessel.content.ph}</div>
                </div>
              )}

              {/* Dispense Action Button */}
              <button
                onClick={handleDispense}
                className="w-full py-2.5 text-xs font-mono font-bold tracking-wider bg-[#0ea5e9] hover:bg-[#0284c7] text-[#111418] transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                DISPENSE {dispenseAmount} {currentReagent.state === 'solid' ? 'g' : 'mL'}
              </button>
            </div>
          </div>
        )}

        {/* =======================================================
            STATION 2: PRECISION MEASUREMENT STATION
        ======================================================= */}
        {activeStation === 'measurement' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Analytical Balance Digital Screen */}
            <div className="md:col-span-6 space-y-4">
              <div className="border border-[#2A323D] bg-[#0c1015] p-5">
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-[#2A323D] pb-2">
                  <span>METTLER TOLEDO PRECISION BALANCE</span>
                  <span className="text-[#0ea5e9]">CALIBRATED</span>
                </div>

                {/* Big 7-Segment Digital Readout */}
                <div className="my-6 text-center">
                  <div className="text-4xl md:text-5xl font-mono font-black text-[#0ea5e9] tracking-wider">
                    {netScaleMass.toFixed(2)} <span className="text-xl text-slate-400 font-normal">g</span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 mt-2">
                    TARE OFFSET: {scaleTareMassG.toFixed(2)} g | STABLE
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      playScaleBeep();
                      tareScale();
                    }}
                    className="flex-1 py-2 text-xs font-mono font-bold bg-[#1e242c] hover:bg-[#2A323D] border border-[#0ea5e9] text-[#0ea5e9] transition-colors"
                  >
                    [TARE] ZERO SCALE
                  </button>
                </div>
              </div>

              {/* Vessel on Scale Placement */}
              <div className="p-3 bg-[#161c24] border border-[#2A323D] text-xs font-mono">
                <div className="text-slate-400 mb-2">VESSEL ON BALANCE PAN:</div>
                <div className="flex gap-2 flex-wrap">
                  {Object.values(vessels).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        placeVessel('scale', v.id);
                        playGlasswareClick();
                      }}
                      className={`px-3 py-1.5 border text-xs ${
                        scaleVesselId === v.id
                          ? 'border-[#0ea5e9] bg-[#0ea5e9]/20 text-[#0ea5e9] font-bold'
                          : 'border-[#2A323D] bg-[#1a202c] text-slate-300'
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Volumetric Cylinder & Pipette Transfer Controls */}
            <div className="md:col-span-6 space-y-4 border-l border-[#2A323D] md:pl-6">
              <div className="text-xs font-mono text-slate-400 border-b border-[#2A323D] pb-2">
                VOLUMETRIC LIQUID TRANSFER
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">SOURCE VESSEL</label>
                  <select
                    value={pourSourceId}
                    onChange={(e) => setPourSourceId(e.target.value)}
                    className="w-full bg-[#161c24] border border-[#2A323D] text-xs font-mono text-white px-2.5 py-1.5"
                  >
                    {Object.values(vessels).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({Math.round(v.content.volumeMl)}mL)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-400 block mb-1">DESTINATION VESSEL</label>
                  <select
                    value={pourTargetId}
                    onChange={(e) => setPourTargetId(e.target.value)}
                    className="w-full bg-[#161c24] border border-[#2A323D] text-xs font-mono text-white px-2.5 py-1.5"
                  >
                    {Object.values(vessels).map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({Math.round(v.content.volumeMl)}mL)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Transfer amount */}
              <div>
                <div className="flex justify-between text-xs font-mono mb-1">
                  <span className="text-slate-400">TRANSFER VOLUME</span>
                  <span className="text-[#0ea5e9] font-bold">{pourAmount} mL</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={pourAmount}
                  onChange={(e) => setPourAmount(Number(e.target.value))}
                  className="w-full accent-[#0ea5e9] bg-[#2A323D] h-1.5 rounded cursor-pointer"
                />
              </div>

              <button
                onClick={handlePour}
                disabled={pourSourceId === pourTargetId || (vessels[pourSourceId]?.content.volumeMl || 0) <= 0}
                className="w-full py-2.5 text-xs font-mono font-bold tracking-wider bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-40 text-[#111418] transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <ArrowRightLeft className="w-4 h-4" />
                TRANSFER {pourAmount} mL
              </button>

              <div className="p-3 bg-[#161c24] border border-[#2A323D] text-[11px] font-mono text-slate-400 space-y-1">
                <div>Source Vol: {vessels[pourSourceId]?.content.volumeMl}mL</div>
                <div>Target Vol: {vessels[pourTargetId]?.content.volumeMl}mL</div>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            STATION 3: REACTION WORKBENCH
        ======================================================= */}
        {activeStation === 'workbench' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Workbench Reaction Vessel Monitor */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between border-b border-[#2A323D] pb-2 text-xs font-mono">
                <span className="text-slate-400">ACTIVE REACTION VESSEL</span>
                <div className="flex gap-2">
                  {Object.values(vessels).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        placeVessel('workbench', v.id);
                        playGlasswareClick();
                      }}
                      className={`px-2 py-0.5 text-[11px] border ${
                        workbenchVesselId === v.id
                          ? 'border-[#0ea5e9] bg-[#0ea5e9]/20 text-[#0ea5e9]'
                          : 'border-[#2A323D] text-slate-400'
                      }`}
                    >
                      {v.name.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              {workbenchVessel ? (
                <div className="bg-[#161c24] border border-[#2A323D] p-4 space-y-3 font-mono">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">
                        {workbenchVessel.content.productName || 'Reaction Mixture'}
                      </div>
                      <div className="text-xs text-[#0ea5e9]">
                        {workbenchVessel.content.productFormula || 'Unreacted Reagents'}
                      </div>
                    </div>
                    <div
                      className="w-6 h-6 rounded-full border border-white/20 shadow-inner"
                      style={{ backgroundColor: workbenchVessel.content.color }}
                    />
                  </div>

                  {/* Reaction Phenomena Indicators */}
                  <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                    <div
                      className={`p-2 border text-center ${
                        workbenchVessel.content.isBubbling
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 animate-pulse'
                          : 'border-[#2A323D] text-slate-500'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 mx-auto mb-1" />
                      EFFERVESCENCE
                    </div>

                    <div
                      className={`p-2 border text-center ${
                        workbenchVessel.content.isPrecipitate
                          ? 'border-[#0ea5e9] bg-[#0ea5e9]/10 text-[#0ea5e9]'
                          : 'border-[#2A323D] text-slate-500'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5 mx-auto mb-1" />
                      PRECIPITATE
                    </div>

                    <div
                      className={`p-2 border text-center ${
                        workbenchVessel.content.isGlowing
                          ? 'border-cyan-400 bg-cyan-400/20 text-cyan-200 animate-pulse'
                          : 'border-[#2A323D] text-slate-500'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5 mx-auto mb-1" />
                      COLD GLOW
                    </div>
                  </div>

                  {/* Mixture Telemetry Grid */}
                  <div className="grid grid-cols-4 gap-2 pt-2 text-center text-xs">
                    <div className="bg-[#10141a] p-2 border border-[#2A323D]">
                      <div className="text-[10px] text-slate-500">VOLUME</div>
                      <div className="font-bold text-white">{workbenchVessel.content.volumeMl} mL</div>
                    </div>
                    <div className="bg-[#10141a] p-2 border border-[#2A323D]">
                      <div className="text-[10px] text-slate-500">MASS</div>
                      <div className="font-bold text-white">{workbenchVessel.content.massG} g</div>
                    </div>
                    <div className="bg-[#10141a] p-2 border border-[#2A323D]">
                      <div className="text-[10px] text-slate-500">pH VALUE</div>
                      <div className="font-bold text-[#0ea5e9]">{workbenchVessel.content.ph}</div>
                    </div>
                    <div className="bg-[#10141a] p-2 border border-[#2A323D]">
                      <div className="text-[10px] text-slate-500">TEMP</div>
                      <div className="font-bold text-amber-400">{workbenchVessel.content.temperatureC}°C</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => {
                        emptyVessel(workbenchVessel.id);
                        playGlasswareClick();
                      }}
                      className="px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 border border-rose-500/30 hover:border-rose-500 bg-rose-500/10 flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> RINSE & EMPTY
                    </button>
                    <span className="text-[11px] text-slate-400">
                      Purity Est: {workbenchVessel.content.purity}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 border border-dashed border-[#2A323D] text-xs font-mono">
                  No reaction vessel currently placed on workbench hotplate.
                </div>
              )}
            </div>

            {/* Thermal Hotplate & Magnetic Stirrer Controls */}
            <div className="md:col-span-5 space-y-4 border-l border-[#2A323D] md:pl-6 font-mono">
              <div className="text-xs text-slate-400 border-b border-[#2A323D] pb-2">
                HEATING & AGITATION
              </div>

              {/* Hotplate toggle */}
              <div className="p-3 bg-[#161c24] border border-[#2A323D] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-amber-400" /> CERAMIC HOTPLATE
                  </span>
                  <button
                    onClick={toggleHotplate}
                    className={`px-3 py-1 text-xs font-bold border ${
                      isHotplateOn
                        ? 'border-amber-500 bg-amber-500/20 text-amber-400'
                        : 'border-[#2A323D] bg-[#1a202c] text-slate-400'
                    }`}
                  >
                    {isHotplateOn ? 'ON' : 'OFF'}
                  </button>
                </div>

                <div>
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>SET TEMPERATURE</span>
                    <span className="text-amber-400 font-bold">{hotplateTempC} °C</span>
                  </div>
                  <input
                    type="range"
                    min={20}
                    max={120}
                    step={5}
                    value={hotplateTempC}
                    onChange={(e) => setHotplateTemp(Number(e.target.value))}
                    className="w-full accent-amber-500 bg-[#2A323D] h-1.5 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Magnetic Stirrer */}
              <div className="p-3 bg-[#161c24] border border-[#2A323D] flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-300 block">MAGNETIC STIRRER</span>
                  <span className="text-[10px] text-slate-500">Vortex mixing agitation</span>
                </div>
                <button
                  onClick={() => {
                    toggleStirrer();
                    playBubbleEffervescence();
                  }}
                  className={`px-3 py-1 text-xs font-bold border ${
                    isStirrerOn
                      ? 'border-[#0ea5e9] bg-[#0ea5e9]/20 text-[#0ea5e9]'
                      : 'border-[#2A323D] bg-[#1a202c] text-slate-400'
                  }`}
                >
                  {isStirrerOn ? '500 RPM' : 'OFF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =======================================================
            STATION 4: ANALYTICAL SPECTROPHOTOMETER
        ======================================================= */}
        {activeStation === 'analysis' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 font-mono">
            {/* Sample Loader */}
            <div className="md:col-span-5 space-y-4">
              <div className="border-b border-[#2A323D] pb-2 text-xs text-slate-400">
                SAMPLE WELL CHAMBER
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 block">SELECT SAMPLE TO ANALYZE</label>
                <div className="space-y-1.5">
                  {Object.values(vessels).map((v) => (
                    <button
                      key={v.id}
                      onClick={() => {
                        placeVessel('analysis', v.id);
                        playGlasswareClick();
                      }}
                      className={`w-full p-2.5 text-left border flex items-center justify-between text-xs ${
                        analysisVesselId === v.id
                          ? 'border-[#0ea5e9] bg-[#0ea5e9]/10 text-white'
                          : 'border-[#2A323D] bg-[#161c24] text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{v.name}</div>
                        <div className="text-[10px] text-slate-500">{v.content.volumeMl}mL | pH {v.content.ph}</div>
                      </div>
                      <div
                        className="w-4 h-4 rounded-full border border-white/20"
                        style={{ backgroundColor: v.content.color }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Scan Button */}
              <button
                onClick={handleScan}
                disabled={!analysisVessel || analysisVessel.content.volumeMl === 0 || isScanning}
                className="w-full py-3 text-xs font-bold tracking-wider bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-40 text-[#111418] transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <Activity className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                {isScanning ? 'SWEEPING WAVELENGTHS 280-720nm...' : 'INITIATE SPECTRAL SCAN'}
              </button>
            </div>

            {/* Spectrogram Display */}
            <div className="md:col-span-7 space-y-3 border-l border-[#2A323D] md:pl-6">
              <div className="flex items-center justify-between border-b border-[#2A323D] pb-2 text-xs">
                <span className="text-slate-400">ABSORBANCE SPECTRUM (UV-VIS)</span>
                <span className="text-[#0ea5e9]">
                  {analysisVessel ? `PEAK: ${analysisVessel.content.absorbancePeakNm} nm` : 'STANDBY'}
                </span>
              </div>

              {/* Spectral Chart Canvas SVG */}
              <div className="bg-[#0b1016] border border-[#2A323D] p-3 h-48 relative flex items-end">
                {analysisVessel ? (
                  <svg className="w-full h-full" viewBox="0 0 300 120" preserveAspectRatio="none">
                    {/* Grid lines */}
                    <line x1="0" y1="30" x2="300" y2="30" stroke="#1e293b" strokeDasharray="4" />
                    <line x1="0" y1="60" x2="300" y2="60" stroke="#1e293b" strokeDasharray="4" />
                    <line x1="0" y1="90" x2="300" y2="90" stroke="#1e293b" strokeDasharray="4" />

                    {/* Absorption Peak Curve */}
                    {(() => {
                      const peak = analysisVessel.content.absorbancePeakNm;
                      const points = generateSpectrumData(peak, 40, 1.0);
                      const path = points
                        .map((pt, i) => {
                          const x = ((pt.wavelength - 280) / (720 - 280)) * 300;
                          const y = 110 - pt.absorbance * 85;
                          return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
                        })
                        .join(' ');
                      return (
                        <>
                          <path d={path} fill="none" stroke="#0ea5e9" strokeWidth="2.5" />
                          <circle
                            cx={((peak - 280) / (720 - 280)) * 300}
                            cy={25}
                            r="4"
                            fill="#0ea5e9"
                          />
                        </>
                      );
                    })()}
                  </svg>
                ) : (
                  <div className="w-full text-center text-xs text-slate-500 my-auto">
                    Load a sample cuvette to generate absorbance spectrum.
                  </div>
                )}
              </div>

              {/* Scan Telemetry Results */}
              {latestScanReport && (
                <div className={`p-3 border text-xs space-y-1 ${
                  latestScanReport.isReactionVerified
                    ? 'border-emerald-500/60 bg-emerald-500/10 text-emerald-200'
                    : 'border-amber-500/60 bg-amber-500/10 text-amber-200'
                }`}>
                  <div className="flex items-center gap-1.5 font-bold">
                    {latestScanReport.isReactionVerified ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-amber-400" />
                    )}
                    {latestScanReport.sampleName} [{latestScanReport.sampleFormula}]
                  </div>
                  <div className="text-[11px] leading-relaxed opacity-90">{latestScanReport.notes}</div>
                  <div className="flex gap-4 pt-1 text-[10px] opacity-80">
                    <span>PURITY: {latestScanReport.purity}%</span>
                    <span>pH: {latestScanReport.ph}</span>
                    <span>PEAK: {latestScanReport.absorbancePeakNm} nm</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Station Help & Keybindings */}
      <div className="pointer-events-auto flex items-center justify-between text-[11px] font-mono text-slate-400 bg-[#111418]/90 border border-[#2A323D] px-4 py-2">
        <span>CHEMORA SIMULATION OS v1.0</span>
        <div className="flex gap-4">
          <span>[ESC]: RETURN TO LAB WALKING</span>
          <span>[TAB]: OPEN JOURNAL</span>
        </div>
      </div>
    </div>
  );
};
