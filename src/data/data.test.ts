import { describe, expect, it } from 'vitest';
import { balance } from './balance';
import { DISH_TEMPLATES, TEMPLATE_IDS } from './dishes';
import { GROUP_IDS, GROUPS } from './groups';
import { LOCATION_IDS, LOCATIONS } from './locations';
import { RANDOM_EVENT_IDS, RANDOM_EVENTS } from './events';
import { REVIEWER } from './reviews';
import { RIVAL_IDS, RIVALS } from './rivals';

const openHours = (balance.clock.closeMinute - balance.clock.openMinute) / 60;

describe('id lists', () => {
  it('match the data entries exactly', () => {
    expect([...TEMPLATE_IDS].sort()).toEqual(Object.keys(DISH_TEMPLATES).sort());
    expect([...GROUP_IDS].sort()).toEqual(Object.keys(GROUPS).sort());
    expect([...LOCATION_IDS].sort()).toEqual(Object.keys(LOCATIONS).sort());
    expect([...RIVAL_IDS].sort()).toEqual(Object.keys(RIVALS).sort());
  });
});

describe('dish templates', () => {
  it.each(TEMPLATE_IDS)('%s has sensible numbers and unique variants', (id) => {
    const template = DISH_TEMPLATES[id];
    expect(template.variants.length).toBeGreaterThan(0);
    const variantIds = template.variants.map((v) => v.id);
    expect(new Set(variantIds).size).toBe(variantIds.length);
    expect(template.prepMinutes).toBeGreaterThan(0);
    expect(template.baseQuality).toBeGreaterThanOrEqual(0);
    expect(template.baseQuality).toBeLessThanOrEqual(100);
    for (const variant of template.variants) {
      expect(variant.ingredientCost).toBeGreaterThan(0);
      expect(variant.ingredientCost).toBeLessThan(template.referencePrice);
    }
  });
});

describe('customer groups', () => {
  it.each(GROUP_IDS)('%s has sensible numbers', (id) => {
    const group = GROUPS[id];
    expect(group.monthFactors).toHaveLength(12);
    expect(group.priceSensitivity).toBeGreaterThanOrEqual(0);
    expect(group.priceSensitivity).toBeLessThanOrEqual(1);
    expect(group.partySize.min).toBeGreaterThanOrEqual(1);
    expect(group.partySize.max).toBeGreaterThanOrEqual(group.partySize.min);
    expect(group.patienceMinutes).toBeGreaterThan(0);
  });
});

describe('locations', () => {
  it.each(LOCATION_IDS)('%s has sensible numbers', (id) => {
    const location = LOCATIONS[id];
    expect(location.hourCurve).toHaveLength(openHours);
    expect(location.monthFactors).toHaveLength(12);
    const mixTotal = GROUP_IDS.reduce((sum, g) => sum + location.groupMix[g], 0);
    expect(mixTotal).toBeCloseTo(1);
    expect(location.rentPerDay).toBeGreaterThan(0);
    expect(location.equipmentSlots).toBeGreaterThanOrEqual(1);
  });
});

describe('rivals', () => {
  it.each(RIVAL_IDS)('%s serves real dishes above ingredient cost', (id) => {
    const rival = RIVALS[id];
    for (const dish of rival.menu) {
      const variant = DISH_TEMPLATES[dish.template].variants.find((v) => v.id === dish.variant);
      expect(variant, `${dish.template} / ${dish.variant}`).toBeDefined();
      expect(dish.price).toBeGreaterThan(variant!.ingredientCost);
      if (DISH_TEMPLATES[dish.template].category === 'dessert') {
        expect(dish.price).toBeLessThanOrEqual(balance.menu.maxDessertPrice);
      }
    }
  });

  it.each(RIVAL_IDS)('%s fits in its premises and has reputations from 0 to 100', (id) => {
    const rival = RIVALS[id];
    expect(rival.seats).toBeLessThanOrEqual(LOCATIONS[rival.location].maxSeats);
    for (const g of GROUP_IDS) {
      expect(rival.startingReputation[g]).toBeGreaterThanOrEqual(0);
      expect(rival.startingReputation[g]).toBeLessThanOrEqual(100);
    }
  });
});

describe('texts', () => {
  it('give every rival move, surprise event and reviewer a few versions, so the news doesn’t repeat', () => {
    for (const id of RIVAL_IDS) {
      for (const lines of Object.values(RIVALS[id].lines)) expect(lines.length).toBeGreaterThanOrEqual(2);
    }
    for (const id of RANDOM_EVENT_IDS) expect(RANDOM_EVENTS[id].descriptions.length).toBeGreaterThanOrEqual(2);
    for (const group of GROUP_IDS) expect(REVIEWER[group].length).toBeGreaterThanOrEqual(2);
  });
});
