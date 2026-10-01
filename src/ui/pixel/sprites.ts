// Hand-drawn pixel sprites as text grids: one character per pixel, '.' is see-through.
// Each letter means a colour; a character's own palette decides which.
// The style follows project.md section 9.1 (reference 1: small chibi people).

import type { GroupId } from '../../data/groups';
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
