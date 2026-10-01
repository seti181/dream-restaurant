// Hand-drawn pixel sprites as text grids: one character per pixel, '.' is see-through.
// Each letter means a colour; a character's own palette decides which.

import { hex, Pixels, type Rgb } from './raster';

export type Palette = Record<string, string>;

/** Turns a grid into pixels, checking every row has the same width. */
export function sprite(rows: string[], palette: Palette): Pixels {
  const width = rows[0].length;
  rows.forEach((row, i) => {
    if (row.length !== width) throw new Error(`Row ${i} is ${row.length} wide, expected ${width}: "${row}"`);
  });
  const image = new Pixels(width, rows.length);
  const colours: Record<string, Rgb> = Object.fromEntries(Object.entries(palette).map(([k, v]) => [k, hex(v)]));
  rows.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (ch === '.') return;
      const colour = colours[ch];
      if (!colour) throw new Error(`No colour for "${ch}"`);
      image.set(x, y, colour);
    }),
  );
  return image;
}

// ---------- People: a small chibi in the style of reference 1 ----------

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
];

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
];

const BASE = { o: '#3b2433', s: '#f3c9a5', S: '#d9a27f', e: '#3b2433', k: '#f2a08a', m: '#a8564a', b: '#4a3426' };

export const PEOPLE: Record<string, Palette> = {
  // A tourist in an amber T-shirt.
  tourist: { ...BASE, h: '#e8c06a', H: '#c99a45', c: '#e9a23b', C: '#c47f22', d: '#e9a23b', p: '#5d7aa8', P: '#465f86' },
  // A local in a red jumper.
  local: { ...BASE, h: '#8a5233', H: '#6b3d24', c: '#b5452f', C: '#8c3322', d: '#d9c7a8', p: '#4a4a55', P: '#36363f' },
  // The waiter: white shirt, dark waistcoat, bow tie.
  waiter: { ...BASE, h: '#6b3d24', H: '#4a2a18', c: '#2e2a33', C: '#1f1c23', d: '#f4f1ea', p: '#2e2a33', P: '#1f1c23' },
  // The chef in whites.
  chef: { ...BASE, h: '#4a2a18', H: '#2e1a0f', c: '#f4f1ea', C: '#d6d0c4', d: '#b9b2a4', p: '#3d3a46', P: '#2a2830', w: '#ffffff', W: '#d6d0c4' },
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
];

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
];

export const PLANT_COLOURS: Palette = { o: '#2f3b2a', L: '#4f8f45', l: '#8cc46a', p: '#c97a4a', P: '#9c5a33' };

export const LAMP = [
  '....o....',
  '...ooo...',
  '..oSSSo..',
  '.oSSSSSo.',
  'oSSSSSSSo',
  'ooyyyyyoo',
  '...yyy...',
];

export const LAMP_COLOURS: Palette = { o: '#3b2433', S: '#3c6b4f', y: '#ffe08a' };
