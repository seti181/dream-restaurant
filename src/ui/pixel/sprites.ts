// Hand-drawn pixel sprites as text grids: one character per pixel, '.' is see-through.
// Each letter means a colour; a character's own palette decides which.
// The style follows project.md section 9.1 (reference 1: small chibi people).

import type { GroupId } from '../../data/groups';
import type { RegularId } from '../../data/regulars';
import { hex, Pixels, type Rgb } from './raster';

export type Palette = Record<string, string>;

/** Turns a grid into pixels, checking every row has the same width. */
export function sprite(rows: readonly string[], palette: Palette): Pixels {
  const width = rows[0].length;
  const image = new Pixels(width, rows.length);
  const colours: Record<string, Rgb> = Object.fromEntries(Object.entries(palette).map(([k, v]) => [k, hex(v)]));
  rows.forEach((row, y) => {
    if (row.length !== width) throw new Error(`Sprite row ${y} is ${row.length} wide, expected ${width}`);
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const colour = colours[ch];
      if (!colour) throw new Error(`Sprite has no colour for "${ch}"`);
      image.set(x, y, colour);
    });
  });
  return image;
}

// ---------- People ----------

/** A person facing us: big head, short body. 16 wide, 20 tall. */
export const PERSON = [
  '....oooooooo....',
  '...ohhhhhhhho...',
  '..ohhhhhhhhhho..',
  '.ohhhhhhhhhhhho.',
  '.ohhHhhhhhhHhho.',
  '.ohhssssssssHho.',
  '.ohssessssessho.',
  '.ohssessssessho.',
  '.ohskssmmssksho.',
  '..oSssssssssSo..',
  '...oooSssSooo...',
  '...occcdcccCo...',
  '..occccdccccCo..',
  '..occccdccccCo..',
  '..oscccdcccCso..',
  '...occcdcccCo...',
  '...opppppppPo...',
  '...oppPooppPo...',
  '...obbboobbbo...',
  '....ooo..ooo....',
] as const;

/** The same person from behind. */
export const PERSON_BACK = [
  '....oooooooo....',
  '...ohhhhhhhho...',
  '..ohhhhhhhhhho..',
  '.ohhhhhhhhhhhho.',
  '.ohhhhHhhhhhhho.',
  '.ohhhhhhhhhhhho.',
  '.ohhhhhhhhHhhho.',
  '.ohhhhhhhhhhhho.',
  '.oshhhhhhhhhhso.',
  '..oHhhhhhhhhHo..',
  '...oooSssSooo...',
  '...occccccCCo...',
  '..occccccccCCo..',
  '..occccccccCCo..',
  '..oscccccccCso..',
  '...occccccCCo...',
  '...opppppppPo...',
  '...oppPooppPo...',
  '...obbboobbbo...',
  '....ooo..ooo....',
] as const;

/** Rows of a person that show above a table when they sit. */
export const SEATED_ROWS = 16;

/** A chef's tall hat, drawn over the top of the head. */
export const CHEF_HAT = [
  '....oooooooo....',
  '...owwwwwwwwo...',
  '..owwwwwwwwwwo..',
  '..owwwwwwwwwwo..',
  '...owwwwwwwwo...',
  '...oWWWWWWWWo...',
] as const;

const BASE = { o: '#3b2433', s: '#f3c9a5', S: '#d9a27f', e: '#3b2433', k: '#f2a08a', m: '#a8564a', b: '#4a3426' };

/** Each kind of guest in their own colours, so the room can be read at a glance. */
export const GUEST_PALETTES: Record<GroupId, Palette> = {
  tourists: { ...BASE, h: '#e8c06a', H: '#c99a45', c: '#e9a23b', C: '#c47f22', d: '#e9a23b', p: '#5d7aa8', P: '#465f86' },
  students: { ...BASE, h: '#4a3426', H: '#2e2018', c: '#4f9a4a', C: '#3a7a37', d: '#d9e8c8', p: '#5d7aa8', P: '#465f86' },
  locals: { ...BASE, h: '#8a5233', H: '#6b3d24', c: '#b5452f', C: '#8c3322', d: '#d9c7a8', p: '#4a4a55', P: '#36363f' },
  office: { ...BASE, h: '#2e2a33', H: '#1f1c23', c: '#7fb2d3', C: '#5d8aa8', d: '#b5452f', p: '#55545e', P: '#3f3e47' },
  foodies: { ...BASE, h: '#a0522d', H: '#7a3d20', c: '#7b4f9d', C: '#5e3a7a', d: '#f1e2c4', p: '#3d3a46', P: '#2a2830' },
};

export const STAFF_PALETTES: Record<'waiter' | 'chef', Palette> = {
  waiter: { ...BASE, h: '#6b3d24', H: '#4a2a18', c: '#2e2a33', C: '#1f1c23', d: '#f4f1ea', p: '#2e2a33', P: '#1f1c23' },
  chef: {
    ...BASE,
    h: '#4a2a18',
    H: '#2e1a0f',
    c: '#f4f1ea',
    C: '#d6d0c4',
    d: '#b9b2a4',
    p: '#3d3a46',
    P: '#2a2830',
    w: '#ffffff',
    W: '#d6d0c4',
  },
};

// ---------- Mewa ----------

export const MEWA = [
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
] as const;

export const MEWA_COLOURS: Palette = {
  o: '#3b2433',
  w: '#ffffff',
  e: '#1d1f22',
  y: '#f4c531',
  r: '#d9412b',
  g: '#aeb9c4',
  k: '#26292d',
  l: '#e59a94',
};

// ---------- Small things ----------

export const PLANT = [
  '...oo...oo..',
  '..oLLo.oLLo.',
  '.oLlLLoLLlLo',
  '.oLLLlLLLLLo',
  'oLLlLLLLlLLo',
  'oLLLLlLLLLLo',
  'oLlLLLLLlLLo',
  '.oLLLlLLLLo.',
  '..ooLLLLoo..',
  '..oppppppo..',
  '..oPpppppo..',
  '...oppppo...',
  '...oPpppo...',
  '....oooo....',
] as const;

export const PLANT_COLOURS: Palette = { o: '#2f3b2a', L: '#4f8f45', l: '#8cc46a', p: '#c97a4a', P: '#9c5a33' };

/** A pendant lamp shade with its warm bulb. */
export const LAMP = [
  '....o....',
  '...ooo...',
  '..oSSSo..',
  '.oSSSSSo.',
  'oSSSSSSSo',
  'ooyyyyyoo',
  '...yyy...',
] as const;

export const LAMP_COLOURS: Palette = { o: '#3b2433', S: '#3c6b4f', y: '#ffe08a' };

/** A ship's lantern hanging on a hook. */
export const LANTERN = [
  '...o...',
  '..ooo..',
  '.oBBBo.',
  'oByyyBo',
  'oByyyBo',
  'oByyyBo',
  '.oBBBo.',
  '..ooo..',
] as const;

export const LANTERN_COLOURS: Palette = { o: '#2e2018', B: '#4a3426', y: '#ffd56b' };

/** A brass chandelier with candles. */
export const CHANDELIER = [
  '.......o.......',
  '.......o.......',
  '.y...y.o.y...y.',
  '.w...w.o.w...w.',
  'oGo.oGoGoGo.oGo',
  '.oGGGGGGGGGGGo.',
  '...ooGGGGGoo...',
  '......ooo......',
] as const;

export const CHANDELIER_COLOURS: Palette = { o: '#5a3d12', G: '#d9a92b', y: '#ffcf4a', w: '#fdf6e3' };

/** An order ticket waiting on the kitchen rail. */
export const TICKET = ['ooooo', 'owwwo', 'oggwo', 'owwwo', 'oggwo', 'ooooo'] as const;

export const TICKET_COLOURS: Palette = { o: '#8a979e', w: '#ffffff', g: '#aeb9c4' };

/** Wisps of steam over a busy pot. */
export const STEAM = ['.s..s.', 's..s..', '.s..s.', '..s..s', '.s..s.'] as const;

export const STEAM_COLOURS: Palette = { s: '#ffffff' };

/** Each group's clothing colour, for the legend under the restaurant view. */
export const GROUP_COLOURS = Object.fromEntries(
  Object.entries(GUEST_PALETTES).map(([group, palette]) => [group, palette.c]),
) as Record<GroupId, string>;

// ---------- Walking, accessories and special characters ----------

/** The legs (last four rows of a person) for the two steps of a walk. */
export const WALK_LEGS: Record<'walk1' | 'walk2', readonly string[]> = {
  walk1: ['...opppppppPo...', '...oppPooppPo...', '..obbbo.oppPo...', '..oooo..obbbo...'],
  walk2: ['...opppppppPo...', '...oppPooppPo...', '...oppPo.obbbo..', '...obbbo..oooo..'],
};

/** Room above the head for hats. */
export const HEADROOM = 5;

/** An accessory drawn over the body; y counts from the top of the head (negative = above it). */
export interface Overlay {
  rows: readonly string[];
  x: number;
  y: number;
  /** Which way the person must face for it to show. */
  facing?: 'front' | 'back';
}

const SUN_HAT: Overlay = {
  x: 0,
  y: -3,
  rows: [
    '.....oooooo.....',
    '....oyyyyyyo....',
    '...oyyyyyyyyo...',
    '...orrrrrrrro...',
    'ooyyyyyyyyyyyyoo',
    '.oooooooooooooo.',
  ],
};
const CAMERA: Overlay = { x: 5, y: 12, facing: 'front', rows: ['oooo', 'oKLo'] };
const BACKPACK_STRAPS: Overlay = { x: 4, y: 11, facing: 'front', rows: ['B......B', 'B......B', 'B......B', 'B......B'] };
const BACKPACK: Overlay = {
  x: 4,
  y: 11,
  facing: 'back',
  rows: ['oooooooo', 'oBBBBBBo', 'oBbbbbBo', 'oBBBBBBo', 'oBBBBBBo', 'oooooooo'],
};
const KASHUBIAN_PATTERN: Overlay = { x: 4, y: 12, rows: ['.z.z.z.z', 'z.z.z.z.'] };
const SCARF: Overlay = { x: 0, y: 10, rows: ['...offffffffo...', '.........ff.....'] };
const BERET: Overlay = { x: 2, y: -1, rows: ['...ooooooo..', '..oKKKKKKKoo', '.oKKKKKKKKKo'] };
const FLAT_CAP: Overlay = { x: 1, y: -1, rows: ['...oooooooo...', '..oQQQQQQQQo..', '.oDDDDDDDDDDo.'] };
const APRON: Overlay = { x: 3, y: 15, facing: 'front', rows: ['oaaaaaaaao', 'oaaaaaaaAo'] };
const KOMPOT_STAIN: Overlay = { x: 9, y: 15, facing: 'front', rows: ['r'] };
/** Adrian's spiky blond hair, standing up above his head. */
const SPIKY_HAIR: Overlay = {
  x: 0,
  y: -3,
  rows: ['.....o....o.....', '....oho..oho.o..', '..oohhhoohhhoho.', '..ohhhhhhhhhhho.'],
};
/** The light catching Tomek's bald head. */
const SHINE: Overlay = { x: 5, y: 1, rows: ['zz', 'z.'] };
/** Happy eyes, squinting with joy (^ ^), and a big smile. */
const HAPPY_EYES: Overlay = { x: 4, y: 6, facing: 'front', rows: ['.e....e.', 'ese..ese'] };
const BIG_SMILE: Overlay = { x: 6, y: 8, facing: 'front', rows: ['mssm', '.mm.'] };
const SUNGLASSES: Overlay = { x: 3, y: 6, facing: 'front', rows: ['KKKKooKKKK', 'KKKK..KKKK'] };
const CHEF_HAT_OVERLAY: Overlay = { x: 0, y: -5, rows: CHEF_HAT };
/** A big white walrus moustache, drooping at the ends. */
const MOUSTACHE: Overlay = {
  x: 2,
  y: 7,
  facing: 'front',
  rows: ['...oooooo...', '.ooWWWWWWoo.', 'oWWWWWWWWWWo', 'oWWWoooWWWWo', 'oWWo....oWWo', '.oo......oo.'],
};
/** A little red-and-white Solidarność badge on the lapel. */
const BADGE: Overlay = { x: 4, y: 12, facing: 'front', rows: ['r', 'z'] };
/** Security's earpiece wire. */
const EARPIECE: Overlay = { x: 13, y: 8, facing: 'front', rows: ['L', 'L', 'L'] };
/** An accordion held across the chest: white and black keys on the left, red bellows with white folds. */
const ACCORDION: Overlay = {
  x: 2,
  y: 11,
  facing: 'front',
  rows: ['oooooooooooo', 'owwoRzRzRzRo', 'owKoRzRzRzRo', 'owwoRzRzRzRo', 'owKoRzRzRzRo', 'oooooooooooo'],
};
/** A headscarf, for the amber seller. */
const HEADSCARF: Overlay = { x: 1, y: -1, rows: ['...oooooooooo..', '..oSSSSSSSSSSo.', '.oSSSSSSSSSSSSo', '.oSo........oSo'] };
/** Lechia Gdańsk's green and white stripes. */
const STRIPES: Overlay = { x: 3, y: 11, facing: 'front', rows: ['.z.z.z.z.', '.z.z.z.z.', '.z.z.z.z.'] };

// The named regulars (data/regulars.ts).
/** Marek's thin steel glasses (his eyes show through), and his office lanyard. */
const GLASSES: Overlay = { x: 4, y: 5, facing: 'front', rows: ['ggg..ggg', 'g.gggg.g', 'g.g..g.g'] };
const LANYARD: Overlay = { x: 6, y: 11, facing: 'front', rows: ['L.L', '.L.', '.w.'] };
/** Mr Fletcher's khaki bucket hat. */
const BUCKET_HAT: Overlay = {
  x: 1,
  y: -2,
  rows: ['...oooooooo...', '..offffffffo..', '.offffffffffo.', 'oooooooooooooo'],
};
/** Pan Zbigniew's white moustache, drooping a little at the ends. */
const DROOPING_MOUSTACHE: Overlay = { x: 5, y: 8, facing: 'front', rows: ['.wwww.', 'w....w'] };
/** Ola's sketchbook under her arm, and paint on her trousers. */
const SKETCHBOOK: Overlay = { x: 10, y: 12, facing: 'front', rows: ['oooo', 'owwo', 'owKo', 'oooo'] };
const PAINT_SPOTS: Overlay = { x: 4, y: 16, facing: 'front', rows: ['.R..L', '...R.'] };

/** Everyone who can appear in the restaurant. */
export type PersonKind =
  | GroupId
  | 'critic'
  | 'regular'
  | 'waiter'
  | 'tomek'
  | 'adrian'
  | 'chef'
  | 'walesa'
  | 'guard'
  | 'footballer'
  | 'musician'
  | 'amberSeller'
  | RegularId;

export interface Look {
  palette: Palette;
  overlays: Overlay[];
}

const ACCESSORY_COLOURS = {
  y: '#f1d9a0',
  r: '#b5452f',
  K: '#2e2a33',
  L: '#7fb2d3',
  B: '#3c6b4f',
  b: '#5f8a52',
  z: '#fbf3e4',
  f: '#f1e2c4',
  a: '#fbf8f2',
  A: '#d6d0c4',
  Q: '#8a6a4a',
  D: '#5e4632',
  R: '#b5452f',
  S: '#d9412b',
  w: '#fbfaf6',
};

/** Hair colours to vary between guests of the same kind. */
const HAIR: Record<GroupId, [string, string][]> = {
  tourists: [['#e8c06a', '#c99a45'], ['#8a5233', '#6b3d24'], ['#f1d9a0', '#d4b679']],
  students: [['#4a3426', '#2e2018'], ['#b5452f', '#8c3322'], ['#2e2a33', '#1f1c23']],
  locals: [['#8a5233', '#6b3d24'], ['#c9c4bd', '#a39e97'], ['#4a3426', '#2e2018']],
  office: [['#2e2a33', '#1f1c23'], ['#6b3d24', '#4a2a18'], ['#c99a45', '#a07a30']],
  foodies: [['#a0522d', '#7a3d20'], ['#2e2a33', '#1f1c23'], ['#e8c06a', '#c99a45']],
};

const GROUP_OVERLAYS: Record<GroupId, Overlay[]> = {
  tourists: [SUN_HAT, CAMERA],
  students: [BACKPACK_STRAPS, BACKPACK],
  locals: [KASHUBIAN_PATTERN],
  office: [],
  foodies: [SCARF],
};

/** Adrian from the front: a longer face (high forehead, narrow chin) with rabbit front teeth. */
const ADRIAN_FRONT = [
  '....oooooooo....',
  '...ohhhhhhhho...',
  '..ohhhhhhhhhho..',
  '..ohhssssssHho..',
  '..ohssssssssho..',
  '..osssssssssso..',
  '..ossessssesso..',
  '..ossessssesso..',
  '..oskssmmsskso..',
  '...oSsmwwmsSo...',
  '....oSssssSo....',
  ...PERSON.slice(11),
];

/** Hair colours for the team, so no two people look alike: `variant` is their employee number. */
const STAFF_HAIR: [string, string][] = [
  ['#4a2a18', '#331d10'],
  ['#c9c4bd', '#a39e97'],
  ['#e8c06a', '#c99a45'],
  ['#8a5233', '#6b3d24'],
  ['#2e2a33', '#1f1c23'],
  ['#b5452f', '#8c3322'],
];
const staffHair = (variant: number) => {
  const [h, H] = STAFF_HAIR[variant % STAFF_HAIR.length];
  return { h, H };
};

/** How a person looks: their colours and accessories. `variant` picks the hair for guests and the team. */
export function lookOf(kind: PersonKind, variant = 0): Look {
  const withAccessories = (palette: Palette) => ({ ...ACCESSORY_COLOURS, ...palette });
  switch (kind) {
    case 'waiter':
      return { palette: withAccessories({ ...STAFF_PALETTES.waiter, ...staffHair(variant) }), overlays: [APRON] };
    case 'tomek':
      // Bald, and always happy.
      return {
        palette: withAccessories({ ...STAFF_PALETTES.waiter, h: BASE.s, H: BASE.S }),
        overlays: [SHINE, HAPPY_EYES, BIG_SMILE, APRON, KOMPOT_STAIN],
      };
    case 'adrian':
      // Spiky blond hair over a long face (see ADRIAN_FACE) with rabbit teeth.
      return { palette: withAccessories({ ...STAFF_PALETTES.waiter, h: '#f1d27a', H: '#c9a24a' }), overlays: [SPIKY_HAIR, APRON] };
    case 'chef':
      return { palette: withAccessories({ ...STAFF_PALETTES.chef, ...staffHair(variant) }), overlays: [CHEF_HAT_OVERLAY] };
    case 'critic':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.foodies, h: '#c9c4bd', H: '#a39e97', c: '#2e2a33', C: '#1f1c23', d: '#2e2a33' }),
        overlays: [BERET],
      };
    case 'walesa':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.locals, h: '#d9d6cf', H: '#b3aea6', c: '#4a4a55', C: '#36363f', d: '#b5452f', p: '#4a4a55', P: '#36363f', W: '#fbfaf6' }),
        overlays: [MOUSTACHE, BADGE],
      };
    case 'guard':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.office, h: '#7a5a3e', H: '#5e4430', c: '#1f1c23', C: '#141217', d: '#f4f1ea', p: '#1f1c23', P: '#141217' }),
        overlays: [SUNGLASSES, EARPIECE],
      };
    case 'footballer':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.students, h: '#4a3426', H: '#2e2018', c: '#1f7a3a', C: '#16602d', d: '#ffffff', p: '#ffffff', P: '#d6d0c4', z: '#ffffff' }),
        overlays: [STRIPES],
      };
    case 'musician':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.locals, h: '#55545e', H: '#3f3e47', c: '#2f5f86', C: '#24496a', d: '#f4f1ea', p: '#3b3a44', P: '#2a2930' }),
        overlays: [FLAT_CAP, ACCORDION],
      };
    case 'amberSeller':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.locals, h: '#8a5233', H: '#6b3d24', c: '#e9a23b', C: '#c98a2b', d: '#fbf3e4' }),
        overlays: [HEADSCARF],
      };
    case 'marek':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.office, g: '#8a979e', h: '#3a2a20', H: '#241a14', c: '#6a7480', C: '#4f5862', d: '#6a7480', p: '#3f5f8a', P: '#2f4868' }),
        overlays: [GLASSES, LANYARD],
      };
    case 'fletcher':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.tourists, s: '#f4b39a', S: '#d98d76', k: '#e8705e', h: '#d9c08a', H: '#b89e68', c: '#c8302f', C: '#9c2422', d: '#fbfaf6', p: '#c9b48a', P: '#a8946c', f: '#d8c79a' }),
        overlays: [BUCKET_HAT, CAMERA],
      };
    case 'zbigniew':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.locals, h: '#e6e2da', H: '#c4bfb6', c: '#2f4a6b', C: '#22374f', d: '#2f4a6b', p: '#4a4a55', P: '#36363f', Q: '#2f4a6b', D: '#22374f' }),
        overlays: [FLAT_CAP, DROOPING_MOUSTACHE],
      };
    case 'ola':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.students, h: '#d0607a', H: '#a8455d', c: '#e0b84a', C: '#b8922f', d: '#e0b84a', p: '#3f5f8a', P: '#2f4868', L: '#2f6f8f' }),
        overlays: [SKETCHBOOK, PAINT_SPOTS],
      };
    case 'regular':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.locals, h: '#55545e', H: '#3f3e47', c: '#f4d03f', C: '#d4ac0d', d: '#f4d03f', p: '#a08a6a', P: '#857055' }),
        overlays: [FLAT_CAP],
      };
    default: {
      const hair = HAIR[kind][variant % HAIR[kind].length];
      return { palette: withAccessories({ ...GUEST_PALETTES[kind], h: hair[0], H: hair[1] }), overlays: GROUP_OVERLAYS[kind] };
    }
  }
}

export type Pose = 'stand' | 'sit' | 'walk1' | 'walk2';

/**
 * A whole person: body, legs for the pose, and accessories, with HEADROOM rows above
 * for hats. Seated people are cut off at the waist (the table hides the rest).
 */
/** What a waiter carries: a tray with a plate of food, or the empty tray on the way back. */
export type Carry = 'full' | 'empty';

const TRAY: Record<Carry, Overlay> = {
  full: { x: 10, y: 8, rows: ['.FFF..', 'PPPPP.', 'oooooo'] },
  empty: { x: 10, y: 10, rows: ['oooooo'] },
};

export function personPixels(
  kind: PersonKind,
  facing: 'front' | 'back',
  pose: Pose,
  variant = 0,
  carry?: Carry,
  /** More accessories on top, like a face for a mood. */
  extra: Overlay[] = [],
): Pixels {
  const look = lookOf(kind, variant);
  if (carry) {
    look.palette = { ...look.palette, F: '#e9a23b', P: '#fdf8ee' };
    look.overlays = [...look.overlays, TRAY[carry]];
  }
  look.overlays = [...look.overlays, ...extra];
  const body: string[] = [...(facing === 'front' ? (kind === 'adrian' ? ADRIAN_FRONT : PERSON) : PERSON_BACK)];
  if (pose === 'walk1' || pose === 'walk2') body.splice(body.length - 4, 4, ...WALK_LEGS[pose]);
  const image = new Pixels(body[0].length, body.length + HEADROOM);
  image.draw(sprite(body, look.palette), 0, HEADROOM);
  for (const overlay of look.overlays) {
    if (overlay.facing && overlay.facing !== facing) continue;
    image.draw(sprite(overlay.rows, look.palette), overlay.x, HEADROOM + overlay.y);
  }
  return pose === 'sit' ? image.crop(0, 0, image.width, HEADROOM + SEATED_ROWS) : image;
}

// ---------- Portraits for the Staff tab ----------

/** How someone feels, as their face shows it. */
export type FaceMood = 'happy' | 'fine' | 'tired' | 'wornOut';

/** Heavy eyelids, and a drop of sweat for someone worn out. */
const TIRED_EYES: Overlay = { x: 5, y: 6, facing: 'front', rows: ['S....S'] };
const SWEAT: Overlay = { x: 13, y: 3, facing: 'front', rows: ['L', 'L'] };

/** Rows of a portrait: the head and shoulders. */
export const PORTRAIT_ROWS = HEADROOM + 14;

/**
 * Someone's head and shoulders, facing us, with a face for their mood. Tomek is always happy;
 * Adrian already grins with his rabbit teeth, so his happy face is the one he has.
 */
export function portraitPixels(kind: PersonKind, variant = 0, mood: FaceMood = 'fine'): Pixels {
  const faces: Record<FaceMood, Overlay[]> = {
    happy: kind === 'adrian' ? [] : [BIG_SMILE],
    fine: [],
    tired: [TIRED_EYES],
    wornOut: [TIRED_EYES, SWEAT],
  };
  const face = kind === 'tomek' ? [] : faces[mood];
  return personPixels(kind, 'front', 'stand', variant, undefined, face).crop(0, 0, PERSON[0].length, PORTRAIT_ROWS);
}
