// The Kashubian sketchbook look (project.md section 9.5): its colours, and the size the page is
// designed at. Everything is drawn in these units and scaled when it is baked into a picture.

/** The page is designed at the tablet's layout size. */
export const PAGE_W = 1364;
export const PAGE_H = 603;

/** The handwriting font, bundled with the game (Kalam, SIL Open Font Licence). */
export const HAND = "Kalam, 'Segoe Print', cursive";

/** Ink, washes and paper: soft sorbet colours with Kashubian red, blue, yellow and green as accents. */
export const PALETTE: Record<string, string> = {
  paper: '#fbf6ea',
  wall: '#f4e6cc',
  wall2: '#ecd9b8',
  panel: '#9a6a46',
  panel2: '#a87754',
  floor: '#d6a26a',
  floor2: '#c38c55',
  beam: '#7a5236',
  window: '#b9dbea',
  windowDeep: '#93c3da',
  facadeA: '#e8a07f',
  facadeB: '#efcf86',
  facadeC: '#a7c9a9',
  facadeD: '#e6b0b4',
  facadeE: '#b3c6e2',
  bar: '#8a5534',
  bar2: '#6e4128',
  brass: '#cfa14a',
  glassG: '#5e9460',
  glassR: '#a5464e',
  glassY: '#e0b555',
  cloth: '#fffaf0',
  clothBand: '#c4574b',
  plate: '#ffffff',
  tile: '#f2f5f7',
  tileBlue: '#4c78ab',
  copper: '#c97e4a',
  steel: '#c3cbd0',
  skin: '#f3cfb0',
  skin2: '#e3b08c',
  red: '#c4574b',
  blue: '#4c78ab',
  green: '#5e9460',
  yellow: '#eeb84b',
  purple: '#86629c',
  white: '#fffaf0',
  black: '#3a3236',
  ink: '#3b2a24',
  street: '#d9cbb0',
  street2: '#c9b999',
};

function rgb(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function hex(c: number[]): string {
  return '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
}

/** A colour part of the way (t from 0 to 1) from a to b. */
export const mix = (a: string, b: string, t: number): string => hex(rgb(a).map((v, i) => v + (rgb(b)[i] - v) * t));
/** A colour darkened towards ink. */
export const dark = (c: string, t: number): string => mix(c, '#1e1418', t);
/** A colour lightened towards paper. */
export const light = (c: string, t: number): string => mix(c, '#fffaf0', t);
