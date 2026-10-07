// The cellar room's picture (project.md section 6.14, "Bigger premises"), in the sketchbook look:
// whitewashed brick vaults, candles in niches and on an iron chandelier, barrels, old stone flags,
// the stairs down from the room on the left and a little window high up onto the street, where
// people's feet go by. Baked once, like the room (see bake.ts); people and tables go on top.

import type { Weather } from '../../data/weather';
import type { CellarLayout } from './cellar';
import { hatch, rosette } from './motifs';
import type { Painter } from './painter';
import { HAND, light } from './palette';

export interface CellarLook {
  weather: Weather;
  /** The evening: the little window shows the dark street. */
  dusk: boolean;
}

const BRICK = '#c98d6a';
const BRICK_LINE = '#a86f50';
const PLASTER = '#f1e4cf';

/** Candles in the niches and on the chandelier: where their light is, for the live glows over the picture. */
export function cellarCandles(L: CellarLayout): { x: number; y: number; r: number }[] {
  const { bays, bayW } = bayLayout(L);
  const niches = Array.from({ length: bays }, (_, b) => b)
    .filter((b) => b % 2 === 0)
    .map((b) => ({ x: L.vaults.x0 + (b + 0.5) * bayW, y: L.floorY - 150, r: 46 }));
  const mx = L.vaults.x0 + bayW * Math.floor(bays / 2);
  return [...niches, ...[-60, -20, 20, 60].map((dx) => ({ x: mx + dx, y: 80 + Math.abs(dx) / 6, r: 34 }))];
}

function bayLayout(L: CellarLayout): { bays: number; bayW: number } {
  const span = L.vaults.x1 - L.vaults.x0;
  const bays = Math.max(2, Math.round(span / 280));
  return { bays, bayW: span / bays };
}

export function cellarPicture(pt: Painter, L: CellarLayout, look: CellarLook): string {
  const { width: w, height: h, floorY } = L;
  const { bays, bayW } = bayLayout(L);
  let g = pt.rect(0, 0, w, h, PLASTER) + pt.rect(0, 0, w, 40, BRICK);
  // Brick piers between the bays, and a brick arch over each.
  for (let b = 0; b <= bays; b++) {
    const x = L.vaults.x0 + b * bayW;
    g += pt.rect(x - 22, 30, 44, floorY - 30, BRICK, 2);
    for (let y = 46; y < floorY; y += 18) g += pt.line(`M${x - 22},${y} H${x + 22} M${x + ((y / 18) % 2 ? -6 : 8)},${y} V${y + 18}`, BRICK_LINE, 1, 'opacity="0.7"');
  }
  for (let b = 0; b < bays; b++) {
    const x0 = L.vaults.x0 + b * bayW + 22;
    const x1 = L.vaults.x0 + (b + 1) * bayW - 22;
    const cx = (x0 + x1) / 2;
    const rise = 70;
    const top = 120;
    g += pt.fill(`M${x0},${top + rise} Q${cx},${top - rise} ${x1},${top + rise} L${x1},30 L${x0},30 Z`, BRICK);
    g += pt.line(`M${x0},${top + rise} Q${cx},${top - rise} ${x1},${top + rise}`, '#8a5534', 10);
    for (let k = 1; k < 12; k++) {
      const t = k / 12;
      const ax = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
      const ay = (1 - t) * (1 - t) * (top + rise) + 2 * (1 - t) * t * (top - rise) + t * t * (top + rise);
      g += pt.line(`M${ax},${ay - 6} L${ax},${ay + 6}`, PLASTER, 1.2, 'opacity="0.8"');
    }
    // A candle niche in every other bay, a painted plate in the rest.
    if (b % 2 === 0) {
      g += pt.fill(`M${cx - 22},${floorY - 120} v-40 q22,-26 44,0 v40 Z`, '#8a5534') + pt.rect(cx - 3, floorY - 150, 6, 24, 'white', 2) + `<path d="M${cx},${floorY - 152} q-4,-8 0,-14 q4,6 0,14 Z" fill="#f2b54a"/>`;
    } else {
      g += pt.circle(cx, floorY - 150, 22, 'white') + pt.circle(cx, floorY - 150, 15, light('#4c78ab', 0.6)) + rosette(pt, cx, floorY - 150, 8, 'red');
    }
  }
  // An iron chandelier with candles from the middle vault.
  const mx = L.vaults.x0 + bayW * Math.floor(bays / 2);
  g += pt.line(`M${mx},40 V96`, 'black', 2) + pt.line(`M${mx - 60},100 Q${mx},124 ${mx + 60},100`, 'black', 3);
  for (const dx of [-60, -20, 20, 60]) g += pt.rect(mx + dx - 3, 84 + Math.abs(dx) / 6, 6, 16, 'white', 2) + `<path d="M${mx + dx},${82 + Math.abs(dx) / 6} q-3,-6 0,-11 q3,5 0,11 Z" fill="#f2b54a"/>`;
  // The little window high up in the last bay, onto the street: cobbles and two people's feet.
  const wx = L.vaults.x0 + bayW * (bays - 0.5) - 70;
  const sky = look.dusk ? '#4a5a86' : look.weather === 'rain' ? '#aab8c4' : '#cfe3ec';
  g += pt.rect(wx - 8, 52, 156, 66, '#8a5534', 3) + pt.rect(wx, 60, 140, 50, sky, 2) + pt.rect(wx, 94, 140, 16, 'street');
  g += pt.fill(`M${wx + 40},94 v-30 h8 v26 h10 v6 Z`, '#4c78ab') + pt.fill(`M${wx + 62},94 v-28 h8 v22 h12 v6 Z`, '#4c78ab');
  g += pt.fill(`M${wx + 104},94 v-26 h7 v21 h11 v5 Z`, '#c4574b');
  g += pt.line(`M${wx + 70},60 V110 M${wx},85 H${wx + 140}`, 'white', 3);
  // Old stone flags on the floor.
  g += pt.rect(0, floorY, w, h - floorY, '#cdb79c');
  for (let y = floorY + 26; y < h; y += 34) g += pt.line(`M0,${y} H${w}`, '#a8927a', 1.2, 'opacity="0.7"');
  for (let y = floorY; y < h; y += 34) for (let x = ((y / 34) % 2) * 60; x < w; x += 120) g += pt.line(`M${x},${y} V${y + 26}`, '#a8927a', 1.2, 'opacity="0.6"');
  g += hatch(pt, 0, floorY, w, 16, 6, 0.3);
  // Barrels lying on their side in the corner, on a wooden rack.
  const r = 34;
  const bx = L.barrels.x0 + 120;
  for (const [x, y] of [[bx, floorY + 6], [bx + 76, floorY + 6], [bx + 38, floorY + 6 - r * 1.8]] as const) {
    g += pt.shadow(x, y + 2, r, 6);
    g += pt.circle(x, y - r, r, '#a8743a') + `<circle cx="${x}" cy="${y - r}" r="${r * 0.78}" fill="none" stroke="${pt.p.ink}" stroke-width="3"/>` + pt.circle(x, y - r, r * 0.5, '#c9884a') + pt.circle(x, y - r, 4, 'black');
  }
  g += pt.rect(bx - 40, floorY + 6, 160, 8, 'bar2', 2);
  // The stairs down from the room, on the left, in the light from upstairs.
  const sx1 = L.stairs.x1;
  g += pt.fill(`M0,0 H${sx1 - 40} L${sx1 - 40},${floorY} H0 Z`, '#e9d7b8');
  const steps = 9;
  for (let s = 0; s < steps; s++) {
    const t = s / steps;
    const x = t * (sx1 - 30);
    const y = L.stairs.top + t * (floorY - L.stairs.top);
    g += pt.rect(x, y, sx1 - x, (floorY - L.stairs.top) / steps, s % 2 ? 'floor' : 'floor2', 1);
  }
  g += pt.line(`M0,${L.stairs.top - 12} L${sx1 + 6},${floorY - 34}`, 'bar2', 5);
  for (let k = 0; k < 4; k++) {
    const x = 20 + k * 60;
    const y = L.stairs.top - 12 + ((floorY - 22 - L.stairs.top) * x) / (sx1 + 6);
    g += pt.line(`M${x},${y} V${y + 30}`, 'bar2', 3);
  }
  g += `<path d="M0,0 L${sx1},0 L${sx1 - 100},${floorY} L0,${floorY} Z" fill="#fff4d6" opacity="0.3"/>`;
  g += pt.rect(sx1 - 120, 40, 96, 26, 'white', 4) + `<text x="${sx1 - 72}" y="58" text-anchor="middle" font-family="${HAND}" font-size="13" font-weight="700" fill="${pt.p.ink}">↑ Upstairs</text>`;
  g += `<rect width="${w}" height="${h}" filter="url(#grain)"/>`;
  // A cellar is dimmer than the room upstairs, whatever the time of day.
  g += `<rect width="${w}" height="${h}" fill="#5a3a2a" opacity="0.08"/>`;
  return g;
}
