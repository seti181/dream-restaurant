// Concept art, round 3: richer pixel art (project.md section 9.3).
// A corner of the restaurant drawn at one and a half times the detail of the game today:
// people 24 pixels wide instead of 16, wood grain and plaster, checked tablecloths, a kitchen
// with flames and steam, lamplight and window light, by day and in the evening. Plus a sheet
// comparing today's sprites with the new ones at the same size on screen.
// Run with `npx tsx scripts/pixel/concepts-v3.ts`; it writes PNGs to art/concepts/v3/.

import { mkdirSync, writeFileSync } from 'node:fs';
import { hex, mix, Pixels, type Rgb } from '../../src/ui/pixel/raster';
import { personPixels, type PersonKind } from '../../src/ui/pixel/sprites';
import { encodePng } from './raster';

const OUT = 'art/concepts/v3';

// ---------- Colours ----------

const C = {
  outline: hex('#3b2433'),
  white: hex('#ffffff'),
  // Floor: honey planks.
  plank: [hex('#c98b52'), hex('#c08049'), hex('#cf935a'), hex('#b97a44')],
  seam: hex('#7d4f2d'),
  grainDark: hex('#a96f3e'),
  grainLight: hex('#dba569'),
  slab: hex('#d9c7a4'),
  slabShade: hex('#b8a483'),
  slabDark: hex('#9c8a6c'),
  // Rug: a Kashubian-ish red border and blue field.
  rugRed: hex('#a13d2f'),
  rugRedDark: hex('#7a2c23'),
  rugCream: hex('#f1dfc0'),
  rugBlue: hex('#2f5f86'),
  rugBlueLight: hex('#4a7fa8'),
  // Walls.
  plaster: hex('#f3e3c3'),
  plasterLight: hex('#f8ecd2'),
  plasterDark: hex('#e6d2ab'),
  wainscot: hex('#8a5a3a'),
  wainscotLight: hex('#9c6a45'),
  wainscotDark: hex('#5e3b26'),
  rail: hex('#ae7b52'),
  cornice: hex('#6b4429'),
  // Window.
  frame: hex('#f4efe6'),
  frameShade: hex('#d8d0c2'),
  skyTop: hex('#8ccbea'),
  skyLow: hex('#dff2fa'),
  duskTop: hex('#2b3566'),
  duskLow: hex('#e08a6e'),
  curtain: hex('#e8d9bd'),
  curtainFold: hex('#cdb894'),
  // Gables seen through the window.
  gables: [hex('#e7a6a0'), hex('#9fd1bf'), hex('#f0c66b'), hex('#f4efe6'), hex('#a8c8e6')],
  gableShade: hex('#8a7a8e'),
  litWindow: hex('#ffd56b'),
  darkWindow: hex('#465a78'),
  // Wall decor.
  board: hex('#2f3a33'),
  boardFrame: hex('#7a5232'),
  chalk: hex('#e8e6dc'),
  chalkYellow: hex('#f1d27a'),
  gold: hex('#c9a24a'),
  goldDark: hex('#9c7a32'),
  paper: hex('#efe6d2'),
  timber: hex('#5a3a28'),
  brick: hex('#a8462f'),
  water: hex('#6fa3c4'),
  // Kitchen.
  tile: hex('#eef2f3'),
  tileGrout: hex('#c9d3d8'),
  delft: hex('#3d6fa8'),
  steel: hex('#c9d1d6'),
  steelLight: hex('#e3e8eb'),
  steelDark: hex('#8d979e'),
  copper: hex('#c97a4a'),
  copperDark: hex('#a95f36'),
  copperLight: hex('#eaa070'),
  cabinet: hex('#8a5a3a'),
  cabinetDark: hex('#6b4429'),
  flameHot: hex('#fff1a8'),
  flame: hex('#ffbf3a'),
  flameRed: hex('#f0642a'),
  steam: hex('#ffffff'),
  heatLamp: hex('#e8452a'),
  // Tables.
  checkRed: hex('#dc8577'),
  checkRedDark: hex('#c06a5e'),
  checkWhite: hex('#f6f1e7'),
  checkWhiteDark: hex('#e2d8c6'),
  plate: hex('#fbf8f2'),
  plateShade: hex('#d9d2c6'),
  pierogi: hex('#f0d9a0'),
  pierogiShade: hex('#d9b878'),
  soup: hex('#d0603a'),
  greens: hex('#6fae5a'),
  glass: hex('#cfe6f2'),
  kompot: hex('#c4475e'),
  candle: hex('#f6efd0'),
  // Chairs.
  chair: hex('#6b4128'),
  chairDark: hex('#4e2f1d'),
  chairLight: hex('#8a5a36'),
  // Plants and pots.
  leaf: hex('#4f8f45'),
  leafLight: hex('#7fbf62'),
  leafDark: hex('#346b33'),
  pot: hex('#c97a4a'),
  potDark: hex('#9c5a33'),
  // Lamps.
  shade: hex('#3c6b4f'),
  shadeDark: hex('#2b5039'),
  shadeLight: hex('#5a8f6b'),
  bulb: hex('#ffe08a'),
  glow: hex('#ffd890'),
};

// ---------- Isometric projection: x runs down-right, y down-left, z up ----------

/** Where world (0, 0, 0) lands in the picture. */
const O = { ox: 175, oy: 100 };
const W = 420;
const H = 300;
const ROOM = { x: 220, y: 150, z: 80 };

const project = (x: number, y: number, z: number) => ({ sx: O.ox + x - y, sy: O.oy + (x + y) / 2 - z });

/** A little hash for steady noise: the same pixel always gets the same value. */
const noise = (a: number, b: number, seed = 0) => {
  const n = Math.sin(a * 127.1 + b * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
};

/** An ordered 4×4 dither: lets two colours blend without mush. */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const dither = (x: number, y: number) => (BAYER[(y & 3) * 4 + (x & 3)] + 0.5) / 16;

// ---------- People: chibi, 24 pixels wide, with eyes that shine ----------

interface PersonLook {
  skin: [Rgb, Rgb];
  hair: [Rgb, Rgb, Rgb];
  hairStyle: 'short' | 'bob' | 'long' | 'bun' | 'bald' | 'spiky' | 'cap';
  shirt: [Rgb, Rgb, Rgb];
  collar: Rgb;
  pants: [Rgb, Rgb];
  shoes: Rgb;
  apron?: boolean;
  chefHat?: boolean;
  tray?: boolean;
  glasses?: boolean;
  scarf?: Rgb;
  smile?: boolean;
  /** A cap's colour (hairStyle 'cap'). */
  cap?: [Rgb, Rgb];
  /** The groups' tell-tale things: a tourist's straw hat and camera, a student's backpack, a local's Kashubian jumper. */
  sunHat?: boolean;
  camera?: boolean;
  backpack?: boolean;
  kashubian?: boolean;
}

type Pose = 'stand' | 'sit' | 'walk';

const SKIN: [Rgb, Rgb] = [hex('#f6cfaa'), hex('#e0a985')];
const SKIN_DEEP: [Rgb, Rgb] = [hex('#d9a27f'), hex('#b97f5f')];
const BLUSH = hex('#f2a08a');
const MOUTH = hex('#a8564a');
const EYE = hex('#3b2433');

/** Rows of headroom above the head, for tall hats and buns. */
const HEADROOM = 6;
const PW = 24;
const PH = 44;

/** Draws one person into a 24×44 sprite, outlined. Seated people stop at the waist (the table hides the rest). */
export function person(look: PersonLook, pose: Pose, facing: 'front' | 'back'): Pixels {
  const img = new Pixels(PW, PH);
  const set = (x: number, y: number, c: Rgb) => img.set(x, y, c);
  const T = HEADROOM;
  const cx = 11.5;
  const cy = T + 9;
  const inHead = (x: number, y: number) => ((x + 0.5 - (cx + 0.5)) / 8.3) ** 2 + ((y + 0.5 - (cy + 0.5)) / 8) ** 2 <= 1;

  // Body first, so the head sits on top of the shoulders.
  const [shirt, shirtShade, shirtLight] = look.shirt;
  const torsoTop = T + 18;
  const torsoBottom = pose === 'sit' ? T + 28 : T + 29;
  for (let y = torsoTop; y <= torsoBottom; y++) {
    const inset = y === torsoTop ? 7 : y === torsoTop + 1 || y === torsoBottom ? 6 : 5;
    for (let x = inset; x <= 23 - inset; x++) {
      // Light from the upper left: a highlight down the left, shade down the right, a fold or two.
      const fold = (y === torsoTop + 6 && (x === 9 || x === 10)) || (y === torsoTop + 8 && x === 14);
      const c = x >= 16 ? shirtShade : x <= 6 || (y === torsoTop + 1 && x <= 9) ? shirtLight : fold ? shirtShade : shirt;
      set(x, y, c);
    }
  }
  // A belt at the waist for anyone standing.
  if (pose !== 'sit' && !look.apron) for (let x = 6; x <= 17; x++) set(x, torsoBottom, x === 11 ? C.gold : look.pants[1]);
  // A little collar.
  if (facing === 'front') {
    set(10, torsoTop + 1, look.collar);
    set(13, torsoTop + 1, look.collar);
    set(11, torsoTop + 2, look.collar);
    set(12, torsoTop + 2, look.collar);
  }
  // Arms: by the sides, forward onto the table when sitting, one raised to hold a tray.
  if (pose !== 'sit' || facing === 'back') {
    const swing = pose === 'walk' ? 1 : 0;
    for (let y = T + 20; y <= T + 27 - (look.tray ? 4 : 0); y++) {
      set(3, y + swing, y > T + 25 ? look.skin[0] : shirt);
      set(4, y + swing, y > T + 25 ? look.skin[0] : shirtShade);
    }
    if (!look.tray) {
      for (let y = T + 20; y <= T + 27; y++) {
        set(19, y - swing, y > T + 25 ? look.skin[1] : shirtShade);
        set(20, y - swing, y > T + 25 ? look.skin[1] : shirtShade);
      }
    } else {
      // The tray arm: bent up at the elbow, the hand under the tray.
      for (let y = T + 17; y <= T + 25; y++) {
        set(19, y, shirtShade);
        set(20, y, y < T + 19 ? look.skin[0] : shirtShade);
      }
    }
  } else if (facing === 'front') {
    // Forearms on the table, hands holding a fork and a cup.
    for (const x of [6, 7, 8, 15, 16, 17]) set(x, T + 26, shirtShade);
    for (const x of [7, 8, 15, 16]) set(x, T + 27, look.skin[0]);
    set(9, T + 25, C.steelLight);
    set(9, T + 26, C.steel);
  }
  // Apron and chef's jacket buttons.
  if (look.apron) {
    for (let y = T + 23; y <= torsoBottom; y++) for (let x = 7; x <= 16; x++) set(x, y, x >= 15 ? hex('#e6e1d8') : hex('#fbfaf6'));
    for (let y = torsoTop + 1; y < T + 23; y++) {
      set(8, y, hex('#fbfaf6'));
      set(15, y, hex('#e6e1d8'));
    }
  }
  if (look.chefHat && facing === 'front') {
    for (const y of [T + 21, T + 24, T + 27]) {
      set(9, y, look.collar);
      set(14, y, look.collar);
    }
  }
  if (look.scarf) {
    for (let x = 7; x <= 16; x++) set(x, torsoTop, look.scarf);
    for (let y = torsoTop + 1; y <= torsoTop + 5; y++) set(15, y, look.scarf);
  }
  // Legs and shoes for anyone standing.
  if (pose !== 'sit') {
    const [pants, pantsShade] = look.pants;
    const step = pose === 'walk' ? 1 : 0;
    for (let y = T + 30; y <= T + 35; y++) {
      for (let x = 7; x <= 10; x++) set(x, y - step, x === 10 ? pantsShade : pants);
      for (let x = 13; x <= 16; x++) set(x, y + step - step, x === 16 ? pantsShade : pants);
    }
    for (let x = 6; x <= 10; x++) set(x, T + 36 - step, look.shoes);
    for (let x = 13; x <= 17; x++) set(x, T + 36, look.shoes);
    set(7, T + 36 - step, mix(look.shoes, C.white, 0.35));
    set(14, T + 36, mix(look.shoes, C.white, 0.35));
  }

  // The head.
  const [skin, skinShade] = look.skin;
  for (let y = T; y <= T + 18; y++) {
    for (let x = 2; x <= 21; x++) {
      if (!inHead(x, y)) continue;
      set(x, y, x >= 17 || y >= T + 17 ? skinShade : skin);
    }
  }
  // Hair.
  const [hair, hairShade, hairLight] = look.hair;
  const hairAt = (x: number, y: number) => {
    if (look.hairStyle === 'bald') return false;
    if (facing === 'back') return inHead(x, y) && y <= cy + (look.hairStyle === 'short' || look.hairStyle === 'spiky' || look.hairStyle === 'cap' ? 6 : 9);
    if (!inHead(x, y) && !(look.hairStyle === 'long' || look.hairStyle === 'bob')) return false;
    const side = Math.abs(x + 0.5 - (cx + 0.5));
    if (y <= cy - 3) return inHead(x, y);
    if (y === cy - 2) return inHead(x, y) && !(x === 9 || x === 10 || x === 14);
    const sideLength = { short: 0, spiky: 0, cap: 0, bun: 1, bob: 6, long: 6, bald: 0 }[look.hairStyle];
    return side >= 6.5 && y <= cy + sideLength && (inHead(x, y) || side <= 9.5);
  };
  for (let y = 0; y < PH; y++) {
    for (let x = 0; x < PW; x++) {
      if (!hairAt(x, y)) continue;
      const shine = (y === T + 2 && x >= 7 && x <= 10) || (y === T + 3 && x === 6);
      // A few darker strands, so the hair isn't one flat colour.
      const strand = (x + 2 * y) % 5 === 0 && y > T + 1;
      set(x, y, shine ? hairLight : x >= 16 || strand ? hairShade : hair);
    }
  }
  // A pointed fringe over the forehead.
  if (facing === 'front' && look.hairStyle !== 'bald' && look.hairStyle !== 'cap') {
    for (const x of [6, 9, 12, 15]) if (inHead(x, cy - 1)) set(x, cy - 1, hairShade);
  }
  if (look.hairStyle === 'long' && facing === 'front') {
    for (let y = cy + 6; y <= T + 25; y++) {
      for (const x of [3, 4, 19, 20]) set(x, y, x >= 19 ? hairShade : hair);
    }
  }
  if (look.hairStyle === 'long' && facing === 'back') {
    for (let y = cy + 6; y <= T + 25; y++) for (let x = 6; x <= 17; x++) set(x, y, x >= 15 ? hairShade : hair);
  }
  if (look.hairStyle === 'bun') {
    for (let y = T - 4; y <= T + 1; y++) {
      for (let x = 9; x <= 14; x++) if ((x - 11.5) ** 2 / 9 + (y - (T - 1.5)) ** 2 / 9 <= 1) set(x, y, x >= 13 ? hairShade : hair);
    }
  }
  if (look.hairStyle === 'spiky') {
    for (const [px, h] of [
      [5, 3],
      [8, 4],
      [11, 5],
      [14, 4],
      [17, 3],
    ]) {
      for (let k = 0; k < h; k++) for (let dx = -Math.max(0, 1 - Math.floor(k / 2)); dx <= Math.max(0, 1 - Math.floor(k / 2)); dx++) set(px + dx, T + 1 - k, hair);
    }
  }
  if (look.hairStyle === 'cap' && look.cap) {
    const [cap, capShade] = look.cap;
    for (let y = T - 1; y <= T + 5; y++) for (let x = 3; x <= 20; x++) if (inHead(x, y + 1) || y === T + 5) set(x, y, x >= 16 ? capShade : cap);
    for (let x = 2; x <= 21; x++) set(x, T + 6, capShade);
  }
  if (look.hairStyle === 'bald') {
    set(8, T + 2, mix(skin, C.white, 0.6));
    set(9, T + 2, mix(skin, C.white, 0.6));
    set(7, T + 3, mix(skin, C.white, 0.4));
  }
  // The face.
  if (facing === 'front') {
    for (const ex of [7, 14]) {
      for (let y = cy; y <= cy + 2; y++) {
        set(ex, y, EYE);
        set(ex + 1, y, EYE);
      }
      set(ex, cy, C.white);
      // Brows.
      set(ex, cy - 2, hairShade);
      set(ex + 1, cy - 2, hairShade);
    }
    set(5, cy + 3, BLUSH);
    set(6, cy + 3, BLUSH);
    set(17, cy + 3, BLUSH);
    set(18, cy + 3, BLUSH);
    if (look.smile) {
      set(10, cy + 4, MOUTH);
      set(13, cy + 4, MOUTH);
      set(11, cy + 5, MOUTH);
      set(12, cy + 5, MOUTH);
    } else {
      set(11, cy + 4, MOUTH);
      set(12, cy + 4, MOUTH);
    }
    if (look.glasses) {
      for (const ex of [6, 13]) {
        for (let y = cy - 1; y <= cy + 3; y++) {
          set(ex, y, hex('#5e6a73'));
          set(ex + 3, y, hex('#5e6a73'));
        }
        for (let x = ex; x <= ex + 3; x++) {
          set(x, cy - 1, hex('#5e6a73'));
          set(x, cy + 3, hex('#5e6a73'));
        }
      }
      set(10, cy, hex('#5e6a73'));
      set(11, cy, hex('#5e6a73'));
      set(12, cy, hex('#5e6a73'));
    }
  }
  // A straw sun hat with a red band.
  if (look.sunHat) {
    const straw = hex('#f1d9a0');
    const strawShade = hex('#d4b679');
    for (let y = T - 3; y <= T + 4; y++) {
      for (let x = 0; x < PW; x++) {
        const crown = y <= T + 2 && x >= 6 && x <= 17 && ((x - 11.5) / 6.5) ** 2 + ((y - (T + 2)) / 5) ** 2 <= 1;
        const brim = (y === T + 3 || y === T + 4) && x >= 1 && x <= 22;
        if (crown || brim) set(x, y, y === T + 2 && crown ? hex('#b5452f') : x >= 17 || y === T + 4 ? strawShade : straw);
      }
    }
  }
  // A camera on a strap, a backpack's straps, a Kashubian pattern on the jumper.
  if (look.camera && facing === 'front') {
    for (let y = torsoTop + 5; y <= torsoTop + 7; y++) for (let x = 8; x <= 12; x++) set(x, y, hex('#2e2a33'));
    set(10, torsoTop + 6, hex('#7fb2d3'));
    set(11, torsoTop + 5, hex('#c9d1d6'));
  }
  if (look.backpack) {
    if (facing === 'front') {
      for (let y = torsoTop + 1; y <= torsoTop + 9; y++) {
        set(7, y, hex('#3c6b4f'));
        set(16, y, hex('#2b5039'));
      }
    } else {
      for (let y = torsoTop + 1; y <= torsoTop + 9; y++) for (let x = 6; x <= 17; x++) set(x, y, y === torsoTop + 5 ? hex('#2b5039') : x >= 15 ? hex('#2b5039') : hex('#3c6b4f'));
    }
  }
  if (look.kashubian && facing === 'front') {
    for (let x = 7; x <= 16; x++) {
      if (x % 3 === 1) set(x, torsoTop + 3, hex('#fbf3e4'));
      if (x % 3 === 2) set(x, torsoTop + 4, hex('#f1d27a'));
      if (x % 3 === 1) set(x, torsoTop + 5, hex('#fbf3e4'));
    }
  }
  // A chef's toque.
  if (look.chefHat) {
    for (let y = T - 6; y <= T + 2; y++) {
      for (let x = 5; x <= 18; x++) {
        const puff = y < T - 1 ? ((x - 11.5) / 7) ** 2 + ((y - (T - 3)) / 3.4) ** 2 <= 1 : x >= 6 && x <= 17;
        if (puff) set(x, y, x >= 15 ? hex('#e6e1d8') : hex('#fbfaf6'));
      }
    }
    for (const x of [8, 11, 14]) set(x, T - 4, hex('#e6e1d8'));
    for (let x = 6; x <= 17; x++) set(x, T + 2, hex('#e6e1d8'));
  }
  // A round tray on the raised hand, with a plate of pierogi and a glass of kompot.
  if (look.tray && facing === 'front') {
    for (let x = 14; x <= 23; x++) {
      set(x, T + 15, C.steelLight);
      set(x, T + 16, C.steelDark);
    }
    for (let x = 15; x <= 20; x++) set(x, T + 14, C.plate);
    set(16, T + 13, C.pierogi);
    set(17, T + 13, C.pierogi);
    set(18, T + 13, C.pierogiShade);
    set(19, T + 13, C.greens);
    for (let y = T + 10; y <= T + 14; y++) set(22, y, y > T + 11 ? C.kompot : C.glass);
  }
  img.outline(C.outline);
  return img;
}

// The people in the scene.
const GUESTS: Record<string, PersonLook> = {
  tourist: {
    skin: SKIN,
    hair: [hex('#e8c06a'), hex('#c99a45'), hex('#f6dc96')],
    hairStyle: 'bob',
    shirt: [hex('#e9a23b'), hex('#c47f22'), hex('#f2bc68')],
    collar: hex('#fbf3e4'),
    pants: [hex('#5d7aa8'), hex('#465f86')],
    shoes: hex('#4a3426'),
    smile: true,
    sunHat: true,
    camera: true,
  },
  student: {
    skin: SKIN_DEEP,
    hair: [hex('#2e2a33'), hex('#1f1c23'), hex('#4a4552')],
    hairStyle: 'spiky',
    shirt: [hex('#4f9a4a'), hex('#3a7a37'), hex('#6fb86a')],
    collar: hex('#d9e8c8'),
    pants: [hex('#5d7aa8'), hex('#465f86')],
    shoes: hex('#2e2a33'),
    smile: true,
    backpack: true,
  },
  local: {
    skin: SKIN,
    hair: [hex('#c9c4bd'), hex('#a39e97'), hex('#e8e4de')],
    hairStyle: 'bun',
    shirt: [hex('#b5452f'), hex('#8c3322'), hex('#cf6a52')],
    collar: hex('#f1e2c4'),
    pants: [hex('#4a4a55'), hex('#36363f')],
    shoes: hex('#4a3426'),
    kashubian: true,
  },
  office: {
    skin: SKIN,
    hair: [hex('#6b3d24'), hex('#4a2a18'), hex('#8a5233')],
    hairStyle: 'short',
    shirt: [hex('#7fb2d3'), hex('#5d8aa8'), hex('#a3cbe4')],
    collar: hex('#b5452f'),
    pants: [hex('#55545e'), hex('#3f3e47')],
    shoes: hex('#2e2a33'),
    glasses: true,
  },
  foodie: {
    skin: SKIN_DEEP,
    hair: [hex('#a0522d'), hex('#7a3d20'), hex('#c27448')],
    hairStyle: 'long',
    shirt: [hex('#7b4f9d'), hex('#5e3a7a'), hex('#9a70bb')],
    collar: hex('#f1e2c4'),
    pants: [hex('#3d3a46'), hex('#2a2830')],
    shoes: hex('#2e2a33'),
    scarf: hex('#f1e2c4'),
    smile: true,
  },
};

const WAITER: PersonLook = {
  skin: SKIN,
  hair: [hex('#4a2a18'), hex('#331d10'), hex('#6b4128')],
  hairStyle: 'short',
  shirt: [hex('#2e2a33'), hex('#1f1c23'), hex('#45404d')],
  collar: hex('#fbfaf6'),
  pants: [hex('#2e2a33'), hex('#1f1c23')],
  shoes: hex('#1f1c23'),
  apron: true,
  tray: true,
  smile: true,
};

const CHEF: PersonLook = {
  skin: SKIN,
  hair: [hex('#c9c4bd'), hex('#a39e97'), hex('#e8e4de')],
  hairStyle: 'short',
  shirt: [hex('#fbfaf6'), hex('#e0dbd2'), hex('#ffffff')],
  collar: hex('#7a8792'),
  pants: [hex('#3b3a44'), hex('#2a2930')],
  shoes: hex('#2e2a33'),
  chefHat: true,
  smile: true,
};

// ---------- Drawing in the room: boxes with textured faces, sprites, layers ----------

interface Box3 {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

type Face = (a: number, b: number) => Rgb | null;

/** A box whose faces are coloured pixel by pixel: the top by (x, y), the front-left side (y = y1) by (x, z), the front-right side (x = x1) by (y, z). */
function texBox(img: Pixels, b: Box3, top: Face, left: Face, right: Face): void {
  const x0 = Math.floor(O.ox + b.x0 - b.y1) - 1;
  const x1 = Math.ceil(O.ox + b.x1 - b.y0) + 1;
  const y0 = Math.floor(O.oy + (b.x0 + b.y0) / 2 - b.z1) - 1;
  const y1 = Math.ceil(O.oy + (b.x1 + b.y1) / 2 - b.z0) + 1;
  for (let py = y0; py <= y1; py++) {
    for (let px = x0; px <= x1; px++) {
      const sx = px + 0.5 - O.ox;
      const sy = py + 0.5 - O.oy;
      const tx = (sx + 2 * (sy + b.z1)) / 2;
      const ty = (2 * (sy + b.z1) - sx) / 2;
      if (tx >= b.x0 && tx < b.x1 && ty >= b.y0 && ty < b.y1) {
        const c = top(tx, ty);
        if (c) img.set(px, py, c);
        continue;
      }
      const lx = sx + b.y1;
      const lz = (lx + b.y1) / 2 - sy;
      if (lx >= b.x0 && lx < b.x1 && lz >= b.z0 && lz < b.z1) {
        const c = left(lx, lz);
        if (c) img.set(px, py, c);
        continue;
      }
      const ry = b.x1 - sx;
      const rz = (b.x1 + ry) / 2 - sy;
      if (ry >= b.y0 && ry < b.y1 && rz >= b.z0 && rz < b.z1) {
        const c = right(ry, rz);
        if (c) img.set(px, py, c);
      }
    }
  }
}

/** A plain box: one colour per face. */
const flatBox = (img: Pixels, b: Box3, top: Rgb, left: Rgb, right: Rgb) => texBox(img, b, () => top, () => left, () => right);

/** A sprite with its bottom-centre on a world point; empty margins are trimmed first. */
function placeSprite(img: Pixels, s: Pixels, x: number, y: number, z: number): void {
  const b = s.bounds();
  if (!b) return;
  const t = s.crop(b.x, b.y, b.width, b.height);
  const { sx, sy } = project(x, y, z);
  img.draw(t, Math.round(sx - t.width / 2), Math.round(sy - t.height));
}

/** A sprite from rows of letters and a palette ('.' is see-through). */
function rows(lines: string[], palette: Record<string, Rgb>): Pixels {
  const img = new Pixels(Math.max(...lines.map((l) => l.length)), lines.length);
  lines.forEach((line, y) => [...line].forEach((ch, x) => palette[ch] && img.set(x, y, palette[ch])));
  return img;
}

interface Thing {
  depth: number;
  draw: (l: Pixels) => void;
  /** Most things get a dark outline; soft things (steam, flame) don't. */
  outline?: boolean;
}

/** A light in the picture, in screen pixels: a warm pool, stronger in the evening. */
interface Glow {
  x: number;
  y: number;
  rx: number;
  ry: number;
  colour: Rgb;
  day: number;
  evening: number;
}

const xy = (p: { sx: number; sy: number }) => ({ x: p.sx, y: p.sy });

// ---------- The floor and the walls ----------

const RUG = { x0: 74, x1: 150, y0: 60, y1: 110 };

/** Soft shadows on the floor, as world ellipses: under tables, people, counters. */
const SHADOWS: { x: number; y: number; rx: number; ry: number; k: number }[] = [];

function rugColour(x: number, y: number): Rgb {
  const edge = Math.min(x - RUG.x0, RUG.x1 - 1 - x, y - RUG.y0, RUG.y1 - 1 - y);
  if (edge < 1) return C.rugRedDark;
  if (edge < 5) return (Math.floor(x) + Math.floor(y)) % 6 === 0 ? C.rugCream : C.rugRed;
  if (edge < 7) return C.rugCream;
  const u = ((((x - RUG.x0) % 14) + 14) % 14) - 7;
  const v = ((((y - RUG.y0) % 14) + 14) % 14) - 7;
  const d = Math.abs(Math.round(u)) + Math.abs(Math.round(v));
  if (d === 5) return C.rugCream;
  if (d <= 1) return C.rugRed;
  return dither(Math.floor(x), Math.floor(y)) < 0.25 ? C.rugBlueLight : C.rugBlue;
}

function floorColour(x: number, y: number, evening: boolean): Rgb {
  const fx = Math.floor(x);
  const fy = Math.floor(y);
  let c: Rgb;
  const fringe = (x >= RUG.x0 - 3 && x < RUG.x0) || (x >= RUG.x1 && x < RUG.x1 + 3);
  if (x >= RUG.x0 && x < RUG.x1 && y >= RUG.y0 && y < RUG.y1) {
    c = rugColour(x, y);
  } else if (fringe && y >= RUG.y0 + 1 && y < RUG.y1 - 1 && fy % 3 === 0) {
    c = C.rugCream;
  } else {
    // Planks along x, seven units wide, in staggered lengths.
    const rowH = 7;
    const r = Math.floor(y / rowH);
    const off = (r * 29) % 44;
    const u = (x + off) % 44;
    const b = Math.floor((x + off) / 44);
    c = C.plank[(r * 3 + b * 5) % 4];
    if (y % rowH < 0.9 || u < 0.9) c = C.seam;
    else if (fy % rowH === 3 && noise(Math.floor(fx / 2), r * 7 + b) > 0.78) c = C.grainDark;
    else if (noise(fx, fy, 2) > 0.985) c = C.grainLight;
  }
  // Sunlight through the window (by day): a warm patch slanting across the floor.
  if (!evening) {
    const near = y - 0.42 * x;
    if (x < 70 && near > 34 && near < 82) {
      const inside = Math.min(near - 34, 82 - near, 70 - x) / 5;
      if (inside >= 1 || dither(fx, fy) < inside) c = mix(c, hex('#fff1c8'), 0.28);
    }
  }
  // A little darker along the walls, and under things.
  if (x < 8) c = mix(c, C.wainscotDark, ((8 - x) / 8) * 0.25);
  if (y < 8) c = mix(c, C.wainscotDark, ((8 - y) / 8) * 0.25);
  for (const s of SHADOWS) {
    const d = ((x - s.x) / s.rx) ** 2 + ((y - s.y) / s.ry) ** 2;
    if (d < 1 && (d < 0.7 || dither(fx, fy) > (d - 0.7) / 0.3)) c = mix(c, hex('#4e2f1d'), s.k);
  }
  return c;
}

/** Plaster, wainscoting, rails and the cornice: what both walls are made of. */
function wallBase(u: number, z: number): Rgb {
  if (z >= 76) return C.cornice;
  if (z >= 74) return C.rail;
  if (z < 22) {
    if (z < 2) return C.wainscotDark;
    if (z >= 20) return C.rail;
    const pu = u % 12;
    if (pu < 1) return C.wainscotDark;
    if (pu < 2) return C.wainscotLight;
    // A raised panel on each board.
    const panelEdge = (pu >= 3 && pu < 11 && (Math.abs(z - 5) < 0.5 || Math.abs(z - 16) < 0.5)) || ((Math.abs(pu - 3) < 0.5 || Math.abs(pu - 10.5) < 0.5) && z > 5 && z < 16);
    return panelEdge ? C.wainscotDark : C.wainscot;
  }
  if (z >= 62 && z < 63) return C.rail;
  const n = noise(Math.floor(u), Math.floor(z), 3);
  const base = n < 0.07 ? C.plasterDark : n > 0.95 ? C.plasterLight : C.plaster;
  return z > 66 ? mix(base, C.plasterDark, 0.12) : base;
}

/** The view out of the window: sky and Gdańsk gables. */
function windowView(gx: number, gz: number, evening: boolean): Rgb {
  const t = Math.min(1, Math.max(0, gz / 34));
  let c = evening ? mix(C.duskLow, C.duskTop, t) : mix(C.skyLow, C.skyTop, t);
  const house = Math.floor((gx + 3) / 9);
  const hx = (gx + 3) % 9;
  const wall = 10 + ((house * 7) % 5);
  const step = Math.floor((gz - wall) / 2);
  const inGable = gz < wall + 6 && (gz < wall || Math.abs(hx - 4) <= 3 - step);
  if (inGable) {
    const isWindow = (Math.floor(hx) === 2 || Math.floor(hx) === 6) && Math.floor(gz) % 5 === 2 && gz < wall;
    c = C.gables[house % C.gables.length];
    if (hx < 1) c = C.gableShade;
    if (evening) c = mix(c, C.duskTop, 0.45);
    if (isWindow) c = evening && (house + Math.floor(gz)) % 3 !== 0 ? C.litWindow : C.darkWindow;
  }
  return c;
}

/** The left wall (x = 0): a window with curtains. u runs along y. */
function leftWall(u: number, z: number, evening: boolean): Rgb {
  const W0 = 36;
  const W1 = 84;
  if (u >= W0 && u < W1 && z >= 30 && z < 66) {
    const wu = u - W0;
    const wz = z - 30;
    const frame = wu < 3 || wu >= W1 - W0 - 3 || wz < 3 || wz >= 33 || (wu >= 23 && wu < 25) || (wz >= 17 && wz < 19);
    if (frame) return wu < 1 || wz >= 35 ? C.frameShade : C.frame;
    return windowView(wu, wz - 3, evening);
  }
  // Curtains gathered on either side, with a tie-back.
  const left = u >= W0 - 8 && u < W0 + 1;
  const right = u >= W1 - 1 && u < W1 + 8;
  if ((left || right) && z >= 24 && z < 70) {
    if (z >= 40 && z < 42) return C.gold;
    return Math.floor(u) % 3 === 0 ? C.curtainFold : C.curtain;
  }
  if (z >= 70 && z < 72 && u >= W0 - 10 && u < W1 + 10) return C.goldDark;
  return wallBase(u, z);
}

/** The right wall (y = 0): a print of the Żuraw, the specials board, a clock, then the kitchen tiles. u runs along x. */
function rightWall(u: number, z: number): Rgb {
  // Kitchen tiles behind the stove, blue-and-white like the old Gdańsk ones.
  if (u >= 146 && z >= 22 && z < 56) {
    const tu = Math.floor(u - 146) % 8;
    const tz = Math.floor(z - 22) % 8;
    if (tu === 0 || tz === 0) return C.tileGrout;
    const tile = Math.floor((u - 146) / 8) + Math.floor((z - 22) / 8);
    if (tile % 2 === 0 && ((tu === 4 && tz >= 2 && tz <= 6) || (tz === 4 && tu >= 2 && tu <= 6))) return C.delft;
    if (tile % 2 === 1 && (tu === 4 || tu === 3) && (tz === 4 || tz === 3)) return C.delft;
    return C.tile;
  }
  // A framed print of the Żuraw over the Motława.
  if (u >= 22 && u < 58 && z >= 32 && z < 58) {
    const pu = u - 22;
    const pz = z - 32;
    if (pu < 2 || pu >= 34 || pz < 2 || pz >= 24) return pu < 1 || pz >= 25 ? C.goldDark : C.gold;
    if (pz < 6) return Math.floor(pu + pz) % 5 === 0 ? hex('#9fd0e6') : C.water;
    if ((pu >= 8 && pu < 12) || (pu >= 24 && pu < 28)) return pz < 16 ? (Math.floor(pz) % 3 === 0 ? hex('#7c3221') : C.brick) : C.paper;
    if (pu >= 12 && pu < 24 && pz >= 9 && pz < 20) return Math.floor(pu) % 4 === 0 ? hex('#3d2719') : C.timber;
    return C.paper;
  }
  // The specials board: "Dziś polecamy", a pierogi drawn in chalk, and a price.
  if (u >= 68 && u < 108 && z >= 28 && z < 62) {
    const bu = u - 68;
    const bz = z - 28;
    if (bu < 2 || bu >= 38 || bz < 2 || bz >= 32) return C.boardFrame;
    const fu = Math.floor(bu);
    const fz = Math.floor(bz);
    if (fz >= 26 && fz <= 27 && fu >= 5 && fu <= 33 && fu % 4 !== 3) return C.chalk;
    if (fz >= 22 && fz <= 23 && fu >= 9 && fu <= 29 && fu % 3 !== 2) return C.chalkYellow;
    const pd = ((bu - 19) / 8) ** 2 + ((bz - 13) / 5) ** 2;
    if (pd <= 1 && pd > 0.6 && bz >= 12.5) return C.chalk;
    if (Math.abs(bz - 13) < 0.6 && bu > 11 && bu < 27) return C.chalk;
    if (fz === 15 && fu % 3 === 0 && fu > 13 && fu < 25) return C.chalk;
    if (fz >= 4 && fz <= 5 && fu >= 14 && fu <= 23 && fu % 3 !== 1) return C.chalkYellow;
    return dither(fu, fz) < 0.06 ? hex('#3c4a42') : C.board;
  }
  // A round clock.
  const cd = Math.hypot(u - 126, z - 56);
  if (cd < 6.5) {
    if (cd >= 5.4) return C.cornice;
    if ((Math.abs(u - 126) < 0.6 && z > 56 && z < 60.5) || (Math.abs(z - 56) < 0.6 && u > 126 && u < 129.5)) return C.outline;
    return C.paper;
  }
  return wallBase(u, z);
}

/** Walls, floor and the floor's cut edge, before anything stands in the room. */
function drawRoomShell(img: Pixels, evening: boolean): void {
  for (let py = 0; py < H; py++) {
    for (let px = 0; px < W; px++) {
      const sx = px + 0.5 - O.ox;
      const sy = py + 0.5 - O.oy;
      // The floor (z = 0).
      const fx = (sx + 2 * sy) / 2;
      const fy = (2 * sy - sx) / 2;
      if (fx >= 0 && fx < ROOM.x && fy >= 0 && fy < ROOM.y) {
        img.set(px, py, floorColour(fx, fy, evening));
        continue;
      }
      // The left wall (x = 0).
      const ly = -sx;
      const lz = ly / 2 - sy;
      if (ly >= 0 && ly < ROOM.y && lz >= 0 && lz < ROOM.z) {
        img.set(px, py, leftWall(ly, lz, evening));
        continue;
      }
      // The right wall (y = 0).
      const rz = sx / 2 - sy;
      if (sx >= 0 && sx < ROOM.x && rz >= 0 && rz < ROOM.z) {
        img.set(px, py, rightWall(sx, rz));
        continue;
      }
      // The floor's thickness, cut away like a doll's house: the front (y = 150) and the side (x = 220).
      const ex = sx + ROOM.y;
      const ez = (ex + ROOM.y) / 2 - sy;
      if (ex >= 0 && ex < ROOM.x && ez >= -9 && ez < 0) {
        img.set(px, py, ez > -1.5 ? C.slab : Math.floor(ex) % 18 < 1 ? C.slabDark : C.slabShade);
        continue;
      }
      const ey = ROOM.x - sx;
      const ez2 = (ROOM.x + ey) / 2 - sy;
      if (ey >= 0 && ey < ROOM.y && ez2 >= -9 && ez2 < 0) img.set(px, py, ez2 > -1.5 ? C.slab : C.slabDark);
    }
  }
}

// ---------- Furniture and things ----------

const WOOD = { top: hex('#a8754e'), left: hex('#8a5a3a'), right: hex('#6b4429') };

/** A bentwood chair: the seat, and the back (behind the sitter, or between them and us). */
function chairParts(x: number, y: number, back: 'far' | 'near'): Thing[] {
  const seat: Thing = {
    depth: x + y - 0.5,
    draw: (l) => {
      for (const [lx, ly] of [
        [x - 4, y - 4],
        [x + 3, y - 4],
        [x - 4, y + 3],
        [x + 3, y + 3],
      ])
        flatBox(l, { x0: lx, x1: lx + 1, y0: ly, y1: ly + 1, z0: 0, z1: 10 }, C.chairDark, C.chair, C.chairDark);
      flatBox(l, { x0: x - 4.5, x1: x + 4.5, y0: y - 4.5, y1: y + 4.5, z0: 10, z1: 12 }, C.chairLight, C.chair, C.chairDark);
    },
  };
  const by = back === 'far' ? y - 4.5 : y + 3.5;
  const chairBack: Thing = {
    depth: back === 'far' ? x + y - 1 : x + y + 6,
    draw: (l) => {
      flatBox(l, { x0: x - 4.5, x1: x - 3, y0: by, y1: by + 1, z0: 12, z1: 30 }, C.chairLight, C.chair, C.chairDark);
      flatBox(l, { x0: x + 3, x1: x + 4.5, y0: by, y1: by + 1, z0: 12, z1: 30 }, C.chairLight, C.chair, C.chairDark);
      flatBox(l, { x0: x - 4.5, x1: x + 4.5, y0: by, y1: by + 1, z0: 25, z1: 30 }, C.chairLight, C.chair, C.chairDark);
      flatBox(l, { x0: x - 1, x1: x + 1, y0: by, y1: by + 1, z0: 12, z1: 25 }, C.chairLight, C.chair, C.chairDark);
    },
  };
  return [seat, chairBack];
}

const check = (a: number, b: number, light: boolean): Rgb =>
  (Math.floor(a / 4) + Math.floor(b / 4)) % 2 === 0 ? (light ? C.checkRed : C.checkRedDark) : light ? C.checkWhite : C.checkWhiteDark;

const PLATE_PIEROGI = rows(['.pppppp.', 'pqqrrqqp', '.pppppp.'], { p: C.plate, q: C.pierogi, r: C.pierogiShade });
const PLATE_SOUP = rows(['.pppppp.', 'pssssggp', '.pppppp.'], { p: C.plate, s: C.soup, g: C.greens });
const GLASS = rows(['gg', 'kk', 'kk'], { g: C.glass, k: C.kompot });
const VASE = rows(['.r.', 'ryr', '.l.', '.v.', '.v.'], { r: hex('#d9412b'), y: hex('#f1d27a'), l: C.leaf, v: hex('#9fd0e6') });
const CANDLE = rows(['.f.', '.F.', '.c.', '.c.', 'hhh'], { f: C.flameHot, F: C.flame, c: C.candle, h: C.goldDark });

/** A table with a checked tablecloth hanging down its sides, and what's on it. */
function table(x0: number, y0: number, x1: number, y1: number, things: { s: Pixels; x: number; y: number }[]): Thing {
  SHADOWS.push({ x: (x0 + x1) / 2 + 2, y: (y0 + y1) / 2 + 2, rx: (x1 - x0) / 2 + 3, ry: (y1 - y0) / 2 + 3, k: 0.22 });
  return {
    depth: x1 + y1,
    draw: (l) => {
      for (const [lx, ly] of [
        [x0 + 2, y0 + 2],
        [x1 - 3, y0 + 2],
        [x0 + 2, y1 - 3],
        [x1 - 3, y1 - 3],
      ])
        flatBox(l, { x0: lx, x1: lx + 1.5, y0: ly, y1: ly + 1.5, z0: 0, z1: 10 }, C.chairDark, C.chair, C.chairDark);
      texBox(
        l,
        { x0, x1, y0, y1, z0: 9, z1: 17 },
        (x, y) => check(x, y, true),
        (x, z) => check(x, z, false),
        (y, z) => (check(y, z, false)[0] === C.checkWhiteDark[0] ? hex('#d6cbb6') : C.checkRedDark),
      );
      for (const t of things) placeSprite(l, t.s, t.x, t.y, 17);
    },
  };
}

// ---------- The scene ----------

const GULL = rows(['....oo..', '...owwo.', '..owwwwY', '.owwwwwo', 'oGGwwwo.', 'oGGGwwo.', '.ooKoo..', '...p.p..'], {
  o: C.outline,
  w: C.white,
  Y: hex('#f1c232'),
  G: hex('#a8b0b8'),
  K: hex('#2e2a33'),
  p: hex('#e8a0a0'),
});

/** A brass wall lamp with a green glass shade. */
const SCONCE = rows(['.ssss.', 'sLsssd', 'sssssd', '.bbbb.', '..gg..', '..g...', 'gggg..'], {
  s: C.shade,
  L: C.shadeLight,
  d: C.shadeDark,
  b: C.bulb,
  g: C.gold,
});

function scene(evening: boolean): { img: Pixels; glows: Glow[] } {
  SHADOWS.length = 0;
  const things: Thing[] = [];
  const glows: Glow[] = [];
  const at = project;

  // The window sill, with a gull looking in.
  things.push({
    depth: 0,
    draw: (l) => {
      flatBox(l, { x0: 0, x1: 6, y0: 34, y1: 86, z0: 27, z1: 30 }, C.frame, C.frameShade, C.frameShade);
      placeSprite(l, GULL, 3, 70, 30);
    },
  });

  // A shelf on the left wall with jars: pickles, honey, cherries.
  things.push({
    depth: 2,
    draw: (l) => {
      flatBox(l, { x0: 0, x1: 7, y0: 100, y1: 144, z0: 48, z1: 51 }, WOOD.top, WOOD.left, WOOD.right);
      const jars: Rgb[] = [hex('#7a9e4b'), hex('#e9a23b'), hex('#b5452f'), hex('#f1e2c4'), hex('#7a9e4b')];
      jars.forEach((c, i) => {
        const y = 104 + i * 8;
        flatBox(l, { x0: 1, x1: 6, y0: y, y1: y + 5, z0: 51, z1: 58 }, mix(c, C.white, 0.3), c, mix(c, C.outline, 0.25));
        flatBox(l, { x0: 1.5, x1: 5.5, y0: y + 0.5, y1: y + 4.5, z0: 58, z1: 59.5 }, C.gold, C.goldDark, C.goldDark);
      });
    },
  });

  // The kitchen: a counter with the stove, a pot steaming, a pan on the flame, copper pans on the wall.
  SHADOWS.push({ x: 183, y: 21, rx: 38, ry: 4, k: 0.25 });
  things.push({
    depth: 160,
    draw: (l) => {
      for (const [px, r] of [
        [154, 6],
        [168, 7],
        [182, 5],
      ]) {
        const { sx, sy } = at(px, 1, 47);
        for (let dy = -r; dy <= r; dy++)
          for (let dx = -r; dx <= r; dx++) {
            if (dx * dx + dy * dy > r * r) continue;
            const c = dx * dx + dy * dy > (r - 1.5) ** 2 ? C.copperDark : dx < -1 && dy < -1 ? C.copperLight : C.copper;
            l.set(sx + dx, sy + dy + r, c);
          }
        for (let k = 0; k < 4; k++) l.set(sx, sy - k, C.outline);
      }
      texBox(
        l,
        { x0: 146, x1: 218, y0: 2, y1: 20, z0: 0, z1: 24 },
        (x, y) => {
          if (x >= 158 && x < 194 && y >= 4 && y < 17) {
            const ring = Math.min(Math.abs(Math.hypot(x - 167, y - 10) - 3.5), Math.abs(Math.hypot(x - 183, y - 10) - 3.5));
            return ring < 0.7 ? hex('#7a7f86') : hex('#3b3f45');
          }
          return y < 3 ? C.steelLight : C.steel;
        },
        (x, z) => {
          if (z > 22) return C.steelDark;
          const door = Math.floor(x - 146) % 12;
          if (door < 1) return C.cabinetDark;
          if (door === 9 && z > 12 && z < 16) return C.gold;
          return z < 2 ? C.cabinetDark : C.cabinet;
        },
        () => C.cabinetDark,
      );
      // A pot of żurek, and a pan of pierogi frying.
      flatBox(l, { x0: 162, x1: 172, y0: 5, y1: 15, z0: 24, z1: 33 }, C.steelLight, C.steel, C.steelDark);
      flatBox(l, { x0: 163, x1: 171, y0: 6, y1: 14, z0: 33, z1: 33.5 }, C.soup, C.soup, C.soup);
      flatBox(l, { x0: 178, x1: 189, y0: 6, y1: 14, z0: 24, z1: 27 }, hex('#3b3f45'), hex('#2e2a33'), hex('#2e2a33'));
      flatBox(l, { x0: 189, x1: 198, y0: 9, y1: 11, z0: 25.5, z1: 26.5 }, hex('#2e2a33'), hex('#2e2a33'), hex('#2e2a33'));
      flatBox(l, { x0: 180, x1: 187, y0: 7, y1: 13, z0: 27, z1: 28 }, C.pierogi, C.pierogiShade, C.pierogiShade);
    },
  });
  // Steam and flame have no outline: they're soft.
  things.push({
    depth: 161,
    outline: false,
    draw: (l) => {
      for (let k = 0; k < 14; k++) {
        const { sx, sy } = at(167, 10, 35 + k * 1.2);
        const wob = Math.round(Math.sin(k * 0.9) * 2);
        l.set(sx + wob, sy, C.steam, 150 - k * 9);
        l.set(sx + wob + 1, sy, C.steam, 110 - k * 7);
        if (k % 3 === 0) l.set(sx + wob - 3, sy + 1, C.steam, 90);
      }
      const { sx, sy } = at(183, 13, 25);
      ['.f..f.f.', 'fFfFFfFf', 'FHFFHFHF', 'RFHHHHFR'].forEach((line, dy) =>
        [...line].forEach((ch, dx) => {
          const c = ch === 'f' || ch === 'R' ? C.flameRed : ch === 'F' ? C.flame : ch === 'H' ? C.flameHot : null;
          if (c) l.set(sx - 4 + dx, sy - 4 + dy, c);
        }),
      );
    },
  });
  glows.push({ ...xy(at(183, 12, 26)), rx: 22, ry: 12, colour: C.flame, day: 0.12, evening: 0.35 });

  // The chef at the stove, behind the pass.
  things.push({ depth: 170, draw: (l) => placeSprite(l, person(CHEF, 'stand', 'front'), 172, 27, 0) });

  // The pass: plates waiting under the heat lamp, a pot of basil.
  SHADOWS.push({ x: 178, y: 46, rx: 42, ry: 4, k: 0.3 });
  things.push({
    depth: 218 + 45,
    draw: (l) => {
      texBox(
        l,
        { x0: 136, x1: 218, y0: 33, y1: 45, z0: 0, z1: 21 },
        (x, y) => (y < 35 ? C.steelLight : Math.floor(x) % 16 < 1 ? hex('#8a5a3a') : hex('#b9845a')),
        (x, z) => {
          if (z > 18) return hex('#8a5a3a');
          const panel = Math.floor(x - 136) % 14;
          if (panel < 1 || z < 2) return C.cabinetDark;
          if (panel === 1 || Math.abs(z - 16) < 0.5) return C.wainscotLight;
          return C.cabinet;
        },
        () => C.cabinetDark,
      );
      placeSprite(l, PLATE_PIEROGI, 150, 39, 21);
      placeSprite(l, PLATE_SOUP, 162, 39, 21);
      placeSprite(l, PLATE_PIEROGI, 174, 39, 21);
      const basil = rows(['.lLl.', 'lLlLl', '.lll.', '.ppp.', '.PPP.'], { l: C.leaf, L: C.leafLight, p: C.pot, P: C.potDark });
      placeSprite(l, basil, 206, 39, 21);
      // The heat lamp on its chains.
      for (const cx of [148, 176]) {
        const top = at(cx, 39, 80);
        const bottom = at(cx, 39, 46);
        for (let y = top.sy; y < bottom.sy; y += 2) l.set(top.sx, y, C.steelDark);
      }
      flatBox(l, { x0: 146, x1: 178, y0: 37, y1: 41, z0: 43, z1: 46 }, C.steelDark, hex('#5e6a73'), hex('#4a545c'));
    },
  });
  glows.push({ ...xy(at(162, 39, 30)), rx: 30, ry: 10, colour: C.heatLamp, day: 0.12, evening: 0.28 });

  // By the window: a tourist and a student.
  things.push(...chairParts(33, 44, 'far'), ...chairParts(33, 77, 'near'));
  things.push({ depth: 33 + 44, draw: (l) => placeSprite(l, person(GUESTS.tourist, 'sit', 'front'), 33, 44, 14) });
  things.push(
    table(22, 50, 44, 70, [
      { s: PLATE_PIEROGI, x: 33, y: 55 },
      { s: GLASS, x: 26, y: 57 },
      { s: PLATE_SOUP, x: 33, y: 65 },
      { s: evening ? CANDLE : VASE, x: 40, y: 60 },
    ]),
  );
  things.push({ depth: 33 + 77 + 0.5, draw: (l) => placeSprite(l, person(GUESTS.student, 'sit', 'back'), 33, 77, 14) });

  // On the rug: a grandmother, a foodie and an office worker.
  things.push(...chairParts(110, 66, 'far'), ...chairParts(110, 103, 'near'), ...chairParts(90, 84, 'far'));
  things.push({ depth: 110 + 66, draw: (l) => placeSprite(l, person(GUESTS.local, 'sit', 'front'), 110, 66, 14) });
  things.push({ depth: 90 + 84, draw: (l) => placeSprite(l, person(GUESTS.foodie, 'sit', 'front'), 90, 84, 14) });
  things.push(
    table(96, 72, 124, 96, [
      { s: PLATE_PIEROGI, x: 110, y: 77 },
      { s: PLATE_PIEROGI, x: 102, y: 84 },
      { s: PLATE_SOUP, x: 110, y: 91 },
      { s: GLASS, x: 119, y: 80 },
      { s: GLASS, x: 100, y: 78 },
      { s: evening ? CANDLE : VASE, x: 117, y: 87 },
    ]),
  );
  things.push({ depth: 110 + 103 + 0.5, draw: (l) => placeSprite(l, person(GUESTS.office, 'sit', 'back'), 110, 103, 14) });

  // By the kitchen: someone waiting, and the waiter bringing their food.
  const waitingGuest: PersonLook = { ...GUESTS.tourist, hair: [hex('#8a5233'), hex('#6b3d24'), hex('#a8704a')], hairStyle: 'short', smile: false };
  things.push(...chairParts(161, 78, 'far'));
  things.push({ depth: 161 + 78, draw: (l) => placeSprite(l, person(waitingGuest, 'sit', 'front'), 161, 78, 14) });
  things.push(table(150, 84, 172, 104, [{ s: GLASS, x: 156, y: 92 }, { s: evening ? CANDLE : VASE, x: 166, y: 98 }]));
  things.push({ depth: 186 + 98, draw: (l) => placeSprite(l, person(WAITER, 'walk', 'front'), 186, 98, 0) });
  SHADOWS.push({ x: 186, y: 98, rx: 6, ry: 3, k: 0.25 });
  if (evening) {
    for (const [cx, cy] of [
      [40, 60],
      [117, 87],
      [166, 98],
      [56, 120],
    ])
      glows.push({ ...xy(at(cx, cy, 22)), rx: 15, ry: 8, colour: C.flame, day: 0, evening: 0.26 });
  }

  // At the front: two students sharing pierogi.
  things.push(...chairParts(50, 105, 'far'), ...chairParts(50, 133, 'near'));
  things.push({ depth: 50 + 105, draw: (l) => placeSprite(l, person({ ...GUESTS.student, hairStyle: 'bob', hair: [hex('#b5452f'), hex('#8c3322'), hex('#d0705a')], skin: SKIN }, 'sit', 'front'), 50, 105, 14) });
  things.push(
    table(40, 110, 60, 128, [
      { s: PLATE_PIEROGI, x: 50, y: 114 },
      { s: GLASS, x: 44, y: 118 },
      { s: PLATE_PIEROGI, x: 50, y: 123 },
      { s: evening ? CANDLE : VASE, x: 56, y: 120 },
    ]),
  );
  things.push({ depth: 50 + 133 + 0.5, draw: (l) => placeSprite(l, person({ ...GUESTS.student, hairStyle: 'long', hair: [hex('#4a3426'), hex('#2e2018'), hex('#6b4a36')] }, 'sit', 'back'), 50, 133, 14) });

  // A big fig tree in the corner by the window.
  SHADOWS.push({ x: 14, y: 134, rx: 9, ry: 5, k: 0.25 });
  things.push({
    depth: 14 + 140,
    draw: (l) => {
      flatBox(l, { x0: 8, x1: 20, y0: 128, y1: 140, z0: 0, z1: 12 }, C.potDark, C.pot, C.potDark);
      const { sx, sy } = at(14, 134, 12);
      for (let k = 0; k < 8; k++) l.set(sx, sy - k, C.timber);
      for (let k = 0; k < 90; k++) {
        const a = k * 2.39996;
        const r = Math.sqrt(k / 90) * 14;
        const lx = Math.round(sx + Math.cos(a) * r);
        const ly = Math.round(sy - 18 + Math.sin(a) * r * 1.1);
        const c = k % 5 === 0 ? C.leafLight : k % 3 === 0 ? C.leafDark : C.leaf;
        l.set(lx, ly, c);
        l.set(lx + 1, ly, c);
        l.set(lx, ly + 1, k % 2 ? C.leafDark : c);
      }
    },
  });

  // Wall lamps: one by the window, two on the right wall either side of the specials board.
  const sconces: { x: number; y: number; z: number }[] = [
    { x: 0, y: 94, z: 44 },
    { x: 63, y: 0, z: 44 },
    { x: 113, y: 0, z: 44 },
  ];
  for (const sc of sconces) {
    things.push({ depth: 1, draw: (l) => placeSprite(l, SCONCE, sc.x, sc.y, sc.z) });
    glows.push({ ...xy(at(sc.x, sc.y, sc.z + 3)), rx: 30, ry: 22, colour: C.glow, day: 0.08, evening: 0.38 });
  }
  // The room's warm light falls on the tables.
  for (const [tx, ty] of [
    [33, 60],
    [110, 84],
    [50, 117],
  ])
    glows.push({ ...xy(at(tx, ty, 17)), rx: 40, ry: 20, colour: C.glow, day: 0.05, evening: 0.16 });

  // Draw: the room, then everything back to front, each with its outline.
  const img = new Pixels(W, H);
  drawRoomShell(img, evening);
  for (const thing of things.sort((a, b) => a.depth - b.depth)) {
    const layer = new Pixels(W, H);
    thing.draw(layer);
    if (thing.outline !== false) layer.outline(C.outline);
    img.draw(layer, 0, 0);
  }
  return { img, glows };
}

/** Evening dims and cools everything; lamps, candles and the stove glow warm. */
function light(img: Pixels, glows: Glow[], evening: boolean): void {
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      let c = img.get(x, y);
      if (!c) continue;
      if (evening) c = [Math.round(c[0] * 0.6), Math.round(c[1] * 0.62), Math.round(c[2] * 0.78)];
      for (const g of glows) {
        const d = ((x - g.x) / g.rx) ** 2 + ((y - g.y) / g.ry) ** 2;
        if (d >= 1) continue;
        const k = (evening ? g.evening : g.day) * (1 - d) ** 1.4;
        const base: Rgb = c;
        c = [0, 1, 2].map((i) => Math.min(255, Math.round(base[i] + g.colour[i] * k))) as Rgb;
      }
      img.set(x, y, c);
    }
  }
}

// ---------- Run ----------

mkdirSync(OUT, { recursive: true });

function write(name: string, image: Pixels, scale: number, background: Rgb): void {
  const big = new Pixels(image.width * scale, image.height * scale);
  for (let y = 0; y < big.height; y++) for (let x = 0; x < big.width; x++) big.set(x, y, background);
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const c = image.get(x, y);
      if (c) big.fillRect(x * scale, y * scale, scale, scale, c);
    }
  }
  writeFileSync(OUT + '/' + name, encodePng(big as never));
  console.log(OUT + '/' + name);
}

for (const evening of [false, true]) {
  const { img, glows } = scene(evening);
  light(img, glows, evening);
  write(evening ? 'c-richer-art-evening.png' : 'c-richer-art-day.png', img, 3, evening ? hex('#1f1d2b') : hex('#efe3cc'));
}

// Today's sprites next to the new ones, the same size on screen (today's drawn 6×, the new 4×).
const kinds: PersonKind[] = ['tourists', 'students', 'locals', 'office', 'foodies', 'waiter', 'chef'];
const newLooks: PersonLook[] = [GUESTS.tourist, GUESTS.student, GUESTS.local, GUESTS.office, GUESTS.foodie, { ...WAITER, tray: false }, CHEF];
const sheet = new Pixels(kinds.length * 108 + 12, 2 * 186 + 36);
for (let y = 0; y < sheet.height; y++) for (let x = 0; x < sheet.width; x++) sheet.set(x, y, y < 198 ? hex('#efe3cc') : hex('#f6ead2'));
kinds.forEach((kind, i) => {
  const old = personPixels(kind, 'front', 'stand', 1);
  for (let y = 0; y < old.height; y++)
    for (let x = 0; x < old.width; x++) {
      const c = old.get(x, y);
      if (c) sheet.fillRect(12 + i * 108 + x * 6, 12 + y * 6, 6, 6, c);
    }
  const fresh = person(newLooks[i], 'stand', 'front');
  for (let y = 0; y < fresh.height; y++)
    for (let x = 0; x < fresh.width; x++) {
      const c = fresh.get(x, y);
      if (c) sheet.fillRect(12 + i * 108 + x * 4, 214 + y * 4, 4, 4, c);
    }
});
write('c-people-before-after.png', sheet, 1, hex('#efe3cc'));
