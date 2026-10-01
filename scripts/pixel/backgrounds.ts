// Concept art for the planning-screen background (project.md section 6.14, part 5).
// Four full-screen mock-ups at the tablet's size (1280×800), drawn at 320×200 art pixels and
// scaled up four times, with a placeholder where the planning card and the top bar sit.
// Run with `npx tsx scripts/pixel/backgrounds.ts`; it writes PNGs to art/concepts/.

import { mkdirSync, writeFileSync } from 'node:fs';
import { hex, mix, Pixels, pngBytes, type Rgb } from '../../src/ui/pixel/raster';

const W = 320;
const H = 200;
const SCALE = 4;

const C = {
  ink: hex('#3b2433'),
  sky: hex('#9fd0ea'),
  skyLow: hex('#e4f2f8'),
  dusk: hex('#2d3866'),
  duskLow: hex('#b56b7a'),
  cloud: hex('#ffffff'),
  cloudShade: hex('#d8e6ee'),
  sun: hex('#f4c531'),
  moon: hex('#f6efd0'),
  star: hex('#fdf6e3'),
  water: hex('#4f8fb0'),
  waterDark: hex('#3d7598'),
  waterLight: hex('#a9d4e6'),
  quay: hex('#b9ad9c'),
  quayDark: hex('#8f8478'),
  brick: hex('#a24a33'),
  brickDark: hex('#7a3322'),
  timber: hex('#5a3a28'),
  timberLight: hex('#7a5236'),
  roof: hex('#8c3a2a'),
  copper: hex('#4b8a76'),
  gold: hex('#e0b23c'),
  trim: hex('#f6eedf'),
  pane: hex('#5b7590'),
  lit: hex('#ffd76a'),
  door: hex('#5a3a28'),
  hud: hex('#b5452f'),
  hudLight: hex('#c65a43'),
  card: hex('#ffffff'),
  cardLine: hex('#e7ddcc'),
  pill: hex('#2f6f8f'),
  pillLight: hex('#dbe9ef'),
  wood: hex('#7b4f31'),
  woodDark: hex('#5f3b23'),
  woodLight: hex('#8f5f3c'),
  paper: hex('#fbf6ea'),
  paperShade: hex('#e9dcc2'),
  coffee: hex('#4a2c1c'),
  cup: hex('#f4f1ea'),
  leaf: hex('#3e7a3a'),
  leafLight: hex('#7fb069'),
  flagRed: hex('#c8102e'),
  stripe: hex('#f4f1ea'),
  houses: ['#e8c07a', '#d98b6a', '#c25b43', '#e9dcc0', '#8fb3a5', '#c9a3c4', '#f2dfb8', '#7fa0c0', '#e9a23b', '#d7b48a', '#f0c9c0', '#b9d3c2'].map(hex),
};

// ---------- Small drawing helpers ----------

function rect(img: Pixels, x0: number, y0: number, x1: number, y1: number, colour: Rgb, alpha = 255): void {
  for (let y = Math.floor(y0); y < y1; y++) for (let x = Math.floor(x0); x < x1; x++) img.set(x, y, colour, alpha);
}

function sky(img: Pixels, top: Rgb, bottom: Rgb, until = H): void {
  for (let y = 0; y < until; y++) rect(img, 0, y, W, y + 1, mix(top, bottom, y / until));
}

function cloud(img: Pixels, x: number, y: number, w: number, light = C.cloud, shade = C.cloudShade): void {
  const h = Math.round(w * 0.4);
  const puffs = [0.2, 0.42, 0.64, 0.82].map((at, i) => ({ x: x + w * at, y: y + h * (i % 2 ? 0.45 : 0.62), r: h * (i === 1 || i === 2 ? 0.45 : 0.32) }));
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      if (puffs.some((p) => (xx - p.x) ** 2 + ((yy - p.y) * 1.25) ** 2 <= p.r * p.r)) img.set(xx, yy, yy > y + h * 0.62 ? shade : light);
    }
  }
}

type Gable = 'pointed' | 'stepped' | 'scroll' | 'flat';

/** A tall, narrow Gdańsk townhouse seen from the front, standing on `base`. */
function house(img: Pixels, x: number, base: number, w: number, h: number, colour: Rgb, gable: Gable, lit = false): void {
  const top = base - h;
  rect(img, x, top, x + w, base, colour);
  rect(img, x, top, x + 1, base, mix(colour, C.ink, 0.25));
  // Cornices between floors and windows with white frames.
  for (let fy = base - 9; fy > top + 2; fy -= 8) {
    rect(img, x + 1, fy, x + w, fy + 1, mix(colour, C.trim, 0.6));
    for (let wx = x + 2; wx + 2 <= x + w - 1; wx += 4) {
      rect(img, wx, fy - 5, wx + 2, fy - 1, lit && (wx + fy) % 3 !== 0 ? C.lit : C.pane);
      rect(img, wx, fy - 6, wx + 2, fy - 5, C.trim);
    }
  }
  // The door.
  const door = x + Math.floor(w / 2) - 1;
  rect(img, door, base - 5, door + 3, base, C.door);
  // The gable on top.
  const g = Math.max(5, Math.round(w * 0.7));
  for (let k = 0; k < g; k++) {
    let half: number;
    if (gable === 'pointed') half = (w / 2) * (1 - k / g);
    else if (gable === 'stepped') half = (w / 2) * (1 - Math.floor(k / 2.5) * 2.5 / g);
    else if (gable === 'scroll') half = (w / 2) * (k < g * 0.35 ? 1 - (k / (g * 0.35)) * 0.15 : 0.85 - ((k - g * 0.35) / (g * 0.65)) * 0.55);
    else half = k < 2 ? w / 2 : 0;
    if (half <= 0.4) continue;
    const mid = x + w / 2;
    rect(img, Math.round(mid - half), top - k - 1, Math.round(mid + half), top - k, k === 0 ? C.trim : mix(colour, C.cloud, 0.06));
  }
  if (gable === 'scroll') {
    // Scrolls at the shoulders and a stone urn on top.
    img.set(x, top - Math.round(g * 0.35), C.trim);
    img.set(x + w - 1, top - Math.round(g * 0.35), C.trim);
    const mid = x + Math.floor(w / 2);
    rect(img, mid - 1, top - g - 2, mid + 1, top - g, C.trim);
  }
}

/** A row of townhouses from `x0` to `x1`, the same every time for the same seed. */
function street(img: Pixels, x0: number, x1: number, base: number, seed: number, min: number, max: number, lit = false): void {
  let s = seed;
  const rnd = () => ((s = (Math.imul(s, 1103515245) + 12345) >>> 0) >>> 8) / 16777216;
  const gables: Gable[] = ['scroll', 'stepped', 'pointed', 'scroll', 'flat'];
  for (let x = x0; x < x1; ) {
    const w = 9 + Math.floor(rnd() * 5);
    house(img, x, base, w, min + Math.floor(rnd() * (max - min)), C.houses[Math.floor(rnd() * C.houses.length)], gables[Math.floor(rnd() * gables.length)], lit);
    x += w;
  }
}

/** The Main Town Hall: a brick tower with a clock and a slim golden spire. */
function townHall(img: Pixels, x: number, base: number, h: number): void {
  rect(img, x, base - h, x + 10, base, C.brick);
  rect(img, x + 9, base - h, x + 10, base, C.brickDark);
  rect(img, x + 2, base - h + 10, x + 8, base - h + 16, C.trim);
  img.set(x + 5, base - h + 12, C.ink);
  img.set(x + 5, base - h + 13, C.ink);
  img.set(x + 6, base - h + 13, C.ink);
  for (let k = 0; k < 26; k++) {
    const half = 4 * (1 - k / 26);
    rect(img, Math.round(x + 5 - half), base - h - k - 1, Math.round(x + 5 + half), base - h - k, k % 7 === 3 ? C.gold : C.copper);
  }
  rect(img, x + 5, base - h - 30, x + 6, base - h - 26, C.gold);
}

/** The Żuraw: the medieval crane gate on the Motława, brick towers with a wooden crane between. */
function zuraw(img: Pixels, x: number, base: number): void {
  rect(img, x, base - 30, x + 10, base, C.brick);
  rect(img, x + 22, base - 30, x + 32, base, C.brick);
  rect(img, x + 10, base - 22, x + 22, base, C.brickDark);
  rect(img, x + 13, base - 9, x + 19, base, C.ink);
  for (let k = 0; k < 6; k++) rect(img, x + k, base - 30 - k, x + 10 - k, base - 29 - k, C.roof);
  for (let k = 0; k < 6; k++) rect(img, x + 22 + k, base - 30 - k, x + 32 - k, base - 29 - k, C.roof);
  // The wooden crane house, leaning out over the water.
  rect(img, x + 8, base - 48, x + 26, base - 22, C.timber);
  for (let yy = base - 46; yy < base - 22; yy += 4) rect(img, x + 8, yy, x + 26, yy + 1, C.timberLight);
  for (let k = 0; k < 10; k++) rect(img, x + 8 + k, base - 48 - k, x + 26 - k, base - 47 - k, C.roof);
}

function boat(img: Pixels, x: number, waterline: number, w: number, sail = true): void {
  for (let k = 0; k < 4; k++) rect(img, x + k, waterline - 4 + k, x + w - k, waterline - 3 + k, k === 0 ? C.trim : C.brickDark);
  if (!sail) return;
  rect(img, x + Math.floor(w / 2), waterline - 22, x + Math.floor(w / 2) + 1, waterline - 4, C.timber);
  for (let k = 0; k < 15; k++) rect(img, x + Math.floor(w / 2) + 1, waterline - 21 + k, x + Math.floor(w / 2) + 2 + Math.floor(k * 0.6), waterline - 20 + k, C.trim);
}

function water(img: Pixels, top: number, bottom: number, dusk = false): void {
  for (let y = top; y < bottom; y++) {
    const base = dusk ? mix(C.waterDark, C.dusk, 0.5) : y % 3 === 0 ? C.waterDark : C.water;
    rect(img, 0, y, W, y + 1, base);
    for (let x = (y * 7) % 13; x < W; x += 13 + (y % 5)) rect(img, x, y, x + 4, y + 1, dusk ? mix(C.lit, C.water, 0.6) : C.waterLight);
  }
}

// ---------- The interface placeholders ----------

/** The top bar: date and weather on the left, money and speed buttons on the right. */
function hud(img: Pixels, banner = false): void {
  if (!banner) {
    rect(img, 0, 0, W, 18, C.hud);
    for (let x = 0; x < W; x += 9) rect(img, x, 13 - ((x * 7) % 5), x + 6, 18, C.hudLight);
  }
  const pill = (x: number, w: number) => rect(img, x, 5, x + w, 11, C.trim, banner ? 235 : 200);
  pill(6, 34);
  pill(46, 18);
  pill(70, 14);
  pill(180, 26);
  pill(212, 10);
  for (let i = 0; i < 4; i++) pill(232 + i * 20, 14);
}

/** The planning card: tabs, a panel of rows, and the big button at the bottom right. */
function card(img: Pixels, x0: number, y0: number, x1: number, y1: number, paper = false): void {
  const fill = paper ? C.paper : C.card;
  rect(img, x0 + 1, y0, x1 - 1, y1, fill);
  rect(img, x0, y0 + 1, x1, y1 - 1, fill);
  for (let i = 0; i < 8; i++) rect(img, x0 + 8 + i * 26, y0 + 6, x0 + 30 + i * 26, y0 + 12, i === 1 ? C.pill : C.pillLight);
  rect(img, x0 + 6, y0 + 16, x1 - 6, y0 + 17, C.cardLine);
  for (let y = y0 + 22; y < y1 - 18; y += 9) {
    rect(img, x0 + 8, y, x0 + 70, y + 3, C.cardLine);
    rect(img, x0 + 100, y, x0 + 150, y + 3, C.cardLine);
    rect(img, x1 - 70, y, x1 - 10, y + 3, C.cardLine);
  }
  rect(img, x1 - 70, y1 - 14, x1 - 8, y1 - 5, C.pill);
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

// ---------- A. Riverside: Długie Pobrzeże along the bottom ----------

function riverside(dusk: boolean, fair: boolean): Pixels {
  const img = new Pixels(W, H);
  sky(img, dusk ? C.dusk : C.sky, dusk ? C.duskLow : C.skyLow);
  if (dusk) {
    for (let i = 0; i < 40; i++) img.set((i * 97) % W, (i * 41) % 120, C.star);
    for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) if (x * x + y * y <= 25 && (x - 2) ** 2 + (y - 1) ** 2 > 18) img.set(270 + x, 30 + y, C.moon);
  } else {
    for (let y = -6; y <= 6; y++) for (let x = -6; x <= 6; x++) if (x * x + y * y <= 36) img.set(290 + x, 30 + y, C.sun);
    cloud(img, 30, 40, 40);
    cloud(img, 150, 30, 30);
    cloud(img, 220, 55, 46);
  }
  const quay = 186;
  street(img, -4, 196, quay, 1997, 17, 25, dusk);
  zuraw(img, 196, quay);
  street(img, 228, 330, quay, 2024, 17, 25, dusk);
  // The quay and the river.
  rect(img, 0, quay, W, quay + 3, C.quay);
  rect(img, 0, quay + 3, W, quay + 4, C.quayDark);
  water(img, quay + 4, H, dusk);
  boat(img, 40, H - 2, 22);
  boat(img, 262, H - 1, 26);
  boat(img, 150, H - 1, 16, false);
  if (fair) {
    // St. Dominic's Fair: stalls with striped awnings along the quay, and lanterns overhead.
    for (let x = 6; x < W - 20; x += 34) {
      rect(img, x, quay - 7, x + 22, quay, C.timberLight);
      for (let k = 0; k < 22; k += 4) rect(img, x + k, quay - 10, x + k + 2, quay - 7, C.flagRed);
      for (let k = 2; k < 22; k += 4) rect(img, x + k, quay - 10, x + k + 2, quay - 7, C.stripe);
    }
    for (let x = 0; x < W; x += 5) img.set(x, quay - 16 + Math.round(Math.sin(x / 10) * 2), dusk ? C.lit : C.gold);
  }
  return img;
}

// ---------- B. The manager's desk ----------

function desk(): Pixels {
  const img = new Pixels(W, H);
  for (let y = 0; y < H; y++) {
    const board = Math.floor(y / 14);
    const colour = board % 2 === 0 ? C.wood : C.woodLight;
    for (let x = 0; x < W; x++) {
      const grain = Math.sin((x + board * 37) / 9 + Math.sin(y / 3)) > 0.85;
      img.set(x, y, y % 14 === 0 ? C.woodDark : grain ? mix(colour, C.woodDark, 0.4) : colour);
    }
  }
  // Things on the desk, half under the sheet of paper.
  for (let y = -8; y <= 8; y++) for (let x = -8; x <= 8; x++) {
    const d = Math.hypot(x, y);
    if (d <= 8) img.set(5 + x, 118 + y, d > 6.5 ? C.cup : d > 5.5 ? mix(C.cup, C.ink, 0.2) : C.coffee);
  }
  // A pencil lying along the top edge, a receipt roll, a sprig of basil.
  for (let k = 0; k < 60; k++) rect(img, 120 + k, 21, 121 + k, 25, k < 4 ? C.ink : k > 54 ? hex('#e07a8a') : k % 12 === 0 ? mix(C.gold, C.ink, 0.2) : C.gold);
  rect(img, 300, 24, 316, 60, C.paperShade);
  for (let y = 28; y < 58; y += 4) rect(img, 302, y, 314, y + 1, mix(C.paperShade, C.ink, 0.3));
  for (let k = 0; k < 6; k++) {
    rect(img, 4 + k * 2, 40 + k * 3, 9 + k * 2, 43 + k * 3, k % 2 ? C.leaf : C.leafLight);
  }
  // The sheet of paper's shadow; the sheet itself is the card.
  rect(img, 12, 30, 313, 193, mix(C.wood, C.ink, 0.35));
  // Mewa, standing on the edge of the desk.
  const mewa = [
    '....ooo.......',
    '...owwwo......',
    '..owwewwo.....',
    'yyowwwwwo.....',
    '.rowwwwwwooo..',
    '..owwwggggggoo',
    '...owwgggggkko',
    '....owwwwwoo..',
    '.....oooooo...',
    '......l..l....',
    '.....ll.ll....',
  ];
  const palette: Record<string, Rgb> = { o: C.ink, w: C.cloud, e: hex('#1d1f22'), y: C.sun, r: hex('#d9412b'), g: hex('#9aa3ad'), k: hex('#2b2b2b'), l: hex('#e8a0a0') };
  mewa.forEach((row, y) => [...row].forEach((ch, x) => ch !== '.' && img.set(2 + x, 185 + y, palette[ch])));
  return img;
}

// ---------- C. Długa rooftops as the top bar ----------

function rooftops(): Pixels {
  const img = new Pixels(W, H);
  sky(img, C.sky, C.skyLow, H);
  cloud(img, 20, 4, 26);
  cloud(img, 250, 2, 30);
  street(img, -4, 150, 40, 3101, 18, 30);
  townHall(img, 150, 40, 28);
  street(img, 160, 330, 40, 3202, 18, 30);
  // A strip of granite paving under the houses, then the card.
  rect(img, 0, 40, W, 44, C.quay);
  rect(img, 0, 44, W, H, mix(C.skyLow, C.trim, 0.5));
  return img;
}

// ---------- Write them all ----------

mkdirSync('art/concepts', { recursive: true });

const a = riverside(false, false);
hud(a);
card(a, 10, 22, 310, 140);
save(a, 'background-a-riverside');

const b = desk();
hud(b);
card(b, 10, 28, 310, 190, true);
save(b, 'background-b-desk');

const c = rooftops();
hud(c, true);
card(c, 10, 48, 310, 192);
save(c, 'background-c-rooftops');

const d = riverside(true, true);
hud(d);
card(d, 10, 22, 310, 140);
save(d, 'background-d-fair-evening');
