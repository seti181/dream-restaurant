// Isometric drawing: world x runs down-right, y down-left, z up. One world unit is
// one pixel sideways and half a pixel down, which gives the classic 2:1 pixel-art tiles.

import { Pixels, type Rgb } from './raster';

/** Where world (0, 0, 0) lands in the picture. */
export interface Origin {
  ox: number;
  oy: number;
}

export function project(o: Origin, x: number, y: number, z: number): { sx: number; sy: number } {
  return { sx: o.ox + x - y, sy: o.oy + (x + y) / 2 - z };
}

export interface Box {
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  z0: number;
  z1: number;
}

export interface Faces {
  top: Rgb;
  /** The side facing +y (front-left on screen). */
  left: Rgb;
  /** The side facing +x (front-right on screen). */
  right: Rgb;
  /** A lighter rim along the front edges of the top, if wanted. */
  edge?: Rgb;
}

/** Draws a solid box: its top, its front-left side and its front-right side. */
export function box(img: Pixels, o: Origin, b: Box, f: Faces): void {
  const left = Math.floor(o.ox + b.x0 - b.y1) - 1;
  const right = Math.ceil(o.ox + b.x1 - b.y0) + 1;
  const top = Math.floor(o.oy + (b.x0 + b.y0) / 2 - b.z1) - 1;
  const bottom = Math.ceil(o.oy + (b.x1 + b.y1) / 2 - b.z0) + 1;
  for (let py = top; py <= bottom; py++) {
    for (let px = left; px <= right; px++) {
      const sx = px + 0.5 - o.ox;
      const sy = py + 0.5 - o.oy;
      // Top face: z = z1.
      const tx = (sx + 2 * (sy + b.z1)) / 2;
      const ty = (2 * (sy + b.z1) - sx) / 2;
      if (tx >= b.x0 && tx < b.x1 && ty >= b.y0 && ty < b.y1) {
        const rim = f.edge && (tx >= b.x1 - 1 || ty >= b.y1 - 1);
        img.set(px, py, rim ? f.edge! : f.top);
        continue;
      }
      // Front-left face: y = y1.
      const lx = sx + b.y1;
      const lz = (lx + b.y1) / 2 - sy;
      if (lx >= b.x0 && lx < b.x1 && lz >= b.z0 && lz < b.z1) {
        img.set(px, py, f.left);
        continue;
      }
      // Front-right face: x = x1.
      const ry = b.x1 - sx;
      const rz = (b.x1 + ry) / 2 - sy;
      if (ry >= b.y0 && ry < b.y1 && rz >= b.z0 && rz < b.z1) img.set(px, py, f.right);
    }
  }
}

/** The three faces of a box that can be seen. */
export type FaceName = 'top' | 'left' | 'right';

/**
 * Draws a box like `box`, but asks `paint` for every pixel's colour, with where it is on its face:
 * on the top (x, y) from the back corner; on the left side (x, z) and the right side (y, z) from
 * the bottom corner. For wood grain, doors and patterns.
 */
export function texturedBox(img: Pixels, o: Origin, b: Box, paint: (face: FaceName, u: number, v: number) => Rgb): void {
  const left = Math.floor(o.ox + b.x0 - b.y1) - 1;
  const right = Math.ceil(o.ox + b.x1 - b.y0) + 1;
  const top = Math.floor(o.oy + (b.x0 + b.y0) / 2 - b.z1) - 1;
  const bottom = Math.ceil(o.oy + (b.x1 + b.y1) / 2 - b.z0) + 1;
  for (let py = top; py <= bottom; py++) {
    for (let px = left; px <= right; px++) {
      const sx = px + 0.5 - o.ox;
      const sy = py + 0.5 - o.oy;
      const tx = (sx + 2 * (sy + b.z1)) / 2;
      const ty = (2 * (sy + b.z1) - sx) / 2;
      if (tx >= b.x0 && tx < b.x1 && ty >= b.y0 && ty < b.y1) {
        img.set(px, py, paint('top', tx - b.x0, ty - b.y0));
        continue;
      }
      const lx = sx + b.y1;
      const lz = (lx + b.y1) / 2 - sy;
      if (lx >= b.x0 && lx < b.x1 && lz >= b.z0 && lz < b.z1) {
        img.set(px, py, paint('left', lx - b.x0, lz - b.z0));
        continue;
      }
      const ry = b.x1 - sx;
      const rz = (b.x1 + ry) / 2 - sy;
      if (ry >= b.y0 && ry < b.y1 && rz >= b.z0 && rz < b.z1) img.set(px, py, paint('right', ry - b.y0, rz - b.z0));
    }
  }
}

/** Same colour on every side: for small things like plates. */
export const solid = (c: Rgb): Faces => ({ top: c, left: c, right: c });

/**
 * Draws a sprite standing with its bottom-centre on a world point.
 * Returns where its top-left corner went.
 */
export function placeOn(img: Pixels, o: Origin, image: Pixels, x: number, y: number, z: number): { px: number; py: number } {
  const { sx, sy } = project(o, x, y, z);
  const px = Math.round(sx - image.width / 2);
  const py = Math.round(sy - image.height);
  img.draw(image, px, py);
  return { px, py };
}
