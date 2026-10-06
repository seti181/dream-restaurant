// People in the sketchbook, seen from the front and turned a little left or right: guests, staff
// and Mewa the seagull. Each is drawn as SVG text with its feet (or seat) at a given point.

import { folkBand, rosette } from './motifs';
import type { Painter } from './painter';
import { dark } from './palette';

/** Little things people carry or wear that tell who they are. */
export type Extra = 'camera' | 'backpack' | 'scarf' | 'tie' | 'shirt' | 'badge' | 'earpiece' | 'lanyard' | 'notebook' | 'paint' | 'stain';

export interface Look {
  skin: string;
  hair: string;
  hairStyle: 'short' | 'bob' | 'bun' | 'braid' | 'curly' | 'long' | 'bald' | 'spiky';
  top: string;
  legs: string;
  hat?: 'straw' | 'toque' | 'beret' | 'cap' | 'scarf' | 'bucket' | 'flatcap' | 'headscarf';
  /** The colour of a cap, bucket hat, flat cap, headscarf or beret, when not the usual one. */
  hatColour?: string;
  /** Glasses, or dark sunglasses. */
  glasses?: boolean | 'dark';
  moustache?: boolean;
  apron?: string;
  pattern?: 'stripes' | 'flowers' | 'check' | 'buttons';
  extras?: Extra[];
  /** Tomek beams all the time; Adrian has a longer face and rabbit teeth. */
  face?: 'beaming' | 'adrian';
}

export interface Pose {
  /** Seated (shown from the waist up, behind a table), or standing. */
  sit?: boolean;
  /** Seated on a stool in the open, so the lap and legs show. */
  stool?: boolean;
  /** The face turned left (-1), front (0) or right (1). */
  turn?: number;
  arms?: 'rest' | 'wave' | 'tray' | 'glass' | 'fork' | 'eat' | 'menu' | 'cross' | 'swing' | 'pan' | 'panDown' | 'pour' | 'accordion';
  /** What's on a tray: plates and a glass, or nothing (walking back). */
  tray?: 'full' | 'empty';
  /** Sitting sideways: the crossed legs point the way they face (under the table), or away ('out'). */
  legs?: 'out';
  /** Seen from behind, walking away from us. */
  back?: boolean;
  /** A step of the walk: which foot is lifted. */
  walk?: 0 | 1;
  mouth?: 'smile' | 'laugh' | 'talk' | 'frown' | 'o';
  eyes?: 'open' | 'happy';
}

/** A person whose feet (or seat) are at (x, y), about `h` units tall standing. */
export function figure(pt: Painter, x: number, y: number, h: number, lk: Look, pose: Pose): string {
  if (pose.back) return backFigure(pt, x, y, h, lk, pose);
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
  // Sitting sideways on a chair (turned to the table), legs crossed: a rounded limb from one point to another.
  const sideways = pose.sit && pose.stool && turn !== 0;
  const legDir = pose.legs === 'out' ? -turn : turn;
  const limb = (x1: number, y1: number, x2: number, y2: number, w: number, colour: string) => {
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = (-(y2 - y1) / len) * w * 0.5;
    const ny = ((x2 - x1) / len) * w * 0.5;
    const r = w / 2;
    return pt.fill(`M${x1 + nx},${y1 + ny} L${x2 + nx},${y2 + ny} A${r},${r} 0 0 0 ${x2 - nx},${y2 - ny} L${x1 - nx},${y1 - ny} A${r},${r} 0 0 0 ${x1 + nx},${y1 + ny} Z`, colour);
  };
  /** A shoe seen from the side, its toe pointing the way the legs go. */
  const shoe = (ax: number, ay: number) =>
    pt.fill(`M${ax - legDir * 5 * s},${ay - 5 * s} L${ax + legDir * 11 * s},${ay - 3 * s} Q${ax + legDir * 17 * s},${ay + 1 * s} ${ax + legDir * 11 * s},${ay + 3 * s} L${ax - legDir * 6 * s},${ay + 3 * s} Z`, 'black');
  const farLeg = dark(col(lk.legs), 0.18);
  if (sideways) {
    // The far leg: thigh to the knee, shin straight down to the floor.
    const knee = { x: x + legDir * 30 * s, y: hip + 4 * s };
    const ankle = { x: x + legDir * 25 * s, y: hip + 42 * s };
    g += limb(x - legDir * 6 * s, hip + 2 * s, knee.x, knee.y, 15 * s, farLeg) + limb(knee.x, knee.y, ankle.x, ankle.y, 12 * s, farLeg) + shoe(ankle.x, ankle.y + 3 * s);
  }
  // Seated on a stool facing us: the shins hang down to the footrest.
  else if (pose.sit && pose.stool) {
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
    // Walking, one foot is lifted a little in turn.
    const lift = (side: number) => (pose.walk === undefined ? 0 : (pose.walk === 0) === (side < 0) ? 8 * s : 0);
    const left = y - lift(-1);
    const right = y - lift(1);
    g += pt.fill(`M${x - shoulderW * 0.34},${hip - 4 * s} L${x - shoulderW * 0.36},${left - 8 * s} L${x - 3 * s},${left - 8 * s} L${x - 2 * s},${hip - 4 * s} Z`, lk.legs);
    g += pt.fill(`M${x + 2 * s},${hip - 4 * s} L${x + 3 * s},${right - 8 * s} L${x + shoulderW * 0.36},${right - 8 * s} L${x + shoulderW * 0.34},${hip - 4 * s} Z`, lk.legs);
    g += pt.fill(`M${x - shoulderW * 0.4},${left} q0,${-10 * s} ${shoulderW * 0.38},${-9 * s} l0,${9 * s} Z`, 'black');
    g += pt.fill(`M${x + shoulderW * 0.02},${right} l0,${-9 * s} q${shoulderW * 0.38},${-1 * s} ${shoulderW * 0.38},${9 * s} Z`, 'black');
  }
  if (lk.extras?.includes('backpack')) g += pt.rect(x - shoulderW * 0.62, shoulder + 2 * s, shoulderW * 1.24, torsoH * 0.8, '#8a5534', 8 * s);
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
  // The lap: sideways, the near leg crossed over the far one; facing us, a short block.
  if (sideways) {
    const knee = { x: x + legDir * 33 * s, y: hip - 3 * s };
    const ankle = { x: x + legDir * 44 * s, y: hip + 28 * s };
    g += limb(x - legDir * 2 * s, hip, knee.x, knee.y, 16 * s, lk.legs) + limb(knee.x, knee.y, ankle.x, ankle.y, 12 * s, lk.legs) + shoe(ankle.x + legDir * 2 * s, ankle.y + 2 * s);
    g += pt.line(`M${knee.x - legDir * 6 * s},${knee.y - 5 * s} q${legDir * 4 * s},${3 * s} ${legDir * 3 * s},${8 * s}`, dark(col(lk.legs), 0.35), 1.1);
  } else if (pose.sit && pose.stool)
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
  for (const extra of lk.extras ?? []) g += extraOn(pt, extra, x, shoulder, torsoH, shoulderW, s);
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
  if (a === 'tray') {
    g += arm(...L, x - shoulderW * 0.55, hip - 6 * s) + arm(...R, x + shoulderW * 0.8, shoulder - 8 * s);
    g += pt.fill(`M${x + shoulderW * 0.2},${shoulder - 12 * s} h${shoulderW * 1.3} l${-4 * s},${5 * s} h${-shoulderW * 1.3 + 8 * s} Z`, 'steel');
    if (pose.tray !== 'empty')
      g +=
        pt.fill(`M${x + shoulderW * 0.45},${shoulder - 26 * s} h${11 * s} l${-2 * s},${14 * s} h${-7 * s} Z`, 'red') +
        pt.fill(`M${x + shoulderW * 0.85},${shoulder - 14 * s} q${10 * s},${-12 * s} ${22 * s},0 Z`, 'plate') +
        pt.circle(x + shoulderW * 0.85 + 11 * s, shoulder - 18 * s, 4 * s, 'yellow');
  }
  if (a === 'eat')
    g +=
      arm(...L, x - shoulderW * 0.42, tableY) +
      arm(...R, x + shoulderW * 0.3, tableY - 2 * s) +
      pt.line(`M${x + shoulderW * 0.3},${tableY - 2 * s} l${4 * s},${10 * s}`, '#9aa0a8', 2.2 * s);
  if (a === 'menu')
    g +=
      pt.rect(x - 16 * s, shoulder + 6 * s, 32 * s, 24 * s, '#fffaf0', 2 * s) +
      pt.line(`M${x - 10 * s},${shoulder + 13 * s} h${20 * s} M${x - 10 * s},${shoulder + 19 * s} h${16 * s} M${x - 10 * s},${shoulder + 25 * s} h${18 * s}`, 'red', 1.2 * s) +
      arm(...L, x - 14 * s, shoulder + 24 * s) +
      arm(...R, x + 14 * s, shoulder + 24 * s);
  if (a === 'accordion') {
    // Playing the accordion: the bellows open and close (walk 0 open, 1 squeezed).
    const half = (pose.walk === 1 ? 14 : 24) * s;
    const top = shoulder + 8 * s;
    const h = 34 * s;
    let bellows = `M${x - half + 8 * s},${top}`;
    const folds = 6;
    for (let k = 1; k <= folds; k++) bellows += ` L${x - half + 8 * s + ((2 * half - 16 * s) * k) / folds},${top + (k % 2 ? 4 * s : 0)}`;
    bellows += ` V${top + h} L${x - half + 8 * s},${top + h} Z`;
    g += pt.fill(bellows, '#f4ecd6');
    for (let k = 1; k < folds; k++) g += pt.line(`M${x - half + 8 * s + ((2 * half - 16 * s) * k) / folds},${top} v${h}`, dark('#f4ecd6', 0.3), 1);
    g += pt.rect(x - half - 6 * s, top - 4 * s, 16 * s, h + 8 * s, 'red', 3 * s) + pt.rect(x + half - 10 * s, top - 4 * s, 16 * s, h + 8 * s, 'red', 3 * s);
    g += [0, 1, 2].map((k) => `<circle cx="${x - half + 2 * s}" cy="${top + 6 * s + k * 10 * s}" r="${2 * s}" fill="#fffaf0"/>`).join('');
    g += arm(...L, x - half - 2 * s, top + h / 2) + arm(...R, x + half + 2 * s, top + h / 2);
  }
  if (a === 'cross') g += arm(...L, x + shoulderW * 0.22, shoulder + 22 * s) + arm(...R, x - shoulderW * 0.22, shoulder + 26 * s);
  if (a === 'swing') {
    const k = pose.walk === 1 ? -1 : 1;
    g += arm(...L, x - shoulderW * 0.5, hip - 4 * s - k * 5 * s) + arm(...R, x + shoulderW * 0.5, hip - 4 * s + k * 5 * s);
  }
  if (a === 'panDown')
    g +=
      arm(...L, x - shoulderW * 0.5, shoulder + 26 * s) +
      arm(...R, x + shoulderW * 0.75, shoulder + 20 * s) +
      pt.line(`M${x + shoulderW * 0.75},${shoulder + 20 * s} l${18 * s},${2 * s}`, 'ink', 3 * s) +
      pt.fill(`M${x + shoulderW * 0.75 + 16 * s},${shoulder + 16 * s} h${30 * s} q${-2 * s},${10 * s} ${-15 * s},${10 * s} q${-13 * s},0 ${-15 * s},${-10 * s} Z`, 'black') +
      pt.circle(x + shoulderW * 0.75 + 30 * s, shoulder + 14 * s, 5 * s, '#f1d79a');
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
  // Long hair behind the head, the neck, the ears and the head. Long hair falls in two locks past the
  // shoulders, with the neck and chest showing between them (one block under the chin read as a beard).
  if (lk.hairStyle === 'long' || lk.hairStyle === 'bob' || lk.hairStyle === 'braid') {
    const len = lk.hairStyle === 'long' ? 1.9 : lk.hairStyle === 'bob' ? 1.15 : 0.9;
    const gap = lk.hairStyle === 'long' ? 0.62 : 0.4;
    g += pt.fill(
      `M${fx - headR * 1.08},${headY - headR * 0.2} Q${fx - headR * 1.25},${headY + headR * len} ${fx - headR * 0.8},${headY + headR * len} L${fx - headR * gap},${headY + headR * len} L${fx - headR * gap},${headY + headR * 0.9} L${fx + headR * gap},${headY + headR * 0.9} L${fx + headR * gap},${headY + headR * len} L${fx + headR * 0.8},${headY + headR * len} Q${fx + headR * 1.25},${headY + headR * len} ${fx + headR * 1.08},${headY - headR * 0.2} Z`,
      lk.hair,
    );
  }
  g += pt.rect(x - 6 * s, shoulder - 8 * s, 12 * s, 10 * s, dark(col(lk.skin), 0.08));
  if (lk.hairStyle === 'braid') {
    for (let i = 0; i < 4; i++) g += pt.circle(fx + headR * 1.0, headY + headR * (0.5 + i * 0.42), headR * 0.24, lk.hair);
    g += pt.circle(fx + headR * 1.0, headY + headR * 2.2, headR * 0.16, 'red');
  }
  g += pt.circle(fx - headR * 0.98, headY + headR * 0.12, headR * 0.2, lk.skin) + pt.circle(fx + headR * 0.98, headY + headR * 0.12, headR * 0.2, lk.skin);
  const chin = lk.face === 'adrian' ? 1.3 : 1.1;
  g += pt.fill(`M${fx - headR},${headY} Q${fx - headR},${headY + headR * (chin + 0.02)} ${fx},${headY + headR * chin} Q${fx + headR},${headY + headR * (chin + 0.02)} ${fx + headR},${headY} Q${fx + headR},${headY - headR * 1.05} ${fx},${headY - headR * 1.05} Q${fx - headR},${headY - headR * 1.05} ${fx - headR},${headY} Z`, lk.skin);
  const eyes = lk.face === 'beaming' ? 'happy' : pose.eyes;
  const mouth = lk.face === 'beaming' ? 'laugh' : pose.mouth;
  // The face: eyes (open with a shine, or happy curves), brows, rosy cheeks, nose and mouth.
  const ey = headY + headR * 0.12;
  const eyeX = headR * 0.4;
  const t = turn * headR * 0.14;
  for (const side of [-1, 1]) {
    const ex = fx + side * eyeX + t;
    if (eyes === 'happy') g += pt.line(`M${ex - headR * 0.16},${ey + headR * 0.04} Q${ex},${ey - headR * 0.16} ${ex + headR * 0.16},${ey + headR * 0.04}`, 'ink', 2 * s);
    else g += `<ellipse cx="${ex}" cy="${ey}" rx="${headR * 0.14}" ry="${headR * 0.18}" fill="${p.ink}"/><circle cx="${ex + headR * 0.05}" cy="${ey - headR * 0.06}" r="${headR * 0.055}" fill="#ffffff"/>`;
    g += pt.line(`M${ex - headR * 0.18},${ey - headR * 0.32} Q${ex},${ey - headR * 0.4} ${ex + headR * 0.18},${ey - headR * 0.3}`, dark(col(lk.hair), 0.3), 1.8 * s);
    g += `<ellipse cx="${ex + side * headR * 0.08}" cy="${ey + headR * 0.38}" rx="${headR * 0.19}" ry="${headR * 0.19}" fill="${p.red}" opacity="0.55"/>`;
  }
  g += pt.line(`M${fx + t},${ey + headR * 0.14} q${headR * 0.1},${headR * 0.16} ${-headR * 0.05},${headR * 0.22}`, dark(col(lk.skin), 0.3), 1.6 * s);
  const my = ey + headR * 0.55;
  const mx = fx + t;
  if (lk.moustache) g += pt.fill(`M${mx - headR * 0.32},${my - headR * 0.04} Q${mx - headR * 0.15},${my - headR * 0.2} ${mx},${my - headR * 0.08} Q${mx + headR * 0.15},${my - headR * 0.2} ${mx + headR * 0.32},${my - headR * 0.04} Q${mx},${my + headR * 0.04} ${mx - headR * 0.32},${my - headR * 0.04} Z`, lk.hair);
  if (mouth === 'laugh') g += `<path d="M${mx - headR * 0.24},${my} Q${mx},${my + headR * 0.42} ${mx + headR * 0.24},${my} Z" fill="#7a2f35"/><path d="M${mx - headR * 0.14},${my + headR * 0.14} Q${mx},${my + headR * 0.26} ${mx + headR * 0.14},${my + headR * 0.14}" fill="#e46a6f"/>`;
  else if (mouth === 'talk') g += `<ellipse cx="${mx}" cy="${my + headR * 0.06}" rx="${headR * 0.12}" ry="${headR * 0.1}" fill="#7a2f35"/>`;
  else if (mouth === 'o') g += `<ellipse cx="${mx}" cy="${my + headR * 0.08}" rx="${headR * 0.09}" ry="${headR * 0.13}" fill="#7a2f35"/>`;
  else if (mouth === 'frown') g += pt.line(`M${mx - headR * 0.2},${my + headR * 0.12} Q${mx},${my - headR * 0.06} ${mx + headR * 0.2},${my + headR * 0.12}`, '#7a3b3b', 1.8 * s);
  else g += pt.line(`M${mx - headR * 0.2},${my} Q${mx},${my + headR * 0.2} ${mx + headR * 0.2},${my}`, '#7a3b3b', 1.8 * s);
  if (lk.face === 'adrian') g += `<rect x="${mx - headR * 0.12}" y="${my + headR * 0.02}" width="${headR * 0.24}" height="${headR * 0.16}" fill="#ffffff" stroke="${p.ink}" stroke-width="${0.8 * s}"/>`;
  if (lk.glasses === 'dark') g += `<path d="M${fx - eyeX * 1.9 + t},${ey - headR * 0.2} h${eyeX * 3.8} l${-headR * 0.1},${headR * 0.32} h${-eyeX * 1.4} l${-headR * 0.1},${-headR * 0.2} l${-headR * 0.1},${headR * 0.2} h${-eyeX * 1.4} Z" fill="#1f1c23"/>`;
  else if (lk.glasses) for (const side of [-1, 1]) g += `<circle cx="${fx + side * eyeX + t}" cy="${ey}" r="${headR * 0.3}" fill="#ffffff" fill-opacity="0.18" stroke="${p.ink}" stroke-width="${1.6 * s}"/>`;
  if (lk.extras?.includes('earpiece')) g += pt.line(`M${fx + headR * 0.98},${headY + headR * 0.2} q${headR * 0.25},${headR * 0.5} 0,${headR * 1.1}`, '#1f1c23', 1.2 * s);
  // Hair on top, with a few ink strands.
  if (lk.hairStyle === 'bald') {
    for (const side of [-1, 1]) g += pt.fill(`M${fx + side * headR * 1.02},${headY + headR * 0.1} q${-side * headR * 0.1},${-headR * 0.45} ${-side * headR * 0.28},${-headR * 0.55} q${-side * headR * 0.02},${headR * 0.35} ${side * headR * 0.06},${headR * 0.62} Z`, lk.hair);
    g += `<ellipse cx="${fx - headR * 0.35}" cy="${headY - headR * 0.7}" rx="${headR * 0.22}" ry="${headR * 0.12}" fill="#ffffff" opacity="0.45"/>`;
  } else if (lk.hairStyle === 'spiky') {
    let spikes = `M${fx - headR * 1.06},${headY - headR * 0.1}`;
    // A messy tuft rather than a crown: short, uneven spikes.
    for (let i = 0; i <= 8; i++) spikes += ` L${fx - headR * 1.0 + i * headR * 0.25},${headY - headR * (i % 2 ? 1.02 + ((i * 5) % 3) * 0.04 : 1.18 + ((i * 7) % 3) * 0.05)}`;
    spikes += ` L${fx + headR * 1.06},${headY - headR * 0.1} Q${fx},${headY - headR * 0.55} ${fx - headR * 1.06},${headY - headR * 0.1} Z`;
    g += pt.fill(spikes, lk.hair);
  } else if (lk.hairStyle === 'curly') {
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
  const hat = lk.hatColour ?? (lk.hat === 'beret' ? 'black' : lk.hat === 'bucket' ? '#d8c79a' : lk.hat === 'flatcap' ? '#6b6470' : 'red');
  if (lk.hat === 'cap')
    g +=
      pt.fill(`M${fx - headR},${headY - headR * 0.35} Q${fx - headR},${headY - headR * 1.3} ${fx},${headY - headR * 1.25} Q${fx + headR},${headY - headR * 1.3} ${fx + headR},${headY - headR * 0.35} Z`, hat) +
      pt.fill(`M${fx - headR * 0.2},${headY - headR * 0.42} q${headR},${-headR * 0.06} ${headR * 1.45},${headR * 0.14} q${-headR * 0.7},${headR * 0.16} ${-headR * 1.45},${headR * 0.06} Z`, dark(col(hat), 0.15));
  if (lk.hat === 'beret') g += pt.fill(`M${fx - headR * 1.15},${headY - headR * 0.6} Q${fx - headR * 0.6},${headY - headR * 1.5} ${fx + headR * 0.4},${headY - headR * 1.3} Q${fx + headR * 1.1},${headY - headR * 1.1} ${fx + headR * 0.9},${headY - headR * 0.6} Z`, hat);
  if (lk.hat === 'bucket')
    g +=
      pt.fill(`M${fx - headR * 0.85},${headY - headR * 0.55} Q${fx - headR * 0.8},${headY - headR * 1.45} ${fx},${headY - headR * 1.42} Q${fx + headR * 0.8},${headY - headR * 1.45} ${fx + headR * 0.85},${headY - headR * 0.55} Z`, hat) +
      pt.fill(`M${fx - headR * 1.3},${headY - headR * 0.3} Q${fx},${headY - headR * 0.75} ${fx + headR * 1.3},${headY - headR * 0.3} L${fx + headR * 0.85},${headY - headR * 0.58} Q${fx},${headY - headR * 0.75} ${fx - headR * 0.85},${headY - headR * 0.58} Z`, dark(col(hat), 0.1));
  if (lk.hat === 'flatcap')
    g +=
      pt.fill(`M${fx - headR * 1.02},${headY - headR * 0.45} Q${fx - headR * 0.9},${headY - headR * 1.3} ${fx + headR * 0.1},${headY - headR * 1.2} Q${fx + headR * 1.05},${headY - headR * 1.1} ${fx + headR * 1.02},${headY - headR * 0.45} Z`, hat) +
      pt.fill(`M${fx - headR * 0.1},${headY - headR * 0.5} q${headR * 0.8},${-headR * 0.1} ${headR * 1.3},${headR * 0.08} q${-headR * 0.6},${headR * 0.14} ${-headR * 1.3},${headR * 0.02} Z`, dark(col(hat), 0.2));
  if (lk.hat === 'headscarf')
    g += pt.fill(`M${fx - headR * 1.12},${headY + headR * 0.4} Q${fx - headR * 1.2},${headY - headR * 1.3} ${fx},${headY - headR * 1.28} Q${fx + headR * 1.2},${headY - headR * 1.3} ${fx + headR * 1.12},${headY + headR * 0.4} L${fx + headR * 0.9},${headY - headR * 0.4} Q${fx},${headY - headR * 0.7} ${fx - headR * 0.9},${headY - headR * 0.4} Z`, hat);
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

/** A person walking away from us, seen from behind: the back of the head, the hair, a backpack, an apron's bow. Feet at (x, y). */
function backFigure(pt: Painter, x: number, y: number, h: number, lk: Look, pose: Pose): string {
  const col = (c: string) => pt.colour(c);
  const s = h / 150;
  const headR = 19 * s;
  const shoulderW = 46 * s;
  const torsoH = 46 * s;
  const hip = y - 52 * s;
  const shoulder = hip - torsoH;
  const headY = shoulder - headR * 1.05;
  let g = pt.shadow(x, y - 1, shoulderW * 0.85, 6 * s);
  // Legs and the heels of the shoes, one foot lifted in turn.
  const lift = (side: number) => (pose.walk === undefined ? 0 : (pose.walk === 0) === (side < 0) ? 8 * s : 0);
  const left = y - lift(-1);
  const right = y - lift(1);
  g += pt.fill(`M${x - shoulderW * 0.34},${hip - 4 * s} L${x - shoulderW * 0.36},${left - 8 * s} L${x - 3 * s},${left - 8 * s} L${x - 2 * s},${hip - 4 * s} Z`, lk.legs);
  g += pt.fill(`M${x + 2 * s},${hip - 4 * s} L${x + 3 * s},${right - 8 * s} L${x + shoulderW * 0.36},${right - 8 * s} L${x + shoulderW * 0.34},${hip - 4 * s} Z`, lk.legs);
  g += pt.rect(x - shoulderW * 0.37, left - 9 * s, shoulderW * 0.34, 9 * s, 'black', 3 * s) + pt.rect(x + shoulderW * 0.03, right - 9 * s, shoulderW * 0.34, 9 * s, 'black', 3 * s);
  // The back, with its stripes or check, and shade down one side.
  const torso = `M${x - shoulderW / 2},${shoulder + 10 * s} Q${x - shoulderW / 2},${shoulder} ${x - shoulderW * 0.3},${shoulder} L${x + shoulderW * 0.3},${shoulder} Q${x + shoulderW / 2},${shoulder} ${x + shoulderW / 2},${shoulder + 10 * s} L${x + shoulderW * 0.46},${hip} L${x - shoulderW * 0.46},${hip} Z`;
  g += pt.fill(torso, lk.top);
  let pattern = '';
  if (lk.pattern === 'stripes') for (let i = 1; i < 5; i++) pattern += `<rect x="${x - shoulderW}" y="${shoulder + i * torsoH * 0.2}" width="${shoulderW * 2}" height="${3.2 * s}" fill="${pt.p.white}" opacity="0.85"/>`;
  if (lk.pattern === 'check')
    for (let i = 0; i < 6; i++)
      pattern += `<rect x="${x - shoulderW / 2 + i * shoulderW * 0.2}" y="${shoulder}" width="${2.4 * s}" height="${torsoH}" fill="${dark(col(lk.top), 0.3)}" opacity="0.5"/><rect x="${x - shoulderW / 2}" y="${shoulder + i * torsoH * 0.2}" width="${shoulderW}" height="${2.4 * s}" fill="${dark(col(lk.top), 0.3)}" opacity="0.5"/>`;
  pattern += `<rect x="${x - shoulderW}" y="${shoulder - 2}" width="${shoulderW * 0.82}" height="${torsoH + 4}" fill="${dark(col(lk.top), 0.35)}" opacity="0.22"/>`;
  pattern += pt.line(`M${x},${shoulder + 6 * s} L${x},${hip - 4 * s}`, dark(col(lk.top), 0.3), 1);
  const clip = pt.id('back');
  g += `<clipPath id="${clip}"><path d="${torso}"/></clipPath><g clip-path="url(#${clip})">${pattern}</g>`;
  // An apron is tied in a bow at the back; a backpack hangs on it; a scarf wraps the neck.
  if (lk.apron)
    g +=
      pt.line(`M${x - shoulderW * 0.46},${hip - 12 * s} L${x + shoulderW * 0.46},${hip - 12 * s}`, lk.apron, 3 * s) +
      pt.fill(`M${x},${hip - 12 * s} q${-12 * s},${-8 * s} ${-12 * s},0 q0,${8 * s} ${12 * s},0 q${12 * s},${-8 * s} ${12 * s},0 q0,${8 * s} ${-12 * s},0 Z`, lk.apron) +
      pt.line(`M${x - 2 * s},${hip - 10 * s} l${-5 * s},${14 * s} M${x + 2 * s},${hip - 10 * s} l${5 * s},${14 * s}`, lk.apron, 2.4 * s);
  if (lk.extras?.includes('backpack')) g += pt.rect(x - shoulderW * 0.34, shoulder + 6 * s, shoulderW * 0.68, torsoH * 0.72, '#8a5534', 8 * s) + pt.rect(x - shoulderW * 0.24, shoulder + torsoH * 0.42, shoulderW * 0.48, torsoH * 0.26, '#a8724a', 5 * s);
  if (lk.extras?.includes('scarf')) g += pt.fill(`M${x - 14 * s},${shoulder - 3 * s} Q${x},${shoulder + 6 * s} ${x + 14 * s},${shoulder - 3 * s} L${x + 13 * s},${shoulder + 4 * s} Q${x},${shoulder + 12 * s} ${x - 13 * s},${shoulder + 4 * s} Z`, 'red');
  // Arms swinging, hands at the sides; a waiter carries the tray low at one side.
  const k = pose.walk === 1 ? -1 : 1;
  const arm = (x1: number, y1: number, x2: number, y2: number) => {
    const w = 10 * s;
    const len = Math.hypot(x2 - x1, y2 - y1) || 1;
    const nx = (-(y2 - y1) / len) * w * 0.5;
    const ny = ((x2 - x1) / len) * w * 0.5;
    const r = w / 2;
    return pt.fill(`M${x1 + nx},${y1 + ny} L${x2 + nx},${y2 + ny} A${r},${r} 0 0 0 ${x2 - nx},${y2 - ny} L${x1 - nx},${y1 - ny} A${r},${r} 0 0 0 ${x1 + nx},${y1 + ny} Z`, lk.top) + pt.circle(x2, y2, 6 * s, lk.skin);
  };
  g += arm(x - shoulderW * 0.48, shoulder + 8 * s, x - shoulderW * 0.52, hip - 4 * s + k * 5 * s);
  g += arm(x + shoulderW * 0.48, shoulder + 8 * s, x + shoulderW * 0.52, hip - 4 * s - k * 5 * s);
  if (pose.arms === 'tray') g += pt.fill(`M${x + shoulderW * 0.42},${hip - 16 * s} l${4 * s},${30 * s} l${5 * s},0 l${-4 * s},${-30 * s} Z`, 'steel');
  // The neck, the ears and the back of the head, and the hair over it.
  g += pt.rect(x - 6 * s, shoulder - 8 * s, 12 * s, 10 * s, dark(col(lk.skin), 0.12));
  g += pt.circle(x - headR * 0.98, headY + headR * 0.12, headR * 0.2, lk.skin) + pt.circle(x + headR * 0.98, headY + headR * 0.12, headR * 0.2, lk.skin);
  const head = `M${x - headR},${headY} Q${x - headR},${headY + headR * 1.12} ${x},${headY + headR * 1.1} Q${x + headR},${headY + headR * 1.12} ${x + headR},${headY} Q${x + headR},${headY - headR * 1.05} ${x},${headY - headR * 1.05} Q${x - headR},${headY - headR * 1.05} ${x - headR},${headY} Z`;
  g += pt.fill(head, lk.skin);
  const strand = dark(col(lk.hair), 0.4);
  if (lk.hairStyle === 'bald') {
    g += pt.fill(`M${x - headR * 1.0},${headY + headR * 0.1} Q${x},${headY + headR * 0.75} ${x + headR * 1.0},${headY + headR * 0.1} Q${x + headR * 0.95},${headY + headR * 0.75} ${x},${headY + headR * 0.95} Q${x - headR * 0.95},${headY + headR * 0.75} ${x - headR * 1.0},${headY + headR * 0.1} Z`, lk.hair);
  } else if (lk.hairStyle === 'curly') {
    for (const [dx, dy] of [[-0.75, -0.5], [-0.35, -0.9], [0.1, -0.95], [0.55, -0.8], [0.85, -0.35], [-0.8, 0.15], [0.8, 0.2], [-0.35, -0.2], [0.25, -0.3], [-0.35, 0.45], [0.35, 0.5], [0, 0.65]]) g += pt.circle(x + dx * headR, headY + dy * headR, headR * 0.42, lk.hair);
  } else {
    // Hair covers the back of the head; longer styles hang down over the neck.
    const len = lk.hairStyle === 'long' ? 2.0 : lk.hairStyle === 'bob' ? 1.2 : lk.hairStyle === 'braid' ? 1.0 : 0.85;
    g += pt.fill(
      `M${x - headR * 1.06},${headY + headR * 0.1} Q${x - headR * 1.15},${headY - headR * 1.2} ${x},${headY - headR * 1.12} Q${x + headR * 1.15},${headY - headR * 1.2} ${x + headR * 1.06},${headY + headR * 0.1} Q${x + headR * 1.1},${headY + headR * len} ${x + headR * 0.5},${headY + headR * len} L${x - headR * 0.5},${headY + headR * len} Q${x - headR * 1.1},${headY + headR * len} ${x - headR * 1.06},${headY + headR * 0.1} Z`,
      lk.hair,
    );
    g += pt.line(`M${x - headR * 0.4},${headY - headR * 0.9} Q${x - headR * 0.55},${headY} ${x - headR * 0.35},${headY + headR * (len - 0.1)} M${x + headR * 0.35},${headY - headR * 0.9} Q${x + headR * 0.55},${headY} ${x + headR * 0.4},${headY + headR * (len - 0.1)}`, strand, 1.1 * s);
    if (lk.hairStyle === 'bun') g += pt.circle(x, headY - headR * 0.75, headR * 0.45, lk.hair);
    if (lk.hairStyle === 'braid') {
      for (let i = 0; i < 4; i++) g += pt.circle(x, headY + headR * (1.0 + i * 0.42), headR * 0.24, lk.hair);
      g += pt.circle(x, headY + headR * 2.7, headR * 0.16, 'red');
    }
    if (lk.hairStyle === 'spiky') for (let i = 0; i <= 6; i++) g += pt.fill(`M${x - headR * 0.8 + i * headR * 0.27},${headY - headR * 0.95} l${headR * 0.1},${-headR * 0.25} l${headR * 0.12},${headR * 0.25} Z`, lk.hair);
  }
  // Hats, seen from behind.
  const hat = lk.hatColour ?? (lk.hat === 'beret' ? 'black' : lk.hat === 'bucket' ? '#d8c79a' : lk.hat === 'flatcap' ? '#6b6470' : 'red');
  if (lk.hat === 'straw')
    g +=
      pt.fill(`M${x - headR * 1.7},${headY - headR * 0.62} Q${x},${headY - headR * 0.95} ${x + headR * 1.7},${headY - headR * 0.62} Q${x},${headY - headR * 0.3} ${x - headR * 1.7},${headY - headR * 0.62} Z`, '#e8c470') +
      pt.fill(`M${x - headR * 0.85},${headY - headR * 0.72} Q${x - headR * 0.85},${headY - headR * 1.7} ${x},${headY - headR * 1.7} Q${x + headR * 0.85},${headY - headR * 1.7} ${x + headR * 0.85},${headY - headR * 0.72} Z`, '#f2d488') +
      pt.fill(`M${x - headR * 0.85},${headY - headR * 0.9} h${headR * 1.7} v${headR * 0.2} h${-headR * 1.7} Z`, 'red');
  if (lk.hat === 'cap') g += pt.fill(`M${x - headR},${headY - headR * 0.3} Q${x - headR},${headY - headR * 1.3} ${x},${headY - headR * 1.25} Q${x + headR},${headY - headR * 1.3} ${x + headR},${headY - headR * 0.3} Z`, hat) + `<rect x="${x - headR * 0.3}" y="${headY - headR * 0.42}" width="${headR * 0.6}" height="${headR * 0.14}" fill="${pt.p.ink}" opacity="0.5"/>`;
  if (lk.hat === 'beret') g += pt.fill(`M${x - headR * 1.15},${headY - headR * 0.55} Q${x - headR * 0.5},${headY - headR * 1.5} ${x + headR * 0.5},${headY - headR * 1.35} Q${x + headR * 1.15},${headY - headR * 1.1} ${x + headR * 1.0},${headY - headR * 0.55} Z`, hat);
  if (lk.hat === 'bucket')
    g +=
      pt.fill(`M${x - headR * 0.85},${headY - headR * 0.55} Q${x - headR * 0.8},${headY - headR * 1.45} ${x},${headY - headR * 1.42} Q${x + headR * 0.8},${headY - headR * 1.45} ${x + headR * 0.85},${headY - headR * 0.55} Z`, hat) +
      pt.fill(`M${x - headR * 1.3},${headY - headR * 0.3} Q${x},${headY - headR * 0.75} ${x + headR * 1.3},${headY - headR * 0.3} L${x + headR * 0.85},${headY - headR * 0.58} Q${x},${headY - headR * 0.75} ${x - headR * 0.85},${headY - headR * 0.58} Z`, dark(col(hat), 0.1));
  if (lk.hat === 'flatcap') g += pt.fill(`M${x - headR * 1.02},${headY - headR * 0.4} Q${x - headR * 0.95},${headY - headR * 1.3} ${x},${headY - headR * 1.22} Q${x + headR * 0.95},${headY - headR * 1.3} ${x + headR * 1.02},${headY - headR * 0.4} Z`, hat);
  if (lk.hat === 'scarf' || lk.hat === 'headscarf') {
    const cloth = lk.hat === 'scarf' ? 'red' : hat;
    g +=
      pt.fill(`M${x - headR * 1.12},${headY + headR * 0.5} Q${x - headR * 1.2},${headY - headR * 1.3} ${x},${headY - headR * 1.28} Q${x + headR * 1.2},${headY - headR * 1.3} ${x + headR * 1.12},${headY + headR * 0.5} Q${x},${headY + headR * 1.0} ${x - headR * 1.12},${headY + headR * 0.5} Z`, cloth) +
      pt.fill(`M${x - 3 * s},${headY + headR * 0.8} l${-6 * s},${12 * s} l${7 * s},${-2 * s} Z M${x + 3 * s},${headY + headR * 0.8} l${6 * s},${12 * s} l${-7 * s},${-2 * s} Z`, cloth);
  }
  if (lk.hat === 'toque')
    g += pt.fill(
      `M${x - headR * 0.82},${headY - headR * 0.68} L${x - headR * 0.9},${headY - headR * 1.5} Q${x - headR * 1.35},${headY - headR * 2.5} ${x - headR * 0.35},${headY - headR * 2.3} Q${x},${headY - headR * 2.85} ${x + headR * 0.4},${headY - headR * 2.3} Q${x + headR * 1.35},${headY - headR * 2.5} ${x + headR * 0.9},${headY - headR * 1.5} L${x + headR * 0.82},${headY - headR * 0.68} Z`,
      'white',
    );
  return g;
}

/** One of the little things a person carries or wears, drawn over the clothes. */
function extraOn(pt: Painter, extra: Extra, x: number, shoulder: number, torsoH: number, shoulderW: number, s: number): string {
  switch (extra) {
    case 'camera':
      return (
        pt.line(`M${x - shoulderW * 0.3},${shoulder + 1 * s} L${x - 6 * s},${shoulder + 18 * s} M${x + shoulderW * 0.3},${shoulder + 1 * s} L${x + 6 * s},${shoulder + 18 * s}`, 'ink', 1.4 * s) +
        pt.rect(x - 9 * s, shoulder + 16 * s, 18 * s, 12 * s, '#2a2328', 2 * s) +
        `<circle cx="${x}" cy="${shoulder + 22 * s}" r="${3.6 * s}" fill="#9cc3d6" stroke="#fffaf0" stroke-width="${0.8 * s}"/>`
      );
    case 'backpack':
      return pt.line(`M${x - shoulderW * 0.3},${shoulder + 1 * s} L${x - shoulderW * 0.26},${shoulder + torsoH * 0.8} M${x + shoulderW * 0.3},${shoulder + 1 * s} L${x + shoulderW * 0.26},${shoulder + torsoH * 0.8}`, '#6e4128', 3.2 * s);
    case 'scarf':
      return (
        pt.fill(`M${x - 14 * s},${shoulder - 3 * s} Q${x},${shoulder + 8 * s} ${x + 14 * s},${shoulder - 3 * s} L${x + 13 * s},${shoulder + 4 * s} Q${x},${shoulder + 14 * s} ${x - 13 * s},${shoulder + 4 * s} Z`, 'red') +
        pt.fill(`M${x + 4 * s},${shoulder + 6 * s} l${3 * s},${22 * s} l${7 * s},${-1 * s} l${-3 * s},${-22 * s} Z`, 'red')
      );
    case 'tie':
      return pt.fill(`M${x - 2.5 * s},${shoulder + 4 * s} h${5 * s} l${2 * s},${22 * s} l${-4.5 * s},${5 * s} l${-4.5 * s},${-5 * s} Z`, '#2f4a6b');
    case 'shirt':
      return pt.fill(`M${x - 9 * s},${shoulder} L${x},${shoulder + 16 * s} L${x + 9 * s},${shoulder} Z`, 'white') + pt.fill(`M${x - 2 * s},${shoulder + 5 * s} h${4 * s} l${1.5 * s},${16 * s} l${-3.5 * s},${4 * s} l${-3.5 * s},${-4 * s} Z`, '#8a2f35');
    case 'badge':
      return `<circle cx="${x - shoulderW * 0.25}" cy="${shoulder + 12 * s}" r="${3.4 * s}" fill="#fffaf0" stroke="#c4574b" stroke-width="${1.6 * s}"/>`;
    case 'lanyard':
      return pt.line(`M${x - 7 * s},${shoulder} L${x},${shoulder + 20 * s} L${x + 7 * s},${shoulder}`, 'blue', 1.4 * s) + pt.rect(x - 5 * s, shoulder + 19 * s, 10 * s, 13 * s, 'white', 1.5 * s);
    case 'notebook':
      return pt.rect(x + shoulderW * 0.05, shoulder + 14 * s, 14 * s, 18 * s, '#2a2328', 1.5 * s) + pt.line(`M${x + shoulderW * 0.05 + 3 * s},${shoulder + 18 * s} h${8 * s}`, 'white', 1 * s);
    case 'paint':
      return [['red', -0.25, 0.3], ['blue', 0.2, 0.5], ['green', -0.05, 0.72], ['yellow', 0.3, 0.2]].map(([c, dx, dy]) => `<circle cx="${x + Number(dx) * shoulderW}" cy="${shoulder + Number(dy) * torsoH}" r="${2.6 * s}" fill="${pt.colour(String(c))}"/>`).join('');
    case 'stain':
      return `<ellipse cx="${x + shoulderW * 0.18}" cy="${shoulder + torsoH * 0.55}" rx="${5 * s}" ry="${4 * s}" fill="#d56a8a" opacity="0.75"/>`;
    case 'earpiece':
      return '';
  }
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
