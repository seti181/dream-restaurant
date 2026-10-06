// The picture of the street outside the restaurant (project.md section 9.5, "The street outside"):
// the sky for the weather, each street's landmark, the gabled houses, the restaurant's own house with
// its sign, door and lit windows, the pavement, and the terrace's parasols. SVG text in page units,
// baked once (bake.ts); the people and the terrace's tables are drawn over it.

import type { LocationId } from '../../data/locations';
import type { Weather } from '../../data/weather';
import { folkBand, hatch, rosette } from './motifs';
import type { Painter } from './painter';
import { dark, HAND, light } from './palette';
import type { House, StreetLayout } from './street';

export interface StreetLook {
  weather: Weather;
  dusk: boolean;
  /** The restaurant's name, on its hanging sign. */
  name: string;
  /** Today's special on the chalkboard by the door, if there is one. */
  special: string | null;
  /** The terrace is open today (closed in the rain, or without a permit): parasols up or folded. */
  terraceOpen: boolean;
}

const SKY: Record<Weather, [string, string]> = {
  sunny: ['#9ccbe6', '#d8ecf4'],
  heatwave: ['#f0c88e', '#f8e6c0'],
  cloudy: ['#b8c4cc', '#dde3e6'],
  rain: ['#8d9ba6', '#bcc6cc'],
};
const DUSK: [string, string] = ['#2f3c6a', '#7b6f96'];
const FACADES = ['#e9b7a0', 'facadeA', 'facadeB', 'facadeC', 'facadeD', 'facadeE'];

const escape = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function streetPicture(pt: Painter, L: StreetLayout, look: StreetLook): string {
  let g = sky(pt, L, look);
  g += landmark(pt, L, look);
  for (const h of L.houses) g += house(pt, L, h, look, false);
  g += home(pt, L, look);
  g += pavement(pt, L, look);
  g += parasols(pt, L, look);
  if (look.weather === 'rain')
    for (let k = 0; k < 90; k++) g += `<path d="M${(k * 173) % L.width},${(k * 97) % L.height} l-7,22" stroke="#eef4f8" stroke-width="1.4" opacity="0.6"/>`;
  g += `<rect width="${L.width}" height="${L.height}" filter="url(#grain)"/>`;
  if (look.dusk) g += `<rect width="${L.width}" height="${L.height}" fill="#2c3a66" opacity="0.18"/>`;
  return g;
}

function sky(pt: Painter, L: StreetLayout, look: StreetLook): string {
  const [top, low] = look.dusk ? DUSK : SKY[look.weather];
  const id = pt.id('sky');
  let g = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${low}"/></linearGradient></defs><rect x="-10" y="-10" width="${L.width + 20}" height="${L.ground + 10}" fill="url(#${id})"/>`;
  if (!look.dusk && (look.weather === 'sunny' || look.weather === 'heatwave')) g += `<circle cx="${L.width * 0.82}" cy="70" r="${look.weather === 'heatwave' ? 34 : 26}" fill="#ffe08a" filter="url(#wash)"/>`;
  if (look.dusk) g += `<circle cx="${L.width * 0.18}" cy="64" r="18" fill="#f4ecc8"/>` + [0, 1, 2, 3, 4, 5].map((k) => `<circle cx="${100 + k * 230}" cy="${30 + ((k * 37) % 50)}" r="1.8" fill="#fffaf0"/>`).join('');
  const clouds = look.weather === 'cloudy' ? 6 : look.weather === 'rain' ? 8 : look.weather === 'sunny' ? 3 : 1;
  const tone = look.weather === 'rain' ? '#c9d0d6' : look.dusk ? '#9c94b6' : '#fffaf0';
  for (let k = 0; k < clouds; k++) {
    const cx = 80 + ((k * 263) % (L.width - 160));
    const cy = 50 + ((k * 71) % 90);
    g += `<g filter="url(#wash)" opacity="0.95"><ellipse cx="${cx}" cy="${cy}" rx="${58 + (k % 3) * 14}" ry="18" fill="${tone}"/><ellipse cx="${cx + 26}" cy="${cy - 12}" rx="34" ry="18" fill="${tone}"/><ellipse cx="${cx - 30}" cy="${cy - 6}" rx="26" ry="14" fill="${tone}"/></g>`;
  }
  if (look.weather !== 'rain' && !look.dusk) g += pt.line(`M${L.width * 0.3},96 q8,-7 16,0 q8,-7 16,0 M${L.width * 0.62},70 q6,-5 12,0 q6,-5 12,0`, 'ink', 1.4);
  return g;
}

/** Each street's landmark, over the roofs (or standing among the houses). */
function landmark(pt: Painter, L: StreetLayout, look: StreetLook): string {
  const brick = '#b9694c';
  const tower = (x: number, w: number, top: number) => {
    let t = pt.rect(x, top, w, L.ground - top, brick) + [0, 1, 2, 3, 4].map((k) => pt.rect(x + 2 + (k * (w - 12)) / 4, top - 12, 8, 14, brick)).join('');
    for (let y = top + 30; y < L.ground - 140; y += 64) t += `<rect x="${x + w / 2 - 6}" y="${y}" width="12" height="34" rx="6" fill="${dark(brick, 0.4)}"/>`;
    return t;
  };
  switch (L.location as LocationId) {
    case 'dluga': {
      // The Main Town Hall: a tall brick tower with a slender spire and a golden king on top.
      const x = L.width * 0.78;
      return tower(x - 28, 56, 120) + pt.fill(`M${x - 34},124 L${x},26 L${x + 34},124 Z`, '#4f7f6a') + pt.rect(x - 4, 10, 8, 18, 'brass') + pt.circle(x, 8, 5, 'yellow') + pt.circle(x, 170, 14, 'white') + pt.line(`M${x},170 l0,-9 M${x},170 l7,3`, 'ink', 2);
    }
    case 'mariacka':
    case 'ogarna':
    case 'piwna': {
      // St Mary's: the great brick tower over the roofs, square and flat-topped with little turrets.
      const x = L.location === 'mariacka' ? L.width * 0.82 : L.width * 0.12;
      let g = tower(x - 60, 120, 60);
      if (L.location === 'piwna') {
        // The Great Armoury's Flemish gable, white stone stripes on brick, at the end of the street.
        const ax = L.width * 0.8;
        g += pt.fill(`M${ax - 80},${L.ground - 260} h160 v-40 l-20,-20 v-30 l-20,-14 l-20,-40 l-20,40 l-20,14 v30 l-20,20 Z`, brick);
        for (let y = L.ground - 300; y < L.ground - 160; y += 26) g += `<rect x="${ax - 78}" y="${y}" width="156" height="5" fill="#f4ecd6" opacity="0.8"/>`;
      }
      return g;
    }
    case 'pobrzeze': {
      // The Żuraw: a tall timber crane house with a steep roof, between two round brick towers, its beam out over the water.
      const g0 = L.ground;
      const towerTop = g0 - 230;
      let z = '';
      for (const tx of [44, 236]) z += pt.rect(tx, towerTop, 58, g0 - towerTop, brick) + pt.fill(`M${tx - 4},${towerTop} L${tx + 29},${towerTop - 46} L${tx + 62},${towerTop} Z`, '#3a3236') + `<rect x="${tx + 22}" y="${towerTop + 40}" width="14" height="30" rx="7" fill="${dark(brick, 0.4)}"/>`;
      z += pt.rect(98, g0 - 290, 140, 200, '#6b5140') + pt.fill(`M92,${g0 - 290} L168,${g0 - 360} L244,${g0 - 290} Z`, '#3a3236');
      for (let y = g0 - 270; y < g0 - 100; y += 22) z += pt.line(`M100,${y} h136`, '#4a3a30', 1.6);
      z += `<rect x="146" y="${g0 - 250}" width="44" height="54" fill="${look.dusk ? '#ffd98a' : '#2a2018'}"/>`;
      z += pt.line(`M238,${g0 - 230} l90,-10 M318,${g0 - 239} v70`, '#4a3a30', 4) + pt.line(`M312,${g0 - 169} q6,10 12,0`, 'ink', 2);
      return z;
    }
    case 'spichrzow':
      return pt.line(`M${L.width * 0.88},${L.ground - 250} V40 M${L.width * 0.88},50 l80,30 M${L.width * 0.88},50 l-50,20`, '#c4574b', 6) + (look.dusk ? `<circle cx="${L.width * 0.88}" cy="44" r="6" fill="#ffd98a"/>` : '');
  }
  return '';
}

/** A gabled townhouse: its front wall, its gable, rows of windows and a shop on the ground floor. */
function house(pt: Painter, L: StreetLayout, h: House, look: StreetLook, isHome: boolean): string {
  const p = pt.p;
  const granary = L.location === 'spichrzow' && !isHome;
  const colour = granary ? '#a8513a' : FACADES[h.colour % FACADES.length];
  const w = h.x1 - h.x0;
  const mid = (h.x0 + h.x1) / 2;
  const gable = granary ? 'pointed' : h.gable;
  let g = pt.rect(h.x0, h.top, w, L.ground - h.top + 2, colour);
  // The gable.
  if (gable === 'stepped') {
    let d = `M${h.x0 + 8},${h.top}`;
    const steps = 4;
    for (let k = 0; k < steps; k++) d += ` V${h.top - (k + 1) * 18} H${h.x0 + 8 + ((k + 1) * (w / 2 - 22)) / steps}`;
    d += ` V${h.top - (steps + 1) * 18} H${h.x1 - 8 - (w / 2 - 22)}`;
    for (let k = steps - 1; k >= 0; k--) d += ` V${h.top - (k + 1) * 18} H${h.x1 - 8 - (k * (w / 2 - 22)) / steps}`;
    d += ` V${h.top} Z`;
    g += pt.fill(d, colour);
  } else if (gable === 'curved') g += pt.fill(`M${h.x0 + 10},${h.top} Q${h.x0 + 10},${h.top - 50} ${mid - 24},${h.top - 56} Q${mid},${h.top - 96} ${mid + 24},${h.top - 56} Q${h.x1 - 10},${h.top - 50} ${h.x1 - 10},${h.top} Z`, colour);
  else if (gable === 'pointed') g += pt.fill(`M${h.x0},${h.top} L${mid},${h.top - (granary ? 110 : 70)} L${h.x1},${h.top} Z`, granary ? '#8c4230' : colour);
  else g += pt.rect(h.x0 - 4, h.top - 16, w + 8, 18, dark(pt.colour(colour), 0.12));
  g += pt.rect(h.x0 - 3, h.top - 2, w + 6, 8, light(pt.colour(colour), 0.3));
  // Windows, row by row: lit at dusk.
  const cols = Math.max(2, Math.floor((w - 24) / 46));
  const glass = look.dusk ? '#ffd98a' : dark(p.window, 0.2);
  for (let y = h.top + 26; y < L.ground - (isHome ? 190 : 150); y += 62)
    for (let c = 0; c < cols; c++) {
      const wx = h.x0 + 14 + ((c + 0.5) * (w - 28)) / cols - 13;
      g += `<rect x="${wx}" y="${y}" width="26" height="40" rx="${granary ? 2 : 12}" fill="${glass}" stroke="${granary ? '#fffaf0' : p.ink}" stroke-width="${granary ? 3 : 1.4}"/>`;
      if (!granary) g += `<path d="M${wx + 13},${y} v40 M${wx},${y + 18} h26" stroke="#fffaf0" stroke-width="2"/>`;
    }
  if (granary) {
    g += pt.rect(mid - 16, h.top - 60, 32, 40, '#fffaf0', 2) + `<rect x="${mid - 12}" y="${h.top - 56}" width="24" height="32" fill="${glass}"/>`;
    return g + pt.rect(mid - 24, L.ground - 76, 48, 78, '#5e3420', 3);
  }
  if (isHome) return g;
  // A shop on the ground floor: its window, its door, and an awning or a sign on some.
  const shop = (h.colour * 7 + h.x0) % 3;
  g += pt.rect(h.x0 + 16, L.ground - 96, w * 0.48, 70, look.dusk ? '#ffd98a' : '#cfe3ec', 4) + pt.rect(h.x1 - 54, L.ground - 106, 38, 106, dark(pt.colour(colour), 0.45), 16);
  if (shop === 0) g += awning(pt, h.x0 + 10, L.ground - 110, w * 0.48 + 12, ['blue', 'white']);
  if (shop === 1) g += pt.rect(h.x0 + 20, L.ground - 124, w * 0.44, 20, 'white', 3) + pt.line(`M${h.x0 + 28},${L.ground - 114} h${w * 0.3}`, 'ink', 1.4);
  if (L.location === 'mariacka') {
    // Mariacka's stone terraces (przedproża): a raised step in front, with a carved balustrade and a gargoyle.
    g += pt.rect(h.x0 + 6, L.ground - 28, w - 12, 30, '#d6cdbd', 3) + pt.line(`M${h.x0 + 10},${L.ground - 28} v-24 h${w - 20} v24`, '#b8ad9a', 3) + rosette(pt, h.x0 + 24, L.ground - 14, 7, 'yellow');
  }
  return g;
}

/** A striped awning over a window. */
function awning(pt: Painter, x: number, y: number, w: number, colours: [string, string]): string {
  let g = '';
  const n = Math.max(3, Math.round(w / 24));
  for (let k = 0; k < n; k++) g += pt.fill(`M${x + (k * w) / n},${y} h${w / n} l2,26 q${-w / n / 2 - 1},10 ${-w / n - 2},0 Z`, colours[k % 2]);
  return g;
}

/** The restaurant's own house: a stepped gable with a rosette, flower boxes, big lit windows, the open door, the sign, the awning and the chalkboard. */
function home(pt: Painter, L: StreetLayout, look: StreetLook): string {
  const p = pt.p;
  const h = L.home;
  const mid = (h.x0 + h.x1) / 2;
  let g = house(pt, L, h, look, true);
  g += pt.circle(mid, h.top - 50, 22, 'white') + rosette(pt, mid, h.top - 50, 16, 'red');
  // Flower boxes under the upper windows.
  const cols = Math.max(2, Math.floor((h.x1 - h.x0 - 24) / 46));
  for (let y = h.top + 26; y < L.ground - 190; y += 62)
    for (let c = 0; c < cols; c++) {
      const wx = h.x0 + 14 + ((c + 0.5) * (h.x1 - h.x0 - 28)) / cols - 13;
      g += pt.rect(wx - 4, y + 40, 34, 8, 'copper', 2) + pt.circle(wx + 4, y + 38, 4, 'green') + pt.circle(wx + 14, y + 36, 4, (c + y) % 2 ? 'red' : '#f07a8a') + pt.circle(wx + 23, y + 38, 4, 'green');
    }
  // The ground floor: a painted band, two big arched windows full of warm light, and the open door.
  g += folkBand(pt, h.x0, L.ground - 180, h.x1 - h.x0, 14, ['red', 'yellow', 'blue']);
  const lit = look.dusk ? '#ffcf73' : '#f6deb0';
  for (const wx of [L.door.x + 70, L.door.x + 210]) {
    g += pt.fill(`M${wx},${L.ground - 20} V${L.ground - 120} Q${wx},${L.ground - 156} ${wx + 55},${L.ground - 156} Q${wx + 110},${L.ground - 156} ${wx + 110},${L.ground - 120} V${L.ground - 20} Z`, lit);
    g += `<path d="M${wx + 55},${L.ground - 156} V${L.ground - 20} M${wx},${L.ground - 90} h110" stroke="${p.white}" stroke-width="4"/>`;
    // Guests inside, just shapes against the light.
    g += `<circle cx="${wx + 30}" cy="${L.ground - 70}" r="9" fill="${dark(lit, 0.35)}"/><path d="M${wx + 18},${L.ground - 20} q12,-44 24,0 Z" fill="${dark(lit, 0.35)}"/><circle cx="${wx + 80}" cy="${L.ground - 66}" r="8" fill="${dark(lit, 0.35)}"/>`;
  }
  g += awning(pt, L.door.x + 60, L.ground - 172, 280, ['red', 'white']);
  const { x, width, top } = L.door;
  g += pt.fill(`M${x - width / 2},${L.ground} V${top + 30} Q${x - width / 2},${top} ${x},${top - 4} Q${x + width / 2},${top} ${x + width / 2},${top + 30} V${L.ground} Z`, look.dusk ? '#ffcf73' : '#e8c48a');
  g += pt.fill(`M${x + width / 2},${L.ground} V${top + 26} l18,8 V${L.ground + 6} Z`, 'bar');
  g += pt.line(`M${x - width / 2},${L.ground} V${top + 30} Q${x - width / 2},${top} ${x},${top - 4} Q${x + width / 2},${top} ${x + width / 2},${top + 30} V${L.ground}`, 'beam', 7);
  // The hanging sign with the restaurant's name.
  const s = L.sign;
  g += pt.line(`M${s.x + 70},${s.y - 14} h-90 M${s.x - 4},${s.y - 14} v12 M${s.x + 56},${s.y - 14} v12`, 'ink', 3);
  g += pt.rect(s.x - 50, s.y - 4, 120, 50, 'brass', 8) + pt.rect(s.x - 44, s.y + 2, 108, 38, '#fffaf0', 5);
  g += `<text x="${s.x + 10}" y="${s.y + 27}" text-anchor="middle" font-family="${HAND}" font-size="${look.name.length > 14 ? 13 : 16}" font-weight="700" fill="${p.red}">${escape(look.name)}</text>`;
  // A lamp by the door, lit at dusk.
  g += pt.line(`M${x - width / 2 - 20},${top + 10} h14`, 'ink', 2.5) + pt.rect(x - width / 2 - 30, top + 10, 16, 22, '#3a3236', 3) + `<rect x="${x - width / 2 - 26}" y="${top + 14}" width="8" height="14" fill="${look.dusk ? '#ffd98a' : '#e8e2d2'}"/>`;
  return g;
}

/** The pavement, the cobbled street (or the quay and the river), lamps, the chalkboard and, on Długa, Neptune. */
function pavement(pt: Painter, L: StreetLayout, look: StreetLook): string {
  let g = pt.rect(-10, L.ground, L.width + 20, L.frontLane + 12 - L.ground, '#e3d8c4');
  for (let y = L.ground + 26; y < L.frontLane + 10; y += 30) g += pt.line(`M0,${y} H${L.width}`, '#cbbfa8', 1.2, 'opacity="0.6"');
  for (let x = 20; x < L.width; x += 64) g += pt.line(`M${x},${L.ground} l-6,${L.frontLane + 10 - L.ground}`, '#cbbfa8', 1, 'opacity="0.45"');
  g += hatch(pt, 0, L.ground, L.width, 10, 6, 0.25);
  if (L.river) {
    // The quay's edge and the Motława below, with a little boat.
    g += pt.rect(-10, L.frontLane + 12, L.width + 20, 14, '#b8ad9a');
    g += pt.rect(-10, L.frontLane + 26, L.width + 20, L.height - L.frontLane, '#6f9fbf');
    for (let k = 0; k < 14; k++) g += pt.line(`M${(k * 113) % L.width},${L.frontLane + 40 + ((k * 23) % 40)} q12,-5 24,0 q12,5 24,0`, '#e3eef4', 1.6, 'opacity="0.8"');
    const bx = L.width * 0.66;
    g += pt.fill(`M${bx},${L.frontLane + 44} h120 l-14,22 h-92 Z`, '#8a5534') + pt.line(`M${bx + 60},${L.frontLane + 44} V${L.frontLane - 4}`, 'ink', 2) + pt.fill(`M${bx + 62},${L.frontLane} q30,16 34,40 h-34 Z`, 'white');
  } else {
    g += pt.rect(-10, L.frontLane + 10, L.width + 20, 8, '#b8ad9a');
    g += pt.rect(-10, L.frontLane + 18, L.width + 20, L.height - L.frontLane, '#c9b999');
    for (let x = 0; x < L.width; x += 26) g += pt.rect(x + 2, L.frontLane + 22, 22, 11, '#b8a684', 4) + pt.rect(x + 14, L.frontLane + 36, 22, 11, '#b8a684', 4);
  }
  // Street lamps, lit at dusk.
  for (const lx of [L.home.x0 - 60, L.width - 120]) {
    g += pt.line(`M${lx},${L.ground + 14} V${L.ground - 150}`, '#3a3236', 4) + pt.fill(`M${lx - 12},${L.ground - 150} h24 l-4,-26 h-16 Z`, look.dusk ? '#ffd98a' : '#e8e2d2') + pt.line(`M${lx - 14},${L.ground - 176} h28`, '#3a3236', 3);
    if (look.dusk) g += `<ellipse cx="${lx}" cy="${L.ground - 150}" rx="70" ry="60" fill="url(#lampglow)" style="mix-blend-mode:screen"/>`;
  }
  // The chalkboard by the door.
  const b = L.board;
  g += pt.line(`M${b.x - 22},${b.y} L${b.x - 12},${b.y - 70} M${b.x + 22},${b.y} L${b.x + 12},${b.y - 70}`, 'bar2', 4) + pt.rect(b.x - 24, b.y - 74, 48, 56, '#2f4a3c', 3);
  g += `<text x="${b.x}" y="${b.y - 56}" text-anchor="middle" font-family="${HAND}" font-size="8" fill="#f4efe2">DZIŚ</text>`;
  if (look.special) g += `<text x="${b.x}" y="${b.y - 40}" text-anchor="middle" font-family="${HAND}" font-size="${look.special.length > 9 ? 7 : 9}" fill="#f4efe2">${escape(look.special.slice(0, 14))}</text>`;
  g += pt.line(`M${b.x - 14},${b.y - 30} q14,-6 28,0`, '#f4efe2', 1.2);
  if (L.location === 'dluga') {
    // Neptune on his fountain, at the end of Długi Targ.
    const nx = 90;
    g += pt.rect(nx - 50, L.backLane - 34, 100, 34, '#c3cbd0', 6) + pt.rect(nx - 40, L.backLane - 46, 80, 14, '#d8dde0', 4);
    g += pt.fill(`M${nx},${L.backLane - 46} l-7,-60 l7,-12 l7,12 l-7,60 Z`, '#3f8a7a') + pt.line(`M${nx + 12},${L.backLane - 110} v-40 M${nx + 6},${L.backLane - 150} l6,-9 l6,9`, '#3f8a7a', 3);
    g += `<path d="M${nx - 34},${L.backLane - 40} q16,-16 30,0 M${nx + 4},${L.backLane - 40} q16,-16 30,0" stroke="#bfe6f5" stroke-width="3" fill="none"/>`;
  }
  return g;
}

/** A parasol over each terrace table: up when the terrace is open, folded when it isn't. */
function parasols(pt: Painter, L: StreetLayout, look: StreetLook): string {
  let g = '';
  L.tables.forEach((t, i) => {
    const k = t.scale;
    const top = t.top - 176 * k;
    g += pt.line(`M${t.x},${t.top - 4} V${top}`, '#8a5534', 4 * k);
    if (look.terraceOpen) {
      const colours = i % 2 ? ['red', 'white'] : ['blue', 'white'];
      let canopy = '';
      for (let s = 0; s < 6; s++) {
        const x0 = t.x - 96 * k + s * 32 * k;
        canopy += pt.fill(`M${t.x},${top - 30 * k} L${x0},${top + 6 * k} q${16 * k},${10 * k} ${32 * k},0 Z`, colours[s % 2]);
      }
      g += canopy;
    } else g += pt.fill(`M${t.x - 9 * k},${top + 60 * k} L${t.x},${top - 24 * k} L${t.x + 9 * k},${top + 60 * k} Z`, i % 2 ? 'red' : 'blue');
  });
  return g;
}
