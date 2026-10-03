// Hand-drawn pixel sprites as text grids: one character per pixel, '.' is see-through.
// Each letter means a colour; a character's own palette decides which.
// The style follows project.md section 9.1 (reference 1: small chibi people).

import type { GroupId } from '../../data/groups';
import type { RegularId } from '../../data/regulars';
import { hex, mix, Pixels, type Rgb } from './raster';

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

/** A person's picture: this wide, and this tall below the HEADROOM rows kept free for hats. */
export const PERSON_WIDTH = 18;
export const PERSON_HEIGHT = 30;
/** Room above the head for hats, buns and spiky hair. */
export const HEADROOM = 6;
/** Rows of a person that show above a table when they sit: the head and the body down to the waist. */
export const SEATED_ROWS = 23;

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

/** A brass wall lamp with a green glass shade; its bulb glows in the evening. */
export const SCONCE = ['.ssss.', 'sLsssd', 'sssssd', '.bbbb.', '..gg..', '..g...', 'gggg..'] as const;
export const SCONCE_COLOURS: Palette = { s: '#3c6b4f', L: '#5a8f6b', d: '#2b5039', b: '#efe3c0', g: '#d9a92b' };
export const SCONCE_LIT: Palette = { ...SCONCE_COLOURS, b: '#ffe08a' };

/** Copper pans hanging by their handles: a frying pan, a pot and a little saucepan. */
export const PANS = [
  ['..h..', '..h..', '.ccc.', 'cLccd', 'cLccd', 'ccccd', '.ddd.'],
  ['..hhh..', '.h...h.', 'ccccccc', 'cLccccd', 'cLccccd', 'cccccdd', '.ddddd.'],
  ['.h..', '.h..', 'cccc', 'Lccd', 'cccd', '.dd.'],
] as const;
export const PAN_COLOURS: Palette = { h: '#5e3b26', c: '#c46a3a', L: '#eb9a62', d: '#8c4220' };

/** A small gas flame under a pot. */
export const FLAME = ['.y..y.', 'yoyyoy', 'orrorr'] as const;
export const FLAME_COLOURS: Palette = { y: '#ffe08a', o: '#f6a23b', r: '#d9572b' };

/** Wisps of steam over a busy pot. */
export const STEAM = ['.s..s.', 's..s..', '.s..s.', '..s..s', '.s..s.'] as const;

export const STEAM_COLOURS: Palette = { s: '#ffffff' };

/** Each group's clothing colour, for the legend under the restaurant view. */
export const GROUP_COLOURS = Object.fromEntries(
  Object.entries(GUEST_PALETTES).map(([group, palette]) => [group, palette.c]),
) as Record<GroupId, string>;

// ---------- Walking, accessories and special characters ----------

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
    '.....oooooooo.....',
    '....oyyyyyyyyo....',
    '...oyyyyyyyyyyo...',
    '...oyyyyyyyyyyo...',
    '...orrrrrrrrrro...',
    'ooyyyyyyyyyyyyyyoo',
    '.oooooooooooooooo.',
  ],
};
/** A camera on a strap round the neck. */
const CAMERA: Overlay = { x: 7, y: 15, facing: 'front', rows: ['K...K', 'K...K', 'ooooo', 'oKLzo', 'ooooo'] };
const BACKPACK_STRAPS: Overlay = { x: 5, y: 15, facing: 'front', rows: Array(6).fill('B......B') };
const BACKPACK: Overlay = {
  x: 4,
  y: 15,
  facing: 'back',
  rows: ['oooooooooo', 'oBBBBBBBBo', 'oBBBBBBBBo', 'oGGGGGGGGo', 'oBBBBBBBBo', 'oBGGGGGGBo', 'oBGGGGGGBo', 'oooooooooo'],
};
/** A band of white crosses with yellow middles across a local's jumper. */
const KASHUBIAN_PATTERN: Overlay = { x: 4, y: 17, rows: ['.z..z..z..', 'zyzzyzzyz.', '.z..z..z..'] };
/** A foodie's cream scarf, with one end hanging down and a fringe; from behind, just the wrap. */
const SCARF: Overlay = {
  x: 4,
  y: 15,
  facing: 'front',
  rows: ['ffffffffff', 'AAffffffAA', '......ffA.', '......ffA.', '......ffA.', '......f.f.'],
};
const SCARF_BACK: Overlay = { x: 4, y: 15, facing: 'back', rows: ['ffffffffAA', 'AAAAAAAAAA'] };
/** A black beret, worn at a tilt. */
const BERET: Overlay = { x: 1, y: -2, rows: ['.....oooooooo...', '...ooKKKKKKKKoo.', '..oKKKKKKKKKKKKo', '..oooooooooooooo'] };
const FLAT_CAP: Overlay = {
  x: 1,
  y: -1,
  rows: ['...oooooooooo...', '..oQQQQQQQQQQo..', '.oQQQQQQQQQQQQo.', 'oDDDDDDDDDDDDDDo', 'oooooooooooooooo'],
};
const KOMPOT_STAIN: Overlay = { x: 10, y: 22, facing: 'front', rows: ['r.', '.r'] };
/** A tall pleated toque. */
const CHEF_HAT: Overlay = {
  x: 0,
  y: -6,
  rows: [
    '.....oooooooo.....',
    '...oowwwwwwwwoo...',
    '..owwwwwwwwwwwWo..',
    '..owwwwwwwwwwwWo..',
    '...owwWwwWwwWWo...',
    '...owWwwWwwWwWo...',
    '...oWWWWWWWWWWo...',
    '...oooooooooooo...',
  ],
};
/** A big white walrus moustache, drooping at the ends. */
const MOUSTACHE: Overlay = { x: 4, y: 10, facing: 'front', rows: ['.oWWWWWWo.', 'oWWWWWWWWo', 'oWWo..oWWo', '.oo....oo.'] };
/** A little red-and-white Solidarność badge on the lapel. */
const BADGE: Overlay = { x: 5, y: 17, facing: 'front', rows: ['r', 'z'] };
/** Security's earpiece wire. */
const EARPIECE: Overlay = { x: 15, y: 8, facing: 'front', rows: ['L', 'L', 'L', 'L', 'L'] };
/** An accordion held across the chest: white and black keys on the left, red bellows with white folds. */
const ACCORDION: Overlay = {
  x: 2,
  y: 16,
  facing: 'front',
  rows: ['oooooooooooooo', 'owwoRzRzRzRzRo', 'owKoRzRzRzRzRo', 'owwoRzRzRzRzRo', 'owKoRzRzRzRzRo', 'oooooooooooooo'],
};
/** A headscarf, for the amber seller. */
const HEADSCARF: Overlay = {
  x: 0,
  y: -1,
  rows: [
    '...oooooooooooo...',
    '..oXXXXXXXXXXXXo..',
    '.oXXXXXXXXXXXXXXo.',
    '.oXXXXXXXXXXXXXXo.',
    '.oXXXXXXXXXXXXXXo.',
    ...Array(6).fill('.oXXo........oXXo.'),
    '..oXo........oXo..',
  ],
};
/** Lechia Gdańsk's green and white stripes. */
const STRIPES: Overlay = { x: 5, y: 15, facing: 'front', rows: Array(8).fill('.z.z.z.z') };

// The named regulars (data/regulars.ts).
/** Filip's office lanyard. */
const LANYARD: Overlay = { x: 7, y: 15, facing: 'front', rows: ['L..L', 'L..L', '.LL.', '.ww.', '.ww.'] };
/** Mr Fletcher's khaki bucket hat. */
const BUCKET_HAT: Overlay = {
  x: 0,
  y: -2,
  rows: ['...oooooooooooo...', '..offffffffffffo..', '.offffffffffffffo.', 'offffffffffffffffo', '.oooooooooooooooo.'],
};
/** Pan Henryk's white moustache, drooping a little at the ends. */
const DROOPING_MOUSTACHE: Overlay = { x: 6, y: 10, facing: 'front', rows: ['.wwww.', 'w....w'] };
/** Weronika's sketchbook under her arm, and paint on her trousers. */
const SKETCHBOOK: Overlay = { x: 13, y: 17, facing: 'front', rows: ['oooo', 'owwo', 'owKo', 'oooo'] };
const PAINT_SPOTS: Overlay = { x: 5, y: 24, facing: 'front', rows: ['.R...L', '..R...'] };

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

/** How someone wears their hair. */
export type HairStyle = 'short' | 'bob' | 'long' | 'bun' | 'spiky' | 'cap' | 'bald';

/** What someone wears on top, each with its own details at the front. */
export type Wear = 'tee' | 'hoodie' | 'jumper' | 'shirt' | 'top' | 'suit' | 'waiter' | 'chef';

export interface Look {
  palette: Palette;
  overlays: Overlay[];
  hair: HairStyle;
  wear: Wear;
  /** A little smile, when nothing else shows on their face. */
  smile?: boolean;
  /** Glasses: thin frames in this colour, or dark sunglasses. */
  glasses?: { colour: string; dark?: boolean };
  /** Tomek beams all the time; Adrian has a longer face, with rabbit front teeth. */
  face?: 'beaming' | 'adrian';
}

const ACCESSORY_COLOURS = {
  y: '#f1d9a0',
  r: '#b5452f',
  K: '#2e2a33',
  L: '#7fb2d3',
  B: '#34507a',
  G: '#4d6d9a',
  z: '#fbf3e4',
  f: '#f1e2c4',
  a: '#fbf8f2',
  A: '#d6d0c4',
  Q: '#8a6a4a',
  D: '#5e4632',
  R: '#b5452f',
  X: '#d9412b',
  w: '#fbfaf6',
  /** A baseball cap. */
  n: '#c8302f',
  N: '#9c2422',
};

/** Hair colours to vary between guests of the same kind, each with a way of wearing it. */
const HAIR: Record<GroupId, [string, string, HairStyle][]> = {
  tourists: [['#e8c06a', '#c99a45', 'bob'], ['#8a5233', '#6b3d24', 'short'], ['#f1d9a0', '#d4b679', 'long'], ['#b5452f', '#8c3322', 'short']],
  students: [['#2e2a33', '#1f1c23', 'spiky'], ['#b5452f', '#8c3322', 'long'], ['#4a3426', '#2e2018', 'cap'], ['#2e2a33', '#1f1c23', 'bun']],
  locals: [['#8a5233', '#6b3d24', 'short'], ['#c9c4bd', '#a39e97', 'bun'], ['#4a3426', '#2e2018', 'bob'], ['#d9d6cf', '#b3aea6', 'bald']],
  office: [['#2e2a33', '#1f1c23', 'short'], ['#6b3d24', '#4a2a18', 'bob'], ['#c99a45', '#a07a30', 'short'], ['#4a3426', '#2e2018', 'long']],
  foodies: [['#a0522d', '#7a3d20', 'long'], ['#2e2a33', '#1f1c23', 'short'], ['#e8c06a', '#c99a45', 'bun'], ['#4a3426', '#2e2018', 'spiky']],
};

/** Every so often a guest has a deeper skin tone. */
const DEEP_SKIN = { s: '#d9a27f', S: '#b97f5f', k: '#e0866e' };

/** What each kind of guest wears, and the telltale things they carry (project.md section 9.1). */
const GROUP_WEAR: Record<GroupId, Wear> = { tourists: 'tee', students: 'hoodie', locals: 'jumper', office: 'shirt', foodies: 'top' };
const GROUP_OVERLAYS: Record<GroupId, Overlay[]> = {
  tourists: [SUN_HAT, CAMERA],
  students: [BACKPACK_STRAPS, BACKPACK],
  locals: [KASHUBIAN_PATTERN],
  office: [],
  foodies: [SCARF, SCARF_BACK],
};
/** Office workers wear glasses with grey frames. */
const OFFICE_GLASSES = { colour: '#6e6878' };

/** Hair for the team, so no two people look alike: `variant` is their employee number. */
const STAFF_HAIR: [string, string, HairStyle][] = [
  ['#4a2a18', '#331d10', 'short'],
  ['#c9c4bd', '#a39e97', 'bun'],
  ['#e8c06a', '#c99a45', 'bob'],
  ['#8a5233', '#6b3d24', 'short'],
  ['#2e2a33', '#1f1c23', 'long'],
  ['#b5452f', '#8c3322', 'short'],
];
const staffHair = (variant: number) => {
  const [h, H, style] = STAFF_HAIR[variant % STAFF_HAIR.length];
  return { colours: { h, H }, style };
};

/** How a person looks: their colours, hair, clothes and accessories. `variant` picks the hair for guests and the team. */
export function lookOf(kind: PersonKind, variant = 0): Look {
  const withAccessories = (palette: Palette) => ({ ...ACCESSORY_COLOURS, ...palette });
  switch (kind) {
    case 'waiter': {
      const hair = staffHair(variant);
      return { palette: withAccessories({ ...STAFF_PALETTES.waiter, ...hair.colours }), overlays: [], hair: hair.style, wear: 'waiter', smile: true };
    }
    case 'tomek':
      // Bald, and always happy.
      return {
        palette: withAccessories({ ...STAFF_PALETTES.waiter, h: BASE.s, H: BASE.S }),
        overlays: [KOMPOT_STAIN],
        hair: 'bald',
        wear: 'waiter',
        face: 'beaming',
      };
    case 'adrian':
      // Spiky blond hair over a long face with rabbit teeth.
      return { palette: withAccessories({ ...STAFF_PALETTES.waiter, h: '#f1d27a', H: '#c9a24a' }), overlays: [], hair: 'spiky', wear: 'waiter', face: 'adrian' };
    case 'chef': {
      const hair = staffHair(variant);
      // Long hair is tied up under the toque.
      const style = hair.style === 'long' || hair.style === 'bun' ? 'bob' : hair.style;
      return { palette: withAccessories({ ...STAFF_PALETTES.chef, ...hair.colours }), overlays: [CHEF_HAT], hair: style, wear: 'chef', smile: true };
    }
    case 'critic':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.foodies, h: '#c9c4bd', H: '#a39e97', c: '#2e2a33', C: '#1f1c23', d: '#2e2a33' }),
        overlays: [BERET],
        hair: 'short',
        wear: 'jumper',
      };
    case 'walesa':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.locals, h: '#d9d6cf', H: '#b3aea6', c: '#4a4a55', C: '#36363f', d: '#b5452f', p: '#4a4a55', P: '#36363f', W: '#fbfaf6' }),
        overlays: [MOUSTACHE, BADGE],
        hair: 'short',
        wear: 'suit',
      };
    case 'guard':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.office, h: '#7a5a3e', H: '#5e4430', c: '#1f1c23', C: '#141217', d: '#1f1c23', p: '#1f1c23', P: '#141217' }),
        overlays: [EARPIECE],
        hair: 'short',
        wear: 'suit',
        glasses: { colour: '#1f1c23', dark: true },
      };
    case 'footballer':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.students, h: '#4a3426', H: '#2e2018', c: '#1f7a3a', C: '#16602d', d: '#ffffff', p: '#ffffff', P: '#d6d0c4', z: '#ffffff' }),
        overlays: [STRIPES],
        hair: 'short',
        wear: 'tee',
        smile: true,
      };
    case 'musician':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.locals, h: '#55545e', H: '#3f3e47', c: '#2f5f86', C: '#24496a', d: '#f4f1ea', p: '#3b3a44', P: '#2a2930' }),
        overlays: [FLAT_CAP, ACCORDION],
        hair: 'short',
        wear: 'jumper',
        smile: true,
      };
    case 'amberSeller':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.locals, h: '#8a5233', H: '#6b3d24', c: '#e9a23b', C: '#c98a2b', d: '#fbf3e4' }),
        overlays: [HEADSCARF],
        hair: 'bob',
        wear: 'top',
        smile: true,
      };
    case 'filip':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.office, h: '#3a2a20', H: '#241a14', c: '#6a7480', C: '#4f5862', d: '#6a7480', p: '#3f5f8a', P: '#2f4868' }),
        overlays: [LANYARD],
        hair: 'short',
        wear: 'shirt',
        // Thin steel glasses, not the usual dark office frames.
        glasses: { colour: '#8a979e' },
      };
    case 'fletcher':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.tourists, s: '#f4b39a', S: '#d98d76', k: '#e8705e', h: '#d9c08a', H: '#b89e68', c: '#c8302f', C: '#9c2422', d: '#fbfaf6', p: '#c9b48a', P: '#a8946c', f: '#d8c79a' }),
        overlays: [BUCKET_HAT, CAMERA],
        hair: 'short',
        wear: 'tee',
        smile: true,
      };
    case 'henryk':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.locals, h: '#e6e2da', H: '#c4bfb6', c: '#2f4a6b', C: '#22374f', d: '#2f4a6b', p: '#4a4a55', P: '#36363f', Q: '#2f4a6b', D: '#22374f' }),
        overlays: [FLAT_CAP, DROOPING_MOUSTACHE],
        hair: 'short',
        wear: 'jumper',
      };
    case 'weronika':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.students, h: '#d0607a', H: '#a8455d', c: '#e0b84a', C: '#b8922f', d: '#e0b84a', p: '#3f5f8a', P: '#2f4868', L: '#2f6f8f' }),
        overlays: [SKETCHBOOK, PAINT_SPOTS],
        hair: 'long',
        wear: 'top',
        smile: true,
      };
    case 'regular':
      return {
        palette: withAccessories({ ...GUEST_PALETTES.locals, h: '#55545e', H: '#3f3e47', c: '#f4d03f', C: '#d4ac0d', d: '#f4d03f', p: '#a08a6a', P: '#857055' }),
        overlays: [FLAT_CAP],
        hair: 'short',
        wear: 'shirt',
        smile: true,
      };
    default: {
      const [h, H, style] = HAIR[kind][variant % HAIR[kind].length];
      const skin = variant % 5 === 3 ? DEEP_SKIN : {};
      return {
        palette: withAccessories({ ...GUEST_PALETTES[kind], ...skin, h, H }),
        overlays: GROUP_OVERLAYS[kind],
        // Under a sun hat, a bun or spikes would only poke through the straw.
        hair: kind === 'tourists' && (style === 'bun' || style === 'spiky') ? 'short' : style,
        wear: GROUP_WEAR[kind],
        smile: variant % 2 === 0,
        glasses: kind === 'office' ? OFFICE_GLASSES : undefined,
      };
    }
  }
}

export type Pose = 'stand' | 'sit' | 'walk1' | 'walk2';

/** What a waiter carries: a tray with a plate of food, or the empty tray on the way back. */
export type Carry = 'full' | 'empty';

/** How someone feels, as their face shows it. */
export type FaceMood = 'happy' | 'fine' | 'tired' | 'wornOut';

const WHITE = hex('#ffffff');
const OUTLINE = hex('#3b2433');
const GOLD = hex('#d9a92b');
const TRAY = { light: hex('#d6dde2'), dark: hex('#8a979e'), plate: hex('#fdf8ee'), food: hex('#e9b65a'), foodShade: hex('#c98f3a'), greens: hex('#6aa84f'), glass: hex('#cfe6f0'), kompot: hex('#b5452f') };
const SWEAT = hex('#7fb2d3');

// Where things are on a person, in pixels from the left and rows from the top of the head.
/** The middle of the body, between two columns. */
const MIDDLE = 9;
/** The head is an oval around (MIDDLE, HEAD_MIDDLE). */
const HEAD_MIDDLE = 6.8;
/** The eyes take three rows from here, at these columns (two pixels wide each). */
const EYE_ROW = 7;
const EYES = [5, 11];
const MOUTH_ROW = 11;
/** The body: the top from the shoulders to the waist, then trousers, then shoes. */
const SHOULDERS = 14;
const WAIST = 23;
const SHOES = 27;

/**
 * Draws a person in code: a round head with shining eyes and rosy cheeks, hair in their style,
 * and clothes with light from the upper left and the details of what they wear. Legs step for
 * walking. Small, like reference 1: the head is about two fifths of a table's width.
 */
function drawPerson(image: Pixels, look: Look, facing: 'front' | 'back', pose: Pose, carry: Carry | undefined, mood: FaceMood): void {
  const colour = (key: string) => hex(look.palette[key]);
  const at = (x: number, y: number, c: Rgb) => image.set(x, y + HEADROOM, c);
  const front = facing === 'front';
  const skin = colour('s');
  const skinShade = colour('S');
  const shirt = colour('c');
  const shirtShade = colour('C');
  const shirtLight = mix(shirt, WHITE, 0.22);
  const accent = colour('d');
  const white = hex('#fbfaf6');
  const whiteShade = hex('#ddd8ce');
  const wear = look.wear;

  // The top, from the shoulders to the waist, with a fold or two.
  for (let y = SHOULDERS; y < WAIST; y++) {
    const inset = y === SHOULDERS ? 1 : 0;
    for (let x = 4 + inset; x <= 13 - inset; x++) {
      const fold = wear !== 'waiter' && wear !== 'suit' && ((y === 19 && x === 6) || (y === 20 && x === 7) || (y === 17 && x === 10));
      at(x, y, x >= 12 || fold ? shirtShade : x <= 5 ? shirtLight : shirt);
    }
  }
  if (front) {
    switch (wear) {
      case 'tee':
        // A round neck.
        for (let x = 7; x <= 10; x++) at(x, 15, shirtShade);
        break;
      case 'hoodie':
        // Drawstrings and a front pocket.
        for (const x of [7, 10]) for (let y = 15; y <= 17; y++) at(x, y, accent);
        for (let x = 5; x <= 12; x++) at(x, 19, shirtShade);
        for (let y = 20; y <= 21; y++) {
          at(5, y, shirtShade);
          at(12, y, shirtShade);
        }
        break;
      case 'jumper':
        // A ribbed hem.
        for (let x = 4; x <= 13; x++) at(x, WAIST - 1, x % 2 === 0 ? shirtShade : mix(shirtShade, OUTLINE, 0.25));
        break;
      case 'shirt': {
        // Collar points, a tie (unless it's the shirt's own colour) and a breast pocket.
        const collar = mix(shirt, WHITE, 0.55);
        for (const x of [6, 7, 10, 11]) at(x, 15, collar);
        if (look.palette.d !== look.palette.c) {
          for (let y = 15; y <= 20; y++) {
            at(8, y, y === 15 ? mix(accent, OUTLINE, 0.25) : accent);
            at(9, y, mix(accent, OUTLINE, 0.25));
          }
        }
        at(11, 17, shirtShade);
        break;
      }
      case 'top':
        // A V-neck.
        for (let x = 7; x <= 10; x++) at(x, 15, skin);
        at(8, 16, skin);
        at(9, 16, skinShade);
        break;
      case 'suit':
      case 'waiter':
        // A white shirt in the V of the jacket: a tie for a suit, a bow tie for a waiter.
        for (let x = 6; x <= 11; x++) at(x, 15, white);
        for (let x = 7; x <= 10; x++) at(x, 16, x === 10 ? whiteShade : white);
        at(8, 17, white);
        at(9, 17, whiteShade);
        if (wear === 'suit') {
          for (let y = 15; y <= 19; y++) {
            at(8, y, accent);
            at(9, y, mix(accent, OUTLINE, 0.3));
          }
        } else {
          for (const x of [7, 8, 9, 10]) at(x, 15, x === 8 || x === 9 ? mix(shirt, OUTLINE, 0.4) : shirt);
        }
        break;
      case 'chef':
        // A stand-up collar and a double row of buttons.
        for (let x = 5; x <= 12; x++) at(x, 15, shirtShade);
        for (const y of [17, 19, 21]) {
          at(6, y, accent);
          at(11, y, accent);
        }
        break;
    }
  } else if (wear === 'hoodie') {
    // The hood, lying on the back.
    for (let y = 14; y <= 17; y++) {
      const narrow = Math.max(0, y - 16);
      for (let x = 5 + narrow; x <= 12 - narrow; x++) at(x, y, y === 14 || x === 5 + narrow || x === 12 - narrow ? shirtShade : mix(shirtShade, OUTLINE, 0.25));
    }
  }

  // Legs and shoes; when walking, one foot is lifted. A waiter's long apron hangs over them.
  const sitting = pose === 'sit';
  if (!sitting) {
    const pants = colour('p');
    const pantsShade = colour('P');
    const shoes = colour('b');
    const belt = wear === 'shirt' || wear === 'suit';
    for (let x = 4; x <= 13; x++) at(x, WAIST, belt || x >= 12 ? pantsShade : pants);
    if (belt) {
      at(8, WAIST, GOLD);
      at(9, WAIST, GOLD);
    }
    const lift = { left: pose === 'walk1' ? 1 : 0, right: pose === 'walk2' ? 1 : 0 };
    for (const [x0, up, out] of [
      [5, lift.left, -1],
      [10, lift.right, 1],
    ]) {
      for (let y = WAIST + 1; y < SHOES - up; y++) for (let x = x0; x <= x0 + 2; x++) at(x, y, x === x0 + 2 ? pantsShade : pants);
      for (let x = x0; x <= x0 + 2; x++) at(x, SHOES - up, x === x0 + 1 ? mix(shoes, WHITE, 0.3) : shoes);
      for (let x = Math.min(x0, x0 + out); x <= Math.max(x0 + 2, x0 + 2 + out); x++) at(x, SHOES + 1 - up, shoes);
    }
  }
  if (wear === 'waiter') {
    const bottom = sitting ? WAIST - 1 : SHOES - 1;
    if (front) {
      for (let y = 20; y <= bottom; y++) for (let x = 5; x <= 12; x++) at(x, y, y === 20 || x >= 11 || (x === 7 && y > 22) ? whiteShade : white);
    } else {
      // The apron strings, tied in a bow at the back.
      for (let x = 4; x <= 13; x++) at(x, 20, whiteShade);
      for (const [x, y] of [[7, 19], [10, 19], [7, 21], [10, 21], [8, 20], [9, 20], [8, 22], [9, 22]]) at(x, y, white);
    }
  }

  // Arms by the sides, swinging when walking; short sleeves show the forearms.
  const swing = pose === 'walk1' ? 1 : pose === 'walk2' ? -1 : 0;
  const sleeve = wear === 'tee' ? 16 : 19;
  const armsOnTable = sitting && front;
  for (let y = 15; y <= 21; y++) {
    if (armsOnTable && y > 18) break;
    const bare = y > sleeve;
    const hand = y >= 20;
    at(2, y + swing, bare || hand ? skin : shirt);
    at(3, y + swing, bare || hand ? skin : shirtShade);
    if (carry) continue;
    at(14, y - swing, bare || hand ? skinShade : mix(shirtShade, OUTLINE, 0.15));
    at(15, y - swing, bare || hand ? skinShade : shirtShade);
  }
  if ((wear === 'jumper' || wear === 'chef') && !armsOnTable) {
    // Cuffs.
    for (const x of [2, 3]) at(x, 19 + swing, shirtShade);
    if (!carry) for (const x of [14, 15]) at(x, 19 - swing, mix(shirtShade, OUTLINE, 0.25));
  }

  // The head: round (Adrian's is longer and narrower). Lit from the front, with just a little
  // shade down the far edge: no shadow along the jaw.
  const wide = look.face === 'adrian' ? 6.4 : 7;
  const tall = look.face === 'adrian' ? 7.4 : 6.9;
  const middle = look.face === 'adrian' ? 7.2 : HEAD_MIDDLE;
  const inHead = (x: number, y: number) => ((x + 0.5 - MIDDLE) / wide) ** 2 + ((y + 0.5 - middle) / tall) ** 2 <= 1;
  const edgeShade = mix(skin, skinShade, 0.5);
  for (let y = 0; y <= SHOULDERS; y++) {
    for (let x = 0; x < PERSON_WIDTH; x++) if (inHead(x, y)) at(x, y, x >= 14 ? edgeShade : skin);
  }
  // A dark line under the chin, where the head meets the shoulders.
  for (let x = 4; x <= 13; x++) {
    let bottom = -1;
    for (let y = 0; y <= SHOULDERS; y++) if (inHead(x, y)) bottom = y;
    if (bottom >= 12) at(x, bottom + 1, OUTLINE);
  }

  drawHair(at, look, facing, inHead, colour, edgeShade);

  // The face: eyes with a shine, rosy cheeks and a small mouth.
  if (front) {
    const eye = colour('e');
    const eyes = look.face === 'beaming' ? 'happy' : mood === 'tired' || mood === 'wornOut' ? 'tired' : 'open';
    for (const x of EYES) {
      if (eyes === 'happy') {
        // Squinting with joy (∩ ∩).
        at(x, EYE_ROW + 1, eye);
        at(x + 1, EYE_ROW + 1, eye);
        at(x - 1, EYE_ROW + 2, eye);
        at(x + 2, EYE_ROW + 2, eye);
      } else if (eyes === 'tired') {
        // Heavy eyelids.
        at(x, EYE_ROW, skinShade);
        at(x + 1, EYE_ROW, skinShade);
        for (let y = EYE_ROW + 1; y <= EYE_ROW + 2; y++) {
          at(x, y, eye);
          at(x + 1, y, eye);
        }
      } else {
        for (let y = EYE_ROW; y <= EYE_ROW + 2; y++) {
          at(x, y, eye);
          at(x + 1, y, eye);
        }
        // A shine in the top corner of each eye, on the side the light comes from.
        at(x, EYE_ROW, WHITE);
      }
    }
    const blush = colour('k');
    for (const x of [3, 4, 13, 14]) at(x, MOUTH_ROW - 1, blush);
    const mouth = colour('m');
    const tired = mood === 'tired' || mood === 'wornOut';
    if (look.face === 'adrian') {
      // A wide grin with two rabbit teeth.
      for (const x of [7, 8, 9, 10]) at(x, MOUTH_ROW, mouth);
      at(8, MOUTH_ROW + 1, WHITE);
      at(9, MOUTH_ROW + 1, WHITE);
    } else if (look.face === 'beaming' || mood === 'happy') {
      // A big open smile.
      for (const x of [7, 8, 9, 10]) at(x, MOUTH_ROW, mouth);
      at(8, MOUTH_ROW + 1, mouth);
      at(9, MOUTH_ROW + 1, mouth);
    } else if (look.smile && !tired) {
      at(7, MOUTH_ROW, mouth);
      at(10, MOUTH_ROW, mouth);
      at(8, MOUTH_ROW + 1, mouth);
      at(9, MOUTH_ROW + 1, mouth);
    } else {
      at(8, MOUTH_ROW, mouth);
      at(9, MOUTH_ROW, mouth);
    }
    if (look.glasses) {
      const frame = hex(look.glasses.colour);
      for (const x of EYES) {
        for (let dx = -1; dx <= 2; dx++) {
          for (let y = EYE_ROW - 1; y <= EYE_ROW + 3; y++) {
            const edge = dx === -1 || dx === 2 || y === EYE_ROW - 1 || y === EYE_ROW + 3;
            if (edge) at(x + dx, y, frame);
            else if (look.glasses.dark) at(x + dx, y, y === EYE_ROW ? mix(frame, WHITE, 0.3) : frame);
          }
        }
      }
      for (const x of [8, 9]) at(x, EYE_ROW, frame);
      at(3, EYE_ROW, frame);
      at(14, EYE_ROW, frame);
    }
    if (mood === 'wornOut' && look.face !== 'beaming') {
      // A drop of sweat.
      at(16, 1, SWEAT);
      at(15, 2, SWEAT);
      at(16, 2, SWEAT);
      at(15, 3, SWEAT);
      at(16, 3, mix(SWEAT, WHITE, 0.5));
    }
  }
}

/** Drawn over any accessories: forearms resting on the table, and a tray held up on one hand. */
function drawHands(image: Pixels, look: Look, facing: 'front' | 'back', pose: Pose, carry: Carry | undefined): void {
  const colour = (key: string) => hex(look.palette[key]);
  const at = (x: number, y: number, c: Rgb) => image.set(x, y + HEADROOM, c);
  const skin = colour('s');
  const skinShade = colour('S');
  const shirtShade = colour('C');
  // Seated, facing us: forearms resting on the table, the hands together.
  if (pose === 'sit' && facing === 'front') {
    const forearm = look.wear === 'tee' ? skin : shirtShade;
    for (let x = 2; x <= 5; x++) at(x, 19, forearm);
    for (let x = 12; x <= 15; x++) at(x, 19, forearm);
    for (const x of [6, 7]) at(x, 19, skin);
    for (const x of [10, 11]) at(x, 19, skinShade);
  }
  // A tray on one hand: a plate of pierogi and a glass of kompot, or nothing on the way back.
  if (carry) {
    for (let y = 16; y <= 18; y++) {
      at(14, y, mix(shirtShade, OUTLINE, 0.15));
      at(15, y, shirtShade);
    }
    at(14, 15, skinShade);
    at(15, 15, skinShade);
    for (let x = 9; x <= 16; x++) {
      at(x, 13, TRAY.light);
      at(x, 14, TRAY.dark);
    }
    if (carry === 'full') {
      for (let x = 10; x <= 14; x++) at(x, 12, TRAY.plate);
      at(11, 11, TRAY.food);
      at(12, 11, TRAY.food);
      at(13, 11, TRAY.foodShade);
      at(14, 11, TRAY.greens);
      for (let y = 9; y <= 12; y++) at(16, y, y <= 9 ? TRAY.glass : TRAY.kompot);
    }
  }
}

type Plot = (x: number, y: number, c: Rgb) => void;

/** Hair in its style: from the front a fringe and the sides; from behind it covers the head. */
function drawHair(
  at: Plot,
  look: Look,
  facing: 'front' | 'back',
  inHead: (x: number, y: number) => boolean,
  colour: (key: string) => Rgb,
  edgeShade: Rgb,
): void {
  const style = look.hair;
  const front = facing === 'front';
  const hair = colour('h');
  const hairShade = colour('H');
  const hairLight = mix(hair, WHITE, 0.35);
  const skin = colour('s');
  const side = (x: number) => Math.abs(x + 0.5 - MIDDLE);
  const loose = style === 'bob' || style === 'long';
  const hairAt = (x: number, y: number): boolean => {
    if (style === 'bald') {
      // Just a little left over the ears, or round the back.
      if (!inHead(x, y)) return false;
      return front ? side(x) >= 5.5 && y >= 5 && y <= 8 : y >= 6 && y <= 9;
    }
    if (!front) {
      if (inHead(x, y)) return y <= (style === 'long' ? 13 : style === 'bob' ? 11 : 9);
      if (style === 'long') return y >= 7 && y <= 19 && side(x) <= 5.5 - Math.max(0, y - 17);
      return style === 'bob' && y >= 6 && y <= 11 && side(x) <= 7.5;
    }
    if (y <= 4) return inHead(x, y);
    // A fringe with a few gaps, spikier for spiky hair.
    if (y === 5) return inHead(x, y) && !(style === 'spiky' ? [4, 7, 10, 13] : [6, 11]).includes(x);
    const reach = { short: 7, spiky: 6, cap: 7, bun: 8, bob: 11, long: 18 }[style];
    return side(x) >= 5.5 && y <= reach && (inHead(x, y) || (loose && side(x) <= 7.5));
  };
  for (let y = 0; y <= 19; y++) {
    for (let x = 0; x < PERSON_WIDTH; x++) {
      if (!hairAt(x, y)) {
        // A soft shadow on the forehead, just under the fringe.
        if (front && style !== 'bald' && y <= EYE_ROW - 1 && hairAt(x, y - 1) && inHead(x, y)) at(x, y, x >= 14 ? edgeShade : mix(skin, colour('S'), 0.45));
        continue;
      }
      const shine = (y === 1 && x >= 5 && x <= 7) || (y === 2 && x === 4);
      // Darker strands: clumps over the fringe from the front, falling locks from behind.
      const strand =
        style !== 'bald' && (front ? (y === 3 || y === 4) && (x === 6 || x === 11) : y >= 3 && ((x === 6 && y % 3 !== 0) || (x === 11 && y % 3 !== 1)));
      at(x, y, shine && style !== 'bald' ? hairLight : x >= 13 || strand ? hairShade : hair);
    }
  }
  const top = (x: number) => {
    for (let y = 0; y < 14; y++) if (inHead(x, y)) return y;
    return 14;
  };
  if (style === 'bun') {
    for (let y = -3; y <= 0; y++) {
      for (let x = 6; x <= 11; x++) {
        if (((x + 0.5 - MIDDLE) / 2.8) ** 2 + ((y + 0.5 - -1.2) / 2.3) ** 2 > 1) continue;
        at(x, y, x === 7 && y === -2 ? hairLight : x >= 10 ? hairShade : hair);
      }
    }
  }
  if (style === 'spiky') {
    // Five tufts standing up, tallest in the middle.
    for (const [px, h] of [
      [3, 2],
      [6, 3],
      [9, 3],
      [12, 3],
      [15, 2],
    ]) {
      const base = top(px);
      // Only where there's a head to grow from (Adrian's is narrower).
      if (base > 6) continue;
      for (let k = 0; k < h; k++) {
        const half = k < h - 1 ? 1 : 0;
        for (let dx = -half; dx <= half; dx++) at(px + dx, base - 1 - k, px + dx >= 13 ? hairShade : hair);
      }
    }
  }
  if (style === 'cap') {
    // A baseball cap: the crown and band, with the peak at the front.
    const cap = hex(look.palette.n);
    const capShade = hex(look.palette.N);
    for (let y = -1; y <= 4; y++) {
      for (let x = 0; x < PERSON_WIDTH; x++) {
        if (!inHead(x, y + 1) && !(y === 4 && inHead(x, y))) continue;
        at(x, y, y === 4 || x >= 12 ? capShade : x === 5 && y === 1 ? mix(cap, WHITE, 0.3) : cap);
      }
    }
    at(9, -2, capShade);
    if (front) for (let x = 2; x <= 15; x++) at(x, 5, mix(capShade, OUTLINE, 0.3));
  }
  if (style === 'bald') {
    // The light catching the top of the head.
    at(6, 1, mix(skin, WHITE, 0.6));
    at(7, 1, mix(skin, WHITE, 0.6));
    at(5, 2, mix(skin, WHITE, 0.4));
  }
}

/**
 * A whole person: their body, then accessories, with HEADROOM rows above for hats, outlined.
 * Seated people are cut off at the waist (the table hides the rest).
 */
export function personPixels(
  kind: PersonKind,
  facing: 'front' | 'back',
  pose: Pose,
  variant = 0,
  carry?: Carry,
  mood: FaceMood = 'fine',
): Pixels {
  const look = lookOf(kind, variant);
  const image = new Pixels(PERSON_WIDTH, PERSON_HEIGHT + HEADROOM);
  drawPerson(image, look, facing, pose, carry, mood);
  for (const overlay of look.overlays) {
    if (overlay.facing && overlay.facing !== facing) continue;
    image.draw(sprite(overlay.rows, look.palette), overlay.x, HEADROOM + overlay.y);
  }
  drawHands(image, look, facing, pose, carry);
  image.outline(OUTLINE);
  return pose === 'sit' ? image.crop(0, 0, image.width, HEADROOM + SEATED_ROWS) : image;
}

// ---------- Portraits for the Staff tab ----------

/** Rows of a portrait: the head and shoulders. */
export const PORTRAIT_ROWS = HEADROOM + 18;

/**
 * Someone's head and shoulders, facing us, with a face for their mood. Tomek is always happy;
 * Adrian already grins with his rabbit teeth.
 */
export function portraitPixels(kind: PersonKind, variant = 0, mood: FaceMood = 'fine'): Pixels {
  return personPixels(kind, 'front', 'stand', variant, undefined, mood).crop(0, 0, PERSON_WIDTH, PORTRAIT_ROWS);
}
