// How the sketchbook puts down a shape: a watercolour wash, set a little off the line, with an
// ink line drawn over it. Everything is written as SVG text, so it can be drawn anywhere (in the
// game or in a test) and baked into a picture once (see bake.ts).
//
// The hand-drawn wobble is one filter over the whole picture (svgPicture), not one per shape:
// per shape, the concept's still took 1.7 s to bake on a desktop; as one filter, 0.2 s, and it
// looks almost the same. Only floor shadows keep their own soft wash.

import { PALETTE } from './palette';

export class Painter {
  readonly p = PALETTE;
  private ids = 0;

  /** A palette name ('red', 'wall') or a colour as it is ('#c27a5c'). */
  colour(c: string): string {
    return this.p[c] ?? c;
  }

  /** A fresh id for a clip path or the like, unique within this picture. */
  id(prefix: string): string {
    return `${prefix}${this.ids++}`;
  }

  /** A filled shape: the wash, then the ink line. */
  fill(d: string, colour: string, extra = ''): string {
    return (
      `<path d="${d}" fill="${this.colour(colour)}" opacity="0.93" transform="translate(2,1.5)" ${extra}/>` +
      `<path d="${d}" fill="none" stroke="${this.p.ink}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`
    );
  }

  /** A line in ink or a colour: an outline detail, a rail, a string. */
  line(d: string, colour = 'ink', width = 1.5, extra = ''): string {
    return `<path d="${d}" fill="none" stroke="${this.colour(colour)}" stroke-width="${width * 0.9}" stroke-linecap="round" ${extra}/>`;
  }

  circle(x: number, y: number, r: number, colour: string): string {
    return this.fill(`M${x - r},${y} a${r},${r} 0 1 0 ${2 * r},0 a${r},${r} 0 1 0 ${-2 * r},0 Z`, colour);
  }

  /** A box, with rounded corners of radius r if given. */
  rect(x: number, y: number, w: number, h: number, colour: string, r = 0): string {
    if (r === 0) return this.fill(`M${x},${y} h${w} v${h} h${-w} Z`, colour);
    return this.fill(
      `M${x + r},${y} h${w - 2 * r} q${r},0 ${r},${r} v${h - 2 * r} q0,${r} ${-r},${r} h${-(w - 2 * r)} q${-r},0 ${-r},${-r} v${-(h - 2 * r)} q0,${-r} ${r},${-r} Z`,
      colour,
    );
  }

  /** A soft wash shadow on the floor. */
  shadow(cx: number, cy: number, rx: number, ry: number, opacity = 0.16): string {
    return `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${this.p.ink}" opacity="${opacity}" filter="url(#wash)"/>`;
  }
}

/**
 * The filters every sketchbook picture uses: the wash's soft, wobbling edge (for shadows and the
 * page's edge), the hand-drawn wobble and the paper grain. They are slow to draw, which is why
 * pictures are baked once.
 */
export const SKETCH_DEFS =
  '<filter id="wash"><feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="2" seed="5" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/><feGaussianBlur stdDeviation="0.8"/></filter>' +
  '<filter id="ink"><feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.4"/></filter>' +
  '<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="2"/><feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0.16 0"/></filter>' +
  '<radialGradient id="lampglow"><stop offset="0" stop-color="#ffe6a8" stop-opacity="0.55"/><stop offset="1" stop-color="#ffe6a8" stop-opacity="0"/></radialGradient>' +
  '<linearGradient id="sunbeam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity="0.45"/><stop offset="1" stop-color="#fff6d8" stop-opacity="0"/></linearGradient>';

/** A whole SVG picture, w × h units, with the sketchbook filters and the hand-drawn wobble over it all. Long decimals are trimmed to keep it small. */
export function svgPicture(w: number, h: number, body: string, defs = ''): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs>${SKETCH_DEFS}${defs}</defs><g filter="url(#ink)">${body}</g></svg>`;
  return svg.replace(/(\.\d\d)\d+/g, '$1');
}
