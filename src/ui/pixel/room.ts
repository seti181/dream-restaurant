// The pixel-art restaurant: where everything goes (the layout), the room itself drawn
// as one background picture, and the list of sprites (furniture and people) that are
// stacked on top of it, back to front. See project.md section 9.1.

import type { DecorId } from '../../data/decor';
import type { EquipmentId } from '../../data/dishes';
import type { LocationId } from '../../data/locations';
import type { Weather } from '../../data/weather';
import type { FloorView, TableGuests } from '../../sim/day';
import { box, placeOn, project, solid, texturedBox, type Faces, type Origin } from './iso';
import { hex, mix, Pixels, type Rgb } from './raster';
import * as S from './sprites';
import { tableColumns } from '../../sim/seating';

/**
 * Pixels to a world unit: the room is drawn at the concept's scale (project.md section 9.3,
 * `c-richer-art-day.png`), so people, furniture and walls all have room for detail.
 */
export const ROOM_SCALE = 1.25;
export const WALL_HEIGHT = 60;
/** The floor stands this high above the street, on a stone plinth (like a cut-away dollhouse). */
export const PLINTH = 6;
/** The cut-away front and side walls: this thick and this high. */
export const LOW_WALL = { thick: 4, high: 10 };
/** The steps down from the door (or the przedproże) reach this far into the street. */
const STEPS = 8;
/** A table top is 16 × 16 world units. */
const TABLE = 16;
/** Tables stand this far apart: a table, a chair on each side and an aisle to walk down. */
const GRID = 44;
/** The kitchen corner reaches this far from the back wall. */
const KITCHEN_DEPTH = 44;
/** The communal table stands along the back wall from here (26 long, y 16 to 28). */
export const COMMUNAL_TABLE_X = 6;
const SEAT_Z = 9;

const C = {
  backdrop: hex('#2a1d26'),
  outline: hex('#3b2433'),
  wallLeft: hex('#f0dcb8'),
  wallRight: hex('#f7e8cc'),
  wallShade: hex('#e2c99f'),
  trim: hex('#8a5233'),
  trimDark: hex('#6b3d24'),
  panel: hex('#6b3d24'),
  panelInset: hex('#7d4a2b'),
  plankA: hex('#d9a066'),
  plankB: hex('#cf9459'),
  seam: hex('#a8703f'),
  checkLight: hex('#e9e6ef'),
  checkDark: hex('#4a4656'),
  tileA: hex('#f1e2c4'),
  tileB: hex('#e4d0aa'),
  kitchenTile: hex('#f4f6f8'),
  kitchenGrout: hex('#c9d3d8'),
  cobbleA: hex('#b9ada0'),
  cobbleB: hex('#a89c90'),
  cobbleGap: hex('#8f8478'),
  tableTop: hex('#b8794a'),
  tableLeft: hex('#94603a'),
  tableRight: hex('#7a4a2c'),
  tableEdge: hex('#d09060'),
  cloth: hex('#fbf3e4'),
  clothEdge: hex('#b5452f'),
  bistro: hex('#efe9df'),
  bistroShade: hex('#cfc6b8'),
  chair: hex('#a0663a'),
  chairDark: hex('#7a4a2c'),
  steelTop: hex('#d5dde2'),
  steelLeft: hex('#a9b5bc'),
  steelRight: hex('#8a979e'),
  cabinet: hex('#9a5f38'),
  cabinetDark: hex('#7a4a2c'),
  fridge: hex('#dfe9f0'),
  fridgeShade: hex('#b9c8d3'),
  stove: hex('#3d3a46'),
  plate: hex('#fdf8ee'),
  glow: hex('#fff1b8'),
  gold: hex('#d9a92b'),
  curtain: hex('#fbf1dc'),
  curtainShade: hex('#e8d6b3'),
  houses: ['#b5452f', '#e9a23b', '#5d8aa8', '#7a9e6b', '#e4c9a0'].map(hex),
  sky: { sunny: hex('#bfe0f0'), cloudy: hex('#d3dde3'), rain: hex('#a4b4c0'), heatwave: hex('#ffe3a8') } as Record<Weather, Rgb>,
  dusk: hex('#3d4a74'),
  lit: hex('#ffd76a'),
  rainStreak: hex('#e6eef3'),
  cloud: hex('#ffffff'),
  frameGreen: hex('#3c4a3a'),
  face: hex('#f3d2b5'),
  coat: hex('#2b2b2b'),
  chartSea: hex('#9fcbe0'),
  chartLand: hex('#d9b97a'),
  leaf: hex('#3e7a3a'),
  leafLight: hex('#7fb069'),
  bottle: hex('#cfe8e0'),
  sail: hex('#ffffff'),
  potClay: hex('#c97a4a'),
  potDark: hex('#9c5a33'),
  stoveTile: hex('#ffffff'),
  stoneA: hex('#cfc3b0'),
  stoneB: hex('#c2b59f'),
  mortar: hex('#9d927f'),
  slabA: hex('#e3d8c4'),
  slabB: hex('#d8ccb6'),
  slabGap: hex('#b9ab93'),
  sandstone: hex('#efe6d2'),
  sandstoneShade: hex('#d8ccb3'),
  sandstoneDark: hex('#c4b698'),
  plaster: hex('#e8c07a'),
  azulejoBlue: hex('#2b5d9b'),
  azulejoWhite: hex('#f4f7fb'),
  azulejoGrout: hex('#c9d6e6'),
  iron: hex('#2e2a33'),
  ironLight: hex('#4a4656'),
  bark: hex('#6b4a2e'),
  barkDark: hex('#4f3520'),
  chalk: hex('#2f3b33'),
  terracotta: hex('#c97a4a'),
  terracottaDark: hex('#9c5a33'),
  plasterShade: hex('#d2a862'),
  stoveBlue: hex('#2f6f8f'),
  brick: hex('#a9472f'),
  brickDark: hex('#7a3322'),
  espresso: hex('#b5452f'),
  glass: hex('#e6f3f7'),
  cake: hex('#f1d7a0'),
  flowers: [hex('#e9a23b'), hex('#d9412b'), hex('#f4c531'), hex('#ffffff')],
  trimLight: hex('#b07a4d'),
  wallLowerLeft: hex('#e6cda2'),
  wallLowerRight: hex('#eedab4'),
  plasterLight: hex('#fbf1de'),
  plankC: hex('#d49a5f'),
  shadow: hex('#5a3a2a'),
  sunlight: hex('#fff6dc'),
  clockFace: hex('#fbf6ea'),
  chalkLine: hex('#e3e8e2'),
  copper: hex('#c46a3a'),
  copperLight: hex('#eb9a62'),
  copperDark: hex('#8c4220'),
  delft: hex('#3d5f9e'),
  dayWindow: hex('#8fa9bb'),
  darkWindow: hex('#4f5d6e'),
  sconce: hex('#3c6b4f'),
  sconceLight: hex('#5a8f6b'),
  sconceDark: hex('#2b5039'),
  zurawWood: hex('#5e3b26'),
  water: hex('#5d8aa8'),
  lamplight: hex('#ffc861'),
  tableSeam: hex('#9c6440'),
  apron: hex('#6b4029'),
  chairTop: hex('#b97a48'),
  rattan: hex('#d5a468'),
  rattanLight: hex('#ebc690'),
  rattanDark: hex('#a7743f'),
  clothShade: hex('#efe4cf'),
  candle: hex('#f6efd9'),
  tulip: hex('#d9412b'),
  stem: hex('#4f8a3c'),
  kashubian: [hex('#2f6f8f'), hex('#d9412b'), hex('#e9a23b'), hex('#3e7a3a')],
  magnetRed: hex('#d9412b'),
  magnetYellow: hex('#f4c531'),
  leafDark: hex('#2e5e2e'),
  bloom: [hex('#f2a0b5'), hex('#f4c531'), hex('#ffffff')],
};

const wood: Faces = { top: C.tableTop, left: C.tableLeft, right: C.tableRight, edge: C.tableEdge };
const steel: Faces = { top: C.steelTop, left: C.steelLeft, right: C.steelRight };

// ---------- Layout ----------

export interface Slot {
  /** The back corner of the table top. */
  x: number;
  y: number;
}

export interface RoomLayout {
  roomX: number;
  roomY: number;
  terraceDepth: number;
  /** The outer edges of the floor: the room with its low walls, and the przedproże in front. */
  edgeX: number;
  edgeY: number;
  /** Where people walk along the street, in front of the steps. */
  streetY: number;
  /** Picture size in art pixels, and where world (0, 0, 0) lands in it. */
  width: number;
  height: number;
  origin: Origin;
  /** Every place a table can go inside, in the order tables are bought. */
  inside: Slot[];
  terrace: Slot[];
  /** The kitchen corner: x from here to the side wall, y up to KITCHEN_DEPTH. */
  kitchenX: number;
  door: { x0: number; x1: number };
}

/**
 * Where everything goes, from the size of the premises: more seats means a bigger room.
 * Tables sit on a grid with room for a chair on every side; the kitchen takes the far corner.
 */
export function roomLayout(maxTables: number, terraceTables: number): RoomLayout {
  const cols = tableColumns(maxTables);
  const rows = Math.max(1, Math.ceil(maxTables / cols));
  const roomX = 8 + cols * GRID + (cols === 3 ? 12 : 8);
  const roomY = 54 + rows * GRID;
  const inside: Slot[] = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) inside.push({ x: 8 + c * GRID, y: 56 + r * GRID });

  // The terrace is a przedproże: a stone platform in front of the house, with a balustrade.
  const terraceRows = terraceTables > 3 ? 2 : terraceTables > 0 ? 1 : 0;
  const terraceDepth = terraceRows * GRID + (terraceRows > 0 ? 12 : 0);
  const perRow = Math.ceil(terraceTables / Math.max(1, terraceRows));
  const frontY = roomY + LOW_WALL.thick;
  const terrace: Slot[] = Array.from({ length: terraceTables }, (_, i) => ({
    x: 8 + (i % perRow) * GRID,
    y: frontY + 16 + Math.floor(i / perRow) * GRID,
  }));

  const edgeX = roomX + LOW_WALL.thick;
  const edgeY = frontY + terraceDepth;
  const streetY = edgeY + STEPS + 6;
  // The picture ends just past the steps; people on the street walk over the street picture around it.
  const totalY = edgeY + STEPS + 2;
  const k = ROOM_SCALE;
  const origin = { ox: (totalY + 8) * k, oy: (WALL_HEIGHT + 10) * k, k };
  return {
    roomX,
    roomY,
    terraceDepth,
    edgeX,
    edgeY,
    streetY,
    width: Math.ceil((edgeX + totalY + 16) * k),
    height: Math.ceil(origin.oy + ((edgeX + totalY) / 2 + PLINTH + 8) * k),
    origin,
    inside,
    terrace,
    kitchenX: roomX - 52,
    door: { x0: 24, x1: 42 },
  };
}

// ---------- Seats around a table ----------

export type Facing = 'front' | 'back';

interface Seat {
  /** Where the sitter's seat is (bottom-centre of their sprite). */
  x: number;
  y: number;
  facing: Facing;
  chair: { seat: [number, number, number, number]; back: [number, number, number, number] };
}

/** Four chairs: far side and left side face us, near side and right side show their backs. Filled in this order. */
function seats(slot: Slot): Seat[] {
  const { x, y } = slot;
  const cx = x + TABLE / 2;
  const cy = y + TABLE / 2;
  return [
    { x: cx, y: y - 4, facing: 'front', chair: { seat: [cx - 3, cx + 3, y - 8, y - 2], back: [cx - 3, cx + 3, y - 8, y - 6.5] } },
    { x: cx, y: y + 20, facing: 'back', chair: { seat: [cx - 3, cx + 3, y + 18, y + 24], back: [cx - 3, cx + 3, y + 22.5, y + 24] } },
    { x: x - 4, y: cy, facing: 'front', chair: { seat: [x - 8, x - 2, cy - 3, cy + 3], back: [x - 8, x - 6.5, cy - 3, cy + 3] } },
    { x: x + 20, y: cy, facing: 'back', chair: { seat: [x + 18, x + 24, cy - 3, cy + 3], back: [x + 22.5, x + 24, cy - 3, cy + 3] } },
  ];
}

// ---------- Drawing helpers ----------

/** A chair's colours: wood inside, rattan with a woven seat on the terrace. */
interface ChairLook {
  light: Rgb;
  mid: Rgb;
  dark: Rgb;
  seat: Rgb;
  woven: boolean;
}

const WOOD_CHAIR: ChairLook = { light: C.chairTop, mid: C.chair, dark: C.chairDark, seat: C.chairTop, woven: false };
const RATTAN_CHAIR: ChairLook = { light: C.rattanLight, mid: C.rattan, dark: C.rattanDark, seat: C.rattanLight, woven: true };

function chair(img: Pixels, o: Origin, seat: Seat, look: ChairLook): void {
  const frame: Faces = { top: look.mid, left: look.mid, right: look.dark };
  const [sx0, sx1, sy0, sy1] = seat.chair.seat;
  for (const [lx, ly] of [
    [sx0, sy0],
    [sx1 - 1, sy0],
    [sx0, sy1 - 1],
    [sx1 - 1, sy1 - 1],
  ]) {
    box(img, o, { x0: lx, x1: lx + 1, y0: ly, y1: ly + 1, z0: 0, z1: 7 }, frame);
  }
  texturedBox(img, o, { x0: sx0, x1: sx1, y0: sy0, y1: sy1, z0: 7, z1: SEAT_Z }, (face, u, v) => {
    if (face !== 'top') return face === 'left' ? look.mid : look.dark;
    if (look.woven) return (Math.floor(u) + Math.floor(v)) % 2 === 0 ? look.seat : look.mid;
    return look.seat;
  });
  // The back: upright slats under a top rail.
  const [bx0, bx1, by0, by1] = seat.chair.back;
  texturedBox(img, o, { x0: bx0, x1: bx1, y0: by0, y1: by1, z0: SEAT_Z, z1: 18 }, (face, u, v) => {
    if (face === 'top') return look.light;
    const side = face === 'left' ? look.mid : look.dark;
    if (v >= 18 - SEAT_Z - 2.4) return side;
    return Math.floor(u / 1.5) % 2 === 0 ? side : mix(side, C.outline, 0.35);
  });
}

/** Cupboard doors along the front of a counter, `width` apart, each with a little steel handle. */
function cupboard(face: 'top' | 'left' | 'right', u: number, v: number, width: number): Rgb {
  if (face !== 'left') return face === 'top' ? C.cabinet : C.cabinetDark;
  if (v < 1) return C.cabinetDark;
  const at = u % width;
  if (at < 0.6) return C.cabinetDark;
  if (at >= width - 1.8 && at < width - 1 && v >= 9 && v < 11) return C.steelTop;
  return C.cabinet;
}

/** Two rows of drawers along the front of the kitchen island, each with a handle in the middle. */
function drawers(face: 'top' | 'left' | 'right', u: number, v: number): Rgb {
  if (face !== 'left') return face === 'top' ? C.cabinet : C.cabinetDark;
  if (v < 1 || (v >= 6.5 && v < 7.1)) return C.cabinetDark;
  const at = u % 8;
  if (at < 0.6) return C.cabinetDark;
  if (Math.abs(at - 4.3) < 1 && (Math.abs(v - 4) < 0.5 || Math.abs(v - 10) < 0.5)) return C.steelTop;
  return C.cabinet;
}

function plate(img: Pixels, o: Origin, x: number, y: number, z: number, food: Rgb): void {
  box(img, o, { x0: x - 2, x1: x + 2, y0: y - 2, y1: y + 2, z0: z, z1: z + 0.6 }, solid(C.plate));
  box(img, o, { x0: x - 1, x1: x + 1, y0: y - 1, y1: y + 1, z0: z + 0.6, z1: z + 1.4 }, solid(food));
}

// ---------- Sprites: small pictures drawn once and reused ----------

/** A picture plus where its top-left corner sits relative to the world point it was drawn around. */
export interface SpriteImage {
  pixels: Pixels;
  dx: number;
  dy: number;
}

const spriteCache = new Map<string, SpriteImage>();

/**
 * Draws something around a world point (0, 0, 0) on a scratch picture, outlines it,
 * and crops it tight. Cached by key, so each kind of thing is only drawn once.
 */
function drawn(key: string, draw: (img: Pixels, o: Origin) => void, units = 96): SpriteImage {
  const cached = spriteCache.get(key);
  if (cached) return cached;
  const size = Math.ceil(units * ROOM_SCALE);
  const o = { ox: size / 2, oy: size * 0.7, k: ROOM_SCALE };
  const img = new Pixels(size, size);
  draw(img, o);
  img.outline(C.outline);
  const b = img.bounds() ?? { x: 0, y: 0, width: 1, height: 1 };
  const result = { pixels: img.crop(b.x, b.y, b.width, b.height), dx: b.x - o.ox, dy: b.y - o.oy };
  spriteCache.set(key, result);
  return result;
}

/** A person's picture in a pose, anchored at the bottom-centre (on the seat or the floor). */
export function personImage(kind: S.PersonKind, facing: Facing, pose: S.Pose, variant = 0): SpriteImage {
  const key = `person:${kind}:${facing}:${pose}:${variant % 6}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;
  const pixels = S.personPixels(kind, facing, pose, variant);
  const result = { pixels, dx: -Math.round(pixels.width / 2), dy: -pixels.height };
  spriteCache.set(key, result);
  return result;
}

/** Two walking steps side by side, for a CSS walk cycle. */
export function walkStrip(kind: S.PersonKind, facing: Facing, variant: number, carry?: S.Carry): SpriteImage {
  const key = `walk:${kind}:${facing}:${variant % 6}:${carry ?? ''}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;
  const a = S.personPixels(kind, facing, 'walk1', variant, carry);
  const b = S.personPixels(kind, facing, 'walk2', variant, carry);
  const pixels = new Pixels(a.width * 2, a.height);
  pixels.draw(a, 0, 0);
  pixels.draw(b, a.width, 0);
  const result = { pixels, dx: -Math.round(a.width / 2), dy: -a.height };
  spriteCache.set(key, result);
  return result;
}

/** Who sits in a seat at a table: the critic, the regulars and some special guests have their own looks. */
export function guestKind(guests: TableGuests, seat = 0): S.PersonKind {
  if (guests.visitor === 'walesa') return seat === 0 ? 'walesa' : 'guard';
  if (guests.visitor === 'footballer' && seat === 0) return 'footballer';
  if (guests.regularId) return guests.regularId;
  return guests.critic ? 'critic' : guests.regular ? 'regular' : guests.group;
}

function plainSprite(key: string, rows: readonly string[], palette: S.Palette): SpriteImage {
  const cached = spriteCache.get(key);
  if (cached) return cached;
  const pixels = S.sprite(rows, palette);
  const result = { pixels, dx: -Math.round(pixels.width / 2), dy: -pixels.height };
  spriteCache.set(key, result);
  return result;
}

/** One sprite in the scene: which picture, where its top-left corner goes, and its place in the stack. */
export interface ScenePiece {
  key: string;
  image: SpriteImage;
  px: number;
  py: number;
  depth: number;
  /** For bubbles and coins: the guests this piece shows, and their table. */
  guests?: TableGuests;
  table?: number;
  kind?: 'guest' | 'chef' | 'steam' | 'flame' | 'queue' | 'pigeon' | 'busker' | 'boat';
  busy?: boolean;
}

function piece(o: Origin, key: string, image: SpriteImage, x: number, y: number, z: number, depth: number): ScenePiece {
  const { sx, sy } = project(o, x, y, z);
  return { key, image, px: Math.round(sx + image.dx), py: Math.round(sy + image.dy), depth };
}

const FOOD: Rgb[] = [hex('#e9a23b'), hex('#b5452f'), hex('#7a9e6b'), hex('#c97a4a')];

/**
 * A table, drawn around its back corner: a wooden one (boards with grain on a pedestal), one
 * with an embroidered Kashubian cloth, or a white bistro table on an iron stand on the terrace.
 * Plates when the food has come, and a little vase with a tulip, or a candle in the evening.
 */
function drawTable(img: Pixels, lo: Origin, style: 'wood' | 'cloth' | 'bistro', plates: number, setting: 'vase' | 'candle'): void {
  // Candlelight warms the top around the middle.
  const lit = (u: number, v: number, colour: Rgb) => {
    if (setting !== 'candle') return colour;
    const d = Math.hypot(u - TABLE / 2, v - TABLE / 2);
    return d < 6 ? mix(colour, C.lit, 0.3 * (1 - d / 6)) : colour;
  };
  if (style === 'bistro') {
    const iron: Faces = { top: C.ironLight, left: C.ironLight, right: C.iron };
    box(img, lo, { x0: 4, x1: 12, y0: 7, y1: 9, z0: 0, z1: 0.8 }, iron);
    box(img, lo, { x0: 7, x1: 9, y0: 4, y1: 12, z0: 0, z1: 0.8 }, iron);
    box(img, lo, { x0: 7.2, x1: 8.8, y0: 7.2, y1: 8.8, z0: 0.8, z1: 13.5 }, iron);
    texturedBox(img, lo, { x0: 0, x1: TABLE, y0: 0, y1: TABLE, z0: 13.5, z1: 15 }, (face, u, v) => {
      if (face !== 'top') return C.bistroShade;
      if (u >= TABLE - 1 || v >= TABLE - 1) return C.bistroShade;
      return lit(u, v, C.bistro);
    });
  } else {
    box(img, lo, { x0: 3, x1: 13, y0: 7, y1: 9, z0: 0, z1: 1 }, wood);
    box(img, lo, { x0: 7, x1: 9, y0: 3, y1: 13, z0: 0, z1: 1 }, wood);
    box(img, lo, { x0: 6.5, x1: 9.5, y0: 6.5, y1: 9.5, z0: 1, z1: 12 }, wood);
    if (style === 'wood') {
      box(img, lo, { x0: 1, x1: TABLE - 1, y0: 1, y1: TABLE - 1, z0: 10.5, z1: 12 }, solid(C.apron));
      texturedBox(img, lo, { x0: 0, x1: TABLE, y0: 0, y1: TABLE, z0: 12, z1: 15 }, (face, u, v) => {
        if (face !== 'top') return face === 'left' ? C.tableLeft : C.tableRight;
        if (u >= TABLE - 1 || v >= TABLE - 1) return C.tableEdge;
        if (v % 4 < 0.5) return C.tableSeam;
        return grain(Math.floor(u / 3), Math.floor(v * 2), 41) < 0.12 ? mix(C.tableTop, C.tableSeam, 0.45) : lit(u, v, C.tableTop);
      });
    } else {
      // The cloth hangs down the sides, with a red hem and a band of embroidery.
      const reach = TABLE + 1.2;
      texturedBox(img, lo, { x0: -0.6, x1: TABLE + 0.6, y0: -0.6, y1: TABLE + 0.6, z0: 10, z1: 15 }, (face, u, v) => {
        if (face === 'top') {
          const edge = Math.min(u, v, reach - u, reach - v);
          if (edge > 1.4 && edge < 2.4) return Math.floor(u + v) % 3 === 0 ? C.kashubian[Math.floor((u + v) / 3) % C.kashubian.length] : C.cloth;
          return lit(u, v, C.cloth);
        }
        if (v < 0.8) return C.clothEdge;
        if (v >= 1.8 && v < 2.6 && Math.floor(u) % 2 === 0) return C.kashubian[Math.floor(u / 2) % C.kashubian.length];
        return face === 'left' ? C.cloth : C.clothShade;
      });
    }
  }
  const spots: [number, number][] = [
    [8, 3.5],
    [8, 12.5],
    [3.5, 8],
    [12.5, 8],
  ];
  spots.slice(0, plates).forEach(([px, py], i) => plate(img, lo, px, py, 15, FOOD[i % FOOD.length]));
  const mid = TABLE / 2;
  if (setting === 'candle') {
    box(img, lo, { x0: mid - 0.7, x1: mid + 0.7, y0: mid - 0.7, y1: mid + 0.7, z0: 15, z1: 17.5 }, solid(C.candle));
    box(img, lo, { x0: mid - 0.4, x1: mid + 0.4, y0: mid - 0.4, y1: mid + 0.4, z0: 17.5, z1: 18.6 }, solid(C.lit));
  } else {
    box(img, lo, { x0: mid - 0.8, x1: mid + 0.8, y0: mid - 0.8, y1: mid + 0.8, z0: 15, z1: 17 }, { top: C.plate, left: C.plate, right: C.clothShade });
    box(img, lo, { x0: mid - 0.3, x1: mid + 0.3, y0: mid - 0.3, y1: mid + 0.3, z0: 17, z1: 18 }, solid(C.stem));
    box(img, lo, { x0: mid - 0.7, x1: mid + 0.7, y0: mid - 0.7, y1: mid + 0.7, z0: 18, z1: 19.2 }, solid(C.tulip));
  }
}

// ---------- The room as one background picture ----------

export interface RoomLook {
  decor: DecorId[];
  equipment: EquipmentId[];
  weather: Weather;
  dusk: boolean;
  /** Tables actually bought, inside; the lamps hang over these. */
  insideTables: number;
}

/** A steady 0–1 number for a spot (and a salt), so textures come out the same every time they're drawn. */
function grain(a: number, b: number, salt = 0): number {
  let h = Math.imul(Math.floor(a), 374761393) ^ Math.imul(Math.floor(b), 668265263) ^ Math.imul(salt + 1, -1640531535);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** The skirting board along the floor and the cornice under the ceiling; null in between. */
function trimAt(z: number): Rgb | null {
  if (z < 1) return C.trimDark;
  if (z < 3) return C.trim;
  if (z < 3.6) return C.trimLight;
  if (z >= WALL_HEIGHT - 1) return C.trimDark;
  if (z >= WALL_HEIGHT - 4) return z < WALL_HEIGHT - 3.4 ? C.trimLight : C.trim;
  return null;
}

/**
 * Painted plaster: a soft speckle, a darker band below a dado rail, and a little shade low down,
 * in the corner and under the cornice.
 */
function plaster(u: number, z: number, upper: Rgb, lower: Rgb): Rgb {
  if (z >= 15.4 && z < 17) return z >= 16.4 ? C.trimLight : C.trim;
  const base = z < 15.4 ? lower : upper;
  let shade = 0;
  if (z < 9) shade += ((9 - z) / 9) * 0.35;
  if (z > WALL_HEIGHT - 9) shade += Math.min(1, (z - (WALL_HEIGHT - 9)) / 5) * 0.25;
  if (u < 8) shade += ((8 - u) / 8) * 0.35;
  const fleck = grain(u / 2, z, 5);
  if (fleck < 0.06) shade += 0.3;
  const c = shade > 0 ? mix(base, C.wallShade, Math.min(0.7, shade)) : base;
  return fleck > 0.97 ? mix(c, C.plasterLight, 0.45) : c;
}

/**
 * Brass wall lamps with green shades on the left wall, in the gaps between the window and the
 * pictures; the rope-and-lantern lamps take their place when they're bought.
 */
function sconceSpots(layout: RoomLayout, look: RoomLook): number[] {
  if (look.decor.includes('lanterns')) return [];
  return [66, 92, 118].filter((u) => u < layout.roomY - 8);
}

/** Lamplight on a wall or the floor around the wall lamps, in the evening. */
function sconceLight(layout: RoomLayout, look: RoomLook, colour: Rgb, u: number, z: number, reach: number, strength: number): Rgb {
  if (!look.dusk) return colour;
  for (const s of sconceSpots(layout, look)) {
    const d = Math.hypot(u - s, (z - 35) * 1.3);
    if (d < reach) colour = mix(colour, C.lamplight, strength * (1 - d / reach));
  }
  return colour;
}

/** The left wall (x = 0): a window onto the Old Town, and decor. Coordinates along the wall are (u = y, z). */
function leftWall(layout: RoomLayout, look: RoomLook, u: number, z: number): Rgb {
  const has = (id: DecorId) => look.decor.includes(id);
  const trim = trimAt(z);
  if (trim) return trim;
  const win = windowAt(look, u, z);
  if (win) return win;
  // Ships in bottles on a shelf.
  if (has('shipsInBottles') && u >= 6 && u < 22 && z >= 30 && z < 38) {
    if (z < 31) return z >= 30.6 ? C.trimLight : C.trim;
    const k = (u - 6) % 5;
    if (k < 1) return wallBase(look, u, z);
    // A cork in each bottle's neck, a little ship on a blue sea inside.
    if (z > 36) return k > 1.5 && k < 3 ? C.trimDark : wallBase(look, u, z);
    if (z < 32) return C.water;
    if (z < 33) return k > 1.2 && k < 3.6 ? C.trimDark : C.bottle;
    return k > 1.8 && k < 3 && z < 35.5 ? C.sail : C.bottle;
  }
  // The painted sea chart, then the clay pots, further along the wall.
  const spots = [
    { u0: 70, u1: 88 },
    { u0: 96, u1: 114 },
  ].filter((s) => s.u1 < layout.roomY - 2);
  const pictures = (['seaChart', 'clayPots'] as DecorId[]).filter(has);
  for (let i = 0; i < pictures.length && i < spots.length; i++) {
    const { u0, u1 } = spots[i];
    if (u < u0 || u >= u1) continue;
    if (pictures[i] === 'seaChart' && z >= 20 && z < 36) {
      if (u < u0 + 1.5 || u >= u1 - 1.5 || z < 21.5 || z >= 34.5) return u < u0 + 0.6 || z >= 35.4 ? C.trimDark : C.gold;
      const coast = 27 + Math.sin((u - u0) / 2.5) * 3;
      if (Math.abs(z - coast) < 0.7) return C.trimDark;
      // A compass rose out at sea, in gold.
      const cu = u - (u0 + 5);
      const cz = z - 31;
      if ((Math.abs(cu) < 0.5 && Math.abs(cz) < 2.2) || (Math.abs(cz) < 0.5 && Math.abs(cu) < 2.2)) return z < coast ? C.chartLand : C.gold;
      return z < coast ? C.chartLand : C.chartSea;
    }
    if (pictures[i] === 'clayPots' && z >= 24 && z < 36) {
      if (z < 25) return z >= 24.6 ? C.trimLight : C.trim;
      // Three pots of different heights, each with a cream band.
      const pot = Math.floor((u - u0) / 6);
      const k = (u - u0) % 6;
      const height = [7, 10, 8][pot % 3];
      const widest = 25 + height * 0.45;
      const width = 2.4 - Math.abs(z - widest) * (3 / height);
      if (z < 25 + height && Math.abs(k - 3) < Math.max(0.8, width)) {
        if (Math.abs(z - (widest + 1)) < 0.5) return C.candle;
        return k > 3.6 ? C.potDark : C.potClay;
      }
    }
  }
  return sconceLight(layout, look, wallBase(look, u, z, C.wallLeft), u, z, 12, 0.4);
}

/** The right wall (y = 0): the door, the kitchen backsplash, and decor. Coordinates along it are (u = x, z). */
function rightWall(layout: RoomLayout, look: RoomLook, u: number, z: number): Rgb {
  const has = (id: DecorId) => look.decor.includes(id);
  const trim = trimAt(z);
  if (trim) return trim;
  // An arched wooden door.
  const { x0, x1 } = layout.door;
  const du = u - (x0 + x1) / 2;
  const arch = 26 + Math.sqrt(Math.max(0, 81 - du * du));
  if (u >= x0 && u < x1 && z < arch) {
    if (u < x0 + 1.5 || u >= x1 - 1.5 || z >= arch - 1.5) return C.trimDark;
    if (Math.abs(du - 4.5) < 1 && Math.abs(z - 14) < 1) return C.gold;
    return Math.floor(u) % 4 === 0 ? C.trimDark : C.trim;
  }
  // A clock above the door.
  const clock = clockAt(look, du, z - 41.5);
  if (clock) return clock;
  // The kitchen's wall: Delft tiles behind the counter, the ticket rail, copper pans.
  if (u >= layout.kitchenX) {
    const kitchen = kitchenWall(layout, u, z);
    if (kitchen) return kitchen;
  }
  // Two merchant portraits.
  if (has('portraits') && z >= 22 && z < 36) {
    for (const f0 of [4, 13]) {
      if (u < f0 || u >= f0 + 7) continue;
      if (u < f0 + 1 || u >= f0 + 6 || z < 23 || z >= 35) return z >= 35.4 || u < f0 + 0.5 ? C.trimDark : C.gold;
      const du2 = u - (f0 + 3.5);
      if (z > 29 && du2 * du2 + (z - 31) * (z - 31) < 3.5) return C.face;
      if (z < 28 && Math.abs(du2) < 2.5 - (28 - z) * 0.1) return C.coat;
      return C.frameGreen;
    }
  }
  // A living plant wall.
  if (has('plantWall') && u >= x1 + 4 && u < x1 + 16 && z >= 12 && z < 44) {
    if (u < x1 + 5 || u >= x1 + 15 || z < 13 || z >= 43) return C.trimDark;
    // Leaves in three greens, with a few flowers among them.
    const n = grain(u, z, 47);
    if (n < 0.05) return C.bloom[Math.floor(n * 60) % C.bloom.length];
    return n < 0.35 ? C.leafLight : n < 0.75 ? C.leaf : C.leafDark;
  }
  // Today's dishes chalked on a board, and in a bigger room a print of the Żuraw.
  const board = chalkboardAt(u, z);
  if (board) return board;
  if (layout.kitchenX - 6 >= ZURAW.u1) {
    const print = zurawAt(look, u, z);
    if (print) return print;
  }
  return wallBase(look, u, z, C.wallRight);
}

function wallBase(look: RoomLook, u: number, z: number, colour = C.wallLeft): Rgb {
  // Azulejo tiles from Coimbra: blue patterns on white, with a blue border on top.
  if (look.decor.includes('azulejoTiles') && z >= 3 && z < 22 && !(look.decor.includes('panelling') && colour === C.wallLeft)) {
    if (z >= 20) return C.azulejoBlue;
    const tu = ((u % 6) + 6) % 6;
    const tz = (z - 3) % 6;
    if (tu < 0.6 || tz < 0.6) return C.azulejoGrout;
    const d = Math.abs(tu - 3) + Math.abs(tz - 3);
    if (d < 1.2) return C.azulejoBlue;
    if (d > 1.8 && d < 2.6) return C.azulejoBlue;
    return C.azulejoWhite;
  }
  if (look.decor.includes('panelling') && z < 16) {
    if (z >= 14) return z >= 15.4 ? C.trimLight : C.trim;
    // Carved panels: light along the top and left of each, shade along the bottom and right.
    const k = ((u % 12) + 12) % 12;
    if (k <= 2 || k >= 10 || z <= 5 || z >= 12) return C.panel;
    if (z >= 11.3 || k < 2.7) return C.trim;
    if (z < 5.7 || k > 9.3) return C.trimDark;
    return C.panelInset;
  }
  return plaster(u, z, colour, colour === C.wallLeft ? C.wallLowerLeft : C.wallLowerRight);
}

/** The clock above the door: a quarter past one by day, eight o'clock in the evening. (du, dz) from its middle. */
function clockAt(look: RoomLook, du: number, dz: number): Rgb | null {
  const d = Math.hypot(du, dz);
  if (d >= 3.8) return null;
  if (d >= 3) return C.trimDark;
  const [hours, minutes] = look.dusk ? [8, 0] : [1, 15];
  const hand = (turn: number, length: number) => {
    const eu = Math.sin(turn * 2 * Math.PI) * length;
    const ez = Math.cos(turn * 2 * Math.PI) * length;
    const t = Math.max(0, Math.min(1, (du * eu + dz * ez) / (length * length)));
    return Math.hypot(du - eu * t, dz - ez * t) < 0.55;
  };
  if (hand(minutes / 60, 2.4) || hand((hours % 12) / 12 + minutes / 720, 1.6)) return C.outline;
  return C.clockFace;
}

/** The kitchen's wall: Delft tiles with a blue border, the ticket rail, and copper pans on a rail. */
function kitchenWall(layout: RoomLayout, u: number, z: number): Rgb | null {
  if (z >= 33 && z < 34) return C.steelRight;
  if (z >= 14 && z < 30) {
    if (z >= 28) return z >= 28.6 && z < 29.4 && Math.floor(u) % 2 === 0 ? C.kitchenTile : C.delft;
    const tu = ((u % 4) + 4) % 4;
    const tz = (z - 14) % 4;
    if (tu < 0.6 || tz < 0.6) return C.kitchenGrout;
    // A little blue flower on every other tile.
    if ((Math.floor(u / 4) + Math.floor((z - 14) / 4)) % 2 === 0 && Math.abs(tu - 2.3) + Math.abs(tz - 2.3) < 1.1) return C.delft;
    return C.kitchenTile;
  }
  // The iron rail the copper pans hang from (the pans themselves are little pictures, see drawRoom).
  if (z >= PAN_RAIL && z < PAN_RAIL + 0.8 && u >= layout.kitchenX + 3 && u < layout.roomX - 15) return C.iron;
  return null;
}

/** How high the pan rail runs along the kitchen wall. */
const PAN_RAIL = 44.8;

/** Where the copper pans hang along the rail: over the counter, clear of the fridge at the far end. */
function panSpots(layout: RoomLayout): number[] {
  const spots: number[] = [];
  for (let u = layout.kitchenX + 7; u + 4 <= layout.roomX - 15; u += 8) spots.push(u);
  return spots;
}

/** The chalkboard on the right wall, between the door and the kitchen. */
const CHALKBOARD = { u0: 61, u1: 74, z0: 19, z1: 36 };

function chalkboardAt(u: number, z: number): Rgb | null {
  const { u0, u1, z0, z1 } = CHALKBOARD;
  if (u < u0 || u >= u1 || z < z0 || z >= z1) return null;
  if (u < u0 + 1.2 || u >= u1 - 1.2 || z < z0 + 1.2 || z >= z1 - 1.2) return z < z0 + 0.6 ? C.trimDark : C.trim;
  // A heading, then three dishes with their prices, in chalk.
  const lines = [z1 - 4.2, z1 - 7.6, z1 - 10.2, z1 - 12.8];
  for (let i = 0; i < lines.length; i++) {
    if (Math.abs(z - lines[i]) >= (i === 0 ? 0.7 : 0.5)) continue;
    const ends = i === 0 ? [u0 + 3, u1 - 3] : [u0 + 2.5, u0 + 6 + grain(i, 7, 17) * 2.5];
    const price = i > 0 && u >= u1 - 4.2 && u < u1 - 2.5;
    if ((u >= ends[0] && u < ends[1]) || price) return grain(Math.floor(u * 1.4), i, 19) > 0.22 ? C.chalkLine : C.chalk;
  }
  return grain(u, z, 23) < 0.05 ? mix(C.chalk, C.chalkLine, 0.18) : C.chalk;
}

/** A print of the Żuraw, the old crane gate on the Motława, for the right wall of a bigger room. */
const ZURAW = { u0: 82, u1: 98, z0: 22, z1: 36 };

function zurawAt(look: RoomLook, u: number, z: number): Rgb | null {
  const { u0, u1, z0, z1 } = ZURAW;
  if (u < u0 || u >= u1 || z < z0 || z >= z1) return null;
  if (u < u0 + 1.2 || u >= u1 - 1.2 || z < z0 + 1.2 || z >= z1 - 1.2) return C.gold;
  const iu = u - u0 - 1.2;
  const iz = z - z0 - 1.2;
  if (iz < 2.4) return grain(u, z, 29) < 0.15 ? C.sail : C.water;
  const tower = (iu >= 1.5 && iu < 4.5) || (iu >= 9 && iu < 12);
  if (tower && iz < 7.5) return Math.floor(iz) % 2 === 0 && Math.floor(iu) % 2 === 0 ? C.brickDark : C.brick;
  const roof = 11.2 - Math.abs(iu - 6.75) * 0.9;
  if (iu >= 3.5 && iu < 10 && iz >= 5.5 && iz < roof) return iz >= roof - 0.8 ? C.trimDark : C.zurawWood;
  return mix(C.sky[look.weather], C.plasterLight, 0.35);
}

/** The window on the left wall, in wall coordinates (u along the wall, z up). */
const WINDOW = { u0: 26, u1: 62, z0: 16, z1: 42 };

/** The window: a curtain rod, curtains with tie-backs, the frame and glass with the view, and the sill. Null outside it. */
function windowAt(look: RoomLook, u: number, z: number): Rgb | null {
  const { u0, u1, z0, z1 } = WINDOW;
  if (z >= z1 + 1 && z < z1 + 2.2 && u >= u0 - 4 && u < u1 + 4) return u < u0 - 2.6 || u >= u1 + 2.6 ? C.gold : C.trimDark;
  if (z >= z0 && z < z1 + 1) {
    const height = z1 + 1 - z0;
    const tie = height * 0.42;
    const h = z - z0;
    // Each curtain reaches this far over the glass: wide at the top, gathered at the tie-back.
    const reach = h >= tie ? 3.5 + ((h - tie) / (height - tie)) * 3.5 : 3.5 + ((tie - h) / tie) * 2;
    const fold = (d: number) => {
      if (Math.abs(h - tie) < 0.7) return C.brick;
      if (d > reach + 2.2) return C.curtainShade;
      return Math.floor(d) % 3 === 0 ? C.curtainShade : C.curtain;
    };
    if (u >= u0 - 3 && u < u0 + reach) return fold(u - (u0 - 3));
    if (u >= u1 - reach && u < u1 + 3) return fold(u1 + 3 - u);
  }
  if (u >= u0 - 2 && u < u1 + 2 && z >= 14 && z < 16) return z >= 15.4 ? C.trimLight : z < 14.6 ? C.trimDark : C.trim;
  if (u >= u0 && u < u1 && z >= z0 && z < z1) return windowView(look, u - u0, z - z0, u1 - u0, z1 - z0);
  return null;
}

/** What you see through the window: Gdańsk gables under today's sky. (u, z) run from the window's corner. */
function windowView(look: RoomLook, u: number, z: number, w: number, h: number): Rgb {
  if (z < 1.5 || z >= h - 1.5 || u < 1.5 || u >= w - 1.5) return C.trimDark;
  if (z < 2.1 || z >= h - 2.1 || u < 2.1 || u >= w - 2.1) return C.trim;
  if (Math.abs(u - w / 2) < 0.8 || Math.abs(z - h * 0.56) < 0.6) return C.trimDark;
  const house = gableAt(look, u, z);
  if (house) return house;
  const sky = look.dusk ? C.dusk : C.sky[look.weather];
  if (look.weather === 'rain' && !look.dusk && Math.floor(u * 2 + z) % 6 === 0) return C.rainStreak;
  if (look.weather === 'cloudy' && !look.dusk) {
    const blob = (cu: number, cz: number, r: number) => (u - cu) ** 2 / (r * r * 4) + (z - cz) ** 2 / (r * r) < 1;
    if (blob(w * 0.3, h - 6, 2) || blob(w * 0.66, h - 4, 1.6)) return C.cloud;
  }
  // (The sun and the moon are in the sky over the street; through the slanting window they'd look squashed.)
  return z > h - 10 ? sky : mix(sky, C.cloud, 0.25);
}

/** The houses across the street: stepped and pointed gables, two windows a floor, lit in the evening. */
function gableAt(look: RoomLook, u: number, z: number): Rgb | null {
  const i = Math.floor((u + 1) / 7);
  const du = u + 1 - i * 7;
  const cu = Math.abs(du - 3.5);
  const eaves = 10 + (i % 3) * 1.5;
  const top = i % 2 === 0 ? eaves + 6 - Math.floor(cu / 1.4) * 1.6 : eaves + 6 - cu * 1.6;
  if (z >= top) return null;
  let colour = C.houses[(i + 2) % C.houses.length];
  if (du < 0.6) colour = mix(colour, C.outline, 0.35);
  const column = Math.abs(du - 2) < 0.75 || Math.abs(du - 5) < 0.75;
  const row = (z >= 3 && z < 5) || (z >= 7 && z < 9) || (z >= eaves + 1 && z < eaves + 3 && cu < 1);
  if (column && row && du >= 0.6) {
    if (!look.dusk) return C.dayWindow;
    return grain(i * 3 + Math.round(du), Math.floor(z / 2), 21) < 0.6 ? C.lit : C.darkWindow;
  }
  return look.dusk ? mix(colour, C.dusk, 0.45) : colour;
}

/** Granite blocks of the plinth: `u` along the side, `z` below the floor (negative). */
function plinth(u: number, z: number, side: boolean): Rgb {
  const row = Math.floor(-z / 3);
  const shift = row % 2 === 0 ? 0 : 4;
  const colour = (-z) % 3 < 0.6 || (u + shift) % 8 < 0.6 ? C.mortar : (Math.floor((u + shift) / 8) + row) % 2 === 0 ? C.stoneA : C.stoneB;
  return side ? mix(colour, C.outline, 0.15) : colour;
}

function floorColour(layout: RoomLayout, x: number, y: number): Rgb {
  // The przedproże: big sandstone slabs.
  if (y >= layout.roomY) {
    const v = y - layout.roomY;
    const row = Math.floor(v / 9);
    const shift = row % 2 === 0 ? 0 : 6;
    if (v % 9 < 0.6 || (x + shift) % 12 < 0.6) return C.slabGap;
    const slab = (Math.floor((x + shift) / 12) + row) % 2 === 0 ? C.slabA : C.slabB;
    return grain(x, y, 37) < 0.07 ? mix(slab, C.slabGap, 0.35) : slab;
  }
  // Under the low side wall.
  if (x >= layout.roomX) return C.stoneB;
  // The kitchen corner: a checkered floor, like reference 2.
  if (x >= layout.kitchenX && y < KITCHEN_DEPTH) {
    const light = (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0;
    if (x % 8 < 0.5 || y % 8 < 0.5) return mix(C.checkLight, C.checkDark, 0.35);
    return light ? C.checkLight : C.checkDark;
  }
  // Cream tiles inside the front door, like reference 3.
  if (x >= layout.door.x0 + 2 && x < layout.door.x1 - 2 && y > layout.roomY - 16) {
    if (x % 6 < 0.6 || y % 6 < 0.6) return C.tileB;
    return (Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 0 ? C.tileA : C.tileB;
  }
  // Honey-wood boards in three tones, their ends staggered row by row, with grain and the odd knot.
  const row = Math.floor(y / 6);
  const across = y - row * 6;
  if (across < 0.6) return C.seam;
  const along = x + ((row * 23) % 40);
  const board = Math.floor(along / 40);
  const at = along - board * 40;
  if (at < 0.8) return C.seam;
  const tone = PLANKS[Math.floor(grain(row, board, 11) * PLANKS.length)];
  if (grain(row * 12 + Math.floor(across * 2), Math.floor(at / 5), 13) < 0.16) return mix(tone, C.seam, 0.3);
  const knot = grain(row, board, 15);
  if (knot < 0.3 && Math.abs(at - (6 + knot * 90)) < 1 && Math.abs(across - 3) < 0.8) return mix(tone, C.seam, 0.6);
  return tone;
}

const PLANKS = [C.plankA, C.plankB, C.plankC];

/** Where lamps hang: over the tables, or one chandelier in the middle. */
export function lampSpots(layout: RoomLayout, look: RoomLook): { x: number; y: number; z: number; kind: 'pendant' | 'chandelier' | 'lantern' }[] {
  const spots: { x: number; y: number; z: number; kind: 'pendant' | 'chandelier' | 'lantern' }[] = [];
  if (look.decor.includes('pendantLights')) {
    for (const slot of layout.inside.slice(0, look.insideTables)) spots.push({ x: slot.x + 8, y: slot.y + 8, z: 36, kind: 'pendant' });
  }
  if (look.decor.includes('chandelier')) {
    spots.push({ x: Math.round(layout.roomX * 0.36), y: Math.round((56 + layout.roomY) / 2), z: 42, kind: 'chandelier' });
  }
  if (look.decor.includes('lanterns')) {
    spots.push({ x: 6, y: 20, z: 34, kind: 'lantern' }, { x: 6, y: 68, z: 34, kind: 'lantern' });
  }
  return spots;
}

/** The empty room: floor, walls, window, wall decor, lamplight and the kitchen's back wall. */
export function drawRoom(layout: RoomLayout, look: RoomLook): Pixels {
  const { width, height, origin: o, roomX, roomY } = layout;
  const img = new Pixels(width, height);
  const glows = lampSpots(layout, look).filter((l) => l.kind !== 'lantern');
  const sunny = !look.dusk && (look.weather === 'sunny' || look.weather === 'heatwave');
  const sconces = look.dusk ? sconceSpots(layout, look) : [];
  // Soft shadows on the floor under the tables and the kitchen island.
  const k = layout.kitchenX;
  const shadows = [...layout.inside.slice(0, look.insideTables), ...layout.terrace].map((t) => ({
    x0: t.x - 1,
    x1: t.x + TABLE + 1,
    y0: t.y - 1,
    y1: t.y + TABLE + 1,
  }));
  shadows.push({ x0: k + 15, x1: roomX - 3, y0: 25, y1: 37 });

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const sx = (px + 0.5 - o.ox) / ROOM_SCALE;
      const sy = (py + 0.5 - o.oy) / ROOM_SCALE;
      const fx = (sx + 2 * sy) / 2;
      const fy = (2 * sy - sx) / 2;
      if (fx >= 0 && fx < layout.edgeX && fy >= 0 && fy < layout.edgeY) {
        let colour = floorColour(layout, fx, fy);
        // How much shade (by the walls, under tables) and lamplight falls here, mixed in once at the end.
        let shade = 0;
        let lamp = 0;
        if (fy < roomY && fx < roomX) {
          const wall = Math.min(fx, fy);
          if (wall < 4) shade += 0.25 * (1 - wall / 4);
          // Sunlight falling through the window on a bright day.
          const along = fy - fx * 0.6;
          if (sunny && fx < 30 && along >= WINDOW.u0 + 1 && along < WINDOW.u1 - 1) colour = mix(colour, C.sunlight, 0.22 * (1 - fx / 30));
          // The wall lamps' light, in the evening.
          for (const u of sconces) {
            const d = Math.hypot(fx * 1.2, fy - u);
            if (d < 12) lamp += 0.25 * (1 - d / 12);
          }
        }
        // Warm pools of light under the lamps, in two soft bands.
        if (fy < roomY && glows.length > 0) {
          let near = Infinity;
          for (const g of glows) near = Math.min(near, Math.hypot(fx - g.x, fy - g.y));
          if (near < 10) colour = mix(colour, C.glow, 0.22);
          else if (near < 17) colour = mix(colour, C.glow, 0.1);
        }
        for (const t of shadows) {
          if (fx < t.x0 || fx >= t.x1 || fy < t.y0 || fy >= t.y1) continue;
          const edge = fx < t.x0 + 1 || fx >= t.x1 - 1 || fy < t.y0 + 1 || fy >= t.y1 - 1;
          shade += edge ? 0.1 : 0.2;
        }
        if (shade > 0) colour = mix(colour, C.shadow, Math.min(0.45, shade));
        if (lamp > 0) colour = mix(colour, C.lamplight, Math.min(0.4, lamp));
        img.set(px, py, colour);
        continue;
      }
      const rz = sx / 2 - sy;
      if (sx >= 0 && sx < roomX && rz >= 0 && rz < WALL_HEIGHT) {
        img.set(px, py, rightWall(layout, look, sx, rz));
        continue;
      }
      const ly = -sx;
      const lz = ly / 2 - sy;
      if (ly >= 0 && ly < roomY && lz >= 0 && lz < WALL_HEIGHT) {
        img.set(px, py, leftWall(layout, look, ly, lz));
        continue;
      }
      // The stone plinth under the floor, seen along the two open sides.
      const front = sx + layout.edgeY;
      const frontZ = (front + layout.edgeY) / 2 - sy;
      if (front >= 0 && front < layout.edgeX && frontZ >= -PLINTH && frontZ < 0) {
        img.set(px, py, plinth(front, frontZ, false));
        continue;
      }
      const side = layout.edgeX - sx;
      const sideZ = (layout.edgeX + side) / 2 - sy;
      if (side >= 0 && side < layout.edgeY && sideZ >= -PLINTH && sideZ < 0) img.set(px, py, plinth(side, sideZ, true));
    }
  }

  // Steps down from the door to the street.
  const stone: Faces = { top: C.sandstone, left: C.sandstoneShade, right: C.sandstoneDark };
  const { x0: d0, x1: d1 } = layout.door;
  box(img, o, { x0: d0 + 1, x1: d1 - 1, y0: layout.edgeY, y1: layout.edgeY + STEPS / 2, z0: -PLINTH, z1: -PLINTH / 3 }, stone);
  box(img, o, { x0: d0 + 1, x1: d1 - 1, y0: layout.edgeY + STEPS / 2, y1: layout.edgeY + STEPS, z0: -PLINTH, z1: (-2 * PLINTH) / 3 }, stone);

  // Things against the back walls, drawn back to front onto the room.
  const things: { depth: number; draw: (l: Pixels) => void }[] = [];
  // Brass wall lamps with green glass shades, lit in the evening (all on one layer: they never overlap).
  const sconce = S.sprite(S.SCONCE, look.dusk ? S.SCONCE_LIT : S.SCONCE_COLOURS);
  things.push({ depth: 60, draw: (l) => sconceSpots(layout, look).forEach((u) => placeOn(l, o, sconce, 1, u, 31)) });
  // Copper pans hanging from the rail over the kitchen counter.
  things.push({
    depth: layout.kitchenX + 5,
    draw: (l) =>
      panSpots(layout).forEach((u, i) => {
        const pan = S.sprite(S.PANS[i % S.PANS.length], S.PAN_COLOURS);
        placeOn(l, o, pan, u, 0.5, PAN_RAIL - pan.height);
      }),
  });
  things.push({
    depth: k + 10,
    draw: (l) => {
      texturedBox(l, o, { x0: k + 2, x1: roomX - 14, y0: 1, y1: 10, z0: 0, z1: 14 }, (face, u, v) => cupboard(face, u, v, 7));
      box(l, o, { x0: k + 2, x1: roomX - 14, y0: 1, y1: 10, z0: 14, z1: 16 }, steel);
      texturedBox(l, o, { x0: roomX - 13, x1: roomX - 1, y0: 1, y1: 12, z0: 0, z1: 32 }, (face, u, v) => {
        if (face !== 'left') return face === 'top' ? C.fridge : C.fridgeShade;
        // The fridge's front: a freezer door above, handles, and two magnets.
        if (v >= 21 && v < 21.7) return C.fridgeShade;
        if (u >= 1.2 && u < 2 && ((v >= 10 && v < 19) || (v >= 23.5 && v < 29.5))) return C.steelRight;
        if (Math.hypot(u - 8, v - 26) < 0.9) return C.magnetRed;
        if (Math.hypot(u - 6.5, v - 15) < 0.9) return C.magnetYellow;
        return C.fridge;
      });
      // Machines on the back counter.
      const slots = (['fryer', 'grill', 'espresso'] as EquipmentId[]).filter((id) => look.equipment.includes(id));
      slots.forEach((id, i) => {
        const x0 = k + 4 + i * 11;
        if (id === 'fryer') {
          box(l, o, { x0, x1: x0 + 9, y0: 2, y1: 9, z0: 16, z1: 22 }, steel);
          box(l, o, { x0: x0 + 2, x1: x0 + 7, y0: 3, y1: 8, z0: 22, z1: 23 }, solid(C.stove));
        } else if (id === 'grill') {
          box(l, o, { x0, x1: x0 + 9, y0: 2, y1: 9, z0: 16, z1: 19 }, { top: C.stove, left: C.steelRight, right: C.steelRight });
          for (let b = 1; b < 9; b += 2) box(l, o, { x0: x0 + b, x1: x0 + b + 0.6, y0: 2.5, y1: 8.5, z0: 19, z1: 19.3 }, solid(hex('#e9a23b')));
        } else {
          box(l, o, { x0: x0 + 1, x1: x0 + 8, y0: 2, y1: 8, z0: 16, z1: 26 }, { top: C.espresso, left: C.espresso, right: C.brickDark });
          box(l, o, { x0: x0 + 3, x1: x0 + 6, y0: 7, y1: 9, z0: 16, z1: 18 }, solid(C.plate));
        }
      });
    },
  });
  if (look.equipment.includes('dessertDisplay')) {
    things.push({
      depth: k - 8,
      draw: (l) => {
        texturedBox(l, o, { x0: k - 16, x1: k - 2, y0: 1, y1: 10, z0: 0, z1: 10 }, (face, u, v) => cupboard(face, u, v, 7));
        box(l, o, { x0: k - 16, x1: k - 2, y0: 1, y1: 10, z0: 10, z1: 20 }, { top: C.glass, left: C.glass, right: mix(C.glass, C.steelLeft, 0.4) });
        for (const cx of [k - 13, k - 8]) box(l, o, { x0: cx, x1: cx + 4, y0: 4, y1: 8, z0: 11, z1: 14 }, solid(C.cake));
      },
    });
  }
  if (look.decor.includes('tiledStove')) {
    things.push({
      depth: 10,
      draw: (l) => {
        const tile = { top: C.stoveTile, left: C.stoveTile, right: mix(C.stoveTile, C.stoveBlue, 0.2) };
        box(l, o, { x0: 1, x1: 15, y0: 1, y1: 15, z0: 0, z1: 4 }, { top: C.brick, left: C.brick, right: C.brickDark });
        box(l, o, { x0: 2, x1: 14, y0: 2, y1: 14, z0: 4, z1: 24 }, tile);
        box(l, o, { x0: 1, x1: 15, y0: 1, y1: 15, z0: 24, z1: 27 }, { top: C.stoveBlue, left: C.stoveBlue, right: mix(C.stoveBlue, C.outline, 0.3) });
        // Blue painted tiles: a little diamond on each.
        for (let z = 6; z < 22; z += 6) {
          for (const u of [5, 10]) {
            box(l, o, { x0: u, x1: u + 2, y0: 13.6, y1: 14, z0: z + 1, z1: z + 4 }, solid(C.stoveBlue));
            box(l, o, { x0: 13.6, x1: 14, y0: u, y1: u + 2, z0: z + 1, z1: z + 4 }, solid(C.stoveBlue));
          }
        }
        // The little iron door.
        box(l, o, { x0: 5, x1: 10, y0: 14, y1: 14.4, z0: 6, z1: 11 }, solid(C.stove));
      },
    });
  }
  if (look.decor.includes('communalTable')) {
    // In the back corner by the window, so the back of the room by the kitchen stays free for the waiters.
    const x0 = COMMUNAL_TABLE_X;
    things.push({
      depth: x0 + 30,
      draw: (l) => {
        box(l, o, { x0: x0 + 2, x1: x0 + 4, y0: 22, y1: 26, z0: 0, z1: 11 }, wood);
        box(l, o, { x0: x0 + 22, x1: x0 + 24, y0: 22, y1: 26, z0: 0, z1: 11 }, wood);
        texturedBox(l, o, { x0, x1: x0 + 26, y0: 20, y1: 28, z0: 11, z1: 14 }, (face, u, v) => {
          if (face !== 'top') return face === 'left' ? C.tableLeft : C.tableRight;
          if (u >= 25 || v >= 7) return C.tableEdge;
          if (v % 4 < 0.5) return C.tableSeam;
          return grain(Math.floor(u / 3), Math.floor(v * 2), 43) < 0.12 ? mix(C.tableTop, C.tableSeam, 0.45) : C.tableTop;
        });
        box(l, o, { x0, x1: x0 + 26, y0: 16, y1: 18, z0: 0, z1: 7 }, { top: C.chairTop, left: C.chair, right: C.chairDark });
      },
    });
  }
  // A plant by the door, and Mewa on the windowsill: always there.
  things.push({ depth: layout.door.x0 - 4, draw: (l) => placeOn(l, o, S.sprite(S.PLANT, S.PLANT_COLOURS), layout.door.x0 - 6, 4, 0) });
  things.push({ depth: 56, draw: (l) => placeOn(l, o, S.sprite(S.MEWA, S.MEWA_COLOURS), 3, 56, 16) });

  for (const thing of things.sort((a, b) => a.depth - b.depth)) {
    const layer = new Pixels(width, height);
    thing.draw(layer);
    layer.outline(C.outline);
    img.draw(layer, 0, 0);
  }
  return img;
}

// ---------- Everything stacked on top of the room ----------

/** Furniture and people for this moment of the day, back to front. */
export function scenePieces(
  layout: RoomLayout,
  floor: FloorView,
  look: RoomLook,
  /** Tables whose guests are still on their way in (by table number), so not yet seated. */
  arriving: ReadonlySet<number> = new Set(),
  /** Waiters out serving (by number), so not standing by the kitchen. */
  busyWaiters: ReadonlySet<number> = new Set(),
): ScenePiece[] {
  const o = layout.origin;
  const pieces: ScenePiece[] = [];
  const clothed = look.decor.includes('tablecloths');

  const addTable = (slot: Slot, guests: TableGuests | null, outdoor: boolean, tableIndex: number) => {
    const around = seats(slot);
    const seated = guests && !arriving.has(tableIndex) ? guests.seated : 0;
    const eating = guests?.stage === 'eating';
    const style = outdoor ? 'bistro' : clothed ? 'cloth' : 'wood';
    // Chairs (one sprite per chair, each with its own depth).
    around.forEach((seat, i) => {
      const image = drawn(`chair:${outdoor ? 'rattan' : 'wood'}:${i}`, (img, lo) => chair(img, lo, shiftSeat(seat, slot), outdoor ? RATTAN_CHAIR : WOOD_CHAIR));
      pieces.push(piece(o, `chair${slot.x},${slot.y},${i}`, image, slot.x, slot.y, 0, seatDepth(seat) + (seat.facing === 'back' ? 1.5 : -1)));
    });
    // The table itself, with plates when the food has come, and a vase (a candle in the evening).
    const plates = eating ? seated : 0;
    const setting = look.dusk ? 'candle' : 'vase';
    const table = drawn(`table:${style}:${plates}:${setting}`, (img, lo) => drawTable(img, lo, style, plates, setting));
    pieces.push(piece(o, `table${slot.x},${slot.y}`, table, slot.x, slot.y, 0, slot.x + slot.y + TABLE));
    // The guests, each on their chair.
    if (guests && seated > 0) {
      around.slice(0, seated).forEach((seat, i) => {
        const image = personImage(guestKind(guests, i), seat.facing, 'sit', tableIndex * 4 + i);
        const p = piece(o, `guest${slot.x},${slot.y},${i}`, image, seat.x, seat.y, SEAT_Z, seatDepth(seat));
        // Only the first sitter carries the table's bubble.
        pieces.push(i === 0 ? { ...p, guests, kind: 'guest', table: tableIndex } : p);
      });
    }
  };

  layout.inside.slice(0, floor.insideTables).forEach((slot, i) => addTable(slot, floor.tables[i], false, i));
  layout.terrace.forEach((slot, i) =>
    addTable(slot, floor.tables[floor.insideTables + i] ?? null, true, floor.insideTables + i),
  );

  pieces.push(...buildingPieces(layout, floor), ...streetPieces(layout, look, floor.location));

  // The kitchen: chefs behind the island, a pot each, the pizza oven at the side.
  const k = layout.kitchenX;
  const chefs = floor.chefsBusy.length;
  const island = drawn(`island:${layout.roomX}:${chefs}`, (img, lo) => {
    const x1 = layout.roomX - 4 - (k + 16);
    texturedBox(img, lo, { x0: 1, x1: x1 - 1, y0: 1, y1: 9, z0: 0, z1: 13 }, (face, u, v) => drawers(face, u, v));
    box(img, lo, { x0: 0, x1, y0: 0, y1: 10, z0: 13, z1: 15 }, steel);
    box(img, lo, { x0: 3, x1: x1 - 3, y0: 2, y1: 8, z0: 15, z1: 15.5 }, solid(C.stove));
    chefSpots(layout, chefs).forEach((cx) => box(img, lo, { x0: cx - (k + 16) - 2, x1: cx - (k + 16) + 3, y0: 3, y1: 7, z0: 15.5, z1: 20 }, steel));
  });
  floor.chefsBusy.forEach((busy, i) => {
    const cx = chefSpots(layout, chefs)[i];
    const chef = personImage('chef', 'front', 'stand', floor.chefLooks[i] ?? i);
    pieces.push({ ...piece(o, `chef${i}`, chef, cx, 18, 0, k + 20 + i * 0.01), kind: 'chef', busy });
    if (busy) {
      const steam = plainSprite('steam', S.STEAM, S.STEAM_COLOURS);
      pieces.push({ ...piece(o, `steam${i}`, steam, cx + 1, 31, 26, 999), kind: 'steam' });
      // A flame flickering under the pot, just in front of the island's top.
      const flame = plainSprite('flame', S.FLAME, S.FLAME_COLOURS);
      pieces.push({ ...piece(o, `flame${i}`, flame, cx + 1, 33.5, 15.5, k + 16 + 36 + 7), kind: 'flame' });
    }
  });
  pieces.push(piece(o, 'island', island, k + 16, 26, 0, k + 16 + 36 + 6));
  if (look.equipment.includes('pizzaOven')) {
    const oven = drawn('pizzaOven', (img, lo) => {
      box(img, lo, { x0: 0, x1: 12, y0: 0, y1: 12, z0: 0, z1: 8 }, { top: C.brick, left: C.brick, right: C.brickDark });
      box(img, lo, { x0: 1, x1: 11, y0: 1, y1: 11, z0: 8, z1: 16 }, { top: C.brick, left: C.brick, right: C.brickDark });
      box(img, lo, { x0: 3, x1: 9, y0: 3, y1: 9, z0: 16, z1: 20 }, { top: C.brickDark, left: C.brick, right: C.brickDark });
      box(img, lo, { x0: 4, x1: 8, y0: 11, y1: 11.4, z0: 9, z1: 13 }, solid(C.stove));
      box(img, lo, { x0: 5, x1: 7, y0: 11.4, y1: 11.6, z0: 9.5, z1: 11 }, solid(hex('#ffcf4a')));
    });
    pieces.push(piece(o, 'pizzaOven', oven, k + 1, 30, 0, k + 1 + 30 + 12));
  }

  // Waiters wait by the kitchen: Tomek and Adrian look like themselves.
  floor.waiters.forEach((special, i) => {
    if (busyWaiters.has(i)) return;
    const spot = waiterSpot(layout, i);
    const waiter = personImage(special ?? 'waiter', 'front', 'stand', floor.waiterLooks[i] ?? i);
    pieces.push(piece(o, `waiter${i}`, waiter, spot.x, spot.y, 0, depthAt(spot)));
  });

  // Order tickets waiting on the rail.
  for (let i = 0; i < Math.min(8, floor.ordersWaiting); i++) {
    // On the wall, so behind everyone in the kitchen.
    pieces.push(piece(o, `ticket${i}`, plainSprite('ticket', S.TICKET, S.TICKET_COLOURS), k + 5 + i * 5, 0, 32, -1));
  }

  // Lamps hang above everything else, on cords from the ceiling.
  for (const lamp of lampSpots(layout, look)) {
    const rows = lamp.kind === 'chandelier' ? S.CHANDELIER : lamp.kind === 'lantern' ? S.LANTERN : S.LAMP;
    const palette = lamp.kind === 'chandelier' ? S.CHANDELIER_COLOURS : lamp.kind === 'lantern' ? S.LANTERN_COLOURS : S.LAMP_COLOURS;
    const image = plainSprite(`lamp:${lamp.kind}`, rows, palette);
    const p = piece(o, `lamp${lamp.x},${lamp.y}`, image, lamp.x, lamp.y, lamp.z, 1000);
    const ceiling = Math.round(project(o, lamp.x, lamp.y, WALL_HEIGHT + 6).sy);
    pieces.push(p, cord(p, ceiling));
  }

  return pieces.sort((a, b) => a.depth - b.depth);
}

/** Chair boxes are drawn around the table's corner, so they line up with the table sprite. */
function shiftSeat(seat: Seat, slot: Slot): Seat {
  const move = ([a, b, c, d]: [number, number, number, number]): [number, number, number, number] => [a - slot.x, b - slot.x, c - slot.y, d - slot.y];
  return { ...seat, chair: { seat: move(seat.chair.seat), back: move(seat.chair.back) } };
}

function seatDepth(seat: Seat): number {
  return seat.x + seat.y;
}

/** Where each chef stands along the island. */
function chefSpots(layout: RoomLayout, chefs: number): number[] {
  const from = layout.kitchenX + 18;
  const to = layout.roomX - 8;
  return Array.from({ length: chefs }, (_, i) => Math.round((from + ((to - from) * (i + 1)) / (chefs + 1)) / 2) * 2);
}

/** A thin cord from the ceiling down to a hanging lamp. */
function cord(lamp: ScenePiece, ceiling: number): ScenePiece {
  const height = Math.max(1, lamp.py - ceiling);
  const key = `cord:${height}`;
  let image = spriteCache.get(key);
  if (!image) {
    const pixels = new Pixels(1, height);
    for (let y = 0; y < height; y++) pixels.set(0, y, C.outline);
    image = { pixels, dx: 0, dy: 0 };
    spriteCache.set(key, image);
  }
  return {
    key: `${lamp.key}:cord`,
    image,
    px: lamp.px + Math.floor(lamp.image.pixels.width / 2),
    py: ceiling,
    depth: lamp.depth,
  };
}

// ---------- Walking in and out ----------

export interface Point {
  x: number;
  y: number;
  /** Height above the floor; the street is below it. */
  z?: number;
}

/**
 * A party walking from one table to another: back towards the door the way they came in,
 * then on to the new table the way new guests do.
 */
export function movePath(layout: RoomLayout, insideTables: number, from: number, fromSeat: Point, to: number, toSeat: Point): Point[] {
  const out = [...walkPath(layout, insideTables, from, fromSeat)].reverse();
  const into = walkPath(layout, insideTables, to, toSeat);
  if (out.length < 3 || into.length < 4) return [];
  // Both routes pass the top of the steps: the third point in, the third from the end out.
  return [...out.slice(0, out.length - 2), ...into.slice(3)];
}

/** A gull, for the terrace: the same herring gull as Mewa. */
export function gullImage(): SpriteImage {
  return plainSprite('gull', S.MEWA, S.MEWA_COLOURS);
}

/** The middle of a table's top, or null if there's no such table. */
export function tableMiddle(layout: RoomLayout, insideTables: number, table: number): Point | null {
  const found = slotOf(layout, insideTables, table);
  return found ? { x: found.slot.x + TABLE / 2, y: found.slot.y + TABLE / 2 } : null;
}

/** The table spot for table number `table` (inside tables first, then the terrace). */
function slotOf(layout: RoomLayout, insideTables: number, table: number): { slot: Slot; outdoor: boolean } | null {
  if (table < insideTables) return layout.inside[table] ? { slot: layout.inside[table], outdoor: false } : null;
  const slot = layout.terrace[table - insideTables];
  return slot ? { slot, outdoor: true } : null;
}

/** Where each guest of a table sits, and which way they face. */
export function seatsAt(layout: RoomLayout, insideTables: number, table: number): (Point & { facing: Facing })[] {
  const found = slotOf(layout, insideTables, table);
  return found ? seats(found.slot).map(({ x, y, facing }) => ({ x, y, facing })) : [];
}

/**
 * The way from the street to a seat. Inside guests come through the front door, down the
 * entrance to the gap in front of the tables, along it, and then down the aisle beside their
 * table. Terrace guests come straight in from the street.
 */
/** The foot of the steps up to the front door, on the street. */
export function stepsFoot(layout: RoomLayout): Point {
  return { x: (layout.door.x0 + layout.door.x1) / 2, y: layout.streetY, z: -PLINTH };
}

/**
 * From somewhere on the street to the foot of the steps (someone who took a flyer). From a side
 * street they keep to the way people walk: along it to the corner, down to the front, and along to
 * the steps, round the building and clear of the benches and trees.
 */
export function toSteps(layout: RoomLayout, at: Point): Point[] {
  const foot = stepsFoot(layout);
  const front = layout.streetY + 6;
  if (at.y >= front) return [at, foot];
  // The side streets people walk down, as in passerByPath: just left of the building, or just right of it.
  const corner = at.x < 0 ? Math.max(at.x, -12) : Math.min(at.x, layout.edgeX + 12);
  const z = -PLINTH;
  const path = [at, { x: corner, y: at.y, z }, { x: corner, y: front, z }, foot];
  // Someone already at the corner doesn't need to walk to it.
  return path.filter((p, i) => i === 0 || p.x !== path[i - 1].x || p.y !== path[i - 1].y);
}

export function walkPath(layout: RoomLayout, insideTables: number, table: number, seat: Point): Point[] {
  const found = slotOf(layout, insideTables, table);
  if (!found) return [];
  const foot = stepsFoot(layout);
  const door = foot.x;
  // Along the street from one side or the other, up the steps, and in.
  const fromLeft = Math.round(seat.x + seat.y) % 2 === 0;
  const along = { x: door + (fromLeft ? -30 : 30), y: layout.streetY, z: -PLINTH };
  const top = { x: door, y: layout.edgeY - 5, z: 0 };
  const aisle = found.slot.x - 5;
  const end = { x: seat.x, y: seat.y };
  if (found.outdoor) {
    return [along, foot, top, { x: aisle, y: top.y }, { x: aisle, y: seat.y }, end];
  }
  const inside = layout.roomY - 5;
  return [along, foot, top, { x: door, y: inside }, { x: aisle, y: inside }, { x: aisle, y: seat.y }, end];
}

export function depthAt(point: Point): number {
  return point.x + point.y;
}

/**
 * Where waiter number `index` waits: in a row along the back of the room, next to the kitchen,
 * behind the first tables, so their chairs never hide anyone.
 */
export function waiterSpot(layout: RoomLayout, index: number): Point {
  return { x: layout.kitchenX - 8 - index * 10, y: 24 };
}

/**
 * A waiter's way from their spot by the kitchen to the side of a table: a step forward into the gap
 * between the back of the room and the first tables, along it, then down the aisle.
 */
export function servePath(layout: RoomLayout, insideTables: number, table: number, waiter: number): Point[] {
  const found = slotOf(layout, insideTables, table);
  if (!found) return [];
  const start = waiterSpot(layout, waiter);
  // In front of anything along the back wall (the communal table), behind the first row's chairs.
  const lane = layout.inside[0].y - 20;
  const aisle = found.slot.x - 5;
  return [start, { x: start.x, y: lane }, { x: aisle, y: lane }, { x: aisle, y: found.slot.y + TABLE / 2 }];
}

// ---------- The building: low walls, the przedproże balustrade, the queue at the door ----------

/** Splits a run from `from` to `to` into pieces no longer than `most`, so each can stack on its own. */
function runs(from: number, to: number, most = 16): [number, number][] {
  const result: [number, number][] = [];
  for (let a = from; a < to; a += most) result.push([a, Math.min(to, a + most)]);
  return result;
}

function buildingPieces(layout: RoomLayout, floor: FloorView): ScenePiece[] {
  const o = layout.origin;
  const pieces: ScenePiece[] = [];
  const { roomX, roomY, edgeX, edgeY } = layout;
  const { thick, high } = LOW_WALL;
  const { x0: d0, x1: d1 } = layout.door;
  const plaster: Faces = { top: C.trim, left: C.plaster, right: C.plasterShade };

  // The front wall, cut away at knee height, with the door opening onto the street.
  for (const [a, b] of [...runs(0, d0), ...runs(d1, edgeX)]) {
    const image = drawn(`wall:front:${b - a}`, (img, lo) => {
      box(img, lo, { x0: 0, x1: b - a, y0: 0, y1: thick, z0: 0, z1: high - 1 }, plaster);
      box(img, lo, { x0: 0, x1: b - a, y0: 0, y1: thick, z0: high - 1, z1: high }, { top: C.trim, left: C.trimDark, right: C.trimDark });
    });
    pieces.push(piece(o, `wall:front:${a}`, image, a, roomY, 0, (a + b) / 2 + roomY + thick));
  }
  // The side wall, the same.
  for (const [a, b] of runs(0, roomY)) {
    const image = drawn(`wall:side:${b - a}`, (img, lo) => {
      box(img, lo, { x0: 0, x1: thick, y0: 0, y1: b - a, z0: 0, z1: high - 1 }, plaster);
      box(img, lo, { x0: 0, x1: thick, y0: 0, y1: b - a, z0: high - 1, z1: high }, { top: C.trim, left: C.trimDark, right: C.trimDark });
    });
    pieces.push(piece(o, `wall:side:${a}`, image, roomX, a, 0, roomX + thick + (a + b) / 2));
  }

  // The przedproże's stone balustrade: along the front (with a gap for the steps) and down the side.
  if (layout.terraceDepth > 0) {
    const stone: Faces = { top: C.sandstone, left: C.sandstoneShade, right: C.sandstoneDark };
    const rail = (along: 'x' | 'y', length: number) =>
      drawn(`balustrade:${along}:${length}`, (img, lo) => {
        const span = (a: number, b: number, z0: number, z1: number) =>
          along === 'x' ? { x0: a, x1: b, y0: 0, y1: 2, z0, z1 } : { x0: 0, x1: 2, y0: a, y1: b, z0, z1 };
        box(img, lo, span(0, length, 0, 1.5), stone);
        for (let u = 2; u < length - 1; u += 3) box(img, lo, span(u, u + 1, 1.5, 7), stone);
        box(img, lo, span(0, 2, 0, 9), stone);
        box(img, lo, span(length - 2, length, 0, 9), stone);
        box(img, lo, span(0, length, 7, 8.5), stone);
      });
    for (const [a, b] of [...runs(0, d0), ...runs(d1, edgeX)]) {
      pieces.push(piece(o, `balustrade:front:${a}`, rail('x', b - a), a, edgeY - 2, 0, (a + b) / 2 + edgeY));
    }
    for (const [a, b] of runs(roomY + thick, edgeY - 2)) {
      pieces.push(piece(o, `balustrade:side:${a}`, rail('y', b - a), edgeX - 2, a, 0, edgeX + (a + b) / 2));
    }
  }

  // People waiting for a table queue on the street, in a line beside the steps, the first in line wearing ⏳.
  const waiting = floor.atTheDoor.flatMap((party, p) => Array.from({ length: party.size }, (_, i) => ({ group: party.group, p, i })));
  waiting.slice(0, 8).forEach(({ group, p, i }, n) => {
    const image = personImage(group, 'back', 'stand', p * 4 + i);
    const spot = queueSpot(layout, n);
    const placed = piece(o, `queue${n}`, image, spot.x, spot.y, spot.z ?? 0, spot.x + spot.y);
    pieces.push(n === 0 ? { ...placed, kind: 'queue' } : placed);
  });
  return pieces;
}

// ---------- Street life: lanterns, benches, trees, flower tubs, cafés, bikes, pigeons, the amber stall ----------

export type StreetThing =
  | 'lamp'
  | 'bench'
  | 'tree'
  | 'tub'
  | 'menuBoard'
  | 'cafe'
  | 'cafeRed'
  | 'bike'
  | 'pigeons'
  | 'amberStall'
  | 'musician'
  | 'cat'
  | 'barrels'
  | 'przedproze'
  | 'neptune'
  | 'bollard'
  | 'gull'
  | 'boat'
  | 'galleon';

/** How far each thing reaches from where it stands, so routes keep clear of it. */
export const STREET_THING_REACH: Record<StreetThing, number> = {
  lamp: 3,
  bench: 3,
  tree: 3,
  tub: 3,
  menuBoard: 3,
  cafe: 5,
  cafeRed: 5,
  bike: 6,
  pigeons: 4,
  amberStall: 12,
  musician: 3,
  cat: 2,
  barrels: 5,
  przedproze: 5.5,
  neptune: 12,
  bollard: 2,
  gull: 2,
  boat: 8,
  galleon: 18,
};

/** What stands in each of the free spots along a street; the lamps, the square's trees and the menu board are always there. */
interface StreetPlan {
  /** The pavement on the right, along the houses behind (five spots). */
  right: StreetThing[];
  /** The little square to the right of the restaurant (three spots). */
  square: StreetThing[];
  /** The pavement on the left, in front of next door (five spots). */
  left: StreetThing[];
  /** Across the street, on the left (three spots). */
  across: StreetThing[];
}

const STREET_PLANS: Record<LocationId, StreetPlan> = {
  // Quiet: trees, benches, flower tubs, and the cat who visits every windowsill.
  ogarna: {
    right: ['tree', 'bench', 'tub', 'bike', 'tree'],
    square: ['pigeons', 'tree', 'bench'],
    left: ['bench', 'tree', 'tub', 'cat', 'tree'],
    across: ['tree', 'lamp', 'bench'],
  },
  // Beer Street: barrel tables outside the pubs, and a musician.
  piwna: {
    right: ['barrels', 'barrels', 'tub', 'bike', 'tree'],
    square: ['pigeons', 'barrels', 'musician'],
    left: ['barrels', 'tree', 'tub', 'bike', 'tree'],
    across: ['tree', 'lamp', 'bench'],
  },
  // Stone terraces with gargoyles in front of the houses, amber everywhere.
  mariacka: {
    right: ['przedproze', 'przedproze', 'tub', 'tub', 'przedproze'],
    square: ['pigeons', 'amberStall', 'musician'],
    left: ['przedproze', 'przedproze', 'tub', 'tub', 'tree'],
    across: ['tree', 'lamp', 'bench'],
  },
  // The Royal Way: cafés all along, and the Neptune Fountain on the square.
  dluga: {
    right: ['cafe', 'cafeRed', 'tub', 'bike', 'cafe'],
    square: ['pigeons', 'neptune', 'musician'],
    left: ['cafeRed', 'cafe', 'tub', 'bike', 'tree'],
    across: ['tree', 'lamp', 'bench'],
  },
  // The waterfront: riverside cafés, an amber stall for the tourists, bollards and boats on the Motława.
  pobrzeze: {
    right: ['cafe', 'cafeRed', 'tub', 'bike', 'tree'],
    square: ['pigeons', 'amberStall', 'musician'],
    left: ['cafe', 'tree', 'tub', 'bike', 'tree'],
    across: ['bollard', 'lamp', 'bench'],
  },
  // Granary Island: a café, rows of bikes, young trees.
  spichrzow: {
    right: ['cafe', 'bike', 'bike', 'bike', 'tree'],
    square: ['pigeons', 'tree', 'bench'],
    left: ['cafe', 'tree', 'tub', 'bike', 'tree'],
    across: ['tree', 'lamp', 'bench'],
  },
};

/** Things that sit a little further from the house fronts, because they're deeper. */
const DEEP: StreetThing[] = ['cafe', 'cafeRed', 'barrels', 'przedproze'];

/**
 * Where the street furniture stands: on the pavements beside the restaurant and on the open
 * cobbles to either side, never in front of the room and never on the way in. Each street has
 * its own (STREET_PLANS); on Długie Pobrzeże, boats float on the river beyond the quay.
 */
export function streetFurniture(layout: RoomLayout, location: LocationId = 'ogarna'): { thing: StreetThing; x: number; y: number }[] {
  const { edgeX, edgeY, streetY } = layout;
  const frontY = layout.roomY + LOW_WALL.thick;
  const { x1: d1 } = layout.door;
  const plan = STREET_PLANS[location];
  const pavement = (thing: StreetThing) => (DEEP.includes(thing) ? 7 : 4);
  const things: { thing: StreetThing; x: number; y: number }[] = [
    { thing: 'lamp', x: edgeX + 12, y: 8 },
    { thing: 'lamp', x: edgeX + 96, y: 8 },
    { thing: 'tree', x: edgeX + 36, y: 44 },
    { thing: 'bench', x: edgeX + 30, y: 60 },
    { thing: 'tree', x: edgeX + 70, y: 76 },
    { thing: 'lamp', x: edgeX + 56, y: 52 },
    { thing: 'lamp', x: -14, y: frontY + 8 },
    { thing: 'lamp', x: -116, y: frontY + 8 },
    // The menu board at the foot of the steps.
    { thing: 'menuBoard', x: d1 + 3, y: edgeY + 4 },
  ];
  [31, 51, 68, 82, 118].forEach((dx, i) => things.push({ thing: plan.right[i], x: edgeX + dx, y: pavement(plan.right[i]) }));
  // The square: something small near the bench, something big at the back, someone standing.
  [[46, 88], [94, 34], [96, 62]].forEach(([dx, y], i) => things.push({ thing: plan.square[i], x: edgeX + dx, y }));
  [-40, -66, -86, -100, -140].forEach((x, i) => things.push({ thing: plan.left[i], x, y: frontY + pavement(plan.left[i]) }));
  [[-40, 22], [-70, 18], [-104, 20]].forEach(([x, dy], i) => things.push({ thing: plan.across[i], x, y: streetY + dy }));
  if (location === 'pobrzeze') {
    // More bollards along the quay (a gull on one), and boats on the Motława.
    things.push(
      { thing: 'bollard', x: -150, y: streetY + 25 },
      { thing: 'gull', x: edgeX + 40, y: streetY + 25 },
      { thing: 'bollard', x: edgeX + 110, y: streetY + 25 },
      { thing: 'galleon', x: -70, y: streetY + 62 },
      { thing: 'boat', x: edgeX + 70, y: streetY + 46 },
      { thing: 'boat', x: -190, y: streetY + 44 },
    );
  }
  return things;
}

function streetThing(thing: StreetThing, lit: boolean): SpriteImage {
  const big = thing === 'galleon' || thing === 'neptune';
  return drawn(`street:${thing}:${lit}`, (img, lo) => {
    const iron: Faces = { top: C.ironLight, left: C.iron, right: C.iron };
    switch (thing) {
      case 'lamp': {
        // A black double-headed Gdańsk lantern: one post, a crossbar, a lantern at each end, lit after dusk.
        box(img, lo, { x0: -1.5, x1: 1.5, y0: -1.5, y1: 1.5, z0: 0, z1: 3 }, iron);
        box(img, lo, { x0: -0.5, x1: 0.5, y0: -0.5, y1: 0.5, z0: 3, z1: 30 }, iron);
        box(img, lo, { x0: -5, x1: 5, y0: -0.5, y1: 0.5, z0: 26, z1: 27 }, iron);
        const glass = lit ? solid(C.lit) : { top: C.glass, left: C.glass, right: mix(C.glass, C.steelLeft, 0.4) };
        for (const x of [-4.5, 4.5]) {
          box(img, lo, { x0: x - 0.5, x1: x + 0.5, y0: -0.5, y1: 0.5, z0: 27, z1: 28 }, iron);
          box(img, lo, { x0: x - 1.3, x1: x + 1.3, y0: -1.3, y1: 1.3, z0: 28, z1: 32 }, glass);
          box(img, lo, { x0: x - 1.7, x1: x + 1.7, y0: -1.7, y1: 1.7, z0: 32, z1: 33 }, iron);
          box(img, lo, { x0: x - 0.4, x1: x + 0.4, y0: -0.4, y1: 0.4, z0: 33, z1: 34.5 }, iron);
        }
        box(img, lo, { x0: -0.6, x1: 0.6, y0: -0.6, y1: 0.6, z0: 30, z1: 31.5 }, solid(C.gold));
        return;
      }
      case 'cafe':
      case 'cafeRed': {
        // A café table with two bistro chairs under a square umbrella with a striped valance.
        const cloth = thing === 'cafeRed' ? C.clothEdge : C.bistro;
        const canopy: Faces = { top: cloth, left: mix(cloth, C.outline, 0.15), right: mix(cloth, C.outline, 0.3) };
        for (const x of [-3.5, 2.5]) {
          box(img, lo, { x0: x, x1: x + 1.5, y0: -0.75, y1: 0.75, z0: 0, z1: 3 }, iron);
          box(img, lo, { x0: x, x1: x + 1.5, y0: -0.75, y1: 0.75, z0: 3, z1: 3.6 }, iron);
        }
        box(img, lo, { x0: -1.5, x1: -1, y0: -0.75, y1: 0.75, z0: 3.6, z1: 7 }, iron);
        box(img, lo, { x0: 1, x1: 1.5, y0: -0.75, y1: 0.75, z0: 3.6, z1: 7 }, iron);
        box(img, lo, { x0: -0.4, x1: 0.4, y0: -0.4, y1: 0.4, z0: 0, z1: 5 }, iron);
        box(img, lo, { x0: -1.8, x1: 1.8, y0: -1.8, y1: 1.8, z0: 5, z1: 5.6 }, solid(C.cloth));
        box(img, lo, { x0: -0.3, x1: 0.3, y0: -0.3, y1: 0.3, z0: 5.6, z1: 7 }, solid(C.glow));
        box(img, lo, { x0: -0.3, x1: 0.3, y0: -0.3, y1: 0.3, z0: 5.6, z1: 19 }, { top: C.trim, left: C.trim, right: C.trimDark });
        box(img, lo, { x0: -5, x1: 5, y0: -5, y1: 5, z0: 19, z1: 20 }, canopy);
        box(img, lo, { x0: -3.5, x1: 3.5, y0: -3.5, y1: 3.5, z0: 20, z1: 21 }, canopy);
        for (let k = -5; k < 5; k += 2) {
          box(img, lo, { x0: k, x1: k + 1, y0: 4.6, y1: 5, z0: 17.8, z1: 19 }, solid(C.cloth));
          box(img, lo, { x0: 4.6, x1: 5, y0: k, y1: k + 1, z0: 17.8, z1: 19 }, solid(C.cloth));
        }
        return;
      }
      case 'bike': {
        // A city bike on its stand, with a basket.
        const frame = solid(hex('#2f7a8a'));
        for (const cx of [-4.5, 4.5]) {
          for (let a = 0; a < 24; a++) {
            const t = (a / 24) * Math.PI * 2;
            const x = cx + Math.cos(t) * 3.4;
            const z = 3.6 + Math.sin(t) * 3.4;
            box(img, lo, { x0: x - 0.25, x1: x + 0.25, y0: -0.25, y1: 0.25, z0: z - 0.25, z1: z + 0.25 }, solid(C.ironLight));
          }
        }
        for (let k = 0; k <= 8; k++) {
          const t = k / 8;
          // Rear wheel to the seat, seat to the handlebars, handlebars down to the front wheel.
          for (const [x0, z0, x1, z1] of [[-4.5, 3.6, -1.5, 8.5], [-1.5, 8.5, 3.2, 8.5], [3.4, 9.6, 4.5, 3.6], [-4.5, 3.6, 0.5, 3.6], [0.5, 3.6, -1.5, 8.5], [0.5, 3.6, 3.2, 8.5]]) {
            const x = x0 + (x1 - x0) * t;
            const z = z0 + (z1 - z0) * t;
            box(img, lo, { x0: x - 0.35, x1: x + 0.35, y0: -0.35, y1: 0.35, z0: z - 0.35, z1: z + 0.35 }, frame);
          }
        }
        box(img, lo, { x0: -2.6, x1: -0.6, y0: -0.6, y1: 0.6, z0: 8.8, z1: 9.4 }, solid(C.chairDark));
        box(img, lo, { x0: 3, x1: 3.6, y0: -1.8, y1: 1.8, z0: 9.6, z1: 10.1 }, solid(C.iron));
        box(img, lo, { x0: 4, x1: 6.4, y0: -1.1, y1: 1.1, z0: 7.4, z1: 9.6 }, { top: C.chair, left: C.chair, right: C.chairDark });
        return;
      }
      case 'pigeons': {
        // A few grey pigeons pecking at crumbs.
        const grey: Faces = { top: hex('#b7bcc6'), left: hex('#9aa0ab'), right: hex('#7f8590') };
        for (const [x, y, flip] of [[-2.5, -1, 0], [1.5, 1.5, 1], [3, -2.5, 0]]) {
          box(img, lo, { x0: x, x1: x + 2.6, y0: y, y1: y + 1.4, z0: 0.6, z1: 2 }, grey);
          const hx = flip ? x - 0.6 : x + 2.2;
          box(img, lo, { x0: hx, x1: hx + 1, y0: y + 0.2, y1: y + 1.2, z0: 1.6, z1: 2.8 }, solid(hex('#6f8a86')));
          box(img, lo, { x0: x + 0.6, x1: x + 1.6, y0: y + 0.3, y1: y + 1.1, z0: 0, z1: 0.6 }, solid(hex('#c9704a')));
        }
        return;
      }
      case 'amberStall': {
        // A market stall selling Baltic amber, under a red-and-white striped roof.
        const counter: Faces = { top: hex('#2f3f5e'), left: C.tableLeft, right: C.tableRight };
        box(img, lo, { x0: -8, x1: 8, y0: -3, y1: 3, z0: 0, z1: 7 }, counter);
        const amber = [hex('#e9a23b'), hex('#d97a1e'), hex('#f4c531'), hex('#b8561a')];
        for (let k = 0; k < 10; k++) {
          const x = -7 + (k % 5) * 3;
          const y = -2 + Math.floor(k / 5) * 2.5;
          box(img, lo, { x0: x, x1: x + 1.4, y0: y, y1: y + 1.2, z0: 7, z1: 7.8 }, solid(amber[k % 4]));
        }
        for (const [x, y] of [[-8, -3], [7.4, -3], [-8, 2.4], [7.4, 2.4]]) {
          box(img, lo, { x0: x, x1: x + 0.6, y0: y, y1: y + 0.6, z0: 7, z1: 19 }, iron);
        }
        for (let k = -9; k < 9; k += 2) {
          box(img, lo, { x0: k, x1: k + 2, y0: -4, y1: 4, z0: 19, z1: 20 }, solid(Math.floor((k + 9) / 2) % 2 === 0 ? C.clothEdge : C.cloth));
        }
        return;
      }
      case 'cat': {
        // A ginger cat sitting on the pavement, tail curled round.
        const fur: Faces = { top: hex('#e9a23b'), left: hex('#d98b2b'), right: hex('#b8701e') };
        box(img, lo, { x0: -1.5, x1: 1.5, y0: -1, y1: 1, z0: 0, z1: 3.5 }, fur);
        box(img, lo, { x0: -1.2, x1: 1.2, y0: -0.6, y1: 1, z0: 3.5, z1: 5.5 }, fur);
        box(img, lo, { x0: -1.2, x1: -0.6, y0: 0, y1: 0.6, z0: 5.5, z1: 6.3 }, fur);
        box(img, lo, { x0: 0.6, x1: 1.2, y0: 0, y1: 0.6, z0: 5.5, z1: 6.3 }, fur);
        box(img, lo, { x0: 1.5, x1: 3.5, y0: 0, y1: 0.8, z0: 0, z1: 0.8 }, fur);
        return;
      }
      case 'barrels': {
        // A beer barrel as a standing table, with two stools and a glass of beer on top.
        const oak: Faces = { top: hex('#a0663a'), left: hex('#8a5233'), right: hex('#6b3d24') };
        box(img, lo, { x0: -2, x1: 2, y0: -2, y1: 2, z0: 0, z1: 9 }, oak);
        for (const z of [1.5, 7]) box(img, lo, { x0: -2.1, x1: 2.1, y0: -2.1, y1: 2.1, z0: z, z1: z + 0.6 }, iron);
        box(img, lo, { x0: -0.5, x1: 0.5, y0: -0.5, y1: 0.5, z0: 9, z1: 10.6 }, solid(hex('#e9b23b')));
        box(img, lo, { x0: -0.5, x1: 0.5, y0: -0.5, y1: 0.5, z0: 10.6, z1: 11.2 }, solid(C.cloth));
        for (const x of [-4.5, 3.5]) {
          box(img, lo, { x0: x, x1: x + 1, y0: -0.5, y1: 0.5, z0: 0, z1: 5 }, oak);
          box(img, lo, { x0: x - 0.4, x1: x + 1.4, y0: -0.9, y1: 0.9, z0: 5, z1: 5.6 }, oak);
        }
        return;
      }
      case 'przedproze': {
        // A Mariacka terrace: a raised stone platform with a carved balustrade and a gargoyle.
        const stone: Faces = { top: C.sandstone, left: C.sandstoneShade, right: C.sandstoneDark };
        box(img, lo, { x0: -5, x1: 5, y0: -3.5, y1: 3.5, z0: 0, z1: 3 }, stone);
        for (let x = -5; x < 5; x += 2) box(img, lo, { x0: x, x1: x + 0.8, y0: 2.8, y1: 3.5, z0: 3, z1: 6 }, stone);
        box(img, lo, { x0: -5, x1: 5, y0: 2.7, y1: 3.5, z0: 6, z1: 6.8 }, stone);
        box(img, lo, { x0: -5, x1: -4, y0: -3.5, y1: 3.5, z0: 3, z1: 7.5 }, stone);
        box(img, lo, { x0: 4, x1: 5, y0: -3.5, y1: 3.5, z0: 3, z1: 7.5 }, stone);
        // The gargoyle: a stone dragon's head sticking out at the corner, mouth open.
        const grey: Faces = { top: hex('#9a948a'), left: hex('#7f796f'), right: hex('#68625a') };
        box(img, lo, { x0: 5, x1: 7.5, y0: 2, y1: 3.4, z0: 1.4, z1: 2.8 }, grey);
        box(img, lo, { x0: 7, x1: 7.6, y0: 2.3, y1: 3.1, z0: 1.4, z1: 1.9 }, solid(C.outline));
        box(img, lo, { x0: -1.5, x1: 1.5, y0: -2, y1: 1, z0: 3, z1: 5 }, { top: C.terracottaDark, left: C.terracotta, right: C.terracottaDark });
        for (let f = 0; f < 3; f++) box(img, lo, { x0: -1.2 + f, x1: -0.4 + f, y0: -1.2, y1: -0.4, z0: 5, z1: 6 }, solid(C.flowers[f]));
        return;
      }
      case 'neptune': {
        // The Neptune Fountain: a basin behind an iron railing, and the bronze god with his golden trident.
        const stone: Faces = { top: C.sandstone, left: C.sandstoneShade, right: C.sandstoneDark };
        box(img, lo, { x0: -9, x1: 9, y0: -9, y1: 9, z0: 0, z1: 3 }, stone);
        box(img, lo, { x0: -8, x1: 8, y0: -8, y1: 8, z0: 3, z1: 3.2 }, solid(hex('#6fb0d0')));
        for (let k = -9; k <= 9; k += 3) {
          for (const [x, y] of [[k, 9], [9, k]]) {
            box(img, lo, { x0: x - 0.3, x1: x + 0.3, y0: y - 0.3, y1: y + 0.3, z0: 3, z1: 6.5 }, iron);
            box(img, lo, { x0: x - 0.3, x1: x + 0.3, y0: y - 0.3, y1: y + 0.3, z0: 6.5, z1: 7.2 }, solid(C.gold));
          }
        }
        box(img, lo, { x0: -9, x1: 9, y0: 8.8, y1: 9.2, z0: 5.5, z1: 6 }, iron);
        box(img, lo, { x0: 8.8, x1: 9.2, y0: -9, y1: 9, z0: 5.5, z1: 6 }, iron);
        box(img, lo, { x0: -2.5, x1: 2.5, y0: -2.5, y1: 2.5, z0: 3, z1: 12 }, stone);
        box(img, lo, { x0: -3, x1: 3, y0: -3, y1: 3, z0: 12, z1: 13 }, stone);
        const bronze: Faces = { top: hex('#5f7a5a'), left: hex('#4a6247'), right: hex('#3a4d38') };
        box(img, lo, { x0: -1.2, x1: 1.2, y0: -1, y1: 1, z0: 13, z1: 22 }, bronze);
        box(img, lo, { x0: -0.8, x1: 0.8, y0: -0.8, y1: 0.8, z0: 22, z1: 24.5 }, bronze);
        box(img, lo, { x0: 1.2, x1: 3, y0: -0.4, y1: 0.4, z0: 19, z1: 19.8 }, bronze);
        box(img, lo, { x0: 2.6, x1: 3.2, y0: -0.3, y1: 0.3, z0: 13, z1: 29 }, solid(C.gold));
        for (const x of [1.8, 2.6, 3.4]) box(img, lo, { x0: x, x1: x + 0.5, y0: -0.3, y1: 0.3, z0: 29, z1: 31 }, solid(C.gold));
        box(img, lo, { x0: 1.8, x1: 3.9, y0: -0.3, y1: 0.3, z0: 28.6, z1: 29.2 }, solid(C.gold));
        // Water spouting into the basin.
        for (const [x, y] of [[-2.8, 0], [0, -2.8]]) box(img, lo, { x0: x - 0.3, x1: x + 0.3, y0: y - 0.3, y1: y + 0.3, z0: 3.2, z1: 8 }, solid(hex('#d6ecf5')));
        return;
      }
      case 'bollard':
      case 'gull': {
        // An iron mooring bollard on the quay (with a gull on it, sometimes).
        box(img, lo, { x0: -1.2, x1: 1.2, y0: -1.2, y1: 1.2, z0: 0, z1: 3.5 }, iron);
        box(img, lo, { x0: -1.6, x1: 1.6, y0: -1.6, y1: 1.6, z0: 3.5, z1: 4.3 }, iron);
        return;
      }
      case 'boat': {
        // A little white motorboat.
        const hull: Faces = { top: C.cloth, left: hex('#efe9df'), right: hex('#cfc6b8') };
        box(img, lo, { x0: -7, x1: 6, y0: -2.5, y1: 2.5, z0: 0, z1: 2.5 }, hull);
        box(img, lo, { x0: -7, x1: 6, y0: -2.5, y1: 2.5, z0: 0, z1: 0.8 }, solid(hex('#2f5f86')));
        box(img, lo, { x0: -4, x1: 0, y0: -1.8, y1: 1.8, z0: 2.5, z1: 5 }, { top: C.cloth, left: hex('#5b7590'), right: hex('#4d6a88') });
        box(img, lo, { x0: 5, x1: 5.4, y0: -0.2, y1: 0.2, z0: 2.5, z1: 6 }, iron);
        box(img, lo, { x0: 5.4, x1: 7, y0: -0.1, y1: 0.1, z0: 4.8, z1: 6 }, solid(C.clothEdge));
        return;
      }
      case 'galleon': {
        // The tourist galleon: a dark wooden hull with a gold stripe, two masts with white sails, red flags.
        const hull: Faces = { top: hex('#7a4a2c'), left: hex('#5a3a28'), right: hex('#3f2819') };
        box(img, lo, { x0: -17, x1: 15, y0: -4, y1: 4, z0: 0, z1: 6 }, hull);
        box(img, lo, { x0: -17, x1: 15, y0: -4.05, y1: 4.05, z0: 4, z1: 4.7 }, solid(C.gold));
        box(img, lo, { x0: -17, x1: -10, y0: -4, y1: 4, z0: 6, z1: 10 }, hull);
        box(img, lo, { x0: 15, x1: 20, y0: -0.4, y1: 0.4, z0: 6, z1: 7 }, hull);
        for (const m of [-5, 6]) {
          box(img, lo, { x0: m - 0.4, x1: m + 0.4, y0: -0.4, y1: 0.4, z0: 6, z1: 34 }, hull);
          box(img, lo, { x0: m - 5, x1: m + 5, y0: 0.4, y1: 0.8, z0: 13, z1: 21 }, solid(C.cloth));
          box(img, lo, { x0: m - 4, x1: m + 4, y0: 0.4, y1: 0.8, z0: 23, z1: 30 }, solid(C.cloth));
          box(img, lo, { x0: m + 0.4, x1: m + 3, y0: -0.1, y1: 0.1, z0: 32, z1: 34 }, solid(C.clothEdge));
        }
        return;
      }
      case 'musician':
        return;
      case 'bench': {
        const slats: Faces = { top: C.tableTop, left: C.tableLeft, right: C.tableRight };
        for (const x of [0.5, 10.5]) box(img, lo, { x0: x, x1: x + 1, y0: 0, y1: 4, z0: 0, z1: 4 }, iron);
        box(img, lo, { x0: 0, x1: 12, y0: 0, y1: 4, z0: 4, z1: 5 }, slats);
        box(img, lo, { x0: 0, x1: 12, y0: 0, y1: 1, z0: 5, z1: 10 }, slats);
        return;
      }
      case 'tree': {
        // A linden in an iron grate.
        box(img, lo, { x0: -4, x1: 4, y0: -4, y1: 4, z0: 0, z1: 0.5 }, iron);
        box(img, lo, { x0: -1, x1: 1, y0: -1, y1: 1, z0: 0.5, z1: 14 }, { top: C.bark, left: C.bark, right: C.barkDark });
        const leaves = (shade: number): Faces => ({
          top: mix(C.leafLight, C.leaf, shade),
          left: mix(C.leaf, C.leafLight, 0.2 - shade / 5),
          right: mix(C.leaf, C.outline, 0.15 + shade / 5),
        });
        box(img, lo, { x0: -7, x1: 7, y0: -7, y1: 7, z0: 12, z1: 22 }, leaves(0.3));
        box(img, lo, { x0: -5, x1: 5, y0: -5, y1: 5, z0: 22, z1: 28 }, leaves(0.1));
        box(img, lo, { x0: -2, x1: 3, y0: -3, y1: 2, z0: 28, z1: 31 }, leaves(0));
        return;
      }
      case 'tub': {
        box(img, lo, { x0: -3, x1: 3, y0: -3, y1: 3, z0: 0, z1: 5 }, { top: C.terracottaDark, left: C.terracotta, right: C.terracottaDark });
        for (let f = 0; f < 5; f++) {
          const fx = -2 + (f % 3) * 1.6;
          const fy = -2 + Math.floor(f / 3) * 2;
          box(img, lo, { x0: fx, x1: fx + 1.2, y0: fy, y1: fy + 1.2, z0: 5, z1: 7 }, solid(f % 2 ? C.leaf : C.leafLight));
          box(img, lo, { x0: fx, x1: fx + 1, y0: fy, y1: fy + 1, z0: 7, z1: 8 }, solid(C.flowers[f % 4]));
        }
        return;
      }
      case 'menuBoard': {
        // An A-frame chalkboard: "Dziś: pierogi!"
        const frame: Faces = { top: C.trim, left: C.chalk, right: C.trimDark };
        box(img, lo, { x0: 0, x1: 7, y0: 0, y1: 1.5, z0: 0, z1: 12 }, frame);
        for (const [x, z] of [[1.5, 9], [2.5, 9], [3.5, 9], [1.5, 6.5], [2.5, 6.5], [4.5, 6.5], [5.5, 6.5], [2, 4], [3, 4], [4, 4]]) {
          box(img, lo, { x0: x, x1: x + 0.8, y0: 1.5, y1: 1.6, z0: z, z1: z + 0.8 }, solid(C.cloth));
        }
        return;
      }
    }
  }, big ? 128 : 96);
}

function streetPieces(layout: RoomLayout, look: RoomLook, location: LocationId): ScenePiece[] {
  const o = layout.origin;
  return streetFurniture(layout, location).flatMap(({ thing, x, y }, i): ScenePiece[] => {
    // An accordion player, swaying to the music.
    if (thing === 'musician') return [{ ...piece(o, `street${i}`, personImage('musician', 'front', 'stand'), x, y, -PLINTH, x + y), kind: 'busker' }];
    const placed = piece(o, `street${i}`, streetThing(thing, look.dusk && thing === 'lamp'), x, y, -PLINTH, x + y);
    if (thing === 'pigeons') return [{ ...placed, kind: 'pigeon' }];
    if (thing === 'boat' || thing === 'galleon') return [{ ...placed, kind: 'boat' }];
    // A gull resting on the bollard.
    if (thing === 'gull') return [placed, { ...piece(o, `street${i}gull`, gullImage(), x, y, -PLINTH + 4.3, x + y + 0.1), kind: 'pigeon' }];
    // The amber seller stands behind the stall.
    if (thing === 'amberStall') return [placed, piece(o, `street${i}seller`, personImage('amberSeller', 'front', 'stand'), x + 11, y, -PLINTH, x + y + 11)];
    return [placed];
  });
}

/**
 * Where people passing by walk: down the pavement on the left, along the street in front
 * (a little further out than guests coming in), and up the side street on the right, or the
 * other way round. They start and finish out of sight.
 */
export function passerByPath(layout: RoomLayout, lane: number, leftToRight: boolean, reach: number): Point[] {
  const z = -PLINTH;
  const left = layout.roomY + LOW_WALL.thick + 13 + lane * 3;
  const front = layout.streetY + 6 + lane * 4;
  const right = 14 + lane * 3;
  const side = { left: -12 - lane * 3, right: layout.edgeX + 12 + lane * 3 };
  const route = [
    { x: -reach, y: left, z },
    { x: side.left, y: left, z },
    { x: side.left, y: front, z },
    { x: side.right, y: front, z },
    { x: side.right, y: right, z },
    { x: reach, y: right, z },
  ];
  return leftToRight ? route : [...route].reverse();
}

/** Where the nth person waiting for a table stands: on the street, in a line to the right of the steps. */
export function queueSpot(layout: RoomLayout, n: number): Point {
  const door = (layout.door.x0 + layout.door.x1) / 2;
  return { x: door + 14 + n * 6, y: layout.streetY - 3, z: -PLINTH };
}

/** A party that gave up waiting: from the queue, off down the street. */
export function leaveQueuePath(layout: RoomLayout, person: number): Point[] {
  const from = queueSpot(layout, person);
  return [from, { x: from.x + 4, y: layout.streetY + 4, z: -PLINTH }, { x: from.x + 160, y: layout.streetY + 4, z: -PLINTH }];
}
