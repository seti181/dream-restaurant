// Kashubian folk motifs and the sketchbook's ink shading: rosettes, tulips, embroidered bands,
// hatching and paper-cut bunting.

import type { Painter } from './painter';

/** Folk patterns are inked by hand, a touch lighter than the outlines. */
const inked = (g: string) => `<g opacity="0.92">${g}</g>`;

/** A Kashubian rosette: eight petals in two colours round a blue centre. */
export function rosette(pt: Painter, x: number, y: number, r: number, colour = 'red'): string {
  const c = pt.colour(colour);
  const { ink, yellow, blue } = pt.p;
  let g = '';
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const px = x + Math.cos(a) * r * 0.62;
    const py = y + Math.sin(a) * r * 0.62;
    g += `<ellipse cx="${px}" cy="${py}" rx="${r * 0.42}" ry="${r * 0.22}" transform="rotate(${(a * 180) / Math.PI} ${px} ${py})" fill="${i % 2 ? c : yellow}" stroke="${ink}" stroke-width="1"/>`;
  }
  g += `<circle cx="${x}" cy="${y}" r="${r * 0.3}" fill="${blue}" stroke="${ink}" stroke-width="1"/><circle cx="${x}" cy="${y}" r="${r * 0.12}" fill="${yellow}"/>`;
  return inked(g);
}

/** A Kashubian tulip, h tall from its foot at (x, y): three petals on a curving stem with two leaves. */
export function tulip(pt: Painter, x: number, y: number, h: number, colour = 'red'): string {
  const c = pt.colour(colour);
  const { ink, green, yellow, blue } = pt.p;
  const k = h / 40;
  return inked(
    `<path d="M${x},${y} q${-2 * k},${-12 * k} 0,${-24 * k}" fill="none" stroke="${green}" stroke-width="${2.2 * k}"/>` +
      `<path d="M${x},${y - 6 * k} q${-14 * k},${-2 * k} ${-16 * k},${-14 * k} q${12 * k},${-1 * k} ${16 * k},${14 * k} Z" fill="${green}" stroke="${ink}" stroke-width="0.9"/>` +
      `<path d="M${x},${y - 10 * k} q${14 * k},${-2 * k} ${16 * k},${-14 * k} q${-12 * k},${-1 * k} ${-16 * k},${14 * k} Z" fill="${green}" stroke="${ink}" stroke-width="0.9"/>` +
      `<path d="M${x},${y - 22 * k} q${-12 * k},${-2 * k} ${-11 * k},${-16 * k} q${6 * k},${3 * k} ${11 * k},${8 * k} q${5 * k},${-5 * k} ${11 * k},${-8 * k} q${1 * k},${14 * k} ${-11 * k},${16 * k} Z" fill="${c}" stroke="${ink}" stroke-width="1"/>` +
      `<path d="M${x},${y - 24 * k} q${-4 * k},${-8 * k} 0,${-16 * k} q${4 * k},${8 * k} 0,${16 * k} Z" fill="${yellow}" stroke="${ink}" stroke-width="0.9"/>` +
      `<circle cx="${x}" cy="${y - 34 * k}" r="${1.6 * k}" fill="${blue}"/>`,
  );
}

/** An embroidered band (wycinanki diamonds with a dot) on a ground colour, as on cloths, aprons and counters. */
export function folkBand(pt: Painter, x: number, y: number, w: number, h: number, colours: [string, string, string?]): string {
  let g = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${pt.colour(colours[0])}" stroke="${pt.p.ink}" stroke-width="1.2"/>`;
  const step = h * 1.2;
  for (let i = 0; i * step < w; i++) {
    const cx = x + step / 2 + i * step;
    const cy = y + h / 2;
    g += `<path d="M${cx},${cy - h * 0.38} L${cx + h * 0.3},${cy} L${cx},${cy + h * 0.38} L${cx - h * 0.3},${cy} Z" fill="${pt.colour(colours[1])}"/><circle cx="${cx}" cy="${cy}" r="${h * 0.11}" fill="${pt.colour(colours[2] ?? 'yellow')}"/>`;
  }
  return inked(g);
}

/** Ink hatching: diagonal strokes filling a box, the sketchbook's way of shading. */
export function hatch(pt: Painter, x: number, y: number, w: number, h: number, gap = 6, opacity = 0.32): string {
  const id = pt.id('hatch');
  let lines = '';
  for (let k = -h; k < w; k += gap) lines += `M${x + k},${y + h} l${h},${-h} `;
  return `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath><path d="${lines}" clip-path="url(#${id})" stroke="${pt.p.ink}" stroke-width="0.9" opacity="${opacity}"/>`;
}

/** A swag of paper-cut bunting in folk colours, hung between x1 and x2. */
export function bunting(pt: Painter, x1: number, x2: number, y: number, sag: number): string {
  let g = pt.line(`M${x1},${y} Q${(x1 + x2) / 2},${y + sag * 2} ${x2},${y}`, 'ink', 1.1);
  const n = Math.floor((x2 - x1) / 26);
  const cols = ['red', 'yellow', 'blue', 'green'];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const bx = x1 + (x2 - x1) * t;
    const by = y + 4 * sag * t * (1 - t);
    g += pt.fill(`M${bx - 8},${by} h16 l-3,8 l3,8 l-8,-3 l-8,3 l3,-8 Z`, cols[i % 4]);
  }
  return g;
}
