// Baking: the sketchbook's SVG filters (the wash, the ink wobble, the paper grain) are far too
// slow to run live on a budget tablet, so each picture is drawn once into an offscreen canvas and
// kept as an image. During the day only these images move (project.md section 9.5).

import kalamLatin400 from './fonts/kalam-latin-400.woff2';
import kalamLatinExt400 from './fonts/kalam-latin-ext-400.woff2';
import kalamLatin700 from './fonts/kalam-latin-700.woff2';
import kalamLatinExt700 from './fonts/kalam-latin-ext-700.woff2';

const LATIN = 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD';
const LATIN_EXT = 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF';

const FONT_FILES: [string, number, string][] = [
  [kalamLatin400, 400, LATIN],
  [kalamLatinExt400, 400, LATIN_EXT],
  [kalamLatin700, 700, LATIN],
  [kalamLatinExt700, 700, LATIN_EXT],
];

/** The biggest picture we bake, in device pixels across, to keep memory in check. */
const MAX_WIDTH = 4096;

/**
 * A picture drawn from SVG can't load the page's fonts, so the handwriting font is packed into
 * each SVG as data. Read once (from the offline cache), then reused.
 */
let fontCss: Promise<string> | null = null;
function embeddedFonts(): Promise<string> {
  fontCss ??= Promise.all(
    FONT_FILES.map(async ([url, weight, range]) => {
      const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
      let binary = '';
      for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
      return `@font-face{font-family:Kalam;font-weight:${weight};src:url(data:font/woff2;base64,${btoa(binary)}) format("woff2");unicode-range:${range}}`;
    }),
  ).then((rules) => rules.join(''));
  return fontCss;
}

const baked = new Map<string, Promise<string>>();

/**
 * How long the most recent bake took, in milliseconds: in all, and of that, waiting for the font
 * and drawing the picture. The rest is saving it as a picture file, and any wait while the game is
 * busy (when the day starts, most of it).
 */
export interface BakeTime {
  total: number;
  font: number;
  draw: number;
}
let lastBake: BakeTime | null = null;

/** How long the most recent bake took (shown by the ?perf meter), or null before the first. */
export function lastBakeTime(): BakeTime | null {
  return lastBake;
}

/**
 * The picture for `key`, drawn from the SVG that `draw` returns (w × h units) at `scale` device
 * pixels per unit. Returns an image URL. The same key gives the same picture without drawing again.
 */
export function bake(key: string, draw: () => string, w: number, h: number, scale: number): Promise<string> {
  const cached = baked.get(key);
  if (cached) return cached;
  const picture = (async () => {
    const started = performance.now();
    const css = await embeddedFonts();
    const fontReady = performance.now();
    const svg = draw().replace('<defs>', `<defs><style>${css}</style>`);
    const svgUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      img.src = svgUrl;
      await img.decode();
      const s = Math.min(scale, MAX_WIDTH / w);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * s);
      canvas.height = Math.round(h * s);
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      const drawn = performance.now();
      // PNG keeps the ink lines sharp and the see-through parts clear.
      const file = await new Promise<Blob>((done, fail) => canvas.toBlob((b) => (b ? done(b) : fail(new Error('Could not bake the picture'))), 'image/png'));
      lastBake = { total: Math.round(performance.now() - started), font: Math.round(fontReady - started), draw: Math.round(drawn - fontReady) };
      return URL.createObjectURL(file);
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  })();
  baked.set(key, picture);
  // A failed bake may be tried again later.
  picture.catch(() => baked.delete(key));
  return picture;
}
