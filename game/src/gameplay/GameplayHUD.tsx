import React, { useEffect } from 'react';
import { useGameStore } from './gameState';

type EquipmentActionDetail = { id: string; label: string; prompt: string; position?: [number, number, number] };
const CARRYABLE = /glassware|bottle|pipette|flask|beaker|clamp|burner|tool|spatula|tongs|thermometer|rack/i;
export const GameplayHUD: React.FC = () => {
  const ppe = useGameStore((s) => s.ppe);
  const score = useGameStore((s) => s.safetyScore);
  const warnings = useGameStore((s) => s.safetyWarnings);
  const incident = useGameStore((s) => s.activeIncident);
  const held = useGameStore((s) => s.heldEquipmentId);
  const notification = useGameStore((s) => s.latestNotification);
  const togglePPE = useGameStore((s) => s.togglePPE);
  const pickUp = useGameStore((s) => s.pickUpEquipment);
  const placeDrop = useGameStore((s) => s.placeOrDropEquipment);
  const record = useGameStore((s) => s.recordLabAction);
  const trigger = useGameStore((s) => s.triggerIncident);
  const respond = useGameStore((s) => s.respondToIncident);
  useEffect(() => {
    const action = (event: Event) => {
      const target = (event as CustomEvent<EquipmentActionDetail>).detail;
      if (!target) return;
      const state = useGameStore.getState();
      if (state.heldEquipmentId) {
        if (/waste-(organic|acid|base|solid|sharps)/.test(target.id)) {
          const classMatch = target.id.split('-')[1];
          const item = state.heldEquipmentId.toLowerCase();
          const correct = (classMatch === 'acid' && /acid|hcl|vinegar/.test(item)) || (classMatch === 'base' && /base|naoh|alkali/.test(item)) || (classMatch === 'organic' && /organic|solvent|ethanol/.test(item)) || (classMatch === 'solid' && /solid|powder/.test(item)) || (classMatch === 'sharps' && /sharp|broken glass/.test(item));
          if (!correct) useGameStore.setState({ safetyScore: Math.max(0, state.safetyScore - 10), latestNotification: 'Wrong waste stream! Safety score -10.' });
          else useGameStore.setState({ safetyScore: Math.min(100, state.safetyScore + 1), latestNotification: 'Correct waste stream.' });
          placeDrop(); return;
        }
        placeDrop(target.id, target.position); return;
      }
      if (target.id !== 'safety-ppe-rack' && (CARRYABLE.test(target.id) || CARRYABLE.test(target.label))) { pickUp(target.id, target.position); return; }
      if (target.id === 'safety-ppe-rack') { useGameStore.setState({ latestNotification: 'Use the PPE controls in the safety HUD to put on goggles, gloves and a lab coat.' }); return; }
      if (/balance/.test(target.id)) record('weigh');
      else if (/ph-meter/.test(target.id)) record('measure-ph');
      else if (/burner|hotplate/.test(target.id)) record('heat');
      else if (/waste-/.test(target.id)) record('dispose');
      else useGameStore.setState({ latestNotification: target.prompt || `Inspect ${target.label}` });
    };
    window.addEventListener('chemora-equipment-action', action);
    return () => window.removeEventListener('chemora-equipment-action', action);
  }, [pickUp, placeDrop, record]);
  if (!useGameStore((s) => s.hasStartedGame)) return null;
  const btn: React.CSSProperties = { border: '1px solid #4b6474', background: '#10212c', color: '#e7f7ff', borderRadius: 7, padding: '7px 9px', fontSize: 11, touchAction: 'manipulation' };
  const panel: React.CSSProperties = { position: 'fixed', left: 12, bottom: 12, zIndex: 42, background: 'rgba(6,17,26,.92)', color: '#e7f7ff', border: '1px solid #34505f', borderRadius: 10, padding: 10, font: '12px system-ui,sans-serif', maxWidth: 'min(94vw,390px)' };
  return <>
    <div style={panel} aria-live="polite">
      <strong>SAFETY {score}/100</strong><span style={{ marginLeft: 10 }}>{ppe.goggles ? '🥽' : '⚠️'} {ppe.gloves ? '🧤' : '⚠️'} {ppe.coat ? '🥼' : '⚠️'}</span>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>{(['goggles','gloves','coat'] as const).map((item) => <button key={item} style={btn} onClick={() => togglePPE(item)}>{ppe[item] ? 'Remove ' : 'Put on '}{item}</button>)}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 7 }}>{(['titrate','filter','heat','stir','weigh','measure-ph','dispose'] as const).map((item) => <button key={item} style={btn} onClick={() => record(item)}>{item === 'measure-ph' ? 'Measure pH' : item[0].toUpperCase()+item.slice(1)}</button>)}</div>
      <div style={{ display: 'flex', gap: 5, marginTop: 7 }}><button style={btn} onClick={() => held ? placeDrop() : useGameStore.setState({ latestNotification: 'Aim at glassware, bottles or tools and press INTERACT / E to pick up.' })}>{held ? 'Drop / Place item' : 'Pick up item'}</button><button style={btn} onClick={() => trigger('spill')}>Spill drill</button><button style={btn} onClick={() => trigger('fire')}>Fire drill</button><button style={btn} onClick={() => trigger('broken-glass')}>Broken glass</button></div>
      {incident && <div style={{ marginTop: 7, display: 'flex', gap: 5, flexWrap: 'wrap' }}><b>Respond:</b>{(incident === 'spill' ? [['spill-kit','Use spill kit']] : incident === 'fire' ? [['extinguisher','Use extinguisher']] : [['cleanup','Clean up safely']]).map(([response,label]) => <button key={response} style={btn} onClick={() => respond(response as 'spill-kit'|'extinguisher'|'cleanup')}>{label}</button>)}</div>}
      {warnings.length > 0 && <div style={{ color: '#fbbf24', marginTop: 5 }}>{warnings[warnings.length - 1]}</div>}
      {held && <div style={{ marginTop: 5 }}>Carrying: {held}</div>}
      <div style={{ marginTop: 5, opacity: .8 }}>{notification}</div>
    </div>
  </>;
};
