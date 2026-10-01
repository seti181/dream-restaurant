import { describe, expect, it } from 'vitest';
import { TEMPLATE_IDS } from '../../data/dishes';
import { WEATHER_IDS } from '../../data/weather';
import { COIN, FOOD_ICONS, ICON_HEIGHT, STAR, WEATHER_ICONS } from './icons';
import { sprite } from './sprites';

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
