// A Gdańsk townhouse front, drawn flat (like a photo taken straight on) and then laid onto the
// slanted house rows of the street (street.ts). Modelled on ul. Długa: tall narrow houses in pink,
// mint, ochre and white, white cornices between the floors, framed windows with little pediments,
// a shop or an arcade on the ground floor (with a striped awning or a painted sign), flower
// boxes and Gdańsk's flag here and there, and a gable on top: Dutch scrolls with stone urns,
// steps, a plain point, or an attic wall with a balustrade. See project.md section 6.14, part 6.

import { hex, mix, Pixels, type Rgb } from './raster';

export type Gable = 'scroll' | 'stepped' | 'pointed' | 'attic';
type Pediment = 'triangle' | 'arch' | 'flat';

export interface TownhouseSpec {
  /** Windows across: 2 to 4. */
  bays: number;
  /** From the ground to the top of the main cornice, in art pixels. */
  height: number;
  gable: Gable;
  colour: Rgb;
  ground: 'shop' | 'arcade';
  pediment: Pediment;
  /** A striped awning over the shop window, in this colour; or none. */
  awning: Rgb | null;
  /** A painted shop sign over the window, when there's no awning. */
  sign: boolean;
  /** Flower boxes under the first-floor windows. */
  flowers: boolean;
  /** Gdańsk's flag hanging from the top floor (three windows across only). */
  flag: boolean;
  seed: number;
}

/** A finished front: its picture, and which of its pixels glow (lit windows after dusk). */
export interface TownhouseFront {
  image: Pixels;
  glow: Pixels;
  /** How far the gable (and its finial) rises above the main cornice. */
  gableHeight: number;
}

/** Facade colours seen on Długa and Mariacka. */
export const FACADE_COLOURS = [
  '#e9b7b3', '#f0c9a0', '#e6bd62', '#efe4cc', '#a9d4c2', '#8fb3a5',
  '#c25b43', '#b9cde0', '#f3eee4', '#d98b6a', '#c9a3c4', '#e8c07a',
].map(hex);

/** Awnings: red, beige, bottle green and navy. */
export const AWNING_COLOURS = ['#b8322a', '#d9c7a3', '#3f7a52', '#2f5f86'].map(hex);

/** Gdańsk's flag as a hanging banner: the golden crown over two white crosses on red, with a swallowtail. */
const FLAG = ['.y.y.', 'yyyyy', 'rrrrr', 'rrwrr', 'rwwwr', 'rrwrr', 'rrrrr', 'rrwrr', 'rwwwr', 'rrwrr', 'rrrrr', 'rr.rr'];

const C = {
  ink: hex('#3b2433'),
  white: hex('#ffffff'),
  trim: hex('#f6eedf'),
  trimShade: hex('#d9ccb4'),
  stone: hex('#b9b2a6'),
  stoneShade: hex('#9a9286'),
  glass: hex('#4d6a88'),
  glassDark: hex('#3e5674'),
  glassLight: hex('#9fc0d8'),
  lit: hex('#ffd76a'),
  litWarm: hex('#ffb84a'),
  door: hex('#5a3a28'),
  doorLight: hex('#7a5236'),
  gold: hex('#e6b83e'),
  iron: hex('#2e2a33'),
  stripe: hex('#f4f1ea'),
  signBoard: hex('#2f4a3a'),
  box: hex('#9c5a33'),
  leaf: hex('#4f8a43'),
  flowers: [hex('#d9412b'), hex('#f08aa0'), hex('#f4c531')],
  red: hex('#c8102e'),
};

/** Width of a front with this many windows across. */
export const frontWidth = (bays: number) => bays * 6 + 3;
const FLOOR = 12;
const CORNICE = 3;

function random(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) >>> 8) / 16777216;
}

/** How tall a gable of this kind is on a front this wide (finial included). */
function gableHeightOf(kind: Gable, w: number): number {
  if (kind === 'attic') return 6;
  if (kind === 'scroll') return Math.round(w * 0.8) + 5;
  if (kind === 'stepped') return Math.round(w * 0.7) + 1;
  return Math.round(w * 0.6) + 3;
}

export function drawTownhouse(spec: TownhouseSpec, dusk: boolean): TownhouseFront {
  const w = frontWidth(spec.bays);
  const gableHeight = gableHeightOf(spec.gable, w);
  const H = spec.height + gableHeight;
  const image = new Pixels(w, H);
  const glow = new Pixels(w, H);
  const rnd = random(spec.seed);
  const bright = spec.colour[0] + spec.colour[1] + spec.colour[2] > 640;
  // White and cream houses get grey stone trim, so the cornices still show.
  const trim = bright ? C.stone : C.trim;
  const trimShade = bright ? C.stoneShade : C.trimShade;
  const s = {
    light: mix(spec.colour, C.white, 0.22),
    mid: spec.colour,
    dark: mix(spec.colour, C.ink, 0.28),
    deep: mix(spec.colour, C.ink, 0.45),
  };
  const rect = (x0: number, y0: number, x1: number, y1: number, colour: Rgb) => {
    for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) image.set(x, y, colour);
  };
  const lamp = (x0: number, y0: number, x1: number, y1: number, colour: Rgb) => {
    rect(x0, y0, x1, y1, colour);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) glow.set(x, y, C.white);
  };

  const base = H;
  const top = base - spec.height;
  const floors = Math.max(1, Math.floor((spec.height - CORNICE - FLOOR) / FLOOR));
  const groundTop = top + CORNICE + floors * FLOOR;

  // The wall, lit from the left.
  rect(0, top, w, base, s.mid);
  rect(0, top, 1, base, s.light);
  rect(w - 1, top, w, base, s.dark);

  // The upper floors: a white cornice under each, and a row of framed windows.
  for (let f = 0; f < floors; f++) {
    const y = top + CORNICE + f * FLOOR;
    rect(0, y + FLOOR - 1, w, y + FLOOR, trim);
    const pediment: Pediment = f === 0 ? 'arch' : spec.pediment;
    for (let b = 0; b < spec.bays; b++) {
      const x = 3 + b * 6;
      const lit = dusk && rnd() > 0.4;
      // Frame, pane (with a transom bar), sill and the little decoration above.
      rect(x - 1, y + 2, x + 4, y + 10, trim);
      if (lit) lamp(x, y + 3, x + 3, y + 9, C.lit);
      else rect(x, y + 3, x + 3, y + 9, C.glass);
      rect(x, y + 5, x + 3, y + 6, lit ? C.litWarm : C.glassDark);
      if (lit) lamp(x, y + 5, x + 3, y + 6, C.litWarm);
      else image.set(x, y + 3, C.glassLight);
      rect(x - 2, y + 9, x + 5, y + 10, trim);
      rect(x - 1, y + 10, x + 4, y + 11, trimShade);
      if (pediment === 'triangle') {
        rect(x - 1, y + 1, x + 4, y + 2, trim);
        rect(x + 1, y, x + 2, y + 1, trim);
      } else if (pediment === 'arch') {
        rect(x, y + 1, x + 3, y + 2, trim);
      } else {
        rect(x - 2, y + 1, x + 5, y + 2, trimShade);
      }
      // Flower boxes on the sills of the first floor.
      if (spec.flowers && f === floors - 1) {
        for (let k = -1; k < 4; k++) image.set(x + k, y + 9, k % 2 === 0 ? C.leaf : C.flowers[(b + k + 3) % 3]);
        rect(x - 1, y + 10, x + 4, y + 11, C.box);
      }
    }
  }

  // Gdańsk's flag, hanging from a rod over the middle window of the top floor.
  if (spec.flag && spec.bays === 3 && floors >= 2) {
    const fx = 8;
    rect(fx - 1, top + 3, fx + 6, top + 4, C.iron);
    FLAG.forEach((row, k) => {
      [...row].forEach((ch, i) => {
        if (ch !== '.') image.set(fx + i, top + 4 + k, ch === 'r' ? C.red : ch === 'w' ? C.white : C.gold);
      });
    });
  }

  // The main cornice along the top, with a shadow underneath.
  rect(0, top, w, top + 2, trim);
  for (let x = 1; x < w; x += 2) image.set(x, top + 1, trimShade);
  rect(0, top + 2, w, top + 3, s.deep);

  // The ground floor: a stone base with a shop window and a door, or arches.
  const stoneWall = mix(s.mid, trimShade, 0.4);
  rect(1, groundTop, w - 1, base, stoneWall);
  rect(0, base - 1, w, base, trimShade);
  const groundHeight = base - groundTop;
  if (spec.ground === 'arcade') {
    for (let b = 0; b < spec.bays; b++) {
      const x = 2 + b * 6;
      rect(x, groundTop + 4, x + 5, base - 1, s.deep);
      rect(x + 1, groundTop + 3, x + 4, groundTop + 4, s.deep);
      if (dusk) lamp(x + 1, groundTop + 6, x + 4, base - 2, C.litWarm);
      else rect(x + 1, groundTop + 6, x + 4, base - 2, C.glass);
    }
  } else {
    const shopRight = w - 7;
    rect(2, groundTop + 3, shopRight, groundTop + 4, trim);
    if (dusk) lamp(2, groundTop + 4, shopRight, base - 2, C.lit);
    else {
      rect(2, groundTop + 4, shopRight, base - 2, C.glass);
      rect(3, groundTop + 5, 4, base - 3, C.glassLight);
    }
    if (spec.awning) {
      // A striped awning over the shop window, scalloped along the bottom, with its shadow.
      for (let k = 0; k < 4; k++) {
        for (let x = 1; x < shopRight + 1; x++) {
          if (k === 3 && x % 2 === 1) continue;
          image.set(x, groundTop + 2 + k, Math.floor((x - 1) / 2) % 2 === 0 ? spec.awning : C.stripe);
        }
      }
      if (!dusk) rect(2, groundTop + 6, shopRight, groundTop + 7, C.glassDark);
    } else if (spec.sign) {
      // A painted sign with gilded letters.
      rect(2, groundTop, shopRight, groundTop + 3, C.signBoard);
      for (let x = 3; x < shopRight - 1; x++) if ((x * 7 + spec.seed) % 5 !== 0) image.set(x, groundTop + 1, C.gold);
    }
    const dx = w - 6;
    const doorTop = Math.max(groundTop + 2, base - 9);
    rect(dx, doorTop, dx + 4, base - 1, C.door);
    rect(dx + 1, doorTop + 1, dx + 3, base - 1, C.doorLight);
    rect(dx, doorTop - 1, dx + 4, doorTop, trim);
    if (groundHeight > 12) rect(dx + 1, doorTop - 3, dx + 3, doorTop - 1, dusk ? C.lit : C.glass);
  }

  // The gable.
  const mid = w / 2;
  const h = gableHeight - (spec.gable === 'scroll' ? 5 : spec.gable === 'pointed' ? 3 : spec.gable === 'attic' ? 3 : 1);
  for (let k = 0; k < h; k++) {
    const t = k / h;
    let half: number;
    if (spec.gable === 'pointed') half = (w / 2) * (1 - t);
    else if (spec.gable === 'stepped') half = (w / 2) * (1 - Math.floor(t * 4) / 4);
    else if (spec.gable === 'attic') half = w / 2;
    // Dutch scrolls: curving in, a straight neck, and a rounded top.
    else if (t < 0.45) half = w / 2 - (w / 2) * 0.48 * (t / 0.45) ** 2;
    else if (t < 0.84) half = (w / 2) * 0.52;
    else half = (w / 2) * 0.52 * Math.sqrt(Math.max(0, 1 - ((t - 0.84) / 0.16) ** 2));
    if (half <= 0.5) continue;
    const y = top - k - 1;
    const x0 = Math.round(mid - half);
    const x1 = Math.round(mid + half);
    if (spec.gable === 'attic') {
      // A balustrade: a rail on top of little posts.
      if (k === h - 1) rect(x0, y, x1, y + 1, trim);
      else for (let x = x0; x < x1; x += 2) image.set(x, y, trim);
      continue;
    }
    rect(x0, y, x1, y + 1, s.mid);
    // The gable's edge is white stone on scroll gables, shaded on the others.
    image.set(x0, y, spec.gable === 'scroll' ? trim : s.light);
    image.set(x1 - 1, y, spec.gable === 'scroll' ? trimShade : s.dark);
  }
  if (spec.gable === 'scroll') {
    // A cornice across the neck, a round window, urns on the shoulders and a gilded finial.
    const neck = top - Math.round(h * 0.45) - 1;
    rect(mid - w * 0.26 - 1, neck, mid + w * 0.26 + 1, neck + 1, trim);
    const wy = top - Math.round(h * 0.68);
    rect(mid - 1, wy - 1, mid + 1, wy + 2, trim);
    if (dusk) lamp(mid - 1, wy, mid + 1, wy + 1, C.lit);
    else rect(mid - 1, wy, mid + 1, wy + 1, C.glass);
    for (const ux of [0, w - 2]) {
      rect(ux, top - 2, ux + 2, top, trim);
      rect(ux, top - 3, ux + 1, top - 2, trimShade);
    }
    const crown = top - h;
    rect(mid - 1, crown - 2, mid + 1, crown, trim);
    rect(mid - 0.5, crown - 5, mid + 0.5, crown - 2, rnd() > 0.5 ? C.gold : trimShade);
  } else if (spec.gable === 'stepped') {
    for (let step = 0; step < 4; step++) {
      const half = (w / 2) * (1 - step / 4);
      const y = top - Math.round((step * h) / 4) - 1;
      rect(mid - half, y, mid - half + 1, y + 1, trim);
      rect(mid + half - 1, y, mid + half, y + 1, trim);
    }
    const wy = top - Math.round(h * 0.45);
    if (dusk) lamp(mid - 1, wy, mid + 1, wy + 2, C.lit);
    else rect(mid - 1, wy, mid + 1, wy + 2, C.glass);
  } else if (spec.gable === 'pointed') {
    const wy = top - Math.round(h * 0.4);
    if (dusk) lamp(mid - 1, wy, mid + 1, wy + 2, C.lit);
    else rect(mid - 1, wy, mid + 1, wy + 2, C.glass);
    rect(mid - 0.5, top - h - 3, mid + 0.5, top - h, C.iron);
  } else {
    // Urns on the attic wall.
    for (const ux of [0, Math.floor(mid) - 1, w - 2]) rect(ux, top - h - 3, ux + 2, top - h, trim);
  }
  return { image, glow, gableHeight };
}
