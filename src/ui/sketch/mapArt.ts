// The Old Town map in ink and wash (project.md section 9.5, M8): a page of a travel sketchbook, the
// town seen from above at a slight tilt. Blocks of gabled townhouses in sorbet colours with green
// courtyards, pale cobbled streets, the Motława with Granary Island, and the landmarks drawn standing
// up: St Mary's, the Town Hall, the Green Gate, the Żuraw, Neptune. The street plan is the old pixel
// map's, four times bigger, so every street's marker stays where it was.

import { folkBand, rosette } from './motifs';
import type { Painter } from './painter';
import { dark, HAND, light } from './palette';

/** The plan below is in the old map's units; the picture is drawn this many times bigger. */
const K = 4;
const PLAN_W = 336;
const PLAN_H = 204;
export const SKETCH_MAP_W = PLAN_W * K;
export const SKETCH_MAP_H = PLAN_H * K;

/** A street's map position (metres east, metres north, as in data/locations.ts) on the picture. */
export function sketchMapPoint(x: number, north: number): { x: number; y: number } {
  const scale = PLAN_W / 900;
  return { x: Math.round((x - 150) * scale) * K, y: Math.round((-north + 330) * scale) * K };
}

// ---------- The plan of the town (in the old map's units) ----------

/** North–south lanes: their middle and width. */
const LANES = [
  { x: 65, w: 5 },
  { x: 121, w: 5 },
  { x: 167, w: 6 },
  { x: 212, w: 5 },
];
const QUAY = { x0: 252, x1: 264 };
const RIVER = { x0: 264, x1: 279 };
const NEW_RIVER = { x0: 322, x1: PLAN_W };

interface Street {
  x0: number;
  x1: number;
  y: number;
  w: number;
}
const STREETS: Street[] = [
  { x0: 0, x1: QUAY.x0, y: 8, w: 5 },
  { x0: 0, x1: 167, y: 54, w: 7 }, // Piwna
  { x0: 167, x1: QUAY.x0, y: 46, w: 7 }, // Mariacka
  { x0: 0, x1: QUAY.x0, y: 88, w: 5 },
  { x0: 0, x1: 167, y: 128, w: 9 }, // Długa
  { x0: 167, x1: QUAY.x0, y: 128, w: 15 }, // Długi Targ, the market square
  { x0: 0, x1: QUAY.x0, y: 166, w: 7 }, // Ogarna
];
const ISLAND = { x0: RIVER.x1, x1: NEW_RIVER.x0 };
const ISLAND_SPINE = { x: 301, w: 5 };
const ISLAND_STREETS: Street[] = [
  { x0: ISLAND.x0, x1: ISLAND.x1, y: 46, w: 9 },
  { x0: ISLAND.x0, x1: ISLAND.x1, y: 88, w: 7 },
  { x0: ISLAND.x0, x1: ISLAND.x1, y: 128, w: 11 },
  { x0: ISLAND.x0, x1: ISLAND.x1, y: 166, w: 7 },
];
/** The Green Bridge, straight on from the Green Gate, and a second bridge in line with Mariacka. */
const BRIDGES = [
  { y: 128, w: 9 },
  { y: 46, w: 7 },
];
/** St Mary's fills the block north of Piwna. */
const CHURCH = { x0: 72, x1: 162, y0: 22, y1: 50 };

interface Block {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
}

/** The blocks of houses: everything between the streets and the lanes, which wander a little. */
function blocks(): Block[] {
  const wander = (lane: number, row: number) => [0, 2, -2, 1, -1, 3, -3][(lane * 5 + row * 3) % 7];
  const result: Block[] = [];
  for (let c = 0; c <= LANES.length; c++) {
    const baseMid = ((c === 0 ? 0 : LANES[c - 1].x) + (c === LANES.length ? QUAY.x0 : LANES[c].x)) / 2;
    const across = STREETS.filter((s) => baseMid >= s.x0 && baseMid < s.x1).sort((a, b) => a.y - b.y);
    const bands: [number, number][] = [];
    let top = 0;
    for (const s of across) {
      bands.push([top + 1, Math.floor(s.y - s.w / 2)]);
      top = Math.ceil(s.y + s.w / 2);
    }
    bands.push([top + 1, PLAN_H + 4]);
    bands.forEach(([y0, y1], row) => {
      const left = c === 0 ? -4 : LANES[c - 1].x + Math.ceil(LANES[c - 1].w / 2) + wander(c - 1, row);
      const right = c === LANES.length ? QUAY.x0 : LANES[c].x - Math.ceil(LANES[c].w / 2) + wander(c, row);
      result.push({ x0: left + 1, x1: right - 1, y0, y1 });
    });
  }
  return result;
}

/** Granary Island's blocks: either side of its middle street, between the streets across it. */
function islandBlocks(): Block[] {
  const columns: [number, number][] = [
    [ISLAND.x0 + 2, ISLAND_SPINE.x - Math.ceil(ISLAND_SPINE.w / 2) - 1],
    [ISLAND_SPINE.x + Math.ceil(ISLAND_SPINE.w / 2) + 1, ISLAND.x1 - 2],
  ];
  const result: Block[] = [];
  for (const [x0, x1] of columns) {
    let top = 0;
    for (const s of ISLAND_STREETS) {
      result.push({ x0, x1, y0: top + 1, y1: Math.floor(s.y - s.w / 2) });
      top = Math.ceil(s.y + s.w / 2);
    }
    result.push({ x0, x1, y0: top + 1, y1: PLAN_H + 4 });
  }
  return result;
}

/** A little seeded random generator, so the town is drawn the same way every time. */
function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const FACADES = ['facadeA', 'facadeB', 'facadeC', 'facadeD', 'facadeE', '#f1e4c9', '#e9d3a6'];
const ROOFS = ['#c4674a', '#b85a3e', '#cf7a52', '#a9503a'];
const COURTYARD = '#c9dcb0';
const COBBLES = '#eadcc2';
const WATER = '#9cc6dc';
const BRICK = '#b9694c';

// ---------- Drawing ----------

/** A row of townhouses seen from above at a tilt: a red roof, and the front wall with its gable and windows below it. */
function houseRow(pt: Painter, rnd: () => number, x0: number, x1: number, front: number, depth: number, fronts: boolean): string {
  let g = '';
  let x = x0;
  while (x < x1 - 10) {
    const w = Math.min(x1 - x, 22 + Math.floor(rnd() * 18));
    const roof = ROOFS[Math.floor(rnd() * ROOFS.length)];
    const wall = FACADES[Math.floor(rnd() * FACADES.length)];
    const wallH = fronts ? 20 : 0;
    const roofTop = front - wallH - depth;
    g += pt.fill(`M${x},${front - wallH} L${x},${roofTop + 4} Q${x + w / 2},${roofTop - 2} ${x + w},${roofTop + 4} L${x + w},${front - wallH} Z`, roof);
    g += pt.line(`M${x + w / 2},${roofTop + 1} V${front - wallH - 2}`, dark(roof, 0.3), 1);
    if (fronts) {
      // The gable rises over the wall in the wall's colour, stepped or pointed.
      const peak = rnd() < 0.5;
      g += pt.fill(
        peak
          ? `M${x},${front} V${front - wallH} L${x + w / 2},${front - wallH - 8} L${x + w},${front - wallH} V${front} Z`
          : `M${x},${front} V${front - wallH} h${w * 0.25} v-4 h${w * 0.5} v4 h${w * 0.25} V${front} Z`,
        wall,
      );
      for (let wx = x + 5; wx < x + w - 5; wx += 8) g += `<rect x="${wx}" y="${front - 15}" width="3.5" height="6" fill="#5f7d93" opacity="0.8"/>`;
    }
    x += w;
  }
  return g;
}

/** A block: houses along its south side (fronts to the street), roofs along its north side, a courtyard with trees between. */
function block(pt: Painter, rnd: () => number, b: Block, island: boolean): string {
  const x0 = b.x0 * K;
  const x1 = b.x1 * K;
  const y0 = b.y0 * K;
  const y1 = Math.min(b.y1, PLAN_H + 2) * K;
  if (x1 - x0 < 16 || y1 - y0 < 16) return '';
  let g = pt.rect(x0, y0, x1 - x0, y1 - y0, island ? '#d8c9a4' : COURTYARD, 6);
  if (island) {
    // A granary filling the block: tall brick under a dark roof, its stepped gable to the street, rows of hatches.
    const w = x1 - x0 - 4;
    const top = y0 + Math.max(6, (y1 - y0) * 0.12);
    const wallTop = y1 - Math.min(70, (y1 - y0) * 0.55);
    g += pt.fill(`M${x0 + 2},${wallTop} L${x0 + 2},${top + 8} L${x0 + 2 + w / 2},${top} L${x0 + 2 + w},${top + 8} L${x0 + 2 + w},${wallTop} Z`, '#7a3f2e');
    g += pt.fill(`M${x0 + 2},${y1 - 2} V${wallTop} h${w * 0.2} v-8 h${w * 0.2} v-8 h${w * 0.2} v8 h${w * 0.2} v8 h${w * 0.2} V${y1 - 2} Z`, BRICK);
    for (let wy = wallTop + 4; wy < y1 - 12; wy += 13) for (const dx of [0.3, 0.7]) g += `<rect x="${x0 + 2 + w * dx - 3}" y="${wy}" width="6" height="7" fill="${dark(BRICK, 0.45)}"/>`;
    return g;
  }
  const height = y1 - y0;
  const backDepth = Math.min(38, height * 0.32);
  if (height > 50) g += houseRow(pt, rnd, x0, x1, y0 + backDepth, backDepth - 2, false);
  // Trees in the courtyard, if there's room.
  const frontDepth = Math.min(46, height * 0.4);
  if (height - backDepth - frontDepth - 20 > 24)
    for (let tx = x0 + 22; tx < x1 - 18; tx += 46 + Math.floor(rnd() * 20)) {
      const ty = y0 + backDepth + 14 + rnd() * Math.max(2, height - backDepth - frontDepth - 44);
      g += pt.circle(tx, ty, 8 + rnd() * 4, rnd() < 0.5 ? 'green' : light(pt.p.green, 0.25));
    }
  g += houseRow(pt, rnd, x0, x1, y1, frontDepth - 20, true);
  return g;
}

function streetsAndRiver(pt: Painter): string {
  const p = pt.p;
  let g = `<rect x="0" y="0" width="${SKETCH_MAP_W}" height="${SKETCH_MAP_H}" fill="${COBBLES}"/>`;
  // A few cobbles along the wider streets.
  for (const s of STREETS)
    if (s.w >= 7) for (let x = s.x0 * K + 10; x < s.x1 * K - 10; x += 26) g += `<path d="M${x},${s.y * K - 3} h8" stroke="${dark(COBBLES, 0.12)}" stroke-width="1.5"/>`;
  // The quay, the Motława, the New Motława, and Granary Island between them.
  g += pt.rect(QUAY.x0 * K, -6, (QUAY.x1 - QUAY.x0) * K, SKETCH_MAP_H + 12, '#d3c3a2');
  for (const river of [RIVER, NEW_RIVER]) {
    g += `<rect x="${river.x0 * K}" y="-6" width="${(river.x1 - river.x0) * K + 6}" height="${SKETCH_MAP_H + 12}" fill="${WATER}" filter="url(#wash)"/>`;
    g += pt.line(`M${river.x0 * K},-6 V${SKETCH_MAP_H + 6}`, 'ink', 1.4);
    for (let y = 20; y < SKETCH_MAP_H; y += 34) g += pt.line(`M${river.x0 * K + 10 + ((y * 7) % 22)},${y} q5,-4 10,0 q5,-4 10,0`, '#ffffff', 1.4);
  }
  g += `<rect x="${ISLAND.x0 * K}" y="-6" width="${(ISLAND.x1 - ISLAND.x0) * K}" height="${SKETCH_MAP_H + 12}" fill="${COBBLES}"/>`;
  g += pt.line(`M${ISLAND.x0 * K},-6 V${SKETCH_MAP_H + 6} M${ISLAND.x1 * K},-6 V${SKETCH_MAP_H + 6}`, 'ink', 1.4);
  // Bridges over the Motława: a stone deck with wooden rails.
  for (const b of BRIDGES) {
    const top = (b.y - b.w / 2) * K;
    const h = b.w * K;
    g += pt.rect(RIVER.x0 * K - 6, top, (RIVER.x1 - RIVER.x0) * K + 12, h, '#d9cdb4');
    g += pt.line(`M${RIVER.x0 * K - 6},${top + 3} H${RIVER.x1 * K + 6} M${RIVER.x0 * K - 6},${top + h - 3} H${RIVER.x1 * K + 6}`, p.beam, 2.4);
  }
  return g;
}

/** St Mary's: the great brick hall church under its steep roof, with the massive square tower. */
function stMarys(pt: Painter): string {
  const { x0, x1, y0, y1 } = CHURCH;
  const nave = { x0: (x0 + 16) * K, x1: x1 * K, top: y0 * K, bottom: y1 * K };
  let g = pt.fill(`M${nave.x0},${nave.bottom - 30} V${nave.top + 10} L${nave.x0 + 16},${nave.top - 18} H${nave.x1 - 16} L${nave.x1},${nave.top + 10} V${nave.bottom - 30} Z`, '#8e4a36');
  for (let x = nave.x0 + 30; x < nave.x1 - 20; x += 44) g += pt.fill(`M${x},${nave.top - 14} l14,-24 l14,24 Z`, BRICK);
  g += pt.rect(nave.x0, nave.bottom - 30, nave.x1 - nave.x0, 30, BRICK);
  for (let x = nave.x0 + 14; x < nave.x1 - 10; x += 22) g += pt.fill(`M${x},${nave.bottom - 4} V${nave.bottom - 18} q4,-8 8,0 V${nave.bottom - 4} Z`, '#5f7d93');
  // The tower, standing up above everything.
  const tx = x0 * K;
  const tw = 17 * K;
  const top = y0 * K - 70;
  g += pt.rect(tx, top, tw, y1 * K - top, BRICK);
  for (let k = 0; k < 4; k++) g += pt.rect(tx + 2 + (k * (tw - 14)) / 3, top - 14, 10, 16, BRICK);
  for (let y = top + 16; y < y1 * K - 20; y += 30) g += `<rect x="${tx + tw / 2 - 5}" y="${y}" width="10" height="20" rx="5" fill="${dark(BRICK, 0.4)}"/>`;
  return g;
}

/** The Main Town Hall on Długa, its slender green spire and golden king. */
function townHall(pt: Painter): string {
  const x0 = 150 * K;
  const w = 12 * K;
  const bottom = 124 * K;
  const cx = x0 + w / 2;
  let g = pt.rect(x0, bottom - 40, w, 40, '#d9a27f');
  g += pt.rect(cx - 9, bottom - 96, 18, 58, BRICK);
  g += pt.fill(`M${cx - 12},${bottom - 96} L${cx},${bottom - 140} L${cx + 12},${bottom - 96} Z`, '#4f7f6a');
  g += pt.circle(cx, bottom - 144, 4, 'yellow');
  g += `<circle cx="${cx}" cy="${bottom - 80}" r="5" fill="#fffaf0" stroke="${pt.p.ink}" stroke-width="1"/>`;
  return g;
}

/** The Green Gate across the end of Długi Targ, by the river. */
function greenGate(pt: Painter): string {
  const x0 = 236 * K;
  const w = 16 * K;
  const bottom = 138 * K;
  let g = pt.fill(`M${x0},${bottom} V${bottom - 46} h${w * 0.2} v-10 h${w * 0.2} v-10 h${w * 0.2} v10 h${w * 0.2} v10 h${w * 0.2} V${bottom} Z`, '#c98f5a');
  for (const dx of [0.2, 0.5, 0.8]) g += pt.fill(`M${x0 + w * dx - 6},${bottom} V${bottom - 16} q6,-8 12,0 V${bottom} Z`, '#5a3a28');
  return g;
}

/** The Żuraw, the medieval wooden crane on the quay, with its beam out over the water. */
function crane(pt: Painter): string {
  const x0 = 253 * K;
  const w = 10 * K;
  const bottom = 79 * K;
  let g = pt.rect(x0 - 4, bottom - 34, w + 8, 34, BRICK);
  g += pt.rect(x0 + 2, bottom - 96, w - 4, 64, '#6b5140');
  g += pt.fill(`M${x0},${bottom - 96} L${x0 + w / 2},${bottom - 124} L${x0 + w},${bottom - 96} Z`, '#3a3236');
  g += pt.line(`M${x0 + w - 2},${bottom - 84} l18,-4`, '#4a3a30', 3);
  return g;
}

function neptune(pt: Painter): string {
  const cx = 196 * K;
  const cy = 131 * K;
  return `<ellipse cx="${cx}" cy="${cy}" rx="18" ry="9" fill="${WATER}" stroke="${pt.p.ink}" stroke-width="1.3"/>` + pt.line(`M${cx},${cy - 2} V${cy - 30} M${cx - 6},${cy - 30} V${cy - 36} M${cx + 6},${cy - 30} V${cy - 36} M${cx - 6},${cy - 30} H${cx + 6}`, '#c99a2e', 2.4);
}

function boat(pt: Painter, cx: number, cy: number): string {
  return pt.fill(`M${cx - 18},${cy} h36 l-6,8 h-24 Z`, '#8a5534') + pt.fill(`M${cx},${cy - 2} V${cy - 30} L${cx + 16},${cy - 4} Z`, '#fffaf0');
}

/** A compass rose with a Kashubian rosette at its heart, over the water in a corner. */
function compass(pt: Painter, x: number, y: number): string {
  let g = '';
  for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) g += pt.fill(`M${x + dx * 40},${y + dy * 40} L${x + dy * 8},${y - dx * 8} L${x - dy * 8},${y + dx * 8} Z`, dy === -1 ? 'red' : '#fffaf0');
  g += rosette(pt, x, y, 10, 'blue');
  g += `<text x="${x}" y="${y - 46}" text-anchor="middle" font-family="${HAND}" font-size="20" font-weight="700" fill="${pt.p.ink}">N</text>`;
  return g;
}

const note = (text: string, x: number, y: number, size = 22, colour = '#2f5f86') =>
  `<text x="${x}" y="${y}" text-anchor="middle" font-family="${HAND}" font-size="${size}" font-weight="700" fill="${colour}" stroke="#fbf6ea" stroke-width="4" paint-order="stroke">${text}</text>`;

/** The whole map, drawn once and baked. */
export function oldTownMapPicture(pt: Painter): string {
  const rnd = random(1980);
  let g = streetsAndRiver(pt);
  const town = blocks().filter((b) => !(b.x0 < CHURCH.x1 && b.x1 > CHURCH.x0 + 10 && b.y0 < CHURCH.y1 && b.y1 > CHURCH.y0 + 4));
  // From north to south, so nearer roofs cover those behind; the landmarks in among them.
  const landmarks: { y: number; draw: () => string }[] = [
    { y: CHURCH.y1, draw: () => stMarys(pt) },
    { y: 124, draw: () => townHall(pt) },
    { y: 138, draw: () => greenGate(pt) },
    { y: 79, draw: () => crane(pt) },
  ];
  const all = [...town.map((b) => ({ y: b.y1, draw: () => block(pt, rnd, b, false) })), ...islandBlocks().map((b) => ({ y: b.y1, draw: () => block(pt, rnd, b, true) })), ...landmarks];
  // A church block is drawn round the church; draw the grass of that block first.
  g += pt.rect(CHURCH.x0 * K - 6, (CHURCH.y0 - 14) * K, (CHURCH.x1 - CHURCH.x0) * K + 10, (CHURCH.y1 - CHURCH.y0 + 12) * K, COURTYARD, 6);
  for (const piece of all.sort((a, b) => a.y - b.y)) g += piece.draw();
  g += neptune(pt);
  g += boat(pt, 271 * K, 104 * K) + boat(pt, 329 * K, 172 * K);
  // Handwritten names, a compass and a folk border round the page.
  g += note('St Mary’s', 117 * K, 6 * K + 8);
  g += note('Motława', 271 * K, 186 * K, 22);
  g += `<g transform="rotate(-90 ${307 * K} ${24 * K})">${note('Granary Island', 307 * K, 24 * K, 20)}</g>`;
  g += note('Żuraw', 258 * K, 86 * K, 18);
  g += note('Green Gate', 244 * K, 146 * K, 18);
  g += compass(pt, SKETCH_MAP_W - 58, SKETCH_MAP_H - 74);
  g += `<rect x="6" y="6" width="${SKETCH_MAP_W - 12}" height="${SKETCH_MAP_H - 12}" fill="none" stroke="${pt.p.ink}" stroke-width="3"/>`;
  g += folkBand(pt, 6, SKETCH_MAP_H - 20, SKETCH_MAP_W - 12, 14, ['red', 'yellow', 'blue']);
  for (const [x, y] of [[20, 20], [SKETCH_MAP_W - 20, 20], [20, SKETCH_MAP_H - 20], [SKETCH_MAP_W - 20, SKETCH_MAP_H - 20]]) g += rosette(pt, x, y, 12, 'red');
  g += `<rect width="${SKETCH_MAP_W}" height="${SKETCH_MAP_H}" filter="url(#grain)"/>`;
  return g;
}
