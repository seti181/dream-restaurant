// Small pixel-art icons for the interface: money, stars, weather, and a picture for
// every dish and drink. Same outline colour and warm palette as the restaurant.

import type { TemplateId } from '../../data/dishes';
import type { Weather } from '../../data/weather';
import type { Palette } from './sprites';

export interface IconArt {
  rows: readonly string[];
  palette: Palette;
}

const O = '#3b2433';

// ---------- Interface ----------

export const COIN: IconArt = {
  rows: ['...ooo...', '.ooyyyoo.', '.oyYYYyo.', 'oyYyyyYyo', 'oyYyyyYyo', 'oyYyyyYyo', '.oyYYYyo.', '.ooyyyoo.', '...ooo...'],
  palette: { o: '#7a5a12', y: '#f4c531', Y: '#c99a12' },
};

export const STAR: IconArt = {
  rows: ['....o....', '...oyo...', '...oyo...', 'oooyyyooo', 'oyyyyyyyo', '.oyyyyyo.', '..oyyyo..', '.oyyoyyo.', '.oo...oo.'],
  palette: { o: '#a07a12', y: '#f4c531' },
};

const SUN_ROWS = ['....r....', '.r.....r.', '...ooo...', '..oYYYo..', 'r.oYYYo.r', '..oYYYo..', '...ooo...', '.r.....r.', '....r....'];
const CLOUD_ROWS = ['...oooo...', '..owwwwo..', '.oowwwwooo', 'owwwwwwwwo', 'owwwwwwwwo', '.oooooooo.'];

export const WEATHER_ICONS: Record<Weather, IconArt> = {
  sunny: { rows: SUN_ROWS, palette: { r: '#f4c531', o: '#e9a23b', Y: '#f4c531' } },
  heatwave: { rows: SUN_ROWS, palette: { r: '#d9412b', o: '#b5452f', Y: '#e9a23b' } },
  cloudy: { rows: CLOUD_ROWS, palette: { o: '#8a979e', w: '#ffffff' } },
  rain: { rows: [...CLOUD_ROWS, '..b..b..b.', '.b..b..b..'], palette: { o: '#8a979e', w: '#e6eef3', b: '#5d8aa8' } },
};

// ---------- Food ----------

const PLATE = ['.oooooooooo.', 'owwwwwwwwwwo', '.oooooooooo.'];
const BOWL = (top: string, garnish: string) => [
  '.oooooooooo.',
  `o${top}o`,
  `o${garnish}o`,
  'owwwwwwwwwwo',
  '.owwwwwwwwo.',
  '..owwwwwwo..',
  '...oooooo...',
];
const plated = (food: string[]) => [...food, ...PLATE];
const base = { o: O, w: '#fdf8ee' };

export const FOOD_ICONS: Record<TemplateId, IconArt> = {
  zurek: { rows: BOWL('ssssssssss', 'sSseessksS'), palette: { ...base, s: '#e8d5a8', S: '#d4bd8a', e: '#ffffff', k: '#a0522d' } },
  barszcz: { rows: BOWL('ssssssssss', 'sSssuusssS'), palette: { ...base, s: '#b5203a', S: '#8c1830', u: '#e8d5a8' } },
  fishSoup: { rows: BOWL('ssssssssss', 'sSsffsgssS'), palette: { ...base, s: '#f1e2c4', S: '#e2cda0', f: '#e9a23b', g: '#4f8f45' } },
  tomatoSoup: { rows: BOWL('ssssssssss', 'sSnnssnnsS'), palette: { ...base, s: '#d9502f', S: '#b03f24', n: '#f1d9a0' } },
  saladBowl: { rows: BOWL('glglgglglg', 'gGrgGgrgGg'), palette: { ...base, g: '#4f8f45', G: '#3a6e33', l: '#8cc46a', r: '#d9412b' } },
  pierogi: { rows: plated(['.oo..oo..oo.', 'oddooddooddo', 'oDdooDdooDdo']), palette: { ...base, d: '#f1d9a0', D: '#d9b97a' } },
  pizza: { rows: plated(['..oooooooo..', '.orrcrrcrro.', 'orcrrcrrcrro']), palette: { ...base, r: '#d9412b', c: '#f4d03f' } },
  pasta: { rows: plated(['...oooooo...', '..oyyyyyyo..', '.oysysysyso.']), palette: { ...base, y: '#f1d9a0', s: '#d9502f' } },
  burger: { rows: plated(['...oooooo...', '..obbbbbbo..', '..oggggggo..', '..ommmmmmo..']), palette: { ...base, b: '#d9a066', g: '#4f8f45', m: '#6b3d24' } },
  friedCod: { rows: plated(['.f.f.oooooo.', '.f.foggggggo', 'offfoggggggo']), palette: { ...base, f: '#f4d03f', g: '#d9a066' } },
  schabowy: { rows: plated(['..oooooooo..', '.oggggggggo.', 'oggGgggGggpo']), palette: { ...base, g: '#d9a066', G: '#b8794a', p: '#f1e2c4' } },
  golabki: { rows: plated(['.oooo..oooo.', 'olLlloolLllo', 'orrrrrrrrrro']), palette: { ...base, l: '#a8c97a', L: '#7fa35a', r: '#d9502f' } },
  arrozDeVitela: { rows: plated(['...oooooo...', '.ooRRkkRRoo.', 'oRRRkkkkRRRo']), palette: { ...base, R: '#f6eedc', k: '#8a5233' } },
  szarlotka: { rows: plated(['....ooooo...', '...occccco..', '..oaaaaaaao.', '.obbbbbbbbbo']), palette: { ...base, c: '#c99a5a', a: '#f4e3a1', b: '#d9a066' } },
  sernik: { rows: plated(['....ooooo...', '...occccco..', '..oaaaaaaao.', '.obbbbbbbbbo']), palette: { ...base, c: '#8a5233', a: '#fbecc0', b: '#d9a066' } },
  iceCream: {
    rows: ['...oooooo...', '..oppppppo..', '.oppwwwwppo.', '..oppppppo..', '..oyyyyyyo..', '...oyYyyo...', '....oyyo....', '.....oo.....'],
    palette: { o: O, p: '#f2a0b0', w: '#fdf8ee', y: '#e0b06a', Y: '#c99a5a' },
  },
  coffee: {
    rows: ['...s.s.s....', '..oooooooo..', '..occccccoo.', '..owwwwwwo.o', '..owwwwwwoo.', '...owwwwo...', '.oooooooooo.', 'owwwwwwwwwwo', '.oooooooooo.'],
    palette: { o: O, s: '#c9d3d8', c: '#6b3d24', w: '#fdf8ee' },
  },
  kompot: {
    rows: ['...oooooo...', '...owwwwo...', '..oppppppo..', '..oprppppo..', '..opppprpo..', '..oprppppo..', '..oppppppo..', '...oooooo...'],
    palette: { o: O, w: '#e6f3f7', p: '#e07a8a', r: '#a8203a' },
  },
  lemonade: {
    rows: ['.......o....', '..oooooxoo..', '..owwwwxwo..', '..oyyyyxyo..', '..oyLyyyyo..', '..oyyyyLyo..', '..oyyyyyyo..', '...oooooo...'],
    palette: { o: O, w: '#e6f3f7', y: '#f4d03f', L: '#7fb069', x: '#d9412b' },
  },
  cytrynowka: {
    rows: ['............', '.....ooooo..', '.oo..oyyyo..', 'oLLo.oyyyo..', 'oLLo.oyyyo..', '.oo..oyyyo..', '......ooo...', '.....ooooo..'],
    palette: { o: O, y: '#f4e07a', L: '#f4c531' },
  },
};

/** Icons are padded at the top to one height, so they line up in lists. */
export const ICON_HEIGHT = 10;
