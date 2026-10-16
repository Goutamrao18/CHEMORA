import { CircleDot, Sparkles, Waves, Wind } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../gameplay/gameState';

export const ReactionAnimation: React.FC = () => {
  const event = useGameStore((s) => s.reactionVisualEvent);
  const vessels = useGameStore((s) => s.vessels);
  const [visibleId, setVisibleId] = useState<number | null>(null);
  useEffect(() => {
    if (!event) return;
    setVisibleId(event.id);
    const timer = window.setTimeout(() => setVisibleId((current) => current === event.id ? null : current), 2600);
    return () => window.clearTimeout(timer);
  }, [event]);
  if (!event || visibleId !== event.id) return null;
  const vessel = vessels[event.vesselId];
  const Icon = event.kind === 'gas' ? Wind : event.kind === 'precipitate' ? CircleDot : event.kind === 'glow' ? Sparkles : Waves;
  const title = vessel?.content.productName || event.title;
  const detail = vessel?.content.productFormula ? `${vessel.content.productFormula} · pH ${vessel.content.ph.toFixed(1)}` : `${vessel?.content.volumeMl.toFixed(1) ?? '—'} mL in ${vessel?.name ?? 'vessel'}`;
  return <div key={event.id} className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
    <div className="absolute inset-0 animate-pulse opacity-20" style={{ background: `radial-gradient(circle at 50% 52%, ${event.color}55, transparent 38%)`, animationDuration: '1.2s' }}/>
    {Array.from({ length: 14 }, (_, i) => <span key={i} className="reaction-particle absolute h-2 w-2 rounded-full" style={{ left: `${50 + Math.cos(i * 2.399) * (12 + (i % 4) * 7)}%`, top: `${52 + Math.sin(i * 2.399) * (10 + (i % 5) * 4)}%`, background: event.color, boxShadow: `0 0 14px ${event.color}`, animationDelay: `${i * 35}ms` }} />)}
    <div className="reaction-card relative mx-4 mt-40 max-w-md border border-white/20 bg-slate-950/90 px-6 py-4 text-center shadow-2xl backdrop-blur-md" style={{ boxShadow: `0 0 40px ${event.color}30` }}>
      <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border border-white/20" style={{ color: event.color, background: `${event.color}20` }}><Icon className="h-5 w-5"/></div>
      <div className="text-[10px] font-bold tracking-[0.25em] text-cyan-200">REACTION EVENT</div><div className="mt-1 text-sm font-black text-white">{title}</div><div className="mt-1 text-xs text-slate-300">{detail}</div>
      <div className="mt-3 h-1 overflow-hidden bg-slate-800"><div className="reaction-progress h-full" style={{ background: event.color }}/></div>
    </div>
    <style>{`@keyframes chemora-particle { 0%{transform:translate3d(0,30px,0) scale(.2);opacity:0} 25%{opacity:1} 100%{transform:translate3d(0,-95px,0) scale(1.3);opacity:0} } .reaction-particle{animation:chemora-particle 1.8s ease-out both} @keyframes chemora-card{0%{transform:translateY(18px) scale(.88);opacity:0}15%{transform:translateY(0) scale(1);opacity:1}80%{opacity:1}100%{opacity:0;transform:translateY(-12px) scale(.98)}} .reaction-card{animation:chemora-card 2.6s ease both} @keyframes chemora-progress{from{width:100%}to{width:0}} .reaction-progress{animation:chemora-progress 2.5s linear both}`}</style>
  </div>;
};
