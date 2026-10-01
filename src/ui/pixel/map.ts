// The Old Town map in pixel art, seen from the south at an angle, like an aerial photo:
// every building shows its tiled roof and its street front. Blocks of narrow gabled
// townhouses in many colours, courtyards with trees, cobbled streets opening into
// Długi Targ, St. Mary's, the Town Hall, the Green Gate, the Żuraw, and Granary Island.
// Map coordinates are metres east (x) and north (y), the same as in data/locations.ts.

import type { LocationId } from '../../data/locations';
import type { IconArt } from './icons';
import { hex, mix, Pixels, type Rgb } from './raster';
import { sprite } from './sprites';

export const MAP_WIDTH = 336;
export const MAP_HEIGHT = 204;
const SCALE = MAP_WIDTH / 900;

/** A map position (metres east, metres north) as a pixel on the map. */
export function mapPixel(x: number, north: number): { px: number; py: number } {
  return { px: Math.round((x - 150) * SCALE), py: Math.round((-north + 330) * SCALE) };
}

/** A small seeded random generator, so the town is built the same way every time. */
function random(seed: number) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(list: readonly T[]) => list[Math.floor(next() * list.length)],
  };
}

const C = {
  outline: hex('#4a2a22'),
  cobble: hex('#cdbfa8'),
  cobbleDark: hex('#b9aa91'),
  square: hex('#ddd0b8'),
  squareLine: hex('#c9b99c'),
  courtyard: hex('#8fae6a'),
  courtyardDark: hex('#7a9a58'),
  tree: hex('#4f8f45'),
  treeDark: hex('#3a6e33'),
  treeLight: hex('#7fb069'),
  water: hex('#5f98b5'),
  waterLight: hex('#86b8cf'),
  waterDark: hex('#4b8099'),
  quay: hex('#a89c8a'),
  quayDark: hex('#8f8374'),
  window: hex('#4a4656'),
  windowLit: hex('#6d6a7c'),
  door: hex('#5a3a28'),
  brick: hex('#a9472f'),
  brickDark: hex('#7a3322'),
  brickRoof: hex('#8c3b26'),
  copper: hex('#5f8f7a'),
  gold: hex('#d9a92b'),
  timber: hex('#4a3426'),
  sail: hex('#fdf6e3'),
  hull: hex('#6b3d24'),
  stone: hex('#d8cdb8'),
};

/** Wall colours and roof tiles, as in the photo: cream, white, pink, ochre under red-orange tiles. */
const WALLS = ['#f1e4c9', '#f8f2e6', '#ecc9b4', '#e3c27a', '#d9a27f', '#d6dcd2', '#e9d3a6', '#c97a5a', '#f3dcc0', '#bfcfd6'].map(hex);
const ROOFS = ['#c45a32', '#b34a2a', '#d06a3a', '#a8432a', '#cf7444', '#9c3f26'].map(hex);

type Gable = 'pointed' | 'stepped' | 'curved' | 'flat';

interface Building {
  x0: number;
  x1: number;
  /** Ground footprint, north to south. */
  y0: number;
  y1: number;
  /** How tall the front wall stands. */
  height: number;
  wall: Rgb;
  roof: Rgb;
  /** A gabled townhouse front facing the street, or a plain back wall. */
  gable: Gable | null;
  /** The roof ridge runs along the street (eaves to the street) instead of towards it. */
  eaves?: boolean;
  windows: boolean;
}

function fill(img: Pixels, x0: number, y0: number, x1: number, y1: number, c: Rgb): void {
  for (let y = Math.max(0, y0); y < Math.min(MAP_HEIGHT, y1); y++) for (let x = Math.max(0, x0); x < Math.min(MAP_WIDTH, x1); x++) img.set(x, y, c);
}

/**
 * One building, seen from the south at an angle: its roof (the footprint lifted by its height)
 * and its south wall. Townhouses have their gable to the street, so the roof ridge runs north–south.
 */
function drawBuilding(img: Pixels, b: Building): void {
  const roofTop = b.y0 - b.height;
  const wallTop = b.y1 - b.height;
  const width = b.x1 - b.x0;
  const ridge = b.x0 + Math.floor(width / 2);
  const shade = mix(b.roof, C.outline, 0.25);
  const light = mix(b.roof, hex('#ffffff'), 0.12);
  // Roof: two slopes either side of the ridge, with a row of tiles every other line.
  const ridgeRow = roofTop + Math.floor((wallTop - roofTop) / 2);
  for (let y = roofTop; y < wallTop; y++) {
    for (let x = b.x0; x < b.x1; x++) {
      let c = b.eaves
        ? y < ridgeRow
          ? shade
          : y > ridgeRow
            ? light
            : mix(b.roof, hex('#ffffff'), 0.25)
        : x < ridge
          ? light
          : x > ridge
            ? shade
            : mix(b.roof, hex('#ffffff'), 0.25);
      if ((y - roofTop) % 2 === 1 && x !== ridge) c = mix(c, C.outline, 0.08);
      img.set(x, y, c);
    }
  }
  // Front wall, with windows in rows and a door.
  fill(img, b.x0, wallTop, b.x1, b.y1, b.wall);
  if (b.windows && width >= 3) {
    for (let y = wallTop + 1; y < b.y1 - 2; y += 2) {
      for (let x = b.x0 + 1; x < b.x1 - 1; x += 2) img.set(x, y, (x + y) % 5 === 0 ? C.windowLit : C.window);
    }
    img.set(b.x0 + Math.floor(width / 2), b.y1 - 1, C.door);
  }
  // The gable rises above the front wall, in the wall's colour.
  if (b.gable && width >= 4) {
    const rise = Math.min(3, Math.floor(width / 2));
    for (let r = 1; r <= rise; r++) {
      let inset: number;
      if (b.gable === 'pointed') inset = r;
      else if (b.gable === 'stepped') inset = Math.ceil(r / 1.5) + (r === rise ? 1 : 0);
      else if (b.gable === 'curved') inset = r === rise ? Math.floor(width / 2) - 1 : r - 1;
      else inset = r === 1 ? 0 : width;
      fill(img, b.x0 + inset, wallTop - r, b.x1 - inset, wallTop - r + 1, b.wall);
    }
  }
  // Soft outlines: the sides and the bottom of the wall.
  const edge = mix(b.wall, C.outline, 0.45);
  for (let y = roofTop; y < b.y1; y++) {
    img.set(b.x0, y, mix(img.get(b.x0, y) ?? edge, C.outline, 0.35));
    img.set(b.x1 - 1, y, mix(img.get(b.x1 - 1, y) ?? edge, C.outline, 0.35));
  }
  fill(img, b.x0, b.y1 - 1, b.x1, b.y1, mix(b.wall, C.outline, 0.3));
}

function drawTree(img: Pixels, cx: number, cy: number, r: number): void {
  img.set(cx, cy + 1, C.timber);
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const d = x * x + y * y;
      if (d > r * r + 1) continue;
      const c = d > r * r - r ? C.treeDark : x + y < -1 ? C.treeLight : C.tree;
      img.set(cx + x, cy - r + y, c);
    }
  }
}

// ---------- The plan of the town (in map pixels) ----------

/** North–south lanes: their middle and width. */
const LANES = [
  { x: 65, w: 5 },
  { x: 121, w: 5 },
  { x: 167, w: 6 },
  { x: 212, w: 5 },
];
const QUAY = { x0: 252, x1: 264 };
const RIVER = { x0: 264, x1: 279 };
const NEW_RIVER = { x0: 322, x1: MAP_WIDTH };

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

/** Granary Island: a street down the middle and three across it, two of them carried over the river by bridges. */
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

/** St. Mary's sits in the block north of Piwna. */
const CHURCH = { x0: 72, x1: 162, y0: 22, y1: 50 };

function streetAt(x: number, y: number): Street | undefined {
  return [...STREETS, ...ISLAND_STREETS].find((s) => x >= s.x0 && x < s.x1 && Math.abs(y - s.y) <= s.w / 2);
}

/** The island's blocks: either side of its middle street, between the streets across it. */
function islandBlocks(): { x0: number; x1: number; y0: number; y1: number }[] {
  const columns: [number, number][] = [
    [ISLAND.x0 + 2, ISLAND_SPINE.x - Math.ceil(ISLAND_SPINE.w / 2) - 1],
    [ISLAND_SPINE.x + Math.ceil(ISLAND_SPINE.w / 2) + 1, ISLAND.x1 - 2],
  ];
  const result: { x0: number; x1: number; y0: number; y1: number }[] = [];
  for (const [x0, x1] of columns) {
    let top = 0;
    for (const s of ISLAND_STREETS) {
      result.push({ x0, x1, y0: top + 1, y1: Math.floor(s.y - s.w / 2) });
      top = Math.ceil(s.y + s.w / 2);
    }
    result.push({ x0, x1, y0: top + 1, y1: MAP_HEIGHT + 4 });
  }
  return result;
}

/** A bridge across the Motława: a stone deck with wooden railings, and its shadow on the water. */
function drawBridge(img: Pixels, y: number, w: number): void {
  const top = Math.floor(y - w / 2);
  const bottom = Math.ceil(y + w / 2);
  for (let x = RIVER.x0 - 1; x <= RIVER.x1; x++) {
    for (let yy = top; yy < bottom; yy++) img.set(x, yy, (x + yy) % 7 === 0 ? C.cobbleDark : C.stone);
    img.set(x, top - 1, C.timber);
    img.set(x, bottom, C.timber);
    img.set(x, bottom + 1, C.waterDark);
    if (x % 3 === 0) {
      img.set(x, top - 2, C.timber);
      img.set(x, bottom - 1, mix(C.stone, C.timber, 0.4));
    }
  }
}

/** The blocks of houses: everything between streets and lanes. */
function blocks(): { x0: number; x1: number; y0: number; y1: number }[] {
  // How far each lane wanders sideways in each row of blocks (medieval streets are never straight).
  const wander = (lane: number, row: number) => [0, 2, -2, 1, -1, 3, -3][(lane * 5 + row * 3) % 7];
  const result: { x0: number; x1: number; y0: number; y1: number }[] = [];
  for (let c = 0; c <= LANES.length; c++) {
    const baseMid = ((c === 0 ? 0 : LANES[c - 1].x) + (c === LANES.length ? QUAY.x0 : LANES[c].x)) / 2;
    const across = STREETS.filter((s) => baseMid >= s.x0 && baseMid < s.x1).sort((a, b) => a.y - b.y);
    const bands: [number, number][] = [];
    let top = 0;
    for (const s of across) {
      bands.push([top + 1, Math.floor(s.y - s.w / 2)]);
      top = Math.ceil(s.y + s.w / 2);
    }
    bands.push([top + 1, MAP_HEIGHT + 4]);
    bands.forEach(([y0, y1], row) => {
      const left = c === 0 ? 0 : LANES[c - 1].x + Math.ceil(LANES[c - 1].w / 2) + wander(c - 1, row);
      const right = c === LANES.length ? QUAY.x0 : LANES[c].x - Math.ceil(LANES[c].w / 2) + wander(c, row);
      result.push({ x0: left + 1, x1: right - 1, y0, y1 });
    });
  }
  return result;
}

/** The whole map, drawn once. */
export function drawOldTown(): Pixels {
  const img = new Pixels(MAP_WIDTH, MAP_HEIGHT);
  const rnd = random(1997);

  // Cobbles everywhere first; the buildings cover most of it.
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const street = streetAt(x, y);
      const onSquare = street && street.w > 10;
      const c = onSquare
        ? (x + y * 2) % 9 === 0
          ? C.squareLine
          : C.square
        : (x * 3 + y * 7) % 11 === 0
          ? C.cobbleDark
          : C.cobble;
      img.set(x, y, c);
    }
  }

  // The quay, the rivers and Granary Island.
  fill(img, QUAY.x0, 0, QUAY.x1, MAP_HEIGHT, C.quay);
  for (let y = 0; y < MAP_HEIGHT; y += 3) img.set(QUAY.x0 + (y % 6 === 0 ? 3 : 8), y, C.quayDark);
  for (const river of [RIVER, NEW_RIVER]) {
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = river.x0; x < river.x1; x++) {
        const k = (x * 5 + y * 3) % 19;
        img.set(x, y, k === 0 ? C.waterLight : k === 7 ? C.waterDark : C.water);
      }
      img.set(river.x0, y, C.quayDark);
    }
  }
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = ISLAND.x0; x < ISLAND.x1; x++) img.set(x, y, (x * 3 + y * 7) % 11 === 0 ? C.cobbleDark : C.cobble);
  }
  for (const river of [RIVER, NEW_RIVER]) for (let y = 0; y < MAP_HEIGHT; y++) img.set(river.x1, y, C.quayDark);
  for (const bridge of BRIDGES) drawBridge(img, bridge.y, bridge.w);

  const buildings: Building[] = [];
  const trees: { x: number; y: number; r: number }[] = [];

  // Every block: townhouses along its south side (fronts to the street), a row along its north
  // side (we see their roofs and back walls), and a green courtyard with trees in between.
  for (const block of blocks()) {
    const overlapsChurch = block.x1 > CHURCH.x0 && block.x0 < CHURCH.x1 && block.y1 > CHURCH.y0 && block.y0 < CHURCH.y1;
    const depth = block.y1 - block.y0;
    if (depth < 6 || block.x1 - block.x0 < 4) continue;
    fill(img, block.x0, block.y0, block.x1, Math.min(block.y1, MAP_HEIGHT), C.courtyard);
    const rowDepth = Math.min(7, Math.floor(depth / 2));
    for (const side of ['south', 'north'] as const) {
      if (overlapsChurch && side === 'north') continue;
      let x = block.x0;
      while (x < block.x1 - 2) {
        const w = Math.min(rnd.int(4, 7), block.x1 - x);
        if (overlapsChurch && x + w > CHURCH.x0 - 2 && x < CHURCH.x1 + 2) {
          x += w;
          continue;
        }
        const setback = rnd.int(0, 1);
        const d = rowDepth - rnd.int(0, 2);
        const height = side === 'south' ? rnd.int(6, 9) : rnd.int(5, 7);
        buildings.push(
          side === 'south'
            ? {
                x0: x,
                x1: x + w,
                y0: block.y1 - setback - d,
                y1: block.y1 - setback,
                height,
                wall: rnd.pick(WALLS),
                roof: rnd.pick(ROOFS),
                gable: rnd.pick(['pointed', 'stepped', 'curved', 'pointed', 'flat'] as const),
                windows: true,
              }
            : {
                x0: x,
                x1: x + w,
                y0: block.y0 + setback,
                y1: block.y0 + setback + d,
                height,
                wall: mix(rnd.pick(WALLS), C.outline, 0.12),
                roof: rnd.pick(ROOFS),
                gable: null,
                windows: true,
              },
        );
        x += w;
      }
    }
    // Trees in the courtyard, if there's room.
    if (depth > rowDepth * 2 + 6 && !overlapsChurch) {
      for (let tx = block.x0 + 4; tx < block.x1 - 3; tx += rnd.int(6, 10)) {
        trees.push({ x: tx, y: block.y0 + rowDepth + Math.floor((depth - rowDepth * 2) / 2) + 2, r: rnd.int(2, 3) });
      }
    }
  }

  // Wide houses sometimes turn their long side to the street.
  for (const b of buildings) {
    if (b.gable && b.x1 - b.x0 >= 6 && (b.x0 * 7 + b.y1) % 4 === 0) {
      b.eaves = true;
      b.gable = null;
    }
  }
  // Trees along the quay.
  for (let y = 12; y < MAP_HEIGHT; y += 23) if (y < 60 || y > 84) trees.push({ x: QUAY.x1 - 3, y, r: 2 });

  // Granary Island: tall brick granaries with stepped gables along its streets, green yards behind.
  const granaryWalls = [C.brick, C.brickDark, hex('#b5523a'), hex('#9c5a3c')];
  for (const block of islandBlocks()) {
    const depth = block.y1 - block.y0;
    if (depth < 8) continue;
    fill(img, block.x0, block.y0, block.x1, Math.min(block.y1, MAP_HEIGHT), C.courtyardDark);
    for (const side of ['south', 'north'] as const) {
      for (let x = block.x0; x < block.x1 - 3; ) {
        const w = Math.min(rnd.int(6, 8), block.x1 - x);
        const d = rnd.int(4, 6);
        const height = rnd.int(6, 8);
        const [y0, y1] = side === 'south' ? [block.y1 - d, block.y1] : [block.y0, block.y0 + d];
        buildings.push({
          x0: x,
          x1: x + w,
          y0,
          y1,
          height: side === 'south' ? height : height - 1,
          wall: rnd.pick(granaryWalls),
          roof: C.brickRoof,
          gable: side === 'south' ? 'stepped' : null,
          windows: true,
        });
        x += w + 1;
      }
    }
    if (depth > 20) trees.push({ x: block.x0 + Math.floor((block.x1 - block.x0) / 2), y: block.y0 + Math.floor(depth / 2) + 3, r: 2 });
  }

  // Draw everything from north to south, so nearer things cover those behind.
  const items: { y: number; draw: () => void }[] = [
    ...buildings.map((b) => ({ y: b.y1, draw: () => drawBuilding(img, b) })),
    ...trees.map((t) => ({ y: t.y, draw: () => drawTree(img, t.x, t.y, t.r) })),
    { y: CHURCH.y1, draw: () => drawStMarys(img) },
    { y: 124, draw: () => drawTownHall(img) },
    { y: 138, draw: () => drawGreenGate(img) },
    { y: 79, draw: () => drawCrane(img) },
  ];
  for (const item of items.sort((a, b) => a.y - b.y)) item.draw();

  drawNeptune(img, 196, 131);
  drawBoat(img, 271, 104);
  drawBoat(img, 270, 172);
  return img;
}

// ---------- Landmarks ----------

/** St. Mary's: a huge brick hall church under a steep roof, with its massive square tower. */
function drawStMarys(img: Pixels): void {
  const { x0, x1, y0, y1 } = CHURCH;
  drawBuilding(img, { x0: x0 + 16, x1, y0, y1, height: 16, wall: C.brick, roof: C.brickRoof, gable: null, windows: false });
  // Tall pointed windows along the nave.
  for (let x = x0 + 20; x < x1 - 3; x += 6) fill(img, x, y1 - 13, x + 2, y1 - 3, C.brickDark);
  // Little gables along the roof, like the real one.
  for (let x = x0 + 22; x < x1 - 4; x += 12) {
    for (let r = 0; r < 4; r++) fill(img, x + r, y0 - 16 - r, x + 8 - r, y0 - 15 - r, C.brick);
  }
  // The tower: tall and broad, with a dark top and corner turrets.
  const t = { x0, x1: x0 + 17, y0: y0 + 2, y1 };
  drawBuilding(img, { ...t, height: 24, wall: C.brick, roof: C.brickDark, gable: null, windows: false });
  for (let y = t.y1 - 22; y < t.y1 - 2; y += 4) for (const x of [t.x0 + 4, t.x0 + 8, t.x0 + 12]) fill(img, x, y, x + 1, y + 3, C.brickDark);
  for (const x of [t.x0, t.x0 + 5, t.x0 + 11, t.x1 - 2]) fill(img, x, t.y0 - 28, x + 2, t.y0 - 24, C.brickDark);
}

/** The Main Town Hall, with its slender spire and a golden figure on top. */
function drawTownHall(img: Pixels): void {
  const b = { x0: 150, x1: 162, y0: 116, y1: 124 };
  drawBuilding(img, { ...b, height: 13, wall: hex('#d9a27f'), roof: C.brickRoof, gable: 'stepped', windows: true });
  const cx = b.x0 + 6;
  fill(img, cx - 2, b.y0 - 20, cx + 3, b.y0 - 11, C.brick);
  fill(img, cx - 1, b.y0 - 26, cx + 2, b.y0 - 20, C.copper);
  fill(img, cx, b.y0 - 31, cx + 1, b.y0 - 26, C.copper);
  img.set(cx, b.y0 - 32, C.gold);
}

/** The Green Gate across the end of Długi Targ, by the river. */
function drawGreenGate(img: Pixels): void {
  const b = { x0: 236, x1: 252, y0: 131, y1: 138 };
  drawBuilding(img, { ...b, height: 14, wall: hex('#c98f5a'), roof: C.brickRoof, gable: 'stepped', windows: true });
  for (const x of [240, 244, 248]) fill(img, x, b.y1 - 4, x + 2, b.y1, C.door);
}

/** Żuraw, the medieval wooden crane between two brick towers, on the quay. */
function drawCrane(img: Pixels): void {
  const b = { x0: 253, x1: 263, y0: 66, y1: 79 };
  drawBuilding(img, { ...b, height: 8, wall: C.brick, roof: C.brickRoof, gable: null, windows: false });
  fill(img, b.x0 + 1, b.y0 - 22, b.x1 - 1, b.y0 - 8, C.timber);
  for (let r = 0; r < 4; r++) fill(img, b.x0 + 1 + r, b.y0 - 23 - r, b.x1 - 1 - r, b.y0 - 22 - r, C.timber);
  fill(img, b.x1 - 1, b.y0 - 18, b.x1 + 3, b.y0 - 16, C.timber);
}

function drawNeptune(img: Pixels, cx: number, cy: number): void {
  for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y * 2 <= 10) img.set(cx + x, cy + y, x * x + y * y * 2 > 6 ? C.stone : C.waterLight);
  for (let y = cy - 6; y < cy; y++) img.set(cx, y, C.gold);
  img.set(cx - 1, cy - 6, C.gold);
  img.set(cx + 1, cy - 6, C.gold);
}

function drawBoat(img: Pixels, cx: number, cy: number): void {
  fill(img, cx - 4, cy, cx + 4, cy + 2, C.hull);
  for (let r = 0; r < 6; r++) fill(img, cx, cy - 6 + r, cx + 1 + Math.floor(r / 2), cy - 5 + r, C.sail);
  img.set(cx - 1, cy - 6, C.timber);
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
