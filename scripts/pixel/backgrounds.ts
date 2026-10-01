// Concept art for the planning-screen background (project.md section 6.14, part 5), version 2.
// Full-screen mock-ups at the tablet's size (1280×800), drawn at 640×400 art pixels and scaled
// up twice: detailed Gdańsk facades, the Motława with reflections, the Żuraw, the Town Hall.
// Each concept is written twice: the background alone, and with a placeholder for the interface.
// Run with `npx tsx scripts/pixel/backgrounds.ts`; it writes PNGs to art/concepts/.

import { mkdirSync, writeFileSync } from 'node:fs';
import { hex, mix, Pixels, pngBytes, type Rgb } from '../../src/ui/pixel/raster';

const W = 640;
const H = 400;
const SCALE = 2;

const C = {
  ink: hex('#3b2433'),
  white: hex('#ffffff'),
  skyTop: hex('#7fc0e6'),
  skyLow: hex('#e6f4fa'),
  duskTop: hex('#1f2a55'),
  duskMid: hex('#5b4a7a'),
  duskLow: hex('#e08a6e'),
  cloud: hex('#ffffff'),
  cloudMid: hex('#eaf2f7'),
  cloudShade: hex('#c9d9e4'),
  sun: hex('#f7cf3d'),
  sunCore: hex('#fff3b0'),
  moon: hex('#f6efd0'),
  star: hex('#fdf6e3'),
  water: hex('#3f86ad'),
  waterDeep: hex('#2f6a8e'),
  waterLight: hex('#9fd0e6'),
  quay: hex('#c4b8a6'),
  quayLight: hex('#d8cdbc'),
  quayDark: hex('#8f8478'),
  granite: hex('#b9b3aa'),
  brick: hex('#a8462f'),
  brickLight: hex('#bf5a40'),
  brickDark: hex('#7c3221'),
  mortar: hex('#c98a6a'),
  timber: hex('#5a3a28'),
  timberLight: hex('#7a5236'),
  timberDark: hex('#3f2819'),
  roof: hex('#8c3a2a'),
  roofDark: hex('#6a2a1e'),
  copper: hex('#4f9a83'),
  copperLight: hex('#7cc0a8'),
  copperDark: hex('#336b5a'),
  gold: hex('#e6b83e'),
  goldDark: hex('#b58a22'),
  trim: hex('#f6eedf'),
  trimShade: hex('#d9ccb4'),
  glass: hex('#3e5a78'),
  glassLight: hex('#8fb3cf'),
  lit: hex('#ffd76a'),
  litWarm: hex('#ffb84a'),
  door: hex('#5a3a28'),
  iron: hex('#2e2a33'),
  hud: hex('#b5452f'),
  hudLight: hex('#c65a43'),
  card: hex('#ffffff'),
  cardLine: hex('#e7ddcc'),
  pill: hex('#2f6f8f'),
  pillLight: hex('#dbe9ef'),
  wood: hex('#7b4f31'),
  woodLight: hex('#93603d'),
  woodDark: hex('#5c3a22'),
  paper: hex('#fbf6ea'),
  paperShade: hex('#e9dcc2'),
  coffee: hex('#4a2c1c'),
  cup: hex('#f4f1ea'),
  leaf: hex('#3e7a3a'),
  leafLight: hex('#7fb069'),
  leafDark: hex('#2c5a2a'),
  red: hex('#c8102e'),
  stripe: hex('#f4f1ea'),
  skin: hex('#f3c9a5'),
  houses: [
    '#e8c07a', '#e39a7a', '#c25b43', '#efe3c8', '#9cc2b2', '#c9a3c4',
    '#f2dfb8', '#86a8c8', '#eaa84a', '#dcbc92', '#f0c9c0', '#b9d3c2', '#f4efe6',
  ].map(hex),
};

/** Light, mid and dark shades of a colour. */
const shades = (c: Rgb) => ({ light: mix(c, C.white, 0.22), mid: c, dark: mix(c, C.ink, 0.28), deep: mix(c, C.ink, 0.45) });

function rect(img: Pixels, x0: number, y0: number, x1: number, y1: number, colour: Rgb, alpha = 255): void {
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) img.set(x, y, colour, alpha);
}

/** A seeded little random generator, so every render is the same. */
function random(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) >>> 8) / 16777216;
}

/** A sky gradient in dithered bands, the way pixel artists do it. */
function sky(img: Pixels, stops: Rgb[], until = H): void {
  for (let y = 0; y < until; y++) {
    const t = (y / until) * (stops.length - 1);
    const i = Math.min(stops.length - 2, Math.floor(t));
    const f = t - i;
    const band = Math.floor(f * 6) / 6;
    const next = Math.min(1, band + 1 / 6);
    for (let x = 0; x < W; x++) {
      const dither = (x + y) % 2 === 0 && f - band > 1 / 12;
      img.set(x, y, mix(stops[i], stops[i + 1], dither ? next : band));
    }
  }
}

function cloud(img: Pixels, x: number, y: number, w: number, dusk = false): void {
  const h = Math.round(w * 0.38);
  const rnd = random(x * 31 + y);
  const puffs = Array.from({ length: 7 }, (_, i) => ({
    x: x + w * (0.12 + i * 0.125),
    y: y + h * (0.55 - Math.sin((i / 6) * Math.PI) * 0.25 + rnd() * 0.08),
    r: h * (0.28 + Math.sin((i / 6) * Math.PI) * 0.26),
  }));
  const light = dusk ? mix(C.cloud, C.duskLow, 0.45) : C.cloud;
  const mid = dusk ? mix(C.cloudMid, C.duskMid, 0.45) : C.cloudMid;
  const shade = dusk ? mix(C.cloudShade, C.duskTop, 0.55) : C.cloudShade;
  for (let yy = y - h; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      const inside = puffs.some((p) => (xx - p.x) ** 2 + ((yy - p.y) * 1.3) ** 2 <= p.r * p.r);
      if (!inside) continue;
      const above = puffs.some((p) => (xx - p.x + 2) ** 2 + ((yy - 3 - p.y) * 1.3) ** 2 <= p.r * p.r);
      img.set(xx, yy, yy > y + h * 0.35 ? shade : above ? mid : light);
    }
  }
}

// ---------- Gdańsk townhouses ----------

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
  // Frame, glass with a reflection, a sill, and a pediment above.
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

/** A tall Gdańsk townhouse seen from the front, standing on `base`. Returns its width. */
function townhouse(img: Pixels, x: number, base: number, style: HouseStyle): number {
  const { colour, floors, bays } = style;
  const s = shades(colour);
  const rnd = random(style.seed);
  const w = bays * 9 + 5;
  const top = base - GROUND - floors * FLOOR;
  // The facade, with a lit left edge and a shaded right one, and pilasters at the sides.
  rect(img, x, top, x + w, base, s.mid);
  rect(img, x, top, x + 1, base, s.light);
  rect(img, x + w - 2, top, x + w, base, s.dark);
  rect(img, x + 1, top, x + 3, base - GROUND, mix(s.mid, C.trim, 0.25));
  rect(img, x + w - 4, top, x + w - 2, base - GROUND, mix(s.mid, C.trim, 0.15));
  // Floors: a cornice line each, and windows with alternating pediments.
  const pediment: 'triangle' | 'arch' | 'flat' = (['triangle', 'arch', 'flat'] as const)[style.seed % 3];
  for (let f = 0; f < floors; f++) {
    const y = base - GROUND - (f + 1) * FLOOR;
    rect(img, x, y + FLOOR - 1, x + w, y + FLOOR, C.trim);
    rect(img, x, y + FLOOR, x + w, y + FLOOR + 1, s.dark);
    for (let b = 0; b < bays; b++) windowAt(img, x + 5 + b * 9, y + 4, style.lit, f === floors - 1 ? 'arch' : pediment, rnd);
  }
  // The top cornice, deeper.
  rect(img, x - 1, top - 2, x + w + 1, top, C.trim);
  rect(img, x - 1, top, x + w + 1, top + 1, s.deep);
  // The ground floor: a shop with an awning, an arcade, or a grand door up a few steps.
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
        for (let ax = x + 2; ax < x + w - 9; ax++) {
          const on = Math.floor((ax - x) / 3) % 2 === 0;
          img.set(ax - k * 0.0, g + 2 + k, on ? style.awning : C.stripe);
        }
      }
      for (let ax = x + 2; ax < x + w - 9; ax += 3) img.set(ax, g + 7, style.awning);
    }
  }
  rect(img, x, base - 1, x + w, base, s.deep);
  gable(img, x, top - 2, w, style.gable, s, rnd);
  return w;
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
    else if (t < 0.45) {
      // The scrolls: the sides curve in, like the Dutch gables on Długa.
      const c = t / 0.45;
      half = w / 2 - (w / 2) * 0.48 * c * c;
    } else if (t < 0.84) half = (w / 2) * 0.52;
    else half = (w / 2) * 0.52 * Math.sqrt(Math.max(0, 1 - ((t - 0.84) / 0.16) ** 2));
    if (half <= 0.5) continue;
    const y = top - k - 1;
    rect(img, Math.round(mid - half), y, Math.round(mid + half), y + 1, s.mid);
    img.set(Math.round(mid - half), y, s.light);
    img.set(Math.round(mid + half) - 1, y, s.dark);
  }
  if (kind === 'scroll') {
    // Volutes at the shoulders, an oval window, urns and a statue on top.
    const shoulder = top - Math.round(h * 0.44);
    // A curl at each shoulder, and a stone urn at each lower corner.
    for (const sx of [Math.round(mid - w * 0.26) - 2, Math.round(mid + w * 0.26)]) {
      rect(img, sx, shoulder - 1, sx + 3, shoulder + 2, C.trim);
      img.set(sx + 1, shoulder, s.dark);
    }
    for (const ux of [x, x + w - 3]) {
      rect(img, ux, top - 4, ux + 3, top, C.trim);
      rect(img, ux + 1, top - 6, ux + 2, top - 4, C.trimShade);
    }
    rect(img, mid - 2, top - Math.round(h * 0.55), mid + 2, top - Math.round(h * 0.55) + 4, C.trim);
    rect(img, mid - 1, top - Math.round(h * 0.55) + 1, mid + 1, top - Math.round(h * 0.55) + 3, C.glass);
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
    // An attic wall with urns along the top.
    for (let ux = x + 1; ux < x + w - 1; ux += 5) rect(img, ux, top - h - 3, ux + 2, top - h, C.trim);
  }
}

/** A whole row of townhouses. Returns the x where it ended. */
function row(img: Pixels, x0: number, x1: number, base: number, seed: number, lit: boolean, minFloors = 3, maxFloors = 4): number {
  const rnd = random(seed);
  const gables: Gable[] = ['scroll', 'stepped', 'scroll', 'attic', 'pointed', 'scroll'];
  const awnings = [C.red, hex('#2f6f8f'), hex('#3c7a3a'), hex('#e9a23b'), hex('#7a3d5e')];
  let x = x0;
  while (x < x1) {
    const style: HouseStyle = {
      colour: C.houses[Math.floor(rnd() * C.houses.length)],
      gable: gables[Math.floor(rnd() * gables.length)],
      floors: minFloors + Math.floor(rnd() * (maxFloors - minFloors + 1)),
      bays: 2 + Math.floor(rnd() * 2),
      shop: rnd() > 0.7 ? 'arcade' : rnd() > 0.3 ? 'awning' : 'door',
      awning: awnings[Math.floor(rnd() * awnings.length)],
      lit,
      seed: Math.floor(rnd() * 1e6),
    };
    x += townhouse(img, x, base, style);
  }
  return x;
}

// ---------- Landmarks ----------

function brickWall(img: Pixels, x0: number, y0: number, x1: number, y1: number): void {
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const course = Math.floor((y - y0) / 3);
      const joint = (y - y0) % 3 === 2 || (x + (course % 2) * 3) % 6 === 0;
      img.set(x, y, joint ? C.mortar : (x * 7 + course * 13) % 11 === 0 ? C.brickLight : C.brick);
    }
  }
}

/** The Main Town Hall: a brick tower with corner turrets, a clock, and the slim golden spire. */
function townHall(img: Pixels, x: number, base: number, h: number): void {
  const w = 24;
  brickWall(img, x, base - h, x + w, base);
  rect(img, x + w - 2, base - h, x + w, base, C.brickDark);
  // Tall Gothic windows.
  for (const wx of [x + 4, x + 15]) {
    for (let y = base - h + 30; y < base - 10; y += 26) {
      rect(img, wx, y, wx + 5, y + 16, C.glass);
      rect(img, wx + 1, y - 1, wx + 4, y, C.glass);
      rect(img, wx + 2, y, wx + 3, y + 16, C.trimShade);
    }
  }
  // The clock.
  const cy = base - h + 14;
  for (let yy = -5; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) {
    const d = Math.hypot(xx, yy);
    if (d <= 5) img.set(x + 12 + xx, cy + yy, d > 4.2 ? C.gold : C.trim);
  }
  rect(img, x + 12, cy - 4, x + 13, cy + 1, C.ink);
  rect(img, x + 12, cy, x + 15, cy + 1, C.ink);
  // Corner turrets and a gallery.
  for (const tx of [x - 2, x + w - 3]) {
    rect(img, tx, base - h - 10, tx + 5, base - h, C.brick);
    for (let k = 0; k < 8; k++) rect(img, tx + k * 0.3, base - h - 10 - k, tx + 5 - k * 0.3, base - h - 9 - k, k > 5 ? C.gold : C.copper);
  }
  rect(img, x - 1, base - h - 2, x + w + 1, base - h, C.trim);
  // The spire: tiers of green copper and gold, up to the golden king.
  let y = base - h - 2;
  const tiers = [
    { w: 18, h: 10 },
    { w: 12, h: 8 },
    { w: 14, h: 6 },
    { w: 8, h: 10 },
    { w: 10, h: 5 },
    { w: 5, h: 12 },
    { w: 6, h: 4 },
    { w: 3, h: 10 },
  ];
  tiers.forEach((tier, i) => {
    for (let k = 0; k < tier.h; k++) {
      const taper = i % 2 === 0 ? 1 - k / (tier.h * 1.4) : 1;
      const half = (tier.w / 2) * taper;
      const cx = x + w / 2;
      rect(img, cx - half, y - k - 1, cx + half, y - k, k % 3 === 0 && i % 2 === 1 ? C.gold : C.copper);
      img.set(Math.floor(cx - half), y - k - 1, C.copperLight);
      img.set(Math.ceil(cx + half) - 1, y - k - 1, C.copperDark);
    }
    y -= tier.h;
    rect(img, x + w / 2 - tier.w / 2 - 0.5, y, x + w / 2 + tier.w / 2 + 0.5, y + 1, C.gold);
  });
  rect(img, x + w / 2 - 0.5, y - 8, x + w / 2 + 0.5, y, C.gold);
  rect(img, x + w / 2 - 1.5, y - 10, x + w / 2 + 1.5, y - 7, C.gold);
}

/** The Żuraw: two brick towers with the wooden crane house leaning out over the river. */
function zuraw(img: Pixels, x: number, base: number): void {
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
      rect(img, tx + 8, y, tx + 12, y + 6, C.ink);
      rect(img, tx + 8, y - 1, tx + 12, y, C.trimShade);
    }
  }
  // The timber crane house, its planks and the great gable.
  rect(img, x + 14, base - 96, x + 50, base - 40, C.timber);
  for (let y = base - 94; y < base - 40; y += 3) rect(img, x + 14, y, x + 50, y + 1, C.timberDark);
  for (let px = x + 18; px < x + 50; px += 8) rect(img, px, base - 96, px + 1, base - 40, C.timberLight);
  rect(img, x + 26, base - 76, x + 38, base - 64, C.timberDark);
  rect(img, x + 28, base - 74, x + 36, base - 66, C.lit);
  for (let k = 0; k < 20; k++) rect(img, x + 12 + k * 0.9, base - 96 - k, x + 52 - k * 0.9, base - 95 - k, k % 4 === 0 ? C.roofDark : C.roof);
  rect(img, x + 31, base - 120, x + 33, base - 116, C.iron);
}

/** A tall ship of the kind that takes tourists out to Westerplatte. */
function tallShip(img: Pixels, x: number, waterline: number, dusk: boolean): void {
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
      for (let k = 0; k < 11; k++) rect(img, x + mx - sw / 2 + (k > 8 ? 1 : 0), sy + k, x + mx + sw / 2 - (k > 8 ? 1 : 0), sy + k + 1, dusk ? mix(C.trim, C.duskMid, 0.4) : k > 8 ? C.trimShade : C.trim);
    }
    rect(img, x + mx + 1, waterline - 14 - mh, x + mx + 7, waterline - 11 - mh, C.red);
  }
  for (let k = 0; k < 40; k++) img.set(x + 22 + k * 0.5, waterline - 64 + k * 1.3, C.timberDark);
}

function smallBoat(img: Pixels, x: number, waterline: number, colour: Rgb): void {
  for (let k = 0; k < 4; k++) rect(img, x + k, waterline - 4 + k, x + 22 - k, waterline - 3 + k, k === 0 ? C.trim : colour);
  rect(img, x + 6, waterline - 8, x + 14, waterline - 4, C.trim);
  rect(img, x + 7, waterline - 7, x + 13, waterline - 5, C.glass);
}

/** A person strolling, three pixels wide. */
function person(img: Pixels, x: number, base: number, shirt: Rgb, hair: Rgb): void {
  rect(img, x, base - 9, x + 3, base - 7, hair);
  rect(img, x, base - 7, x + 3, base - 6, C.skin);
  rect(img, x, base - 6, x + 3, base - 2, shirt);
  rect(img, x, base - 2, x + 1, base, C.iron);
  rect(img, x + 2, base - 2, x + 3, base, C.iron);
}

/** A black double-headed Gdańsk lantern. */
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

/** The Motława: water with the houses' reflections broken up by little waves. */
function river(img: Pixels, top: number, bottom: number, dusk: boolean): void {
  for (let y = top; y < bottom; y++) {
    const depth = (y - top) / (bottom - top);
    // Each row of water shifts sideways a little: the reflection breaks up into ripples.
    const wave = Math.round(Math.sin(y * 0.9) * 1.4 + Math.sin(y * 2.3) * 0.6);
    for (let x = 0; x < W; x++) {
      const mirrored = img.get(x + wave, top - 2 - Math.floor((y - top) * 1.25));
      const base = dusk ? mix(C.waterDeep, C.duskTop, 0.45) : mix(C.water, C.waterDeep, depth);
      let colour = mirrored ? mix(mirrored, base, 0.35 + depth * 0.4) : base;
      // Light catching the ripples: short horizontal glints, sparser further away.
      const glint = (Math.floor(x / 5) * 13 + y * 7) % 41 === 0 && y % 3 === 0;
      if (glint) colour = dusk ? mix(C.lit, colour, 0.3) : mix(C.waterLight, colour, 0.2);
      img.set(x, y, colour);
    }
  }
}

// ---------- The interface placeholders ----------

function hud(img: Pixels, onSky = false): void {
  if (!onSky) {
    rect(img, 0, 0, W, 36, C.hud);
    for (let x = 0; x < W; x += 14) rect(img, x, 26 - ((x * 7) % 9), x + 10, 36, C.hudLight);
  }
  const pill = (x: number, w: number) => rect(img, x, 10, x + w, 24, C.trim, onSky ? 235 : 210);
  pill(12, 70);
  pill(92, 36);
  pill(140, 30);
  pill(360, 56);
  pill(424, 22);
  for (let i = 0; i < 4; i++) pill(462 + i * 40, 28);
}

function card(img: Pixels, x0: number, y0: number, x1: number, y1: number, paper = false): void {
  const fill = paper ? C.paper : C.card;
  rect(img, x0 + 2, y0, x1 - 2, y1, fill);
  rect(img, x0, y0 + 2, x1, y1 - 2, fill);
  rect(img, x0 + 1, y0 + 1, x1 - 1, y1 - 1, fill);
  for (let i = 0; i < 8; i++) rect(img, x0 + 16 + i * 52, y0 + 12, x0 + 60 + i * 52, y0 + 24, i === 1 ? C.pill : C.pillLight);
  rect(img, x0 + 12, y0 + 32, x1 - 12, y0 + 33, C.cardLine);
  for (let y = y0 + 44; y < y1 - 36; y += 18) {
    rect(img, x0 + 16, y, x0 + 140, y + 6, C.cardLine);
    rect(img, x0 + 200, y, x0 + 300, y + 6, C.cardLine);
    rect(img, x1 - 140, y, x1 - 20, y + 6, C.cardLine);
  }
  rect(img, x1 - 140, y1 - 28, x1 - 16, y1 - 10, C.pill);
}

function save(img: Pixels, name: string): void {
  const big = new Pixels(W * SCALE, H * SCALE);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const c = img.get(x, y);
      if (c) for (let j = 0; j < SCALE; j++) for (let i = 0; i < SCALE; i++) big.set(x * SCALE + i, y * SCALE + j, c);
    }
  }
  writeFileSync(`art/concepts/${name}.png`, pngBytes(big));
  console.log(`art/concepts/${name}.png`);
}

function copy(img: Pixels): Pixels {
  const out = new Pixels(img.width, img.height);
  out.data.set(img.data);
  return out;
}

// ---------- A and D: the riverside, Długie Pobrzeże ----------

function riverside(dusk: boolean, fair: boolean): Pixels {
  const img = new Pixels(W, H);
  sky(img, dusk ? [C.duskTop, C.duskMid, C.duskLow] : [C.skyTop, mix(C.skyTop, C.skyLow, 0.5), C.skyLow]);
  if (dusk) {
    const rnd = random(5);
    for (let i = 0; i < 90; i++) img.set(Math.floor(rnd() * W), Math.floor(rnd() * 170), C.star, rnd() > 0.5 ? 255 : 140);
    for (let y = -10; y <= 10; y++) for (let x = -10; x <= 10; x++) {
      if (x * x + y * y <= 100 && (x - 4) ** 2 + (y - 2) ** 2 > 70) img.set(540 + x, 70 + y, x < -6 ? mix(C.moon, C.duskMid, 0.3) : C.moon);
    }
    cloud(img, 60, 120, 90, true);
    cloud(img, 380, 100, 120, true);
  } else {
    for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) {
      const d = Math.hypot(x, y);
      if (d <= 11) img.set(560 + x, 70 + y, d < 6 ? C.sunCore : C.sun);
      else if (d < 16) img.set(560 + x, 70 + y, C.sunCore, 60);
    }
    cloud(img, 40, 110, 110);
    cloud(img, 250, 80, 80);
    cloud(img, 420, 140, 130);
    cloud(img, 600, 60, 70);
  }
  const quay = 364;
  // Houses along the quay, the Żuraw in the middle, the Town Hall spire behind.
  townHall(img, 168, quay - 60, 60);
  row(img, -6, 360, quay, 1997, dusk, 2, 3);
  zuraw(img, 360, quay);
  row(img, 424, W + 20, quay, 2024, dusk, 2, 3);
  // The quay: granite slabs, lanterns, people strolling.
  rect(img, 0, quay, W, quay + 8, C.quay);
  for (let x = 0; x < W; x += 12) rect(img, x, quay, x + 1, quay + 8, C.quayDark);
  rect(img, 0, quay, W, quay + 1, C.quayLight);
  rect(img, 0, quay + 8, W, quay + 10, C.quayDark);
  if (fair) {
    // St. Dominic's Fair: stalls with striped awnings along the quay, and strings of lights.
    for (let x = 10; x < W - 40; x += 62) {
      rect(img, x, quay - 16, x + 44, quay, C.timberLight);
      rect(img, x + 2, quay - 12, x + 42, quay - 2, dusk ? C.litWarm : C.trim);
      for (let k = 0; k < 44; k += 6) {
        rect(img, x + k, quay - 24, x + k + 3, quay - 16, C.red);
        rect(img, x + k + 3, quay - 24, x + k + 6, quay - 16, C.stripe);
      }
      for (let k = 0; k < 44; k += 3) img.set(x + k, quay - 15 + (k % 2), C.red);
    }
    for (let x = 0; x < W; x += 4) img.set(x, quay - 40 + Math.round(Math.abs(Math.sin(x / 31)) * 8), dusk ? C.lit : C.gold);
  }
  for (const lx of [40, 150, 300, 470, 590]) lantern(img, lx, quay + 4, dusk);
  const shirts = [C.red, hex('#2f6f8f'), hex('#e9a23b'), hex('#7a3d5e'), hex('#3c7a3a'), C.trim];
  const hair = [hex('#4a3426'), hex('#e8c06a'), hex('#2e2a33'), hex('#8a5233'), hex('#c9c4bd')];
  const rnd = random(77);
  for (let i = 0; i < 26; i++) person(img, Math.floor(rnd() * (W - 4)), quay + 7, shirts[i % shirts.length], hair[i % hair.length]);
  river(img, quay + 10, H, dusk);
  tallShip(img, 470, 396, dusk);
  smallBoat(img, 70, 392, hex('#2f6f8f'));
  smallBoat(img, 250, 398, C.red);
  return img;
}

// ---------- B: the manager's desk ----------

function desk(): Pixels {
  const img = new Pixels(W, H);
  // Planks with long streaks of grain, a few knots, and the joints between them.
  const hash = (a: number, b: number, c: number) => (((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) >>> 0) / 4294967296;
  const knots = Array.from({ length: 14 }, (_, i) => ({ x: hash(i, 1, 7) * W, y: Math.floor(hash(i, 2, 9) * (H / 32)) * 32 + 8 + hash(i, 3, 5) * 16 }));
  for (let y = 0; y < H; y++) {
    const board = Math.floor(y / 32);
    const tone = [C.wood, C.woodLight, mix(C.wood, C.woodLight, 0.5)][board % 3];
    for (let x = 0; x < W; x++) {
      if (y % 32 === 0) {
        img.set(x, y, C.woodDark);
        continue;
      }
      const offset = Math.floor(hash(board, y % 32, 0) * 60);
      const segment = Math.floor((x + offset) / (30 + Math.floor(hash(board, y % 32, 1) * 50)));
      const streak = hash(board, y % 32, segment) < 0.18;
      const light = hash(board, y % 32, segment + 1000) < 0.06;
      const knot = knots.some((k) => Math.hypot((x - k.x) / 2.2, y - k.y) < 3);
      const ring = knots.some((k) => Math.abs(Math.hypot((x - k.x) / 2.2, y - k.y) - 4.5) < 0.6);
      img.set(x, y, knot ? C.woodDark : ring || streak ? mix(tone, C.woodDark, 0.4) : light ? mix(tone, C.white, 0.1) : tone);
    }
  }
  // A cup of coffee with steam, a pencil, a receipt roll, keys, basil in a pot, a plate of pierogi.
  const circle = (cx: number, cy: number, r: number, f: (d: number) => Rgb) => {
    for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) { const d = Math.hypot(x, y); if (d <= r) img.set(cx + x, cy + y, f(d)); }
  };
  circle(14, 250, 16, (d) => (d > 13 ? C.cup : d > 11 ? mix(C.cup, C.ink, 0.25) : d < 3 ? mix(C.coffee, C.white, 0.15) : C.coffee));
  rect(img, 28, 246, 36, 254, C.cup);
  for (let k = 0; k < 14; k++) img.set(14 + Math.sin(k / 2) * 3, 228 - k * 1.5, C.white, 120);
  for (let k = 0; k < 120; k++) rect(img, 240 + k, 42, 241 + k, 50, k < 6 ? C.ink : k > 110 ? hex('#e07a8a') : k > 104 ? C.trimShade : k % 20 < 1 ? mix(C.gold, C.ink, 0.2) : C.gold);
  rect(img, 604, 50, 634, 130, C.paperShade);
  for (let y = 56; y < 126; y += 6) rect(img, 608, y, 630, y + 1, mix(C.paperShade, C.ink, 0.3));
  circle(620, 140, 12, (d) => (d > 10 ? C.trimShade : C.paperShade));
  circle(16, 90, 14, (d) => (d > 12 ? hex('#9c5a33') : hex('#c97a4a')));
  for (let k = 0; k < 18; k++) circle(10 + (k % 5) * 3, 80 + Math.floor(k / 5) * 4, 2, () => (k % 2 ? C.leaf : C.leafLight));
  circle(626, 360, 18, (d) => (d > 16 ? C.trimShade : d > 14 ? C.cup : C.trim));
  for (let k = 0; k < 5; k++) circle(618 + (k % 3) * 7, 354 + Math.floor(k / 3) * 8, 3, () => C.quayLight);
  // Mewa, standing on the edge of the desk.
  const mewa = [
    '....ooo.......', '...owwwo......', '..owwewwo.....', 'yyowwwwwo.....', '.rowwwwwwooo..',
    '..owwwggggggoo', '...owwgggggkko', '....owwwwwoo..', '.....oooooo...', '......l..l....', '.....ll.ll....',
  ];
  const palette: Record<string, Rgb> = { o: C.ink, w: C.white, e: hex('#1d1f22'), y: C.sun, r: hex('#d9412b'), g: hex('#9aa3ad'), k: hex('#2b2b2b'), l: hex('#e8a0a0') };
  mewa.forEach((r, y) => [...r].forEach((ch, x) => {
    if (ch !== '.') rect(img, 2 + x * 2, 368 + y * 2, 4 + x * 2, 370 + y * 2, palette[ch]);
  }));
  return img;
}

// ---------- C: Długa's rooftops as the top bar ----------

function rooftops(): Pixels {
  const img = new Pixels(W, H);
  sky(img, [C.skyTop, C.skyLow], 140);
  cloud(img, 30, 30, 70);
  cloud(img, 470, 22, 80);
  // Only the upper floors and gables show above the bar's edge, as if looking up Długa.
  const base = 160;
  row(img, -6, 296, base, 3101, false, 3, 4);
  row(img, 324, W + 20, base, 3202, false, 3, 4);
  townHall(img, 298, base, 84);
  // The bar's lower edge: a cornice of stone, then the cream of the screen below.
  rect(img, 0, 100, W, 104, C.trim);
  rect(img, 0, 104, W, 106, C.trimShade);
  rect(img, 0, 106, W, H, hex('#f6efe3'));
  return img;
}

// ---------- Write them all ----------

mkdirSync('art/concepts', { recursive: true });

const a = riverside(false, false);
save(a, 'background-a-riverside');
const aUi = copy(a);
hud(aUi);
card(aUi, 20, 44, 620, 280);
save(aUi, 'background-a-riverside-with-ui');

const b = desk();
save(b, 'background-b-desk');
const bUi = copy(b);
hud(bUi);
// The sheet of paper's shadow on the desk, then the sheet itself: the card.
rect(bUi, 24, 62, 628, 388, mix(C.wood, C.ink, 0.4), 200);
card(bUi, 20, 56, 620, 380, true);
save(bUi, 'background-b-desk-with-ui');

const c = rooftops();
save(c, 'background-c-rooftops');
const cUi = copy(c);
hud(cUi, true);
card(cUi, 20, 114, 620, 388);
save(cUi, 'background-c-rooftops-with-ui');

const d = riverside(true, true);
save(d, 'background-d-fair-evening');
const dUi = copy(d);
hud(dUi);
card(dUi, 20, 44, 620, 280);
save(dUi, 'background-d-fair-evening-with-ui');
