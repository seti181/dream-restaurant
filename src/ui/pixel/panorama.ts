// The riverside panorama behind the planning screens and the day report: Długie Pobrzeże,
// a row of Gdańsk townhouses along the Motława with the Żuraw, boats and the reflections in
// the water. By day for planning, in the evening for the day report, with the Fair's stalls
// on the quay during St. Dominic's Fair. See project.md section 6.14 (concepts A and D).
//
// Only the strip along the bottom of the screen is drawn here, with see-through sky; the
// sky itself is a CSS gradient behind it (panoramaSky()).

import type { Weather } from '../../data/weather';
import { hex, mix, Pixels, type Rgb } from './raster';

/** Art pixels across; shown twice as big on the 1280-wide tablet. */
export const PANORAMA_WIDTH = 640;
export const PANORAMA_HEIGHT = 164;
/** Where the quay is, from the top of the strip. */
const QUAY = 128;

const C = {
  ink: hex('#3b2433'),
  white: hex('#ffffff'),
  water: hex('#3f86ad'),
  waterDeep: hex('#2f6a8e'),
  waterLight: hex('#9fd0e6'),
  quay: hex('#c4b8a6'),
  quayLight: hex('#d8cdbc'),
  quayDark: hex('#8f8478'),
  brick: hex('#a8462f'),
  brickLight: hex('#bf5a40'),
  brickDark: hex('#7c3221'),
  mortar: hex('#c98a6a'),
  timber: hex('#5a3a28'),
  timberLight: hex('#7a5236'),
  timberDark: hex('#3f2819'),
  roof: hex('#8c3a2a'),
  roofDark: hex('#6a2a1e'),
  gold: hex('#e6b83e'),
  trim: hex('#f6eedf'),
  trimShade: hex('#d9ccb4'),
  glass: hex('#3e5a78'),
  glassLight: hex('#8fb3cf'),
  lit: hex('#ffd76a'),
  litWarm: hex('#ffb84a'),
  door: hex('#5a3a28'),
  iron: hex('#2e2a33'),
  red: hex('#c8102e'),
  stripe: hex('#f4f1ea'),
  skin: hex('#f3c9a5'),
  dusk: hex('#3a3366'),
  houses: [
    '#e8c07a', '#e39a7a', '#c25b43', '#efe3c8', '#9cc2b2', '#c9a3c4',
    '#f2dfb8', '#86a8c8', '#eaa84a', '#dcbc92', '#f0c9c0', '#b9d3c2', '#f4efe6',
  ].map(hex),
};

/** The sky behind the panorama, as a CSS gradient: by weather in the morning, dusk in the evening. */
export function panoramaSky(weather: Weather, evening: boolean): string {
  if (evening) return 'linear-gradient(#1f2a55, #5b4a7a 55%, #e08a6e)';
  if (weather === 'rain') return 'linear-gradient(#7d8c99, #b9c4cc)';
  if (weather === 'cloudy') return 'linear-gradient(#a9c2d2, #e3ebf0)';
  if (weather === 'heatwave') return 'linear-gradient(#7fc0e6, #fff1c8)';
  return 'linear-gradient(#7fc0e6, #e6f4fa)';
}

const shades = (c: Rgb) => ({ light: mix(c, C.white, 0.22), mid: c, dark: mix(c, C.ink, 0.28), deep: mix(c, C.ink, 0.45) });

function rect(img: Pixels, x0: number, y0: number, x1: number, y1: number, colour: Rgb, alpha = 255): void {
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) img.set(x, y, colour, alpha);
}

/** A seeded little random generator, so the panorama is the same every time. */
function random(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) >>> 8) / 16777216;
}

type Gable = 'scroll' | 'stepped' | 'pointed' | 'attic';

interface HouseStyle {
  colour: Rgb;
  gable: Gable;
  floors: number;
  bays: number;
  shop: 'awning' | 'arcade' | 'door';
  awning: Rgb;
  lit: boolean;
  seed: number;
}

const FLOOR = 17;
const GROUND = 20;

function windowAt(img: Pixels, x: number, y: number, lit: boolean, pediment: 'triangle' | 'arch' | 'flat', rnd: () => number): void {
  rect(img, x - 1, y - 1, x + 6, y + 10, C.trim);
  const glow = lit && rnd() > 0.35;
  rect(img, x, y, x + 5, y + 9, glow ? C.lit : C.glass);
  rect(img, x + 2, y, x + 3, y + 9, glow ? C.litWarm : mix(C.glass, C.ink, 0.25));
  rect(img, x, y + 4, x + 5, y + 5, glow ? C.litWarm : mix(C.glass, C.ink, 0.25));
  if (!glow) img.set(x + 1, y + 1, C.glassLight);
  rect(img, x - 2, y + 10, x + 7, y + 11, C.trim);
  rect(img, x - 2, y + 11, x + 7, y + 12, C.trimShade);
  if (pediment === 'triangle') {
    for (let k = 0; k < 3; k++) rect(img, x - 1 + k, y - 2 - k, x + 6 - k, y - 1 - k, k === 2 ? C.trimShade : C.trim);
  } else if (pediment === 'arch') {
    rect(img, x, y - 2, x + 5, y - 1, C.trim);
    rect(img, x + 1, y - 3, x + 4, y - 2, C.trim);
  } else {
    rect(img, x - 2, y - 3, x + 7, y - 1, C.trim);
  }
}

/** The gable on top of a townhouse: Dutch scrolls with urns, steps, a plain point, or an attic wall. */
function gable(img: Pixels, x: number, top: number, w: number, kind: Gable, s: ReturnType<typeof shades>, rnd: () => number): void {
  const mid = x + w / 2;
  const h = kind === 'attic' ? 9 : Math.round(w * 0.95);
  for (let k = 0; k < h; k++) {
    const t = k / h;
    let half: number;
    if (kind === 'pointed') half = (w / 2) * (1 - t);
    else if (kind === 'stepped') half = (w / 2) * (1 - Math.floor(t * 4) / 4);
    else if (kind === 'attic') half = w / 2;
    else if (t < 0.45) half = w / 2 - (w / 2) * 0.48 * (t / 0.45) ** 2;
    else if (t < 0.84) half = (w / 2) * 0.52;
    else half = (w / 2) * 0.52 * Math.sqrt(Math.max(0, 1 - ((t - 0.84) / 0.16) ** 2));
    if (half <= 0.5) continue;
    const y = top - k - 1;
    rect(img, Math.round(mid - half), y, Math.round(mid + half), y + 1, s.mid);
    img.set(Math.round(mid - half), y, s.light);
    img.set(Math.round(mid + half) - 1, y, s.dark);
  }
  if (kind === 'scroll') {
    const shoulder = top - Math.round(h * 0.44);
    for (const sx of [Math.round(mid - w * 0.26) - 2, Math.round(mid + w * 0.26)]) {
      rect(img, sx, shoulder - 1, sx + 3, shoulder + 2, C.trim);
      img.set(sx + 1, shoulder, s.dark);
    }
    for (const ux of [x, x + w - 3]) {
      rect(img, ux, top - 4, ux + 3, top, C.trim);
      rect(img, ux + 1, top - 6, ux + 2, top - 4, C.trimShade);
    }
    rect(img, mid - 2, top - Math.round(h * 0.6), mid + 2, top - Math.round(h * 0.6) + 4, C.trim);
    rect(img, mid - 1, top - Math.round(h * 0.6) + 1, mid + 1, top - Math.round(h * 0.6) + 3, C.glass);
    const crown = top - h;
    rect(img, mid - 1.5, crown - 3, mid + 1.5, crown, C.trim);
    rect(img, mid - 0.5, crown - 7, mid + 1.5, crown - 3, rnd() > 0.5 ? C.gold : C.trimShade);
  } else if (kind === 'stepped') {
    for (let step = 0; step < 4; step++) {
      const half = (w / 2) * (1 - step / 4);
      const y = top - Math.round((step * h) / 4) - 1;
      rect(img, mid - half - 0.5, y - 1, mid - half + 1.5, y, C.trim);
      rect(img, mid + half - 1.5, y - 1, mid + half + 0.5, y, C.trim);
    }
    rect(img, mid - 1, top - Math.round(h * 0.5), mid + 1, top - Math.round(h * 0.5) + 3, C.glass);
  } else if (kind === 'pointed') {
    rect(img, mid - 0.5, top - h - 3, mid + 0.5, top - h, C.iron);
  } else {
    for (let ux = x + 1; ux < x + w - 1; ux += 5) rect(img, ux, top - h - 3, ux + 2, top - h, C.trim);
  }
}

/** A tall Gdańsk townhouse seen from the front, standing on `base`. Returns its width. */
function townhouse(img: Pixels, x: number, base: number, style: HouseStyle): number {
  const { colour, floors, bays } = style;
  const s = shades(colour);
  const rnd = random(style.seed);
  const w = bays * 9 + 5;
  const top = base - GROUND - floors * FLOOR;
  rect(img, x, top, x + w, base, s.mid);
  rect(img, x, top, x + 1, base, s.light);
  rect(img, x + w - 2, top, x + w, base, s.dark);
  rect(img, x + 1, top, x + 3, base - GROUND, mix(s.mid, C.trim, 0.25));
  rect(img, x + w - 4, top, x + w - 2, base - GROUND, mix(s.mid, C.trim, 0.15));
  const pediment = (['triangle', 'arch', 'flat'] as const)[style.seed % 3];
  for (let f = 0; f < floors; f++) {
    const y = base - GROUND - (f + 1) * FLOOR;
    rect(img, x, y + FLOOR - 1, x + w, y + FLOOR, C.trim);
    rect(img, x, y + FLOOR, x + w, y + FLOOR + 1, s.dark);
    for (let b = 0; b < bays; b++) windowAt(img, x + 5 + b * 9, y + 4, style.lit, f === floors - 1 ? 'arch' : pediment, rnd);
  }
  rect(img, x - 1, top - 2, x + w + 1, top, C.trim);
  rect(img, x - 1, top, x + w + 1, top + 1, s.deep);
  const g = base - GROUND;
  rect(img, x, g, x + w, base, mix(s.mid, C.trimShade, 0.35));
  if (style.shop === 'arcade') {
    for (let b = 0; b < bays; b++) {
      const ax = x + 3 + b * 9;
      rect(img, ax, g + 6, ax + 7, base, s.deep);
      rect(img, ax + 1, g + 4, ax + 6, g + 6, s.deep);
      rect(img, ax + 1, g + 8, ax + 6, base - 2, style.lit ? C.litWarm : C.glass);
    }
  } else {
    rect(img, x + 3, g + 7, x + w - 9, base - 2, style.lit ? C.lit : C.glass);
    rect(img, x + 3, g + 7, x + w - 9, g + 8, C.trim);
    const dx = x + w - 8;
    rect(img, dx, g + 5, dx + 6, base, C.door);
    rect(img, dx + 1, g + 6, dx + 5, base - 1, C.timberLight);
    rect(img, dx + 2, g + 3, dx + 4, g + 5, C.trim);
    if (style.shop === 'awning') {
      for (let k = 0; k < 5; k++) {
        for (let ax = x + 2; ax < x + w - 9; ax++) img.set(ax, g + 2 + k, Math.floor((ax - x) / 3) % 2 === 0 ? style.awning : C.stripe);
      }
      for (let ax = x + 2; ax < x + w - 9; ax += 3) img.set(ax, g + 7, style.awning);
    }
  }
  rect(img, x, base - 1, x + w, base, s.deep);
  gable(img, x, top - 2, w, style.gable, s, rnd);
  return w;
}

/** A whole row of townhouses. */
function row(img: Pixels, x0: number, x1: number, base: number, seed: number, lit: boolean): void {
  const rnd = random(seed);
  const gables: Gable[] = ['scroll', 'stepped', 'scroll', 'attic', 'pointed', 'scroll'];
  const awnings = [C.red, hex('#2f6f8f'), hex('#3c7a3a'), hex('#e9a23b'), hex('#7a3d5e')];
  for (let x = x0; x < x1; ) {
    x += townhouse(img, x, base, {
      colour: C.houses[Math.floor(rnd() * C.houses.length)],
      gable: gables[Math.floor(rnd() * gables.length)],
      floors: 2 + Math.floor(rnd() * 2),
      bays: 2 + Math.floor(rnd() * 2),
      shop: rnd() > 0.7 ? 'arcade' : rnd() > 0.3 ? 'awning' : 'door',
      awning: awnings[Math.floor(rnd() * awnings.length)],
      lit,
      seed: Math.floor(rnd() * 1e6),
    });
  }
}

function brickWall(img: Pixels, x0: number, y0: number, x1: number, y1: number): void {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const course = Math.floor((y - y0) / 3);
      const joint = (y - y0) % 3 === 2 || (x + (course % 2) * 3) % 6 === 0;
      img.set(x, y, joint ? C.mortar : (x * 7 + course * 13) % 11 === 0 ? C.brickLight : C.brick);
    }
  }
}

/** The Żuraw: two brick towers with the wooden crane house leaning out over the river. */
function zuraw(img: Pixels, x: number, base: number, lit: boolean): void {
  brickWall(img, x, base - 64, x + 20, base);
  brickWall(img, x + 44, base - 64, x + 64, base);
  rect(img, x + 18, base - 64, x + 20, base, C.brickDark);
  rect(img, x + 62, base - 64, x + 64, base, C.brickDark);
  brickWall(img, x + 20, base - 40, x + 44, base);
  rect(img, x + 26, base - 22, x + 38, base, C.ink);
  rect(img, x + 27, base - 24, x + 37, base - 22, C.ink);
  for (const tx of [x, x + 44]) {
    for (let k = 0; k < 12; k++) rect(img, tx + k * 0.8, base - 64 - k, tx + 20 - k * 0.8, base - 63 - k, k % 4 === 0 ? C.roofDark : C.roof);
    for (let y = base - 54; y < base - 10; y += 14) {
      rect(img, tx + 8, y, tx + 12, y + 6, lit ? C.lit : C.ink);
      rect(img, tx + 8, y - 1, tx + 12, y, C.trimShade);
    }
  }
  rect(img, x + 14, base - 96, x + 50, base - 40, C.timber);
  for (let y = base - 94; y < base - 40; y += 3) rect(img, x + 14, y, x + 50, y + 1, C.timberDark);
  for (let px = x + 18; px < x + 50; px += 8) rect(img, px, base - 96, px + 1, base - 40, C.timberLight);
  rect(img, x + 26, base - 76, x + 38, base - 64, C.timberDark);
  rect(img, x + 28, base - 74, x + 36, base - 66, C.lit);
  for (let k = 0; k < 20; k++) rect(img, x + 12 + k * 0.9, base - 96 - k, x + 52 - k * 0.9, base - 95 - k, k % 4 === 0 ? C.roofDark : C.roof);
  rect(img, x + 31, base - 120, x + 33, base - 116, C.iron);
}

/** A tall ship of the kind that takes tourists out to Westerplatte. */
function tallShip(img: Pixels, x: number, waterline: number, evening: boolean): void {
  for (let k = 0; k < 10; k++) {
    const inset = k * 0.9;
    rect(img, x + inset, waterline - 10 + k, x + 70 - inset * 0.6, waterline - 9 + k, k < 2 ? C.gold : k < 4 ? C.red : C.iron);
  }
  rect(img, x + 56, waterline - 16, x + 70, waterline - 10, C.iron);
  rect(img, x + 4, waterline - 14, x + 16, waterline - 10, C.iron);
  for (const [mx, mh] of [[22, 54], [42, 60], [60, 44]] as const) {
    rect(img, x + mx, waterline - 10 - mh, x + mx + 1, waterline - 10, C.timberDark);
    for (let s = 0; s < 3; s++) {
      const sy = waterline - 10 - mh + 6 + s * 15;
      const sw = 16 - s * 2;
      for (let k = 0; k < 11; k++) {
        const sail = evening ? mix(C.trim, C.dusk, 0.35) : k > 8 ? C.trimShade : C.trim;
        rect(img, x + mx - sw / 2 + (k > 8 ? 1 : 0), sy + k, x + mx + sw / 2 - (k > 8 ? 1 : 0), sy + k + 1, sail);
      }
    }
    rect(img, x + mx + 1, waterline - 14 - mh, x + mx + 7, waterline - 11 - mh, C.red);
  }
}

function smallBoat(img: Pixels, x: number, waterline: number, colour: Rgb): void {
  for (let k = 0; k < 4; k++) rect(img, x + k, waterline - 4 + k, x + 22 - k, waterline - 3 + k, k === 0 ? C.trim : colour);
  rect(img, x + 6, waterline - 8, x + 14, waterline - 4, C.trim);
  rect(img, x + 7, waterline - 7, x + 13, waterline - 5, C.glass);
}

function person(img: Pixels, x: number, base: number, shirt: Rgb, hair: Rgb): void {
  rect(img, x, base - 9, x + 3, base - 7, hair);
  rect(img, x, base - 7, x + 3, base - 6, C.skin);
  rect(img, x, base - 6, x + 3, base - 2, shirt);
  rect(img, x, base - 2, x + 1, base, C.iron);
  rect(img, x + 2, base - 2, x + 3, base, C.iron);
}

/** A black double-headed Gdańsk lantern, lit in the evening. */
function lantern(img: Pixels, x: number, base: number, lit: boolean): void {
  rect(img, x, base - 30, x + 1, base, C.iron);
  rect(img, x - 1, base - 2, x + 2, base, C.iron);
  rect(img, x - 6, base - 30, x + 7, base - 29, C.iron);
  for (const lx of [x - 7, x + 5]) {
    rect(img, lx, base - 29, lx + 3, base - 24, lit ? C.lit : C.glassLight);
    rect(img, lx - 0.5, base - 30, lx + 3.5, base - 29, C.iron);
    if (lit) for (let r = 1; r < 6; r++) for (let a = 0; a < 12; a++) img.set(lx + 1.5 + Math.cos(a) * r, base - 26 + Math.sin(a) * r, C.lit, 40);
  }
}

/** The Motława, reflecting what stands on the quay, broken up by little ripples. */
function river(img: Pixels, top: number, bottom: number, evening: boolean): void {
  for (let y = top; y < bottom; y++) {
    const depth = (y - top) / (bottom - top);
    const wave = Math.round(Math.sin(y * 0.9) * 1.4 + Math.sin(y * 2.3) * 0.6);
    for (let x = 0; x < PANORAMA_WIDTH; x++) {
      const mirrored = img.get(x + wave, top - 2 - Math.floor((y - top) * 1.25));
      const base = evening ? mix(C.waterDeep, C.dusk, 0.45) : mix(C.water, C.waterDeep, depth);
      let colour = mirrored ? mix(mirrored, base, 0.35 + depth * 0.4) : base;
      const glint = (Math.floor(x / 5) * 13 + y * 7) % 41 === 0 && y % 3 === 0;
      if (glint) colour = evening ? mix(C.lit, colour, 0.3) : mix(C.waterLight, colour, 0.2);
      img.set(x, y, colour);
    }
  }
}

/**
 * The riverside strip: townhouses with the Żuraw, the quay with lanterns and people, and the
 * river with a tall ship. In the evening the windows and lanterns are lit; during the Fair,
 * striped stalls and strings of lights line the quay. The sky above is left see-through.
 */
export function drawPanorama({ evening, fair }: { evening: boolean; fair: boolean }): Pixels {
  const img = new Pixels(PANORAMA_WIDTH, PANORAMA_HEIGHT);
  row(img, -6, 360, QUAY, 1997, evening);
  zuraw(img, 360, QUAY, evening);
  row(img, 424, PANORAMA_WIDTH + 20, QUAY, 2024, evening);
  // The quay: granite slabs, then its edge.
  rect(img, 0, QUAY, PANORAMA_WIDTH, QUAY + 8, C.quay);
  for (let x = 0; x < PANORAMA_WIDTH; x += 12) rect(img, x, QUAY, x + 1, QUAY + 8, C.quayDark);
  rect(img, 0, QUAY, PANORAMA_WIDTH, QUAY + 1, C.quayLight);
  rect(img, 0, QUAY + 8, PANORAMA_WIDTH, QUAY + 10, C.quayDark);
  if (fair) {
    for (let x = 10; x < PANORAMA_WIDTH - 40; x += 62) {
      rect(img, x, QUAY - 16, x + 44, QUAY, C.timberLight);
      rect(img, x + 2, QUAY - 12, x + 42, QUAY - 2, evening ? C.litWarm : C.trim);
      for (let k = 0; k < 44; k += 6) {
        rect(img, x + k, QUAY - 24, x + k + 3, QUAY - 16, C.red);
        rect(img, x + k + 3, QUAY - 24, x + k + 6, QUAY - 16, C.stripe);
      }
      for (let k = 0; k < 44; k += 3) img.set(x + k, QUAY - 15 + (k % 2), C.red);
    }
    for (let x = 0; x < PANORAMA_WIDTH; x += 4) img.set(x, QUAY - 40 + Math.round(Math.abs(Math.sin(x / 31)) * 8), evening ? C.lit : C.gold);
  }
  for (const lx of [40, 150, 300, 470, 590]) lantern(img, lx, QUAY + 4, evening);
  const shirts = [C.red, hex('#2f6f8f'), hex('#e9a23b'), hex('#7a3d5e'), hex('#3c7a3a'), C.trim];
  const hair = [hex('#4a3426'), hex('#e8c06a'), hex('#2e2a33'), hex('#8a5233'), hex('#c9c4bd')];
  const rnd = random(77);
  for (let i = 0; i < 26; i++) person(img, Math.floor(rnd() * (PANORAMA_WIDTH - 4)), QUAY + 7, shirts[i % shirts.length], hair[i % hair.length]);
  river(img, QUAY + 10, PANORAMA_HEIGHT, evening);
  tallShip(img, 470, PANORAMA_HEIGHT - 4, evening);
  smallBoat(img, 70, PANORAMA_HEIGHT - 8, hex('#2f6f8f'));
  smallBoat(img, 250, PANORAMA_HEIGHT - 2, C.red);
  return img;
}
