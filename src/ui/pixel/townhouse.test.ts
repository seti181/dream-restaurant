import { describe, expect, it } from 'vitest';
import { drawTownhouse, FACADE_COLOURS, frontWidth, GRANARY_COLOURS, type Gable, type TownhouseSpec } from './townhouse';
import { LOCATION_IDS } from '../../data/locations';
import { roomLayout, type RoomLook } from './room';
import { drawStreet } from './street';

const spec = (gable: Gable, more: Partial<TownhouseSpec> = {}): TownhouseSpec => ({
  bays: 3,
  height: 64,
  gable,
  colour: FACADE_COLOURS[0],
  ground: 'shop',
  pediment: 'triangle',
  awning: null,
  sign: false,
  flowers: false,
  flag: false,
  seed: 7,
  ...more,
});

const count = (img: { width: number; height: number; get: (x: number, y: number) => unknown }) => {
  let n = 0;
  for (let y = 0; y < img.height; y++) for (let x = 0; x < img.width; x++) if (img.get(x, y) !== null) n++;
  return n;
};

describe('Gdańsk townhouse fronts', () => {
  it('is as wide as its windows need, and its gable rises above the cornice', () => {
    for (const gable of ['scroll', 'stepped', 'pointed', 'attic'] as const) {
      const front = drawTownhouse(spec(gable), false);
      expect(front.image.width).toBe(frontWidth(3));
      expect(front.image.height).toBe(64 + front.gableHeight);
      // The wall is solid; the top corners above the gable are sky.
      expect(front.image.get(1, front.image.height - 10)).not.toBeNull();
      if (gable !== 'attic') expect(front.image.get(2, 0)).toBeNull();
    }
  });

  it('gives each gable its own shape', () => {
    const shapes = (['scroll', 'stepped', 'pointed', 'attic'] as const).map((g) => count(drawTownhouse(spec(g), false).image));
    expect(new Set(shapes).size).toBe(4);
  });

  it('lights some windows after dusk, and none by day', () => {
    expect(count(drawTownhouse(spec('scroll'), false).glow)).toBe(0);
    expect(count(drawTownhouse(spec('scroll'), true).glow)).toBeGreaterThan(20);
  });
});

describe('granite on Długa', () => {
  const look: RoomLook = { decor: [], equipment: [], weather: 'sunny', dusk: false, insideTables: 4 };

  it('paves the street with granite instead of cobbles', () => {
    const layout = roomLayout(6, 2);
    const w = layout.width + 80;
    const h = layout.height + 40;
    const cobbles = drawStreet(layout, look, w, h, 40, 20);
    const granite = drawStreet(layout, look, w, h, 40, 20, 'dluga');
    // The bottom of the picture is the street in front.
    let changed = 0;
    for (let x = 0; x < w; x += 3) if (JSON.stringify(cobbles.get(x, h - 2)) !== JSON.stringify(granite.get(x, h - 2))) changed++;
    expect(changed).toBeGreaterThan(w / 6);
  });
});

describe('each street looks like itself', () => {
  const look: RoomLook = { decor: [], equipment: [], weather: 'sunny', dusk: false, insideTables: 4 };

  it('draws six different streets', () => {
    const layout = roomLayout(6, 2);
    const w = layout.width + 80;
    const h = layout.height + 120;
    const pictures = LOCATION_IDS.map((location) => JSON.stringify(Array.from(drawStreet(layout, look, w, h, 40, 20, location).data.slice(0, w * h * 2))));
    expect(new Set(pictures).size).toBe(LOCATION_IDS.length);
  });

  it('puts the Motława in front of Długie Pobrzeże, and only there', () => {
    const layout = roomLayout(6, 2);
    const w = layout.width + 80;
    const h = layout.height + 120;
    const blue = (location: (typeof LOCATION_IDS)[number]) => {
      const c = drawStreet(layout, look, w, h, 40, 20, location).get(10, h - 2)!;
      return c[2] > c[0] + 40;
    };
    expect(blue('pobrzeze')).toBe(true);
    expect(blue('ogarna')).toBe(false);
  });

  it('lines Granary Island with brick granaries', () => {
    const granary = drawTownhouse(spec('pointed', { kind: 'granary', colour: GRANARY_COLOURS[0] }), false);
    const townhouse = drawTownhouse(spec('pointed'), false);
    expect(granary.gableHeight).toBeGreaterThan(townhouse.gableHeight);
    expect(granary.image.get(1, granary.image.height - 20)).not.toEqual(townhouse.image.get(1, townhouse.image.height - 20));
  });
});
