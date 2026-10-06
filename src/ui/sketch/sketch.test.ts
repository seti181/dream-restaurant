import { describe, expect, it } from 'vitest';
import { Painter, svgPicture } from './painter';
import { stillPageSvg } from './page';
import { CAST, figure, type Pose } from './people';

/** Every id defined in an SVG, in order. */
const idsOf = (svg: string) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);

describe('the sketchbook still', () => {
  const svg = stillPageSvg();

  it('is the same picture every time', () => {
    expect(stillPageSvg()).toBe(svg);
  });

  it('has no broken numbers', () => {
    expect(svg).not.toMatch(/NaN|undefined|Infinity/);
  });

  it('gives every clip path its own id, and points only at ids it defines', () => {
    const ids = idsOf(svg);
    expect(new Set(ids).size).toBe(ids.length);
    for (const [, ref] of svg.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref);
  });

  it('is a whole SVG picture at the page size, with decimals trimmed', () => {
    expect(svg.startsWith('<svg xmlns="http://www.w3.org/2000/svg" width="1364" height="603"')).toBe(true);
    expect(svg).not.toMatch(/\.\d{3}/);
  });

  it('writes Polish letters in the handwriting font', () => {
    expect(svg).toContain('DZIŚ POLECAMY');
    expect(svg).toContain('Długi Targ');
    expect(svg).toContain('font-family="Kalam');
  });
});

describe('people', () => {
  const poses: Pose[] = [
    {},
    { sit: true, arms: 'fork', mouth: 'laugh', turn: 1 },
    { sit: true, stool: true, arms: 'glass', eyes: 'happy', turn: -1 },
    { arms: 'tray', mouth: 'talk' },
    { arms: 'pan' },
    { arms: 'pour' },
    { arms: 'wave' },
  ];

  it('draw everyone in every pose without broken numbers', () => {
    for (const look of Object.values(CAST))
      for (const pose of poses) {
        const svg = svgPicture(200, 300, figure(new Painter(), 100, 280, 190, look, pose));
        expect(svg).not.toMatch(/NaN|undefined|Infinity/);
      }
  });

  it('get their own clip paths when several share a picture', () => {
    const pt = new Painter();
    const svg = figure(pt, 100, 280, 190, CAST.chef, {}) + figure(pt, 100, 280, 190, CAST.chef, {});
    const ids = idsOf(svg);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
