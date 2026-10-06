// People in the sketchbook, seen from the front and turned a little left or right: guests, staff
// and Mewa the seagull. Each is drawn as SVG text with its feet (or seat) at a given point.

import { folkBand, rosette } from './motifs';
import type { Painter } from './painter';
import { dark } from './palette';

export interface Look {
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

/** The people of the concept picture (art/concepts/v8). The game's guest groups and staff come with M8's "People" item. */
export const CAST: Record<string, Look> = {
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

export interface Pose {
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

/** A person whose feet (or seat) are at (x, y), about `h` units tall standing. */
export function figure(pt: Painter, x: number, y: number, h: number, lk: Look, pose: Pose): string {
  const p = pt.p;
  const col = (c: string) => pt.colour(c);
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
  if (!pose.sit) g += pt.shadow(x, y - 1, shoulderW * 0.85, 6 * s);
  // Seated on a stool: the shins hang down to the footrest.
  if (pose.sit && pose.stool) {
    const knee = hip + 10 * s;
    const foot = hip + 44 * s;
    for (const side of [-1, 1]) {
      const kx = x + side * shoulderW * 0.24;
      g += pt.fill(`M${kx - 8 * s},${knee} L${kx - 7 * s},${foot - 7 * s} L${kx + 7 * s},${foot - 7 * s} L${kx + 8 * s},${knee} Z`, lk.legs);
      g += pt.fill(`M${kx - 9 * s},${foot} q0,${-8 * s} ${9 * s},${-8 * s} q${9 * s},0 ${11 * s},${8 * s} Z`, 'black');
    }
  }
  // Legs and shoes.
  if (!pose.sit) {
    g += pt.fill(`M${x - shoulderW * 0.34},${hip - 4 * s} L${x - shoulderW * 0.36},${y - 8 * s} L${x - 3 * s},${y - 8 * s} L${x - 2 * s},${hip - 4 * s} Z`, lk.legs);
    g += pt.fill(`M${x + 2 * s},${hip - 4 * s} L${x + 3 * s},${y - 8 * s} L${x + shoulderW * 0.36},${y - 8 * s} L${x + shoulderW * 0.34},${hip - 4 * s} Z`, lk.legs);
    g += pt.fill(`M${x - shoulderW * 0.4},${y} q0,${-10 * s} ${shoulderW * 0.38},${-9 * s} l0,${9 * s} Z`, 'black');
    g += pt.fill(`M${x + shoulderW * 0.02},${y} l0,${-9 * s} q${shoulderW * 0.38},${-1 * s} ${shoulderW * 0.38},${9 * s} Z`, 'black');
  }
  // The torso, flaring a little to the hips.
  const torso = `M${x - shoulderW / 2},${shoulder + 10 * s} Q${x - shoulderW / 2},${shoulder} ${x - shoulderW * 0.3},${shoulder} L${x + shoulderW * 0.3},${shoulder} Q${x + shoulderW / 2},${shoulder} ${x + shoulderW / 2},${shoulder + 10 * s} L${x + shoulderW * 0.46},${hip} L${x - shoulderW * 0.46},${hip} Z`;
  g += pt.fill(torso, lk.top);
  // On the clothes: stripes, check, embroidered flowers or buttons, then shading and hatching down one side.
  let pattern = '';
  if (lk.pattern === 'stripes') for (let i = 1; i < 5; i++) pattern += `<rect x="${x - shoulderW}" y="${shoulder + i * torsoH * 0.2}" width="${shoulderW * 2}" height="${3.2 * s}" fill="${p.white}" opacity="0.85"/>`;
  if (lk.pattern === 'check')
    for (let i = 0; i < 6; i++)
      pattern += `<rect x="${x - shoulderW / 2 + i * shoulderW * 0.2}" y="${shoulder}" width="${2.4 * s}" height="${torsoH}" fill="${dark(col(lk.top), 0.3)}" opacity="0.5"/><rect x="${x - shoulderW / 2}" y="${shoulder + i * torsoH * 0.2}" width="${shoulderW}" height="${2.4 * s}" fill="${dark(col(lk.top), 0.3)}" opacity="0.5"/>`;
  if (lk.pattern === 'flowers') pattern += rosette(pt, x, shoulder + torsoH * 0.42, 9 * s, 'red') + rosette(pt, x - shoulderW * 0.3, shoulder + torsoH * 0.75, 5 * s, 'blue') + rosette(pt, x + shoulderW * 0.3, shoulder + torsoH * 0.75, 5 * s, 'blue');
  pattern += `<rect x="${x + shoulderW * 0.18}" y="${shoulder - 2}" width="${shoulderW}" height="${torsoH + 4}" fill="${dark(col(lk.top), 0.35)}" opacity="0.25"/>`;
  for (let i = 0; i < 5; i++) pattern += `<path d="M${x + shoulderW * 0.22 + i * 4 * s},${hip} l${9 * s},${-12 * s}" stroke="${p.ink}" stroke-width="0.8" opacity="0.35"/>`;
  if (lk.pattern === 'buttons') for (let i = 1; i < 5; i++) pattern += `<circle cx="${x}" cy="${shoulder + i * torsoH * 0.19}" r="${1.8 * s}" fill="${dark(col(lk.top), 0.35)}"/>`;
  const clip = pt.id('torso');
  g += `<clipPath id="${clip}"><path d="${torso}"/></clipPath><g clip-path="url(#${clip})">${pattern}</g>`;
  // The lap, for someone on a stool.
  if (pose.sit && pose.stool)
    g +=
      pt.fill(`M${x - shoulderW * 0.5},${hip - 6 * s} L${x + shoulderW * 0.5},${hip - 6 * s} Q${x + shoulderW * 0.54},${hip + 14 * s} ${x + shoulderW * 0.38},${hip + 14 * s} L${x - shoulderW * 0.38},${hip + 14 * s} Q${x - shoulderW * 0.54},${hip + 14 * s} ${x - shoulderW * 0.5},${hip - 6 * s} Z`, lk.legs) +
      pt.line(`M${x},${hip - 2 * s} L${x},${hip + 13 * s} M${x - shoulderW * 0.42},${hip + 10 * s} q${shoulderW * 0.2},${4 * s} ${shoulderW * 0.36},0 M${x + shoulderW * 0.06},${hip + 10 * s} q${shoulderW * 0.2},${4 * s} ${shoulderW * 0.36},0`, dark(col(lk.legs), 0.35), 1.2);
  // Collar, a bow tie on black, and an apron with an embroidered hem.
  g += pt.fill(`M${x - 9 * s},${shoulder} L${x},${shoulder + 9 * s} L${x + 9 * s},${shoulder} Z`, lk.top === 'black' ? 'white' : dark(col(lk.top), 0.15));
  if (lk.top === 'black') g += pt.fill(`M${x - 6 * s},${shoulder + 3 * s} l6,${3 * s} l6,${-3 * s} l0,${6 * s} l-6,${-3 * s} l-6,${3 * s} Z`, 'red');
  if (lk.apron) {
    const hem = pose.sit ? hip : y - 14 * s;
    g += pt.fill(`M${x - shoulderW * 0.36},${shoulder + torsoH * 0.45} L${x + shoulderW * 0.36},${shoulder + torsoH * 0.45} L${x + shoulderW * 0.42},${hem} L${x - shoulderW * 0.42},${hem} Z`, lk.apron);
    g += folkBand(pt, x - shoulderW * 0.42, hem - 9 * s, shoulderW * 0.84, 8 * s, ['red', 'yellow', 'blue']);
  }
  // Rounded arms with a cuff at the wrist, and hands.
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
      pt.fill(`M${x1 + nx},${y1 + ny} L${x2 + nx},${y2 + ny} A${r},${r} 0 0 0 ${x2 - nx},${y2 - ny} L${x1 - nx},${y1 - ny} A${r},${r} 0 0 0 ${x1 + nx},${y1 + ny} Z`, lk.top) +
      pt.line(`M${cx + nx * 1.1},${cy + ny * 1.1} L${cx - nx * 1.1},${cy - ny * 1.1}`, dark(col(lk.top), 0.35), 2.2 * s) +
      pt.circle(x2, y2, 6 * s, lk.skin)
    );
  };
  const L: [number, number] = [x - shoulderW * 0.48, shoulder + 8 * s];
  const R: [number, number] = [x + shoulderW * 0.48, shoulder + 8 * s];
  const a = pose.arms ?? 'rest';
  const tableY = hip - 4 * s;
  if (a === 'rest') g += arm(...L, x - shoulderW * 0.42, tableY) + arm(...R, x + shoulderW * 0.42, tableY);
  if (a === 'wave') g += arm(...L, x - shoulderW * 0.42, tableY) + arm(...R, x + shoulderW * 0.95, shoulder - 22 * s);
  if (a === 'fork')
    g +=
      arm(...L, x - shoulderW * 0.42, tableY) +
      arm(...R, x + shoulderW * 0.2, shoulder + 2 * s) +
      pt.line(`M${x + shoulderW * 0.2},${shoulder + 2 * s} l${5 * s},${-14 * s}`, '#9aa0a8', 2.2 * s) +
      pt.circle(x + shoulderW * 0.2 + 5 * s, shoulder - 13 * s, 3.5 * s, '#f1d79a');
  if (a === 'glass')
    g +=
      arm(...L, x - shoulderW * 0.42, tableY) +
      arm(...R, x + shoulderW * 0.7, shoulder - 6 * s) +
      pt.fill(`M${x + shoulderW * 0.7 - 6 * s},${shoulder - 22 * s} h${12 * s} l${-2 * s},${16 * s} h${-8 * s} Z`, 'yellow') +
      `<rect x="${x + shoulderW * 0.7 - 6 * s}" y="${shoulder - 25 * s}" width="${12 * s}" height="${4 * s}" fill="#fffaf0"/>`;
  if (a === 'tray')
    g +=
      arm(...L, x - shoulderW * 0.55, hip - 6 * s) +
      arm(...R, x + shoulderW * 0.8, shoulder - 8 * s) +
      pt.fill(`M${x + shoulderW * 0.2},${shoulder - 12 * s} h${shoulderW * 1.3} l${-4 * s},${5 * s} h${-shoulderW * 1.3 + 8 * s} Z`, 'steel') +
      pt.fill(`M${x + shoulderW * 0.45},${shoulder - 26 * s} h${11 * s} l${-2 * s},${14 * s} h${-7 * s} Z`, 'red') +
      pt.fill(`M${x + shoulderW * 0.85},${shoulder - 14 * s} q${10 * s},${-12 * s} ${22 * s},0 Z`, 'plate') +
      pt.circle(x + shoulderW * 0.85 + 11 * s, shoulder - 18 * s, 4 * s, 'yellow');
  if (a === 'pan')
    g +=
      arm(...L, x - shoulderW * 0.5, shoulder + 26 * s) +
      arm(...R, x + shoulderW * 0.75, shoulder + 14 * s) +
      pt.line(`M${x + shoulderW * 0.75},${shoulder + 14 * s} l${18 * s},${-4 * s}`, 'ink', 3 * s) +
      pt.fill(`M${x + shoulderW * 0.75 + 16 * s},${shoulder + 6 * s} h${30 * s} q${-2 * s},${10 * s} ${-15 * s},${10 * s} q${-13 * s},0 ${-15 * s},${-10 * s} Z`, 'black') +
      pt.circle(x + shoulderW * 0.75 + 26 * s, shoulder + 2 * s, 5 * s, '#f1d79a') +
      pt.circle(x + shoulderW * 0.75 + 36 * s, shoulder - 2 * s, 4 * s, '#f1d79a');
  if (a === 'pour')
    g +=
      arm(...L, x - shoulderW * 0.2, shoulder + 30 * s) +
      arm(...R, x + shoulderW * 0.6, shoulder + 4 * s) +
      pt.fill(`M${x + shoulderW * 0.6 - 5 * s},${shoulder + 4 * s} h${10 * s} v${-22 * s} l${-2 * s},${-8 * s} h${-6 * s} l${-2 * s},${8 * s} Z`, 'glassG');
  // Neck, long hair behind the head, ears and the head.
  g += pt.rect(x - 6 * s, shoulder - 8 * s, 12 * s, 10 * s, dark(col(lk.skin), 0.08));
  if (lk.hairStyle === 'long' || lk.hairStyle === 'bob' || lk.hairStyle === 'braid') {
    const len = lk.hairStyle === 'long' ? 1.9 : lk.hairStyle === 'bob' ? 1.15 : 0.9;
    g += pt.fill(`M${fx - headR * 1.08},${headY - headR * 0.2} Q${fx - headR * 1.25},${headY + headR * len} ${fx - headR * 0.4},${headY + headR * len} L${fx + headR * 0.4},${headY + headR * len} Q${fx + headR * 1.25},${headY + headR * len} ${fx + headR * 1.08},${headY - headR * 0.2} Z`, lk.hair);
  }
  if (lk.hairStyle === 'braid') {
    for (let i = 0; i < 4; i++) g += pt.circle(fx + headR * 1.0, headY + headR * (0.5 + i * 0.42), headR * 0.24, lk.hair);
    g += pt.circle(fx + headR * 1.0, headY + headR * 2.2, headR * 0.16, 'red');
  }
  g += pt.circle(fx - headR * 0.98, headY + headR * 0.12, headR * 0.2, lk.skin) + pt.circle(fx + headR * 0.98, headY + headR * 0.12, headR * 0.2, lk.skin);
  g += pt.fill(`M${fx - headR},${headY} Q${fx - headR},${headY + headR * 1.12} ${fx},${headY + headR * 1.1} Q${fx + headR},${headY + headR * 1.12} ${fx + headR},${headY} Q${fx + headR},${headY - headR * 1.05} ${fx},${headY - headR * 1.05} Q${fx - headR},${headY - headR * 1.05} ${fx - headR},${headY} Z`, lk.skin);
  // The face: eyes (open with a shine, or happy curves), brows, rosy cheeks, nose and mouth.
  const ey = headY + headR * 0.12;
  const eyeX = headR * 0.4;
  const t = turn * headR * 0.14;
  for (const side of [-1, 1]) {
    const ex = fx + side * eyeX + t;
    if (pose.eyes === 'happy') g += pt.line(`M${ex - headR * 0.16},${ey + headR * 0.04} Q${ex},${ey - headR * 0.16} ${ex + headR * 0.16},${ey + headR * 0.04}`, 'ink', 2 * s);
    else g += `<ellipse cx="${ex}" cy="${ey}" rx="${headR * 0.14}" ry="${headR * 0.18}" fill="${p.ink}"/><circle cx="${ex + headR * 0.05}" cy="${ey - headR * 0.06}" r="${headR * 0.055}" fill="#ffffff"/>`;
    g += pt.line(`M${ex - headR * 0.18},${ey - headR * 0.32} Q${ex},${ey - headR * 0.4} ${ex + headR * 0.18},${ey - headR * 0.3}`, dark(col(lk.hair), 0.3), 1.8 * s);
    g += `<ellipse cx="${ex + side * headR * 0.08}" cy="${ey + headR * 0.38}" rx="${headR * 0.19}" ry="${headR * 0.19}" fill="${p.red}" opacity="0.55"/>`;
  }
  g += pt.line(`M${fx + t},${ey + headR * 0.14} q${headR * 0.1},${headR * 0.16} ${-headR * 0.05},${headR * 0.22}`, dark(col(lk.skin), 0.3), 1.6 * s);
  const my = ey + headR * 0.55;
  const mx = fx + t;
  if (lk.moustache) g += pt.fill(`M${mx - headR * 0.32},${my - headR * 0.04} Q${mx - headR * 0.15},${my - headR * 0.2} ${mx},${my - headR * 0.08} Q${mx + headR * 0.15},${my - headR * 0.2} ${mx + headR * 0.32},${my - headR * 0.04} Q${mx},${my + headR * 0.04} ${mx - headR * 0.32},${my - headR * 0.04} Z`, lk.hair);
  if (pose.mouth === 'laugh') g += `<path d="M${mx - headR * 0.24},${my} Q${mx},${my + headR * 0.42} ${mx + headR * 0.24},${my} Z" fill="#7a2f35"/><path d="M${mx - headR * 0.14},${my + headR * 0.14} Q${mx},${my + headR * 0.26} ${mx + headR * 0.14},${my + headR * 0.14}" fill="#e46a6f"/>`;
  else if (pose.mouth === 'talk') g += `<ellipse cx="${mx}" cy="${my + headR * 0.06}" rx="${headR * 0.12}" ry="${headR * 0.1}" fill="#7a2f35"/>`;
  else g += pt.line(`M${mx - headR * 0.2},${my} Q${mx},${my + headR * 0.2} ${mx + headR * 0.2},${my}`, '#7a3b3b', 1.8 * s);
  if (lk.glasses) for (const side of [-1, 1]) g += `<circle cx="${fx + side * eyeX + t}" cy="${ey}" r="${headR * 0.3}" fill="#ffffff" fill-opacity="0.18" stroke="${p.ink}" stroke-width="${1.6 * s}"/>`;
  // Hair on top, with a few ink strands.
  if (lk.hairStyle === 'curly') {
    for (const [dx, dy] of [[-0.8, -0.35], [-0.45, -0.8], [0, -0.95], [0.45, -0.8], [0.8, -0.35], [-0.2, -0.6], [0.25, -0.62]]) g += pt.circle(fx + dx * headR, headY + dy * headR, headR * 0.4, lk.hair);
  } else {
    const side = lk.hairStyle === 'bob' || lk.hairStyle === 'long' || lk.hairStyle === 'braid' ? 0.35 : 0.05;
    g += pt.fill(
      `M${fx - headR * 1.06},${headY + headR * side} Q${fx - headR * 1.12},${headY - headR * 1.25} ${fx},${headY - headR * 1.12} Q${fx + headR * 1.12},${headY - headR * 1.25} ${fx + headR * 1.06},${headY + headR * side} Q${fx + headR * 0.85},${headY - headR * 0.4} ${fx + headR * 0.3},${headY - headR * 0.5} Q${fx + turn * headR * 0.3},${headY - headR * 0.28} ${fx - headR * 0.3},${headY - headR * 0.52} Q${fx - headR * 0.85},${headY - headR * 0.42} ${fx - headR * 1.06},${headY + headR * side} Z`,
      lk.hair,
    );
    if (lk.hairStyle === 'bun') g += pt.circle(fx, headY - headR * 1.15, headR * 0.42, lk.hair);
    const strand = dark(col(lk.hair), 0.4);
    g += pt.line(`M${fx - headR * 0.15},${headY - headR * 1.05} Q${fx - headR * 0.75},${headY - headR * 0.95} ${fx - headR * 0.95},${headY - headR * 0.2}`, strand, 1.1 * s);
    g += pt.line(`M${fx + headR * 0.2},${headY - headR * 1.05} Q${fx + headR * 0.75},${headY - headR * 0.95} ${fx + headR * 0.92},${headY - headR * 0.25}`, strand, 1.1 * s);
    g += pt.line(`M${fx - headR * 0.05},${headY - headR * 0.92} Q${fx + headR * 0.25},${headY - headR * 0.75} ${fx + headR * 0.4},${headY - headR * 0.56}`, strand, 1 * s);
  }
  // Hats.
  if (lk.hat === 'straw')
    g +=
      pt.fill(`M${fx - headR * 1.7},${headY - headR * 0.62} Q${fx},${headY - headR * 0.95} ${fx + headR * 1.7},${headY - headR * 0.62} Q${fx},${headY - headR * 0.3} ${fx - headR * 1.7},${headY - headR * 0.62} Z`, '#e8c470') +
      pt.fill(`M${fx - headR * 0.85},${headY - headR * 0.72} Q${fx - headR * 0.85},${headY - headR * 1.7} ${fx},${headY - headR * 1.7} Q${fx + headR * 0.85},${headY - headR * 1.7} ${fx + headR * 0.85},${headY - headR * 0.72} Z`, '#f2d488') +
      pt.fill(`M${fx - headR * 0.85},${headY - headR * 0.9} h${headR * 1.7} v${headR * 0.2} h${-headR * 1.7} Z`, 'red') +
      rosette(pt, fx + headR * 0.55, headY - headR * 0.85, headR * 0.3, 'red');
  if (lk.hat === 'cap')
    g +=
      pt.fill(`M${fx - headR},${headY - headR * 0.35} Q${fx - headR},${headY - headR * 1.3} ${fx},${headY - headR * 1.25} Q${fx + headR},${headY - headR * 1.3} ${fx + headR},${headY - headR * 0.35} Z`, 'red') +
      pt.fill(`M${fx - headR * 0.2},${headY - headR * 0.42} q${headR},${-headR * 0.06} ${headR * 1.45},${headR * 0.14} q${-headR * 0.7},${headR * 0.16} ${-headR * 1.45},${headR * 0.06} Z`, dark(col('red'), 0.15));
  if (lk.hat === 'beret') g += pt.fill(`M${fx - headR * 1.15},${headY - headR * 0.6} Q${fx - headR * 0.6},${headY - headR * 1.5} ${fx + headR * 0.4},${headY - headR * 1.3} Q${fx + headR * 1.1},${headY - headR * 1.1} ${fx + headR * 0.9},${headY - headR * 0.6} Z`, 'black');
  if (lk.hat === 'scarf')
    g +=
      pt.fill(`M${fx - headR * 1.12},${headY + headR * 0.4} Q${fx - headR * 1.2},${headY - headR * 1.3} ${fx},${headY - headR * 1.28} Q${fx + headR * 1.2},${headY - headR * 1.3} ${fx + headR * 1.12},${headY + headR * 0.4} L${fx + headR * 0.9},${headY - headR * 0.4} Q${fx},${headY - headR * 0.7} ${fx - headR * 0.9},${headY - headR * 0.4} Z`, 'red') +
      rosette(pt, fx, headY - headR * 0.95, headR * 0.28, 'yellow') +
      rosette(pt, fx - headR * 0.6, headY - headR * 0.7, headR * 0.2, 'blue') +
      rosette(pt, fx + headR * 0.6, headY - headR * 0.7, headR * 0.2, 'blue');
  if (lk.hat === 'toque')
    g += pt.fill(
      `M${fx - headR * 0.82},${headY - headR * 0.68} L${fx - headR * 0.9},${headY - headR * 1.5} Q${fx - headR * 1.35},${headY - headR * 2.5} ${fx - headR * 0.35},${headY - headR * 2.3} Q${fx},${headY - headR * 2.85} ${fx + headR * 0.4},${headY - headR * 2.3} Q${fx + headR * 1.35},${headY - headR * 2.5} ${fx + headR * 0.9},${headY - headR * 1.5} L${fx + headR * 0.82},${headY - headR * 0.68} Z`,
      'white',
    );
  return g;
}

/** Mewa the seagull, the player's guide, with her feet at (x, y) and facing left, k times her usual size. */
export function mewa(pt: Painter, x: number, y: number, k: number): string {
  let g = pt.line(`M${x - 3 * k},${y} l1,${-8 * k} M${x + 5 * k},${y} l-1,${-8 * k}`, '#e8873a', 2 * k);
  g += pt.fill(`M${x - 16 * k},${y - 16 * k} Q${x - 14 * k},${y - 28 * k} ${x},${y - 26 * k} Q${x + 18 * k},${y - 24 * k} ${x + 26 * k},${y - 16 * k} Q${x + 10 * k},${y - 6 * k} ${x - 4 * k},${y - 7 * k} Q${x - 14 * k},${y - 8 * k} ${x - 16 * k},${y - 16 * k} Z`, 'white');
  g += pt.fill(`M${x - 6 * k},${y - 22 * k} Q${x + 12 * k},${y - 26 * k} ${x + 28 * k},${y - 15 * k} Q${x + 8 * k},${y - 10 * k} ${x - 6 * k},${y - 15 * k} Z`, '#b9c3cc');
  g += pt.fill(`M${x + 20 * k},${y - 17 * k} l${10 * k},${-1 * k} l${-5 * k},${5 * k} Z`, 'black');
  g += pt.circle(x - 14 * k, y - 29 * k, 8 * k, 'white');
  g += `<circle cx="${x - 17 * k}" cy="${y - 31 * k}" r="${1.7 * k}" fill="#2a2328"/><circle cx="${x - 16.5 * k}" cy="${y - 31.6 * k}" r="${0.6 * k}" fill="#fff"/>`;
  g += pt.fill(`M${x - 21 * k},${y - 29 * k} l${-10 * k},${1.5 * k} l${10 * k},${2.5 * k} Z`, 'yellow') + `<circle cx="${x - 27 * k}" cy="${y - 27.4 * k}" r="${1.2 * k}" fill="#d6392e"/>`;
  return g;
}
