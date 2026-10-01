// Sounds and music, made on the spot with the browser's Web Audio API: there are no
// sound files to download, license or store, and it all works offline.
// See project.md section 9. Browsers only allow sound after the first tap, so nothing
// plays until unlockAudio() has been called from a tap.

import { useSyncExternalStore } from 'react';
import { loadPrefs, savePrefs, type SoundPrefs } from '../save/prefs';

export type SoundName = 'ding' | 'coin' | 'seagull' | 'goal' | 'fanfare' | 'sad' | 'doorbell';

let prefs: SoundPrefs = loadPrefs();
const listeners = new Set<() => void>();

let ctx: AudioContext | null = null;
let sfxBus: GainNode | null = null;
let musicBus: GainNode | null = null;
let ambienceBus: GainNode | null = null;

// ---------- Settings ----------

export function soundPrefs(): SoundPrefs {
  return prefs;
}

export function setSoundPrefs(change: Partial<SoundPrefs>): void {
  prefs = { ...prefs, ...change };
  savePrefs(prefs);
  applyVolumes();
  if (musicWanted()) startMusic();
  else stopMusic();
  listeners.forEach((listener) => listener());
}

/** React hook: the current sound settings, re-rendering when they change. */
export function useSoundPrefs(): SoundPrefs {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => prefs,
  );
}

const musicWanted = () => prefs.music && !prefs.muted;
const soundWanted = () => prefs.sound && !prefs.muted;

// ---------- The audio graph ----------

function audio(): AudioContext | null {
  if (ctx) return ctx;
  if (typeof window === 'undefined') return null;
  const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Context) return null;
  try {
    ctx = new Context();
  } catch {
    return null;
  }
  const bus = (volume: number) => {
    const gain = ctx!.createGain();
    gain.gain.value = volume;
    gain.connect(ctx!.destination);
    return gain;
  };
  sfxBus = bus(0);
  musicBus = bus(0);
  ambienceBus = bus(0);
  applyVolumes();
  return ctx;
}

function applyVolumes(): void {
  if (!ctx || !sfxBus || !musicBus || !ambienceBus) return;
  const now = ctx.currentTime;
  sfxBus.gain.setTargetAtTime(soundWanted() ? 0.7 : 0, now, 0.05);
  ambienceBus.gain.setTargetAtTime(soundWanted() ? 0.5 : 0, now, 0.3);
  musicBus.gain.setTargetAtTime(musicWanted() ? 0.45 : 0, now, 0.3);
}

/** Call from a tap: browsers keep sound switched off until the player has touched the page. */
export function unlockAudio(): void {
  const c = audio();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  if (musicWanted()) startMusic();
}

interface ToneOptions {
  type?: OscillatorType;
  volume?: number;
  attack?: number;
  /** Slide the pitch to this frequency by the end. */
  glideTo?: number;
  bus?: GainNode | null;
}

/** One note with a soft attack and a gentle fade. */
function tone(freq: number, start: number, duration: number, options: ToneOptions = {}): void {
  const c = ctx;
  const bus = options.bus ?? sfxBus;
  if (!c || !bus) return;
  const { type = 'sine', volume = 0.2, attack = 0.008 } = options;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (options.glideTo) osc.frequency.exponentialRampToValueAtTime(options.glideTo, start + duration);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(bus);
  osc.start(start);
  osc.stop(start + duration + 0.05);
}

/** A gull's "kee-ow": a bright, wavering cry. */
function gullCry(start: number, length: number): void {
  const c = ctx;
  if (!c || !sfxBus) return;
  const osc = c.createOscillator();
  const filter = c.createBiquadFilter();
  const gain = c.createGain();
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(950, start);
  osc.frequency.linearRampToValueAtTime(1550, start + 0.06);
  osc.frequency.exponentialRampToValueAtTime(720, start + length);
  filter.type = 'bandpass';
  filter.frequency.value = 1500;
  filter.Q.value = 2.5;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(0.09, start + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length);
  osc.connect(filter).connect(gain).connect(sfxBus);
  osc.start(start);
  osc.stop(start + length + 0.05);
}

const NOTE = (semitonesFromA4: number) => 440 * 2 ** (semitonesFromA4 / 12);
const C5 = NOTE(3);
const E5 = NOTE(7);
const G5 = NOTE(10);
const C6 = NOTE(15);

let lastDing = 0;

/** Plays one of the game's sound effects, if sounds are on. */
export function play(name: SoundName): void {
  const c = audio();
  if (!c || !soundWanted() || c.state !== 'running') return;
  const t = c.currentTime + 0.01;
  switch (name) {
    case 'ding':
      // The till. Rushes of guests shouldn't turn into a machine gun.
      if (t - lastDing < 0.35) return;
      lastDing = t;
      tone(1568, t, 0.9, { volume: 0.12 });
      tone(2349, t, 0.6, { volume: 0.05 });
      tone(3136, t, 0.25, { volume: 0.02 });
      break;
    case 'coin':
      tone(988, t, 0.09, { type: 'triangle', volume: 0.14 });
      tone(1319, t + 0.07, 0.28, { type: 'triangle', volume: 0.14 });
      break;
    case 'seagull':
      gullCry(t, 0.42);
      gullCry(t + 0.5, 0.3);
      gullCry(t + 0.85, 0.3);
      break;
    case 'doorbell':
      tone(2093, t, 0.5, { volume: 0.08 });
      tone(2637, t + 0.12, 0.7, { volume: 0.08 });
      break;
    case 'goal':
      [C5, E5, G5].forEach((f, i) => tone(f, t + i * 0.12, 0.3, { type: 'triangle', volume: 0.14 }));
      tone(C6, t + 0.36, 0.9, { type: 'triangle', volume: 0.16 });
      break;
    case 'fanfare':
      [C5, E5, G5, C6].forEach((f, i) => tone(f, t + i * 0.16, 0.4, { type: 'triangle', volume: 0.15 }));
      [C5, E5, G5, C6].forEach((f) => tone(f, t + 0.7, 2, { type: 'triangle', volume: 0.08, attack: 0.05 }));
      break;
    case 'sad':
      [G5, E5, C5].forEach((f, i) => tone(f / 2, t + i * 0.4, 0.7, { type: 'triangle', volume: 0.12 }));
      break;
  }
}

// ---------- Music: a gentle waltz ----------

/** Chords as semitones from A4, four bars of C, A minor, F and G, twice over. */
const CHORDS = [
  [3, 7, 10],
  [0, 3, 7],
  [-4, 0, 3],
  [-2, 2, 5],
  [3, 7, 10],
  [-4, 0, 3],
  [-2, 2, 5],
  [3, 7, 10],
];
/** A pentatonic scale for the tune to wander around in (C D E G A). */
const TUNE = [3, 5, 7, 10, 12, 15, 17, 19];
const BEAT = 60 / 84;

let musicTimer: number | null = null;
let nextBarAt = 0;
let bar = 0;
let tuneStep = 3;

function scheduleBar(start: number): void {
  const chord = CHORDS[bar % CHORDS.length];
  const bus = musicBus;
  // Bass on the first beat, the chord softly on the second and third: oom-pah-pah.
  tone(NOTE(chord[0] - 24), start, BEAT * 2.5, { volume: 0.09, attack: 0.02, bus });
  for (const beat of [1, 2]) {
    for (const note of chord) tone(NOTE(note), start + beat * BEAT, BEAT * 0.8, { type: 'triangle', volume: 0.018, bus });
  }
  // A little tune that wanders up and down the scale, landing on the chord.
  const notes = Math.random() < 0.5 ? 2 : 3;
  for (let i = 0; i < notes; i++) {
    tuneStep = Math.max(0, Math.min(TUNE.length - 1, tuneStep + Math.floor(Math.random() * 3) - 1));
    const freq = NOTE(i === 0 ? chord[2] + 12 : TUNE[tuneStep] + 12);
    tone(freq, start + i * BEAT, BEAT * (notes === 2 && i === 1 ? 2 : 1) * 0.95, {
      type: 'triangle',
      volume: 0.035,
      attack: 0.03,
      bus,
    });
  }
  bar++;
}

function startMusic(): void {
  const c = ctx;
  if (!c || musicTimer !== null || c.state === 'closed') return;
  nextBarAt = c.currentTime + 0.3;
  musicTimer = window.setInterval(() => {
    if (!ctx || ctx.state !== 'running') return;
    // Keep a second of music scheduled ahead, so timers can be late without gaps.
    while (nextBarAt < ctx.currentTime + 1) {
      scheduleBar(nextBarAt);
      nextBarAt += BEAT * 3;
    }
  }, 250);
}

function stopMusic(): void {
  if (musicTimer === null) return;
  window.clearInterval(musicTimer);
  musicTimer = null;
}

// ---------- Café murmur while the restaurant is open ----------

let ambience: AudioBufferSourceNode | null = null;

/** Soft, low chatter: brown noise through a gentle filter. */
export function startAmbience(): void {
  const c = audio();
  if (!c || !ambienceBus || ambience) return;
  const seconds = 3;
  const buffer = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    data[i] = last * 3.5;
  }
  const source = c.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 650;
  const gain = c.createGain();
  gain.gain.value = 0.12;
  source.connect(filter).connect(gain).connect(ambienceBus);
  source.start();
  ambience = source;
}

export function stopAmbience(): void {
  if (!ambience) return;
  try {
    ambience.stop();
  } catch {
    // Already stopped.
  }
  ambience = null;
}
