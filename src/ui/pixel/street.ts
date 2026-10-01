// The Old Town around the restaurant: a cobbled street in front, pavements, and rows of
// gabled townhouses behind and beside it, with the Town Hall spire peeking over the roofs.
// Drawn in layers behind the room, big enough to fill the whole frame: the sky (with the sun,
// or the moon and stars), drifting clouds, then the houses and the street. See project.md section 9.1.1.

import type { Weather } from '../../data/weather';
import { hex, mix, Pixels, type Rgb } from './raster';
import { LOW_WALL, PLINTH, type RoomLayout, type RoomLook } from './room';

const C = {
  cobbleA: hex('#a99d91'),
  cobbleB: hex('#9b8f84'),
  cobbleGap: hex('#7f7468'),
  slabA: hex('#d3cabd'),
  slabB: hex('#c7bdaf'),
  slabGap: hex('#a59a8b'),
  curb: hex('#8a8175'),
  houses: ['#e8c07a', '#d98b6a', '#c25b43', '#e9dcc0', '#8fb3a5', '#c9a3c4', '#f2dfb8', '#7fa0c0', '#e9a23b', '#d7b48a'].map(hex),
  trim: hex('#f6eedf'),
  shadow: hex('#3b2a22'),
  door: hex('#5a3a28'),
  pane: hex('#5b7590'),
  lit: hex('#ffd76a'),
  brick: hex('#a24a33'),
  spire: hex('#4b6a5c'),
  sky: { sunny: hex('#bfe0f0'), cloudy: hex('#d3dde3'), rain: hex('#a4b4c0'), heatwave: hex('#ffe3a8') } as Record<Weather, Rgb>,
  dusk: hex('#3d4a74'),
  rain: hex('#e6eef3'),
  white: hex('#ffffff'),
  sun: hex('#f4c531'),
  sunCore: hex('#fff1a8'),
  moon: hex('#f6efd0'),
  moonShade: hex('#d9cfa6'),
  star: hex('#fdf6e3'),
  puddle: hex('#9fb3c2'),
  puddleShine: hex('#d6e2ea'),
};

type Gable = 'pointed' | 'stepped' | 'flat' | 'tower';

interface House {
  from: number;
  to: number;
  /** Height of the front up to the cornice; the gable sits on top. */
  height: number;
  gableHeight: number;
  gable: Gable;
  colour: Rgb;
}

/** A row of townhouses along a street, `length` units long, the same every time for the same seed. */
function rowOfHouses(seed: number, length: number, minHeight: number, maxHeight: number): House[] {
  let s = seed >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return (s >>> 8) / 16777216;
  };
  const gables: Gable[] = ['pointed', 'stepped', 'pointed', 'flat', 'stepped'];
  const houses: House[] = [];
  for (let u = 0; u < length; ) {
    const width = 14 + Math.floor(rnd() * 8);
    houses.push({
      from: u,
      to: u + width,
      height: minHeight + Math.floor(rnd() * (maxHeight - minHeight)),
      gableHeight: 8 + Math.floor(rnd() * 6),
      gable: gables[Math.floor(rnd() * gables.length)],
      colour: C.houses[Math.floor(rnd() * C.houses.length)],
    });
    u += width;
  }
  return houses;
}

/** Finds the house at a point along the row. */
function houseAt(row: House[], u: number): House | null {
  for (const house of row) if (u >= house.from && u < house.to) return house;
  return null;
}

/** A little hash, so lit windows don't make a pattern. */
const lit = (a: number, b: number, c: number) => ((a * 73856093) ^ (b * 19349663) ^ (c * 83492791)) % 5 < 3;

/** One house front, at `u` along it and `z` up. Null where there's sky. */
function facade(house: House, u: number, z: number, look: RoomLook): Rgb | null {
  const width = house.to - house.from;
  const local = u - house.from;
  const fromMiddle = Math.abs(local - width / 2);
  if (z >= house.height) {
    // The gable (or the tower's top).
    const g = z - house.height;
    if (house.gable === 'flat') return g < 2 ? C.trim : null;
    if (house.gable === 'tower') {
      // A green copper spire.
      const reach = (width / 2) * (1 - g / 40);
      return g < 40 && fromMiddle < reach ? C.spire : null;
    }
    if (g >= house.gableHeight) return null;
    const half = width / 2 - 1;
    const steps = house.gable === 'stepped' ? Math.floor(g / 3) * 3 : g;
    const reach = half * (1 - steps / house.gableHeight);
    if (fromMiddle > reach) return null;
    if (fromMiddle > reach - 1) return mix(house.colour, C.shadow, 0.25);
    // A little round window in the gable.
    if (fromMiddle < 1.5 && g >= 2 && g < 5) return look.dusk ? C.lit : C.pane;
    return mix(house.colour, C.white, 0.08);
  }
  if (local < 1) return mix(house.colour, C.shadow, 0.35);
  if (z >= house.height - 2) return C.trim;
  if (house.gable === 'tower') return (Math.floor(z / 3) + Math.floor(local / 6)) % 7 === 0 ? mix(C.brick, C.shadow, 0.2) : C.brick;
  const storey = Math.floor(z / 13);
  const inStorey = z % 13;
  if (storey === 0) {
    // The ground floor: a door in the middle and a shop window on either side.
    if (fromMiddle < 2.5 && z < 10) return z > 8.5 ? mix(C.door, C.shadow, 0.3) : C.door;
    const shop = (local >= 2 && local < width / 2 - 4) || (local > width / 2 + 4 && local < width - 2);
    if (shop && z >= 3 && z < 9) return look.dusk ? C.lit : C.pane;
    return house.colour;
  }
  // Upper floors: rows of tall windows with a white frame on top.
  const column = Math.floor((local - 2) / 5);
  const inColumn = (local - 2) % 5;
  if (local >= 2 && local < width - 2 && inColumn < 3 && inStorey >= 3 && inStorey < 10) {
    if (inStorey === 9) return C.trim;
    return look.dusk && lit(house.from, storey, column) ? C.lit : C.pane;
  }
  return house.colour;
}

/** The sky colour of the day, from the top of the picture down to the rooftops. */
function skyColour(look: RoomLook, py: number, height: number): Rgb {
  const base = look.dusk ? C.dusk : C.sky[look.weather];
  return mix(base, C.white, (look.weather === 'rain' ? 0.12 : 0.3) * (py / height));
}

/**
 * The sky behind everything: the day's colour, a sun on clear days (bigger, with a warm halo,
 * in a heatwave), or after dusk the moon and a sprinkling of stars. Clouds drift over it,
 * and the houses stand in front of it.
 */
export function drawSky(look: RoomLook, width: number, height: number): Pixels {
  const img = new Pixels(width, height);
  for (let py = 0; py < height; py++) for (let px = 0; px < width; px++) img.set(px, py, skyColour(look, py, height));
  const cx = Math.round(width * 0.27);
  const cy = Math.round(Math.min(18, height * 0.1));
  if (look.dusk) {
    // Stars, scattered the same way every evening.
    for (let i = 0; i < 40; i++) {
      const x = (i * 97 + 31) % width;
      const y = (i * 53 + 7) % Math.max(1, Math.round(height * 0.35));
      img.set(x, y, C.star, i % 3 === 0 ? 255 : 150);
    }
    // A crescent moon.
    for (let y = -6; y <= 6; y++) {
      for (let x = -6; x <= 6; x++) {
        const lit = x * x + y * y <= 30;
        const bite = (x - 3) * (x - 3) + (y - 1) * (y - 1) <= 22;
        if (lit && !bite) img.set(cx + x, cy + y, x < -3 ? C.moonShade : C.moon);
      }
    }
  } else if (look.weather === 'sunny' || look.weather === 'heatwave') {
    const r = look.weather === 'heatwave' ? 9 : 6;
    for (let y = -r - 6; y <= r + 6; y++) {
      for (let x = -r - 6; x <= r + 6; x++) {
        const d = Math.hypot(x, y);
        if (d <= r) img.set(cx + x, cy + y, d < r * 0.55 ? C.sunCore : C.sun);
        else if (look.weather === 'heatwave' && d <= r + 6) img.set(cx + x, cy + y, C.sunCore, Math.round(110 * (1 - (d - r) / 6)));
        // Short rays on a clear day.
        else if (look.weather === 'sunny' && d <= r + 4 && (Math.abs(x) < 0.6 || Math.abs(y) < 0.6 || Math.abs(Math.abs(x) - Math.abs(y)) < 0.6)) {
          img.set(cx + x, cy + y, C.sun);
        }
      }
    }
  }
  return img;
}

/** Cloud colours: white and fluffy, grey, or dark with rain; blue-grey after dusk. */
export function cloudColours(look: RoomLook): { light: Rgb; shade: Rgb } {
  const base =
    look.weather === 'rain'
      ? { light: hex('#8e9aa6'), shade: hex('#6f7b88') }
      : look.weather === 'cloudy'
        ? { light: hex('#eef1f3'), shade: hex('#c3cbd2') }
        : { light: hex('#ffffff'), shade: hex('#dbe7ee') };
  return look.dusk ? { light: mix(base.light, C.dusk, 0.55), shade: mix(base.shade, C.dusk, 0.6) } : base;
}

/** One pixel cloud: a few overlapping puffs, light on top and shaded underneath. */
export function drawCloud(look: RoomLook, width: number, seed: number): Pixels {
  const height = Math.round(width * 0.42);
  const img = new Pixels(width, height);
  const { light, shade } = cloudColours(look);
  const puffs = [0.22, 0.42, 0.62, 0.8].map((at, i) => ({
    x: width * at,
    y: height * (i % 2 === 0 ? 0.62 : 0.48) - ((seed * (i + 3)) % 3),
    r: height * (i === 1 || i === 2 ? 0.42 : 0.3),
  }));
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const inside = puffs.some((p) => (x - p.x) ** 2 + ((y - p.y) * 1.2) ** 2 <= p.r * p.r);
      if (inside && y < height - 1) img.set(x, y, y > height * 0.62 ? shade : light);
    }
  }
  return img;
}

/** A tile of falling rain streaks, repeated over the whole scene and moved down in a loop. */
export function drawRainTile(): Pixels {
  const img = new Pixels(24, 24);
  const drops = [[2, 1], [14, 4], [7, 10], [19, 13], [11, 18], [3, 20], [21, 22]];
  for (const [x, y] of drops) {
    for (let k = 0; k < 4; k++) img.set((x + Math.floor(k / 2)) % 24, (y + k) % 24, C.rain, 170);
  }
  return img;
}

/** Remainder that stays positive for negative numbers too. */
const mod = (value: number, by: number) => ((value % by) + by) % by;

/** The ground at a world point: pavement along the house fronts, cobbles on the street. */
/** Puddles on the cobbles on a rainy day, reflecting the sky. */
function puddle(x: number, y: number): Rgb | null {
  const cx = Math.floor(x / 26);
  const cy = Math.floor(y / 18);
  if (((cx * 7 + cy * 13) & 7) !== 0) return null;
  const dx = mod(x, 26) - 13;
  const dy = mod(y, 18) - 9;
  const d = (dx * dx) / 64 + (dy * dy) / 16;
  if (d > 1) return null;
  return d < 0.25 && dx < 0 ? C.puddleShine : C.puddle;
}

function ground(layout: RoomLayout, x: number, y: number, look?: RoomLook): Rgb {
  const { edgeX: roomX } = layout;
  // The pavement runs along the house fronts; the przedproże and its steps stand on it.
  const roomY = layout.roomY + LOW_WALL.thick;
  const pavement = (x < 0 && y >= roomY && y < roomY + 10) || (x >= roomX && y >= 0 && y < 10);
  const curb = (x < 0 && y >= roomY + 10 && y < roomY + 11.5) || (x >= roomX && y >= 10 && y < 11.5 && x > roomX + 1);
  if (curb) return C.curb;
  if (pavement) {
    if (mod(x, 8) < 0.6 || mod(y, 8) < 0.6) return C.slabGap;
    return (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0 ? C.slabA : C.slabB;
  }
  const wet = look?.weather === 'rain' ? puddle(x, y) : null;
  if (wet) return wet;
  // Cobbles in staggered rows.
  const row = Math.floor(y / 4);
  const shift = mod(row, 2) === 0 ? 0 : 2.5;
  if (mod(y, 4) < 0.6 || mod(x + shift, 5) < 0.6) return C.cobbleGap;
  return mod(Math.floor((x + shift) / 5) * 7 + row * 3, 5) === 0 ? C.cobbleB : C.cobbleA;
}

/**
 * The street around the restaurant, `width` × `height` art pixels, with the room's picture
 * sitting `marginX`, `marginY` in from the top left. The room is drawn on top of it.
 */
export function drawStreet(layout: RoomLayout, look: RoomLook, width: number, height: number, marginX: number, marginY: number): Pixels {
  const img = new Pixels(width, height);
  const { roomX } = layout;
  // Next door's houses line up with the restaurant's front wall.
  const roomY = layout.roomY + LOW_WALL.thick;
  const ox = layout.origin.ox + marginX;
  // Everything outside stands on the street, a plinth lower than the restaurant's floor.
  const oy = layout.origin.oy + marginY + PLINTH;
  // Three rows of houses: behind the back wall, above the left wall, and next door on the left.
  const behind = rowOfHouses(1997, width + 40, 62, 80);
  // The Town Hall tower, further back on the right, its green spire peeking over the roofs.
  const from = roomX + 30;
  const room = oy + (from + 11) / 2 - 4;
  const tower: House = { from, to: from + 16, height: Math.max(84, Math.round(room - 40)), gableHeight: 40, gable: 'tower', colour: C.brick };
  const above = rowOfHouses(1410, roomY + 1, 62, 78);
  const nextDoor = rowOfHouses(1308, width + 40, 30, 48);

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const sx = px + 0.5 - ox;
      const sy = py + 0.5 - oy;
      let colour: Rgb | null;
      let haze = 0;
      let z: number;
      if (sx < -roomY) {
        // Next door on the left, fronts facing the street.
        const x = sx + roomY;
        z = (x + roomY) / 2 - sy;
        const house = houseAt(nextDoor, -x);
        colour = z >= 0 && house ? facade(house, -x, z, look) : null;
      } else if (sx < 0) {
        // Above the left wall.
        const y = -sx;
        z = y / 2 - sy;
        const house = houseAt(above, y);
        colour = z >= 0 && house ? facade(house, y, z, look) : null;
        haze = 0.2;
      } else {
        // Behind the back wall, and on along the street to the right.
        z = sx / 2 - sy;
        const house = houseAt(behind, sx);
        colour = z >= 0 && house ? facade(house, sx, z, look) : null;
        haze = 0.15;
        if (colour === null && z >= 0 && sx >= tower.from && sx < tower.to) {
          colour = facade(tower, sx, z, look);
          haze = 0.3;
        }
      }
      if (z < 0) {
        colour = ground(layout, (sx + 2 * sy) / 2, (2 * sy - sx) / 2, look);
        haze = 0;
      }
      // The sky stays see-through: the sky picture and the clouds show behind.
      if (colour === null) continue;
      const skyColour = look.dusk ? C.dusk : C.sky[look.weather];
      if (haze > 0 && colour !== C.lit) colour = mix(colour, skyColour, haze);
      if (look.dusk && colour !== C.lit) colour = mix(colour, C.dusk, 0.35);
      else if (look.weather === 'rain' && haze === 0 && colour !== C.puddle && colour !== C.puddleShine) colour = mix(colour, C.shadow, 0.12);
      img.set(px, py, colour);
    }
  }
  return img;
}
