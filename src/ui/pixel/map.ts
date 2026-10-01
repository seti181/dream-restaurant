// The Old Town map in pixel art, seen from above: the Motława and Granary Island,
// streets lined with gabled houses, and the landmarks. Map coordinates are metres east
// (x) and north (y), the same as in data/locations.ts.

import type { LocationId } from '../../data/locations';
import type { IconArt } from './icons';
import { hex, Pixels, type Rgb } from './raster';
import { sprite } from './sprites';

export const MAP_WIDTH = 300;
export const MAP_HEIGHT = 180;

/** A map position (metres east, metres north) as a pixel on the map. */
export function mapPixel(x: number, north: number): { px: number; py: number } {
  return { px: Math.round((x - 150) / 3), py: Math.round((-north + 330) / 3) };
}

const C = {
  land: hex('#efe2c6'),
  landDot: hex('#e6d6b6'),
  street: hex('#fbf5e8'),
  lane: hex('#f6ecd8'),
  water: hex('#8fc1d8'),
  waterLight: hex('#b9dbe9'),
  waterDark: hex('#6fa6c0'),
  bank: hex('#c9b89a'),
  outline: hex('#3b2433'),
  brick: hex('#a9472f'),
  brickDark: hex('#7a3322'),
  roofGreen: hex('#4f6f63'),
  window: hex('#fdf6e3'),
  gold: hex('#d9a92b'),
  gateTan: hex('#c98f5a'),
  wood: hex('#4a3426'),
  sail: hex('#fdf6e3'),
  houses: ['#e9a23b', '#b5452f', '#5d8aa8', '#e4c9a0', '#7a9e6b', '#d98c6a', '#c9b458'].map(hex),
  heart: hex('#d9412b'),
};

/** Streets running east–west: pixel row of their middle and where they start and end. */
const STREETS = [
  { y: 116, x0: 7, x1: 220 }, // Długa and Długi Targ
  { y: 149, x0: 7, x1: 220 }, // Ogarna
  { y: 49, x0: 7, x1: 123 }, // Piwna
  { y: 44, x0: 137, x1: 220 }, // Mariacka
];
const LANES = [77, 137, 190];
const WATERFRONT = 222;

/** Where the Motława's middle is at a given row (it bends a little). */
const riverAt = (py: number) => 244 - 3 * Math.sin((py / MAP_HEIGHT) * Math.PI * 1.6);
const RIVER_HALF = 7;
const NEW_RIVER = 297;

function fillRect(img: Pixels, x0: number, y0: number, x1: number, y1: number, c: Rgb): void {
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) img.set(x, y, c);
}

/** A gabled house front, its base on row `base`. */
function house(img: Pixels, x: number, base: number, i: number): void {
  const colour = C.houses[i % C.houses.length];
  const h = 5 + (i % 3);
  for (let y = base - h; y < base; y++) for (let dx = 0; dx < 6; dx++) img.set(x + dx, y, colour);
  for (let r = 0; r < 3; r++) for (let dx = r; dx < 6 - r; dx++) img.set(x + dx, base - h - 1 - r, colour);
  img.set(x + 2, base - h + 1, C.window);
  img.set(x + 3, base - h + 1, C.window);
  // Outline: sides, roof slopes and the base.
  for (let y = base - h - 1; y <= base; y++) {
    img.set(x - 1, y, C.outline);
    img.set(x + 6, y, C.outline);
  }
  for (let r = 0; r < 4; r++) {
    img.set(x - 1 + r, base - h - 1 - r, C.outline);
    img.set(x + 6 - r, base - h - 1 - r, C.outline);
  }
}

function inRiver(px: number, py: number): boolean {
  return Math.abs(px - riverAt(py)) <= RIVER_HALF || px >= NEW_RIVER - 6;
}

/** The whole map, drawn once. */
export function drawOldTown(): Pixels {
  const img = new Pixels(MAP_WIDTH, MAP_HEIGHT);

  // Land, with a little texture.
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) img.set(x, y, (x * 7 + y * 13) % 23 === 0 ? C.landDot : C.land);
  }
  // Lanes, streets and the waterfront.
  for (const lx of LANES) fillRect(img, lx - 1, 0, lx + 2, MAP_HEIGHT, C.lane);
  for (const s of STREETS) fillRect(img, s.x0, s.y - 3, s.x1, s.y + 4, C.street);
  fillRect(img, WATERFRONT - 3, 0, WATERFRONT + 4, MAP_HEIGHT, C.street);

  // Houses along both sides of every street, leaving gaps for the lanes and landmarks.
  let i = 0;
  const busy = (x: number, y: number) =>
    LANES.some((lane) => Math.abs(x + 3 - lane) < 5) || (x > 92 && x < 142 && y < 40) || (x > 208 && y > 95 && y < 125);
  for (const s of STREETS) {
    for (let x = s.x0 + 1; x + 6 < s.x1; x += 8) {
      for (const base of [s.y - 4, s.y + 13]) {
        if (busy(x, base)) continue;
        house(img, x, base, i++ * 5 + Math.floor(x / 8));
      }
    }
  }

  // St. Mary's: a huge brick church with a square tower.
  fillRect(img, 97, 3, 108, 33, C.brick);
  fillRect(img, 108, 15, 139, 33, C.brick);
  fillRect(img, 108, 12, 139, 15, C.roofGreen);
  for (const wx of [113, 120, 127, 134]) fillRect(img, wx, 19, wx + 2, 27, C.window);
  fillRect(img, 101, 8, 104, 12, C.window);
  outlineBox(img, 97, 3, 108, 33);
  outlineBox(img, 108, 12, 139, 33);

  // The Neptune Fountain on Długi Targ.
  for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 10) img.set(170 + x, 117 + y, C.waterLight);
  for (let y = 112; y < 118; y++) img.set(170, y, C.gold);
  img.set(168, 113, C.gold);
  img.set(172, 113, C.gold);
  img.set(169, 114, C.gold);
  img.set(171, 114, C.gold);

  // The Green Gate, where Długi Targ meets the river.
  fillRect(img, 212, 103, 226, 122, C.gateTan);
  fillRect(img, 212, 100, 226, 103, C.roofGreen);
  fillRect(img, 217, 114, 221, 122, C.brickDark);
  outlineBox(img, 212, 100, 226, 122);

  // The rivers, with a little shimmer, and Granary Island between them.
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (!inRiver(x, y)) continue;
      const shimmer = (x * 3 + y * 5) % 17;
      img.set(x, y, shimmer === 0 ? C.waterLight : shimmer === 9 ? C.waterDark : C.water);
    }
    const left = Math.round(riverAt(y) - RIVER_HALF - 1);
    const right = Math.round(riverAt(y) + RIVER_HALF + 1);
    img.set(left, y, C.bank);
    img.set(right, y, C.bank);
    img.set(NEW_RIVER - 7, y, C.bank);
  }
  // A street on the island and its brick granaries.
  fillRect(img, 268, 0, 271, MAP_HEIGHT, C.street);
  for (const gy of [14, 50, 86, 142]) {
    for (const gx of [256, 274]) {
      fillRect(img, gx, gy, gx + 10, gy + 14, C.brick);
      for (let r = 0; r < 5; r++) fillRect(img, gx + r, gy - 1 - r, gx + 10 - r, gy - r, C.brickDark);
      fillRect(img, gx + 4, gy + 8, gx + 6, gy + 14, C.brickDark);
      outlineBox(img, gx, gy, gx + 10, gy + 14);
    }
  }

  // Żuraw, the medieval Crane, on the waterfront.
  fillRect(img, 229, 58, 237, 78, C.wood);
  for (let r = 0; r < 4; r++) fillRect(img, 229 + r, 57 - r, 237 - r, 58 - r, C.wood);
  for (const cx of [228, 238]) for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 10) img.set(cx + x, 80 + y, C.brick);

  // A little boat on the Motława.
  const bx = Math.round(riverAt(124));
  fillRect(img, bx - 4, 125, bx + 4, 127, C.wood);
  for (let r = 0; r < 6; r++) fillRect(img, bx, 119 + r, bx + 1 + Math.floor(r / 2), 120 + r, C.sail);

  // A heart beside Mariacka.
  const heart = ['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'];
  heart.forEach((row, y) => [...row].forEach((c, x) => c === 'r' && img.set(150 + x, 26 + y, C.heart)));
  return img;
}

function outlineBox(img: Pixels, x0: number, y0: number, x1: number, y1: number): void {
  for (let x = x0 - 1; x <= x1; x++) {
    img.set(x, y0 - 1, C.outline);
    img.set(x, y1, C.outline);
  }
  for (let y = y0 - 1; y <= y1; y++) {
    img.set(x0 - 1, y, C.outline);
    img.set(x1, y, C.outline);
  }
}

// ---------- Street markers ----------

const MARK = { o: '#3b2433', w: '#fdf6e3', y: '#f4c531', Y: '#e9a23b', A: '#e9a23b', r: '#b5452f', b: '#5d8aa8', k: '#2f4f6f', g: '#4f8f45' };

/** A little picture for each street's marker. */
export const STREET_ICONS: Record<LocationId, IconArt> = {
  ogarna: { rows: ['..o...o..', '.oro.oyo.', 'orrrooyyo', 'orwroywyo', 'orrrooyyo', 'ooooooooo'], palette: MARK },
  piwna: { rows: ['.ooooo...', 'owwwwwo..', 'oyyyyyooo', 'oyYyyyo.o', 'oyyyYyo.o', 'oyyyyyooo', 'oyYyyyo..', '.ooooo...'], palette: MARK },
  mariacka: { rows: ['...oAo...', '..oAAAo..', '..ooooo..', '.oYo.oYo.', 'oYo...oYo', 'oYo...oYo', '.oYo.oYo.', '..ooooo..'], palette: MARK },
  dluga: { rows: ['.y..y..y.', '.y..y..y.', '.yyyyyyy.', '....y....', '....y....', '.ooooooo.', 'obbbbbbbo', '.ooooooo.'], palette: MARK },
  pobrzeze: { rows: ['...ooo...', '...oko...', '..kkkkk..', '....k....', '....k....', 'k...k...k', '.k..k..k.', '..kkkkk..'], palette: MARK },
  spichrzow: { rows: ['....o....', '...oro...', '..orrro..', '.orrrrro.', '.orwrwro.', '.orrrrro.', '.orwrwro.', '.ooooooo.'], palette: MARK },
};

/** Checks every marker icon draws (used by the tests). */
export function streetIconPixels(id: LocationId): Pixels {
  return sprite(STREET_ICONS[id].rows, STREET_ICONS[id].palette);
}
