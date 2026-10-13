// Laboratory Audio Synthesizer using Tone.js
import * as Tone from 'tone';

let isToneStarted = false;
let ambientFilter: Tone.Filter | null = null;
let ambientNoise: Tone.Noise | null = null;
let bubbleSynth: Tone.MembraneSynth | null = null;
let pourSynth: Tone.NoiseSynth | null = null;
let beepSynth: Tone.Synth | null = null;
let discoveryPoly: Tone.PolySynth | null = null;
let burnerNoise: Tone.Noise | null = null;
let masterVolume = 0.65;
let muted = false;
let footstepsAt = 0;

export function setAudioVolume(value: number) { masterVolume = Math.max(0, Math.min(1, value)); applyMasterVolume(); }
export function setAudioMuted(value: boolean) { muted = value; applyMasterVolume(); }
function applyMasterVolume() { if (Tone.Destination) Tone.Destination.volume.value = muted || masterVolume <= 0 ? -Infinity : 20 * Math.log10(masterVolume); }
export function isAudioReady() { return isToneStarted; }

export async function initAudio(): Promise<boolean> {
  if (isToneStarted) return true;
  try {
    await Tone.start();
    isToneStarted = true;

    // Laboratory ventilation / ambient HVAC hum
    ambientFilter = new Tone.Filter({ frequency: 180, type: 'lowpass' }).toDestination();
    ambientNoise = new Tone.Noise('pink');
    ambientNoise.volume.value = -32;
    ambientNoise.connect(ambientFilter);
    ambientNoise.start();
    burnerNoise = new Tone.Noise('white');
    burnerNoise.volume.value = -34;
    burnerNoise.connect(ambientFilter);
    applyMasterVolume();

    // Digital Scale / Device beeps
    beepSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.05 },
    }).toDestination();
    beepSynth.volume.value = -18;

    // Liquid pouring noise generator
    pourSynth = new Tone.NoiseSynth({
      noise: { type: 'brown' },
      envelope: { attack: 0.05, decay: 0.25, sustain: 0.05, release: 0.1 },
    }).toDestination();
    pourSynth.volume.value = -22;

    // Bubbling effervescence synthesizer
    bubbleSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0.01, release: 0.05 },
    }).toDestination();
    bubbleSynth.volume.value = -16;

    // Scientific Discovery Fanfare
    discoveryPoly = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.2, release: 0.8 },
    }).toDestination();
    discoveryPoly.volume.value = -14;

    return true;
  } catch (err) {
    console.warn('Audio initialization deferred or prevented:', err);
    return false;
  }
}

export function playGlasswareClick() {
  if (!isToneStarted || !beepSynth) return;
  try {
    beepSynth.triggerAttackRelease('C7', '32n');
  } catch {
    // ignore
  }
}

export function playScaleBeep() {
  if (!isToneStarted || !beepSynth) return;
  try {
    beepSynth.triggerAttackRelease('E6', '16n');
  } catch {
    // ignore
  }
}

export function playPourLiquid() {
  if (!isToneStarted || !pourSynth) return;
  try {
    pourSynth.triggerAttackRelease('8n');
  } catch {
    // ignore
  }
}

export function playBubbleEffervescence() {
  if (!isToneStarted || !bubbleSynth) return;
  try {
    const notes = ['C5', 'E5', 'G5', 'B5', 'C6'];
    const note = notes[Math.floor(Math.random() * notes.length)];
    bubbleSynth.triggerAttackRelease(note, '32n');
  } catch {
    // ignore
  }
}

export function playReactionComplete() {
  if (!isToneStarted || !discoveryPoly) return;
  try {
    const now = Tone.now();
    discoveryPoly.triggerAttackRelease(['C5', 'E5', 'G5', 'B5'], '8n', now);
    discoveryPoly.triggerAttackRelease(['E5', 'G5', 'B5', 'D6'], '4n', now + 0.25);
  } catch {
    // ignore
  }
}

export function playAnalysisScan() {
  if (!isToneStarted || !beepSynth) return;
  try {
    const now = Tone.now();
    beepSynth.triggerAttackRelease('A5', '32n', now);
    beepSynth.triggerAttackRelease('D6', '32n', now + 0.1);
    beepSynth.triggerAttackRelease('G6', '16n', now + 0.2);
  } catch {
    // ignore
  }
}


export function playPickupClink() { playGlasswareClick(); }
export function playPlaceClink() { playGlasswareClick(); }
export function playWarningBeep() { if (!isToneStarted || !beepSynth) return; try { beepSynth.triggerAttackRelease('A5', '16n'); beepSynth.triggerAttackRelease('F#5', '16n', Tone.now() + 0.18); } catch {} }
export function playDoorSound(locked = false) { if (!isToneStarted || !beepSynth) return; try { beepSynth.triggerAttackRelease(locked ? 'C4' : 'G5', locked ? '8n' : '32n'); } catch {} }
export function setBurnerActive(active: boolean) { if (!isToneStarted || !burnerNoise) return; try { if (active && burnerNoise.state !== 'started') burnerNoise.start(); else if (!active && burnerNoise.state === 'started') burnerNoise.stop(); } catch {} }
export function playFootstep(floorType: 'tile' | 'rubber' | 'concrete' = 'tile') {
  if (!isToneStarted || !beepSynth || muted || masterVolume <= 0) return;
  const now = performance.now(); if (now - footstepsAt < 330) return; footstepsAt = now;
  try { const note = floorType === 'rubber' ? 'C4' : floorType === 'concrete' ? 'E4' : 'G4'; beepSynth.triggerAttackRelease(note, '64n'); } catch {}
}
