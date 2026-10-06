// Concept art, round 5: one richly detailed scene in four treatments (project.md section 9.4).
// Round 4 was too simple; this round puts the detail first (mouldings, wallpaper, a bar with
// bottles and taps, parquet, food and glasses, ornamented Gdańsk facades, people with real
// proportions and poses, light from the window and the lamps) and then renders the same scene
// as modern HD pixel art, a hand-painted illustration, a soft 3D look and a detailed cartoon.
// Run with `npx tsx scripts/pixel/concepts-v5.ts`, then
// `node scripts/pixel/shoot.mjs art/concepts/v5/html art/concepts/v5` for the PNGs.

import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'art/concepts/v5/html';
const W = 1364;
const H = 603;

// ---------- Colours ----------

function rgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hex(c: number[]): string {
  return '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return hex(x.map((v, i) => v + (y[i] - v) * t));
}
const dark = (c: string, t: number) => mix(c, '#22142a', t);
const light = (c: string, t: number) => mix(c, '#fff8ec', t);
/** Warmer and more saturated, for the cartoon. */
function punch(c: string, t: number): string {
  const [r, g, b] = rgb(c);
  const avg = (r + g + b) / 3;
  return hex([r, g, b].map((v) => avg + (v - avg) * (1 + t)));
}

// ---------- Renderers ----------

type Treatment = 'pixel' | 'painted' | 'soft3d' | 'cartoon';
type Orient = 'top' | 'left' | 'right' | 'wallLeft' | 'wallBack' | 'flat';
type Volume = 'sphere' | 'cylinder' | 'flat';

/** How one treatment colours, shades and outlines things. Gradients are collected as it goes. */
class Renderer {
  defs: string[] = [];
  private seen = new Set<string>();
  constructor(public t: Treatment) {}

  get outline(): string {
    if (this.t === 'cartoon') return ' stroke="#2a1a24" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"';
    if (this.t === 'painted') return ' stroke="#5a3a2e" stroke-width="0.8" stroke-opacity="0.45" stroke-linejoin="round"';
    return '';
  }
  /** A thinner outline for small details. */
  get fine(): string {
    if (this.t === 'cartoon') return ' stroke="#2a1a24" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"';
    return '';
  }
  colour(c: string): string {
    return this.t === 'cartoon' ? punch(c, 0.25) : this.t === 'pixel' ? punch(c, 0.1) : c;
  }

  private grad(key: string, def: string): string {
    if (!this.seen.has(key)) {
      this.seen.add(key);
      this.defs.push(def);
    }
    return `url(#${key})`;
  }

  /** The fill for a flat face, lit from the window (front left) and the lamps above. */
  face(c0: string, o: Orient): string {
    const c = this.colour(c0);
    const base = o === 'top' || o === 'flat' ? c : o === 'left' ? dark(c, 0.08) : o === 'right' ? dark(c, 0.2) : o === 'wallLeft' ? dark(c, 0.02) : dark(c, 0.1);
    if (this.t === 'pixel' || this.t === 'cartoon') return base;
    const key = `f${this.t}${o}${c.slice(1)}`;
    const top = this.t === 'soft3d' ? light(base, 0.16) : light(base, 0.08);
    const bottom = this.t === 'soft3d' ? dark(base, 0.14) : dark(base, 0.1);
    const [x2, y2] = o === 'top' ? [1, 1] : [0, 1];
    return this.grad(key, `<linearGradient id="${key}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient>`);
  }

  /** The fill for something round: a head, a body, a pot. */
  volume(c0: string, v: Volume): string {
    const c = this.colour(c0);
    if (v === 'flat' || this.t === 'pixel' || this.t === 'cartoon') return c;
    const key = `v${this.t}${v}${c.slice(1)}`;
    if (v === 'sphere') {
      const hi = this.t === 'soft3d' ? light(c, 0.35) : light(c, 0.14);
      const lo = this.t === 'soft3d' ? dark(c, 0.28) : dark(c, 0.14);
      return this.grad(key, `<radialGradient id="${key}" cx="0.36" cy="0.32" r="0.78"><stop offset="0" stop-color="${hi}"/><stop offset="0.55" stop-color="${c}"/><stop offset="1" stop-color="${lo}"/></radialGradient>`);
    }
    const hi = this.t === 'soft3d' ? light(c, 0.25) : light(c, 0.1);
    const lo = this.t === 'soft3d' ? dark(c, 0.3) : dark(c, 0.16);
    return this.grad(key, `<linearGradient id="${key}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${hi}"/><stop offset="0.45" stop-color="${c}"/><stop offset="1" stop-color="${lo}"/></linearGradient>`);
  }

  /** A shadow on the right side of something round: the cartoon's and the pixel art's two-tone shading. */
  celShadow(path: string, c0: string): string {
    if (this.t !== 'cartoon' && this.t !== 'pixel') return '';
    return `<path d="${path}" fill="${dark(this.colour(c0), this.t === 'pixel' ? 0.22 : 0.26)}"/>`;
  }
  /** A small shine, for round and polished things. */
  shine(x: number, y: number, rx: number, ry: number): string {
    if (this.t === 'painted') return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#fffaf0" opacity="0.35"/>`;
    return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#ffffff" opacity="${this.t === 'soft3d' ? 0.7 : 0.85}"/>`;
  }
  /** A soft contact shadow on the floor. */
  shadow(x: number, y: number, rx: number, ry: number, opacity = 0.3): string {
    if (this.t === 'pixel' || this.t === 'cartoon') return `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#3a1f1a" opacity="${opacity * 0.8}"/>`;
    return `<ellipse cx="${x}" cy="${y}" rx="${rx * 1.15}" ry="${ry * 1.2}" fill="#3a1f1a" opacity="${opacity}" filter="url(#blur6)"/>`;
  }
}

// ---------- Isometric geometry ----------

const U = 52;
const OX = 640;
const OY = 200;
type Pt = [number, number];
const P = (x: number, y: number, z = 0): Pt => [OX + (x - y) * U * 0.866, OY + (x + y) * U * 0.5 - z * U];
const ptsOf = (l: Pt[]) => l.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');
const RW = 9;
const RD = 6;
const WALL = 3.6;

function face(r: Renderer, l: Pt[], c: string, o: Orient, extra = ''): string {
  return `<polygon points="${ptsOf(l)}" fill="${r.face(c, o)}"${r.outline} ${extra}/>`;
}
/** A box: its top and the two faces towards us. */
function box(r: Renderer, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, c: string, opts: { top?: boolean; left?: boolean; right?: boolean; topColour?: string } = {}): string {
  let out = '';
  if (opts.left !== false) out += face(r, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], c, 'left');
  if (opts.right !== false) out += face(r, [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], c, 'right');
  if (opts.top !== false) out += face(r, [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], opts.topColour ?? c, 'top');
  return out;
}
/** A rectangle on the back wall (y = 0), from x0..x1 and z0..z1. */
const onBack = (r: Renderer, x0: number, x1: number, z0: number, z1: number, c: string, extra = '') => face(r, [P(x0, 0, z0), P(x1, 0, z0), P(x1, 0, z1), P(x0, 0, z1)], c, 'wallBack', extra);
/** A rectangle on the left wall (x = 0), from y0..y1 and z0..z1. */
const onLeft = (r: Renderer, y0: number, y1: number, z0: number, z1: number, c: string, extra = '') => face(r, [P(0, y0, z0), P(0, y1, z0), P(0, y1, z1), P(0, y0, z1)], c, 'wallLeft', extra);

// ---------- People ----------

interface Look {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'bob' | 'long' | 'bun' | 'curly' | 'bald' | 'ponytail';
  top: string;
  topStyle: 'tee' | 'shirt' | 'jumper' | 'hoodie' | 'blouse' | 'whites' | 'waiter' | 'cardigan';
  legs: string;
  hat?: 'straw' | 'toque' | 'beret' | 'cap';
  glasses?: boolean;
  beard?: boolean;
  scarf?: string;
  bag?: string;
  camera?: boolean;
}

const LOOKS: Record<string, Look> = {
  tourist: { skin: '#f3cfb3', hair: '#e2bc76', hairStyle: 'ponytail', top: '#f4b63f', topStyle: 'tee', legs: '#5d7fa6', hat: 'straw', camera: true },
  tourist2: { skin: '#e9b48f', hair: '#4a3022', hairStyle: 'short', top: '#4fa3c8', topStyle: 'shirt', legs: '#d8c8a8', hat: 'cap', beard: true },
  local: { skin: '#f1c6a4', hair: '#6b3f2a', hairStyle: 'short', top: '#b8433a', topStyle: 'jumper', legs: '#4a4a58' },
  granny: { skin: '#f2c9ab', hair: '#dcd6d0', hairStyle: 'bun', top: '#3f7f6e', topStyle: 'cardigan', legs: '#5a4a60', glasses: true },
  student: { skin: '#dba27c', hair: '#2b2230', hairStyle: 'curly', top: '#5b7fc9', topStyle: 'hoodie', legs: '#2f3a52', bag: '#2b3a66' },
  office: { skin: '#f3cfae', hair: '#3a2c25', hairStyle: 'short', top: '#eef2f7', topStyle: 'shirt', legs: '#3b4252', glasses: true },
  foodie: { skin: '#f6d2b4', hair: '#b04a2f', hairStyle: 'bob', top: '#6e4a8e', topStyle: 'blouse', legs: '#2c2a38', scarf: '#efe0c0', hat: 'beret' },
  chef: { skin: '#f2c6a4', hair: '#7a4b31', hairStyle: 'bun', top: '#fbfbf7', topStyle: 'whites', legs: '#2a2a33', hat: 'toque' },
  waiter: { skin: '#efc3a0', hair: '#4a2f22', hairStyle: 'short', top: '#262630', topStyle: 'waiter', legs: '#262630' },
};

interface Pose {
  /** Seated at a table (shown from the waist up), standing, or walking. */
  stance: 'sit' | 'stand' | 'walk';
  /** Which way the face turns: -1 left, 0 front, 1 right. */
  turn: number;
  /** What the hands do. */
  hands?: 'table' | 'wave' | 'fork' | 'glass' | 'tray' | 'pan' | 'side' | 'menu';
  mouth?: 'smile' | 'open' | 'talk';
}

/**
 * A person about 4.5 heads tall, feet (or seat) at (x, y), scaled by s. Built from a head with a
 * proper face (whites, irises, a shine, brows, nose and mouth), a neck, a torso with its clothes,
 * arms with hands, and legs with shoes.
 */
function person(r: Renderer, x: number, y: number, s: number, lk: Look, pose: Pose): string {
  const ol = r.outline;
  const fine = r.fine;
  const t = pose.turn;
  const headR = 15 * s;
  const torsoH = 30 * s;
  const torsoW = 26 * s;
  const legH = pose.stance === 'sit' ? 0 : 30 * s;
  const hipY = y - legH;
  const shoulderY = hipY - torsoH;
  const neckY = shoulderY - 3 * s;
  const headY = neckY - headR * 0.92;
  const fx = x + t * headR * 0.22;
  let g = '';

  // Legs and shoes.
  if (pose.stance !== 'sit') {
    const step = pose.stance === 'walk' ? 6 * s : 0;
    const legW = torsoW * 0.32;
    g += `<path d="M${x - torsoW * 0.36},${hipY - 4 * s} L${x - torsoW * 0.36 - step},${y - 3 * s} L${x - torsoW * 0.36 - step + legW},${y - 3 * s} L${x - 1 * s},${hipY - 4 * s} Z" fill="${r.volume(lk.legs, 'cylinder')}"${ol}/>`;
    g += `<path d="M${x + 1 * s},${hipY - 4 * s} L${x + torsoW * 0.04 + step},${y - 3 * s} L${x + torsoW * 0.04 + step + legW},${y - 3 * s} L${x + torsoW * 0.36},${hipY - 4 * s} Z" fill="${r.volume(dark(lk.legs, 0.06), 'cylinder')}"${ol}/>`;
    g += `<path d="M${x - torsoW * 0.42 - step},${y} q0,-6 ${legW + 2 * s},-5 q${4 * s},1 ${4 * s},5 Z" fill="${r.colour('#3a2a2a')}"${fine}/>`;
    g += `<path d="M${x + torsoW * 0.02 + step},${y} q0,-6 ${legW + 2 * s},-5 q${4 * s},1 ${4 * s},5 Z" fill="${r.colour('#3a2a2a')}"${fine}/>`;
  }
  // Back arm (behind the torso).
  const armW = 7.5 * s;
  const sleeve = lk.topStyle === 'whites' ? '#f1f1ea' : dark(lk.top, 0.06);
  // Torso: wider at the shoulders, with the clothes' details.
  const torso = `M${x - torsoW / 2},${shoulderY + 6 * s} Q${x - torsoW / 2},${shoulderY} ${x - torsoW * 0.3},${shoulderY} L${x + torsoW * 0.3},${shoulderY} Q${x + torsoW / 2},${shoulderY} ${x + torsoW / 2},${shoulderY + 6 * s} L${x + torsoW * 0.44},${hipY} L${x - torsoW * 0.44},${hipY} Z`;
  g += `<path d="${torso}" fill="${r.volume(lk.top, 'cylinder')}"${ol}/>`;
  g += r.celShadow(`M${x + torsoW * 0.12},${shoulderY + 2 * s} L${x + torsoW * 0.3},${shoulderY} Q${x + torsoW / 2},${shoulderY} ${x + torsoW / 2},${shoulderY + 6 * s} L${x + torsoW * 0.44},${hipY} L${x + torsoW * 0.2},${hipY} Z`, lk.top);
  const cx = x;
  switch (lk.topStyle) {
    case 'shirt':
      g += `<path d="M${cx - 5 * s},${shoulderY} l5 ${7 * s} l5 ${-7 * s}" fill="none" stroke="${dark(lk.top, 0.25)}" stroke-width="${1.4 * s}"/>`;
      g += [0.35, 0.55, 0.75].map((f) => `<circle cx="${cx}" cy="${shoulderY + torsoH * f}" r="${1 * s}" fill="${dark(lk.top, 0.3)}"/>`).join('');
      if (lk.glasses) g += `<path d="M${cx},${shoulderY + 6 * s} l${-2.5 * s},${3 * s} l${2.5 * s},${torsoH * 0.6} l${2.5 * s},${-torsoH * 0.6} Z" fill="${r.colour('#3d5a80')}"${fine}/>`;
      break;
    case 'jumper':
      g += `<path d="M${cx - torsoW * 0.44},${shoulderY + torsoH * 0.42} L${cx + torsoW * 0.44},${shoulderY + torsoH * 0.42}" stroke="#f3e2c4" stroke-width="${3.5 * s}" stroke-dasharray="${2.5 * s} ${2.5 * s}"/>`;
      g += `<path d="M${cx - torsoW * 0.44},${shoulderY + torsoH * 0.5} L${cx + torsoW * 0.44},${shoulderY + torsoH * 0.5}" stroke="#2f4a7a" stroke-width="${1.6 * s}"/>`;
      g += `<path d="M${cx - torsoW * 0.44},${hipY - 3 * s} L${cx + torsoW * 0.44},${hipY - 3 * s}" stroke="${dark(lk.top, 0.2)}" stroke-width="${3 * s}"/>`;
      break;
    case 'hoodie':
      g += `<path d="M${cx - 9 * s},${shoulderY - 1 * s} Q${cx},${shoulderY + 9 * s} ${cx + 9 * s},${shoulderY - 1 * s}" fill="${dark(lk.top, 0.12)}"/>`;
      g += `<path d="M${cx - 3 * s},${shoulderY + 4 * s} l0,${9 * s} M${cx + 3 * s},${shoulderY + 4 * s} l0,${9 * s}" stroke="#f4f4f4" stroke-width="${1.3 * s}"/>`;
      g += `<rect x="${cx - torsoW * 0.3}" y="${shoulderY + torsoH * 0.6}" width="${torsoW * 0.6}" height="${torsoH * 0.22}" rx="${3 * s}" fill="${dark(lk.top, 0.1)}"/>`;
      break;
    case 'blouse':
      g += `<path d="M${cx - 6 * s},${shoulderY} Q${cx},${shoulderY + 10 * s} ${cx + 6 * s},${shoulderY}" fill="${lk.skin}"/>`;
      break;
    case 'cardigan':
      g += `<path d="M${cx},${shoulderY + 2 * s} L${cx},${hipY}" stroke="${dark(lk.top, 0.3)}" stroke-width="${1.6 * s}"/>`;
      g += [0.3, 0.5, 0.7].map((f) => `<circle cx="${cx + 2.5 * s}" cy="${shoulderY + torsoH * f}" r="${1.4 * s}" fill="${r.colour('#e8d29a')}"/>`).join('');
      g += `<path d="M${cx - 5 * s},${shoulderY} Q${cx},${shoulderY + 6 * s} ${cx + 5 * s},${shoulderY}" fill="#f6f1e6"/>`;
      break;
    case 'whites':
      g += [0.25, 0.45, 0.65].map((f) => `<circle cx="${cx - 4 * s}" cy="${shoulderY + torsoH * f}" r="${1.3 * s}" fill="#c9c9bf"/><circle cx="${cx + 4 * s}" cy="${shoulderY + torsoH * f}" r="${1.3 * s}" fill="#c9c9bf"/>`).join('');
      g += `<path d="M${cx - 7 * s},${shoulderY} l7 ${5 * s} l7 ${-5 * s}" fill="#e0dfd6"/>`;
      g += `<path d="M${cx - torsoW * 0.44},${hipY - 2 * s} L${cx + torsoW * 0.44},${hipY - 2 * s} L${cx + torsoW * 0.4},${hipY + (pose.stance === 'sit' ? 0 : 20 * s)} L${cx - torsoW * 0.4},${hipY + (pose.stance === 'sit' ? 0 : 20 * s)} Z" fill="${r.face('#fbfbf7', 'flat')}"${ol}/>`;
      break;
    case 'waiter':
      g += `<path d="M${cx - 5 * s},${shoulderY} l5 ${6 * s} l5 ${-6 * s} l0,${14 * s} l-10,0 Z" fill="#fbfbf7"/>`;
      g += `<path d="M${cx - 4.5 * s},${shoulderY + 2 * s} l4.5 ${2.5 * s} l4.5 ${-2.5 * s} l0,${4.5 * s} l-4.5 ${-2.5 * s} l-4.5 ${2.5 * s} Z" fill="${r.colour('#b8343c')}"/>`;
      g += `<path d="M${cx - torsoW * 0.38},${shoulderY + torsoH * 0.55} L${cx + torsoW * 0.38},${shoulderY + torsoH * 0.55} L${cx + torsoW * 0.42},${y - 6 * s} L${cx - torsoW * 0.42},${y - 6 * s} Z" fill="${r.face('#fbfbf7', 'flat')}"${ol}/>`;
      break;
    default:
      g += `<path d="M${cx - 6 * s},${shoulderY} Q${cx},${shoulderY + 5 * s} ${cx + 6 * s},${shoulderY}" fill="${dark(lk.top, 0.18)}"/>`;
  }
  if (lk.camera) g += `<path d="M${cx - torsoW * 0.4},${shoulderY + 1 * s} L${cx + 2 * s},${shoulderY + torsoH * 0.55}" stroke="#2a2a2a" stroke-width="${1.2 * s}"/><rect x="${cx - 2 * s}" y="${shoulderY + torsoH * 0.5}" width="${10 * s}" height="${7 * s}" rx="${1.5 * s}" fill="${r.colour('#2f2f36')}"${fine}/><circle cx="${cx + 3 * s}" cy="${shoulderY + torsoH * 0.5 + 3.5 * s}" r="${2.4 * s}" fill="#7aa7c7"/>`;
  if (lk.bag) g += `<path d="M${cx + torsoW * 0.4},${shoulderY + 1 * s} L${cx - torsoW * 0.2},${hipY}" stroke="${r.colour(lk.bag)}" stroke-width="${3.4 * s}" stroke-linecap="round"/>`;
  if (lk.scarf) g += `<path d="M${cx - torsoW * 0.42},${shoulderY + 1 * s} Q${cx},${shoulderY + 9 * s} ${cx + torsoW * 0.42},${shoulderY + 1 * s} L${cx + torsoW * 0.15},${shoulderY + 18 * s} L${cx + 3 * s},${shoulderY + 7 * s} Z" fill="${r.volume(lk.scarf, 'cylinder')}"${fine}/>`;

  // Arms: each a sleeve and a hand, posed.
  const shoulderL: Pt = [x - torsoW * 0.47, shoulderY + 5 * s];
  const shoulderR: Pt = [x + torsoW * 0.47, shoulderY + 5 * s];
  const arm = (from: Pt, to: Pt) =>
    `<path d="M${from[0]},${from[1]} L${to[0]},${to[1]}" stroke="${r.colour(sleeve)}" stroke-width="${armW}" stroke-linecap="round"/>` +
    (r.t === 'cartoon' ? `<path d="M${from[0]},${from[1]} L${to[0]},${to[1]}" stroke="#2a1a24" stroke-width="${armW + 2.4}" stroke-linecap="round" opacity="0" />` : '') +
    `<circle cx="${to[0]}" cy="${to[1]}" r="${armW * 0.52}" fill="${r.volume(lk.skin, 'sphere')}"${fine}/>`;
  const hands = pose.hands ?? 'side';
  const tableY = hipY - 2 * s;
  if (hands === 'table') g += arm(shoulderL, [x - torsoW * 0.35, tableY + 4 * s]) + arm(shoulderR, [x + torsoW * 0.35, tableY + 4 * s]);
  else if (hands === 'fork') g += arm(shoulderL, [x - torsoW * 0.35, tableY + 4 * s]) + arm(shoulderR, [x + torsoW * 0.15, shoulderY + 6 * s]) + `<path d="M${x + torsoW * 0.15},${shoulderY + 6 * s} l${4 * s},${-9 * s}" stroke="#c9ccd1" stroke-width="${1.6 * s}"/>`;
  else if (hands === 'glass') g += arm(shoulderL, [x - torsoW * 0.35, tableY + 4 * s]) + arm(shoulderR, [x + torsoW * 0.62, shoulderY + 3 * s]) + `<path d="M${x + torsoW * 0.62 - 3 * s},${shoulderY - 8 * s} l${6 * s},0 l${-1 * s},${9 * s} l${-4 * s},0 Z" fill="${r.colour('#c8384a')}" opacity="0.9"${fine}/>`;
  else if (hands === 'wave') g += arm(shoulderL, [x - torsoW * 0.35, tableY + 4 * s]) + arm(shoulderR, [x + torsoW * 0.8, shoulderY - 10 * s]);
  else if (hands === 'menu') g += arm(shoulderL, [x - torsoW * 0.1, shoulderY + 12 * s]) + arm(shoulderR, [x + torsoW * 0.1, shoulderY + 12 * s]) + `<rect x="${x - 10 * s}" y="${shoulderY + 1 * s}" width="${20 * s}" height="${14 * s}" rx="${1.5 * s}" fill="${r.face('#7a2e2e', 'flat')}"${fine}/><path d="M${x},${shoulderY + 1 * s} l0,${14 * s}" stroke="#d9b45a" stroke-width="${0.8 * s}"/>`;
  else if (hands === 'tray') g += arm(shoulderL, [x - torsoW * 0.62, hipY - 6 * s]) + arm(shoulderR, [x + torsoW * 0.78, shoulderY - 4 * s]) + `<ellipse cx="${x + torsoW * 0.95}" cy="${shoulderY - 6 * s}" rx="${17 * s}" ry="${5 * s}" fill="${r.volume('#d9dde2', 'cylinder')}"${fine}/><path d="M${x + torsoW * 0.75},${shoulderY - 18 * s} l${7 * s},0 l${-1 * s},${11 * s} l${-5 * s},0 Z" fill="${r.colour('#c8384a')}"${fine}/><ellipse cx="${x + torsoW * 1.15}" cy="${shoulderY - 9 * s}" rx="${7 * s}" ry="${2.5 * s}" fill="#fbf8f1"/><ellipse cx="${x + torsoW * 1.15}" cy="${shoulderY - 10 * s}" rx="${4 * s}" ry="${1.6 * s}" fill="#e8c66b"/>`;
  else if (hands === 'pan') g += arm(shoulderL, [x - torsoW * 0.5, shoulderY + 16 * s]) + arm(shoulderR, [x + torsoW * 0.7, shoulderY + 10 * s]) + `<path d="M${x + torsoW * 0.7},${shoulderY + 10 * s} l${10 * s},${-3 * s}" stroke="#3a3a40" stroke-width="${2.4 * s}"/><ellipse cx="${x + torsoW * 1.25}" cy="${shoulderY + 6 * s}" rx="${9 * s}" ry="${3.5 * s}" fill="${r.colour('#3a3a40')}"/>`;
  else g += arm(shoulderL, [x - torsoW * 0.58, hipY - 2 * s]) + arm(shoulderR, [x + torsoW * 0.58, hipY - 2 * s]);

  // Neck and head.
  g += `<rect x="${x - 4 * s}" y="${neckY - 3 * s}" width="${8 * s}" height="${7 * s}" fill="${dark(r.colour(lk.skin), 0.1)}"/>`;
  // Hair behind the head.
  if (lk.hairStyle === 'long' || lk.hairStyle === 'bob' || lk.hairStyle === 'ponytail') {
    const len = lk.hairStyle === 'long' ? 1.6 : lk.hairStyle === 'bob' ? 1.05 : 0.6;
    g += `<path d="M${fx - headR * 1.02},${headY - headR * 0.2} Q${fx - headR * 1.2},${headY + headR * len} ${fx - headR * 0.4},${headY + headR * len} L${fx + headR * 0.4},${headY + headR * len} Q${fx + headR * 1.2},${headY + headR * len} ${fx + headR * 1.02},${headY - headR * 0.2} Z" fill="${r.volume(lk.hair, 'cylinder')}"${ol}/>`;
  }
  if (lk.hairStyle === 'ponytail') g += `<path d="M${fx + headR * 0.7},${headY - headR * 0.5} q${headR * 0.9},${headR * 0.1} ${headR * 0.5},${headR * 1.3}" stroke="${r.colour(lk.hair)}" stroke-width="${6 * s}" stroke-linecap="round" fill="none"/>`;
  if (lk.hairStyle === 'bun') g += `<circle cx="${fx}" cy="${headY - headR * 1.05}" r="${headR * 0.42}" fill="${r.volume(lk.hair, 'sphere')}"${ol}/>`;
  // The face: an oval, a little wider at the cheeks.
  g += `<ellipse cx="${fx}" cy="${headY}" rx="${headR}" ry="${headR * 1.04}" fill="${r.volume(lk.skin, 'sphere')}"${ol}/>`;
  g += r.celShadow(`M${fx + headR * 0.35},${headY - headR * 0.9} A${headR},${headR * 1.04} 0 0 1 ${fx + headR * 0.4},${headY + headR * 0.95} Q${fx + headR * 0.75},${headY} ${fx + headR * 0.35},${headY - headR * 0.9} Z`, lk.skin);
  // Ears.
  g += `<ellipse cx="${fx - headR * 0.98}" cy="${headY + headR * 0.1}" rx="${headR * 0.16}" ry="${headR * 0.24}" fill="${r.colour(dark(lk.skin, 0.05))}"${fine}/><ellipse cx="${fx + headR * 0.98}" cy="${headY + headR * 0.1}" rx="${headR * 0.16}" ry="${headR * 0.24}" fill="${r.colour(dark(lk.skin, 0.08))}"${fine}/>`;
  // Eyes: whites, irises, pupils and a shine; brows; nose; mouth; cheeks.
  const ex = headR * 0.38;
  const ey = headY + headR * 0.08;
  const look = t * headR * 0.08;
  for (const side of [-1, 1]) {
    const cxe = fx + side * ex + t * headR * 0.1;
    g += `<ellipse cx="${cxe}" cy="${ey}" rx="${headR * 0.2}" ry="${headR * 0.24}" fill="#ffffff"${fine}/>`;
    g += `<circle cx="${cxe + look}" cy="${ey + headR * 0.03}" r="${headR * 0.14}" fill="${r.colour('#5a3a28')}"/>`;
    g += `<circle cx="${cxe + look}" cy="${ey + headR * 0.03}" r="${headR * 0.075}" fill="#1a1016"/>`;
    g += `<circle cx="${cxe + look + headR * 0.05}" cy="${ey - headR * 0.04}" r="${headR * 0.045}" fill="#ffffff"/>`;
    g += `<path d="M${cxe - headR * 0.18},${ey - headR * 0.34} Q${cxe},${ey - headR * 0.44} ${cxe + headR * 0.18},${ey - headR * 0.32}" stroke="${r.colour(dark(lk.hair, 0.25))}" stroke-width="${1.6 * s}" fill="none" stroke-linecap="round"/>`;
    g += `<ellipse cx="${cxe + side * headR * 0.05}" cy="${ey + headR * 0.36}" rx="${headR * 0.17}" ry="${headR * 0.09}" fill="#f08a7e" opacity="${r.t === 'soft3d' ? 0.45 : 0.55}"/>`;
  }
  g += `<path d="M${fx + t * headR * 0.15},${ey + headR * 0.12} q${headR * 0.08},${headR * 0.16} ${-headR * 0.04},${headR * 0.2}" stroke="${dark(r.colour(lk.skin), 0.25)}" stroke-width="${1.3 * s}" fill="none" stroke-linecap="round"/>`;
  const mouth = pose.mouth ?? 'smile';
  const my = ey + headR * 0.46;
  const mx = fx + t * headR * 0.12;
  if (mouth === 'open') g += `<path d="M${mx - headR * 0.2},${my} Q${mx},${my + headR * 0.34} ${mx + headR * 0.2},${my} Z" fill="#7a2f35"/><path d="M${mx - headR * 0.12},${my + headR * 0.1} Q${mx},${my + headR * 0.2} ${mx + headR * 0.12},${my + headR * 0.1}" fill="#e46a6f"/>`;
  else if (mouth === 'talk') g += `<ellipse cx="${mx}" cy="${my + headR * 0.06}" rx="${headR * 0.11}" ry="${headR * 0.09}" fill="#7a2f35"/>`;
  else g += `<path d="M${mx - headR * 0.18},${my} Q${mx},${my + headR * 0.18} ${mx + headR * 0.18},${my}" stroke="#7a3b3b" stroke-width="${1.5 * s}" fill="none" stroke-linecap="round"/>`;
  if (lk.beard) g += `<path d="M${fx - headR * 0.8},${headY + headR * 0.25} Q${fx - headR * 0.6},${headY + headR * 1.15} ${fx},${headY + headR * 1.12} Q${fx + headR * 0.6},${headY + headR * 1.15} ${fx + headR * 0.8},${headY + headR * 0.25} Q${fx},${headY + headR * 0.75} ${fx - headR * 0.8},${headY + headR * 0.25} Z" fill="${r.colour(lk.hair)}" opacity="0.92"/>`;
  if (lk.glasses) {
    for (const side of [-1, 1]) {
      const cxe = fx + side * ex + t * headR * 0.1;
      g += `<rect x="${cxe - headR * 0.26}" y="${ey - headR * 0.24}" width="${headR * 0.52}" height="${headR * 0.44}" rx="${headR * 0.12}" fill="#ffffff" fill-opacity="0.15" stroke="${r.colour('#3a2c25')}" stroke-width="${1.4 * s}"/>`;
    }
    g += `<path d="M${fx - headR * 0.12 + t * headR * 0.1},${ey - headR * 0.04} l${headR * 0.24},0" stroke="${r.colour('#3a2c25')}" stroke-width="${1.2 * s}"/>`;
  }
  // Hair on top, by style.
  const hair = r.volume(lk.hair, 'sphere');
  switch (lk.hairStyle) {
    case 'bald':
      break;
    case 'curly':
      g += [-0.75, -0.4, 0, 0.4, 0.75].map((d, i) => `<circle cx="${fx + d * headR}" cy="${headY - headR * (0.62 + (i % 2) * 0.18)}" r="${headR * 0.38}" fill="${hair}"${ol}/>`).join('');
      break;
    default: {
      const side = lk.hairStyle === 'bob' || lk.hairStyle === 'long' ? 0.35 : 0.05;
      g += `<path d="M${fx - headR * 1.03},${headY + headR * side} Q${fx - headR * 1.1},${headY - headR * 1.2} ${fx},${headY - headR * 1.08} Q${fx + headR * 1.1},${headY - headR * 1.2} ${fx + headR * 1.03},${headY + headR * side} Q${fx + headR * 0.85},${headY - headR * 0.35} ${fx + headR * 0.35},${headY - headR * 0.48} Q${fx + t * headR * 0.3},${headY - headR * 0.25} ${fx - headR * 0.25},${headY - headR * 0.5} Q${fx - headR * 0.85},${headY - headR * 0.4} ${fx - headR * 1.03},${headY + headR * side} Z" fill="${hair}"${ol}/>`;
      g += `<path d="M${fx - headR * 0.4},${headY - headR * 0.85} q${headR * 0.3},${-headR * 0.12} ${headR * 0.6},${-headR * 0.05}" stroke="${light(r.colour(lk.hair), 0.35)}" stroke-width="${1.6 * s}" fill="none" stroke-linecap="round" opacity="0.8"/>`;
    }
  }
  // Hats.
  if (lk.hat === 'straw') g += `<ellipse cx="${fx}" cy="${headY - headR * 0.68}" rx="${headR * 1.55}" ry="${headR * 0.36}" fill="${r.volume('#e6c06a', 'cylinder')}"${ol}/><path d="M${fx - headR * 0.82},${headY - headR * 0.72} Q${fx - headR * 0.8},${headY - headR * 1.6} ${fx},${headY - headR * 1.62} Q${fx + headR * 0.8},${headY - headR * 1.6} ${fx + headR * 0.82},${headY - headR * 0.72} Z" fill="${r.volume('#f0d084', 'sphere')}"${ol}/><path d="M${fx - headR * 0.82},${headY - headR * 0.86} Q${fx},${headY - headR * 0.78} ${fx + headR * 0.82},${headY - headR * 0.86}" stroke="${r.colour('#c0443a')}" stroke-width="${3.4 * s}" fill="none"/>`;
  if (lk.hat === 'cap') g += `<path d="M${fx - headR * 0.98},${headY - headR * 0.35} Q${fx - headR},${headY - headR * 1.25} ${fx},${headY - headR * 1.2} Q${fx + headR},${headY - headR * 1.25} ${fx + headR * 0.98},${headY - headR * 0.35} Z" fill="${r.volume('#d9473f', 'sphere')}"${ol}/><path d="M${fx + headR * 0.2},${headY - headR * 0.42} q${headR * 0.9},${-headR * 0.05} ${headR * 1.3},${headR * 0.15} q${-headR * 0.6},${headR * 0.15} ${-headR * 1.3},${headR * 0.05} Z" fill="${r.colour('#b53530')}"${fine}/>`;
  if (lk.hat === 'beret') g += `<ellipse cx="${fx - headR * 0.15}" cy="${headY - headR * 0.85}" rx="${headR * 0.95}" ry="${headR * 0.4}" fill="${r.volume('#2f2a3a', 'sphere')}"${ol}/><circle cx="${fx - headR * 0.15}" cy="${headY - headR * 1.25}" r="${1.8 * s}" fill="#2f2a3a"/>`;
  if (lk.hat === 'toque') g += `<path d="M${fx - headR * 0.78},${headY - headR * 0.62} L${fx - headR * 0.85},${headY - headR * 1.45} Q${fx - headR * 1.25},${headY - headR * 2.35} ${fx - headR * 0.35},${headY - headR * 2.2} Q${fx},${headY - headR * 2.75} ${fx + headR * 0.4},${headY - headR * 2.2} Q${fx + headR * 1.25},${headY - headR * 2.35} ${fx + headR * 0.85},${headY - headR * 1.45} L${fx + headR * 0.78},${headY - headR * 0.62} Z" fill="${r.volume('#ffffff', 'cylinder')}"${ol || ' stroke="#dcdcd4" stroke-width="1"'}/><path d="M${fx - headR * 0.78},${headY - headR * 0.8} L${fx + headR * 0.78},${headY - headR * 0.8}" stroke="#d6d6cd" stroke-width="${2.4 * s}"/>`;
  return g;
}

// ---------- The room ----------

interface Thing {
  depth: number;
  svg: string;
}

function chair(r: Renderer, cx: number, cy: number, backAt: 'y' | 'x'): string {
  const c = '#6a3d26';
  let out = box(r, cx - 0.3, cx + 0.3, cy - 0.3, cy + 0.3, 0.42, 0.5, c);
  for (const [lx, ly] of [
    [cx - 0.26, cy - 0.26],
    [cx + 0.22, cy - 0.26],
    [cx - 0.26, cy + 0.22],
    [cx + 0.22, cy + 0.22],
  ]) out += box(r, lx, lx + 0.05, ly, ly + 0.05, 0, 0.42, dark(c, 0.1), { top: false });
  // A bentwood back with two rails.
  if (backAt === 'y') out += box(r, cx - 0.3, cx + 0.3, cy - 0.32, cy - 0.25, 0.5, 1.25, c) + box(r, cx - 0.24, cx + 0.24, cy - 0.33, cy - 0.3, 0.75, 0.82, light(c, 0.15));
  else out += box(r, cx - 0.32, cx - 0.25, cy - 0.3, cy + 0.3, 0.5, 1.25, c) + box(r, cx - 0.33, cx - 0.3, cy - 0.24, cy + 0.24, 0.75, 0.82, light(c, 0.15));
  return out;
}

/** A round table with a long cloth, plates of food, glasses, a candle and bread, and its guests. */
function diningTable(r: Renderer, tx: number, ty: number, guests: [string, Pose][], cloth: string): Thing[] {
  const things: Thing[] = [];
  const seats: [number, number, 'y' | 'x'][] = [
    [tx, ty - 0.95, 'y'],
    [tx - 0.95, ty, 'x'],
  ];
  guests.forEach(([who, pose], i) => {
    const [cx, cy, back] = seats[i];
    const [sx, sy] = P(cx, cy);
    things.push({ depth: cx + cy - 0.3, svg: r.shadow(sx, sy, 22, 10) + chair(r, cx, cy, back) });
    const [px, py] = P(cx, cy, 0.5);
    things.push({ depth: cx + cy - 0.1, svg: person(r, px, py, 1.25, LOOKS[who], pose) });
  });
  const [cx, cy] = P(tx, ty, 0.78);
  const rx = 0.78 * U * 0.866 * 1.15;
  const ry = rx * 0.56;
  let t = '';
  const [fx, fy] = P(tx, ty);
  t += r.shadow(fx, fy + 4, rx * 1.05, ry * 0.95, 0.35);
  // The cloth: a round top and a skirt hanging down to the floor.
  t += `<path d="M${cx - rx},${cy} L${cx - rx * 0.96},${fy - 4} Q${cx},${fy + ry * 0.9} ${cx + rx * 0.96},${fy - 4} L${cx + rx},${cy} Z" fill="${r.face(cloth, 'left')}"${r.outline}/>`;
  for (let i = 1; i < 6; i++) {
    const fx2 = cx - rx + (i * 2 * rx) / 6;
    t += `<path d="M${fx2},${cy + ry * 0.5} q${2},${(fy - cy) * 0.5} ${0},${fy - cy - 6}" stroke="${dark(cloth, 0.18)}" stroke-width="1.4" fill="none" opacity="0.6"/>`;
  }
  t += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${r.face(cloth, 'top')}"${r.outline}/>`;
  // An embroidered band near the edge.
  t += `<ellipse cx="${cx}" cy="${cy}" rx="${rx * 0.86}" ry="${ry * 0.86}" fill="none" stroke="${r.colour('#c0443a')}" stroke-width="2.2" stroke-dasharray="4 3" opacity="0.8"/>`;
  // Plates with food in front of each guest, glasses, bread, a candle in a holder.
  const plate = (px: number, py: number, food: string) =>
    `<ellipse cx="${px}" cy="${py}" rx="13" ry="6.5" fill="${r.face('#fbf8f1', 'top')}"${r.fine}/><ellipse cx="${px}" cy="${py - 0.5}" rx="9" ry="4.2" fill="${r.colour('#efe9dc')}"/>` + food;
  const pierogi = (px: number, py: number) => [-4, 0, 4].map((d) => `<path d="M${px + d - 3.5},${py} q3.5,-5 7,0 Z" fill="${r.colour('#f1d79a')}"${r.fine}/>`).join('') + `<path d="M${px - 3},${py + 1.5} l5,-1" stroke="${r.colour('#b5742f')}" stroke-width="1.5"/>`;
  const soup = (px: number, py: number) => `<ellipse cx="${px}" cy="${py - 2}" rx="7" ry="3.4" fill="${r.colour('#e7c87a')}"${r.fine}/><circle cx="${px - 2}" cy="${py - 2.5}" r="1.8" fill="#fff6dc"/><circle cx="${px + 2.5}" cy="${py - 1.8}" r="1.3" fill="#b9574a"/>`;
  guests.forEach((_, i) => {
    const [px, py] = i === 0 ? P(tx + 0.05, ty - 0.35, 0.79) : P(tx - 0.35, ty + 0.05, 0.79);
    t += plate(px, py, i === 0 ? pierogi(px, py) : soup(px, py));
    const [gx, gy] = i === 0 ? P(tx + 0.32, ty - 0.35, 0.79) : P(tx - 0.35, ty + 0.32, 0.79);
    t += `<path d="M${gx - 3},${gy - 12} l6,0 l-1,12 l-4,0 Z" fill="${r.colour(i ? '#e8b84a' : '#c8384a')}" opacity="0.9"${r.fine}/><path d="M${gx - 3},${gy - 12} l6,0" stroke="#ffffff" stroke-width="1" opacity="0.7"/>`;
  });
  const [bx, by] = P(tx + 0.25, ty + 0.25, 0.79);
  t += `<ellipse cx="${bx}" cy="${by}" rx="9" ry="4.5" fill="${r.colour('#a8743e')}"${r.fine}/><ellipse cx="${bx - 2}" cy="${by - 3}" rx="4" ry="2.6" fill="${r.colour('#d9a65f')}"/><ellipse cx="${bx + 3}" cy="${by - 2.5}" rx="3.5" ry="2.3" fill="${r.colour('#c99050')}"/>`;
  const [kx, ky] = P(tx + 0.02, ty + 0.02, 0.79);
  t += `<rect x="${kx - 2.5}" y="${ky - 14}" width="5" height="13" rx="1.5" fill="${r.colour('#f6efe0')}"${r.fine}/><path d="M${kx},${ky - 21} q3,4 0,7 q-3,-3 0,-7 Z" fill="#ffc94a"/><ellipse cx="${kx}" cy="${ky}" rx="5" ry="2" fill="${r.colour('#c9a04a')}"/>`;
  things.push({ depth: tx + ty + 0.4, svg: t });
  return things;
}

/** A pendant lamp hanging from the ceiling over a point on the floor. */
function pendant(r: Renderer, x: number, y: number, z: number): string {
  const [lx, ly] = P(x, y, z);
  const top = P(x, y, WALL + 0.5)[1];
  return `<path d="M${lx},${top} L${lx},${ly - 10}" stroke="#3a2a2a" stroke-width="1.4"/><path d="M${lx - 16},${ly} Q${lx - 13},${ly - 13} ${lx},${ly - 14} Q${lx + 13},${ly - 13} ${lx + 16},${ly} Z" fill="${r.volume('#2f6b4f', 'cylinder')}"${r.outline}/><ellipse cx="${lx}" cy="${ly + 1}" rx="7" ry="3" fill="#fff1c0"/>`;
}

function room(r: Renderer): string {
  let s = '';
  // Floor: herringbone-ish parquet in two woods, with a shadow along the walls.
  s += face(r, [P(0, 0), P(RW, 0), P(RW, RD), P(0, RD)], '#c98d54', 'top');
  for (let i = 0; i < RW * 3; i++) {
    for (let j = 0; j < RD * 3; j++) {
      const x0 = i / 3;
      const y0 = j / 3;
      const even = (i + j) % 2 === 0;
      const c = even ? '#d39a5e' : '#b97a44';
      const quad = even ? [P(x0, y0), P(x0 + 1 / 3, y0), P(x0 + 1 / 3, y0 + 1 / 6), P(x0, y0 + 1 / 6)] : [P(x0, y0), P(x0 + 1 / 6, y0), P(x0 + 1 / 6, y0 + 1 / 3), P(x0, y0 + 1 / 3)];
      s += `<polygon points="${ptsOf(quad)}" fill="${r.colour(c)}" opacity="0.55"/>`;
    }
  }
  s += `<polygon points="${ptsOf([P(0, 0), P(RW, 0), P(RW, 0.9), P(0.9, 0.9), P(0.9, RD), P(0, RD)])}" fill="#3a1f14" opacity="0.18"/>`;
  // The floor's edge and plinth towards us.
  s += box(r, 0, RW, RD, RD + 0.18, -0.45, 0, '#7a4a2c', { top: false, right: false });
  s += box(r, RW, RW + 0.18, 0, RD + 0.18, -0.45, 0, '#7a4a2c', { top: false, left: false });
  // A Kashubian rug: red border, cream band, blue field with a flower.
  s += face(r, [P(3.2, 2.2), P(6.2, 2.2), P(6.2, 4.9), P(3.2, 4.9)], '#a83a30', 'top');
  s += face(r, [P(3.4, 2.4), P(6.0, 2.4), P(6.0, 4.7), P(3.4, 4.7)], '#efdcb4', 'top');
  s += face(r, [P(3.6, 2.6), P(5.8, 2.6), P(5.8, 4.5), P(3.6, 4.5)], '#3d6a9a', 'top');
  const [rcx, rcy] = P(4.7, 3.55);
  s += [0, 1, 2, 3, 4, 5].map((i) => `<ellipse cx="${rcx + Math.cos((i * Math.PI) / 3) * 16}" cy="${rcy + Math.sin((i * Math.PI) / 3) * 8}" rx="9" ry="5" fill="${r.colour(['#f2c14e', '#e8574a', '#f2c14e', '#e8574a', '#f2c14e', '#e8574a'][i])}" opacity="0.9"/>`).join('') + `<circle cx="${rcx}" cy="${rcy}" r="5" fill="${r.colour('#f6efe0')}"/>`;
  s += [0.0, 1.0, 2.0].map((k) => `<polygon points="${ptsOf([P(3.2 + k, 2.2), P(3.3 + k, 2.05), P(3.4 + k, 2.2)])}" fill="#efdcb4"/>`).join('');

  // Back wall (y = 0) and left wall (x = 0): wallpaper above panelling with mouldings.
  s += onBack(r, 0, RW, 0, WALL, '#efe1c4');
  s += onLeft(r, 0, RD, 0, WALL, '#f3e6cb');
  // Wallpaper: small Kashubian flowers in rows.
  for (let x = 0.25; x < RW; x += 0.5) {
    for (let z = 1.75; z < WALL - 0.3; z += 0.5) {
      const [px, py] = P(x + ((z * 2) % 2) * 0.25, 0, z);
      s += `<circle cx="${px}" cy="${py}" r="2.4" fill="${r.colour('#d9a38a')}" opacity="0.55"/><circle cx="${px}" cy="${py}" r="1" fill="${r.colour('#7a9a6a')}" opacity="0.6"/>`;
    }
  }
  for (let y = 0.25; y < RD; y += 0.5) {
    for (let z = 1.75; z < WALL - 0.3; z += 0.5) {
      const [px, py] = P(0, y + ((z * 2) % 2) * 0.25, z);
      s += `<circle cx="${px}" cy="${py}" r="2.4" fill="${r.colour('#d9a38a')}" opacity="0.5"/><circle cx="${px}" cy="${py}" r="1" fill="${r.colour('#7a9a6a')}" opacity="0.55"/>`;
    }
  }
  // Panelling up to a dado rail, with raised panels.
  s += onBack(r, 0, RW, 0, 1.35, '#7d4a2c') + onLeft(r, 0, RD, 0, 1.35, '#86512f');
  for (let x = 0.15; x < RW - 0.2; x += 0.75) s += onBack(r, x, x + 0.6, 0.2, 1.15, '#93603a') + onBack(r, x + 0.06, x + 0.54, 0.28, 1.07, '#86522f');
  for (let y = 0.15; y < RD - 0.2; y += 0.75) s += onLeft(r, y, y + 0.6, 0.2, 1.15, '#9a663f') + onLeft(r, y + 0.06, y + 0.54, 0.28, 1.07, '#8c5733');
  s += onBack(r, 0, RW, 1.35, 1.48, '#5e3620') + onLeft(r, 0, RD, 1.35, 1.48, '#64391f');
  // Cornice under the ceiling.
  s += onBack(r, 0, RW, WALL - 0.22, WALL, '#d9c3a0') + onLeft(r, 0, RD, WALL - 0.22, WALL, '#e1cba8');
  s += onBack(r, 0, RW, WALL - 0.3, WALL - 0.22, '#b89a74') + onLeft(r, 0, RD, WALL - 0.3, WALL - 0.22, '#c0a27b');

  // The window on the left wall: mullions, Gdańsk gables outside, curtains with folds, a sill with geraniums.
  s += onLeft(r, 1.3, 3.5, 1.65, 3.15, '#f6efe0');
  s += onLeft(r, 1.42, 3.38, 1.75, 3.05, '#bfdcec');
  const gableCol = ['#e8a37b', '#f1d38f', '#9fc0a8', '#e6b7b0'];
  for (let i = 0; i < 4; i++) {
    const y0 = 1.5 + i * 0.47;
    const h = 2.35 + ((i * 37) % 5) * 0.12;
    s += `<polygon points="${ptsOf([P(0, y0, 1.75), P(0, y0 + 0.44, 1.75), P(0, y0 + 0.44, h), P(0, y0 + 0.22, h + 0.28), P(0, y0, h)])}" fill="${r.colour(gableCol[i])}" opacity="0.85"/>`;
  }
  s += `<line x1="${P(0, 2.4, 1.75)[0]}" y1="${P(0, 2.4, 1.75)[1]}" x2="${P(0, 2.4, 3.05)[0]}" y2="${P(0, 2.4, 3.05)[1]}" stroke="#f6efe0" stroke-width="3.5"/>`;
  s += `<line x1="${P(0, 1.42, 2.4)[0]}" y1="${P(0, 1.42, 2.4)[1]}" x2="${P(0, 3.38, 2.4)[0]}" y2="${P(0, 3.38, 2.4)[1]}" stroke="#f6efe0" stroke-width="3"/>`;
  s += face(r, [P(0, 1.2, 1.6), P(0, 3.6, 1.6), P(0.28, 3.6, 1.6), P(0.28, 1.2, 1.6)], '#f6efe0', 'top');
  [1.55, 2.0, 2.45, 2.9, 3.3].forEach((y, i) => {
    const [px, py] = P(0.14, y, 1.6);
    s += `<rect x="${px - 6}" y="${py - 9}" width="12" height="9" rx="2" fill="${r.colour('#b3643e')}"${r.fine}/><circle cx="${px - 3}" cy="${py - 13}" r="4.5" fill="${r.colour('#4f8a43')}"/><circle cx="${px + 3}" cy="${py - 14}" r="4" fill="${r.colour('#5d9a4d')}"/><circle cx="${px}" cy="${py - 17}" r="3" fill="${r.colour(i % 2 ? '#e8463c' : '#f07a8a')}"/>`;
  });
  for (const [y0, y1] of [
    [1.0, 1.42],
    [3.38, 3.8],
  ]) {
    s += onLeft(r, y0, y1, 1.5, 3.3, '#b8433a');
    for (let k = 0; k < 3; k++) {
      const yy = y0 + ((k + 0.5) * (y1 - y0)) / 3;
      s += `<line x1="${P(0, yy, 1.55)[0]}" y1="${P(0, yy, 1.55)[1]}" x2="${P(0, yy, 3.25)[0]}" y2="${P(0, yy, 3.25)[1]}" stroke="${dark('#b8433a', 0.25)}" stroke-width="1.6" opacity="0.7"/>`;
    }
  }
  s += `<line x1="${P(0, 0.9, 3.35)[0]}" y1="${P(0, 0.9, 3.35)[1]}" x2="${P(0, 3.9, 3.35)[0]}" y2="${P(0, 3.9, 3.35)[1]}" stroke="#4a2f22" stroke-width="2.5"/>`;

  // On the left wall near the front: a shelf of jars and preserves.
  s += face(r, [P(0, 4.3, 2.55), P(0, 5.8, 2.55), P(0.32, 5.8, 2.55), P(0.32, 4.3, 2.55)], '#6a3d26', 'top');
  ['#d9822b', '#9c3b47', '#7fa354', '#e8b84a', '#b8433a', '#5d8f4a'].forEach((c, i) => {
    const [jx, jy] = P(0.16, 4.45 + i * 0.25, 2.55);
    s += `<rect x="${jx - 5}" y="${jy - 15}" width="10" height="15" rx="3" fill="${r.volume(c, 'cylinder')}"${r.fine}/><rect x="${jx - 5}" y="${jy - 18}" width="10" height="4" rx="1" fill="${r.colour('#caa04a')}"/>` + r.shine(jx - 2, jy - 10, 1.4, 3);
  });

  // On the back wall: a ship painting, the Żuraw print, a chalkboard with today's dishes, a clock.
  s += onBack(r, 0.4, 1.9, 1.85, 3.0, '#c9a04a') + onBack(r, 0.5, 1.8, 1.93, 2.92, '#9cc3d6');
  s += `<polygon points="${ptsOf([P(0.6, 0, 1.93), P(1.7, 0, 1.93), P(1.7, 0, 2.15), P(0.6, 0, 2.15)])}" fill="${r.colour('#3d6a9a')}"/>`;
  s += `<polygon points="${ptsOf([P(0.85, 0, 2.15), P(1.45, 0, 2.15), P(1.38, 0, 2.3), P(0.92, 0, 2.3)])}" fill="${r.colour('#6a3d26')}"/><polygon points="${ptsOf([P(1.0, 0, 2.3), P(1.15, 0, 2.3), P(1.15, 0, 2.8)])}" fill="#fbf7ec"/><polygon points="${ptsOf([P(1.18, 0, 2.3), P(1.38, 0, 2.3), P(1.18, 0, 2.7)])}" fill="#fbf7ec"/>`;
  s += onBack(r, 2.3, 3.5, 1.85, 3.05, '#c9a04a') + onBack(r, 2.4, 3.4, 1.93, 2.97, '#e9e1cf');
  s += `<polygon points="${ptsOf([P(2.65, 0, 1.93), P(3.05, 0, 1.93), P(3.05, 0, 2.62), P(2.85, 0, 2.78), P(2.65, 0, 2.62)])}" fill="${r.colour('#4a3326')}"/><polygon points="${ptsOf([P(2.85, 0, 2.7), P(3.3, 0, 2.55), P(3.3, 0, 2.5), P(2.85, 0, 2.64)])}" fill="${r.colour('#4a3326')}"/>`;
  s += onBack(r, 3.9, 5.5, 1.7, 3.1, '#6a3d26') + onBack(r, 4.0, 5.4, 1.8, 3.0, '#2f4a3c');
  ['DZIŚ', 'Żurek 28', 'Pierogi 36', 'Szarlotka 18'].forEach((_, i) => {
    const a = P(4.15, 0, 2.82 - i * 0.27);
    const b = P(4.15 + (i === 0 ? 0.5 : 1.05), 0, 2.82 - i * 0.27);
    s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#f4efe2" stroke-width="${i === 0 ? 3 : 2}" stroke-linecap="round" stroke-dasharray="${i === 0 ? '' : '5 2 9 2'}" opacity="0.9"/>`;
  });
  const [ckx, cky] = P(6.0, 0, 3.05);
  s += `<circle cx="${ckx}" cy="${cky}" r="13" fill="${r.volume('#fbf3e1', 'sphere')}" stroke="#6a3d26" stroke-width="2.5"/><line x1="${ckx}" y1="${cky}" x2="${ckx}" y2="${cky - 8}" stroke="#3b2a22" stroke-width="1.8"/><line x1="${ckx}" y1="${cky}" x2="${ckx + 6}" y2="${cky + 2}" stroke="#3b2a22" stroke-width="1.8"/>`;
  // Brass wall lamps with green shades.
  for (const [x, wall] of [
    [3.7, 'b'],
    [5.75, 'b'],
    [4.0, 'l'],
  ] as [number, string][]) {
    const [lx, ly] = wall === 'b' ? P(x, 0, 2.55) : P(0, x, 2.55);
    s += `<path d="M${lx},${ly + 8} l0,-8" stroke="#a8843a" stroke-width="2"/><path d="M${lx - 8},${ly} L${lx + 8},${ly} L${lx + 5},${ly - 10} L${lx - 5},${ly - 10} Z" fill="${r.volume('#2f6b4f', 'cylinder')}"${r.fine}/><ellipse cx="${lx}" cy="${ly + 1}" rx="5" ry="2" fill="#fff1c0"/>`;
  }

  // The kitchen corner: Delft tiles, a range hood, shelves of plates and copper pans.
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 5; j++) {
      const x0 = 6.4 + i * 0.43;
      const z0 = 1.48 + j * 0.42;
      s += onBack(r, x0, x0 + 0.41, z0, z0 + 0.4, (i + j) % 2 ? '#f3f6f8' : '#e6edf2');
      const [tx2, ty2] = P(x0 + 0.205, 0, z0 + 0.2);
      s += `<path d="M${tx2 - 3},${ty2} l3,-3 l3,3 l-3,3 Z" fill="${r.colour('#3f6fa5')}" opacity="0.85"/>`;
    }
  }
  s += face(r, [P(6.6, 0, 3.3), P(8.4, 0, 3.3), P(8.4, 0.6, 3.0), P(6.6, 0.6, 3.0)], '#b9c2c7', 'top') + face(r, [P(6.6, 0.6, 3.0), P(8.4, 0.6, 3.0), P(8.4, 0.6, 2.85), P(6.6, 0.6, 2.85)], '#a7b0b5', 'left');
  s += face(r, [P(8.5, 0, 2.7), P(RW, 0, 2.7), P(RW, 0.35, 2.7), P(8.5, 0.35, 2.7)], '#6a3d26', 'top');
  [8.65, 8.85, 9.05, 9.25].forEach((x) => {
    const [px, py] = P(x, 0.15, 2.7);
    s += `<ellipse cx="${px}" cy="${py - 8}" rx="3" ry="9" fill="${r.colour('#f6f3ec')}"${r.fine}/><ellipse cx="${px}" cy="${py - 8}" rx="1.5" ry="6" fill="${r.colour('#4a7ab5')}" opacity="0.5"/>`;
  });
  const [rx0, ry0] = P(6.5, 0, 2.15);
  const [rx1, ry1] = P(8.4, 0, 2.15);
  s += `<line x1="${rx0}" y1="${ry0}" x2="${rx1}" y2="${ry1}" stroke="#3a2a2a" stroke-width="2.4"/>`;
  [6.75, 7.3, 7.85].forEach((x, i) => {
    const [px, py] = P(x, 0, 2.15);
    s += `<line x1="${px}" y1="${py}" x2="${px}" y2="${py + 7}" stroke="#3a2a2a" stroke-width="1.6"/><circle cx="${px}" cy="${py + 16 + i * 2}" r="${9 + i * 2}" fill="${r.volume('#c4703d', 'sphere')}"${r.fine}/>` + r.shine(px - 3, py + 12 + i * 2, 3, 2);
  });

  // ---------- Things on the floor, back to front ----------
  const things: Thing[] = [];
  // The bar along the back wall, with bottles on shelves and beer taps.
  things.push({ depth: 1.6, svg: box(r, 0.3, 3.6, 0.15, 0.35, 1.5, 1.55, '#6a3d26') + box(r, 0.3, 3.6, 0.15, 0.35, 2.2, 2.25, '#6a3d26') });
  const bottleCols = ['#3c6e3c', '#7a2e2e', '#c9a04a', '#3c6e3c', '#e8e2d0', '#5a2e5a', '#3c6e3c', '#c9a04a', '#7a2e2e', '#e8e2d0', '#3c6e3c', '#c9a04a'];
  bottleCols.forEach((c, i) => {
    const level = i < 6 ? 1.55 : 2.25;
    const [bx, by] = P(0.55 + (i % 6) * 0.5, 0.25, level);
    things.push({ depth: 1.65, svg: `<rect x="${bx - 3.5}" y="${by - 18}" width="7" height="18" rx="2" fill="${r.volume(c, 'cylinder')}"${r.fine}/><rect x="${bx - 1.5}" y="${by - 24}" width="3" height="7" fill="${r.colour(dark(c, 0.2))}"/><rect x="${bx - 3.5}" y="${by - 12}" width="7" height="5" fill="#f6efe0" opacity="0.85"/>` });
  });
  things.push({ depth: 2.6, svg: r.shadow(...P(2.0, 1.5), 140, 30, 0.35) + box(r, 0.3, 3.8, 0.9, 1.5, 0, 1.15, '#7a4628', { topColour: '#5a3320' }) + box(r, 0.25, 3.85, 0.85, 1.55, 1.15, 1.25, '#4a2a1a') });
  // Bar front panels and brass foot rail.
  for (let x = 0.45; x < 3.6; x += 0.65) things.push({ depth: 2.62, svg: face(r, [P(x, 1.5, 0.15), P(x + 0.5, 1.5, 0.15), P(x + 0.5, 1.5, 1.0), P(x, 1.5, 1.0)], '#8a5432', 'left') });
  things.push({ depth: 2.64, svg: `<line x1="${P(0.3, 1.6, 0.25)[0]}" y1="${P(0.3, 1.6, 0.25)[1]}" x2="${P(3.8, 1.6, 0.25)[0]}" y2="${P(3.8, 1.6, 0.25)[1]}" stroke="#c9a04a" stroke-width="3"/>` });
  // Beer taps and a bartender.
  [1.4, 1.75, 2.1].forEach((x) => {
    const [bx, by] = P(x, 1.2, 1.25);
    things.push({ depth: 2.7, svg: `<rect x="${bx - 2.5}" y="${by - 20}" width="5" height="20" rx="2" fill="${r.volume('#c9a04a', 'cylinder')}"${r.fine}/><rect x="${bx - 3.5}" y="${by - 30}" width="7" height="11" rx="2" fill="${r.colour('#2f2a2a')}"/>` });
  });
  [2.7, 3.2].forEach((x) => {
    const [bx, by] = P(x, 1.15, 1.25);
    things.push({ depth: 2.75, svg: `<path d="M${bx - 4},${by - 14} l8,0 l-1,14 l-6,0 Z" fill="${r.colour('#e8b84a')}" opacity="0.92"${r.fine}/><path d="M${bx - 4},${by - 14} l8,0 l0,-3 l-8,0 Z" fill="#fffaf0"/>` });
  });
  const bart = P(2.4, 0.55);
  things.push({ depth: 2.2, svg: person(r, bart[0], bart[1], 1.25, LOOKS.waiter, { stance: 'stand', turn: 1, hands: 'side', mouth: 'talk' }) });
  // A regular leaning at the bar on a stool.
  const stool = P(1.2, 2.05);
  things.push({ depth: 3.2, svg: r.shadow(stool[0], stool[1], 18, 8) + box(r, 1.05, 1.35, 1.9, 2.2, 0, 0.75, '#4a2a1a') + box(r, 0.95, 1.45, 1.8, 2.3, 0.75, 0.85, '#8a1f2a') });
  const [lx2, ly2] = P(1.2, 2.05, 0.85);
  things.push({ depth: 3.3, svg: person(r, lx2, ly2, 1.25, LOOKS.tourist2, { stance: 'sit', turn: -1, hands: 'glass', mouth: 'open' }) });

  // Dining tables with their guests.
  things.push(...diningTable(r, 5.0, 2.4, [
    ['tourist', { stance: 'sit', turn: 0, hands: 'fork', mouth: 'smile' }],
    ['local', { stance: 'sit', turn: 1, hands: 'table', mouth: 'talk' }],
  ], '#f7efe2'));
  things.push(...diningTable(r, 2.0, 4.3, [
    ['granny', { stance: 'sit', turn: 0, hands: 'table', mouth: 'smile' }],
    ['student', { stance: 'sit', turn: 1, hands: 'wave', mouth: 'open' }],
  ], '#f7efe2'));
  things.push(...diningTable(r, 5.2, 4.9, [
    ['foodie', { stance: 'sit', turn: 0, hands: 'menu', mouth: 'smile' }],
    ['office', { stance: 'sit', turn: 1, hands: 'glass', mouth: 'smile' }],
  ], '#f7efe2'));

  // The kitchen: a range with a pot and flames, the chef with a pan, and the pass with plates waiting.
  things.push({ depth: 7.1, svg: box(r, 6.4, RW, 0.05, 0.75, 0, 1.0, '#9aa4aa', { topColour: '#55595e' }) });
  [6.9, 7.6].forEach((x, i) => {
    const [px, py] = P(x, 0.4, 1.0);
    things.push({ depth: 7.15, svg: `<path d="M${px - 6},${py + 1} q6,-11 12,0 Z" fill="#ff9a2e"/><path d="M${px - 3},${py + 1} q3,-7 6,0 Z" fill="#ffe17a"/>` + (i === 0 ? `<rect x="${px - 12}" y="${py - 20}" width="24" height="18" rx="3" fill="${r.volume('#b9c2c7', 'cylinder')}"${r.fine}/><ellipse cx="${px}" cy="${py - 20}" rx="12" ry="4" fill="${r.colour('#e0b45a')}"/><path d="M${px - 5},${py - 26} q-4,-12 2,-24 M${px + 4},${py - 26} q5,-12 -1,-26" stroke="#ffffff" stroke-width="3.2" fill="none" stroke-linecap="round" opacity="0.65"/>` : '') });
  });
  const chef = P(7.4, 1.25);
  things.push({ depth: 8.6, svg: r.shadow(chef[0], chef[1], 18, 8) + person(r, chef[0], chef[1], 1.3, LOOKS.chef, { stance: 'stand', turn: -1, hands: 'pan', mouth: 'smile' }) });
  things.push({ depth: 9.4, svg: r.shadow(...P(7.7, 2.3), 110, 24, 0.35) + box(r, 6.3, RW, 1.95, 2.55, 0, 1.12, '#7a4628', { topColour: '#c9a77e' }) });
  for (let x = 6.5; x < RW - 0.2; x += 0.6) things.push({ depth: 9.42, svg: face(r, [P(x, 2.55, 0.12), P(x + 0.45, 2.55, 0.12), P(x + 0.45, 2.55, 0.95), P(x, 2.55, 0.95)], '#8a5432', 'left') });
  [6.8, 7.4, 8.0].forEach((x, i) => {
    const [px, py] = P(x, 2.25, 1.12);
    things.push({ depth: 9.45, svg: `<ellipse cx="${px}" cy="${py}" rx="12" ry="6" fill="${r.face('#fbf8f1', 'top')}"${r.fine}/><ellipse cx="${px}" cy="${py - 1}" rx="7" ry="3.2" fill="${r.colour(['#e8c66b', '#c9893a', '#8dbf6a'][i])}"/>` });
  });
  const [hx, hy] = P(8.6, 2.25, 1.75);
  things.push({ depth: 9.5, svg: `<path d="M${hx},${P(8.6, 2.25, WALL + 0.5)[1]} L${hx},${hy - 8}" stroke="#3a2a2a" stroke-width="1.4"/><path d="M${hx - 18},${hy} L${hx + 18},${hy} L${hx + 12},${hy - 10} L${hx - 12},${hy - 10} Z" fill="${r.volume('#2f2f36', 'cylinder')}"${r.fine}/><rect x="${hx - 15}" y="${hy - 1}" width="30" height="3" rx="1" fill="#ff7a4a"/>` });

  // The waiter, carrying a tray between the tables.
  const waiter = P(4.0, 3.75);
  things.push({ depth: 7.85, svg: r.shadow(waiter[0], waiter[1], 18, 8) + person(r, waiter[0], waiter[1], 1.3, LOOKS.waiter, { stance: 'walk', turn: 1, hands: 'tray', mouth: 'smile' }) });
  // A fig tree in a big pot in the front corner, and a coat stand by the door.
  const fig = P(8.4, 5.4);
  things.push({ depth: 13.8, svg: r.shadow(fig[0], fig[1], 30, 12) + box(r, 8.1, 8.7, 5.1, 5.7, 0, 0.55, '#b3643e') + tree(r, fig[0], fig[1] - 0.55 * U, 1.0) });
  const coat = P(0.5, 5.6);
  things.push({ depth: 6.1, svg: r.shadow(coat[0], coat[1], 16, 7) + `<rect x="${coat[0] - 2}" y="${coat[1] - 110}" width="4" height="110" fill="${r.colour('#4a2a1a')}"/><path d="M${coat[0] - 14},${coat[1] - 100} q14,-12 28,0" stroke="#4a2a1a" stroke-width="3" fill="none"/><path d="M${coat[0] - 14},${coat[1] - 98} q-6,28 2,52 l12,0 q2,-30 -4,-52 Z" fill="${r.volume('#7a5a3a', 'cylinder')}"${r.fine}/><ellipse cx="${coat[0] + 10}" cy="${coat[1] - 104}" rx="9" ry="4" fill="${r.colour('#2f2a3a')}"/>` });
  things.sort((a, b) => a.depth - b.depth);
  s += things.map((t) => t.svg).join('');
  // Pendant lamps over the tables (in front of everything).
  s += pendant(r, 5.0, 2.4, 2.6) + pendant(r, 2.0, 4.3, 2.6) + pendant(r, 5.2, 4.9, 2.6);
  return s;
}

function tree(r: Renderer, x: number, y: number, k: number): string {
  const leaf = '#4f8a43';
  return (
    `<path d="M${x - 3 * k},${y} Q${x - 4 * k},${y - 30 * k} ${x},${y - 46 * k} Q${x + 4 * k},${y - 30 * k} ${x + 3 * k},${y} Z" fill="${r.colour('#6b4a32')}"/>` +
    [
      [0, -62, 26, 0],
      [-20, -52, 20, 0.12],
      [20, -50, 20, -0.08],
      [-10, -78, 18, 0.18],
      [12, -76, 17, 0.05],
      [0, -44, 16, -0.12],
    ]
      .map(([dx, dy, rr, t]) => `<circle cx="${x + dx * k}" cy="${y + dy * k}" r="${rr * k}" fill="${r.volume(t > 0 ? light(leaf, t) : dark(leaf, -t), 'sphere')}"${r.fine}/>`)
      .join('')
  );
}

// ---------- The street: Długi Targ-style facades ----------

function facade(r: Renderer, x: number, w: number, h: number, c: string, kind: number): string {
  const base = 300;
  const top = base - h;
  const ol = r.outline;
  let s = '';
  // The house: a stepped, curved or pointed gable, cornices, pilasters, windows with frames.
  if (kind % 3 === 0) {
    s += `<path d="M${x},${base} L${x},${top + 46} L${x + w * 0.12},${top + 46} L${x + w * 0.12},${top + 30} L${x + w * 0.24},${top + 30} L${x + w * 0.24},${top + 14} L${x + w * 0.38},${top + 14} L${x + w * 0.38},${top} L${x + w * 0.62},${top} L${x + w * 0.62},${top + 14} L${x + w * 0.76},${top + 14} L${x + w * 0.76},${top + 30} L${x + w * 0.88},${top + 30} L${x + w * 0.88},${top + 46} L${x + w},${top + 46} L${x + w},${base} Z" fill="${r.face(c, 'wallBack')}"${ol}/>`;
  } else if (kind % 3 === 1) {
    s += `<path d="M${x},${base} L${x},${top + 52} Q${x + w * 0.06},${top + 28} ${x + w * 0.24},${top + 26} Q${x + w * 0.3},${top + 4} ${x + w * 0.5},${top} Q${x + w * 0.7},${top + 4} ${x + w * 0.76},${top + 26} Q${x + w * 0.94},${top + 28} ${x + w},${top + 52} L${x + w},${base} Z" fill="${r.face(c, 'wallBack')}"${ol}/>`;
    s += `<circle cx="${x + w * 0.5}" cy="${top + 22}" r="${w * 0.08}" fill="${r.colour(light(c, 0.3))}"${r.fine}/>`;
  } else {
    s += `<path d="M${x},${base} L${x},${top + 40} L${x + w * 0.5},${top} L${x + w},${top + 40} L${x + w},${base} Z" fill="${r.face(c, 'wallBack')}"${ol}/>`;
  }
  // Cornices between floors.
  for (let f = 0; f < 4; f++) {
    const cy = top + 56 + f * 46;
    if (cy > base - 30) continue;
    s += `<rect x="${x}" y="${cy}" width="${w}" height="4" fill="${r.colour(light(c, 0.35))}"/><rect x="${x}" y="${cy + 4}" width="${w}" height="2" fill="${r.colour(dark(c, 0.2))}"/>`;
    for (let col = 0; col < 3; col++) {
      const wx = x + 10 + col * ((w - 20) / 3) + 4;
      const ww = (w - 20) / 3 - 8;
      const wy = cy + 10;
      if (wy + 28 > base - 6) continue;
      s += `<rect x="${wx - 2}" y="${wy - 2}" width="${ww + 4}" height="30" rx="${ww / 2}" fill="${r.colour(light(c, 0.45))}"/><rect x="${wx}" y="${wy}" width="${ww}" height="26" rx="${ww / 2.2}" fill="${r.colour('#5f7b8f')}"/><path d="M${wx + ww / 2},${wy + 2} l0,24 M${wx},${wy + 13} l${ww},0" stroke="${r.colour(light(c, 0.45))}" stroke-width="1.4"/>` + r.shine(wx + ww * 0.3, wy + 7, 2, 3);
      if (col === 1 && f === 1) s += `<rect x="${wx - 4}" y="${wy + 26}" width="${ww + 8}" height="6" rx="2" fill="${r.colour('#6a3d26')}"/><circle cx="${wx + 2}" cy="${wy + 25}" r="3" fill="${r.colour('#e8463c')}"/><circle cx="${wx + ww / 2}" cy="${wy + 24}" r="3" fill="${r.colour('#f07a8a')}"/><circle cx="${wx + ww - 2}" cy="${wy + 25}" r="3" fill="${r.colour('#e8463c')}"/>`;
    }
  }
  // A shop front on the ground floor, some with a striped awning.
  if (kind % 2 === 0) {
    s += `<rect x="${x + 8}" y="${base - 34}" width="${w - 16}" height="34" fill="${r.colour(dark(c, 0.35))}"/><rect x="${x + 12}" y="${base - 30}" width="${w - 24}" height="26" fill="${r.colour('#e9c97a')}" opacity="0.6"/>`;
    s += `<path d="M${x + 4},${base - 40} L${x + w - 4},${base - 40} L${x + w},${base - 26} L${x},${base - 26} Z" fill="${r.colour(kind % 4 ? '#c0443a' : '#3d6a9a')}"${r.fine}/>`;
    for (let i = 0; i < 6; i++) s += `<rect x="${x + 6 + i * ((w - 8) / 6)}" y="${base - 40}" width="${(w - 8) / 12}" height="14" fill="#fbf3e1" opacity="0.9"/>`;
  }
  return s;
}

function street(r: Renderer): string {
  let s = '';
  // Sky with soft clouds, and St Mary's tower and the Town Hall spire far behind.
  s += `<rect width="${W}" height="320" fill="url(#sky)"/>`;
  s += [180, 560, 1000].map((x, i) => `<g opacity="0.9"><ellipse cx="${x}" cy="${60 + i * 14}" rx="60" ry="16" fill="#ffffff"/><ellipse cx="${x + 30}" cy="${50 + i * 14}" rx="38" ry="18" fill="#ffffff"/></g>`).join('');
  s += `<rect x="1180" y="40" width="60" height="230" fill="${r.colour('#b5644a')}"${r.outline}/><path d="M1176,40 L1210,8 L1244,40 Z" fill="${r.colour('#4a7a6a')}"${r.outline}/><rect x="1196" y="80" width="10" height="24" rx="5" fill="${r.colour('#3a2a2a')}"/><rect x="1214" y="80" width="10" height="24" rx="5" fill="${r.colour('#3a2a2a')}"/>`;
  s += `<rect x="110" y="70" width="34" height="200" fill="${r.colour('#c9a07a')}"${r.outline}/><path d="M104,70 L127,-10 L150,70 Z" fill="${r.colour('#4a7a6a')}"${r.outline}/><circle cx="127" cy="100" r="11" fill="${r.colour('#f6efe0')}"${r.fine}/>`;
  const cols = ['#e8a37b', '#f1d38f', '#9fc0a8', '#e6b7b0', '#c9d6e3', '#f1c48f', '#d98a7a', '#b8cfa0'];
  let x = -30;
  let i = 0;
  while (x < W + 40) {
    const w = 96 + ((i * 29) % 26);
    const h = 190 + ((i * 53) % 60);
    s += facade(r, x, w, h, cols[i % cols.length], i);
    x += w;
    i++;
  }
  // The street: a pavement with a kerb, then cobbles stone by stone.
  s += `<rect x="0" y="300" width="${W}" height="18" fill="${r.colour('#cfc3ad')}"/><rect x="0" y="318" width="${W}" height="4" fill="${r.colour('#9a8c76')}"/>`;
  s += `<rect x="0" y="322" width="${W}" height="${H - 322}" fill="${r.colour('#b7aa93')}"/>`;
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 50; col++) {
      const cx = col * 28 + (row % 2) * 14 - 8;
      const cy = 330 + row * 20;
      const tone = ((col * 7 + row * 13) % 5) / 30;
      s += `<rect x="${cx}" y="${cy}" width="24" height="15" rx="5" fill="${r.colour(mix('#c9bda6', '#a99c84', tone * 3))}"/>` + (r.t === 'soft3d' || r.t === 'painted' ? `<rect x="${cx + 3}" y="${cy + 2}" width="12" height="3" rx="1.5" fill="#ffffff" opacity="0.18"/>` : '');
    }
  }
  return s;
}

function streetLife(r: Renderer): string {
  const lamp = (x: number, y: number) =>
    `<rect x="${x - 3}" y="${y - 120}" width="6" height="120" fill="${r.volume('#2f2f36', 'cylinder')}"/><rect x="${x - 10}" y="${y - 8}" width="20" height="8" rx="2" fill="#2f2f36"/><path d="M${x - 13},${y - 122} L${x + 13},${y - 122} L${x + 9},${y - 148} L${x - 9},${y - 148} Z" fill="${r.volume('#fff1c0', 'cylinder')}"${r.fine}/><path d="M${x - 15},${y - 148} L${x + 15},${y - 148} L${x},${y - 162} Z" fill="#2f2f36"/>`;
  const bench = (x: number, y: number) => `<rect x="${x}" y="${y - 34}" width="76" height="8" rx="3" fill="${r.volume('#6a3d26', 'flat')}"${r.fine}/><rect x="${x}" y="${y - 20}" width="76" height="8" rx="3" fill="${r.colour('#7a4628')}"${r.fine}/><rect x="${x + 6}" y="${y - 12}" width="5" height="12" fill="#2f2f36"/><rect x="${x + 65}" y="${y - 12}" width="5" height="12" fill="#2f2f36"/>`;
  const pigeons = (x: number, y: number) => [0, 18, 34].map((d, i) => `<ellipse cx="${x + d}" cy="${y - 5}" rx="7" ry="5" fill="${r.colour('#8a8f9a')}"${r.fine}/><circle cx="${x + d + (i % 2 ? -6 : 6)}" cy="${y - 10}" r="3.5" fill="${r.colour('#6a6f7a')}"/>`).join('');
  return (
    tree(r, 60, 420, 1.15) +
    lamp(310, 450) +
    bench(110, 470) +
    pigeons(210, 520) +
    person(r, 250, 470, 1.35, LOOKS.tourist, { stance: 'walk', turn: 1, hands: 'side', mouth: 'smile' }) +
    person(r, 330, 520, 1.35, LOOKS.student, { stance: 'stand', turn: 1, hands: 'wave', mouth: 'open' }) +
    tree(r, 1310, 430, 1.2) +
    lamp(1060, 455) +
    bench(1150, 478) +
    person(r, 1120, 520, 1.35, LOOKS.foodie, { stance: 'walk', turn: -1, hands: 'side', mouth: 'smile' }) +
    person(r, 1240, 505, 1.35, LOOKS.granny, { stance: 'stand', turn: -1, hands: 'side', mouth: 'talk' })
  );
}

// ---------- The four treatments ----------

const NAMES: Record<Treatment, string> = {
  pixel: 'Modern HD pixel art',
  painted: 'Hand-painted illustration',
  soft3d: 'Soft 3D look',
  cartoon: 'Detailed cartoon',
};

function defsFor(t: Treatment): string {
  const sky = t === 'cartoon' ? ['#6fc3ff', '#d6f0ff'] : t === 'soft3d' ? ['#9fd4f5', '#eaf6fc'] : t === 'painted' ? ['#f5d9a6', '#c9e2ee'] : ['#8ec9e8', '#d8eef7'];
  return `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sky[0]}"/><stop offset="1" stop-color="${sky[1]}"/></linearGradient>
    <filter id="blur6"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="paint" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4"/><feGaussianBlur stdDeviation="0.6"/></filter>
    <filter id="canvas"><feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 0.5  0 0 0 0 0.38  0 0 0 0 0.26  0 0 0 0.22 0"/></filter>
    <radialGradient id="sunlight" cx="0.15" cy="0.2" r="0.9"><stop offset="0" stop-color="#fff2c8" stop-opacity="0.55"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient>
    <linearGradient id="beam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6d6" stop-opacity="0.55"/><stop offset="1" stop-color="#fff6d6" stop-opacity="0"/></linearGradient>
    <radialGradient id="glow"><stop offset="0" stop-color="#ffe2a0" stop-opacity="0.6"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
    <filter id="posterize"><feComponentTransfer><feFuncR type="discrete" tableValues="0.1 0.22 0.34 0.46 0.58 0.7 0.8 0.9 0.98"/><feFuncG type="discrete" tableValues="0.08 0.19 0.3 0.41 0.52 0.63 0.74 0.85 0.95"/><feFuncB type="discrete" tableValues="0.12 0.22 0.32 0.44 0.56 0.68 0.8 0.9"/></feComponentTransfer></filter>`;
}

/** Light over the scene: the sunbeam through the window and soft glows under the lamps. */
function lighting(t: Treatment): string {
  const beam = [P(0, 1.42, 3.05), P(0, 3.38, 3.05), P(3.6, 4.5, 0), P(2.2, 1.6, 0)];
  const glows = [P(5.0, 2.4, 2.4), P(2.0, 4.3, 2.4), P(5.2, 4.9, 2.4), P(7.4, 2.25, 2.0)];
  const strength = t === 'cartoon' ? 0.55 : t === 'pixel' ? 0.75 : 1;
  return (
    `<polygon points="${ptsOf(beam)}" fill="url(#beam)" opacity="${0.8 * strength}" style="mix-blend-mode:screen"/>` +
    glows.map(([x, y]) => `<ellipse cx="${x}" cy="${y + 40}" rx="90" ry="60" fill="url(#glow)" opacity="${0.6 * strength}" style="mix-blend-mode:screen"/>`).join('') +
    `<rect width="${W}" height="${H}" fill="url(#sunlight)" style="mix-blend-mode:soft-light"/>`
  );
}

function hud(t: Treatment): string {
  const styles: Record<Treatment, string> = {
    pixel: `.panel { background:#fbf3e1; border:3px solid #3b2433; box-shadow: inset 0 0 0 2px #d9a92b, 3px 3px 0 #3b2433; font-family: 'Lucida Console', monospace; }
      .panel b { font-family: 'Lucida Console', monospace; }
      .btn { background:#fbf3e1; border:3px solid #3b2433; box-shadow: inset 0 0 0 2px #d9a92b, 3px 3px 0 #3b2433; border-radius:0; }`,
    painted: `.panel { background: rgba(251,243,225,0.92); border: 1.5px solid #6b4a36; border-radius: 10px 14px 9px 16px; box-shadow: 0 6px 16px rgba(74,51,38,0.25); font-family: Georgia, serif; }
      .btn { background: rgba(251,243,225,0.95); border: 1.5px solid #6b4a36; border-radius: 50%; box-shadow: 0 6px 14px rgba(74,51,38,0.3); }`,
    soft3d: `.panel { background: linear-gradient(#ffffff, #eef2f8); border-radius: 18px; box-shadow: 0 2px 0 #fff inset, 0 8px 20px rgba(30,50,90,0.25); font-family: 'Segoe UI', sans-serif; }
      .btn { background: radial-gradient(circle at 35% 30%, #ffffff, #dfe6f0); border-radius: 50%; box-shadow: 0 8px 18px rgba(30,50,90,0.3), inset 0 -4px 8px rgba(0,0,0,0.08); }`,
    cartoon: `.panel { background: #fff7e6; border: 3px solid #2a1a24; border-radius: 16px; box-shadow: 0 5px 0 #2a1a24; font-family: 'Trebuchet MS', sans-serif; }
      .btn { background: linear-gradient(#ffd25c, #ffaf2e); border: 3px solid #2a1a24; border-radius: 18px; box-shadow: 0 5px 0 #2a1a24; }`,
  };
  return `<style>
    .abs { position: absolute; }
    .panel { color: #3b2a22; }
    .clock { left: 14px; top: 12px; padding: 6px 14px; }
    .clock b { font-size: 30px; color: #a8402f; }
    .stat { padding: 4px 12px; text-align: center; font-size: 12px; }
    .stat b { display: block; font-size: 20px; }
    .btn { width: 60px; height: 60px; display: grid; place-items: center; font-size: 26px; }
    .lbl { font-size: 13px; text-align: center; margin-top: 4px; color: #fff; text-shadow: 0 1px 2px #000, 0 0 5px #000; font-weight: 700; }
    ${styles[t]}
  </style>
  <div class="panel clock abs"><b>13:40</b><div style="font-size:13px">Tuesday 9 July · Week 1 · ☀️ Sunny</div></div>
  <div class="abs" style="left:50%;top:12px;transform:translateX(-50%);display:flex;gap:8px">${[
    ['34', 'served'],
    ['1 284 zł', 'takings'],
    ['0', 'walked out'],
    ['3/5', "today's goal"],
  ].map(([v, l]) => `<div class="panel stat"><b>${v}</b>${l}</div>`).join('')}</div>
  <div class="panel abs stat" style="right:14px;top:12px;display:flex;gap:14px;align-items:center;padding:8px 16px"><b>🪙 40 212 zł</b><b>3.4 ★</b></div>
  <div class="abs" style="left:16px;bottom:14px;display:flex;gap:14px">${[
    ['📋', 'Manage'],
    ['🍹', 'Happy hour'],
    ['📜', 'Flyers'],
    ['👥', "Who's who"],
  ].map(([i, l]) => `<div><div class="btn">${i}</div><div class="lbl">${l}</div></div>`).join('')}</div>
  <div class="panel abs" style="right:14px;bottom:14px;display:flex;gap:10px;padding:10px 16px;font-weight:700;font-size:16px"><span>🔊</span><span>⏸</span><span>1×</span><span style="color:#a8402f">2×</span><span>4×</span></div>
  <div class="abs" style="left:50%;bottom:10px;transform:translateX(-50%);padding:4px 14px;border-radius:12px;background:rgba(0,0,0,0.55);color:#fff;font:600 14px 'Segoe UI',sans-serif">${NAMES[t]}</div>`;
}

function page(t: Treatment): string {
  const r = new Renderer(t);
  const content = street(r) + streetLife(r) + room(r);
  const sceneSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defsFor(t)}${r.defs.join('')}</defs>
    <g ${t === 'painted' ? 'filter="url(#paint)"' : ''}>${content}${lighting(t)}</g>
    ${t === 'painted' ? `<rect width="${W}" height="${H}" filter="url(#canvas)"/>` : ''}
  </svg>`;
  // Pixel art: the same scene drawn at a third of the size with crisp edges and fewer colours,
  // then shown three times bigger without smoothing.
  const body =
    t === 'pixel'
      ? `<img src="data:image/svg+xml;utf8,${encodeURIComponent(sceneSvg.replace(`width="${W}" height="${H}"`, `width="${W / 3}" height="${H / 3}" shape-rendering="crispEdges"`).replace('<g >', '<g filter="url(#posterize)">'))}" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;image-rendering:pixelated">`
      : sceneSvg.replace('<svg ', '<svg style="position:absolute;left:0;top:0" ');
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:#000}</style></head><body>${body}${hud(t)}</body></html>`;
}

/** Close-ups: the same people at four times the size, in each treatment, side by side. */
function peoplePage(): string {
  const order: [string, Pose][] = [
    ['tourist', { stance: 'stand', turn: 1, hands: 'wave', mouth: 'open' }],
    ['granny', { stance: 'stand', turn: 0, hands: 'side', mouth: 'smile' }],
    ['chef', { stance: 'stand', turn: -1, hands: 'pan', mouth: 'smile' }],
    ['waiter', { stance: 'stand', turn: 1, hands: 'tray', mouth: 'smile' }],
  ];
  const rows = (['pixel', 'painted', 'soft3d', 'cartoon'] as Treatment[]).map((t, ti) => {
    const r = new Renderer(t);
    const figures = order.map(([who, pose], i) => person(r, 80 + i * 155, 262, 1.75, LOOKS[who], pose)).join('');
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="270" viewBox="0 0 640 270"><defs>${defsFor(t)}${r.defs.join('')}</defs><g ${t === 'painted' ? 'filter="url(#paint)"' : ''}>${figures}</g></svg>`;
    const x = (ti % 2) * 682;
    const y = Math.floor(ti / 2) * 300;
    const img =
      t === 'pixel'
        ? `<img src="data:image/svg+xml;utf8,${encodeURIComponent(svg.replace('width="640" height="270"', 'width="213" height="90" shape-rendering="crispEdges"').replace('<g >', '<g filter="url(#posterize)">'))}" style="width:640px;height:270px;image-rendering:pixelated">`
        : svg;
    return `<div style="position:absolute;left:${x}px;top:${y}px;width:682px;height:300px;background:${['#e9dcc4', '#efe3c8', '#dfeaf4', '#fff3d6'][ti]}"><div style="position:absolute;left:20px;top:12px;font:700 20px 'Segoe UI',sans-serif;color:#3b2a22">${NAMES[t]}</div><div style="position:absolute;left:20px;top:28px">${img}</div></div>`;
  });
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}</style></head><body>${rows.join('')}</body></html>`;
}

mkdirSync(OUT, { recursive: true });
for (const t of ['pixel', 'painted', 'soft3d', 'cartoon'] as Treatment[]) {
  writeFileSync(`${OUT}/${['1', '2', '3', '4'][['pixel', 'painted', 'soft3d', 'cartoon'].indexOf(t)]}-${t}.html`, page(t));
}
writeFileSync(`${OUT}/5-people.html`, peoplePage());
console.log('written', OUT);
