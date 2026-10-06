// The pictures of the restaurant seen from the front (project.md section 9.5): the room itself,
// the kitchen counter in front of the chefs, the tables and chairs, and the plates. Each is SVG
// text in page units, baked into a picture once (bake.ts). People are drawn in sheets.ts.

import type { DecorId } from '../../data/decor';
import type { EquipmentId } from '../../data/dishes';
import type { Weather } from '../../data/weather';
import { CLOTH, type FrontLayout } from './frontRoom';
import { bunting, folkBand, hatch as hatching, rosette, tulip } from './motifs';
import type { Painter } from './painter';
import { dark, HAND, light, mix } from './palette';
import { mewa } from './people';

/** Everything the room's picture shows that can change from day to day. */
export interface RoomLook {
  decor: readonly DecorId[];
  equipment: readonly EquipmentId[];
  weather: Weather;
  dusk: boolean;
  /** The golden hour before the evening: a warm sky in the windows. */
  golden?: boolean;
  /**
   * Lit live by the day view (section 9.5, "Light and weather"): the picture leaves out its own lamp glows and
   * the evening's blue, which the view lays over everything, people too, and fades in.
   */
  live?: boolean;
  /** The brass plaque of an Old Town Favourite. */
  plaque: boolean;
  /** Up to three of today's dishes for the chalkboard: a short name and the price. */
  specials: { name: string; price: number }[];
}

const SKY: Record<Weather, string> = { sunny: '#b9dbea', heatwave: '#f2dcb0', cloudy: '#cdd6dc', rain: '#a3b2be' };
const DUSK_SKY = '#4a5a8a';
const GOLDEN_SKY = '#f3c48e';

/** The sky in the windows and the door: the weather's by day, warm in the golden hour, blue in the evening. */
const skyOf = (look: RoomLook) => (look.dusk ? DUSK_SKY : look.golden ? GOLDEN_SKY : SKY[look.weather]);

// ---------- The room ----------

/** The whole room behind the people: walls, windows onto the street, the bar, the door, the kitchen and the floor. */
export function roomPicture(pt: Painter, L: FrontLayout, look: RoomLook): string {
  const has = (d: DecorId) => look.decor.includes(d);
  let g = wall(pt, L) + windows(pt, L, look) + panelling(pt, L, has('panelling'), has('azulejoTiles'));
  g += wallDecor(pt, L, look);
  g += bar(pt, L, look);
  g += door(pt, L, look);
  g += kitchen(pt, L, look);
  g += floor(pt, L);
  g += lights(pt, L, look);
  g += `<rect width="${L.width}" height="${L.height}" filter="url(#grain)"/>`;
  if (look.dusk && !look.live) g += `<rect width="${L.width}" height="${L.height}" fill="#2c3a66" opacity="0.22"/>`;
  return g;
}

function wall(pt: Painter, L: FrontLayout): string {
  let g = pt.rect(-10, 20, L.width + 20, L.floorY - 20, 'wall');
  for (let x = 60; x < L.width - 40; x += 90)
    for (let y = 80; y < L.floorY - 90; y += 90)
      g += ((x + y) / 90) % 2 ? tulip(pt, x, y + 16, 28, ['red', 'blue'][((x / 90) | 0) % 2]) : rosette(pt, x, y, 9, ['red', 'blue', 'green'][((x + y) / 90) % 3 | 0]);
  g += pt.rect(-10, 22, L.width + 20, 24, 'beam');
  for (let x = 100; x < L.width - 60; x += 180) g += pt.rect(x, 22, 26, 36, 'beam');
  g += hatching(pt, 0, 46, L.width, 12, 6, 0.25);
  // Paper-cut bunting in swags across the room.
  const from = L.bar.x1 + 20;
  const to = L.door.x - L.door.width / 2 - 20;
  const swags = Math.max(1, Math.round((to - from) / 320));
  for (let k = 0; k < swags; k++) g += bunting(pt, from + ((to - from) * k) / swags, from + ((to - from) * (k + 1)) / swags, 54, 10);
  return g;
}

/** Windows onto Długi Targ: sky for the weather, gables, St Mary's, the Town Hall and Neptune, curtains and geraniums. */
function windows(pt: Painter, L: FrontLayout, look: RoomLook): string {
  const sky = skyOf(look);
  const facades = ['facadeA', 'facadeB', 'facadeC', 'facadeD', 'facadeE'];
  let g = '';
  L.windows.forEach(({ x: wx, w: ww, top, sill }, i) => {
    const arch = `M${wx},${sill} L${wx},${top + 60} Q${wx},${top} ${wx + ww / 2},${top - 4} Q${wx + ww},${top} ${wx + ww},${top + 60} L${wx + ww},${sill} Z`;
    const clip = pt.id('win');
    let view = pt.fill(arch, sky);
    if (!look.dusk && (look.weather === 'sunny' || look.weather === 'heatwave') && i === 0) view += `<circle cx="${wx + 30}" cy="${top + 40}" r="${look.weather === 'heatwave' ? 18 : 13}" fill="#ffe08a" filter="url(#wash)"/>`;
    const clouds = look.weather === 'cloudy' || look.weather === 'rain' ? 3 : look.weather === 'sunny' ? 1 : 0;
    for (let c = 0; c < clouds; c++)
      view += `<g filter="url(#wash)" opacity="0.95"><ellipse cx="${wx + 30 + ((i * 37 + c * 41) % 80)}" cy="${top + 30 + c * 22}" rx="${26 + c * 4}" ry="10" fill="${look.weather === 'rain' ? '#d4dbe0' : '#fffaf0'}"/><ellipse cx="${wx + 48 + ((i * 37 + c * 41) % 80)}" cy="${top + 24 + c * 22}" rx="16" ry="10" fill="${look.weather === 'rain' ? '#d4dbe0' : '#fffaf0'}"/></g>`;
    if (look.weather !== 'rain' && !look.dusk) view += pt.line(`M${wx + 80 - i * 20},${top + 50 + i * 10} q5,-5 10,0 q5,-5 10,0`, 'ink', 1.2);
    // The houses across the street, and a landmark or two.
    const houseTop = Math.max(top + 70, sill - 150);
    if (i === 0) view += pt.rect(wx + 70, houseTop - 70, 46, sill - houseTop + 70, '#c27a5c') + [0, 1, 2, 3].map((k) => pt.rect(wx + 72 + k * 11, houseTop - 78, 7, 9, '#c27a5c')).join('');
    if (i === L.windows.length - 1 && i > 0)
      view += pt.rect(wx + 54, houseTop - 60, 22, sill - houseTop + 60, '#d9a079') + pt.fill(`M${wx + 52},${houseTop - 58} L${wx + 65},${houseTop - 104} L${wx + 78},${houseTop - 58} Z`, '#4f7f6a') + pt.circle(wx + 65, houseTop - 106, 3.5, 'yellow');
    for (let k = 0; k < 3; k++) {
      const fx = wx + 2 + k * 43;
      const t = houseTop + ((i * 3 + k) % 3) * 16;
      view += pt.fill(`M${fx},${sill} L${fx},${t + 18} L${fx + 10},${t + 18} L${fx + 10},${t + 7} L${fx + 20},${t} L${fx + 30},${t + 7} L${fx + 30},${t + 18} L${fx + 41},${t + 18} L${fx + 41},${sill} Z`, facades[(i * 3 + k) % 5]);
      for (let r = 0; t + 30 + r * 28 < sill - 14; r++) {
        const lit = look.dusk ? '#ffd98a' : dark(sky, 0.25);
        view += `<rect x="${fx + 7}" y="${t + 30 + r * 28}" width="9" height="14" rx="4" fill="${lit}"/><rect x="${fx + 25}" y="${t + 30 + r * 28}" width="9" height="14" rx="4" fill="${lit}"/>`;
      }
    }
    if (i === 1 || (L.windows.length === 1 && i === 0))
      view += pt.rect(wx + 44, sill - 30, 42, 26, 'steel') + pt.fill(`M${wx + 65},${sill - 30} l-5,-40 l5,-9 l5,9 l-5,40 Z`, '#3f8a7a') + pt.line(`M${wx + 76},${sill - 70} l0,-30 M${wx + 72},${sill - 100} l4,-7 l4,7`, '#3f8a7a', 2.5);
    if (look.weather === 'rain') for (let k = 0; k < 14; k++) view += `<path d="M${wx + ((k * 29) % ww)},${top + ((k * 53) % (sill - top))} l-4,14" stroke="#eef4f8" stroke-width="1.3" opacity="0.8"/>`;
    g += `<clipPath id="${clip}"><path d="${arch}"/></clipPath><g clip-path="url(#${clip})">${view}</g>`;
    // Frame and glazing bars, curtains tied back, and geraniums on the sill.
    g += pt.line(arch, 'white', 7) + pt.line(`M${wx + ww / 2},${top} L${wx + ww / 2},${sill} M${wx},${top + (sill - top) * 0.45} L${wx + ww},${top + (sill - top) * 0.45}`, 'white', 4.5);
    const cTop = top - 8;
    g +=
      pt.fill(`M${wx - 16},${cTop} Q${wx + 6},${cTop + 60} ${wx - 4},${cTop + (sill - cTop) * 0.55} Q${wx - 14},${sill - 40} ${wx - 20},${sill} L${wx - 28},${sill} L${wx - 28},${cTop} Z`, 'red') +
      pt.fill(`M${wx + ww + 16},${cTop} Q${wx + ww - 6},${cTop + 60} ${wx + ww + 4},${cTop + (sill - cTop) * 0.55} Q${wx + ww + 14},${sill - 40} ${wx + ww + 20},${sill} L${wx + ww + 28},${sill} L${wx + ww + 28},${cTop} Z`, 'red');
    g += pt.rect(wx - 10, sill - 4, ww + 20, 10, 'white') + hatching(pt, wx - 10, sill + 6, ww + 20, 7, 5);
    for (let k = 0; k < 3; k++)
      g += pt.rect(wx + 10 + k * 40, sill - 20, 22, 16, 'copper', 3) + pt.circle(wx + 16 + k * 40, sill - 26, 7, 'green') + pt.circle(wx + 27 + k * 40, sill - 28, 6, 'green') + pt.circle(wx + 21 + k * 40, sill - 33, 5, k % 2 ? 'red' : '#f07a8a');
  });
  return g;
}

/** Panelling under the dado rail with an embroidered band: plain, carved oak, or azulejo tiles. */
function panelling(pt: Painter, L: FrontLayout, carved: boolean, azulejo: boolean): string {
  const dado = L.floorY - 64;
  let g = pt.rect(-10, dado, L.width + 20, 64, carved ? '#7a4a2c' : 'panel');
  for (let x = 20; x < L.width - 40; x += 74) {
    g += pt.rect(x, dado + 14, 60, 42, carved ? '#8a5836' : 'panel2', 4);
    if (carved) g += rosette(pt, x + 30, dado + 35, 9, 'yellow');
  }
  if (azulejo)
    for (let x = 20; x < L.width - 40; x += 148) {
      g += pt.rect(x, dado + 10, 60, 48, '#f4f7f9', 2);
      for (let k = 0; k < 4; k++) g += `<path d="M${x + 15 + (k % 2) * 30},${dado + 16 + (k >> 1) * 22} l9,9 l-9,9 l-9,-9 Z" fill="#2f5f9a"/><circle cx="${x + 15 + (k % 2) * 30}" cy="${dado + 25 + (k >> 1) * 22}" r="2.4" fill="#f4f7f9"/>`;
    }
  g += pt.rect(-10, dado - 8, L.width + 20, 10, 'beam');
  g += folkBand(pt, -10, dado + 2, L.width + 20, 12, ['yellow', 'red', 'blue']);
  g += hatching(pt, 0, L.floorY - 10, L.width, 12, 5, 0.25);
  return g;
}

/** The bare stretches of wall: before the first window, between windows, and up to the door. */
function wallGaps(L: FrontLayout): { x: number; w: number }[] {
  const edges = [L.bar.x1, ...L.windows.flatMap((w) => [w.x - 30, w.x + w.w + 30]), L.door.x - L.door.width / 2 - 20];
  const gaps: { x: number; w: number }[] = [];
  for (let i = 0; i + 1 < edges.length; i += 2) if (edges[i + 1] - edges[i] > 50) gaps.push({ x: (edges[i] + edges[i + 1]) / 2, w: edges[i + 1] - edges[i] });
  return gaps;
}

/** Things on the walls between the windows: the ship picture with Mewa on it, painted plates, and the decor. */
function wallDecor(pt: Painter, L: FrontLayout, look: RoomLook): string {
  const has = (d: DecorId) => look.decor.includes(d);
  const p = pt.p;
  const gaps = wallGaps(L);
  const upper = Math.max(70, L.floorY - 300);
  const lower = L.floorY - 190;
  const items: ((x: number, y: number) => string)[] = [];
  // The ship picture with Mewa perched on it, always on the first stretch.
  items.push((x, y) => pt.rect(x - 46, y, 92, 70, 'brass') + pt.rect(x - 40, y + 6, 80, 58, '#9cc3d6') + pt.fill(`M${x - 30},${y + 56} L${x - 14},${y + 32} L${x + 2},${y + 56} Z`, 'facadeA') + pt.fill(`M${x - 6},${y + 42} L${x - 6},${y + 18} L${x + 12},${y + 42} Z`, 'white') + pt.line(`M${x - 38},${y + 52} q38,-8 76,0`, 'blue', 3) + mewa(pt, x + 30, y, 1.1));
  items.push((x, y) => [-28, 0, 28].map((dx, k) => pt.circle(x + dx, y + 30, 13, 'white') + pt.circle(x + dx, y + 30, 10, light(p.blue, 0.7)) + rosette(pt, x + dx, y + 30, 6, ['red', 'blue', 'red'][k])).join('') + pt.rect(x - 44, y + 86, 88, 6, 'bar') + ['red', 'yellow', 'green', 'purple'].map((jar, k) => pt.rect(x - 40 + k * 21, y + 64, 15, 22, jar, 3) + pt.rect(x - 41 + k * 21, y + 60, 17, 6, k % 2 ? 'red' : 'white', 2)).join(''));
  if (has('portraits'))
    items.push((x, y) => [-24, 24].map((dx, k) => pt.rect(x + dx - 20, y, 40, 54, 'brass', 3) + pt.rect(x + dx - 15, y + 5, 30, 44, '#4a3a30') + pt.circle(x + dx, y + 22, 8, 'skin') + pt.fill(`M${x + dx - 12},${y + 49} q12,-18 24,0 Z`, k ? '#2f4a6b' : '#6a2f35') + pt.fill(`M${x + dx - 8},${y + 16} q8,-10 16,0 l0,-4 q-8,-8 -16,0 Z`, k ? '#e2ddd6' : '#3a2a20')).join(''));
  if (has('seaChart'))
    items.push((x, y) => pt.rect(x - 48, y, 96, 72, '#e9d7a8', 2) + pt.fill(`M${x - 40},${y + 60} Q${x - 30},${y + 20} ${x - 4},${y + 28} Q${x + 20},${y + 38} ${x + 40},${y + 14} L${x + 40},${y + 64} L${x - 40},${y + 64} Z`, '#a7c9a9') + pt.line(`M${x - 30},${y + 14} l8,8 M${x - 22},${y + 14} l-8,8 M${x + 10},${y + 50} q10,-14 24,-6`, 'ink', 1) + `<circle cx="${x + 30}" cy="${y + 16}" r="7" fill="none" stroke="${p.red}" stroke-width="1.4"/>`);
  if (has('plantWall'))
    items.push((x, y) => {
      let leaves = pt.rect(x - 44, y, 88, 96, '#7a5236', 3);
      for (let k = 0; k < 26; k++) leaves += pt.fill(`M${x - 38 + ((k * 23) % 76)},${y + 8 + ((k * 37) % 84)} q-8,-7 0,-15 q8,8 0,15 Z`, k % 3 ? 'green' : light(p.green, 0.3));
      return leaves;
    });
  if (has('clayPots'))
    items.push((x, y) => pt.rect(x - 46, y + 60, 92, 6, 'bar') + [-30, -6, 18, 38].map((dx, k) => pt.fill(`M${x + dx - 9},${y + 60} q-4,-14 3,-24 h12 q7,10 3,24 Z`, ['#b8643a', '#c9884a', '#9a5434', '#c27a5c'][k]) + `<path d="M${x + dx - 5},${y + 46} h10" stroke="#fffaf0" stroke-width="1.5"/>`).join(''));
  // Pair up the stretches of wall with the things to hang, upper half first, then lower.
  let g = '';
  const slots = gaps.flatMap((gap) => [{ x: gap.x, y: upper }, { x: gap.x, y: lower }]).sort((a, b) => a.y - b.y || a.x - b.x);
  items.forEach((item, i) => slots[i] && (g += item(slots[i].x, slots[i].y)));
  if (has('lanterns')) for (const gap of gaps) g += pt.line(`M${gap.x},46 L${gap.x},78`, 'ink', 1.4) + pt.rect(gap.x - 10, 78, 20, 26, '#4a4a55', 3) + `<rect x="${gap.x - 6}" y="${82}" width="12" height="18" fill="#ffd98a"/>`;
  if (has('tiledStove')) {
    // A tall Kashubian tiled stove in the corner by the bar.
    const x = L.bar.x1 + 6;
    g += pt.rect(x, L.floorY - 220, 64, 236, '#f4f7f9', 4) + pt.rect(x - 6, L.floorY - 228, 76, 12, '#e8e2d2', 3);
    for (let r = 0; r < 7; r++) for (let c = 0; c < 2; c++) g += rosette(pt, x + 16 + c * 32, L.floorY - 202 + r * 30, 8, r % 2 ? 'blue' : 'red');
  }
  return g;
}

/** The bar on the left: shelves of bottles and a mirror, the counter with taps and glasses, and what stands on it. */
function bar(pt: Painter, L: FrontLayout, look: RoomLook): string {
  const p = pt.p;
  const has = (d: DecorId) => look.decor.includes(d);
  const { x0, x1 } = L.bar;
  const w = x1 - x0;
  const top = L.floorY - 280;
  let g = pt.rect(x0 + 10, top, w - 20, 240, 'bar2') + pt.rect(x0 + 22, top + 12, w - 44, 66, '#cfe3ec');
  if (has('azulejoTiles')) for (let k = 0; k < 5; k++) g += `<path d="M${x0 + 40 + k * 40},${top + 24} l10,10 l-10,10 l-10,-10 Z" fill="#2f5f9a" opacity="0.8"/>`;
  [top + 132, top + 196].forEach((sy, row) => {
    g += pt.rect(x0 + 14, sy, w - 28, 8, 'bar');
    const count = Math.floor((w - 40) / 17);
    for (let i = 0; i < count; i++) {
      const bx = x0 + 22 + i * 17;
      if (row === 0 && has('shipsInBottles') && i % 3 === 1) {
        g += `<ellipse cx="${bx + 6}" cy="${sy - 12}" rx="12" ry="11" fill="#cfe8e0" stroke="${p.ink}" stroke-width="1.1" opacity="0.9"/>` + pt.fill(`M${bx - 2},${sy - 8} h16 l-3,4 h-10 Z`, 'bar') + pt.fill(`M${bx + 5},${sy - 9} v-12 l7,10 Z`, 'white');
        continue;
      }
      if (row === 0 && has('shipsInBottles') && i % 3 !== 0) continue;
      const bottle = ['glassG', 'glassR', 'glassY', 'glassG', 'white', 'glassR'][(i + row) % 6];
      g += pt.fill(`M${bx},${sy} v-26 q0,-6 4,-8 v-8 h4 v8 q4,2 4,8 v26 Z`, bottle) + `<rect x="${bx + 1}" y="${sy - 16}" width="10" height="7" fill="#fffaf0" opacity="0.85"/>`;
    }
  });
  // The counter.
  const counter = L.floorY - 40;
  g += pt.rect(x0, counter + 12, w, L.floorY + 40 - counter - 12, 'bar') + pt.rect(x0 - 6, counter, w + 12, 14, 'bar2');
  for (let x = x0 + 10; x < x1 - 40; x += 56) g += pt.rect(x, counter + 22, 44, 42, light(p.bar, 0.08), 3);
  g += folkBand(pt, x0, L.floorY + 26, w, 12, ['red', 'yellow', 'green']);
  g += pt.line(`M${x0},${L.floorY + 36} L${x1},${L.floorY + 36}`, 'brass', 4);
  for (const tx of [x0 + 60, x0 + 82, x0 + 104]) g += pt.rect(tx, counter - 32, 8, 32, 'brass', 3) + pt.rect(tx - 2, counter - 40, 12, 11, 'black', 3);
  for (const gx of [x0 + 130, x0 + 152]) g += pt.fill(`M${gx},${counter} l2,-24 h16 l2,24 Z`, 'yellow') + `<rect x="${gx + 2}" y="${counter - 22}" width="16" height="6" fill="#fffaf0"/>`;
  if (look.equipment.includes('espresso'))
    g += pt.rect(x0 + 14, counter - 48, 40, 48, 'steel', 4) + pt.rect(x0 + 10, counter - 54, 48, 8, '#8a9096', 3) + pt.rect(x0 + 26, counter - 22, 16, 6, 'black') + pt.fill(`M${x0 + 28},${counter} h12 l-1,-10 h-10 Z`, 'white') + pt.line(`M${x0 + 30},${counter - 60} q-4,-8 2,-16`, 'ink', 1, 'opacity="0.5"');
  if (look.equipment.includes('dessertDisplay')) {
    const dx = x1 - 76;
    g += pt.rect(dx, counter - 52, 70, 52, '#e8f2f6', 4) + pt.rect(dx, counter - 56, 70, 6, 'brass', 3);
    for (const [k, cake] of ['#f1d79a', '#e6b0b4', '#8a5534'].entries()) g += pt.fill(`M${dx + 6 + k * 22},${counter - 8} v-14 h16 v14 Z`, cake) + `<rect x="${dx + 6 + k * 22}" y="${counter - 24}" width="16" height="4" fill="#fffaf0"/>`;
  }
  return g;
}

/** The door in the back wall, open to the street, with the doormat, the clock above and the plaque beside. */
function door(pt: Painter, L: FrontLayout, look: RoomLook): string {
  const p = pt.p;
  const { x, width, top } = L.door;
  const left = x - width / 2;
  const arch = `M${left},${L.floorY} L${left},${top + 30} Q${left},${top} ${x},${top - 4} Q${left + width},${top} ${left + width},${top + 30} L${left + width},${L.floorY} Z`;
  const clip = pt.id('door');
  const street = skyOf(look);
  let g = pt.fill(arch, street);
  g += `<clipPath id="${clip}"><path d="${arch}"/></clipPath><g clip-path="url(#${clip})">${pt.rect(left + 10, top + 30, 40, L.floorY - top, 'facadeB')}${pt.rect(left + 54, top + 50, 40, L.floorY - top, 'facadeD')}${pt.rect(left - 4, L.floorY - 26, width + 8, 30, 'street')}</g>`;
  // The door leaf, open into the room.
  g += pt.fill(`M${left + width},${L.floorY} L${left + width},${top + 26} L${left + width + 26},${top + 36} L${left + width + 26},${L.floorY + 12} Z`, 'bar');
  g += pt.line(arch, 'beam', 8);
  g += pt.fill(`M${left - 6},${L.floorY + 4} h${width + 12} l8,14 h${-width - 28} Z`, 'red') + folkBand(pt, left - 4, L.floorY + 8, width + 8, 8, ['red', 'yellow', 'blue']);
  // The chalkboard with today's dishes, above the door when there's room.
  if (top - 52 >= 96) {
    const bx = x - 100;
    const by = top - 114;
    g += pt.rect(bx, by, 200, 100, '#6a3d26') + pt.rect(bx + 8, by + 8, 184, 84, '#2f4a3c');
    const lines = ['DZIŚ POLECAMY', ...look.specials.slice(0, 3).map((d) => `${d.name} · ${d.price}`)];
    lines.forEach((t, i) => (g += `<text x="${bx + 18}" y="${by + 28 + i * 19}" font-family="${HAND}" font-size="${i ? 14 : 13}" fill="#f4efe2">${escape(t)}</text>`));
  }
  if (look.plaque) g += pt.rect(left - 56, top + 40, 44, 32, 'brass', 3) + `<text x="${left - 34}" y="${top + 60}" text-anchor="middle" font-family="${HAND}" font-size="9" font-weight="700" fill="${p.ink}">★ Old Town</text>`;
  return g;
}

/** The kitchen through the hatch: tiles, copper pans, the range and the equipment, and the chalkboard above. */
function kitchen(pt: Painter, L: FrontLayout, look: RoomLook): string {
  const p = pt.p;
  const { x0, x1, top, counter } = L.hatch;
  let g = pt.rect(x0, top, x1 - x0, counter - top, 'tile');
  for (let x = x0 + 4; x < x1 - 4; x += 22) for (let y = top + 4; y < counter - 4; y += 22) g += `<path d="M${x + 11},${y + 4} l7,7 l-7,7 l-7,-7 Z" fill="${p.tileBlue}" opacity="0.75"/>`;
  g += pt.rect(x0 + 20, top + 12, x1 - x0 - 40, 8, 'ink');
  for (let k = 0; k < 4; k++) g += pt.line(`M${x0 + 44 + k * 52},${top + 20} l0,10`, 'ink', 2) + pt.circle(x0 + 44 + k * 52, top + 40 + k * 2, 11 + k * 2, 'copper');
  // Along the back of the kitchen, at counter height: the range, and whatever else it has.
  const back = counter - 4;
  const pieces: string[] = [];
  pieces.push(pt.rect(0, -60, 70, 60, 'steel') + pt.rect(10, -84, 46, 24, 'steel', 4) + pt.line('M22,-90 q-8,-18 4,-36 M40,-90 q8,-20 -4,-40', 'white', 4) + pt.fill('M10,-60 q8,-12 16,0 q8,-12 16,0 q8,-12 16,0 Z', '#ff9a2e'));
  if (look.equipment.includes('pizzaOven')) pieces.push(pt.fill('M0,0 L0,-40 Q35,-86 70,-40 L70,0 Z', '#b8643a') + pt.fill('M18,0 L18,-22 Q35,-40 52,-22 L52,0 Z', '#2a2328') + pt.fill('M24,0 q5,-14 11,-4 q5,-12 11,4 Z', '#ff9a2e'));
  if (look.equipment.includes('grill')) pieces.push(pt.rect(0, -36, 66, 36, '#4a4a55') + pt.line('M6,-36 h54 M6,-30 h54', 'ink', 2) + pt.fill('M10,-38 q6,-14 10,-2 q6,-12 10,0 q6,-14 10,-2 q6,-12 10,0 Z', '#ff9a2e'));
  if (look.equipment.includes('fryer')) pieces.push(pt.rect(0, -44, 54, 44, 'steel') + pt.rect(6, -50, 42, 10, '#e0b555') + pt.line('M14,-50 l0,-14 h26 l0,14', 'ink', 2));
  let px = x1 - 30;
  for (const piece of pieces) {
    px -= 80;
    g += `<g transform="translate(${px},${back})">${piece}</g>`;
  }
  g += pt.line(`M${x0},${top} h${x1 - x0} v${counter - top} h${x0 - x1} Z`, 'beam', 10);
  // The clock above the hatch (its hands are drawn live, see the view).
  const clock = wallClock(L);
  if (clock) g += pt.circle(clock.x, clock.y, 22, 'white') + pt.circle(clock.x, clock.y, 2.5, 'ink');
  return g;
}

/** Where the wall clock hangs: above the hatch's left end, when there's room. */
export function wallClock(L: FrontLayout): { x: number; y: number } | null {
  return L.hatch.top - 60 > 52 ? { x: L.hatch.x0 + 40, y: L.hatch.top - 36 } : null;
}

/** The kitchen counter in front of the chefs, with the bell on the pass. Drawn over the chefs. */
export function hatchCounterPicture(pt: Painter, L: FrontLayout): string {
  const p = pt.p;
  const { x0, x1, counter, front } = L.hatch;
  let g = pt.rect(x0 - 10, counter, x1 - x0 + 20, 14, 'bar2') + pt.rect(x0, counter + 14, x1 - x0, front - counter - 14, 'bar');
  for (let x = x0 + 12; x < x1 - 50; x += 64) g += pt.rect(x, counter + 24, 52, front - counter - 40, light(p.bar, 0.08), 3);
  g += folkBand(pt, x0, front - 14, x1 - x0, 12, ['blue', 'yellow', 'red']);
  g += pt.fill(`M${x0 + 40},${counter} q10,-14 20,0 Z`, 'brass') + pt.circle(x0 + 50, counter - 14, 2.5, 'brass');
  return g;
}

/** The floor: boards running to the back, shade under the counters, a fig tree and a crate from the market. */
function floor(pt: Painter, L: FrontLayout): string {
  const p = pt.p;
  const mid = L.width / 2;
  let g = pt.rect(-10, L.floorY, L.width + 20, L.height - L.floorY + 10, 'floor');
  for (let i = -16; i <= 16; i++) g += pt.line(`M${mid + i * 60},${L.floorY} L${mid + i * 96},${L.height}`, 'floor2', 1.3, 'opacity="0.55"');
  for (let y = L.floorY + 40; y < L.height; y += 46) g += pt.line(`M0,${y} L${L.width},${y}`, 'floor2', 1.1, 'opacity="0.4"');
  g += hatching(pt, L.bar.x0, L.floorY + 40, L.bar.x1 - L.bar.x0, 12, 5) + hatching(pt, L.hatch.x0, L.hatch.front, L.hatch.x1 - L.hatch.x0, 12, 5);
  // A fig tree in the corner by the kitchen.
  const tx = L.hatch.x1 - 40;
  const ty = L.height - 40;
  g += pt.shadow(tx, ty + 2, 36, 6) + pt.line(`M${tx},${ty - 46} L${tx},${ty - 92} M${tx},${ty - 70} L${tx - 18},${ty - 98} M${tx},${ty - 78} L${tx + 20},${ty - 104}`, 'bar2', 3.5);
  for (const [k, [lx, ly]] of [[-26, -92], [-14, -110], [2, -122], [20, -114], [30, -96], [16, -84], [-10, -82], [-30, -106], [8, -104], [-4, -98]].entries())
    g += pt.fill(`M${tx + lx},${ty + ly + 10} q-11,-9 0,-20 q11,11 0,20 Z`, k % 3 ? 'green' : light(p.green, 0.3));
  g += pt.rect(tx - 28, ty - 48, 56, 48, 'copper', 6) + rosette(pt, tx, ty - 24, 11, 'red');
  // A crate from the morning market: cabbages, beetroot and carrots.
  const cx = L.hatch.x0 + 150;
  const cy = L.hatch.front + 70;
  if (cy < L.height - 30) {
    g += pt.shadow(cx, cy + 42, 64, 6);
    for (const [dx, dy, c, r] of [[-36, -2, 'green', 15], [-8, -8, 'purple', 11], [12, -2, '#9a2f4a', 12], [36, -6, 'green', 14]] as [number, number, string, number][]) g += pt.circle(cx + dx, cy + dy, r, c);
    for (const dx of [-18, 4, 22]) g += pt.fill(`M${cx + dx},${cy - 2} l5,-18 l5,18 Z`, '#e8873a');
    g += pt.rect(cx - 52, cy + 2, 104, 40, 'bar', 3) + `<text x="${cx}" y="${cy + 30}" text-anchor="middle" font-family="${HAND}" font-size="11" font-weight="700" fill="#fffaf0">TARG</text>`;
  }
  return g;
}

/** Lamps: a brass chandelier, designer pendants over the back row, and sunbeams through the windows. */
function lights(pt: Painter, L: FrontLayout, look: RoomLook): string {
  let g = '';
  if (!look.dusk && (look.weather === 'sunny' || look.weather === 'heatwave'))
    for (const w of L.windows) g += `<path d="M${w.x},${w.top} L${w.x + w.w},${w.top} L${w.x + w.w + 90},${L.floorY + 140} L${w.x + 30},${L.floorY + 140} Z" fill="url(#sunbeam)" style="mix-blend-mode:screen"/>`;
  if (look.decor.includes('pendantLights'))
    for (const t of L.tables.filter((t) => t.row === 0)) {
      const y = L.floorY - 150;
      g += pt.line(`M${t.x},46 L${t.x},${y - 22}`, 'ink', 1.4) + pt.fill(`M${t.x - 22},${y} Q${t.x - 18},${y - 24} ${t.x},${y - 26} Q${t.x + 18},${y - 24} ${t.x + 22},${y} Z`, 'brass') + `<ellipse cx="${t.x}" cy="${y + 2}" rx="10" ry="4" fill="#fff1c0"/>`;
      if (!look.live) g += `<ellipse cx="${t.x}" cy="${y + 40}" rx="70" ry="60" fill="url(#lampglow)" style="mix-blend-mode:screen"/>`;
    }
  if (look.decor.includes('chandelier')) {
    // In front of the middle window, clear of the pictures on the wall.
    const w = L.windows[Math.floor((L.windows.length - 1) / 2)];
    const x = w.x + w.w / 2;
    const y = Math.min(150, L.floorY - 200);
    g += pt.line(`M${x},46 L${x},${y - 20}`, 'brass', 2) + pt.fill(`M${x - 56},${y} Q${x},${y + 26} ${x + 56},${y} Q${x},${y + 10} ${x - 56},${y} Z`, 'brass');
    for (const dx of [-50, -25, 0, 25, 50]) g += pt.rect(x + dx - 3, y - 14, 6, 14, 'white', 2) + `<path d="M${x + dx},${y - 24} q4,5 0,10 q-4,-5 0,-10 Z" fill="#ffc94a"/>`;
    if (!look.live) g += `<ellipse cx="${x}" cy="${y + 30}" rx="160" ry="110" fill="url(#lampglow)" style="mix-blend-mode:screen"/>`;
  }
  return g;
}

/**
 * Where the room's light comes from in the evening, and how far it reaches, for the live light: the bar's
 * shelves and the kitchen hatch always, and the decor's pendants, chandelier and lanterns.
 */
export function roomLamps(L: FrontLayout, decor: readonly DecorId[]): { x: number; y: number; r: number }[] {
  const lamps: { x: number; y: number; r: number }[] = [
    { x: (L.bar.x0 + L.bar.x1) / 2, y: L.floorY - 150, r: 150 },
    { x: (L.hatch.x0 + L.hatch.x1) / 2, y: (L.hatch.top + L.hatch.counter) / 2, r: 170 },
  ];
  if (decor.includes('pendantLights')) for (const t of L.tables.filter((t) => t.row === 0)) lamps.push({ x: t.x, y: L.floorY - 140, r: 90 });
  if (decor.includes('chandelier')) {
    const w = L.windows[Math.floor((L.windows.length - 1) / 2)];
    lamps.push({ x: w.x + w.w / 2, y: Math.min(150, L.floorY - 200) + 20, r: 170 });
  }
  if (decor.includes('lanterns')) for (const gap of wallGaps(L)) lamps.push({ x: gap.x, y: 91, r: 60 });
  return lamps;
}

// ---------- Tables, chairs and plates ----------

/** The box a table's pictures are drawn in, around its middle (page units, at scale 1). */
export const TABLE_BOX = { left: -134, top: -118, width: 268, height: 220 };

/** How far above a table's top its candle's flame is, at the table's scale. */
export const CANDLE_RISE = 27;

/** The chairs at a table: two behind it, and one at each end. Drawn behind everyone sitting there. */
export function chairsPicture(pt: Painter): string {
  const ox = -TABLE_BOX.left;
  const oy = -TABLE_BOX.top;
  const wood = '#8a5534';
  const cane = '#e9cf98';
  let g = '';
  // Behind the table: the curved back of a bentwood chair, with a caned panel.
  for (const dx of [-36, 36]) {
    const x = ox + dx;
    g += pt.line(`M${x - 17},${oy + 4} L${x - 17},${oy - 46} Q${x - 17},${oy - 70} ${x},${oy - 70} Q${x + 17},${oy - 70} ${x + 17},${oy - 46} L${x + 17},${oy + 4}`, wood, 5);
    g += pt.fill(`M${x - 11},${oy - 30} L${x - 11},${oy - 48} Q${x - 11},${oy - 62} ${x},${oy - 62} Q${x + 11},${oy - 62} ${x + 11},${oy - 48} L${x + 11},${oy - 30} Z`, cane);
    g += pt.line(`M${x - 17},${oy - 24} h34`, wood, 3.5);
  }
  // At the ends: a chair seen from the side, its back away from the table.
  for (const side of [-1, 1]) {
    const x = ox + side * 84;
    const back = x + side * 20;
    g += pt.line(`M${back},${oy + 74} L${back},${oy - 40} Q${back},${oy - 52} ${back - side * 8},${oy - 54}`, wood, 5);
    g += pt.line(`M${x - side * 20},${oy + 74} L${x - side * 16},${oy + 26} M${back},${oy + 26} L${x - side * 18},${oy + 26}`, wood, 4.5);
    g += pt.fill(`M${x - 24},${oy + 20} h48 l-2,8 h-44 Z`, cane);
  }
  return g;
}

/** A table: a long cloth (plain, or embroidered with the Kashubian tablecloths), a candle and a little vase; or bare oak for the communal table. */
export function tablePicture(pt: Painter, embroidered: boolean, oak: boolean, lit = true): string {
  const ox = -TABLE_BOX.left;
  const oy = -TABLE_BOX.top;
  let g = pt.shadow(ox, oy + CLOTH + 2, 112, 8, 0.18);
  if (oak) {
    // The long oak communal table: a solid carved front down to the floor, and a runner along the top.
    g += pt.rect(ox - 88, oy + 4, 176, CLOTH - 4, '#8a5836', 4);
    for (const dx of [-58, 0, 58]) g += pt.rect(ox + dx - 24, oy + 14, 48, CLOTH - 24, '#9a6a44', 4) + rosette(pt, ox + dx, oy + 14 + (CLOTH - 24) / 2, 9, 'yellow');
    g += pt.fill(`M${ox - 96},${oy} Q${ox},${oy - 14} ${ox + 96},${oy} L${ox + 96},${oy + 8} Q${ox},${oy - 4} ${ox - 96},${oy + 8} Z`, '#a8724a') + folkBand(pt, ox - 50, oy - 7, 100, 10, ['red', 'yellow', 'blue']);
  } else {
    g += pt.fill(`M${ox - 78},${oy} Q${ox - 84},${oy + 40} ${ox - 90},${oy + CLOTH} L${ox + 90},${oy + CLOTH} Q${ox + 84},${oy + 40} ${ox + 78},${oy} Z`, 'cloth');
    for (let k = -3; k <= 3; k++) g += pt.line(`M${ox + k * 22},${oy + 8} q3,30 ${k * 3},${CLOTH - 10}`, '#d9cfbf', 1.2, 'opacity="0.7"');
    if (embroidered) g += folkBand(pt, ox - 86, oy + CLOTH - 26, 172, 16, ['red', 'yellow', 'blue']) + rosette(pt, ox, oy + 28, 9, 'red');
    else g += pt.line(`M${ox - 86},${oy + CLOTH - 14} Q${ox},${oy + CLOTH - 9} ${ox + 86},${oy + CLOTH - 14}`, 'clothBand', 3, 'stroke-dasharray="7 4"');
    g += pt.fill(`M${ox - 82},${oy} Q${ox},${oy - 14} ${ox + 82},${oy} Q${ox},${oy + 14} ${ox - 82},${oy} Z`, 'cloth');
  }
  // The candle, lit from the golden hour (or always, for pictures that aren't lit live).
  g += pt.rect(ox - 3, oy - 22, 6, 18, 'white', 2) + (lit ? `<path d="M${ox},${oy - 32} q4,5 0,10 q-4,-5 0,-10 Z" fill="#ffc94a"/>` : pt.line(`M${ox},${oy - 22} v-4`, 'ink', 1.2));
  g += pt.fill(`M${ox + 12},${oy - 2} q-3,-10 3,-14 q6,4 3,14 Z`, 'blue') + pt.circle(ox + 15, oy - 18, 3, 'red');
  return g;
}

/** What's on a plate, for the plates' sheet: a place set with nothing yet, then four dishes. */
export const PLATES = ['set', 'pierogi', 'soup', 'main', 'cake'] as const;
export const PLATE_CELL = { width: 64, height: 40, x: 32, y: 30 };

/** All the plates side by side, one per cell of PLATE_CELL. */
export function platesPicture(pt: Painter): string {
  let g = '';
  PLATES.forEach((kind, i) => {
    const x = i * PLATE_CELL.width + PLATE_CELL.x;
    const y = PLATE_CELL.y;
    g += pt.fill(`M${x - 22},${y} q22,-11 44,0 q-22,10 -44,0 Z`, 'plate');
    if (kind === 'set') g += pt.line(`M${x - 27},${y - 6} l-2,11 M${x + 27},${y - 6} l2,11`, '#8a9096', 1.6);
    if (kind === 'pierogi') for (const d of [-9, 0, 9]) g += pt.fill(`M${x + d - 7},${y - 2} q7,-11 14,0 Z`, '#f1d79a');
    if (kind === 'soup') g += pt.fill(`M${x - 13},${y - 2} q13,-8 26,0 q-13,6 -26,0 Z`, '#e7c87a') + pt.circle(x - 4, y - 5, 3, 'white');
    if (kind === 'main') g += pt.fill(`M${x - 14},${y - 2} q6,-10 18,-4 q4,4 -2,6 Z`, '#a8643a') + pt.circle(x + 8, y - 4, 4, '#f1d79a') + pt.circle(x + 14, y - 3, 3.5, '#f1d79a') + pt.circle(x - 2, y - 7, 2.5, 'green');
    if (kind === 'cake') g += pt.fill(`M${x - 8},${y - 2} v-12 h16 v12 Z`, '#f1d79a') + `<rect x="${x - 8}" y="${y - 16}" width="16" height="4" fill="#fffaf0"/>` + pt.circle(x, y - 18, 2.5, 'red');
  });
  return g;
}

const escape = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- The sketchbook page around it all ----------

/** The page's margins over the scene, w × h units: paper with a ragged edge, tulip vines and corner rosettes, and a ribbon. */
export function pageFramePicture(pt: Painter, w: number, h: number): string {
  const p = pt.p;
  const left = 34;
  const top = 26;
  const right = w - 34;
  const bottom = h - 16;
  const pts: string[] = [];
  const wobble = (i: number) => Math.sin(i * 1.7) * 3 + Math.sin(i * 0.53) * 4;
  let n = 0;
  for (let x = left; x <= right; x += 24) pts.push(`${x},${top + wobble(n++)}`);
  for (let y = top; y <= bottom; y += 24) pts.push(`${right + wobble(n++)},${y}`);
  for (let x = right; x >= left; x -= 24) pts.push(`${x},${bottom + wobble(n++)}`);
  for (let y = bottom; y >= top; y -= 24) pts.push(`${left + wobble(n++)},${y}`);
  let g = `<path d="M-20,-20 H${w + 20} V${h + 20} H-20 Z M${pts.join(' L')} Z" fill-rule="evenodd" fill="${p.paper}" filter="url(#wash)"/>`;
  g += `<path d="M${pts.join(' L')} Z" fill="none" stroke="${mix(p.bar, p.paper, 0.55)}" stroke-width="3" opacity="0.6" filter="url(#wash)"/>`;
  for (const [cx, cy] of [[17, 16], [w - 17, 16], [17, h - 14], [w - 17, h - 14]]) g += rosette(pt, cx, cy, 12, 'red');
  for (const cx of [17, w - 17]) {
    g += pt.line(`M${cx},${h - 40} ` + Array.from({ length: Math.ceil((h - 80) / 68) }, (_, k) => `q${k % 2 ? -8 : 8},-34 0,-68`).join(' '), 'green', 1.6);
    for (let y = 80, k = 0; y < h - 50; y += 68, k++) g += k % 2 ? rosette(pt, cx, y - 8, 8, ['blue', 'red'][k % 2]) : tulip(pt, cx, y + 10, 26, ['red', 'blue', 'yellow'][k % 3]);
  }
  for (let x = 300, k = 0; x < w - 300; x += 52, k++) g += k % 2 ? rosette(pt, x, 12, 5, 'blue') : tulip(pt, x, 22, 16, 'red');
  g += pt.fill(`M${w - 70},0 h14 v96 l-7,-8 l-7,8 Z`, 'red');
  return g;
}
