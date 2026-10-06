// Concept art, round 8 (project.md section 9.4): the chosen direction, round 7's "page from a
// Kashubian sketchbook", polished. Ink and watercolour on a sketchbook page, with Kashubian tulips
// and rosettes in the margins and embroidery in the room; more detail in the room, the windows
// and the people, and seated guests at the bar get legs and a proper stool.
// Run with `npx tsx scripts/pixel/concepts-v8.ts`, then
// `node scripts/pixel/shoot.mjs art/concepts/v8/html art/concepts/v8` for the PNG.

import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'art/concepts/v8/html';
const W = 1364;
const H = 603;

type Style = 'paper' | 'folk' | 'sketch';

// ---------- Colours ----------

function rgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function hx(c: number[]): string {
  return '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
const mix = (a: string, b: string, t: number) => hx(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
const dark = (c: string, t: number) => mix(c, '#1e1418', t);
const light = (c: string, t: number) => mix(c, '#fffaf0', t);

/** Each style's palette for the same things. */
const PALETTES: Record<Style | 'kashub', Record<string, string>> = {
  paper: {
    bg: '#2b2f4a', wall: '#f2dcc0', wall2: '#e8cba8', panel: '#8a5a3c', panel2: '#9c6a48', floor: '#c48a55', floor2: '#b07746', beam: '#6b4128',
    window: '#a9d6ec', windowDeep: '#7fb6d6', facadeA: '#e9967a', facadeB: '#f2cd7a', facadeC: '#9cc5a6', facadeD: '#e7a9b5', facadeE: '#a9bfe0',
    bar: '#7a4628', bar2: '#5e3420', brass: '#d6a843', glassG: '#4f8a52', glassR: '#9c3b45', glassY: '#e3b24a',
    cloth: '#fbf4e6', clothBand: '#c8453a', plate: '#ffffff', tile: '#eef3f7', tileBlue: '#3f6fa5', copper: '#c8743f', steel: '#c3cbd0',
    skin: '#f2c9a7', skin2: '#e0a983', red: '#c8453a', blue: '#3f6fa5', green: '#4f8a52', yellow: '#f0b43a', purple: '#7a5296', white: '#fbf8f1', black: '#2a2328',
    ink: '#2a2328', street: '#b9ab94', street2: '#a5977f',
  },
  folk: {
    bg: '#f6ecd6', wall: '#fbf3e1', wall2: '#f3e6c8', panel: '#1f6f8b', panel2: '#2d82a0', floor: '#d9a35f', floor2: '#c98f4c', beam: '#1f2a44',
    window: '#bfe0ee', windowDeep: '#9ccbe0', facadeA: '#e2563f', facadeB: '#f3b72e', facadeC: '#2e8b57', facadeD: '#e86f8a', facadeE: '#2f6db5',
    bar: '#b3342e', bar2: '#8e2620', brass: '#f3b72e', glassG: '#2e8b57', glassR: '#b3342e', glassY: '#f3b72e',
    cloth: '#fffaf0', clothBand: '#2f6db5', plate: '#ffffff', tile: '#fffaf0', tileBlue: '#2f6db5', copper: '#d9733a', steel: '#c9d1d6',
    skin: '#f6cfb0', skin2: '#e8b08c', red: '#d6392e', blue: '#2f6db5', green: '#2e8b57', yellow: '#f3b72e', purple: '#7b3f9a', white: '#fffaf0', black: '#1e1a1c',
    ink: '#1e1a1c', street: '#e6d3ad', street2: '#d8c194',
  },
  kashub: {
    bg: '#fbf6ea', wall: '#f7eed8', wall2: '#efe2c4', panel: '#7fb0dc', panel2: '#9cc2e6', floor: '#d8a76c', floor2: '#c38f57', beam: '#264a86',
    window: '#c4e1f2', windowDeep: '#9ccbe6', facadeA: '#e7816f', facadeB: '#f2cb55', facadeC: '#7fb98a', facadeD: '#ea9cae', facadeE: '#86b1e0',
    bar: '#b8443a', bar2: '#8f3029', brass: '#e2b23a', glassG: '#3d8a4b', glassR: '#b8443a', glassY: '#efc13f',
    cloth: '#fffaf0', clothBand: '#3a73b8', plate: '#ffffff', tile: '#f4f7f9', tileBlue: '#3a73b8', copper: '#cf7d45', steel: '#c3cbd0',
    skin: '#f3cfb0', skin2: '#e3b08c', red: '#cc3b30', blue: '#3a73b8', green: '#3d8a4b', yellow: '#efc13f', purple: '#7b4f9c', white: '#fffaf0', black: '#33262a',
    ink: '#2c2230', street: '#dccfb6', street2: '#cbbd9f',
  },
  sketch: {
    bg: '#fbf6ea', wall: '#f4e6cc', wall2: '#ecd9b8', panel: '#9a6a46', panel2: '#a87754', floor: '#d6a26a', floor2: '#c38c55', beam: '#7a5236',
    window: '#b9dbea', windowDeep: '#93c3da', facadeA: '#e8a07f', facadeB: '#efcf86', facadeC: '#a7c9a9', facadeD: '#e6b0b4', facadeE: '#b3c6e2',
    bar: '#8a5534', bar2: '#6e4128', brass: '#cfa14a', glassG: '#5e9460', glassR: '#a5464e', glassY: '#e0b555',
    cloth: '#fffaf0', clothBand: '#c4574b', plate: '#ffffff', tile: '#f2f5f7', tileBlue: '#4c78ab', copper: '#c97e4a', steel: '#c3cbd0',
    skin: '#f3cfb0', skin2: '#e3b08c', red: '#c4574b', blue: '#4c78ab', green: '#5e9460', yellow: '#eeb84b', purple: '#86629c', white: '#fffaf0', black: '#3a3236',
    ink: '#3b2a24', street: '#d9cbb0', street2: '#c9b999',
  },
};

// ---------- The painter: how each style puts down a shape ----------

class Painter {
  p: Record<string, string>;
  constructor(public s: Style, public folk = s === 'folk', palette?: Record<string, string>) {
    this.p = palette ?? PALETTES[s];
  }
  /** A filled shape. Depth: 0 far back … 3 nearest. */
  fill(d: string, colour: string, depth = 1, extra = ''): string {
    const c = this.p[colour] ?? colour;
    if (this.s === 'paper') {
      // Cut paper: a solid sheet with a soft shadow under it, nearer sheets a touch lighter.
      const tone = depth >= 2 ? light(c, 0.04) : depth === 0 ? dark(c, 0.06) : c;
      return `<path d="${d}" fill="${tone}" filter="url(#lift${depth})" ${extra}/>`;
    }
    if (this.s === 'folk') {
      // Flat folk colours with a crisp dark outline.
      return `<path d="${d}" fill="${c}" stroke="#1e1a1c" stroke-width="${depth >= 2 ? 2 : 1.5}" stroke-linejoin="round" ${extra}/>`;
    }
    // Watercolour: a wash a little off the ink line, then the ink drawn over it.
    return `<path d="${d}" fill="${c}" opacity="0.93" transform="translate(2,1.5)" filter="url(#wash)" ${extra}/><path d="${d}" fill="none" stroke="#3b2a24" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" filter="url(#ink)" ${extra}/>`;
  }
  /** A line: an outline detail, a rail, a string. */
  line(d: string, colour = 'ink', width = 1.5, extra = ''): string {
    const c = this.p[colour] ?? colour;
    if (this.s === 'sketch') return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${width * 0.9}" stroke-linecap="round" filter="url(#ink)" ${extra}/>`;
    return `<path d="${d}" fill="none" stroke="${c}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  }
  circle(x: number, y: number, r: number, colour: string, depth = 1): string {
    return this.fill(`M${x - r},${y} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0 Z`, colour, depth);
  }
  rect(x: number, y: number, w: number, h: number, colour: string, depth = 1, r = 0): string {
    if (r === 0) return this.fill(`M${x},${y} h${w} v${h} h${-w} Z`, colour, depth);
    return this.fill(`M${x + r},${y} h${w - 2 * r} q${r},0 ${r},${r} v${h - 2 * r} q0,${r} ${-r},${r} h${-(w - 2 * r)} q${-r},0 ${-r},${-r} v${-(h - 2 * r)} q0,${-r} ${r},${-r} Z`, colour, depth);
  }
  /** A small decoration that says which style this is: a cut-paper flower, a folk rosette, a sketched flower. */
  flower(x: number, y: number, r: number, colour = 'red'): string {
    const c = this.p[colour] ?? colour;
    if (this.folk) {
      // A Kashubian rosette: eight petals in two colours round a centre, with leaves.
      let g = '';
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const px = x + Math.cos(a) * r * 0.62;
        const py = y + Math.sin(a) * r * 0.62;
        g += `<ellipse cx="${px}" cy="${py}" rx="${r * 0.42}" ry="${r * 0.22}" transform="rotate(${(a * 180) / Math.PI} ${px} ${py})" fill="${i % 2 ? c : this.p.yellow}" stroke="${this.p.ink}" stroke-width="1"/>`;
      }
      g += `<circle cx="${x}" cy="${y}" r="${r * 0.3}" fill="${this.p.blue}" stroke="${this.p.ink}" stroke-width="1"/><circle cx="${x}" cy="${y}" r="${r * 0.12}" fill="${this.p.yellow}"/>`;
      return this.s === 'sketch' ? `<g filter="url(#ink)" opacity="0.92">${g}</g>` : g;
    }
    let g = '';
    for (let i = 0; i < 5; i++) {
      const a = (i * 2 * Math.PI) / 5 - Math.PI / 2;
      g += this.circle(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5, r * 0.42, c, 2);
    }
    return g + this.circle(x, y, r * 0.26, 'yellow', 3);
  }
  /** A Kashubian tulip: three petals on a curving stem with two leaves. */
  tulip(x: number, y: number, h: number, colour = 'red'): string {
    const c = this.p[colour] ?? colour;
    const k = h / 40;
    const ink = this.p.ink;
    const g =
      `<path d="M${x},${y} q${-2 * k},${-12 * k} 0,${-24 * k}" fill="none" stroke="${this.p.green}" stroke-width="${2.2 * k}"/>` +
      `<path d="M${x},${y - 6 * k} q${-14 * k},${-2 * k} ${-16 * k},${-14 * k} q${12 * k},${-1 * k} ${16 * k},${14 * k} Z" fill="${this.p.green}" stroke="${ink}" stroke-width="0.9"/>` +
      `<path d="M${x},${y - 10 * k} q${14 * k},${-2 * k} ${16 * k},${-14 * k} q${-12 * k},${-1 * k} ${-16 * k},${14 * k} Z" fill="${this.p.green}" stroke="${ink}" stroke-width="0.9"/>` +
      `<path d="M${x},${y - 22 * k} q${-12 * k},${-2 * k} ${-11 * k},${-16 * k} q${6 * k},${3 * k} ${11 * k},${8 * k} q${5 * k},${-5 * k} ${11 * k},${-8 * k} q${1 * k},${14 * k} ${-11 * k},${16 * k} Z" fill="${c}" stroke="${ink}" stroke-width="1"/>` +
      `<path d="M${x},${y - 24 * k} q${-4 * k},${-8 * k} 0,${-16 * k} q${4 * k},${8 * k} 0,${16 * k} Z" fill="${this.p.yellow}" stroke="${ink}" stroke-width="0.9"/>` +
      `<circle cx="${x}" cy="${y - 34 * k}" r="${1.6 * k}" fill="${this.p.blue}"/>`;
    return this.s === 'sketch' ? `<g filter="url(#ink)" opacity="0.92">${g}</g>` : g;
  }
}

// ---------- Folk patterns ----------

/** A repeating band of folk motifs (wycinanki): used on walls, cloths and clothes in the folk style. */
function folkBand(pt: Painter, x: number, y: number, w: number, h: number, colours: string[]): string {
  if (!pt.folk) return '';
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${pt.p[colours[0]]}" stroke="${pt.p.ink}" stroke-width="1.2"/>`;
  const step = h * 1.2;
  for (let i = 0; i * step < w; i++) {
    const cx = x + step / 2 + i * step;
    const cy = y + h / 2;
    g += `<path d="M${cx},${cy - h * 0.38} L${cx + h * 0.3},${cy} L${cx},${cy + h * 0.38} L${cx - h * 0.3},${cy} Z" fill="${pt.p[colours[1]]}"/><circle cx="${cx}" cy="${cy}" r="${h * 0.11}" fill="${pt.p[colours[2] ?? 'yellow']}"/>`;
  }
  return pt.s === 'sketch' ? `<g filter="url(#ink)" opacity="0.92">${g}</g>` : g;
}

// ---------- People, seen from the front ----------

interface Look {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'bob' | 'bun' | 'braid' | 'curly' | 'long';
  top: string;
  legs: string;
  hat?: 'straw' | 'toque' | 'beret' | 'cap' | 'scarf';
  glasses?: boolean;
  moustache?: boolean;
  apron?: string;
  pattern?: 'stripes' | 'flowers' | 'check' | 'buttons';
}

const PEOPLE: Record<string, Look> = {
  tourist: { skin: 'skin', hair: '#e3c07a', hairStyle: 'braid', top: 'yellow', legs: 'blue', hat: 'straw', pattern: 'flowers' },
  dad: { skin: 'skin2', hair: '#4a3022', hairStyle: 'short', top: 'blue', legs: '#55678a', hat: 'cap', moustache: true, pattern: 'stripes' },
  granny: { skin: 'skin', hair: '#e2ddd6', hairStyle: 'bun', top: 'green', legs: 'purple', glasses: true, hat: 'scarf', pattern: 'flowers' },
  student: { skin: 'skin2', hair: '#2b2230', hairStyle: 'curly', top: 'purple', legs: '#2f3a52', pattern: 'stripes' },
  office: { skin: 'skin', hair: '#3a2c25', hairStyle: 'short', top: '#eef2f7', legs: '#3b4252', glasses: true, pattern: 'buttons' },
  foodie: { skin: 'skin', hair: '#b04a2f', hairStyle: 'bob', top: 'red', legs: 'black', hat: 'beret', pattern: 'check' },
  chef: { skin: 'skin', hair: '#7a4b31', hairStyle: 'bun', top: 'white', legs: 'black', hat: 'toque', apron: 'white', pattern: 'buttons' },
  waiter: { skin: 'skin2', hair: '#4a2f22', hairStyle: 'short', top: 'black', legs: 'black', apron: 'white', moustache: true },
  bartender: { skin: 'skin', hair: '#c9733a', hairStyle: 'long', top: 'green', legs: 'black', apron: '#7a4628', pattern: 'check' },
};

interface Pose {
  /** Seated (shown from the waist up, behind a table), or standing. */
  sit?: boolean;
  /** Seated on a stool in the open, so the lap and legs show. */
  stool?: boolean;
  /** The face turned left (-1), front (0) or right (1). */
  turn?: number;
  arms?: 'rest' | 'wave' | 'tray' | 'glass' | 'fork' | 'pan' | 'pour';
  mouth?: 'smile' | 'laugh' | 'talk';
  eyes?: 'open' | 'happy';
}

/** A person whose feet (or seat) are at (x, y), about `h` pixels tall standing. */
function figure(pt: Painter, x: number, y: number, h: number, lk: Look, pose: Pose): string {
  const p = pt.p;
  const col = (c: string) => p[c] ?? c;
  const s = h / 150;
  const turn = pose.turn ?? 0;
  const headR = 19 * s;
  const shoulderW = 46 * s;
  const torsoH = 46 * s;
  const legH = pose.sit ? 0 : 52 * s;
  const hip = y - legH;
  const shoulder = hip - torsoH;
  const headY = shoulder - headR * 1.05;
  const fx = x + turn * headR * 0.18;
  let g = '';
  // A soft shadow on the floor under anyone standing.
  if (!pose.sit) g += `<ellipse cx="${x}" cy="${y - 1}" rx="${shoulderW * 0.85}" ry="${6 * s}" fill="${p.ink}" opacity="0.16" filter="url(#wash)"/>`;
  // Seated on a stool: the shins hang down to the footrest.
  if (pose.sit && pose.stool) {
    const knee = hip + 10 * s;
    const foot = hip + 44 * s;
    for (const side of [-1, 1]) {
      const kx = x + side * shoulderW * 0.24;
      g += pt.fill(`M${kx - 8 * s},${knee} L${kx - 7 * s},${foot - 7 * s} L${kx + 7 * s},${foot - 7 * s} L${kx + 8 * s},${knee} Z`, lk.legs, 2);
      g += pt.fill(`M${kx - 9 * s},${foot} q0,${-8 * s} ${9 * s},${-8 * s} q${9 * s},0 ${11 * s},${8 * s} Z`, 'black', 2);
    }
  }
  // Legs and shoes.
  if (!pose.sit) {
    g += pt.fill(`M${x - shoulderW * 0.34},${hip - 4 * s} L${x - shoulderW * 0.36},${y - 8 * s} L${x - 3 * s},${y - 8 * s} L${x - 2 * s},${hip - 4 * s} Z`, lk.legs, 2);
    g += pt.fill(`M${x + 2 * s},${hip - 4 * s} L${x + 3 * s},${y - 8 * s} L${x + shoulderW * 0.36},${y - 8 * s} L${x + shoulderW * 0.34},${hip - 4 * s} Z`, lk.legs, 2);
    g += pt.fill(`M${x - shoulderW * 0.4},${y} q0,${-10 * s} ${shoulderW * 0.38},${-9 * s} l0,${9 * s} Z`, 'black', 2);
    g += pt.fill(`M${x + shoulderW * 0.02},${y} l0,${-9 * s} q${shoulderW * 0.38},${-1 * s} ${shoulderW * 0.38},${9 * s} Z`, 'black', 2);
  }
  // The torso, flaring a little to the hips.
  const torso = `M${x - shoulderW / 2},${shoulder + 10 * s} Q${x - shoulderW / 2},${shoulder} ${x - shoulderW * 0.3},${shoulder} L${x + shoulderW * 0.3},${shoulder} Q${x + shoulderW / 2},${shoulder} ${x + shoulderW / 2},${shoulder + 10 * s} L${x + shoulderW * 0.46},${hip} L${x - shoulderW * 0.46},${hip} Z`;
  g += pt.fill(torso, lk.top, 2);
  // Patterns on clothes: stripes, check, flowers (embroidered in the folk style), buttons.
  const clipId = `c${Math.round(x)}${Math.round(y)}`;
  let pattern = '';
  if (lk.pattern === 'stripes') for (let i = 1; i < 5; i++) pattern += `<rect x="${x - shoulderW}" y="${shoulder + i * torsoH * 0.2}" width="${shoulderW * 2}" height="${3.2 * s}" fill="${pt.folk ? p.white : light(col(lk.top), 0.45)}" opacity="0.85"/>`;
  if (lk.pattern === 'check') for (let i = 0; i < 6; i++) pattern += `<rect x="${x - shoulderW / 2 + i * shoulderW * 0.2}" y="${shoulder}" width="${2.4 * s}" height="${torsoH}" fill="${dark(col(lk.top), 0.3)}" opacity="0.5"/><rect x="${x - shoulderW / 2}" y="${shoulder + i * torsoH * 0.2}" width="${shoulderW}" height="${2.4 * s}" fill="${dark(col(lk.top), 0.3)}" opacity="0.5"/>`;
  if (lk.pattern === 'flowers') {
    if (pt.folk) pattern += pt.flower(x, shoulder + torsoH * 0.42, 9 * s, 'red') + pt.flower(x - shoulderW * 0.3, shoulder + torsoH * 0.75, 5 * s, 'blue') + pt.flower(x + shoulderW * 0.3, shoulder + torsoH * 0.75, 5 * s, 'blue');
    else for (const [dx, dy] of [[-0.25, 0.3], [0.2, 0.5], [-0.1, 0.75], [0.3, 0.2]]) pattern += `<circle cx="${x + dx * shoulderW}" cy="${shoulder + dy * torsoH}" r="${2.6 * s}" fill="${light(col(lk.top), 0.6)}"/>`;
  }
  pattern += `<rect x="${x + shoulderW * 0.18}" y="${shoulder - 2}" width="${shoulderW}" height="${torsoH + 4}" fill="${dark(col(lk.top), 0.35)}" opacity="0.25"/>`;
  for (let i = 0; i < 5; i++) pattern += `<path d="M${x + shoulderW * 0.22 + i * 4 * s},${hip} l${9 * s},${-12 * s}" stroke="${p.ink}" stroke-width="0.8" opacity="0.35"/>`;
  if (lk.pattern === 'buttons') for (let i = 1; i < 5; i++) pattern += `<circle cx="${x}" cy="${shoulder + i * torsoH * 0.19}" r="${1.8 * s}" fill="${dark(col(lk.top), 0.35)}"/>`;
  g += `<clipPath id="${clipId}"><path d="${torso}"/></clipPath><g clip-path="url(#${clipId})">${pattern}</g>`;
  if (pose.sit && pose.stool) g += pt.fill(`M${x - shoulderW * 0.5},${hip - 6 * s} L${x + shoulderW * 0.5},${hip - 6 * s} Q${x + shoulderW * 0.54},${hip + 14 * s} ${x + shoulderW * 0.38},${hip + 14 * s} L${x - shoulderW * 0.38},${hip + 14 * s} Q${x - shoulderW * 0.54},${hip + 14 * s} ${x - shoulderW * 0.5},${hip - 6 * s} Z`, lk.legs, 2) + pt.line(`M${x},${hip - 2 * s} L${x},${hip + 13 * s} M${x - shoulderW * 0.42},${hip + 10 * s} q${shoulderW * 0.2},${4 * s} ${shoulderW * 0.36},0 M${x + shoulderW * 0.06},${hip + 10 * s} q${shoulderW * 0.2},${4 * s} ${shoulderW * 0.36},0`, dark(col(lk.legs), 0.35), 1.2);
  // Collar.
  g += pt.fill(`M${x - 9 * s},${shoulder} L${x},${shoulder + 9 * s} L${x + 9 * s},${shoulder} Z`, lk.top === 'black' ? 'white' : dark(col(lk.top), 0.15), 3);
  if (lk.top === 'black') g += pt.fill(`M${x - 6 * s},${shoulder + 3 * s} l6,${3 * s} l6,${-3 * s} l0,${6 * s} l-6,${-3 * s} l-6,${3 * s} Z`, 'red', 3);
  if (lk.apron) g += pt.fill(`M${x - shoulderW * 0.36},${shoulder + torsoH * 0.45} L${x + shoulderW * 0.36},${shoulder + torsoH * 0.45} L${x + shoulderW * 0.42},${pose.sit ? hip : y - 14 * s} L${x - shoulderW * 0.42},${pose.sit ? hip : y - 14 * s} Z`, lk.apron, 3);
  if (lk.apron && pt.folk) g += folkBand(pt, x - shoulderW * 0.42, (pose.sit ? hip : y - 14 * s) - 9 * s, shoulderW * 0.84, 8 * s, ['red', 'yellow', 'blue']);
  // Arms with hands, posed.
  const arm = (x1: number, y1: number, x2: number, y2: number) => {
    const w = 10 * s;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = (-dy / len) * w * 0.5;
    const ny = (dx / len) * w * 0.5;
    const r = w / 2;
    const cx = x1 + dx * 0.78;
    const cy = y1 + dy * 0.78;
    return (
      pt.fill(`M${x1 + nx},${y1 + ny} L${x2 + nx},${y2 + ny} A${r},${r} 0 0 0 ${x2 - nx},${y2 - ny} L${x1 - nx},${y1 - ny} A${r},${r} 0 0 0 ${x1 + nx},${y1 + ny} Z`, lk.top, 2) +
      pt.line(`M${cx + nx * 1.1},${cy + ny * 1.1} L${cx - nx * 1.1},${cy - ny * 1.1}`, dark(col(lk.top), 0.35), 2.2 * s) +
      pt.circle(x2, y2, 6 * s, lk.skin, 3)
    );
  };
  const L: [number, number] = [x - shoulderW * 0.48, shoulder + 8 * s];
  const R: [number, number] = [x + shoulderW * 0.48, shoulder + 8 * s];
  const a = pose.arms ?? 'rest';
  const tableY = hip - 4 * s;
  if (a === 'rest') g += arm(...L, x - shoulderW * 0.42, tableY) + arm(...R, x + shoulderW * 0.42, tableY);
  if (a === 'wave') g += arm(...L, x - shoulderW * 0.42, tableY) + arm(...R, x + shoulderW * 0.95, shoulder - 22 * s);
  if (a === 'fork') g += arm(...L, x - shoulderW * 0.42, tableY) + arm(...R, x + shoulderW * 0.2, shoulder + 2 * s) + pt.line(`M${x + shoulderW * 0.2},${shoulder + 2 * s} l${5 * s},${-14 * s}`, '#9aa0a8', 2.2 * s) + pt.circle(x + shoulderW * 0.2 + 5 * s, shoulder - 13 * s, 3.5 * s, '#f1d79a', 3);
  if (a === 'glass') g += arm(...L, x - shoulderW * 0.42, tableY) + arm(...R, x + shoulderW * 0.7, shoulder - 6 * s) + pt.fill(`M${x + shoulderW * 0.7 - 6 * s},${shoulder - 22 * s} h${12 * s} l${-2 * s},${16 * s} h${-8 * s} Z`, 'yellow', 3) + `<rect x="${x + shoulderW * 0.7 - 6 * s}" y="${shoulder - 25 * s}" width="${12 * s}" height="${4 * s}" fill="#fffaf0"/>`;
  if (a === 'tray') g += arm(...L, x - shoulderW * 0.55, hip - 6 * s) + arm(...R, x + shoulderW * 0.8, shoulder - 8 * s) + pt.fill(`M${x + shoulderW * 0.2},${shoulder - 12 * s} h${shoulderW * 1.3} l${-4 * s},${5 * s} h${-shoulderW * 1.3 + 8 * s} Z`, 'steel', 3) + pt.fill(`M${x + shoulderW * 0.45},${shoulder - 26 * s} h${11 * s} l${-2 * s},${14 * s} h${-7 * s} Z`, 'red', 3) + pt.fill(`M${x + shoulderW * 0.85},${shoulder - 14 * s} q${10 * s},${-12 * s} ${22 * s},0 Z`, 'plate', 3) + pt.circle(x + shoulderW * 0.85 + 11 * s, shoulder - 18 * s, 4 * s, 'yellow', 3);
  if (a === 'pan') g += arm(...L, x - shoulderW * 0.5, shoulder + 26 * s) + arm(...R, x + shoulderW * 0.75, shoulder + 14 * s) + pt.line(`M${x + shoulderW * 0.75},${shoulder + 14 * s} l${18 * s},${-4 * s}`, 'ink', 3 * s) + pt.fill(`M${x + shoulderW * 0.75 + 16 * s},${shoulder + 6 * s} h${30 * s} q${-2 * s},${10 * s} ${-15 * s},${10 * s} q${-13 * s},0 ${-15 * s},${-10 * s} Z`, 'black', 3) + pt.circle(x + shoulderW * 0.75 + 26 * s, shoulder + 2 * s, 5 * s, '#f1d79a', 3) + pt.circle(x + shoulderW * 0.75 + 36 * s, shoulder - 2 * s, 4 * s, '#f1d79a', 3);
  if (a === 'pour') g += arm(...L, x - shoulderW * 0.2, shoulder + 30 * s) + arm(...R, x + shoulderW * 0.6, shoulder + 4 * s) + pt.fill(`M${x + shoulderW * 0.6 - 5 * s},${shoulder + 4 * s} h${10 * s} v${-22 * s} l${-2 * s},${-8 * s} h${-6 * s} l${-2 * s},${8 * s} Z`, 'glassG', 3);
  // Neck, ears and head.
  g += pt.rect(x - 6 * s, shoulder - 8 * s, 12 * s, 10 * s, dark(col(lk.skin), 0.08), 2);
  if (lk.hairStyle === 'long' || lk.hairStyle === 'bob' || lk.hairStyle === 'braid') {
    const len = lk.hairStyle === 'long' ? 1.9 : lk.hairStyle === 'bob' ? 1.15 : 0.9;
    g += pt.fill(`M${fx - headR * 1.08},${headY - headR * 0.2} Q${fx - headR * 1.25},${headY + headR * len} ${fx - headR * 0.4},${headY + headR * len} L${fx + headR * 0.4},${headY + headR * len} Q${fx + headR * 1.25},${headY + headR * len} ${fx + headR * 1.08},${headY - headR * 0.2} Z`, lk.hair, 2);
  }
  if (lk.hairStyle === 'braid') {
    for (let i = 0; i < 4; i++) g += pt.circle(fx + headR * 1.0, headY + headR * (0.5 + i * 0.42), headR * 0.24, lk.hair, 2);
    g += pt.circle(fx + headR * 1.0, headY + headR * 2.2, headR * 0.16, 'red', 3);
  }
  g += pt.circle(fx - headR * 0.98, headY + headR * 0.12, headR * 0.2, lk.skin, 2) + pt.circle(fx + headR * 0.98, headY + headR * 0.12, headR * 0.2, lk.skin, 2);
  g += pt.fill(`M${fx - headR},${headY} Q${fx - headR},${headY + headR * 1.12} ${fx},${headY + headR * 1.1} Q${fx + headR},${headY + headR * 1.12} ${fx + headR},${headY} Q${fx + headR},${headY - headR * 1.05} ${fx},${headY - headR * 1.05} Q${fx - headR},${headY - headR * 1.05} ${fx - headR},${headY} Z`, lk.skin, 3);
  // Face: eyes (open with a shine, or happy curves), brows, rosy cheeks, nose, mouth.
  const ey = headY + headR * 0.12;
  const eyeX = headR * 0.4;
  const t = turn * headR * 0.14;
  for (const side of [-1, 1]) {
    const ex = fx + side * eyeX + t;
    if (pose.eyes === 'happy') g += pt.line(`M${ex - headR * 0.16},${ey + headR * 0.04} Q${ex},${ey - headR * 0.16} ${ex + headR * 0.16},${ey + headR * 0.04}`, 'ink', 2 * s);
    else g += `<ellipse cx="${ex}" cy="${ey}" rx="${headR * 0.14}" ry="${headR * 0.18}" fill="${p.ink}"/><circle cx="${ex + headR * 0.05}" cy="${ey - headR * 0.06}" r="${headR * 0.055}" fill="#ffffff"/>`;
    g += pt.line(`M${ex - headR * 0.18},${ey - headR * 0.32} Q${ex},${ey - headR * 0.4} ${ex + headR * 0.18},${ey - headR * 0.3}`, dark(col(lk.hair), 0.3), 1.8 * s);
    g += `<ellipse cx="${ex + side * headR * 0.08}" cy="${ey + headR * 0.38}" rx="${headR * (pt.folk ? 0.19 : 0.16)}" ry="${headR * (pt.folk ? 0.19 : 0.1)}" fill="${pt.folk ? p.red : '#ef8a7e'}" opacity="0.55"/>`;
  }
  g += pt.line(`M${fx + t},${ey + headR * 0.14} q${headR * 0.1},${headR * 0.16} ${-headR * 0.05},${headR * 0.22}`, dark(col(lk.skin), 0.3), 1.6 * s);
  const my = ey + headR * 0.55;
  const mx = fx + t;
  if (lk.moustache) g += pt.fill(`M${mx - headR * 0.32},${my - headR * 0.04} Q${mx - headR * 0.15},${my - headR * 0.2} ${mx},${my - headR * 0.08} Q${mx + headR * 0.15},${my - headR * 0.2} ${mx + headR * 0.32},${my - headR * 0.04} Q${mx},${my + headR * 0.04} ${mx - headR * 0.32},${my - headR * 0.04} Z`, lk.hair, 3);
  if (pose.mouth === 'laugh') g += `<path d="M${mx - headR * 0.24},${my} Q${mx},${my + headR * 0.42} ${mx + headR * 0.24},${my} Z" fill="#7a2f35"/><path d="M${mx - headR * 0.14},${my + headR * 0.14} Q${mx},${my + headR * 0.26} ${mx + headR * 0.14},${my + headR * 0.14}" fill="#e46a6f"/>`;
  else if (pose.mouth === 'talk') g += `<ellipse cx="${mx}" cy="${my + headR * 0.06}" rx="${headR * 0.12}" ry="${headR * 0.1}" fill="#7a2f35"/>`;
  else g += pt.line(`M${mx - headR * 0.2},${my} Q${mx},${my + headR * 0.2} ${mx + headR * 0.2},${my}`, '#7a3b3b', 1.8 * s);
  if (lk.glasses) for (const side of [-1, 1]) g += `<circle cx="${fx + side * eyeX + t}" cy="${ey}" r="${headR * 0.3}" fill="#ffffff" fill-opacity="0.18" stroke="${p.ink}" stroke-width="${1.6 * s}"/>`;
  // Hair on top.
  if (lk.hairStyle === 'curly') {
    for (const [dx, dy] of [[-0.8, -0.35], [-0.45, -0.8], [0, -0.95], [0.45, -0.8], [0.8, -0.35], [-0.2, -0.6], [0.25, -0.62]]) g += pt.circle(fx + dx * headR, headY + dy * headR, headR * 0.4, lk.hair, 3);
  } else {
    const side = lk.hairStyle === 'bob' || lk.hairStyle === 'long' || lk.hairStyle === 'braid' ? 0.35 : 0.05;
    g += pt.fill(`M${fx - headR * 1.06},${headY + headR * side} Q${fx - headR * 1.12},${headY - headR * 1.25} ${fx},${headY - headR * 1.12} Q${fx + headR * 1.12},${headY - headR * 1.25} ${fx + headR * 1.06},${headY + headR * side} Q${fx + headR * 0.85},${headY - headR * 0.4} ${fx + headR * 0.3},${headY - headR * 0.5} Q${fx + turn * headR * 0.3},${headY - headR * 0.28} ${fx - headR * 0.3},${headY - headR * 0.52} Q${fx - headR * 0.85},${headY - headR * 0.42} ${fx - headR * 1.06},${headY + headR * side} Z`, lk.hair, 3);
    if (lk.hairStyle === 'bun') g += pt.circle(fx, headY - headR * 1.15, headR * 0.42, lk.hair, 3);
    const strand = dark(col(lk.hair), 0.4);
    g += pt.line(`M${fx - headR * 0.15},${headY - headR * 1.05} Q${fx - headR * 0.75},${headY - headR * 0.95} ${fx - headR * 0.95},${headY - headR * 0.2}`, strand, 1.1 * s);
    g += pt.line(`M${fx + headR * 0.2},${headY - headR * 1.05} Q${fx + headR * 0.75},${headY - headR * 0.95} ${fx + headR * 0.92},${headY - headR * 0.25}`, strand, 1.1 * s);
    g += pt.line(`M${fx - headR * 0.05},${headY - headR * 0.92} Q${fx + headR * 0.25},${headY - headR * 0.75} ${fx + headR * 0.4},${headY - headR * 0.56}`, strand, 1 * s);
  }
  // Hats.
  if (lk.hat === 'straw') g += pt.fill(`M${fx - headR * 1.7},${headY - headR * 0.62} Q${fx},${headY - headR * 0.95} ${fx + headR * 1.7},${headY - headR * 0.62} Q${fx},${headY - headR * 0.3} ${fx - headR * 1.7},${headY - headR * 0.62} Z`, '#e8c470', 3) + pt.fill(`M${fx - headR * 0.85},${headY - headR * 0.72} Q${fx - headR * 0.85},${headY - headR * 1.7} ${fx},${headY - headR * 1.7} Q${fx + headR * 0.85},${headY - headR * 1.7} ${fx + headR * 0.85},${headY - headR * 0.72} Z`, '#f2d488', 3) + pt.fill(`M${fx - headR * 0.85},${headY - headR * 0.9} h${headR * 1.7} v${headR * 0.2} h${-headR * 1.7} Z`, 'red', 3) + (pt.folk ? pt.flower(fx + headR * 0.55, headY - headR * 0.85, headR * 0.3, 'red') : '');
  if (lk.hat === 'cap') g += pt.fill(`M${fx - headR},${headY - headR * 0.35} Q${fx - headR},${headY - headR * 1.3} ${fx},${headY - headR * 1.25} Q${fx + headR},${headY - headR * 1.3} ${fx + headR},${headY - headR * 0.35} Z`, 'red', 3) + pt.fill(`M${fx - headR * 0.2},${headY - headR * 0.42} q${headR},${-headR * 0.06} ${headR * 1.45},${headR * 0.14} q${-headR * 0.7},${headR * 0.16} ${-headR * 1.45},${headR * 0.06} Z`, dark(col('red'), 0.15), 3);
  if (lk.hat === 'beret') g += pt.fill(`M${fx - headR * 1.15},${headY - headR * 0.6} Q${fx - headR * 0.6},${headY - headR * 1.5} ${fx + headR * 0.4},${headY - headR * 1.3} Q${fx + headR * 1.1},${headY - headR * 1.1} ${fx + headR * 0.9},${headY - headR * 0.6} Z`, 'black', 3);
  if (lk.hat === 'scarf') g += pt.fill(`M${fx - headR * 1.12},${headY + headR * 0.4} Q${fx - headR * 1.2},${headY - headR * 1.3} ${fx},${headY - headR * 1.28} Q${fx + headR * 1.2},${headY - headR * 1.3} ${fx + headR * 1.12},${headY + headR * 0.4} L${fx + headR * 0.9},${headY - headR * 0.4} Q${fx},${headY - headR * 0.7} ${fx - headR * 0.9},${headY - headR * 0.4} Z`, 'red', 3) + (pt.folk ? pt.flower(fx, headY - headR * 0.95, headR * 0.28, 'yellow') + pt.flower(fx - headR * 0.6, headY - headR * 0.7, headR * 0.2, 'blue') + pt.flower(fx + headR * 0.6, headY - headR * 0.7, headR * 0.2, 'blue') : `<circle cx="${fx - headR * 0.4}" cy="${headY - headR * 0.85}" r="${headR * 0.12}" fill="#fffaf0"/><circle cx="${fx + headR * 0.3}" cy="${headY - headR * 0.95}" r="${headR * 0.12}" fill="#fffaf0"/>`);
  if (lk.hat === 'toque') g += pt.fill(`M${fx - headR * 0.82},${headY - headR * 0.68} L${fx - headR * 0.9},${headY - headR * 1.5} Q${fx - headR * 1.35},${headY - headR * 2.5} ${fx - headR * 0.35},${headY - headR * 2.3} Q${fx},${headY - headR * 2.85} ${fx + headR * 0.4},${headY - headR * 2.3} Q${fx + headR * 1.35},${headY - headR * 2.5} ${fx + headR * 0.9},${headY - headR * 1.5} L${fx + headR * 0.82},${headY - headR * 0.68} Z`, 'white', 3);
  return g;
}

// ---------- The scene: the restaurant from the front ----------

const FLOOR_Y = 440;

let hatchId = 0;
/** Ink hatching: diagonal strokes filling a box, the sketchbook's way of shading. */
function hatch(x: number, y: number, w: number, h: number, gap = 6, opacity = 0.32): string {
  const id = `h${hatchId++}`;
  let lines = '';
  for (let k = -h; k < w; k += gap) lines += `M${x + k},${y + h} l${h},${-h} `;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><path d="${lines}" clip-path="url(#${id})" stroke="#3b2a24" stroke-width="0.9" opacity="${opacity}" filter="url(#ink)"/>`;
}

/** Mewa the seagull, the player's guide, with her feet at (x, y), facing left. */
function mewa(pt: Painter, x: number, y: number, k: number): string {
  let g = pt.line(`M${x - 3 * k},${y} l1,${-8 * k} M${x + 5 * k},${y} l-1,${-8 * k}`, '#e8873a', 2 * k);
  g += pt.fill(`M${x - 16 * k},${y - 16 * k} Q${x - 14 * k},${y - 28 * k} ${x},${y - 26 * k} Q${x + 18 * k},${y - 24 * k} ${x + 26 * k},${y - 16 * k} Q${x + 10 * k},${y - 6 * k} ${x - 4 * k},${y - 7 * k} Q${x - 14 * k},${y - 8 * k} ${x - 16 * k},${y - 16 * k} Z`, 'white', 3);
  g += pt.fill(`M${x - 6 * k},${y - 22 * k} Q${x + 12 * k},${y - 26 * k} ${x + 28 * k},${y - 15 * k} Q${x + 8 * k},${y - 10 * k} ${x - 6 * k},${y - 15 * k} Z`, '#b9c3cc', 3);
  g += pt.fill(`M${x + 20 * k},${y - 17 * k} l${10 * k},${-1 * k} l${-5 * k},${5 * k} Z`, 'black', 3);
  g += pt.circle(x - 14 * k, y - 29 * k, 8 * k, 'white', 3);
  g += `<circle cx="${x - 17 * k}" cy="${y - 31 * k}" r="${1.7 * k}" fill="#2a2328"/><circle cx="${x - 16.5 * k}" cy="${y - 31.6 * k}" r="${0.6 * k}" fill="#fff"/>`;
  g += pt.fill(`M${x - 21 * k},${y - 29 * k} l${-10 * k},${1.5 * k} l${10 * k},${2.5 * k} Z`, 'yellow', 3) + `<circle cx="${x - 27 * k}" cy="${y - 27.4 * k}" r="${1.2 * k}" fill="#d6392e"/>`;
  return g;
}

/** A swag of paper-cut bunting in folk colours. */
function bunting(pt: Painter, x1: number, x2: number, y: number, sag: number): string {
  let g = pt.line(`M${x1},${y} Q${(x1 + x2) / 2},${y + sag * 2} ${x2},${y}`, 'ink', 1.1);
  const n = Math.floor((x2 - x1) / 26);
  const cols = ['red', 'yellow', 'blue', 'green'];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const bx = x1 + (x2 - x1) * t;
    const by = y + 4 * sag * t * (1 - t);
    g += pt.fill(`M${bx - 8},${by} h16 l-3,8 l3,8 l-8,-3 l-8,3 l3,-8 Z`, cols[i % 4], 3);
  }
  return g;
}

function scene(pt: Painter, frame: Frame): string {
  const p = pt.p;
  let g = '';
  // The back wall, with wallpaper (folk: a wycinanki pattern; others: little flowers in rows).
  g += pt.rect(80, 30, W - 160, FLOOR_Y - 30, 'wall', 0);
  if (pt.folk) {
    for (let x = 120; x < W - 120; x += 90) for (let y = 70; y < 320; y += 90) g += ((x + y) / 90) % 2 ? pt.tulip(x, y + 16, 30, ['red', 'blue'][((x / 90) | 0) % 2]) : pt.flower(x, y, 10, ['red', 'blue', 'green'][((x + y) / 90) % 3 | 0]);
  } else {
    for (let x = 110; x < W - 100; x += 46) for (let y = 70; y < 330; y += 46) g += `<circle cx="${x + ((y / 46) % 2) * 23}" cy="${y}" r="3.2" fill="${light(p.red, 0.45)}" opacity="0.7"/><circle cx="${x + ((y / 46) % 2) * 23}" cy="${y}" r="1.2" fill="${p.green}" opacity="0.7"/>`;
  }
  // Ceiling beams.
  g += pt.rect(80, 26, W - 160, 22, 'beam', 1);
  for (let x = 140; x < W - 120; x += 180) g += pt.rect(x, 26, 26, 34, 'beam', 1);
  // Three tall arched windows onto Długi Targ, with gables, Neptune's fountain and the sky.
  const windows = [470, 650, 830];
  for (const [i, wx] of windows.entries()) {
    const ww = 150;
    const arch = `M${wx},300 L${wx},130 Q${wx},70 ${wx + ww / 2},66 Q${wx + ww},70 ${wx + ww},130 L${wx + ww},300 Z`;
    g += pt.fill(arch, 'window', 0);
    g += `<g filter="url(#wash)" opacity="0.95"><ellipse cx="${wx + 40 + i * 22}" cy="${104 + i * 8}" rx="22" ry="9" fill="#fffaf0"/><ellipse cx="${wx + 58 + i * 22}" cy="${98 + i * 8}" rx="16" ry="10" fill="#fffaf0"/></g>`;
    g += pt.line(`M${wx + 96 - i * 30},${92 + i * 14} q5,-5 10,0 q5,-5 10,0`, 'ink', 1.2);
    // St Mary's brick tower in the first window, the Town Hall spire in the third.
    if (i === 0) g += pt.rect(wx + 84, 112, 52, 190, '#c27a5c', 0) + [0, 1, 2, 3].map((k) => pt.rect(wx + 86 + k * 13, 104, 8, 10, '#c27a5c', 0)).join('') + [0, 1].map((k) => `<rect x="${wx + 96 + k * 18}" y="132" width="8" height="34" rx="4" fill="${dark(p.window, 0.3)}"/>`).join('');
    if (i === 2) g += pt.rect(wx + 64, 120, 24, 180, '#d9a079', 0) + pt.fill(`M${wx + 62},122 L${wx + 76},74 L${wx + 90},122 Z`, '#4f7f6a', 0) + pt.circle(wx + 76, 72, 3.5, 'yellow', 1);
    // Facades outside.
    const cols = ['facadeA', 'facadeB', 'facadeC', 'facadeD', 'facadeE'];
    for (let k = 0; k < 3; k++) {
      const fx = wx + 4 + k * 49;
      const top = 150 + ((i * 3 + k) % 3) * 18;
      g += pt.fill(`M${fx},300 L${fx},${top + 20} L${fx + 12},${top + 20} L${fx + 12},${top + 8} L${fx + 23},${top} L${fx + 34},${top + 8} L${fx + 34},${top + 20} L${fx + 46},${top + 20} L${fx + 46},300 Z`, cols[(i * 3 + k) % 5], 0);
      for (let r = 0; r < 3; r++) g += `<rect x="${fx + 8}" y="${top + 32 + r * 30}" width="10" height="16" rx="5" fill="${dark(p.window, 0.25)}"/><rect x="${fx + 28}" y="${top + 32 + r * 30}" width="10" height="16" rx="5" fill="${dark(p.window, 0.25)}"/>`;
    }
    if (i === 1) {
      // Neptune on his fountain.
      g += pt.rect(wx + 50, 250, 50, 30, 'steel', 1) + pt.fill(`M${wx + 75},250 l-6,-46 l6,-10 l6,10 l-6,46 Z`, '#3f8a7a', 1) + pt.line(`M${wx + 87},205 l0,-34 M${wx + 82},171 l5,-8 l5,8`, '#3f8a7a', 2.5);
      g += `<path d="M${wx + 55},252 q20,-14 40,0" stroke="#bfe6f5" stroke-width="3" fill="none" opacity="0.9"/>`;
    }
    // Window frame and mullions.
    g += pt.line(arch, 'white', 7) + pt.line(`M${wx + ww / 2},70 L${wx + ww / 2},300 M${wx},185 L${wx + ww},185`, 'white', 5);
    // Curtains tied back, and geraniums on the sill.
    g += pt.fill(`M${wx - 18},62 Q${wx + 6},120 ${wx - 4},200 Q${wx - 14},250 ${wx - 22},300 L${wx - 30},300 L${wx - 30},62 Z`, 'red', 2) + pt.fill(`M${wx + ww + 18},62 Q${wx + ww - 6},120 ${wx + ww + 4},200 Q${wx + ww + 14},250 ${wx + ww + 22},300 L${wx + ww + 30},300 L${wx + ww + 30},62 Z`, 'red', 2);
    g += pt.rect(wx - 10, 296, ww + 20, 10, 'white', 2) + hatch(wx - 10, 306, ww + 20, 7, 5);
    for (let k = 0; k < 4; k++) g += pt.rect(wx + 6 + k * 36, 278, 22, 18, 'copper', 2, 3) + pt.circle(wx + 12 + k * 36, 272, 7, 'green', 2) + pt.circle(wx + 24 + k * 36, 270, 6, 'green', 2) + pt.circle(wx + 18 + k * 36, 264, 5, k % 2 ? 'red' : '#f07a8a', 3);
  }
  // Panelling below a dado rail (folk: painted blue with a band of motifs).
  g += pt.rect(80, 320, W - 160, FLOOR_Y - 320, 'panel', 0);
  for (let x = 96; x < W - 110; x += 74) g += pt.rect(x, 336, 60, 88, 'panel2', 1, 4);
  g += pt.rect(80, 312, W - 160, 12, 'beam', 1);
  g += folkBand(pt, 80, 324, W - 160, 14, ['yellow', 'red', 'blue']);
  // Shade under the ceiling and in the corners of the room.
  g += hatch(80, 48, W - 160, 12, 6, 0.25) + hatch(80, 48, 16, 392, 5, 0.3) + hatch(W - 96, 48, 16, 392, 5, 0.3);
  g += bunting(pt, 330, 650, 52, 10) + bunting(pt, 650, 990, 52, 10);
  // Kashubian painted plates on the wall and a shelf of preserves.
  for (const [k, px] of [310, 350, 390].entries()) g += pt.circle(px, 214, 17, 'white', 1) + pt.circle(px, 214, 13, light(p.blue, 0.7), 1) + pt.flower(px, 214, 8, ['red', 'blue', 'red'][k]);
  g += pt.rect(292, 284, 120, 6, 'bar', 1) + hatch(292, 290, 120, 5, 4);
  for (const [k, jc] of ['red', 'yellow', 'green', 'purple', '#e08a3a'].entries()) g += pt.rect(298 + k * 23, 260, 17, 24, jc, 2, 3) + pt.rect(297 + k * 23, 256, 19, 6, k % 2 ? 'red' : 'white', 2, 2) + `<rect x="${301 + k * 23}" y="268" width="11" height="7" fill="#fffaf0" opacity="0.9"/>`;
  // Framed pictures and a chalkboard between the windows and the bar.
  g += pt.rect(290, 92, 120, 92, 'brass', 1) + pt.rect(298, 100, 104, 76, '#9cc3d6', 1) + pt.fill('M310,170 L330,140 L350,170 Z', 'facadeA', 2) + pt.fill('M340,150 L340,118 L362,150 Z', 'white', 2) + pt.line('M300,166 q50,-10 100,0', 'blue', 3);
  g += pt.rect(1000, 80, 150, 104, '#6a3d26', 1) + pt.rect(1008, 88, 134, 88, '#2f4a3c', 1);
  ['DZIŚ POLECAMY', 'żurek · 28', 'pierogi · 36', 'szarlotka · 18'].forEach((t, i) => (g += `<text x="${1018}" y="${108 + i * 20}" font-family="Segoe Print, Comic Sans MS, cursive" font-size="${i ? 13 : 12}" fill="#f4efe2">${t}</text>`));
  // A clock.
  g += pt.circle(1220, 120, 24, 'white', 1) + pt.line('M1220,120 l0,-14 M1220,120 l10,4', 'ink', 2.5);
  // Mewa, perched on the picture frame.
  g += mewa(pt, 384, 92, 1.25);

  // ---------- The bar on the left ----------
  // Back shelves with bottles and a mirror.
  g += pt.rect(100, 90, 170, 220, 'bar2', 1) + pt.rect(112, 100, 146, 66, '#cfe3ec', 1);
  for (const sy of [176, 236]) {
    g += pt.rect(104, sy + 46, 162, 8, 'bar', 2);
    for (let i = 0; i < 9; i++) {
      const bc = ['glassG', 'glassR', 'glassY', 'glassG', 'white', 'glassR', 'glassG', 'glassY', 'glassR'][i];
      g += pt.fill(`M${112 + i * 17},${sy + 46} v-26 q0,-6 4,-8 v-8 h4 v8 q4,2 4,8 v26 Z`, bc, 2) + `<rect x="${113 + i * 17}" y="${sy + 30}" width="10" height="7" fill="#fffaf0" opacity="0.85"/>`;
    }
  }
  // The bartender behind the counter.
  g += figure(pt, 185, 392, 170, PEOPLE.bartender, { turn: 1, arms: 'pour', mouth: 'talk' });
  // The counter: wood with panels, a brass rail, taps and glasses.
  g += pt.rect(90, 330, 250, 116, 'bar', 2) + pt.rect(84, 322, 262, 14, 'bar2', 2);
  for (let x = 100; x < 330; x += 58) g += pt.rect(x, 346, 46, 84, light(p.bar, 0.08), 2, 3);
  g += folkBand(pt, 90, 430, 250, 12, ['red', 'yellow', 'green']);
  g += pt.line('M90,438 L340,438', 'brass', 4);
  for (const tx of [150, 175, 200]) g += pt.rect(tx, 290, 9, 32, 'brass', 3, 3) + pt.rect(tx - 2, 282, 13, 12, 'black', 3, 3);
  for (const gx of [240, 268, 296]) g += pt.fill(`M${gx},322 l2,-26 h16 l2,26 Z`, 'yellow', 3) + `<rect x="${gx + 2}" y="294" width="16" height="6" fill="#fffaf0"/>`;

  // ---------- The kitchen hatch on the right ----------
  g += pt.rect(1000, 196, 270, 140, 'tile', 0);
  for (let x = 1004; x < 1268; x += 22) for (let y = 200; y < 334; y += 22) g += `<path d="M${x + 11},${y + 4} l7,7 l-7,7 l-7,-7 Z" fill="${p.tileBlue}" opacity="0.8"/>`;
  g += pt.rect(1020, 206, 160, 10, 'ink', 1) + [1040, 1080, 1125, 1160].map((px, i) => pt.line(`M${px},216 l0,10`, 'ink', 2) + pt.circle(px, 236 + i * 2, 11 + i * 2, 'copper', 1)).join('');
  // The chef in the kitchen, with a pan, and a pot steaming on the range.
  g += pt.rect(1180, 270, 80, 66, 'steel', 1) + pt.rect(1192, 246, 50, 26, 'steel', 2, 4) + pt.line('M1205,240 q-8,-20 4,-40 M1225,240 q8,-22 -4,-44', 'white', 4) + pt.fill('M1196,272 q8,-14 16,0 q8,-14 16,0 q8,-14 16,0 Z', '#ff9a2e', 2);
  g += figure(pt, 1090, 400, 175, PEOPLE.chef, { turn: -1, arms: 'pan', mouth: 'smile', eyes: 'happy' });
  // The hatch frame and the pass with plates waiting.
  g += pt.line('M1000,196 h270 v140 h-270 Z', 'beam', 10);
  g += pt.rect(990, 330, 290, 14, 'bar2', 2) + pt.rect(1000, 344, 270, 96, 'bar', 2);
  for (let x = 1012; x < 1260; x += 64) g += pt.rect(x, 356, 52, 74, light(p.bar, 0.08), 2, 3);
  for (const [px, fc] of [[1030, 'yellow'], [1100, '#c9893a'], [1170, 'green']] as [number, string][]) g += pt.fill(`M${px - 22},330 q22,-12 44,0 Z`, 'plate', 3) + pt.fill(`M${px - 12},328 q12,-10 24,0 Z`, fc, 3);
  g += folkBand(pt, 1000, 428, 270, 12, ['blue', 'yellow', 'red']);

  // ---------- The floor ----------
  g += pt.fill(`M80,${FLOOR_Y} L${W - 80},${FLOOR_Y} L${W},${H - 40} L0,${H - 40} Z`, 'floor', 0);
  for (let i = -12; i <= 12; i++) g += pt.line(`M${W / 2 + i * 50},${FLOOR_Y} L${W / 2 + i * 62},${H - 40}`, 'floor2', 1.4, 'opacity="0.6"');
  for (let k = 1; k < 4; k++) g += pt.line(`M${80 - k * 25},${FLOOR_Y + k * 30} L${W - 80 + k * 25},${FLOOR_Y + k * 30}`, 'floor2', 1.2, 'opacity="0.5"');
  // A Kashubian rug in the middle.
  g += pt.fill(`M430,452 L940,452 L990,520 L380,520 Z`, 'red', 1) + pt.fill(`M445,458 L925,458 L968,514 L402,514 Z`, pt.folk ? 'yellow' : '#efdcb4', 1) + pt.fill(`M462,464 L908,464 L944,508 L426,508 Z`, 'blue', 1);
  for (let k = 0; k < 5; k++) g += pt.flower(520 + k * 90, 486, 9, k % 2 ? 'yellow' : 'red');
  g += hatch(90, 446, 250, 12, 5) + hatch(1000, 440, 270, 12, 5);
  // A crate from the morning market by the bar: cabbages, beetroot and carrots.
  g += `<ellipse cx="240" cy="556" rx="70" ry="7" fill="${p.ink}" opacity="0.15" filter="url(#wash)"/>`;
  for (const [cx, cy, c, r] of [[204, 512, 'green', 16], [232, 506, 'purple', 11], [252, 512, '#9a2f4a', 12], [276, 508, 'green', 15]] as [number, number, string, number][]) g += pt.circle(cx, cy, r, c, 2);
  for (const cx of [222, 244, 262]) g += pt.fill(`M${cx},508 l5,-18 l5,18 Z`, '#e8873a', 2) + pt.line(`M${cx + 5},490 l-3,-7 M${cx + 5},490 l3,-7`, 'green', 1.6);
  g += pt.rect(186, 514, 108, 42, 'bar', 3, 3) + pt.line('M188,528 h104 M188,542 h104', dark(p.bar, 0.3), 1.2) + `<text x="240" y="550" text-anchor="middle" font-family="Segoe Print, Comic Sans MS, cursive" font-size="9" fill="#fffaf0">TARG</text>`;
  // The fig tree in its pot.
  g += `<ellipse cx="130" cy="560" rx="38" ry="6" fill="${p.ink}" opacity="0.15" filter="url(#wash)"/>` + pt.line('M130,514 L130,470 M130,490 L112,462 M130,482 L150,456', 'bar2', 3.5);
  for (const [k, [lx, ly]] of [[104, 470], [116, 452], [132, 440], [150, 448], [160, 466], [146, 478], [120, 480], [100, 456], [138, 458], [126, 464], [156, 488], [108, 492]].entries()) g += pt.fill(`M${lx},${ly + 10} q-11,-9 0,-20 q11,11 0,20 Z`, k % 3 ? 'green' : light(p.green, 0.3), 3);
  g += pt.rect(102, 512, 56, 48, 'copper', 3, 6) + pt.flower(130, 536, 11, 'red');
  // A regular on a bar stool, with a beer.
  g += pt.line('M324,414 L308,484 M356,414 L372,484 M340,414 L340,486', 'ink', 3.2) + pt.line('M314,460 Q340,468 366,460', 'brass', 3) + `<ellipse cx="340" cy="486" rx="40" ry="5" fill="${p.ink}" opacity="0.15" filter="url(#wash)"/>`;
  g += pt.rect(310, 402, 60, 14, 'red', 3, 7);
  g += figure(pt, 340, 404, 190, PEOPLE.dad, { sit: true, stool: true, turn: -1, arms: 'glass', mouth: 'laugh' });

  // ---------- The tables and their guests ----------
  const tables: [number, string, Pose, string, Pose][] = [
    [560, 'tourist', { sit: true, turn: 1, arms: 'fork', mouth: 'smile' }, 'granny', { sit: true, turn: -1, arms: 'rest', mouth: 'laugh', eyes: 'happy' }],
    [790, 'student', { sit: true, turn: 1, arms: 'wave', mouth: 'laugh' }, 'office', { sit: true, turn: -1, arms: 'glass', mouth: 'smile' }],
  ];
  for (const [tx, left, lp, right, rp] of tables) {
    // Chairs behind the guests.
    for (const cx of [tx - 78, tx + 78]) g += pt.rect(cx - 26, 330, 52, 90, 'beam', 1, 10) + pt.rect(cx - 18, 340, 36, 30, light(p.beam, 0.15), 1, 6);
    g += figure(pt, tx - 80, 436, 195, PEOPLE[left], lp);
    g += figure(pt, tx + 80, 436, 195, PEOPLE[right], rp);
    // The table: a long cloth to the floor, an embroidered band, plates, glasses, bread and a candle.
    g += `<ellipse cx="${tx}" cy="${508}" rx="${124}" ry="${9}" fill="${p.ink}" opacity="0.18" filter="url(#wash)"/>`;
    g += pt.fill(`M${tx - 92},${412} Q${tx - 98},${470} ${tx - 104},${508} L${tx + 104},${508} Q${tx + 98},${470} ${tx + 92},${412} Z`, 'cloth', 2);
    for (let k = -3; k <= 3; k++) g += pt.line(`M${tx + k * 26},${420} q3,40 ${k * 3},${86}`, light(p.cloth, 0) === p.cloth ? '#d9cfbf' : '#d9cfbf', 1.2, 'opacity="0.7"');
    if (pt.folk) g += folkBand(pt, tx - 100, 478, 200, 16, ['red', 'yellow', 'blue']);
    else g += pt.line(`M${tx - 100},${486} Q${tx},${492} ${tx + 100},${486}`, 'clothBand', 4, 'stroke-dasharray="7 4"');
    g += pt.fill(`M${tx - 96},${412} Q${tx},${396} ${tx + 96},${412} Q${tx},${428} ${tx - 96},${412} Z`, 'cloth', 3);
    for (const [px, food] of [[tx - 44, 'pierogi'], [tx + 44, 'soup']] as [number, string][]) {
      g += pt.fill(`M${px - 24},410 q24,-12 48,0 q-24,10 -48,0 Z`, 'plate', 3);
      if (food === 'pierogi') for (const d of [-9, 0, 9]) g += pt.fill(`M${px + d - 7},408 q7,-11 14,0 Z`, '#f1d79a', 3);
      else g += pt.fill(`M${px - 14},408 q14,-8 28,0 q-14,6 -28,0 Z`, '#e7c87a', 3) + pt.circle(px - 4, 405, 3, 'white', 3) + pt.line(`M${px - 4},398 q-5,-7 0,-14 q5,-7 0,-14 M${px + 6},399 q-5,-7 0,-14 q5,-7 0,-12`, 'ink', 1, 'opacity="0.45"');
      g += pt.line(`M${px - 30},404 l-2,12 M${px + 30},404 l2,12`, '#8a9096', 1.6);
    }
    g += pt.fill(`M${tx - 8},404 l2,-24 h12 l2,24 Z`, 'red', 3);
    g += pt.rect(tx + 12, 388, 6, 18, 'white', 3, 2) + `<path d="M${tx + 15},378 q4,5 0,10 q-4,-5 0,-10 Z" fill="#ffc94a"/>`;
    // A pendant lamp over the table.
    g += pt.line(`M${tx},48 L${tx},128`, 'ink', 1.6) + pt.fill(`M${tx - 30},150 Q${tx - 26},126 ${tx},124 Q${tx + 26},126 ${tx + 30},150 Z`, 'green', 2) + `<ellipse cx="${tx}" cy="152" rx="12" ry="4" fill="#fff1c0"/>` + pt.line(`M${tx - 18},132 q18,-6 36,0`, light(p.green, 0.5), 1.4);
  }
  // The waiter walking in with a tray.
  g += figure(pt, 950, 572, 215, PEOPLE.waiter, { turn: -1, arms: 'tray', mouth: 'smile' });
  // A coat stand by the door, with a hat and a striped scarf.
  g += `<ellipse cx="1262" cy="560" rx="26" ry="5" fill="${p.ink}" opacity="0.15" filter="url(#wash)"/>` + pt.line('M1262,558 L1262,378 M1244,560 L1262,540 L1280,560 M1250,388 L1274,388', 'bar2', 4);
  g += pt.fill('M1244,382 q18,-22 36,0 Z', 'facadeE', 3) + pt.rect(1240, 380, 44, 6, 'facadeE', 3, 3);
  g += pt.fill('M1256,394 l-6,70 l9,0 l3,-62 l3,62 l9,0 l-6,-70 Z', 'yellow', 3) + pt.line('M1251,446 h9 M1265,446 h9 M1250,456 h9 M1265,456 h9', 'red', 2);
  // A foodie by the door, waving hello.
  g += figure(pt, 1190, 572, 205, PEOPLE.foodie, { turn: -1, arms: 'wave', mouth: 'talk' });
  // The street in front, and the cut edge of the house (the stage's frame).
  g += pt.rect(0, H - 40, W, 40, 'street', 3);
  for (let x = 0; x < W; x += 30) g += pt.rect(x + 2, H - 36, 26, 14, 'street2', 3, 5) + pt.rect(x + 17, H - 18, 26, 14, 'street2', 3, 5);
  return g + frameOf(pt, frame);
}

type Frame = 'brick' | 'folk' | 'page';

/** The edge of the stage: the cut brick of the house, a painted folk border, or nothing (the page is drawn over it). */
function frameOf(pt: Painter, frame: Frame): string {
  const p = pt.p;
  let g = '';
  if (frame === 'brick') {
    g += pt.rect(0, 0, 80, H - 40, 'facadeA', 3) + pt.rect(W - 80, 0, 80, H - 40, 'facadeA', 3) + pt.rect(0, 0, W, 26, 'facadeA', 3);
    for (let y = 20; y < H - 60; y += 40) g += pt.rect(6, y, 32, 16, dark(p.facadeA, 0.08), 3, 2) + pt.rect(42, y + 20, 32, 16, dark(p.facadeA, 0.08), 3, 2) + pt.rect(W - 74, y, 32, 16, dark(p.facadeA, 0.08), 3, 2) + pt.rect(W - 38, y + 20, 32, 16, dark(p.facadeA, 0.08), 3, 2);
  }
  if (frame === 'folk') {
    // A painted border in Kashubian blue: a vine of tulips and rosettes up each side, a band along the top.
    g += pt.rect(0, 0, 80, H - 40, 'beam', 3) + pt.rect(W - 80, 0, 80, H - 40, 'beam', 3) + pt.rect(0, 0, W, 26, 'beam', 3);
    g += pt.line(`M10,0 V${H - 40} M70,0 V${H - 40} M${W - 10},0 V${H - 40} M${W - 70},0 V${H - 40}`, light(p.beam, 0.45), 1.6);
    for (const cx of [40, W - 40]) {
      g += pt.line(`M${cx},${H - 44} ` + Array.from({ length: 8 }, (_, k) => `q${k % 2 ? -18 : 18},-33 0,-66`).join(' '), 'green', 2.4);
      for (let y = 70, k = 0; y < H - 40; y += 66, k++) g += k % 2 ? pt.flower(cx, y, 17, ['red', 'yellow'][k % 2]) : pt.tulip(cx, y + 20, 44, ['red', 'yellow', 'red'][k % 3]);
    }
    for (let x = 110, k = 0; x < W - 90; x += 56, k++) g += pt.flower(x, 13, 8, ['red', 'yellow', 'blue'][k % 3]);
  }
  return g;
}

// ---------- Light, texture and the page ----------

function defs(s: Style): string {
  const lifts = [0, 1, 2, 3]
    .map((d) => `<filter id="lift${d}" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="${1 + d}" dy="${2 + d * 1.5}" stdDeviation="${1 + d * 0.8}" flood-color="#2a1a14" flood-opacity="${s === 'paper' ? 0.28 + d * 0.04 : 0}"/></filter>`)
    .join('');
  return `${lifts}
    <filter id="wash"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/><feGaussianBlur stdDeviation="0.8"/></filter>
    <filter id="ink"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="2"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0.16 0"/></filter>
    <filter id="fibres"><feTurbulence type="fractalNoise" baseFrequency="0.02 0.4" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.08 0"/></filter>
    <radialGradient id="lampglow"><stop offset="0" stop-color="#ffe6a8" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe6a8" stop-opacity="0"/></radialGradient>
    <linearGradient id="sunbeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity="0.45"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>
    <radialGradient id="vignette" cx="0.5" cy="0.5" r="0.75"><stop offset="0.86" stop-color="#fbf6ea" stop-opacity="0"/><stop offset="1" stop-color="#fbf6ea" stop-opacity="1"/></radialGradient>`;
}

function lightAndTexture(s: Style): string {
  let g = '';
  // Sunbeams through the windows, and pools of lamplight over the tables.
  for (const wx of [470, 650, 830]) g += `<path d="M${wx},90 L${wx + 150},90 L${wx + 230},520 L${wx + 40},520 Z" fill="url(#sunbeam)" style="mix-blend-mode:screen"/>`;
  for (const tx of [560, 790]) g += `<ellipse cx="${tx}" cy="250" rx="140" ry="160" fill="url(#lampglow)" style="mix-blend-mode:screen"/>`;
  if (s === 'paper') g += `<rect width="${W}" height="${H}" filter="url(#fibres)"/><rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.6"/>`;
  if (s === 'sketch') g += `<rect width="${W}" height="${H}" filter="url(#grain)"/><rect width="${W}" height="${H}" fill="url(#vignette)"/>`;
  return g;
}

interface Mix {
  file: string;
  name: string;
  palette: 'sketch' | 'kashub';
  frame: Frame;
  hud: 'stitched' | 'folk' | 'scraps';
}

const MIXES: Mix[] = [{ file: 'sketchbook-page', name: 'A page from a Kashubian sketchbook', palette: 'sketch', frame: 'page', hud: 'scraps' }];

/** The sketchbook page drawn over the scene: paper with a ragged watercolour hole, inked ornaments and notes in the margins. */
function sketchbookPage(pt: Painter): string {
  const p = pt.p;
  const L = 64;
  const T = 34;
  const Rr = W - 64;
  const B = H - 22;
  // The hole the painting shows through, its edge wobbling like a dried wash.
  const pts: string[] = [];
  const wob = (i: number) => Math.sin(i * 1.7) * 4 + Math.sin(i * 0.53) * 6;
  let n = 0;
  for (let x = L; x <= Rr; x += 24) pts.push(`${x},${T + wob(n++)}`);
  for (let y = T; y <= B; y += 24) pts.push(`${Rr + wob(n++)},${y}`);
  for (let x = Rr; x >= L; x -= 24) pts.push(`${x},${B + wob(n++)}`);
  for (let y = B; y >= T; y -= 24) pts.push(`${L + wob(n++)},${y}`);
  let g = `<path d="M0,0 H${W} V${H} H0 Z M${pts.join(' L')} Z" fill-rule="evenodd" fill="${p.bg}" filter="url(#wash)"/>`;
  g += `<path d="M${pts.join(' L')} Z" fill="none" stroke="${mix(p.bar, p.bg, 0.55)}" stroke-width="3" opacity="0.6" filter="url(#wash)"/>`;
  // Corner rosettes and tulip vines down the margins, inked with a little colour.
  for (const [cx, cy] of [[30, 26], [W - 30, 26], [30, H - 26], [W - 30, H - 26]]) g += pt.flower(cx, cy, 18, 'red');
  for (const cx of [30, W - 30]) {
    g += pt.line(`M${cx},${H - 60} ` + Array.from({ length: 7 }, (_, k) => `q${k % 2 ? -12 : 12},-36 0,-68`).join(' '), 'green', 1.8);
    for (let y = 120, k = 0; y < H - 70; y += 68, k++) g += k % 2 ? pt.flower(cx, y - 8, 11, ['blue', 'red'][k % 2]) : pt.tulip(cx, y + 12, 34, ['red', 'blue', 'yellow'][k % 3]);
  }
  for (let x = 330, k = 0; x < W - 330; x += 46, k++) if (x < 400 || x > 640) g += k % 2 ? pt.flower(x, 16, 7, 'blue') : pt.tulip(x, 30, 22, 'red');
  // A note pointing at Mewa on the picture frame.
  g += `<text x="418" y="24" font-family="Segoe Print, Comic Sans MS, cursive" font-size="13" fill="${p.ink}" transform="rotate(-1 418 24)">Mewa, keeping an eye on things</text>`;
  g += pt.line('M414,20 Q392,22 380,44', 'ink', 1.2) + pt.line('M376,36 l4,8 l6,-6', 'ink', 1.2);
  // A ribbon bookmark, and a coffee ring left on the page.
  g += pt.fill(`M1304,0 h16 v128 l-8,-9 l-8,9 Z`, 'red', 3) + pt.line('M1306,0 v118 M1318,0 v118', light(p.red, 0.4), 0.8);
  g += `<g filter="url(#wash)" opacity="0.2"><circle cx="112" cy="572" r="30" fill="none" stroke="#7a4a2a" stroke-width="5"/><path d="M84,560 a30,30 0 0 1 40,-16" fill="none" stroke="#7a4a2a" stroke-width="2"/></g>`;
  // Handwritten notes, as if jotted while sitting at the window.
  const note = (x: number, y: number, t: string, rot: number, size = 15, colour = p.ink) => `<text x="${x}" y="${y}" transform="rotate(${rot} ${x} ${y})" font-family="Segoe Print, Comic Sans MS, cursive" font-size="${size}" fill="${colour}">${t}</text>`;
  g += note(1030, 592, 'Długi Targ, a sunny Tuesday', -1.5, 14, mix(p.ink, p.bg, 0.25));
  g += note(660, 590, '~ pierogi for table 2! ~', 1, 13, p.red);
  return g;
}

function hud(m: Mix): string {
  const look: Record<Mix['hud'], string> = {
    // Paper panels with a running stitch in red, like the edge of an embroidered cloth.
    stitched: `.panel { background: rgba(255,250,240,0.92); border: 1.4px solid #3b2a24; border-radius: 3px 8px 4px 9px; outline: 2px dashed #c4574b; outline-offset: -6px; font-family: 'Segoe Print', 'Comic Sans MS', cursive; } .panel b { color:#c4574b }`,
    // Cream panels inked in Kashubian blue, with a red stitch and a rosette pinned to the corner.
    folk: `.panel { background: #fffaf0; border: 2px solid #264a86; border-radius: 12px 6px 12px 6px; outline: 2px dashed #cc3b30; outline-offset: -7px; font-family: 'Segoe Print', 'Comic Sans MS', cursive; } .panel b { color:#264a86 } .panel::after { content:''; position:absolute; right:-9px; top:-9px; width:18px; height:18px; border-radius:50%; background: radial-gradient(circle, #efc13f 0 25%, #3a73b8 26% 45%, #cc3b30 46% 100%); border: 1.5px solid #2c2230; }`,
    // Scraps of paper taped onto the page, a little crooked.
    scraps: `.panel { background: #fffdf5; box-shadow: 1px 2px 3px rgba(60,40,30,0.25); font-family: 'Segoe Print', 'Comic Sans MS', cursive; } .panel b { color:#c4574b } .panel::before { content:''; position:absolute; left:50%; top:-9px; width:56px; height:18px; transform: translateX(-50%) rotate(-4deg); background: rgba(239,193,63,0.55); }`,
  };
  const tilt = m.hud === 'scraps' ? ['rotate(-2.5deg)', 'rotate(2deg)'] : ['none', 'none'];
  const left = m.hud === 'scraps' ? 104 : 96;
  const top = m.hud === 'scraps' ? 52 : 40;
  return `<style>.abs{position:absolute}.panel{color:#2a2328}${look[m.hud]}</style>
  <div class="panel abs" style="left:${left}px;top:${top}px;padding:6px 16px;transform:${tilt[0]}"><b style="font-size:28px">13:40</b><div style="font-size:12px">Tuesday 9 July · Week 1 · ☀️</div></div>
  <div class="panel abs" style="right:${left}px;top:${top}px;padding:8px 16px;font-size:18px;font-weight:700;transform:${tilt[1]}">🪙 40 212 zł · 3.4 ★</div>
  <div class="abs" style="display:${m.hud === 'scraps' ? 'none' : 'block'};left:50%;top:6px;transform:translateX(-50%);padding:3px 14px;border-radius:10px;background:rgba(0,0,0,0.6);color:#fff;font:600 14px 'Segoe UI',sans-serif">${m.name}</div>`;
}

function page(m: Mix): string {
  const pt = new Painter('sketch', true, PALETTES[m.palette]);
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:${pt.p.bg}}</style></head><body>
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0"><defs>${defs('sketch')}</defs>${scene(pt, m.frame)}${lightAndTexture('sketch')}${m.frame === 'page' ? sketchbookPage(pt) + `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.7"/>` : ''}</svg>
  ${hud(m)}
  </body></html>`;
}

mkdirSync(OUT, { recursive: true });
for (const m of MIXES) writeFileSync(`${OUT}/${m.file}.html`, page(m));
console.log('written', OUT);
