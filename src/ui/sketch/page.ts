// The sketchbook page the scene is painted on: paper with a ragged watercolour edge round the
// painting, Kashubian tulips and rosettes inked in the margins, handwritten notes, a ribbon
// bookmark and a coffee ring.

import { rosette, tulip } from './motifs';
import { Painter, svgPicture } from './painter';
import { HAND, light, mix, PAGE_H as H, PAGE_W as W } from './palette';
import { conceptRoom } from './scene';

/** A handwritten note on the page. */
export interface PageNote {
  x: number;
  y: number;
  text: string;
  /** Degrees, a little crooked. */
  tilt: number;
  size?: number;
  colour?: string;
}

/** Escape text for SVG. */
const escape = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** The page over the scene: the paper with a hole the painting shows through, and everything in the margins. */
export function pageFrame(pt: Painter, notes: PageNote[]): string {
  const p = pt.p;
  const left = 64;
  const top = 34;
  const right = W - 64;
  const bottom = H - 22;
  // The hole's edge wobbles like a dried wash.
  const pts: string[] = [];
  const wobble = (i: number) => Math.sin(i * 1.7) * 4 + Math.sin(i * 0.53) * 6;
  let n = 0;
  for (let x = left; x <= right; x += 24) pts.push(`${x},${top + wobble(n++)}`);
  for (let y = top; y <= bottom; y += 24) pts.push(`${right + wobble(n++)},${y}`);
  for (let x = right; x >= left; x -= 24) pts.push(`${x},${bottom + wobble(n++)}`);
  for (let y = bottom; y >= top; y -= 24) pts.push(`${left + wobble(n++)},${y}`);
  let g = `<path d="M0,0 H${W} V${H} H0 Z M${pts.join(' L')} Z" fill-rule="evenodd" fill="${p.paper}" filter="url(#wash)"/>`;
  g += `<path d="M${pts.join(' L')} Z" fill="none" stroke="${mix(p.bar, p.paper, 0.55)}" stroke-width="3" opacity="0.6" filter="url(#wash)"/>`;
  // Corner rosettes, and tulip vines down the margins.
  for (const [cx, cy] of [[30, 26], [W - 30, 26], [30, H - 26], [W - 30, H - 26]]) g += rosette(pt, cx, cy, 18, 'red');
  for (const cx of [30, W - 30]) {
    g += pt.line(`M${cx},${H - 60} ` + Array.from({ length: 7 }, (_, k) => `q${k % 2 ? -12 : 12},-36 0,-68`).join(' '), 'green', 1.8);
    for (let y = 120, k = 0; y < H - 70; y += 68, k++) g += k % 2 ? rosette(pt, cx, y - 8, 11, ['blue', 'red'][k % 2]) : tulip(pt, cx, y + 12, 34, ['red', 'blue', 'yellow'][k % 3]);
  }
  // Along the top margin, leaving room for the note about Mewa.
  for (let x = 330, k = 0; x < W - 330; x += 46, k++) if (x < 400 || x > 640) g += k % 2 ? rosette(pt, x, 16, 7, 'blue') : tulip(pt, x, 30, 22, 'red');
  g += pt.line('M414,20 Q392,22 380,44', 'ink', 1.2) + pt.line('M376,36 l4,8 l6,-6', 'ink', 1.2);
  // A ribbon bookmark, and a coffee ring.
  g += pt.fill('M1304,0 h16 v128 l-8,-9 l-8,9 Z', 'red') + pt.line('M1306,0 v118 M1318,0 v118', light(p.red, 0.4), 0.8);
  g += '<g filter="url(#wash)" opacity="0.2"><circle cx="112" cy="572" r="30" fill="none" stroke="#7a4a2a" stroke-width="5"/><path d="M84,560 a30,30 0 0 1 40,-16" fill="none" stroke="#7a4a2a" stroke-width="2"/></g>';
  for (const note of notes)
    g += `<text x="${note.x}" y="${note.y}" transform="rotate(${note.tilt} ${note.x} ${note.y})" font-family="${HAND}" font-size="${note.size ?? 15}" fill="${note.colour ?? p.ink}">${escape(note.text)}</text>`;
  return g;
}

/** The notes of the concept picture. */
export const CONCEPT_NOTES: PageNote[] = [
  { x: 418, y: 25, text: 'Mewa, keeping an eye on things', tilt: -1, size: 15 },
  { x: 650, y: 594, text: '~ pierogi for table 2! ~', tilt: 1, size: 15, colour: '#c4574b' },
  { x: 1030, y: 594, text: 'Długi Targ, a sunny Tuesday', tilt: -1.5, size: 15, colour: mix('#3b2a24', '#fbf6ea', 0.25) },
];

/** M8's first still: the concept's room on the sketchbook page, as one SVG picture in page units. */
export function stillPageSvg(): string {
  const pt = new Painter();
  const grain = `<rect width="${W}" height="${H}" filter="url(#grain)"/>`;
  return svgPicture(W, H, conceptRoom(pt) + grain + pageFrame(pt, CONCEPT_NOTES) + `<rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.7"/>`);
}
