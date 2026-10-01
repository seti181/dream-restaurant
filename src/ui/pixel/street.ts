// The Old Town around the restaurant: a cobbled street in front (granite on Długa), granite
// pavements, and rows of Gdańsk townhouses (townhouse.ts) behind and beside it, with the
// Town Hall spire peeking over the roofs.
// Drawn in layers behind the room, big enough to fill the whole frame: the sky (with the sun,
// or the moon and stars), drifting clouds, then the houses and the street. See project.md section 9.1.1.

import type { LocationId } from '../../data/locations';
import { STREET_STYLES, type Landmark, type StreetStyle } from './streetStyle';
import type { Weather } from '../../data/weather';
import { hex, mix, Pixels, type Rgb } from './raster';
import { LOW_WALL, PLINTH, type RoomLayout, type RoomLook } from './room';
import { AWNING_COLOURS, drawTownhouse, FACADE_COLOURS, frontWidth, GRANARY_COLOURS, type TownhouseFront } from './townhouse';

const C = {
  cobbleA: hex('#a99d91'),
  cobbleB: hex('#9b8f84'),
  cobbleGap: hex('#7f7468'),
  graniteA: hex('#d8d2c8'),
  graniteB: hex('#cdc6bb'),
  graniteC: hex('#e1dcd3'),
  graniteFleck: hex('#b3ab9f'),
  graniteGap: hex('#a39a8d'),
  curb: hex('#8a8175'),
  trim: hex('#f6eedf'),
  shadow: hex('#3b2a22'),
  brick: hex('#a24a33'),
  spire: hex('#4b6a5c'),
  spireLight: hex('#6f9283'),
  gold: hex('#e6b83e'),
  dial: hex('#2f4b7a'),
  stone: hex('#e9e1d2'),
  opening: hex('#2b2630'),
  brickDark: hex('#7a3322'),
  roof: hex('#6e3426'),
  roofLight: hex('#8a4632'),
  timber: hex('#4a3020'),
  timberLight: hex('#7a5a3e'),
  plank: hex('#6e5036'),
  slabA: hex('#bdbab2'),
  slabB: hex('#c8c5bd'),
  slabGap: hex('#9a978f'),
  water: hex('#3f86ad'),
  waterDeep: hex('#2f6a8e'),
  waterLight: hex('#9fd0e6'),
  quay: hex('#b3a999'),
  quayEdge: hex('#8a8175'),
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

/** Remainder that stays positive for negative numbers too. */
const mod = (value: number, by: number) => ((value % by) + by) % by;

interface House {
  from: number;
  to: number;
  front: TownhouseFront;
}

/** A pixel of a house row: its colour, and whether it glows (a lit window after dusk). */
interface Sample {
  colour: Rgb;
  glow: boolean;
}

/** A row of townhouses along a street, `length` units long, the same every time for the same seed. */
function rowOfHouses(seed: number, length: number, minHeight: number, maxHeight: number, dusk: boolean, style: StreetStyle): House[] {
  let s = seed >>> 0;
  const rnd = () => {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    return (s >>> 8) / 16777216;
  };
  const { gables, ...chance } = style.houses;
  const houses: House[] = [];
  let lastColour = -1;
  for (let u = 0; u < length; ) {
    const bays = rnd() < 0.15 ? 4 : rnd() < 0.55 ? 2 : 3;
    // Neighbours never share a colour.
    let colour = Math.floor(rnd() * FACADE_COLOURS.length);
    if (colour === lastColour) colour = (colour + 1) % FACADE_COLOURS.length;
    lastColour = colour;
    const granary = rnd() < chance.granary;
    const shop = rnd() >= 0.2;
    const awning = shop && rnd() < chance.awning;
    const front = drawTownhouse(
      {
        kind: granary ? 'granary' : 'townhouse',
        bays,
        height: minHeight + Math.floor(rnd() * (maxHeight - minHeight)),
        gable: gables[Math.floor(rnd() * gables.length)],
        colour: granary ? GRANARY_COLOURS[colour % GRANARY_COLOURS.length] : FACADE_COLOURS[colour],
        ground: shop ? 'shop' : 'arcade',
        pediment: (['triangle', 'arch', 'flat'] as const)[Math.floor(rnd() * 3)],
        awning: awning ? AWNING_COLOURS[Math.floor(rnd() * AWNING_COLOURS.length)] : null,
        sign: !awning && rnd() < chance.sign,
        flowers: rnd() < chance.flowers,
        flag: rnd() < chance.flag,
        seed: seed + houses.length * 31,
      },
      dusk,
    );
    houses.push({ from: u, to: u + frontWidth(bays), front });
    u += frontWidth(bays);
  }
  return houses;
}

/** A house front at `u` along the row and `z` up. Null where there's sky. */
function houseSample(row: House[], u: number, z: number): Sample | null {
  for (const house of row) {
    if (u < house.from || u >= house.to) continue;
    const { image, glow } = house.front;
    const x = Math.floor(u - house.from);
    const y = image.height - 1 - Math.floor(z);
    const colour = image.get(x, y);
    return colour ? { colour, glow: glow.get(x, y) !== null } : null;
  }
  return null;
}

/**
 * The Main Town Hall's tower: a brick shaft with stone bands and tall windows, the clock face
 * near the top, a white gallery, then the spire in tiers of green copper and gold, up to the
 * gilded figure of King Sigismund Augustus on the very top.
 */
function townHall(local: number, z: number, height: number): Rgb | null {
  const width = LANDMARK_WIDTH.townHall;
  const dx = local - width / 2;
  const fromMiddle = Math.abs(dx);
  if (z >= height) {
    const g = z - height;
    // The gallery: a balustrade with gold pinnacles on the corners.
    if (g < 3) {
      if (fromMiddle > width / 2 - 1.5) return C.gold;
      return g < 1 || g >= 2 || Math.floor(local) % 2 === 0 ? C.stone : null;
    }
    const tier = (from: number, to: number, w0: number, w1: number) => g >= from && g < to && fromMiddle < w0 + ((w1 - w0) * (g - from)) / (to - from);
    // The first lantern, with dark arched openings.
    if (tier(3, 13, width * 0.34, width * 0.3)) {
      if (fromMiddle < 1 && g >= 6 && g < 11) return C.opening;
      return dx < -width * 0.15 ? C.spireLight : C.spire;
    }
    if (tier(13, 15, width * 0.36, width * 0.36)) return C.gold;
    if (tier(15, 23, width * 0.24, width * 0.16)) return dx < -width * 0.08 ? C.spireLight : C.spire;
    if (tier(23, 25, 1.6, 1.6)) return C.gold;
    if (tier(25, 34, 0.7, 0.5)) return C.gold;
    // The king on top.
    if (tier(34, 38, 1.4, 0.8)) return C.gold;
    return null;
  }
  if (local < 1) return mix(C.brick, C.shadow, 0.35);
  if (z >= height - 2) return C.stone;
  // The clock: a blue face with a gold rim and gold hands.
  const clock = { z: height - 9, r: 4.6 };
  const dz = z - clock.z;
  const d = Math.hypot(dx, dz);
  if (d <= clock.r) {
    if (d > clock.r - 1.2) return C.gold;
    if ((Math.abs(dx) < 0.6 && dz > 0 && dz < 3.2) || (Math.abs(dz) < 0.6 && dx > 0 && dx < 2.4)) return C.gold;
    return C.dial;
  }
  // Stone bands and tall pointed windows down the shaft.
  if (mod(height - z, 22) < 1.5) return C.stone;
  const inBand = mod(height - z, 22);
  if (z < height - 16 && inBand > 5 && inBand < 16 && (Math.abs(dx + 3) < 1 || Math.abs(dx - 3) < 1)) {
    return inBand < 6.5 ? C.stone : C.opening;
  }
  return (Math.floor(z / 3) + Math.floor(local / 6)) % 7 === 0 ? mix(C.brick, C.shadow, 0.2) : C.brick;
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

/**
 * St. Mary's Basilica: the huge flat-topped brick tower with tall blind niches, a crenellated
 * parapet, slender corner turrets and a small copper lantern, then the long nave under its steep roof.
 */
function stMarys(local: number, z: number, height: number): Rgb | null {
  const tower = 30;
  if (local < tower) {
    const dx = local - tower / 2;
    const fromMiddle = Math.abs(dx);
    if (z >= height) {
      const g = z - height;
      if (g < 2) return mod(Math.floor(local), 3) === 2 ? null : C.brickDark;
      for (const turret of [1.5, tower - 1.5]) {
        if (g < 12 && Math.abs(local - turret) < 1.6 * (1 - (g - 2) / 10)) return g >= 10 ? C.gold : C.spire;
      }
      if (g < 9 && fromMiddle < tower * 0.32 * (1 - (g - 2) / 9)) return dx < 0 ? C.spireLight : C.spire;
      if (g >= 9 && g < 18 && fromMiddle < 0.8) return g >= 16 ? C.gold : C.spire;
      return null;
    }
    if (local < 1) return mix(C.brick, C.shadow, 0.35);
    const column = mod(Math.floor(local) - 3, 5);
    if (local >= 3 && local < tower - 3 && column < 2 && z > height * 0.2 && z < height - 5) {
      // A tall blind niche with a pointed top.
      if (z > height - 7 && column === 1) return C.brick;
      return C.brickDark;
    }
    return mod(Math.floor(z), 4) === 0 ? mix(C.brick, C.shadow, 0.12) : C.brick;
  }
  // The nave: brick with tall windows, under a steep tiled roof, ending in a gable with turrets.
  const n = local - tower;
  if (n >= 52) return null;
  const wall = height * 0.7;
  const roofTop = wall + 16;
  if (z < wall) {
    if (mod(n, 10) >= 4 && mod(n, 10) < 6 && z > wall * 0.3 && z < wall - 4) return C.opening;
    return mod(Math.floor(z), 4) === 0 ? mix(C.brick, C.shadow, 0.12) : C.brick;
  }
  if (n >= 46) {
    // The east gable with three slender turrets.
    const g = z - wall;
    for (const t of [46.5, 49, 51.5]) if (Math.abs(n - t) < 0.9 && g < 26 - Math.abs(t - 49) * 3) return g > 20 - Math.abs(t - 49) * 3 ? C.spire : C.brick;
    return g < 16 ? C.brick : null;
  }
  if (z < roofTop) return mod(Math.floor(z), 3) === 0 ? C.roofLight : C.roof;
  return null;
}

/**
 * The Żuraw, the medieval port crane on the Motława: two brick towers, and the dark timber
 * crane housing between and over them under its pitched roof.
 */
function crane(local: number, z: number, height: number): Rgb | null {
  const width = LANDMARK_WIDTH.crane;
  const timberBottom = height * 0.66;
  const timberTop = height * 0.9;
  const roofPeak = height + 6;
  if (z >= timberTop) {
    const mid = (4 + width) / 2;
    const half = (width - 4) / 2 + 1;
    const reach = half * (1 - (z - timberTop) / (roofPeak - timberTop));
    if (Math.abs(local - mid) < reach) return mod(Math.floor(z), 3) === 0 ? C.roofLight : C.roof;
    return null;
  }
  if (z >= timberBottom && local >= 4) {
    // Timber planks between dark beams, with a few small openings.
    if (mod(Math.floor(z - timberBottom), 9) === 0 || mod(Math.floor(local), 10) === 4) return C.timber;
    if (mod(Math.floor(local), 10) === 8 && mod(Math.floor(z), 9) > 3 && mod(Math.floor(z), 9) < 7) return C.opening;
    return mod(Math.floor(local), 2) === 0 ? C.timberLight : C.plank;
  }
  const leftTower = local < 11;
  const towerTop = leftTower ? height * 0.8 : height * 0.74;
  if (leftTower || local >= width - 11) {
    if (z >= towerTop) return z < towerTop + 4 && Math.abs(local - (leftTower ? 5.5 : width - 5.5)) < 5.5 * (1 - (z - towerTop) / 4) ? C.roof : null;
    if (local < 1) return mix(C.brick, C.shadow, 0.35);
    if (mod(Math.floor(z), 14) > 8 && mod(Math.floor(z), 14) < 12 && Math.abs(local - (leftTower ? 5.5 : width - 5.5)) < 1) return C.opening;
    return mod(Math.floor(z), 4) === 0 ? mix(C.brick, C.shadow, 0.12) : C.brick;
  }
  if (z < timberBottom) return mod(Math.floor(z), 4) === 0 ? mix(C.brick, C.shadow, 0.12) : C.brick;
  return null;
}

const LANDMARK_WIDTH: Record<Landmark, number> = { townHall: 16, stMarys: 82, crane: 48 };
const LANDMARKS: Record<Landmark, (local: number, z: number, height: number) => Rgb | null> = { townHall, stMarys, crane };

/** Light granite slabs in staggered rows, flecked, each slab a slightly different shade. */
function granite(x: number, y: number, slab: number): Rgb {
  const row = Math.floor(y / (slab * 0.7));
  const shift = mod(row, 2) === 0 ? 0 : slab / 2;
  if (mod(y, slab * 0.7) < 0.6 || mod(x + shift, slab) < 0.6) return C.graniteGap;
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  if (((fx * 7919 + fy * 104729) >>> 0) % 13 === 0) return C.graniteFleck;
  const tile = mod(Math.floor((x + shift) / slab) * 5 + row * 3, 7);
  return tile < 3 ? C.graniteA : tile < 5 ? C.graniteB : C.graniteC;
}

/** Big smooth concrete slabs, as on the new streets of Granary Island. */
function slabs(x: number, y: number): Rgb {
  if (mod(x, 14) < 0.6 || mod(y, 14) < 0.6) return C.slabGap;
  return mod(Math.floor(x / 14) + Math.floor(y / 14), 2) === 0 ? C.slabA : C.slabB;
}

/** The Motława: ripples on the water, darker further out, deep blue after dusk. */
function river(x: number, y: number, from: number, look?: RoomLook): Rgb {
  const out = y - from;
  let colour = out > 30 ? C.waterDeep : C.water;
  const fx = Math.floor(x / 7);
  const fy = Math.floor(y / 3);
  if (((fx * 73 + fy * 151) >>> 0) % 11 === 0 && mod(x, 7) < 4) colour = C.waterLight;
  if (look?.weather === 'rain') colour = mix(colour, C.shadow, 0.2);
  return colour;
}

/** Where the quay ends and the river begins, in front of the street. */
export const riverFrom = (layout: RoomLayout) => layout.streetY + 30;

function ground(layout: RoomLayout, x: number, y: number, look?: RoomLook, style: StreetStyle = STREET_STYLES.ogarna): Rgb {
  const { edgeX: roomX } = layout;
  // The pavement runs along the house fronts; the przedproże and its steps stand on it.
  const roomY = layout.roomY + LOW_WALL.thick;
  const pavement = (x < 0 && y >= roomY && y < roomY + 10) || (x >= roomX && y >= 0 && y < 10);
  const curb = (x < 0 && y >= roomY + 10 && y < roomY + 11.5) || (x >= roomX && y >= 10 && y < 11.5 && x > roomX + 1);
  if (curb) return C.curb;
  if (pavement) return granite(x, y, 8);
  if (style.river) {
    const water = riverFrom(layout);
    if (y >= water) return river(x, y, water, look);
    // The quay's stone edge.
    if (y >= water - 2) return y >= water - 0.8 ? C.quayEdge : C.quay;
  }
  const wet = look?.weather === 'rain' ? puddle(x, y) : null;
  if (wet) return wet;
  if (style.paving === 'granite') return granite(x, y, 12);
  if (style.paving === 'slabs') return slabs(x, y);
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
export function drawStreet(
  layout: RoomLayout,
  look: RoomLook,
  width: number,
  height: number,
  marginX: number,
  marginY: number,
  location: LocationId = 'ogarna',
): Pixels {
  const style = STREET_STYLES[location];
  const img = new Pixels(width, height);
  const { roomX } = layout;
  // Next door's houses line up with the restaurant's front wall.
  const roomY = layout.roomY + LOW_WALL.thick;
  const ox = layout.origin.ox + marginX;
  // Everything outside stands on the street, a plinth lower than the restaurant's floor.
  const oy = layout.origin.oy + marginY + PLINTH;
  // Three rows of houses: behind the back wall, above the left wall, and next door on the left.
  const behind = rowOfHouses(1997, width + 40, 56, 74, look.dusk, style);
  // The street's landmark, further back on the right, peeking over the roofs.
  const from = roomX + (style.landmark === 'stMarys' ? 16 : 30);
  const room = oy + (from + 11) / 2 - 4;
  const landmark = style.landmark && {
    draw: LANDMARKS[style.landmark],
    from,
    to: from + LANDMARK_WIDTH[style.landmark],
    height: Math.max(84, Math.round(room - 40)) + (style.landmark === 'stMarys' ? 8 : 0),
  };
  const above = rowOfHouses(1410, roomY + 1, 56, 72, look.dusk, style);
  const nextDoor = rowOfHouses(1308, width + 40, 28, 42, look.dusk, style);

  for (let py = 0; py < height; py++) {
    for (let px = 0; px < width; px++) {
      const sx = px + 0.5 - ox;
      const sy = py + 0.5 - oy;
      let sample: Sample | null;
      let haze = 0;
      let z: number;
      if (sx < -roomY) {
        // Next door on the left, fronts facing the street.
        const x = sx + roomY;
        z = (x + roomY) / 2 - sy;
        sample = z >= 0 ? houseSample(nextDoor, -x, z) : null;
      } else if (sx < 0) {
        // Above the left wall.
        const y = -sx;
        z = y / 2 - sy;
        sample = z >= 0 ? houseSample(above, y, z) : null;
        haze = 0.2;
      } else {
        // Behind the back wall, and on along the street to the right.
        z = sx / 2 - sy;
        sample = z >= 0 ? houseSample(behind, sx, z) : null;
        haze = 0.15;
        if (sample === null && landmark && z >= 0 && sx >= landmark.from && sx < landmark.to) {
          const colour = landmark.draw(sx - landmark.from, z, landmark.height);
          sample = colour ? { colour, glow: false } : null;
          haze = 0.3;
        }
      }
      if (z < 0) {
        sample = { colour: ground(layout, (sx + 2 * sy) / 2, (2 * sy - sx) / 2, look, style), glow: false };
        haze = 0;
      }
      // The sky stays see-through: the sky picture and the clouds show behind.
      if (sample === null) continue;
      let colour = sample.colour;
      const skyColour = look.dusk ? C.dusk : C.sky[look.weather];
      if (haze > 0 && !sample.glow) colour = mix(colour, skyColour, haze);
      if (look.dusk && !sample.glow) colour = mix(colour, C.dusk, 0.35);
      else if (look.weather === 'rain' && haze === 0 && colour !== C.puddle && colour !== C.puddleShine) colour = mix(colour, C.shadow, 0.12);
      img.set(px, py, colour);
    }
  }
  return img;
}
