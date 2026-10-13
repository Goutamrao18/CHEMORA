import React, { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, N8AO, SMAA } from '@react-three/postprocessing';
import { useGraphicsSettings } from './quality';

export const GraphicsPipeline: React.FC = () => {
  const { gl, scene } = useThree();
  const settings = useGraphicsSettings();
  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = settings.quality === 'Low' ? 1.0 : 1.08;
    gl.shadowMap.enabled = settings.quality === 'High';
    scene.traverse((obj) => { if (obj instanceof THREE.Mesh) obj.castShadow = settings.quality === 'High'; });
  }, [gl, scene, settings.quality]);
  if (!settings.postprocessing || settings.quality === 'Low') return null;
  return <EffectComposer multisampling={settings.quality === 'High' ? 2 : 0}><N8AO aoRadius={1.1} intensity={1.15} /><Bloom intensity={0.18} luminanceThreshold={0.86} luminanceSmoothing={0.2} /><SMAA /></EffectComposer>;
};
