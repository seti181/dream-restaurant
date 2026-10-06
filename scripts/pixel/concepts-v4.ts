// Concept art, round 4: three modern art directions for the whole game (project.md section 9.4).
// The same restaurant, street, people and Menu tab, drawn three ways as SVG and CSS (which the
// game may use at runtime): a storybook painting, a toy-box diorama and a modern flat illustration.
// Run with `npx tsx scripts/pixel/concepts-v4.ts`, then
// `node scripts/pixel/shoot.mjs art/concepts/v4/html art/concepts/v4` for the PNGs.

import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = 'art/concepts/v4/html';
const W = 1364;
const H = 603;

// ---------- Colour helpers ----------

function rgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex([r, g, b]: number[]): string {
  return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}
/** Mixes two colours: t = 0 gives a, 1 gives b. */
function mix(a: string, b: string, t: number): string {
  const x = rgb(a);
  const y = rgb(b);
  return toHex(x.map((v, i) => v + (y[i] - v) * t));
}
const darker = (c: string, t: number) => mix(c, '#1d1420', t);
const lighter = (c: string, t: number) => mix(c, '#ffffff', t);

// ---------- Isometric geometry ----------

const U = 44;
const OX = 625;
const OY = 202;
type Pt = [number, number];
const P = (x: number, y: number, z = 0): Pt => [OX + (x - y) * U * 0.866, OY + (x + y) * U * 0.5 - z * U];
const pts = (list: Pt[]) => list.map(([a, b]) => `${a.toFixed(1)},${b.toFixed(1)}`).join(' ');

/** The room: x runs to the right and forward, y to the left and forward, z up. */
const RW = 10;
const RD = 7;
const WALL = 4;

interface Style {
  id: string;
  title: string;
  font: string;
  headingFont: string;
  pal: Record<string, string>;
  /** An outline colour and width for everything, or none. */
  line: { color: string; width: number } | null;
  /** Shading of the three faces of a box. */
  shade: (c: string, face: 'top' | 'left' | 'right') => string;
  defs: string;
  /** A filter over the whole scene (a painted wobble), if any. */
  sceneFilter?: string;
  /** A soft shadow on the floor under something. */
  shadow: (x: number, y: number, rx: number, ry: number) => string;
  person: (o: PersonOpts) => string;
  ground: () => string;
  sky: () => string;
  houses: () => string;
  /** Extra light at the end of the scene (sunbeams, glows). */
  light: () => string;
  hud: () => string;
  css: string;
  menu: () => string;
}

interface PersonOpts {
  x: number;
  y: number;
  /** Seated people show from the waist up. */
  seated?: boolean;
  kind: 'tourist' | 'local' | 'student' | 'office' | 'foodie' | 'chef' | 'waiter' | 'granny';
  /** Looking left or right a little (-1, 0, 1). */
  look?: number;
  scale?: number;
}

// ---------- The scene, shared by every style ----------

function poly(s: Style, list: Pt[], fill: string, extra = ''): string {
  const stroke = s.line ? ` stroke="${s.line.color}" stroke-width="${s.line.width}" stroke-linejoin="round"` : '';
  return `<polygon points="${pts(list)}" fill="${fill}"${stroke} ${extra}/>`;
}

/** A box from x0..x1, y0..y1, z0..z1: its top and the two faces towards us. */
function box(s: Style, x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: string, faces = { top: true, left: true, right: true }): string {
  let out = '';
  if (faces.left) out += poly(s, [P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], s.shade(color, 'left'));
  if (faces.right) out += poly(s, [P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], s.shade(color, 'right'));
  if (faces.top) out += poly(s, [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], s.shade(color, 'top'));
  return out;
}

/** Things in the room, drawn back to front. */
interface Thing {
  depth: number;
  svg: string;
}

function table(s: Style, tx: number, ty: number, cloth: 'checked' | 'plain', guests: PersonOpts['kind'][]): Thing[] {
  const p = s.pal;
  const things: Thing[] = [];
  const half = 0.6;
  // Chairs and guests behind the table (far side and left side), so every face shows.
  const seats: [number, number][] = [
    [tx, ty - 1.0],
    [tx - 1.0, ty],
  ];
  guests.forEach((kind, i) => {
    const [cx, cy] = seats[i];
    const chair = box(s, cx - 0.32, cx + 0.32, cy - 0.32, cy + 0.32, 0, 0.45, p.chair) + box(s, cx - 0.32, cx + 0.32, cy - 0.32, cy - 0.22, 0.45, 1.1, p.chair);
    things.push({ depth: cx + cy - 0.2, svg: s.shadow(cx, cy, 0.5, 0.4) + chair });
    const [fx, fy] = P(cx, cy, 0.45);
    things.push({ depth: cx + cy + 0.1, svg: s.person({ x: fx, y: fy, seated: true, kind, look: i === 0 ? 0 : 1 }) });
  });
  // The table: legs, top and cloth, with plates and a vase.
  let t = s.shadow(tx, ty, 0.9, 0.7);
  t += box(s, tx - 0.08, tx + 0.08, ty - 0.08, ty + 0.08, 0, 0.72, p.wood);
  const clothColor = p.cloth;
  t += box(s, tx - half - 0.05, tx + half + 0.05, ty - half - 0.05, ty + half + 0.05, 0.62, 0.78, clothColor);
  if (cloth === 'checked') {
    // Checks on the cloth's top.
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if ((i + j) % 2) continue;
        const x0 = tx - half - 0.05 + (i * (2 * half + 0.1)) / 4;
        const y0 = ty - half - 0.05 + (j * (2 * half + 0.1)) / 4;
        const step = (2 * half + 0.1) / 4;
        t += `<polygon points="${pts([P(x0, y0, 0.78), P(x0 + step, y0, 0.78), P(x0 + step, y0 + step, 0.78), P(x0, y0 + step, 0.78)])}" fill="${p.check}" opacity="0.85"/>`;
      }
    }
  }
  // Plates: one in front of each guest.
  guests.forEach((_, i) => {
    const [px, py] = i === 0 ? [tx, ty - 0.3] : [tx - 0.3, ty];
    const [sx, sy] = P(px, py, 0.79);
    t += `<ellipse cx="${sx}" cy="${sy}" rx="11" ry="5.5" fill="${p.plate}" ${s.line ? `stroke="${s.line.color}" stroke-width="1"` : ''}/>`;
    t += `<ellipse cx="${sx}" cy="${sy - 1}" rx="6" ry="2.8" fill="${i ? p.food2 : p.food1}"/>`;
  });
  const [vx, vy] = P(tx + 0.25, ty + 0.25, 0.79);
  t += `<rect x="${vx - 3}" y="${vy - 11}" width="6" height="11" rx="2" fill="${p.vase}"/>`;
  t += `<circle cx="${vx}" cy="${vy - 14}" r="4" fill="${p.flower}"/>`;
  things.push({ depth: tx + ty + 0.5, svg: t });
  return things;
}

function scene(s: Style, evening = false): string {
  const p = s.pal;
  let back = '';
  // The floor, and its edge towards us.
  back += poly(s, [P(0, 0), P(RW, 0), P(RW, RD), P(0, RD)], p.floor);
  for (let i = 1; i < RW * 2; i++) {
    const x = i / 2;
    back += `<line x1="${P(x, 0)[0]}" y1="${P(x, 0)[1]}" x2="${P(x, RD)[0]}" y2="${P(x, RD)[1]}" stroke="${p.floorLine}" stroke-width="${i % 2 ? 0.8 : 1.4}" opacity="0.55"/>`;
  }
  back += box(s, 0, RW, RD, RD + 0.25, -0.35, 0, p.edge, { top: false, left: true, right: false });
  back += box(s, RW, RW + 0.25, 0, RD + 0.25, -0.35, 0, p.edge, { top: false, left: false, right: true });
  // A rug under the middle tables.
  back += poly(s, [P(3.4, 2.4), P(6.6, 2.4), P(6.6, 5.4), P(3.4, 5.4)], p.rug);
  back += poly(s, [P(3.7, 2.7), P(6.3, 2.7), P(6.3, 5.1), P(3.7, 5.1)], p.rugInner);
  // The back walls: plaster above panelling.
  back += poly(s, [P(0, 0), P(RW, 0), P(RW, 0, WALL), P(0, 0, WALL)], s.shade(p.wall, 'left'));
  back += poly(s, [P(0, 0), P(0, RD), P(0, RD, WALL), P(0, 0, WALL)], s.shade(p.wall, 'right'));
  back += poly(s, [P(0, 0), P(RW, 0), P(RW, 0, 1.3), P(0, 0, 1.3)], s.shade(p.panel, 'left'));
  back += poly(s, [P(0, 0), P(0, RD), P(0, RD, 1.3), P(0, 0, 1.3)], s.shade(p.panel, 'right'));
  for (let x = 0.5; x < RW; x += 1) back += poly(s, [P(x + 0.1, 0, 0.25), P(x + 0.8, 0, 0.25), P(x + 0.8, 0, 1.05), P(x + 0.1, 0, 1.05)], s.shade(lighter(p.panel, 0.08), 'left'), 'opacity="0.9"');
  for (let y = 0.5; y < RD; y += 1) back += poly(s, [P(0, y + 0.1, 0.25), P(0, y + 0.8, 0.25), P(0, y + 0.8, 1.05), P(0, y + 0.1, 1.05)], s.shade(lighter(p.panel, 0.08), 'right'), 'opacity="0.9"');
  // The window on the left wall, with Gdańsk gables outside.
  const win = [P(0, 1.6, 1.6), P(0, 3.6, 1.6), P(0, 3.6, 3.4), P(0, 1.6, 3.4)];
  back += poly(s, win, evening ? p.nightGlass : p.glass);
  for (let i = 0; i < 4; i++) {
    const y0 = 1.75 + i * 0.47;
    const h = 2.2 + ((i * 37) % 5) * 0.18;
    back += poly(s, [P(0, y0, 1.6), P(0, y0 + 0.42, 1.6), P(0, y0 + 0.42, h), P(0, y0 + 0.21, h + 0.3), P(0, y0, h)], [p.house1, p.house2, p.house3, p.house1][i], 'opacity="0.9"');
  }
  back += `<line x1="${P(0, 2.6, 1.6)[0]}" y1="${P(0, 2.6, 1.6)[1]}" x2="${P(0, 2.6, 3.4)[0]}" y2="${P(0, 2.6, 3.4)[1]}" stroke="${p.frame}" stroke-width="3"/>`;
  back += poly(s, [P(0, 1.5, 1.5), P(0, 3.7, 1.5), P(0.25, 3.7, 1.5), P(0.25, 1.5, 1.5)], p.sill);
  // Curtains.
  back += poly(s, [P(0, 1.3, 1.4), P(0, 1.7, 1.4), P(0, 1.7, 3.6), P(0, 1.3, 3.6)], p.curtain);
  back += poly(s, [P(0, 3.5, 1.4), P(0, 3.9, 1.4), P(0, 3.9, 3.6), P(0, 3.5, 3.6)], p.curtain);
  // A shelf of jars on the left wall.
  back += poly(s, [P(0, 4.6, 2.6), P(0, 6.4, 2.6), P(0.3, 6.4, 2.6), P(0.3, 4.6, 2.6)], p.wood);
  [p.jar1, p.jar2, p.jar3, p.jar1, p.jar2].forEach((c, i) => {
    const [jx, jy] = P(0.15, 4.85 + i * 0.36, 2.6);
    back += `<rect x="${jx - 5}" y="${jy - 14}" width="10" height="14" rx="3" fill="${c}" ${s.line ? `stroke="${s.line.color}" stroke-width="1"` : ''}/><rect x="${jx - 5}" y="${jy - 17}" width="10" height="4" rx="1" fill="${p.gold}"/>`;
  });
  // On the back wall: the Żuraw print, a chalkboard, a clock and the kitchen's tiles and pans.
  back += poly(s, [P(1.0, 0, 1.9), P(2.8, 0, 1.9), P(2.8, 0, 3.3), P(1.0, 0, 3.3)], p.gold);
  back += poly(s, [P(1.12, 0, 2.0), P(2.68, 0, 2.0), P(2.68, 0, 3.2), P(1.12, 0, 3.2)], p.print);
  back += poly(s, [P(1.6, 0, 2.0), P(2.2, 0, 2.0), P(2.2, 0, 2.9), P(1.95, 0, 3.05), P(1.6, 0, 2.9)], p.crane);
  back += poly(s, [P(3.3, 0, 1.7), P(5.2, 0, 1.7), P(5.2, 0, 3.2), P(3.3, 0, 3.2)], p.wood);
  back += poly(s, [P(3.4, 0, 1.8), P(5.1, 0, 1.8), P(5.1, 0, 3.1), P(3.4, 0, 3.1)], p.board);
  for (let i = 0; i < 4; i++) {
    const a = P(3.6, 0, 2.85 - i * 0.28);
    const b = P(4.6 - (i % 2) * 0.4, 0, 2.85 - i * 0.28);
    back += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${p.chalk}" stroke-width="2" stroke-linecap="round" opacity="0.85"/>`;
  }
  const [cx, cy] = P(6.0, 0, 3.4);
  back += `<circle cx="${cx}" cy="${cy}" r="11" fill="${p.clock}" ${s.line ? `stroke="${s.line.color}" stroke-width="1.5"` : ''}/><line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 7}" stroke="${p.ink}" stroke-width="1.6"/><line x1="${cx}" y1="${cy}" x2="${cx + 5}" y2="${cy + 2}" stroke="${p.ink}" stroke-width="1.6"/>`;
  // Kitchen tiles.
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 4; j++) {
      const x0 = 6.9 + i * 0.5;
      const z0 = 1.3 + j * 0.5;
      back += poly(s, [P(x0, 0, z0), P(x0 + 0.48, 0, z0), P(x0 + 0.48, 0, z0 + 0.48), P(x0, 0, z0 + 0.48)], s.shade((i + j) % 2 ? p.tile : lighter(p.tile, 0.12), 'left'), s.line ? '' : '');
      const [tx, ty] = P(x0 + 0.24, 0, z0 + 0.24);
      back += `<circle cx="${tx}" cy="${ty}" r="2.2" fill="${p.tileDot}"/>`;
    }
  }
  // Copper pans on a rail.
  const rail = [P(7.0, 0, 3.55), P(9.8, 0, 3.55)];
  back += `<line x1="${rail[0][0]}" y1="${rail[0][1]}" x2="${rail[1][0]}" y2="${rail[1][1]}" stroke="${p.ink}" stroke-width="2"/>`;
  [7.4, 8.2, 9.1].forEach((x, i) => {
    const [px, py] = P(x, 0, 3.5);
    back += `<line x1="${px}" y1="${py}" x2="${px}" y2="${py + 8}" stroke="${p.ink}" stroke-width="1.5"/><circle cx="${px}" cy="${py + 16 + i * 2}" r="${9 + i * 2}" fill="${p.copper}" ${s.line ? `stroke="${s.line.color}" stroke-width="1.5"` : ''}/><circle cx="${px - 3}" cy="${py + 13 + i * 2}" r="3" fill="${lighter(p.copper, 0.45)}" opacity="0.8"/>`;
  });
  // Wall lamps with their glow.
  const lamps: Pt[] = [P(0, 4.2, 2.9), P(3.0, 0, 3.0), P(5.6, 0, 3.0)];
  lamps.forEach(([lx, ly]) => {
    back += `<path d="M${lx - 7},${ly} L${lx + 7},${ly} L${lx + 4},${ly - 8} L${lx - 4},${ly - 8} Z" fill="${p.lampShade}" ${s.line ? `stroke="${s.line.color}" stroke-width="1"` : ''}/><circle cx="${lx}" cy="${ly + 3}" r="3" fill="${p.bulb}"/>`;
  });

  // Things on the floor, back to front.
  const things: Thing[] = [];
  things.push(...table(s, 2.2, 2.2, 'checked', ['tourist', 'local']));
  things.push(...table(s, 2.2, 5.2, 'checked', ['student', 'foodie']));
  things.push(...table(s, 5.0, 3.9, 'checked', ['granny', 'office']));
  // The kitchen: back counter with a stove, the chef, and the pass towards the room.
  things.push({ depth: 7.5, svg: box(s, 6.9, RW, 0.05, 0.9, 0, 1.05, p.counter) + box(s, 7.3, 8.3, 0.15, 0.8, 1.05, 1.12, p.steel) });
  const [fx, fy] = P(7.8, 0.45, 1.12);
  things.push({
    depth: 7.6,
    svg: `<ellipse cx="${fx}" cy="${fy}" rx="10" ry="4" fill="${p.ink}"/><path d="M${fx - 6},${fy - 2} q3,-12 0,-22 M${fx + 2},${fy - 4} q4,-12 0,-24" stroke="${p.steam}" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.7"/><path d="M${fx - 5},${fy + 3} q5,-9 10,0 Z" fill="${p.flame}"/>`,
  });
  const chef = P(8.6, 1.45);
  things.push({ depth: 10.0, svg: s.shadow(8.6, 1.45, 0.45, 0.35) + s.person({ x: chef[0], y: chef[1], kind: 'chef', look: -1 }) });
  things.push({ depth: 10.6, svg: s.shadow(8.4, 2.6, 1.6, 0.6) + box(s, 6.8, RW, 2.1, 2.7, 0, 1.1, p.counter) + box(s, 6.8, RW, 2.1, 2.7, 1.1, 1.2, p.wood) });
  [7.4, 7.9].forEach((x) => {
    const [px, py] = P(x, 2.4, 1.2);
    things.push({ depth: 10.7, svg: `<ellipse cx="${px}" cy="${py}" rx="10" ry="5" fill="${p.plate}"/><ellipse cx="${px}" cy="${py - 1}" rx="5.5" ry="2.6" fill="${p.food1}"/>` });
  });
  // The waiter, carrying a tray.
  const waiter = P(6.3, 5.6);
  things.push({ depth: 11.9, svg: s.shadow(6.3, 5.6, 0.45, 0.35) + s.person({ x: waiter[0], y: waiter[1], kind: 'waiter', look: -1 }) });
  // A fig tree in the corner and a plant.
  const fig = P(9.2, 6.1);
  things.push({ depth: 15.3, svg: s.shadow(9.2, 6.1, 0.6, 0.5) + box(s, 8.9, 9.5, 5.8, 6.4, 0, 0.6, p.pot) + tree(s, fig[0], fig[1] - 0.6 * U, 30) });
  things.sort((a, b) => a.depth - b.depth);

  const room = back + things.map((t) => t.svg).join('');
  return room;
}

function tree(s: Style, x: number, y: number, r: number): string {
  const p = s.pal;
  return (
    `<rect x="${x - 3}" y="${y - 24}" width="6" height="24" fill="${p.bark}"/>` +
    `<circle cx="${x}" cy="${y - 34}" r="${r}" fill="${p.leaf}" ${s.line ? `stroke="${s.line.color}" stroke-width="${s.line.width}"` : ''}/>` +
    `<circle cx="${x - r * 0.45}" cy="${y - 38}" r="${r * 0.55}" fill="${lighter(p.leaf, 0.18)}"/>` +
    `<circle cx="${x + r * 0.35}" cy="${y - 28}" r="${r * 0.45}" fill="${darker(p.leaf, 0.12)}"/>`
  );
}

// ---------- People ----------

const OUTFITS: Record<PersonOpts['kind'], { top: string; hair: string; skin: string; extra: string }> = {
  tourist: { top: '#f2b134', hair: '#e7c27a', skin: '#f6d2b4', extra: 'strawHat' },
  local: { top: '#c0443a', hair: '#6b3f2a', skin: '#f2c6a4', extra: 'jumper' },
  student: { top: '#4b7bbd', hair: '#2b2230', skin: '#e9b98f', extra: 'hoodie' },
  office: { top: '#e9eef5', hair: '#3a2c25', skin: '#f3cfae', extra: 'tie' },
  foodie: { top: '#6e4a8e', hair: '#b04a2f', skin: '#f6d2b4', extra: 'scarf' },
  granny: { top: '#3e7f6e', hair: '#d7d3cf', skin: '#f2c9ab', extra: 'bun' },
  chef: { top: '#fbfbf7', hair: '#7a4b31', skin: '#f2c6a4', extra: 'toque' },
  waiter: { top: '#2a2a33', hair: '#4a2f22', skin: '#efc3a0', extra: 'apron' },
};

// ---------- Background: the street and the gables ----------

function gables(s: Style, colors: string[], opts: { line?: boolean; windows: string; roof: string }): string {
  let out = '';
  const base = 300;
  let x = -20;
  let i = 0;
  while (x < W + 40) {
    const w = 78 + ((i * 29) % 30);
    const h = 150 + ((i * 53) % 70);
    const c = colors[i % colors.length];
    const top = base - h;
    const stroke = opts.line && s.line ? ` stroke="${s.line.color}" stroke-width="${s.line.width}" stroke-linejoin="round"` : '';
    // A Gdańsk gable: stepped, or a curved top.
    if (i % 2 === 0) {
      out += `<path d="M${x},${base} L${x},${top + 40} L${x + w * 0.15},${top + 40} L${x + w * 0.15},${top + 22} L${x + w * 0.3},${top + 22} L${x + w * 0.3},${top + 6} L${x + w * 0.7},${top + 6} L${x + w * 0.7},${top + 22} L${x + w * 0.85},${top + 22} L${x + w * 0.85},${top + 40} L${x + w},${top + 40} L${x + w},${base} Z" fill="${c}"${stroke}/>`;
    } else {
      out += `<path d="M${x},${base} L${x},${top + 46} Q${x + w * 0.1},${top + 20} ${x + w * 0.3},${top + 18} Q${x + w * 0.5},${top - 8} ${x + w * 0.7},${top + 18} Q${x + w * 0.9},${top + 20} ${x + w},${top + 46} L${x + w},${base} Z" fill="${c}"${stroke}/>`;
    }
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 3; col++) {
        const wx = x + 12 + col * ((w - 24) / 3) + 3;
        const wy = top + 56 + row * 30;
        if (wy > base - 26) continue;
        out += `<rect x="${wx}" y="${wy}" width="${(w - 24) / 3 - 8}" height="18" rx="${s.id === 'toy' ? 4 : 1.5}" fill="${opts.windows}"/>`;
      }
    }
    x += w + 2;
    i++;
  }
  return out;
}

// ---------- Food, for the Menu tab ----------

function food(s: Style, kind: 'zurek' | 'pierogi' | 'schabowy' | 'kompot', size = 80): string {
  return foodAt(s, kind, size).replace(`viewBox="0 0 ${size} ${size}"`, `viewBox="${size * 0.14} ${size * 0.14} ${size * 0.72} ${size * 0.72}"`);
}

function foodAt(s: Style, kind: 'zurek' | 'pierogi' | 'schabowy' | 'kompot', size: number): string {
  const p = s.pal;
  const l = s.line ? `stroke="${s.line.color}" stroke-width="${s.line.width}"` : '';
  const c = size / 2;
  switch (kind) {
    case 'zurek':
      return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><ellipse cx="${c}" cy="${c + 14}" rx="${c - 6}" ry="12" fill="${darker(p.plate, 0.1)}" ${l}/><path d="M8,${c} Q${c},${c + 46} ${size - 8},${c} Z" fill="${p.bowl}" ${l}/><ellipse cx="${c}" cy="${c}" rx="${c - 8}" ry="11" fill="#e8d6ae" ${l}/><circle cx="${c - 10}" cy="${c - 1}" r="7" fill="#fff8e6" ${l}/><circle cx="${c - 10}" cy="${c - 1}" r="3.4" fill="#f2b632"/><ellipse cx="${c + 10}" cy="${c + 2}" rx="6" ry="3.5" fill="#b9574a" ${l}/><ellipse cx="${c + 2}" cy="${c - 5}" rx="5" ry="3" fill="#b9574a" ${l}/><path d="M${c + 14},${c - 6} l4,-3 M${c - 20},${c + 4} l-3,-4" stroke="#5f9b4a" stroke-width="2"/></svg>`;
    case 'pierogi':
      return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><ellipse cx="${c}" cy="${c + 6}" rx="${c - 4}" ry="${c - 18}" fill="${p.plate}" ${l}/>${[-14, 0, 14].map((d, i) => `<path d="M${c + d - 12},${c + 8 - i * 3} Q${c + d},${c - 16 - i * 3} ${c + d + 12},${c + 8 - i * 3} Z" fill="#f3dca6" ${l}/>`).join('')}<path d="M${c - 16},${c + 12} l6,-2 M${c + 10},${c + 13} l6,-3" stroke="#c98a3c" stroke-width="2.5" stroke-linecap="round"/><circle cx="${c + 18}" cy="${c - 4}" r="3" fill="#5f9b4a"/></svg>`;
    case 'schabowy':
      return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><ellipse cx="${c}" cy="${c + 6}" rx="${c - 4}" ry="${c - 18}" fill="${p.plate}" ${l}/><path d="M${c - 22},${c + 4} Q${c - 18},${c - 14} ${c + 4},${c - 10} Q${c + 14},${c - 2} ${c + 4},${c + 12} Q${c - 14},${c + 18} ${c - 22},${c + 4} Z" fill="#c9893a" ${l}/><circle cx="${c + 16}" cy="${c + 6}" r="7" fill="#f1d27a" ${l}/><circle cx="${c + 18}" cy="${c - 6}" r="6" fill="#f1d27a" ${l}/><path d="M${c - 6},${c - 2} l10,0" stroke="#e8b45f" stroke-width="2"/><ellipse cx="${c - 6}" cy="${c + 16}" rx="9" ry="4" fill="#8dbf6a"/></svg>`;
    case 'kompot':
      return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}"><path d="M${c - 16},${c - 22} L${c + 16},${c - 22} L${c + 12},${c + 24} L${c - 12},${c + 24} Z" fill="#ffffff" opacity="0.85" ${l}/><path d="M${c - 15},${c - 12} L${c + 15},${c - 12} L${c + 12},${c + 22} L${c - 12},${c + 22} Z" fill="#c8384a" opacity="0.9"/><circle cx="${c - 4}" cy="${c + 8}" r="4" fill="#8a1f2c"/><circle cx="${c + 6}" cy="${c + 2}" r="4" fill="#8a1f2c"/><circle cx="${c + 1}" cy="${c + 14}" r="3.5" fill="#f2a25c"/><rect x="${c + 6}" y="${c - 34}" width="3" height="26" fill="#6aa6c8" transform="rotate(12 ${c + 7} ${c - 20})"/></svg>`;
  }
}

// ---------- The three styles ----------

const shadeBy = (left: number, right: number, top = 0) => (c: string, face: 'top' | 'left' | 'right') =>
  face === 'top' ? (top ? lighter(c, top) : c) : face === 'left' ? darker(c, left) : darker(c, right);

/** 1. A storybook painting: warm paper, ink outlines that wobble, washes of colour, a soft grain. */
const storybook: Style = {
  id: 'storybook',
  title: 'Storybook',
  font: "'Segoe UI', sans-serif",
  headingFont: "Georgia, 'Palatino Linotype', serif",
  pal: {
    floor: '#d9a56b', floorLine: '#a8743e', edge: '#9a6a3f', rug: '#b5483b', rugInner: '#4a6f9c',
    wall: '#f1e2c4', panel: '#8c5b3b', glass: '#bcdcea', nightGlass: '#2d3b63', house1: '#e8a37b', house2: '#9fc0a8', house3: '#e9d58a',
    frame: '#f7efe0', sill: '#efe3cc', curtain: '#c9564a', wood: '#7a4a2e', jar1: '#d9822b', jar2: '#9c3b47', jar3: '#7fa354',
    gold: '#caa04a', print: '#d8e6ea', crane: '#5b3a2a', board: '#2f4a3c', chalk: '#f4efe2', clock: '#fbf3e1', ink: '#3b2a22',
    tile: '#f3f6f8', tileDot: '#3f6fa5', copper: '#c46f3d', lampShade: '#3f7a52', bulb: '#ffe6a3',
    chair: '#6e4128', cloth: '#f7eee0', check: '#c84a3d', plate: '#fbf8f1', food1: '#e8c66b', food2: '#c76b4a', vase: '#3f6fa5', flower: '#e05a4f',
    counter: '#8a5a3a', steel: '#b9c2c7', steam: '#ffffff', flame: '#f39b2e', pot: '#b3643e', leaf: '#5d8f4a', bark: '#6b4a32', bowl: '#e6d2a7',
  },
  line: { color: '#4a3326', width: 1.8 },
  shade: shadeBy(0.08, 0.16),
  defs: `<filter id="wobble"><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3"/><feDisplacementMap in="SourceGraphic" scale="3.2"/></filter>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="8"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0.18 0"/></filter>
    <filter id="soft"><feGaussianBlur stdDeviation="5"/></filter>
    <radialGradient id="sun" cx="0.25" cy="0.15" r="0.9"><stop offset="0" stop-color="#fff6d8"/><stop offset="1" stop-color="#cfe3ec"/></radialGradient>`,
  sceneFilter: 'url(#wobble)',
  shadow: (x, y, rx, ry) => {
    const [sx, sy] = P(x, y);
    return `<ellipse cx="${sx}" cy="${sy}" rx="${rx * U * 0.9}" ry="${ry * U * 0.55}" fill="#5a3a24" opacity="0.18" filter="url(#soft)"/>`;
  },
  person: (o) => personDrawn(storybook, o, { headR: 12, bodyW: 24, bodyH: 26, outline: true, blush: 0.55 }),
  ground: () => `<rect x="0" y="300" width="${W}" height="${H - 300}" fill="#d8c8a8"/>` + cobbles('#c4b18e', 0.6, false),
  sky: () => `<rect width="${W}" height="320" fill="url(#sun)"/><circle cx="1120" cy="70" r="34" fill="#fff1c4" opacity="0.9"/>`,
  houses: () => gables(storybook, ['#e8a37b', '#f0d59a', '#9fc0a8', '#e6b7b0', '#c9d6e3', '#f1c48f'], { line: true, windows: '#5f7b8f', roof: '#a8543f' }),
  light: () => `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.9"/>`,
  css: `
    body { font-family: 'Segoe UI', sans-serif; color: #3b2a22; }
    .paper { background: #fbf3e1; border: 2px solid #4a3326; box-shadow: 3px 4px 0 rgba(74,51,38,0.25); border-radius: 6px 10px 7px 12px; }
    .clock { left: 14px; top: 12px; padding: 6px 14px; transform: rotate(-1.2deg); }
    .clock b { font: 700 30px Georgia, serif; color: #a8402f; }
    .stat { padding: 4px 12px; text-align: center; font-size: 12px; }
    .stat b { display: block; font: 700 20px Georgia, serif; }
    .round { width: 62px; height: 62px; border-radius: 50%; display: grid; place-items: center; font-size: 26px; background: #fbf3e1; border: 2px solid #4a3326; box-shadow: 2px 3px 0 rgba(74,51,38,0.3); }
    .label { font: italic 13px Georgia, serif; text-align: center; margin-top: 2px; }
    .speed { padding: 10px 14px; font: 700 16px Georgia, serif; }
    .speed.on { background: #a8402f; color: #fbf3e1; }
    .note { padding: 8px 14px; max-width: 280px; font: italic 14px Georgia, serif; }`,
  hud: () => standardHud(),
  menu: () => '',
};

/** 2. A toy-box diorama: chunky, glossy, bright, round-headed figures, soft shadows, bubbly buttons. */
const toy: Style = {
  id: 'toy',
  title: 'Toy box',
  font: "'Trebuchet MS', 'Segoe UI', sans-serif",
  headingFont: "'Segoe UI Black', 'Arial Black', sans-serif",
  pal: {
    floor: '#f2b46a', floorLine: '#d48d43', edge: '#c9783a', rug: '#e8574a', rugInner: '#3c8ed6',
    wall: '#fff0d6', panel: '#d9773f', glass: '#9fe0ff', nightGlass: '#2b3a7a', house1: '#ff9f7a', house2: '#7fd6b0', house3: '#ffe07a',
    frame: '#ffffff', sill: '#ffffff', curtain: '#ff6b6b', wood: '#b9673a', jar1: '#ffb238', jar2: '#ff5d73', jar3: '#7bd36a',
    gold: '#ffc83d', print: '#c9ecff', crane: '#7a4a32', board: '#2f6b55', chalk: '#ffffff', clock: '#ffffff', ink: '#3a2a3a',
    tile: '#ffffff', tileDot: '#3c8ed6', copper: '#ff8a3d', lampShade: '#3cbf7a', bulb: '#fff3b0',
    chair: '#c4683a', cloth: '#ffffff', check: '#ff5d5d', plate: '#ffffff', food1: '#ffd25c', food2: '#ff7a59', vase: '#3c8ed6', flower: '#ff4f6d',
    counter: '#c9773f', steel: '#d6e4ee', steam: '#ffffff', flame: '#ffb02e', pot: '#e0794a', leaf: '#4cc070', bark: '#8a5a3a', bowl: '#fff1d6',
  },
  line: null,
  shade: shadeBy(0.13, 0.27, 0.06),
  defs: `<filter id="soft"><feGaussianBlur stdDeviation="6"/></filter>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ec8ff"/><stop offset="1" stop-color="#d9f1ff"/></linearGradient>
    <radialGradient id="ball" cx="0.35" cy="0.3" r="0.75"><stop offset="0" stop-color="#ffffff" stop-opacity="0.65"/><stop offset="0.45" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`,
  shadow: (x, y, rx, ry) => {
    const [sx, sy] = P(x, y);
    return `<ellipse cx="${sx}" cy="${sy + 2}" rx="${rx * U * 0.95}" ry="${ry * U * 0.6}" fill="#7a3b10" opacity="0.28" filter="url(#soft)"/>`;
  },
  person: (o) => personDrawn(toy, o, { headR: 15, bodyW: 26, bodyH: 22, outline: false, blush: 0.8, gloss: true }),
  ground: () => `<rect x="0" y="300" width="${W}" height="${H - 300}" fill="#c9d4dc"/>` + cobbles('#b4c1cb', 0.9, true),
  sky: () => `<rect width="${W}" height="320" fill="url(#sky)"/>` + [180, 520, 980].map((x, i) => `<g opacity="0.95"><circle cx="${x}" cy="${60 + i * 18}" r="22" fill="#fff"/><circle cx="${x + 24}" cy="${54 + i * 18}" r="28" fill="#fff"/><circle cx="${x + 52}" cy="${62 + i * 18}" r="20" fill="#fff"/></g>`).join(''),
  houses: () => gables(toy, ['#ff9f7a', '#ffd36e', '#7fd6b0', '#ff8fb0', '#9ec9ff', '#ffb86b'], { windows: '#5b7cc9', roof: '#e2584a' }),
  light: () => '',
  css: `
    body { font-family: 'Trebuchet MS', 'Segoe UI', sans-serif; color: #3a2a3a; }
    .paper { background: linear-gradient(#ffffff, #f1f4ff); border-radius: 18px; box-shadow: 0 5px 0 #c9cde6, 0 8px 18px rgba(40,40,90,0.25); }
    .clock { left: 14px; top: 12px; padding: 6px 16px; }
    .clock b { font: 900 30px 'Segoe UI Black', 'Arial Black', sans-serif; color: #ff5d5d; }
    .stat { padding: 4px 14px; text-align: center; font-size: 12px; font-weight: 700; color: #7a7aa0; }
    .stat b { display: block; font: 900 20px 'Segoe UI Black', 'Arial Black', sans-serif; color: #3a2a3a; }
    .round { width: 64px; height: 64px; border-radius: 22px; display: grid; place-items: center; font-size: 28px; background: linear-gradient(#ffd25c, #ffb02e); box-shadow: 0 5px 0 #d9851a, 0 8px 14px rgba(0,0,0,0.25); }
    .label { font: 900 13px 'Segoe UI Black', sans-serif; text-align: center; margin-top: 6px; color: #fff; text-shadow: 0 2px 0 #3a2a3a, 0 0 6px #3a2a3a; }
    .speed { padding: 10px 16px; font: 900 17px 'Segoe UI Black', sans-serif; border-radius: 14px; }
    .speed.on { background: linear-gradient(#5fd38a, #2fb36a); color: #fff; box-shadow: 0 4px 0 #1f8a4f; }
    .note { padding: 10px 16px; max-width: 280px; font-weight: 700; font-size: 14px; }`,
  hud: () => standardHud(),
  menu: () => '',
};

/** 3. A modern flat illustration: calm pastels, no outlines, clean shapes, long soft shadows, airy UI. */
const flat: Style = {
  id: 'flat',
  title: 'Modern flat',
  font: "'Segoe UI', 'Helvetica Neue', sans-serif",
  headingFont: "'Segoe UI Semibold', 'Segoe UI', sans-serif",
  pal: {
    floor: '#e2c09b', floorLine: '#c9a37b', edge: '#b8916a', rug: '#e07a5f', rugInner: '#3d5a80',
    wall: '#f6efe7', panel: '#3d5a80', glass: '#cfe3ec', nightGlass: '#30406a', house1: '#f2cc8f', house2: '#81b29a', house3: '#e07a5f',
    frame: '#ffffff', sill: '#ffffff', curtain: '#e07a5f', wood: '#8d6a4f', jar1: '#f2cc8f', jar2: '#e07a5f', jar3: '#81b29a',
    gold: '#d4a95b', print: '#dfe9ef', crane: '#3d405b', board: '#3d405b', chalk: '#f4f1de', clock: '#ffffff', ink: '#3d405b',
    tile: '#f4f1de', tileDot: '#3d5a80', copper: '#d98b5f', lampShade: '#81b29a', bulb: '#ffeeb8',
    chair: '#3d405b', cloth: '#ffffff', check: '#e07a5f', plate: '#ffffff', food1: '#f2cc8f', food2: '#e07a5f', vase: '#3d5a80', flower: '#e07a5f',
    counter: '#a98467', steel: '#d9e2e7', steam: '#ffffff', flame: '#f2a65a', pot: '#e07a5f', leaf: '#81b29a', bark: '#6b5a4a', bowl: '#f4f1de',
  },
  line: null,
  shade: shadeBy(0.05, 0.12),
  defs: `<filter id="soft"><feGaussianBlur stdDeviation="3"/></filter>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4dcc6"/><stop offset="1" stop-color="#f9efe4"/></linearGradient>`,
  shadow: (x, y, rx, ry) => {
    // A soft shadow, falling a little away from the light.
    const [sx, sy] = P(x + 0.25, y + 0.1);
    return `<ellipse cx="${sx + 6}" cy="${sy}" rx="${rx * U * 1.0}" ry="${ry * U * 0.5}" fill="#3d405b" opacity="0.12" filter="url(#soft)"/>`;
  },
  person: (o) => personDrawn(flat, o, { headR: 11, bodyW: 20, bodyH: 30, outline: false, blush: 0.25, minimal: true }),
  ground: () => `<rect x="0" y="300" width="${W}" height="${H - 300}" fill="#ebe3d8"/>` + Array.from({ length: 14 }, (_, i) => `<line x1="0" y1="${320 + i * 22}" x2="${W}" y2="${320 + i * 22}" stroke="#e0d6c8" stroke-width="1"/>`).join(''),
  sky: () => `<rect width="${W}" height="320" fill="url(#sky)"/><circle cx="1110" cy="88" r="42" fill="#f2cc8f" opacity="0.8"/>`,
  houses: () => gables(flat, ['#f2cc8f', '#e07a5f', '#81b29a', '#f4f1de', '#3d5a80', '#e9c46a'], { windows: '#ffffff', roof: '#3d405b' }),
  light: () => '',
  css: `
    body { font-family: 'Segoe UI', 'Helvetica Neue', sans-serif; color: #3d405b; }
    .paper { background: rgba(255,255,255,0.86); border-radius: 14px; box-shadow: 0 10px 30px rgba(61,64,91,0.14); }
    .clock { left: 16px; top: 14px; padding: 8px 18px; }
    .clock b { font: 300 32px 'Segoe UI Light', 'Segoe UI', sans-serif; letter-spacing: 1px; }
    .stat { padding: 6px 16px; text-align: center; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #8a8ca3; }
    .stat b { display: block; font: 600 20px 'Segoe UI', sans-serif; color: #3d405b; letter-spacing: 0; text-transform: none; }
    .round { width: 58px; height: 58px; border-radius: 50%; display: grid; place-items: center; font-size: 22px; background: rgba(255,255,255,0.9); box-shadow: 0 8px 20px rgba(61,64,91,0.18); }
    .label { font: 600 12px 'Segoe UI', sans-serif; text-align: center; margin-top: 6px; color: #3d405b; }
    .speed { padding: 10px 16px; font: 600 15px 'Segoe UI', sans-serif; border-radius: 10px; }
    .speed.on { background: #3d405b; color: #fff; }
    .note { padding: 10px 16px; max-width: 280px; font-size: 14px; }`,
  hud: () => standardHud(),
  menu: () => '',
};

function cobbles(color: string, opacity: number, round: boolean): string {
  let out = '';
  for (let row = 0; row < 14; row++) {
    for (let col = 0; col < 46; col++) {
      const x = col * 32 + (row % 2) * 16 - 10;
      const y = 306 + row * 22;
      out += round
        ? `<rect x="${x}" y="${y}" width="27" height="17" rx="7" fill="${color}" opacity="${opacity}"/>`
        : `<ellipse cx="${x + 14}" cy="${y + 9}" rx="12" ry="7" fill="none" stroke="${color}" stroke-width="1.4" opacity="${opacity}"/>`;
    }
  }
  return out;
}

interface Body {
  headR: number;
  bodyW: number;
  bodyH: number;
  outline: boolean;
  blush: number;
  gloss?: boolean;
  minimal?: boolean;
}

/** A person standing (or sitting) at screen point (x, y), feet (or seat) there. */
function personDrawn(s: Style, o: PersonOpts, b: Body): string {
  const f = OUTFITS[o.kind];
  const k = o.scale ?? 1.3;
  const line = b.outline && s.line ? `stroke="${s.line.color}" stroke-width="${s.line.width * 0.85}" stroke-linejoin="round"` : '';
  const legH = o.seated ? 0 : 20 * k;
  const bodyH = b.bodyH * k;
  const bodyW = b.bodyW * k;
  const r = b.headR * k;
  const footY = o.y;
  const hipY = footY - legH;
  const shoulderY = hipY - bodyH;
  const headY = shoulderY - r * 0.82;
  const x = o.x;
  const look = (o.look ?? 0) * r * 0.22;
  let g = '';
  // Legs (standing only).
  if (!o.seated) {
    const trousers = o.kind === 'waiter' || o.kind === 'chef' ? '#2a2a33' : darker(f.top, 0.45);
    g += `<rect x="${x - bodyW * 0.32}" y="${hipY - 2}" width="${bodyW * 0.26}" height="${legH}" rx="${b.minimal ? 3 : 4}" fill="${trousers}" ${line}/>`;
    g += `<rect x="${x + bodyW * 0.06}" y="${hipY - 2}" width="${bodyW * 0.26}" height="${legH}" rx="${b.minimal ? 3 : 4}" fill="${trousers}" ${line}/>`;
    g += `<ellipse cx="${x - bodyW * 0.2}" cy="${footY}" rx="${bodyW * 0.2}" ry="${3.5 * k}" fill="#3a2a2a"/><ellipse cx="${x + bodyW * 0.2}" cy="${footY}" rx="${bodyW * 0.2}" ry="${3.5 * k}" fill="#3a2a2a"/>`;
  }
  // Body.
  const bodyFill = b.gloss ? f.top : f.top;
  g += `<rect x="${x - bodyW / 2}" y="${shoulderY}" width="${bodyW}" height="${bodyH + 2}" rx="${b.minimal ? bodyW * 0.45 : bodyW * 0.35}" fill="${bodyFill}" ${line}/>`;
  if (b.gloss) g += `<rect x="${x - bodyW / 2}" y="${shoulderY}" width="${bodyW}" height="${bodyH + 2}" rx="${bodyW * 0.35}" fill="url(#ball)"/>`;
  // Arms down the sides, with hands (the waiter's right hand holds the tray up).
  const armW = bodyW * 0.22;
  const sleeve = darker(f.top, 0.08);
  g += `<rect x="${x - bodyW / 2 - armW * 0.55}" y="${shoulderY + 3 * k}" width="${armW}" height="${bodyH * 0.78}" rx="${armW / 2}" fill="${sleeve}" ${line}/><circle cx="${x - bodyW / 2 - armW * 0.05}" cy="${shoulderY + bodyH * 0.82}" r="${armW * 0.55}" fill="${f.skin}" ${line}/>`;
  if (o.kind === 'waiter') {
    g += `<rect x="${x + bodyW / 2 - armW * 0.45}" y="${shoulderY - 4 * k}" width="${armW}" height="${bodyH * 0.55}" rx="${armW / 2}" fill="${sleeve}" ${line}/>`;
  } else {
    g += `<rect x="${x + bodyW / 2 - armW * 0.45}" y="${shoulderY + 3 * k}" width="${armW}" height="${bodyH * 0.78}" rx="${armW / 2}" fill="${sleeve}" ${line}/><circle cx="${x + bodyW / 2 + armW * 0.05}" cy="${shoulderY + bodyH * 0.82}" r="${armW * 0.55}" fill="${f.skin}" ${line}/>`;
  }
  // Outfit details.
  if (f.extra === 'apron') g += `<rect x="${x - bodyW * 0.32}" y="${shoulderY + bodyH * 0.35}" width="${bodyW * 0.64}" height="${bodyH * 0.75 + legH * 0.6}" rx="3" fill="#ffffff" ${line}/><path d="M${x - 5},${shoulderY + 3} l5,3 l5,-3 l0,6 l-5,-3 l-5,3 Z" fill="#c43c3c"/>`;
  if (f.extra === 'tie') g += `<path d="M${x},${shoulderY + 2} l3,4 l-2,${bodyH * 0.6} l-1,2 l-1,-2 l-2,-${bodyH * 0.6} Z" fill="#3d5a80"/>`;
  if (f.extra === 'scarf') g += `<path d="M${x - bodyW * 0.45},${shoulderY + 3} Q${x},${shoulderY + 12} ${x + bodyW * 0.45},${shoulderY + 3} L${x + bodyW * 0.2},${shoulderY + 18} L${x + bodyW * 0.05},${shoulderY + 8}" fill="#f1e3c6" ${line}/>`;
  if (f.extra === 'jumper') g += `<path d="M${x - bodyW * 0.45},${shoulderY + bodyH * 0.45} L${x + bodyW * 0.45},${shoulderY + bodyH * 0.45}" stroke="#f3e2c4" stroke-width="${3 * k}" stroke-dasharray="3 3"/>`;
  if (f.extra === 'hoodie') g += `<path d="M${x - 4},${shoulderY + 2} l0,${bodyH * 0.5} M${x + 4},${shoulderY + 2} l0,${bodyH * 0.5}" stroke="#ffffff" stroke-width="1.5"/>`;
  if (f.extra === 'toque' || o.kind === 'chef') g += `<path d="M${x - bodyW * 0.2},${shoulderY + 4} l0,${bodyH * 0.7} M${x + bodyW * 0.2},${shoulderY + 4} l0,${bodyH * 0.7}" stroke="#d7d7d0" stroke-width="2" stroke-dasharray="2 4"/>`;
  // Arms resting forward when seated (on the table), a tray for the waiter.
  if (o.kind === 'waiter') g += `<ellipse cx="${x + bodyW * 0.75}" cy="${shoulderY + 4}" rx="${14 * k}" ry="${4 * k}" fill="#d9dde2" ${line}/><rect x="${x + bodyW * 0.55}" y="${shoulderY - 6}" width="${5 * k}" height="${9 * k}" rx="1" fill="#c8384a"/>`;
  // Head.
  g += `<circle cx="${x}" cy="${headY}" r="${r}" fill="${f.skin}" ${line}/>`;
  if (b.gloss) g += `<circle cx="${x}" cy="${headY}" r="${r}" fill="url(#ball)"/>`;
  // Hair, by kind.
  const hair = f.hair;
  if (f.extra === 'bun') g += `<circle cx="${x}" cy="${headY - r * 1.05}" r="${r * 0.45}" fill="${hair}" ${line}/>`;
  if (o.kind === 'foodie') g += `<path d="M${x - r},${headY} Q${x - r * 1.15},${headY + r * 1.2} ${x - r * 0.6},${headY + r * 1.1} L${x - r * 0.75},${headY} Z M${x + r},${headY} Q${x + r * 1.15},${headY + r * 1.2} ${x + r * 0.6},${headY + r * 1.1} L${x + r * 0.75},${headY} Z" fill="${hair}" ${line}/>`;
  g += `<path d="M${x - r},${headY + r * 0.05} Q${x - r * 1.02},${headY - r * 1.15} ${x},${headY - r * 1.02} Q${x + r * 1.05},${headY - r * 1.12} ${x + r},${headY + r * 0.05} Q${x + r * 0.55},${headY - r * 0.45} ${x + look},${headY - r * 0.5} Q${x - r * 0.55},${headY - r * 0.4} ${x - r},${headY + r * 0.05} Z" fill="${hair}" ${line}/>`;
  if (b.gloss) g += `<ellipse cx="${x - r * 0.35}" cy="${headY - r * 0.7}" rx="${r * 0.35}" ry="${r * 0.14}" fill="#ffffff" opacity="0.45"/>`;
  // Face.
  const eyeY = headY + r * 0.12;
  const eyeR = b.minimal ? 1.6 * k : 2.2 * k;
  g += `<ellipse cx="${x - r * 0.36 + look}" cy="${eyeY}" rx="${eyeR}" ry="${eyeR * (b.minimal ? 1 : 1.3)}" fill="#2a2030"/><ellipse cx="${x + r * 0.36 + look}" cy="${eyeY}" rx="${eyeR}" ry="${eyeR * (b.minimal ? 1 : 1.3)}" fill="#2a2030"/>`;
  if (!b.minimal) g += `<circle cx="${x - r * 0.36 + look + 0.8}" cy="${eyeY - 0.9}" r="${0.8 * k}" fill="#fff"/><circle cx="${x + r * 0.36 + look + 0.8}" cy="${eyeY - 0.9}" r="${0.8 * k}" fill="#fff"/>`;
  g += `<ellipse cx="${x - r * 0.55 + look}" cy="${eyeY + r * 0.38}" rx="${r * 0.2}" ry="${r * 0.11}" fill="#ef8f86" opacity="${b.blush}"/><ellipse cx="${x + r * 0.55 + look}" cy="${eyeY + r * 0.38}" rx="${r * 0.2}" ry="${r * 0.11}" fill="#ef8f86" opacity="${b.blush}"/>`;
  g += `<path d="M${x - r * 0.18 + look},${eyeY + r * 0.42} Q${x + look},${eyeY + r * 0.62} ${x + r * 0.18 + look},${eyeY + r * 0.42}" stroke="#7a3b3b" stroke-width="${1.4 * k}" fill="none" stroke-linecap="round"/>`;
  // Hats and glasses on top.
  if (f.extra === 'strawHat') g += `<ellipse cx="${x}" cy="${headY - r * 0.55}" rx="${r * 1.45}" ry="${r * 0.32}" fill="#e9c66b" ${line}/><path d="M${x - r * 0.75},${headY - r * 0.6} Q${x - r * 0.7},${headY - r * 1.45} ${x},${headY - r * 1.45} Q${x + r * 0.7},${headY - r * 1.45} ${x + r * 0.75},${headY - r * 0.6} Z" fill="#f1d27f" ${line}/><path d="M${x - r * 0.75},${headY - r * 0.75} L${x + r * 0.75},${headY - r * 0.75}" stroke="#c0443a" stroke-width="${3 * k}"/>`;
  if (o.kind === 'chef') g += `<path d="M${x - r * 0.75},${headY - r * 0.6} L${x - r * 0.8},${headY - r * 1.5} Q${x - r * 1.05},${headY - r * 2.25} ${x - r * 0.3},${headY - r * 2.1} Q${x},${headY - r * 2.6} ${x + r * 0.35},${headY - r * 2.1} Q${x + r * 1.05},${headY - r * 2.25} ${x + r * 0.8},${headY - r * 1.5} L${x + r * 0.75},${headY - r * 0.6} Z" fill="#ffffff" ${line || `stroke="#e3e3dc" stroke-width="1"`}/>`;
  if (o.kind === 'office') g += `<rect x="${x - r * 0.68 + look}" y="${eyeY - r * 0.22}" width="${r * 0.6}" height="${r * 0.42}" rx="2" fill="none" stroke="#3a2c25" stroke-width="${1.4 * k}"/><rect x="${x + r * 0.08 + look}" y="${eyeY - r * 0.22}" width="${r * 0.6}" height="${r * 0.42}" rx="2" fill="none" stroke="#3a2c25" stroke-width="${1.4 * k}"/>`;
  if (o.kind === 'student') g += `<path d="M${x + bodyW * 0.42},${shoulderY + 2} L${x + bodyW * 0.62},${shoulderY + bodyH * 0.9}" stroke="#2b3a66" stroke-width="${4 * k}" stroke-linecap="round"/>`;
  return g;
}

// ---------- Life on the street ----------

function lampPost(s: Style, x: number, y: number): string {
  const p = s.pal;
  const l = s.line ? `stroke="${s.line.color}" stroke-width="${s.line.width}"` : '';
  return `<rect x="${x - 3}" y="${y - 110}" width="6" height="110" rx="2" fill="${p.ink}"/><rect x="${x - 9}" y="${y - 8}" width="18" height="8" rx="2" fill="${p.ink}"/>` +
    `<path d="M${x - 12},${y - 112} L${x + 12},${y - 112} L${x + 8},${y - 136} L${x - 8},${y - 136} Z" fill="${p.bulb}" ${l}/><path d="M${x - 14},${y - 136} L${x + 14},${y - 136} L${x},${y - 148} Z" fill="${p.ink}"/>`;
}

function bench(s: Style, x: number, y: number): string {
  const p = s.pal;
  const l = s.line ? `stroke="${s.line.color}" stroke-width="${s.line.width * 0.8}"` : '';
  return `<rect x="${x}" y="${y - 30}" width="70" height="9" rx="3" fill="${p.wood}" ${l}/><rect x="${x}" y="${y - 18}" width="70" height="9" rx="3" fill="${p.wood}" ${l}/><rect x="${x + 6}" y="${y - 10}" width="5" height="10" fill="${p.ink}"/><rect x="${x + 59}" y="${y - 10}" width="5" height="10" fill="${p.ink}"/>`;
}

function flowerTub(s: Style, x: number, y: number): string {
  const p = s.pal;
  const l = s.line ? `stroke="${s.line.color}" stroke-width="${s.line.width * 0.8}"` : '';
  return `<rect x="${x - 26}" y="${y - 22}" width="52" height="22" rx="5" fill="${p.pot}" ${l}/>` +
    [-16, -6, 4, 14].map((d, i) => `<circle cx="${x + d}" cy="${y - 28 - (i % 2) * 5}" r="8" fill="${p.leaf}"/><circle cx="${x + d + 2}" cy="${y - 33 - (i % 2) * 5}" r="4" fill="${[p.flower, p.jar1, p.flower, p.bulb][i]}"/>`).join('');
}

function streetLife(s: Style): string {
  return (
    tree(s, 70, 400, 36) +
    lampPost(s, 300, 440) +
    bench(s, 120, 452) +
    flowerTub(s, 330, 500) +
    s.person({ x: 235, y: 470, kind: 'tourist', look: 1, scale: 1.35 }) +
    s.person({ x: 195, y: 488, kind: 'student', look: 1, scale: 1.35 }) +
    tree(s, 1300, 410, 40) +
    lampPost(s, 1070, 450) +
    bench(s, 1150, 470) +
    flowerTub(s, 1030, 505) +
    s.person({ x: 1250, y: 492, kind: 'foodie', look: -1, scale: 1.35 }) +
    s.person({ x: 1110, y: 500, kind: 'local', look: -1, scale: 1.35 })
  );
}

// ---------- Layout: the day screen and the Menu tab ----------

function standardHud(): string {
  const stats = [
    ['34', 'served'],
    ['1 284 zł', 'takings'],
    ['0', 'walked out'],
    ['3/5', "today's goal"],
  ];
  return `
    <div class="paper clock abs"><b>13:40</b><div style="font-size:13px">Tuesday 9 July · Week 1 · ☀️ Sunny</div></div>
    <div class="abs" style="left:50%;top:12px;transform:translateX(-50%);display:flex;gap:8px">${stats.map(([v, l]) => `<div class="paper stat"><b>${v}</b>${l}</div>`).join('')}</div>
    <div class="paper abs stat" style="right:14px;top:12px;display:flex;gap:16px;align-items:center;padding:8px 18px"><b>🪙 40 212 zł</b><b>3.4 ★</b></div>
    <div class="abs" style="left:18px;bottom:16px;display:flex;gap:16px">${[
      ['📋', 'Manage'],
      ['🍹', 'Happy hour'],
      ['📜', 'Flyers'],
      ['👥', "Who's who"],
    ].map(([i, l]) => `<div><div class="round">${i}</div><div class="label">${l}</div></div>`).join('')}</div>
    <div class="paper abs" style="right:14px;bottom:16px;display:flex;gap:4px;padding:6px">${['🔊', '⏸', '1×', '2×', '4×'].map((t) => `<div class="speed${t === '2×' ? ' on' : ''}">${t}</div>`).join('')}</div>
    <div class="paper note abs" style="left:14px;top:96px">🥣 Lunch rush! Tap ⚡ on a chef or a waiter to hurry them.</div>`;
}

/** Warm pools of light for the evening: wall lamps, candles on the tables, the heat lamp and the street lamps. */
function glows(): string {
  const spots: [number, number, number][] = [
    [...P(0, 4.2, 2.9), 70],
    [...P(3.0, 0, 3.0), 70],
    [...P(5.6, 0, 3.0), 70],
    [...P(2.45, 2.45, 0.9), 60],
    [...P(2.45, 5.45, 0.9), 60],
    [...P(5.25, 4.15, 0.9), 60],
    [...P(8.2, 2.4, 1.6), 80],
    [...P(7.8, 0.45, 1.3), 55],
    [300, 304, 90],
    [1070, 314, 90],
  ].map(([x, y, r]) => [x, y, r] as [number, number, number]);
  return spots.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#glow)" style="mix-blend-mode:screen"/>`).join('');
}

function dayPage(s: Style, evening = false): string {
  // The flat style's pastels need a deeper blue to read as night.
  const dusk = s.id === 'flat' ? '#141b3d' : '#1c2452';
  const night = evening
    ? `<rect width="${W}" height="${H}" fill="${dusk}" opacity="${s.id === 'flat' ? 0.62 : 0.55}" style="mix-blend-mode:multiply"/>${glows()}`
    : '';
  const page = dayPageBody(s, night, evening);
  return evening ? page.replace('<b>13:40</b>', '<b>21:10</b>').replace('☀️ Sunny', '🌙 Clear night').replace('🥣 Lunch rush! Tap ⚡ on a chef or a waiter to hurry them.', '🪗 Live accordion tonight! Tourists are stopping to listen.') : page;
}

function dayPageBody(s: Style, night: string, evening: boolean): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
    .abs { position: absolute; }
    ${s.css}
  </style></head><body>
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0">
    <defs>${s.defs}<radialGradient id="glow"><stop offset="0" stop-color="#ffcf7a" stop-opacity="0.75"/><stop offset="0.5" stop-color="#ffb347" stop-opacity="0.25"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs>
    <g ${s.sceneFilter ? `filter="${s.sceneFilter}"` : ''}>
      ${s.sky()}
      ${evening ? s.houses().replaceAll(`fill="${s.id === 'flat' ? '#ffffff' : s.id === 'toy' ? '#5b7cc9' : '#5f7b8f'}"`, 'fill="#ffd27a"') : s.houses()}
      ${s.ground()}
      ${streetLife(s)}
      ${scene(s, evening)}
    </g>
    ${night}
    ${s.light()}
  </svg>
  ${s.hud()}
  </body></html>`;
}

/** The Menu tab: dish cards with their pictures, and the chef's portrait card. */
function menuPage(s: Style): string {
  const dishes: [Parameters<typeof food>[1], string, string, string][] = [
    ['zurek', 'Żurek', 'with sausage and egg', '28 zł'],
    ['pierogi', 'Pierogi ruskie', 'potato and cheese · ★★☆', '36 zł'],
    ['schabowy', 'Schabowy', 'with cabbage and new potatoes', '44 zł'],
    ['kompot', 'Kompot', 'strawberry · homemade', '9 zł'],
  ];
  const tabs = ['Today', 'Menu', 'Kitchen', 'Interior', 'Staff', 'Marketing', 'Map', 'Mewa'];
  const look: Record<string, { page: string; tab: string; tabOn: string; card: string; price: string; button: string; chip: string; heading: string; bg: string }> = {
    storybook: {
      bg: `background:#e9dcc0;`,
      page: `background:#fbf3e1;border:2px solid #4a3326;border-radius:8px 14px 10px 16px;box-shadow:5px 6px 0 rgba(74,51,38,0.25)`,
      tab: `font:italic 16px Georgia,serif;padding:8px 14px;border-bottom:2px solid transparent;color:#6b4a36`,
      tabOn: `font:700 italic 16px Georgia,serif;padding:8px 14px;border-bottom:3px solid #a8402f;color:#a8402f`,
      card: `background:#fffaf0;border:1.5px solid #4a3326;border-radius:6px 10px 8px 12px;box-shadow:2px 3px 0 rgba(74,51,38,0.18)`,
      price: `font:700 22px Georgia,serif;color:#3b2a22`,
      button: `background:#3f7a52;color:#fbf3e1;font:700 18px Georgia,serif;border:2px solid #23402c;border-radius:10px;padding:12px 28px;box-shadow:2px 3px 0 rgba(0,0,0,0.25)`,
      chip: `border:1.5px solid #4a3326;border-radius:14px;padding:2px 10px;font-size:12px;background:#f3e7cf`,
      heading: `font:700 26px Georgia,serif;color:#a8402f`,
    },
    toy: {
      bg: `background:linear-gradient(#7ec8ff,#d9f1ff);`,
      page: `background:linear-gradient(#ffffff,#f4f6ff);border-radius:28px;box-shadow:0 8px 0 #c9cde6,0 14px 30px rgba(40,40,90,0.3)`,
      tab: `font:800 15px 'Trebuchet MS',sans-serif;padding:9px 16px;border-radius:16px;color:#7a7aa0;background:#eef0fb`,
      tabOn: `font:900 15px 'Segoe UI Black',sans-serif;padding:9px 16px;border-radius:16px;color:#fff;background:linear-gradient(#ff7a7a,#ff4f5f);box-shadow:0 4px 0 #c43344`,
      card: `background:#fff;border-radius:22px;box-shadow:0 5px 0 #e0e3f5,0 8px 16px rgba(40,40,90,0.12)`,
      price: `font:900 24px 'Segoe UI Black',sans-serif;color:#ff5d5d`,
      button: `background:linear-gradient(#5fd38a,#2fb36a);color:#fff;font:900 20px 'Segoe UI Black',sans-serif;border-radius:20px;padding:14px 30px;box-shadow:0 6px 0 #1f8a4f,0 10px 18px rgba(0,0,0,0.2)`,
      chip: `border-radius:12px;padding:3px 10px;font-size:12px;font-weight:800;background:#fff3c4;color:#a86a00`,
      heading: `font:900 26px 'Segoe UI Black',sans-serif;color:#3a2a3a`,
    },
    flat: {
      bg: `background:linear-gradient(#f4dcc6,#f9efe4);`,
      page: `background:rgba(255,255,255,0.92);border-radius:20px;box-shadow:0 20px 50px rgba(61,64,91,0.18)`,
      tab: `font:500 15px 'Segoe UI',sans-serif;padding:9px 14px;color:#8a8ca3`,
      tabOn: `font:600 15px 'Segoe UI',sans-serif;padding:9px 14px;color:#3d405b;border-bottom:2px solid #e07a5f`,
      card: `background:#fff;border-radius:16px;box-shadow:0 6px 20px rgba(61,64,91,0.08)`,
      price: `font:600 22px 'Segoe UI',sans-serif;color:#3d405b`,
      button: `background:#3d405b;color:#fff;font:600 17px 'Segoe UI',sans-serif;border-radius:12px;padding:14px 30px`,
      chip: `border-radius:10px;padding:3px 10px;font-size:12px;background:#f4f1de;color:#6b6d84`,
      heading: `font:300 28px 'Segoe UI Light','Segoe UI',sans-serif;color:#3d405b;letter-spacing:0.5px`,
    },
  };
  const l = look[s.id];
  const chefSvg = `<svg width="210" height="230" viewBox="0 0 210 230"><defs>${s.defs}</defs><g ${s.sceneFilter ? `filter="${s.sceneFilter}"` : ''}>
    <circle cx="105" cy="120" r="92" fill="${s.id === 'flat' ? '#f4f1de' : s.id === 'toy' ? '#fff3c4' : '#f3e7cf'}"/>
    ${s.person({ x: 105, y: 262, kind: 'chef', scale: 3.1, seated: true })}</g></svg>`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; }
    body { ${l.bg} font-family: ${s.font}; color: ${s.pal.ink}; }
    .page { position: absolute; left: 70px; right: 70px; top: 22px; bottom: 22px; ${l.page}; display: flex; flex-direction: column; overflow: hidden; }
    .tabs { display: flex; gap: 6px; padding: 14px 20px 6px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr 300px; gap: 14px; padding: 10px 20px; flex: 1; }
    .card { ${l.card}; display: flex; gap: 12px; align-items: center; padding: 10px 14px; }
    .card h3 { margin: 0; font: 700 18px ${s.headingFont}; }
    .card p { margin: 2px 0 6px; font-size: 13px; opacity: 0.75; }
    .chip { ${l.chip}; display: inline-block; margin-right: 4px; }
    .price { ${l.price}; margin-left: auto; text-align: right; }
    .step { display: inline-block; width: 30px; height: 30px; line-height: 30px; text-align: center; margin-left: 4px; border-radius: 8px; background: rgba(0,0,0,0.06); font-weight: 700; font-size: 16px; }
    .chef { ${l.card}; grid-row: span 2; padding: 14px; text-align: center; }
    .chef h3 { margin: 4px 0 0; font: 700 22px ${s.headingFont}; }
    footer { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px 16px; }
  </style></head><body>
  <div class="page">
    <div class="tabs">${tabs.map((t) => `<div style="${t === 'Menu' ? l.tabOn : l.tab}">${t}</div>`).join('')}</div>
    <div style="padding:2px 22px;${l.heading}">Your menu <span style="font-size:15px;opacity:0.6">· 4 of 6 dishes</span></div>
    <div class="grid">
      ${dishes
        .map(
          ([k, n, d, p], i) => `<div class="card" style="grid-column:${(i % 2) + 1}">${food(s, k, 76)}<div><h3>${n}</h3><p>${d}</p><span class="chip">polish</span><span class="chip">homemade</span></div><div class="price">${p}<div><span class="step">−</span><span class="step">+</span></div></div></div>`,
        )
        .join('')}
      <div class="chef" style="grid-column:3;grid-row:1 / span 2">${chefSvg}<h3>Pani Krystyna</h3><div style="font-size:14px;opacity:0.75">Chef · Polish cooking · ★★★☆☆</div><p style="font-size:13px;margin:8px 0 0">“Has made pierogi every Sunday since 1979 and sees no reason to stop now.”</p></div>
    </div>
    <footer><span style="font-size:14px;opacity:0.7">🌱 Fresh today: strawberries, new potatoes</span><span style="${l.button}">Open the restaurant</span></footer>
  </div>
  </body></html>`;
}

/** Everyone, big: the five kinds of guest, a granny, and the team. */
function peoplePage(s: Style): string {
  const kinds: [PersonOpts['kind'], string][] = [
    ['tourist', 'Tourist'],
    ['student', 'Student'],
    ['local', 'Local'],
    ['office', 'Office worker'],
    ['foodie', 'Foodie'],
    ['granny', 'Regular'],
    ['waiter', 'Waiter'],
    ['chef', 'Chef'],
  ];
  const bg = s.id === 'toy' ? 'linear-gradient(#7ec8ff,#d9f1ff)' : s.id === 'flat' ? 'linear-gradient(#f4dcc6,#f9efe4)' : '#efe3c8';
  const figures = kinds
    .map(([kind], i) => {
      const x = 95 + i * 160;
      return `<ellipse cx="${x}" cy="455" rx="44" ry="10" fill="#3a2a2a" opacity="0.15"/>` + s.person({ x, y: 455, kind, scale: 3.0, look: i % 2 ? 1 : -1 });
    })
    .join('');
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; width: ${W}px; height: ${H}px; overflow: hidden; background: ${bg}; font-family: ${s.font}; color: ${s.pal.ink}; }
    h1 { position: absolute; left: 40px; top: 18px; margin: 0; font: 700 28px ${s.headingFont}; }
    .names { position: absolute; top: 490px; left: 0; width: 100%; }
    .names span { position: absolute; width: 160px; text-align: center; font: 600 17px ${s.headingFont}; }
  </style></head><body>
  <h1>${s.title}: the people of Gdańsk</h1>
  <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0"><defs>${s.defs}</defs><g ${s.sceneFilter ? `filter="${s.sceneFilter}"` : ''}>${figures}</g>${s.light()}</svg>
  <div class="names">${kinds.map(([, name], i) => `<span style="left:${15 + i * 160}px">${name}</span>`).join('')}</div>
  </body></html>`;
}

mkdirSync(OUT, { recursive: true });
for (const s of [storybook, toy, flat]) {
  writeFileSync(`${OUT}/${s.id}-day.html`, dayPage(s));
  writeFileSync(`${OUT}/${s.id}-evening.html`, dayPage(s, true));
  writeFileSync(`${OUT}/${s.id}-people.html`, peoplePage(s));
  writeFileSync(`${OUT}/${s.id}-menu.html`, menuPage(s));
  console.log(`${OUT}/${s.id}-day.html`, `${OUT}/${s.id}-menu.html`);
}
