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
export const PERSON_WIDTH = 24;
export const PERSON_HEIGHT = 37;
/** Room above the head for hats, buns and spiky hair. */
export const HEADROOM = 7;
/** Rows of a person that show above a table when they sit: the head and the body down to the waist. */
export const SEATED_ROWS = 27;

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
  x: 1,
  y: -3,
  rows: [
    '......oooooooooo......',
    '.....oyyyyyyyyyyo.....',
    '....oyyyyyyyyyyyyo....',
    '....oyyyyyyyyyyyyo....',
    '....orrrrrrrrrrrro....',
    'ooyyyyyyyyyyyyyyyyyyoo',
    '.oooooooooooooooooooo.',
  ],
};
/** A camera on a strap round the neck. */
const CAMERA: Overlay = { x: 10, y: 18, facing: 'front', rows: ['K...K', 'K...K', 'ooooo', 'oKLzo', 'ooooo'] };
const BACKPACK_STRAPS: Overlay = { x: 7, y: 17, facing: 'front', rows: Array(7).fill('B........B') };
const BACKPACK: Overlay = {
  x: 6,
  y: 17,
  facing: 'back',
  rows: ['oooooooooooo', 'oBBBBBBBBBBo', 'oBBBBBBBBBBo', 'oGGGGGGGGGGo', 'oBBBBBBBBBBo', 'oBBGGGGGGBBo', 'oBBGGGGGGBBo', 'oBBBBBBBBBBo', 'oooooooooooo'],
};
/** A band of white crosses with yellow middles across a local's jumper. */
const KASHUBIAN_PATTERN: Overlay = { x: 6, y: 19, rows: ['.z..z..z..z.', 'zyzzyzzyzzyz', '.z..z..z..z.'] };
/** A foodie's cream scarf, with one end hanging down and a fringe; from behind, just the wrap. */
const SCARF: Overlay = {
  x: 6,
  y: 17,
  facing: 'front',
  rows: ['ffffffffffff', 'AAffffffffAA', '........ffA.', '........ffA.', '........ffA.', '........f.f.'],
};
const SCARF_BACK: Overlay = { x: 6, y: 17, facing: 'back', rows: ['ffffffffffAA', 'AAAAAAAAAAAA'] };
/** A black beret, worn at a tilt. */
const BERET: Overlay = { x: 3, y: -2, rows: ['......oooooooo....', '....ooKKKKKKKKoo..', '...oKKKKKKKKKKKKo.', '...oooooooooooooo.'] };
const FLAT_CAP: Overlay = {
  x: 3,
  y: -1,
  rows: ['....oooooooooo....', '...oQQQQQQQQQQo...', '..oQQQQQQQQQQQQo..', '.oDDDDDDDDDDDDDDo.', 'oooooooooooooooooo'],
};
const KOMPOT_STAIN: Overlay = { x: 14, y: 27, facing: 'front', rows: ['r.', '.r'] };
/** A tall pleated toque. */
const CHEF_HAT: Overlay = {
  x: 2,
  y: -7,
  rows: [
    '......oooooooo......',
    '....oowwwwwwwwoo....',
    '...owwwwwwwwwwwWo...',
    '..owwwwwwwwwwwwwWo..',
    '..owwwwwwwwwwwwwWo..',
    '...owwWwwWwwWwwWo...',
    '...owWwwWwwWwwWWo...',
    '...oWWWWWWWWWWWWo...',
    '...oooooooooooooo...',
  ],
};
/** A big white walrus moustache, drooping at the ends. */
const MOUSTACHE: Overlay = { x: 7, y: 11, facing: 'front', rows: ['.oWWWWWWo.', 'oWWWWWWWWo', 'oWWo..oWWo', '.oo....oo.'] };
/** A little red-and-white Solidarność badge on the lapel. */
const BADGE: Overlay = { x: 8, y: 19, facing: 'front', rows: ['r', 'z'] };
/** Security's earpiece wire. */
const EARPIECE: Overlay = { x: 19, y: 10, facing: 'front', rows: ['L', 'L', 'L', 'L', 'L'] };
/** An accordion held across the chest: white and black keys on the left, red bellows with white folds. */
const ACCORDION: Overlay = {
  x: 5,
  y: 18,
  facing: 'front',
  rows: ['oooooooooooooo', 'owwoRzRzRzRzRo', 'owKoRzRzRzRzRo', 'owwoRzRzRzRzRo', 'owKoRzRzRzRzRo', 'oooooooooooooo'],
};
/** A headscarf, for the amber seller. */
const HEADSCARF: Overlay = {
  x: 2,
  y: -1,
  rows: [
    '....oooooooooooo....',
    '...oXXXXXXXXXXXXo...',
    '..oXXXXXXXXXXXXXXo..',
    '..oXXXXXXXXXXXXXXo..',
    '..oXXXXXXXXXXXXXXo..',
    ...Array(7).fill('..oXXo........oXXo..'),
    '...oXo........oXo...',
  ],
};
/** Lechia Gdańsk's green and white stripes. */
const STRIPES: Overlay = { x: 7, y: 17, facing: 'front', rows: Array(9).fill('.z.z.z.z.z') };

// The named regulars (data/regulars.ts).
/** Filip's office lanyard. */
const LANYARD: Overlay = { x: 10, y: 17, facing: 'front', rows: ['L..L', 'L..L', '.LL.', '.ww.', '.ww.'] };
/** Mr Fletcher's khaki bucket hat. */
const BUCKET_HAT: Overlay = {
  x: 2,
  y: -2,
  rows: ['....oooooooooooo....', '...offffffffffffo...', '..offffffffffffffo..', 'offffffffffffffffffo', '.oooooooooooooooooo.'],
};
/** Pan Henryk's white moustache, drooping a little at the ends. */
const DROOPING_MOUSTACHE: Overlay = { x: 9, y: 11, facing: 'front', rows: ['.wwww.', 'w....w'] };
/** Weronika's sketchbook under her arm, and paint on her trousers. */
const SKETCHBOOK: Overlay = { x: 18, y: 20, facing: 'front', rows: ['oooo', 'owwo', 'owKo', 'oooo'] };
const PAINT_SPOTS: Overlay = { x: 7, y: 29, facing: 'front', rows: ['.R....L', '...R...'] };

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

/**
 * How someone stands or sits: standing, the two steps of a walk, a chef stirring (two ways), or at
 * a table: resting, eating (the fork in hand, or at the mouth) or reading the menu.
 */
export type Pose = 'stand' | 'walk1' | 'walk2' | 'stir1' | 'stir2' | 'sit' | 'eat' | 'bite' | 'menu';

/** Poses at a table, where the table hides everything below the waist. */
export const seated = (pose: Pose): boolean => pose === 'sit' || pose === 'eat' || pose === 'bite' || pose === 'menu';

/** What a waiter carries: a tray with a plate of food, or the empty tray on the way back. */
export type Carry = 'full' | 'empty';

/** How someone feels, as their face shows it. */
export type FaceMood = 'happy' | 'fine' | 'tired' | 'wornOut';

const WHITE = hex('#ffffff');
const OUTLINE = hex('#3b2433');
const GOLD = hex('#d9a92b');
const TRAY = { light: hex('#d6dde2'), dark: hex('#8a979e'), plate: hex('#fdf8ee'), food: hex('#e9b65a'), foodShade: hex('#c98f3a'), greens: hex('#6aa84f'), glass: hex('#cfe6f0'), kompot: hex('#b5452f') };
const SWEAT = hex('#7fb2d3');
const STEEL = { light: hex('#e3e8eb'), mid: hex('#c9d1d6') };
const SPOON = hex('#8a5a36');
const MENU = { card: hex('#f7f0e0'), edge: hex('#c8b89a'), title: hex('#b5452f'), text: hex('#9a8a78') };

// Where things are on a person, in pixels from the left and rows from the top of the head.
/** The middle of the body, between two columns. */
const MIDDLE = 12;
/** The head is an oval around (MIDDLE, HEAD_MIDDLE). */
const HEAD_MIDDLE = 8.4;
/** The eyes take three rows from here, at these columns (two pixels wide each). */
const EYE_ROW = 8;
const EYES = [8, 14];
const MOUTH_ROW = 12;
/** The body: the top from the shoulders to the waist, then trousers, then shoes. */
const SHOULDERS = 16;
const WAIST = 27;
const SHOES = 34;

/**
 * Draws a person in code: a round head with shining eyes and rosy cheeks, hair in their style,
 * and clothes with light from the upper left and the details of what they wear. Legs step for
 * walking. Proportions as in the concept picture: the head is about two fifths of a table's width.
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
    for (let x = 6 + inset; x <= 17 - inset; x++) {
      const fold = wear !== 'waiter' && wear !== 'suit' && ((y === 21 && x === 8) || (y === 22 && x === 9) || (y === 19 && x === 14));
      at(x, y, x >= 16 || fold ? shirtShade : x <= 7 ? shirtLight : shirt);
    }
  }
  if (front) {
    switch (wear) {
      case 'tee':
        // A round neck.
        for (let x = 10; x <= 13; x++) at(x, 17, shirtShade);
        break;
      case 'hoodie':
        // Drawstrings and a front pocket.
        for (const x of [10, 13]) for (let y = 17; y <= 19; y++) at(x, y, accent);
        for (let x = 7; x <= 16; x++) at(x, 22, shirtShade);
        for (let y = 23; y <= 25; y++) {
          at(7, y, shirtShade);
          at(16, y, shirtShade);
        }
        break;
      case 'jumper':
        // A ribbed hem.
        for (let x = 6; x <= 17; x++) at(x, WAIST - 1, x % 2 === 0 ? shirtShade : mix(shirtShade, OUTLINE, 0.25));
        break;
      case 'shirt': {
        // Collar points, a tie (unless it's the shirt's own colour) and a breast pocket.
        const collar = mix(shirt, WHITE, 0.55);
        for (const x of [8, 9, 14, 15]) at(x, 17, collar);
        if (look.palette.d !== look.palette.c) {
          for (let y = 17; y <= 23; y++) {
            at(11, y, y === 17 ? mix(accent, OUTLINE, 0.25) : accent);
            at(12, y, mix(accent, OUTLINE, 0.25));
          }
        }
        at(14, 19, shirtShade);
        at(15, 19, shirtShade);
        break;
      }
      case 'top':
        // A V-neck.
        for (let x = 10; x <= 13; x++) at(x, 17, skin);
        at(11, 18, skin);
        at(12, 18, skinShade);
        break;
      case 'suit':
      case 'waiter':
        // A white shirt in the V of the jacket: a tie for a suit, a bow tie for a waiter.
        for (let x = 9; x <= 14; x++) at(x, 17, white);
        for (let x = 10; x <= 13; x++) at(x, 18, x === 13 ? whiteShade : white);
        at(11, 19, white);
        at(12, 19, whiteShade);
        if (wear === 'suit') {
          for (let y = 17; y <= 22; y++) {
            at(11, y, accent);
            at(12, y, mix(accent, OUTLINE, 0.3));
          }
        } else {
          for (const x of [10, 11, 12, 13]) at(x, 17, x === 11 || x === 12 ? mix(shirt, OUTLINE, 0.4) : shirt);
        }
        break;
      case 'chef':
        // A stand-up collar and a double row of buttons.
        for (let x = 8; x <= 15; x++) at(x, 17, shirtShade);
        for (const y of [19, 21, 23]) {
          at(9, y, accent);
          at(14, y, accent);
        }
        break;
    }
  } else if (wear === 'hoodie') {
    // The hood, lying on the back.
    for (let y = 16; y <= 19; y++) {
      const narrow = Math.max(0, y - 18);
      for (let x = 8 + narrow; x <= 15 - narrow; x++) at(x, y, y === 16 || x === 8 + narrow || x === 15 - narrow ? shirtShade : mix(shirtShade, OUTLINE, 0.25));
    }
  }

  // Legs and shoes; when walking, one foot is lifted. A waiter's long apron hangs over them.
  const sitting = seated(pose);
  if (!sitting) {
    const pants = colour('p');
    const pantsShade = colour('P');
    const shoes = colour('b');
    const belt = wear === 'shirt' || wear === 'suit';
    for (let x = 6; x <= 17; x++) at(x, WAIST, belt || x >= 16 ? pantsShade : pants);
    if (belt) {
      at(11, WAIST, GOLD);
      at(12, WAIST, GOLD);
    }
    const lift = { left: pose === 'walk1' ? 1 : 0, right: pose === 'walk2' ? 1 : 0 };
    for (const [x0, up, out] of [
      [7, lift.left, -1],
      [13, lift.right, 1],
    ]) {
      for (let y = WAIST + 1; y < SHOES - up; y++) for (let x = x0; x <= x0 + 3; x++) at(x, y, x === x0 + 3 ? pantsShade : pants);
      for (let x = x0; x <= x0 + 3; x++) at(x, SHOES - up, x === x0 + 1 ? mix(shoes, WHITE, 0.3) : shoes);
      for (let x = Math.min(x0, x0 + out); x <= Math.max(x0 + 3, x0 + 3 + out); x++) at(x, SHOES + 1 - up, shoes);
    }
  }
  if (wear === 'waiter') {
    const bottom = sitting ? WAIST - 1 : SHOES - 2;
    if (front) {
      for (let y = 23; y <= bottom; y++) for (let x = 7; x <= 16; x++) at(x, y, y === 23 || x >= 15 || (x === 10 && y > 26) ? whiteShade : white);
    } else {
      // The apron strings, tied in a bow at the back.
      for (let x = 6; x <= 17; x++) at(x, 23, whiteShade);
      for (const [x, y] of [[10, 22], [13, 22], [10, 24], [13, 24], [11, 23], [12, 23], [11, 25], [12, 25]]) at(x, y, white);
    }
  }

  // Arms by the sides, swinging when walking; short sleeves show the forearms. A stirring arm, an
  // arm raised to eat and the arm under a tray are drawn with the hands, over everything else.
  const swing = pose === 'walk1' ? 1 : pose === 'walk2' ? -1 : 0;
  const sleeve = wear === 'tee' ? 19 : 23;
  const armsOnTable = sitting && front;
  const stirring = pose === 'stir1' || pose === 'stir2';
  const leftFree = !stirring;
  const rightFree = !carry && pose !== 'bite';
  for (let y = 17; y <= 25; y++) {
    if (armsOnTable && y > 21) break;
    const bare = y > sleeve;
    const hand = y >= 24;
    if (leftFree) {
      at(4, y + swing, bare || hand ? skin : shirt);
      at(5, y + swing, bare || hand ? skin : shirtShade);
    }
    if (rightFree) {
      at(18, y - swing, bare || hand ? skinShade : mix(shirtShade, OUTLINE, 0.15));
      at(19, y - swing, bare || hand ? skinShade : shirtShade);
    }
  }
  if ((wear === 'jumper' || wear === 'chef') && !armsOnTable) {
    // Cuffs.
    if (leftFree) for (const x of [4, 5]) at(x, 23 + swing, shirtShade);
    if (rightFree) for (const x of [18, 19]) at(x, 23 - swing, mix(shirtShade, OUTLINE, 0.25));
  }

  // The head: round (Adrian's is longer and narrower). Lit from the front, with just a little
  // shade down the far edge: no shadow along the jaw.
  const wide = look.face === 'adrian' ? 7.4 : 8.2;
  const tall = look.face === 'adrian' ? 8.6 : 8;
  const middle = look.face === 'adrian' ? 8.8 : HEAD_MIDDLE;
  const inHead = (x: number, y: number) => ((x + 0.5 - MIDDLE) / wide) ** 2 + ((y + 0.5 - middle) / tall) ** 2 <= 1;
  const edgeShade = mix(skin, skinShade, 0.5);
  for (let y = 0; y <= SHOULDERS; y++) {
    for (let x = 0; x < PERSON_WIDTH; x++) if (inHead(x, y)) at(x, y, x >= 18 ? edgeShade : skin);
  }
  // A dark line under the chin, where the head meets the shoulders.
  for (let x = 6; x <= 17; x++) {
    let bottom = -1;
    for (let y = 0; y <= SHOULDERS; y++) if (inHead(x, y)) bottom = y;
    if (bottom >= 13) at(x, bottom + 1, OUTLINE);
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
    for (const x of [5, 6, 17, 18]) at(x, MOUTH_ROW - 1, blush);
    const mouth = colour('m');
    const tired = mood === 'tired' || mood === 'wornOut';
    if (look.face === 'adrian') {
      // A wide grin with two rabbit teeth.
      for (const x of [10, 11, 12, 13]) at(x, MOUTH_ROW, mouth);
      at(11, MOUTH_ROW + 1, WHITE);
      at(12, MOUTH_ROW + 1, WHITE);
    } else if (look.face === 'beaming' || mood === 'happy') {
      // A big open smile.
      for (const x of [10, 11, 12, 13]) at(x, MOUTH_ROW, mouth);
      at(11, MOUTH_ROW + 1, mouth);
      at(12, MOUTH_ROW + 1, mouth);
    } else if (look.smile && !tired) {
      at(10, MOUTH_ROW, mouth);
      at(13, MOUTH_ROW, mouth);
      at(11, MOUTH_ROW + 1, mouth);
      at(12, MOUTH_ROW + 1, mouth);
    } else {
      at(11, MOUTH_ROW, mouth);
      at(12, MOUTH_ROW, mouth);
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
      for (const x of [11, 12]) at(x, EYE_ROW, frame);
      at(6, EYE_ROW, frame);
      at(17, EYE_ROW, frame);
    }
    if (mood === 'wornOut' && look.face !== 'beaming') {
      // A drop of sweat.
      at(20, 2, SWEAT);
      at(19, 3, SWEAT);
      at(20, 3, SWEAT);
      at(19, 4, SWEAT);
      at(20, 4, mix(SWEAT, WHITE, 0.5));
    }
  }
}

/**
 * Drawn over any accessories: forearms resting on the table, a fork, a menu, a fork raised to the
 * mouth, a chef's arm stirring the pot, and a tray held up on one hand.
 */
function drawHands(image: Pixels, look: Look, facing: 'front' | 'back', pose: Pose, carry: Carry | undefined): void {
  const colour = (key: string) => hex(look.palette[key]);
  const at = (x: number, y: number, c: Rgb) => image.set(x, y + HEADROOM, c);
  const skin = colour('s');
  const skinShade = colour('S');
  const shirt = colour('c');
  const shirtShade = colour('C');
  const tee = look.wear === 'tee';
  const forearm = tee ? skin : shirtShade;
  const front = facing === 'front';
  if (seated(pose) && front) {
    // The left forearm rests on the table.
    for (let x = 4; x <= 8; x++) at(x, 22, forearm);
    for (const x of [9, 10]) at(x, 22, skin);
    if (pose === 'bite') {
      // The right hand brings the fork up to the mouth: the upper arm down to the elbow, then the forearm across.
      for (let y = 17; y <= 20; y++) {
        const bare = tee && y > 19;
        at(18, y, bare ? skinShade : mix(shirtShade, OUTLINE, 0.15));
        at(19, y, bare ? skinShade : shirtShade);
      }
      for (const [x, y] of [[16, 20], [17, 20], [16, 19], [17, 19], [15, 18], [16, 18], [15, 17], [16, 17], [14, 16], [15, 16]]) at(x, y, forearm);
      for (const [x, y] of [[14, 15], [15, 15], [13, 14], [14, 14]]) at(x, y, skin);
      at(12, 13, STEEL.light);
    } else {
      // The right forearm rests on the table too.
      for (let x = 15; x <= 19; x++) at(x, 22, forearm);
      for (const x of [13, 14]) at(x, 22, skinShade);
      // A fork held up in the right hand, ready.
      if (pose === 'eat') for (const y of [19, 20, 21]) at(14, y, y === 19 ? STEEL.light : STEEL.mid);
      if (pose === 'menu') {
        // The menu card, held up in both hands: a red heading and a few lines of dishes.
        for (let y = 17; y <= 22; y++) {
          for (let x = 9; x <= 15; x++) {
            const edge = x === 9 || x === 15 || y === 17 || y === 22;
            const line = !edge && ((y === 18 && x >= 10 && x <= 14) || ((y === 20 || y === 21) && x % 2 === 0));
            at(x, y, edge ? MENU.edge : line ? (y === 18 ? MENU.title : MENU.text) : MENU.card);
          }
        }
        for (const y of [21, 22]) {
          at(8, y, skin);
          at(16, y, skinShade);
        }
      }
    }
  }
  if (pose === 'bite' && !front) {
    // Seen from behind, the right elbow comes up.
    for (let y = 15; y <= 18; y++) {
      at(18, y, mix(shirtShade, OUTLINE, 0.15));
      at(19, y, shirtShade);
    }
    at(20, 16, shirtShade);
    at(20, 17, shirtShade);
  }
  if (pose === 'stir1' || pose === 'stir2') {
    // The left arm reaches down to the pot in front, a wooden spoon in the hand, back and forth.
    const low = pose === 'stir1';
    const arm: [number, number][] = low
      ? [[4, 17], [5, 17], [3, 18], [4, 18], [2, 19], [3, 19], [2, 20], [3, 20]]
      : [[4, 17], [5, 17], [3, 18], [4, 18], [3, 19], [4, 19]];
    arm.forEach(([x, y], i) => at(x, y, i % 2 === 0 ? shirt : shirtShade));
    const hand: [number, number][] = low ? [[1, 21], [2, 21]] : [[2, 20], [3, 20]];
    for (const [x, y] of hand) at(x, y, skin);
    const spoon: [number, number][] = low ? [[1, 22], [0, 23]] : [[2, 21], [1, 22], [0, 23]];
    for (const [x, y] of spoon) at(x, y, SPOON);
  }
  // A tray on one hand: a plate of pierogi and a glass of kompot, or nothing on the way back.
  if (carry) {
    for (let y = 18; y <= 21; y++) {
      at(18, y, mix(shirtShade, OUTLINE, 0.15));
      at(19, y, shirtShade);
    }
    at(18, 17, skinShade);
    at(19, 17, skinShade);
    for (let x = 13; x <= 21; x++) {
      at(x, 15, TRAY.light);
      at(x, 16, TRAY.dark);
    }
    if (carry === 'full') {
      for (let x = 14; x <= 18; x++) at(x, 14, TRAY.plate);
      at(15, 13, TRAY.food);
      at(16, 13, TRAY.food);
      at(17, 13, TRAY.foodShade);
      at(18, 13, TRAY.greens);
      for (let y = 11; y <= 14; y++) at(21, y, y <= 11 ? TRAY.glass : TRAY.kompot);
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
      return front ? side(x) >= 6.5 && y >= 6 && y <= 10 : y >= 7 && y <= 11;
    }
    if (!front) {
      if (inHead(x, y)) return y <= (style === 'long' ? 15 : style === 'bob' ? 13 : 11);
      if (style === 'long') return y >= 8 && y <= 23 && side(x) <= 6.5 - Math.max(0, y - 21);
      return style === 'bob' && y >= 7 && y <= 13 && side(x) <= 9.5;
    }
    if (y <= 5) return inHead(x, y);
    // A fringe with a few gaps, spikier for spiky hair.
    if (y === 6) return inHead(x, y) && !(style === 'spiky' ? [6, 10, 13, 17] : [8, 15]).includes(x);
    const reach = { short: 9, spiky: 8, cap: 9, bun: 10, bob: 13, long: 22 }[style];
    return side(x) >= 6.5 && y <= reach && (inHead(x, y) || (loose && side(x) <= 9.5));
  };
  for (let y = 0; y <= 23; y++) {
    for (let x = 0; x < PERSON_WIDTH; x++) {
      if (!hairAt(x, y)) {
        // A soft shadow on the forehead, just under the fringe.
        if (front && style !== 'bald' && y <= EYE_ROW - 1 && hairAt(x, y - 1) && inHead(x, y)) at(x, y, x >= 18 ? edgeShade : mix(skin, colour('S'), 0.45));
        continue;
      }
      const shine = (y === 2 && x >= 7 && x <= 9) || (y === 3 && x === 6);
      // Darker strands: clumps over the fringe from the front, falling locks from behind.
      const strand =
        style !== 'bald' && (front ? (y === 4 || y === 5) && (x === 8 || x === 15) : y >= 4 && ((x === 8 && y % 3 !== 0) || (x === 15 && y % 3 !== 1)));
      at(x, y, shine && style !== 'bald' ? hairLight : x >= 17 || strand ? hairShade : hair);
    }
  }
  const top = (x: number) => {
    for (let y = 0; y < 16; y++) if (inHead(x, y)) return y;
    return 16;
  };
  if (style === 'bun') {
    for (let y = -4; y <= 0; y++) {
      for (let x = 8; x <= 15; x++) {
        if (((x + 0.5 - MIDDLE) / 3.2) ** 2 + ((y + 0.5 - -1.5) / 2.6) ** 2 > 1) continue;
        at(x, y, x === 10 && y === -3 ? hairLight : x >= 14 ? hairShade : hair);
      }
    }
  }
  if (style === 'spiky') {
    // Five tufts standing up, tallest in the middle.
    for (const [px, h] of [
      [5, 2],
      [8, 3],
      [12, 4],
      [15, 3],
      [18, 2],
    ]) {
      const base = top(px);
      // Only where there's a head to grow from (Adrian's is narrower).
      if (base > 7) continue;
      for (let k = 0; k < h; k++) {
        const half = k < h - 1 ? 1 : 0;
        for (let dx = -half; dx <= half; dx++) at(px + dx, base - 1 - k, px + dx >= 17 ? hairShade : hair);
      }
    }
  }
  if (style === 'cap') {
    // A baseball cap: the crown and band, with the peak at the front.
    const cap = hex(look.palette.n);
    const capShade = hex(look.palette.N);
    for (let y = -1; y <= 5; y++) {
      for (let x = 0; x < PERSON_WIDTH; x++) {
        if (!inHead(x, y + 1) && !(y === 5 && inHead(x, y))) continue;
        at(x, y, y === 5 || x >= 16 ? capShade : x === 8 && y === 1 ? mix(cap, WHITE, 0.3) : cap);
      }
    }
    at(12, -2, capShade);
    if (front) for (let x = 4; x <= 19; x++) at(x, 6, mix(capShade, OUTLINE, 0.3));
  }
  if (style === 'bald') {
    // The light catching the top of the head.
    at(8, 2, mix(skin, WHITE, 0.6));
    at(9, 2, mix(skin, WHITE, 0.6));
    at(7, 3, mix(skin, WHITE, 0.4));
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
  return seated(pose) ? image.crop(0, 0, image.width, HEADROOM + SEATED_ROWS) : image;
}

// ---------- Portraits for the Staff tab ----------

/** Rows of a portrait: the head and shoulders. */
export const PORTRAIT_ROWS = HEADROOM + 21;

/**
 * Someone's head and shoulders, facing us, with a face for their mood. Tomek is always happy;
 * Adrian already grins with his rabbit teeth.
 */
export function portraitPixels(kind: PersonKind, variant = 0, mood: FaceMood = 'fine'): Pixels {
  return personPixels(kind, 'front', 'stand', variant, undefined, mood).crop(0, 0, PERSON_WIDTH, PORTRAIT_ROWS);
}
