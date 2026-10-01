// The pixel-art sample scene (project.md section 9.1, step 1): a small dining room
// with an open kitchen, two tables, two guests, a waiter, a chef and Mewa.
// Run with `npx tsx scripts/pixel/sample-scene.ts`; it writes PNGs to art/sample/.
//
// Everything is drawn in an isometric view: world x runs down-right, y down-left,
// z up. One world unit is one pixel sideways and half a pixel down.

import { mkdirSync, writeFileSync } from 'node:fs';
import { encodePng, hex, mix, Pixels, type Rgb } from './raster';
import {
  CHEF_HAT,
  LAMP,
  LAMP_COLOURS,
  MEWA,
  MEWA_COLOURS,
  PEOPLE,
  PERSON,
  PLANT,
  PLANT_COLOURS,
  SEATED_ROWS,
  sprite,
} from './sprites';

const C = {
  outline: hex('#3b2433'),
  wallLeft: hex('#f0dcb8'),
  wallRight: hex('#f7e8cc'),
  wallShade: hex('#e2c99f'),
  trim: hex('#8a5233'),
  trimDark: hex('#6b3d24'),
  plankA: hex('#d9a066'),
  plankB: hex('#cf9459'),
  seam: hex('#a8703f'),
  checkLight: hex('#e9e6ef'),
  checkDark: hex('#4a4656'),
  tileA: hex('#f1e2c4'),
  tileB: hex('#e4d0aa'),
  tableTop: hex('#b8794a'),
  tableLeft: hex('#94603a'),
  tableRight: hex('#7a4a2c'),
  tableEdge: hex('#d09060'),
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
  sky: hex('#bfe0f0'),
  skyLow: hex('#d8ecf4'),
  curtain: hex('#fbf1dc'),
  curtainShade: hex('#e8d6b3'),
  glow: hex('#fff1b8'),
  gold: hex('#d9a92b'),
  paintingSea: hex('#4f86a6'),
  houses: ['#b5452f', '#e9a23b', '#5d8aa8', '#7a9e6b', '#e4c9a0'].map(hex),
};

// ---------- The isometric frame ----------

const ROOM = { x: 128, y: 96, wall: 52 };
const W = 250;
const H = 190;
const OX = 112;
const OY = 64;

const screen = (x: number, y: number, z: number) => ({ sx: OX + x - y, sy: OY + (x + y) / 2 - z });

type Box = { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number };
type Faces = { top: Rgb; left: Rgb; right: Rgb; edge?: Rgb };

/** Draws a solid box: its top, its front-left side (facing +y) and its front-right side (facing +x). */
function box(img: Pixels, b: Box, f: Faces): void {
  const min = screen(b.x0, b.y1, b.z1);
  const max = screen(b.x1, b.y0, b.z0);
  const top = screen(b.x0, b.y0, b.z1).sy;
  const bottom = screen(b.x1, b.y1, b.z0).sy;
  for (let py = Math.floor(top) - 1; py <= Math.ceil(bottom) + 1; py++) {
    for (let px = Math.floor(min.sx) - 1; px <= Math.ceil(max.sx) + 1; px++) {
      const sx = px + 0.5 - OX;
      const sy = py + 0.5 - OY;
      // Top face: z = z1.
      const tx = (sx + 2 * (sy + b.z1)) / 2;
      const ty = (2 * (sy + b.z1) - sx) / 2;
      if (tx >= b.x0 && tx < b.x1 && ty >= b.y0 && ty < b.y1) {
        const nearEdge = f.edge && (tx >= b.x1 - 1 || ty >= b.y1 - 1);
        img.set(px, py, nearEdge ? f.edge! : f.top);
        continue;
      }
      // Front-left face: y = y1.
      const lx = sx + b.y1;
      const lz = (lx + b.y1) / 2 - sy;
      if (lx >= b.x0 && lx < b.x1 && lz >= b.z0 && lz < b.z1) {
        img.set(px, py, f.left);
        continue;
      }
      // Front-right face: x = x1.
      const ry = b.x1 - sx;
      const rz = (b.x1 + ry) / 2 - sy;
      if (ry >= b.y0 && ry < b.y1 && rz >= b.z0 && rz < b.z1) img.set(px, py, f.right);
    }
  }
}

// ---------- The room: floor and walls ----------

function floorColour(x: number, y: number): Rgb {
  // The kitchen corner has a checkered floor, like reference 2.
  if (x >= 84 && y < 44) return (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0 ? C.checkLight : C.checkDark;
  // A cream tiled path from the front door, like reference 3.
  if (x >= 47 && x < 59) {
    if (x % 6 < 0.6 || y % 6 < 0.6) return C.tileB;
    return (Math.floor(x / 6) + Math.floor(y / 6)) % 2 === 0 ? C.tileA : C.tileB;
  }
  // Honey-wood planks running along x, like reference 3.
  const plank = Math.floor(y / 6);
  if (y % 6 < 0.6) return C.seam;
  const joint = (x + plank * 23) % 40;
  if (joint < 0.8) return C.seam;
  return plank % 2 === 0 ? C.plankA : C.plankB;
}

/** The left wall (x = 0): a window onto the Old Town with curtains. */
function leftWallColour(y: number, z: number): Rgb {
  if (z < 3) return C.trimDark;
  if (z >= ROOM.wall - 4) return C.trim;
  const win = { y0: 26, y1: 62, z0: 16, z1: 42 };
  if (y >= win.y0 && y < win.y1 && z >= win.z0 && z < win.z1) {
    if (z < win.z0 + 1.5 || z >= win.z1 - 1.5 || y < win.y0 + 1.5 || y >= win.y1 - 1.5) return C.trimDark;
    // Curtains at both sides.
    if (y < win.y0 + 6 || y >= win.y1 - 6) return Math.floor(y) % 3 === 0 ? C.curtainShade : C.curtain;
    if (Math.abs(y - (win.y0 + win.y1) / 2) < 0.8) return C.trimDark;
    // Gabled houses against the sky.
    const house = Math.floor((y - win.y0 - 6) / 6);
    const centre = win.y0 + 6 + house * 6 + 3;
    const roof = win.z0 + 12 + (house % 2) * 3 - Math.abs(y - centre) * 1.2;
    if (z < roof) {
      const windowPane = Math.abs(y - centre) < 1 && z > win.z0 + 4 && z < win.z0 + 7;
      return windowPane ? C.curtain : C.houses[(house + 5) % C.houses.length];
    }
    return z > win.z1 - 8 ? C.sky : C.skyLow;
  }
  // The sill under the window.
  if (y >= 24 && y < 64 && z >= 14 && z < 16) return C.trim;
  return z < 6 ? C.wallShade : C.wallLeft;
}

/** The right wall (y = 0): the front door, a painting of the Neptune Fountain, a shelf. */
function rightWallColour(x: number, z: number): Rgb {
  if (z < 3) return C.trimDark;
  if (z >= ROOM.wall - 4) return C.trim;
  // An arched wooden door.
  const door = { x0: 44, x1: 62, top: 26 };
  const dx = x - (door.x0 + door.x1) / 2;
  const arch = door.top + Math.sqrt(Math.max(0, 81 - dx * dx));
  if (x >= door.x0 && x < door.x1 && z < arch) {
    if (x < door.x0 + 1.5 || x >= door.x1 - 1.5 || z >= arch - 1.5) return C.trimDark;
    if (Math.abs(dx - 4) < 1 && Math.abs(z - 14) < 1) return C.gold;
    return Math.floor(x) % 4 === 0 ? C.trimDark : C.trim;
  }
  // A small painting of the Neptune Fountain.
  if (x >= 16 && x < 32 && z >= 22 && z < 36) {
    if (x < 17.5 || x >= 30.5 || z < 23.5 || z >= 34.5) return C.gold;
    const trident = Math.abs(x - 24) < 0.8 || (Math.abs(z - 30) < 0.8 && Math.abs(x - 24) < 3);
    const prongs = (Math.abs(x - 21) < 0.8 || Math.abs(x - 27) < 0.8) && z > 30 && z < 33;
    return trident || prongs ? C.gold : C.paintingSea;
  }
  // A wall shelf for a little plant.
  if (x >= 66 && x < 80 && z >= 29 && z < 31) return C.trim;
  return z < 6 ? C.wallShade : C.wallRight;
}

function drawRoom(img: Pixels): void {
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const sx = px + 0.5 - OX;
      const sy = py + 0.5 - OY;
      // Floor (z = 0).
      const fx = (sx + 2 * sy) / 2;
      const fy = (2 * sy - sx) / 2;
      if (fx >= 0 && fx < ROOM.x && fy >= 0 && fy < ROOM.y) {
        img.set(px, py, floorColour(fx, fy));
        continue;
      }
      // Right wall (y = 0, seen from +y).
      const rz = sx / 2 - sy;
      if (sx >= 0 && sx < ROOM.x && rz >= 0 && rz < ROOM.wall) {
        img.set(px, py, rightWallColour(sx, rz));
        continue;
      }
      // Left wall (x = 0, seen from +x).
      const ly = -sx;
      const lz = ly / 2 - sy;
      if (ly >= 0 && ly < ROOM.y && lz >= 0 && lz < ROOM.wall) img.set(px, py, leftWallColour(ly, lz));
    }
  }
}

/** Warm light from a lamp, in two soft bands (pixel art avoids smooth gradients). */
function lampGlow(img: Pixels, x: number, y: number): void {
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const sx = px + 0.5 - OX;
      const sy = py + 0.5 - OY;
      const fx = (sx + 2 * sy) / 2;
      const fy = (2 * sy - sx) / 2;
      const d = Math.hypot(fx - x, fy - y);
      const here = img.get(px, py);
      if (!here || fx < 0 || fy < 0 || fx > ROOM.x || fy > ROOM.y) continue;
      if (d < 12) img.set(px, py, mix(here, C.glow, 0.22));
      else if (d < 20) img.set(px, py, mix(here, C.glow, 0.1));
    }
  }
}

// ---------- Things in the room, drawn back to front ----------

interface Thing {
  /** Painter's order: further back is smaller. */
  depth: number;
  draw: (layer: Pixels) => void;
  outline?: boolean;
}

/** A sprite standing with its feet at a world point. */
function placeSprite(layer: Pixels, image: Pixels, x: number, y: number, z: number): void {
  const { sx, sy } = screen(x, y, z);
  layer.draw(image, Math.round(sx - image.width / 2), Math.round(sy - image.height));
}

function shadow(layer: Pixels, x: number, y: number): void {
  const { sx, sy } = screen(x, y, 0);
  for (let dx = -5; dx <= 5; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      if ((dx * dx) / 30 + dy * dy <= 1.2) layer.set(Math.round(sx) + dx, Math.round(sy) + dy, hex('#3b2433'), 70);
    }
  }
}

function person(kind: string, hat = false): Pixels {
  const body = sprite(PERSON, PEOPLE[kind]);
  if (!hat) return body;
  const withHat = new Pixels(body.width, body.height + CHEF_HAT.length - 1);
  withHat.draw(body, 0, CHEF_HAT.length - 1);
  withHat.draw(sprite(CHEF_HAT, PEOPLE[kind]), 0, 0);
  return withHat;
}

function seated(kind: string): Pixels {
  const body = sprite(PERSON, PEOPLE[kind]);
  const top = new Pixels(body.width, SEATED_ROWS);
  for (let y = 0; y < SEATED_ROWS; y++) for (let x = 0; x < body.width; x++) {
    const c = body.get(x, y);
    if (c) top.set(x, y, c);
  }
  return top;
}

const wood = { top: C.tableTop, left: C.tableLeft, right: C.tableRight, edge: C.tableEdge };
const chairWood = { top: C.chair, left: C.chairDark, right: C.chairDark };
const steel = { top: C.steelTop, left: C.steelLeft, right: C.steelRight };

/** A table for two: a wooden top on a pedestal, with a plate of food on it. */
function table(x: number, y: number, food: Rgb): Thing[] {
  return [
    {
      depth: x + y + 20,
      outline: true,
      draw: (l) => {
        box(l, { x0: x + 6, x1: x + 10, y0: y + 6, y1: y + 10, z0: 0, z1: 12 }, wood);
        box(l, { x0: x, x1: x + 16, y0: y, y1: y + 16, z0: 12, z1: 15 }, wood);
        box(l, { x0: x + 4, x1: x + 9, y0: y + 4, y1: y + 9, z0: 15, z1: 15.6 }, { top: C.plate, left: C.plate, right: C.plate });
        box(l, { x0: x + 5.5, x1: x + 7.5, y0: y + 5.5, y1: y + 7.5, z0: 15.6, z1: 16.6 }, { top: food, left: food, right: food });
      },
    },
  ];
}

/** A chair on the near side of a table, its back towards us. */
function chairFacingAway(x: number, y: number): Thing[] {
  return [
    {
      depth: x + y + 40,
      outline: true,
      draw: (l) => {
        for (const [dx, dy] of [[0, 0], [5, 0], [0, 5], [5, 5]]) {
          box(l, { x0: x + dx, x1: x + dx + 1, y0: y + dy, y1: y + dy + 1, z0: 0, z1: 7 }, chairWood);
        }
        box(l, { x0: x, x1: x + 6, y0: y, y1: y + 6, z0: 7, z1: 9 }, chairWood);
        box(l, { x0: x, x1: x + 6, y0: y + 4.5, y1: y + 6, z0: 9, z1: 18 }, chairWood);
      },
    },
  ];
}

/** A chair whose back is on the far side (so a guest can sit facing us). */
function chairFacingUs(x: number, y: number): Thing[] {
  return [
    {
      depth: x + y,
      outline: true,
      draw: (l) => {
        for (const [dx, dy] of [[0, 0], [5, 0], [0, 5], [5, 5]]) {
          box(l, { x0: x + dx, x1: x + dx + 1, y0: y + dy, y1: y + dy + 1, z0: 0, z1: 7 }, chairWood);
        }
        box(l, { x0: x, x1: x + 6, y0: y, y1: y + 1.5, z0: 9, z1: 18 }, chairWood);
        box(l, { x0: x, x1: x + 6, y0: y, y1: y + 6, z0: 7, z1: 9 }, chairWood);
      },
    },
  ];
}

function scene(): Pixels {
  const img = new Pixels(W, H);
  img.fillRect(0, 0, W, H, hex('#2a1d26'));
  drawRoom(img);
  lampGlow(img, 38, 64);
  lampGlow(img, 70, 64);

  const things: Thing[] = [
    // The kitchen: a back counter and fridge against the wall, an island with the stove.
    {
      depth: 0,
      outline: true,
      draw: (l) => {
        box(l, { x0: 86, x1: 112, y0: 1, y1: 10, z0: 0, z1: 14 }, { top: C.cabinet, left: C.cabinet, right: C.cabinetDark });
        box(l, { x0: 86, x1: 112, y0: 1, y1: 10, z0: 14, z1: 16 }, steel);
        box(l, { x0: 113, x1: 126, y0: 1, y1: 12, z0: 0, z1: 32 }, { top: C.fridge, left: C.fridge, right: C.fridgeShade });
      },
    },
    {
      depth: 120 + 12 + 0.5,
      draw: (l) => {
        shadow(l, 104, 15);
        placeSprite(l, person('chef', true), 104, 15, 0);
      },
    },
    {
      depth: 124 + 37,
      outline: true,
      draw: (l) => {
        box(l, { x0: 88, x1: 124, y0: 26, y1: 36, z0: 0, z1: 13 }, { top: C.cabinet, left: C.cabinet, right: C.cabinetDark });
        box(l, { x0: 87, x1: 125, y0: 25, y1: 37, z0: 13, z1: 15 }, steel);
        box(l, { x0: 98, x1: 112, y0: 27, y1: 35, z0: 15, z1: 15.5 }, { top: C.stove, left: C.stove, right: C.stove });
        box(l, { x0: 101, x1: 107, y0: 28, y1: 33, z0: 15.5, z1: 21 }, steel);
      },
    },
    // Two tables, each with a guest on the far chair, facing us.
    ...chairFacingUs(35, 47),
    { depth: 35 + 47 + 0.5, draw: (l) => placeSprite(l, seated('tourist'), 38, 51, 9) },
    ...table(30, 56, hex('#e9a23b')),
    ...chairFacingAway(35, 74),
    ...chairFacingUs(67, 47),
    { depth: 67 + 47 + 0.5, draw: (l) => placeSprite(l, seated('local'), 70, 51, 9) },
    ...table(62, 56, hex('#b5452f')),
    ...chairFacingAway(67, 74),
    // The waiter, on the way with a tray.
    {
      depth: 58 + 94,
      draw: (l) => {
        shadow(l, 58, 94);
        placeSprite(l, person('waiter'), 58, 94, 0);
        const { sx, sy } = screen(58, 94, 0);
        // A round tray with a glass, held out to the side.
        const tx = Math.round(sx) + 6;
        const ty = Math.round(sy) - 11;
        for (let i = -1; i <= 6; i++) l.set(tx + i, ty, C.steelLeft);
        for (let i = 0; i <= 5; i++) l.set(tx + i, ty - 1, C.steelTop);
        l.fillRect(tx + 2, ty - 4, 2, 3, hex('#f4c531'));
      },
    },
    // Plants in the corners and on the shelf.
    { depth: 6 + 76, draw: (l) => placeSprite(l, sprite(PLANT, PLANT_COLOURS), 6, 76, 0) },
    { depth: 30 + 4, draw: (l) => placeSprite(l, sprite(PLANT, PLANT_COLOURS), 30, 4, 0) },
    { depth: 73 + 1, draw: (l) => placeSprite(l, sprite(PLANT, PLANT_COLOURS), 73, 2, 31) },
    // Mewa on the windowsill.
    { depth: 2 + 46, draw: (l) => placeSprite(l, sprite(MEWA, MEWA_COLOURS), 3, 46, 16) },
  ];

  for (const thing of things.sort((a, b) => a.depth - b.depth)) {
    const layer = new Pixels(W, H);
    thing.draw(layer);
    if (thing.outline) layer.outline(C.outline);
    img.draw(layer, 0, 0);
  }

  // Lamps hang over the tables on long cords, drawn last so they're in front.
  for (const [x, y] of [[38, 64], [70, 64]]) {
    const { sx, sy } = screen(x, y, 36);
    for (let py = 0; py < sy - 6; py++) img.set(Math.round(sx), py, C.outline);
    img.draw(sprite(LAMP, LAMP_COLOURS), Math.round(sx) - 4, Math.round(sy) - 7);
  }
  return img;
}

/** The characters on their own, big, so the pixels are easy to see. */
function characterSheet(): Pixels {
  const sheet = new Pixels(16 * 5 + 24, 32);
  sheet.fillRect(0, 0, sheet.width, sheet.height, hex('#fbf3e4'));
  const items = [person('tourist'), person('local'), person('waiter'), person('chef', true), sprite(MEWA, MEWA_COLOURS)];
  let x = 2;
  for (const item of items) {
    sheet.draw(item, x, sheet.height - 3 - item.height);
    x += item.width + 4;
  }
  return sheet;
}

mkdirSync('art/sample', { recursive: true });
writeFileSync('art/sample/sample-scene.png', encodePng(scene().scaled(4)));
writeFileSync('art/sample/characters.png', encodePng(characterSheet().scaled(8)));
console.log('Wrote art/sample/sample-scene.png and art/sample/characters.png');
