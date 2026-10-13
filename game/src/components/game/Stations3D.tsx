import React from 'react';
import * as THREE from 'three';
import { useGameStore } from '../../gameplay/gameState';
import { REAGENTS_CATALOG } from '../../gameplay/chemistry';
import { LabVessel3D } from './LabVessel3D';

export const Stations3D: React.FC = () => {
  const activeStation = useGameStore((s) => s.activeStation);
  const setActiveStation = useGameStore((s) => s.setActiveStation);
  const vessels = useGameStore((s) => s.vessels);
  const workbenchVesselId = useGameStore((s) => s.workbenchVesselId);
  const scaleVesselId = useGameStore((s) => s.scaleVesselId);
  const analysisVesselId = useGameStore((s) => s.analysisVesselId);
  const hotplateTempC = useGameStore((s) => s.hotplateTempC);
  const isHotplateOn = useGameStore((s) => s.isHotplateOn);
  const selectedDispenserReagentId = useGameStore((s) => s.selectedDispenserReagentId);
  const setSelectedDispenserReagent = useGameStore((s) => s.setSelectedDispenserReagent);

  const workbenchVessel = workbenchVesselId ? vessels[workbenchVesselId] : null;
  const scaleVessel = scaleVesselId ? vessels[scaleVesselId] : null;
  const analysisVessel = analysisVesselId ? vessels[analysisVesselId] : null;


  return (
    <group>
      {/* ========================================================
          STATION 1: REAGENT DISPENSING & STORAGE BENCH (West: X = -5)
      ======================================================== */}
      <group position={[-5.2, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        {/* Bench Structure */}
        <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.2, 0.9, 1.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.4} />
        </mesh>
        {/* Chemical Resistant Black Epoxy Top */}
        <mesh position={[0, 0.92, 0]} receiveShadow>
          <boxGeometry args={[4.3, 0.05, 1.5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.7} />
        </mesh>

        {/* Shelf Rack for Reagent Bottles */}
        <group position={[0, 0.95, -0.45]}>
          <mesh position={[0, 0.35, 0]}>
            <boxGeometry args={[3.8, 0.03, 0.35]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
          <mesh position={[0, 0.7, 0]}>
            <boxGeometry args={[3.8, 0.03, 0.35]} />
            <meshStandardMaterial color="#334155" />
          </mesh>
        </group>

        {/* Reagent Bottles on lower counter and shelves */}
        {Object.values(REAGENTS_CATALOG).map((reagent, idx) => {
          const col = idx % 5;
          const row = Math.floor(idx / 5);
          const posX = -1.5 + col * 0.75;
          const posZ = row === 0 ? 0.2 : -0.45;
          const posY = row === 0 ? 0.95 : 1.32;

          return (
            <group
              key={reagent.id}
              position={[posX, posY, posZ]}
              onClick={(event) => {
                event.stopPropagation();
                setSelectedDispenserReagent(reagent.id);
              }}
              onPointerOver={() => {
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={() => {
                document.body.style.cursor = 'default';
              }}
            >
              {/* Clicking a physical bottle selects this reagent in the dispenser UI. */}
              {/* Bottle Body */}
              <mesh position={[0, 0.16, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.3, 24]} />
                <meshStandardMaterial color="#e2e8f0" transparent opacity={0.8} roughness={0.2} />
              </mesh>
              {/* Liquid inside bottle */}
              <mesh position={[0, 0.13, 0]}>
                <cylinderGeometry args={[0.076, 0.076, 0.22, 24]} />
                <meshStandardMaterial color={reagent.color} transparent opacity={0.75} roughness={0.3} />
              </mesh>
              {/* Screw Cap */}
              <mesh position={[0, 0.32, 0]}>
                <cylinderGeometry args={[0.045, 0.045, 0.05, 16]} />
                <meshStandardMaterial
                  color={selectedDispenserReagentId === reagent.id ? '#22d3ee' : '#0284c7'}
                  emissive={selectedDispenserReagentId === reagent.id ? '#0891b2' : '#000000'}
                  emissiveIntensity={selectedDispenserReagentId === reagent.id ? 0.65 : 0}
                />
              </mesh>
              {/* Label Decal */}
              <mesh position={[0, 0.16, 0.082]}>
                <planeGeometry args={[0.1, 0.08]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            </group>
          );
        })}

        {/* Station Target Zone Hover Marker */}
        <mesh
          position={[0, 0.96, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={() => setActiveStation('dispensing')}
        >
          <planeGeometry args={[4.2, 1.4]} />
          <meshBasicMaterial
            color="#0ea5e9"
            transparent
            opacity={activeStation === 'dispensing' ? 0.18 : 0.04}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ========================================================
          STATION 2: PRECISION MEASUREMENT BENCH (North: Z = -5)
      ======================================================== */}
      <group position={[0, 0, -5.2]}>
        {/* Bench Structure */}
        <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.2, 0.9, 1.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.92, 0]} receiveShadow>
          <boxGeometry args={[4.3, 0.05, 1.5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.7} />
        </mesh>

        {/* Digital Analytical Balance (Scale) */}
        <group position={[-0.8, 0.95, 0]}>
          {/* Scale Housing */}
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.7, 0.08, 0.65]} />
            <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.5} />
          </mesh>
          {/* Stainless Weighing Pan */}
          <mesh position={[0, 0.085, -0.05]}>
            <cylinderGeometry args={[0.22, 0.22, 0.015, 32]} />
            <meshStandardMaterial color="#e2e8f0" metalness={0.95} roughness={0.1} />
          </mesh>
          {/* Digital LED Display */}
          <mesh position={[0, 0.07, 0.22]} rotation={[-Math.PI / 6, 0, 0]}>
            <planeGeometry args={[0.34, 0.08]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>

          {/* Scale Vessel if placed */}
          {scaleVessel && (
            <group position={[0, 0.09, -0.05]}>
              <LabVessel3D vessel={scaleVessel} scale={0.9} />
            </group>
          )}
        </group>

        {/* Graduated Cylinder Stand */}
        <group position={[0.8, 0.95, -0.1]}>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.6, 0.04, 0.4]} />
            <meshStandardMaterial color="#1e293b" />
          </mesh>
        </group>

        {/* Interactive Click Plane */}
        <mesh
          position={[0, 0.96, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={() => setActiveStation('measurement')}
        >
          <planeGeometry args={[4.2, 1.4]} />
          <meshBasicMaterial
            color="#0ea5e9"
            transparent
            opacity={activeStation === 'measurement' ? 0.18 : 0.04}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ========================================================
          STATION 3: REACTION WORKBENCH (East: X = 5)
      ======================================================== */}
      <group position={[5.2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        {/* Bench Structure */}
        <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.2, 0.9, 1.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.92, 0]} receiveShadow>
          <boxGeometry args={[4.3, 0.05, 1.5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.7} />
        </mesh>

        {/* Hotplate / Magnetic Stirrer Unit */}
        <group position={[0, 0.95, 0]}>
          {/* Base Unit */}
          <mesh position={[0, 0.05, 0]}>
            <boxGeometry args={[0.75, 0.1, 0.75]} />
            <meshStandardMaterial color="#334155" roughness={0.3} metalness={0.6} />
          </mesh>
          {/* Ceramic Top Plate */}
          <mesh position={[0, 0.105, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.02, 32]} />
            <meshStandardMaterial
              color={isHotplateOn && hotplateTempC > 40 ? '#ef4444' : '#e2e8f0'}
              roughness={0.2}
              emissive={isHotplateOn && hotplateTempC > 40 ? '#ef4444' : '#000000'}
              emissiveIntensity={isHotplateOn ? 0.4 : 0}
            />
          </mesh>
          {/* Knobs & Indicators */}
          <mesh position={[-0.2, 0.05, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
          <mesh position={[0.2, 0.05, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.02, 16]} />
            <meshStandardMaterial color="#f59e0b" />
          </mesh>

          {/* Workbench Vessel Placed on Stirrer */}
          {workbenchVessel && (
            <group position={[0, 0.115, 0]}>
              <LabVessel3D vessel={workbenchVessel} scale={1.05} />
            </group>
          )}
        </group>

        {/* Test Tube Rack */}
        <group position={[1.3, 0.95, -0.2]}>
          <mesh position={[0, 0.12, 0]}>
            <boxGeometry args={[0.8, 0.24, 0.24]} />
            <meshStandardMaterial color="#475569" wireframe={false} roughness={0.4} />
          </mesh>
          {/* Test Tubes */}
          {[-0.25, -0.08, 0.08, 0.25].map((x, idx) => (
            <mesh key={idx} position={[x, 0.18, 0]}>
              <cylinderGeometry args={[0.025, 0.025, 0.28, 12]} />
              <meshStandardMaterial color="#ffffff" transparent opacity={0.35} roughness={0.1} />
            </mesh>
          ))}
        </group>

        {/* Interactive Click Plane */}
        <mesh
          position={[0, 0.96, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={() => setActiveStation('workbench')}
        >
          <planeGeometry args={[4.2, 1.4]} />
          <meshBasicMaterial
            color="#0ea5e9"
            transparent
            opacity={activeStation === 'workbench' ? 0.18 : 0.04}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* ========================================================
          STATION 4: ANALYTICAL SPECTROPHOTOMETER (South: Z = 5)
      ======================================================== */}
      <group position={[0, 0, 5.2]} rotation={[0, Math.PI, 0]}>
        {/* Bench Structure */}
        <mesh position={[0, 0.45, 0]} receiveShadow castShadow>
          <boxGeometry args={[4.2, 0.9, 1.4]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.4} />
        </mesh>
        <mesh position={[0, 0.92, 0]} receiveShadow>
          <boxGeometry args={[4.3, 0.05, 1.5]} />
          <meshStandardMaterial color="#0f172a" roughness={0.15} metalness={0.7} />
        </mesh>

        {/* High-Precision UV-Vis Spectrophotometer Enclosure */}
        <group position={[0, 0.95, 0]}>
          {/* Main Chassis */}
          <mesh position={[0, 0.18, 0]}>
            <boxGeometry args={[1.2, 0.36, 0.8]} />
            <meshStandardMaterial color="#334155" roughness={0.25} metalness={0.6} />
          </mesh>
          {/* Sample Well Chamber (Left side) */}
          <mesh position={[-0.35, 0.37, 0]}>
            <boxGeometry args={[0.35, 0.04, 0.35]} />
            <meshStandardMaterial color="#0284c7" />
          </mesh>
          {/* Analytical Touch Display Screen (Right side) */}
          <mesh position={[0.28, 0.3, 0.2]} rotation={[-Math.PI / 4, 0, 0]}>
            <planeGeometry args={[0.48, 0.32]} />
            <meshBasicMaterial color="#0f172a" />
          </mesh>
          {/* Screen Content Simulation */}
          <mesh position={[0.28, 0.302, 0.201]} rotation={[-Math.PI / 4, 0, 0]}>
            <planeGeometry args={[0.44, 0.28]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>

          {/* Analysis Vessel in Sample Chamber */}
          {analysisVessel && (
            <group position={[-0.35, 0.38, 0]}>
              <LabVessel3D vessel={analysisVessel} scale={0.8} />
            </group>
          )}
        </group>

        {/* Interactive Click Plane */}
        <mesh
          position={[0, 0.96, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={() => setActiveStation('analysis')}
        >
          <planeGeometry args={[4.2, 1.4]} />
          <meshBasicMaterial
            color="#0ea5e9"
            transparent
            opacity={activeStation === 'analysis' ? 0.18 : 0.04}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  );
};
