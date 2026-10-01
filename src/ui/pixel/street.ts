// The Old Town around the restaurant: a cobbled street in front, pavements, and rows of
// gabled townhouses behind and beside it, with St. Mary's tower peeking over the roofs.
// Drawn as one picture behind the room, big enough to fill the whole frame. See project.md section 9.1.

import type { Weather } from '../../data/weather';
import { hex, mix, Pixels, type Rgb } from './raster';
import type { RoomLayout, RoomLook } from './room';

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

function sky(look: RoomLook, py: number, height: number, px: number): Rgb {
  const base = look.dusk ? C.dusk : C.sky[look.weather];
  if (look.weather === 'rain' && (px * 3 + py * 7) % 23 === 0) return C.rain;
  return mix(base, C.white, 0.3 * (py / height));
}

/** Remainder that stays positive for negative numbers too. */
const mod = (value: number, by: number) => ((value % by) + by) % by;

/** The ground at a world point: pavement along the house fronts, cobbles on the street. */
function ground(layout: RoomLayout, x: number, y: number): Rgb {
  const { roomX, roomY } = layout;
  const pavement = (x < 0 && y >= roomY && y < roomY + 10) || (x >= roomX && y >= 0 && y < 10);
  const curb = (x < 0 && y >= roomY + 10 && y < roomY + 11.5) || (x >= roomX && y >= 10 && y < 11.5 && x > roomX + 1);
  if (curb) return C.curb;
  if (pavement) {
    if (mod(x, 8) < 0.6 || mod(y, 8) < 0.6) return C.slabGap;
    return (Math.floor(x / 8) + Math.floor(y / 8)) % 2 === 0 ? C.slabA : C.slabB;
  }
  // Cobbles in staggered rows, a little darker than the terrace's.
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
  const { roomX, roomY } = layout;
  const ox = layout.origin.ox + marginX;
  const oy = layout.origin.oy + marginY;
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
        colour = ground(layout, (sx + 2 * sy) / 2, (2 * sy - sx) / 2);
        haze = 0;
      }
      if (colour === null) {
        img.set(px, py, sky(look, py, height, px));
        continue;
      }
      const skyColour = look.dusk ? C.dusk : C.sky[look.weather];
      if (haze > 0 && colour !== C.lit) colour = mix(colour, skyColour, haze);
      if (look.dusk && colour !== C.lit) colour = mix(colour, C.dusk, 0.35);
      img.set(px, py, colour);
    }
  }
  return img;
}
