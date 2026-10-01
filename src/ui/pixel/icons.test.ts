import { describe, expect, it } from 'vitest';
import { TEMPLATE_IDS } from '../../data/dishes';
import { WEATHER_IDS } from '../../data/weather';
import { COIN, FOOD_ICONS, ICON_HEIGHT, STAR, WEATHER_ICONS } from './icons';
import { drawOldTown, MAP_HEIGHT, MAP_WIDTH, mapPixel, streetIconPixels } from './map';
import { sprite } from './sprites';
import { LOCATION_IDS, LOCATIONS } from '../../data/locations';

describe('pixel icons', () => {
  it('has a picture for every dish and drink, no taller than the icon height', () => {
    for (const id of TEMPLATE_IDS) {
      const image = sprite(FOOD_ICONS[id].rows, FOOD_ICONS[id].palette);
      expect(image.width).toBe(12);
      expect(image.height).toBeLessThanOrEqual(ICON_HEIGHT);
    }
  });

  it('draws the interface icons without a missing colour', () => {
    for (const art of [COIN, STAR, ...WEATHER_IDS.map((w) => WEATHER_ICONS[w])]) {
      expect(() => sprite(art.rows, art.palette)).not.toThrow();
    }
  });
});

describe('the pixel-art map', () => {
  it('draws the Old Town, with every street marker inside it', () => {
    const map = drawOldTown();
    expect(map.width).toBe(MAP_WIDTH);
    expect(map.height).toBe(MAP_HEIGHT);
    for (const id of LOCATION_IDS) {
      expect(() => streetIconPixels(id)).not.toThrow();
      const { px, py } = mapPixel(LOCATIONS[id].mapPosition.x, LOCATIONS[id].mapPosition.y);
      expect(px).toBeGreaterThan(10);
      expect(px).toBeLessThan(MAP_WIDTH - 10);
      expect(py).toBeGreaterThan(10);
      expect(py).toBeLessThan(MAP_HEIGHT - 10);
    }
  });
});
