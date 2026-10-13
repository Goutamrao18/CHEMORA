import React from 'react';
import { useGameStore } from './gameState';

const STEPS = [
  { title: '1 · Put on PPE', prompt: 'Before handling chemicals, put on goggles, gloves and your lab coat.', action: 'Put on all three PPE items in the Safety panel.', done: (s: ReturnType<typeof useGameStore.getState>) => s.ppe.goggles && s.ppe.gloves && s.ppe.coat },
  { title: '2 · Pick up a beaker', prompt: 'Aim at the Beaker set on the main-lab shelf and interact, or use the pickup control.', action: 'Pick up glass-beaker-set.', done: (s: ReturnType<typeof useGameStore.getState>) => /beaker/i.test(s.heldEquipmentId ?? '') },
  { title: '3 · Weigh a reagent', prompt: 'Use the analytical balance action to record a simulated mass reading.', action: 'Record a weighing.', done: (s: ReturnType<typeof useGameStore.getState>) => s.completedTasks.includes('weigh') },
  { title: '4 · Add liquid', prompt: 'Add a small measured amount of sodium hydroxide to the reaction beaker.', action: 'Add 10 mL NaOH to Reaction Beaker.', done: (s: ReturnType<typeof useGameStore.getState>) => (s.vessels.beaker_main?.content.volumeMl ?? 0) > 0 },
  { title: '5 · Heat safely', prompt: 'Run the heating procedure after confirming PPE is on.', action: 'Run the heat procedure.', done: (s: ReturnType<typeof useGameStore.getState>) => s.completedTasks.includes('heat') },
  { title: '6 · Record in the journal', prompt: 'Open the Research Journal and mark this first lab as recorded.', action: 'Open journal and finish tutorial.', done: (s: ReturnType<typeof useGameStore.getState>) => s.completedTasks.includes('tutorial-journal') },
];

export const TutorialGuide: React.FC = () => {
  const started = useGameStore((s) => s.hasStartedGame);
  const [dismissed, setDismissed] = React.useState(false);
  const tutorialSignal = useGameStore((s) => `${s.ppe.goggles}-${s.ppe.gloves}-${s.ppe.coat}-${s.heldEquipmentId}-${s.completedTasks.join(',')}-${s.vessels.beaker_main?.content.volumeMl ?? 0}`);
  void tutorialSignal;
  const [refresh, setRefresh] = React.useState(0);
  void refresh;
  const stepIndex = STEPS.findIndex((step) => !step.done(useGameStore.getState()));
  if (!started || dismissed || stepIndex < 0) return null;
  const step = STEPS[stepIndex];
  const doStep = () => {
    const store = useGameStore.getState();
    if (stepIndex === 0) { (['goggles', 'gloves', 'coat'] as const).forEach((item) => { if (!store.ppe[item]) store.togglePPE(item); }); }
    else if (stepIndex === 1) store.pickUpEquipment('glass-beaker-set', [-2, 2.42, -6.55]);
    else if (stepIndex === 2) store.recordLabAction('weigh');
    else if (stepIndex === 3) store.dispenseReagentIntoVessel('beaker_main', 'naoh', 10);
    else if (stepIndex === 4) store.recordLabAction('heat');
    else { store.completeTask('tutorial-journal'); store.setJournalOpen(true); }
    setRefresh((v) => v + 1);
  };
  return <aside aria-live="polite" style={{ position: 'fixed', top: 'max(58px, env(safe-area-inset-top))', left: '50%', transform: 'translateX(-50%)', zIndex: 44, width: 'min(430px, calc(100vw - 24px))', padding: '12px 14px', borderRadius: 12, border: '1px solid #39859a', background: 'rgba(5,19,29,.95)', color: '#e6faff', boxShadow: '0 8px 28px #0008', font: '13px/1.4 system-ui,sans-serif' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><strong>{step.title}</strong><button type="button" onClick={() => setDismissed(true)} style={{ minHeight: 36, padding: '6px 10px', borderRadius: 7, background: '#18313d', color: 'white' }}>Hide</button></div>
    <p style={{ margin: '7px 0' }}>{step.prompt}</p><button type="button" onClick={doStep} style={{ width: '100%', minHeight: 42, padding: '9px 12px', borderRadius: 8, background: '#0e7490', color: 'white', fontWeight: 700 }}>{step.action}</button>
    <div style={{ marginTop: 6, opacity: .75, fontSize: 11 }}>Step {stepIndex + 1} of {STEPS.length} · You can also perform the action in the lab.</div>
  </aside>;
};
