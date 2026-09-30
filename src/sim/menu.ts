// Lookups for dishes on a menu.

import { balance } from '../data/balance';
import {
  DISH_TEMPLATES,
  EXTRAS,
  PAIRINGS,
  type DishTemplate,
  type ExtraId,
  type MenuDish,
  type Pairing,
  type Tag,
  type Variant,
} from '../data/dishes';
import type { Restaurant, Supplier } from './types';

export function templateOf(dish: MenuDish): DishTemplate {
  return DISH_TEMPLATES[dish.template];
}

export function variantOf(dish: MenuDish): Variant {
  const variant = templateOf(dish).variants.find((v) => v.id === dish.variant);
  if (!variant) throw new Error(`Unknown variant ${dish.template}/${dish.variant}`);
  return variant;
}

export function extrasOf(dish: MenuDish): ExtraId[] {
  return dish.extras ?? [];
}

/** The template's and the variant's tags, before any extras. */
function baseTagsOf(dish: MenuDish): Tag[] {
  return [...templateOf(dish).tags, ...variantOf(dish).tags];
}

/** Every taste tag of the dish: template, variant and extras, without repeats. */
export function tagsOf(dish: MenuDish): Tag[] {
  return [...new Set([...baseTagsOf(dish), ...extrasOf(dish).flatMap((extra) => EXTRAS[extra].tags)])];
}

/** Identifies a recipe: the same dish, variant and extras count as the same menu item. */
export function recipeKey(dish: MenuDish): string {
  return [dish.template, dish.variant, ...[...extrasOf(dish)].sort()].join('/');
}

/** The hidden pairings (good and bad) on this dish. */
export function pairingsOf(dish: MenuDish): Pairing[] {
  const extras = extrasOf(dish);
  const baseTags = baseTagsOf(dish);
  const template = templateOf(dish);
  return PAIRINGS.filter((pairing) => {
    if (!pairing.extras.every((extra) => extras.includes(extra))) return false;
    const w = pairing.with;
    if (!w) return true;
    return (
      (w.tag === undefined || baseTags.includes(w.tag)) &&
      (w.template === undefined || w.template === dish.template) &&
      (w.category === undefined || w.category === template.category)
    );
  });
}

/** Quality gained or lost from the dish's pairings. */
export function pairingQuality(dish: MenuDish): number {
  return pairingsOf(dish).reduce((sum, pairing) => sum + pairing.quality, 0);
}

/** What one portion's ingredients cost from the given supplier. */
export function ingredientCostOf(dish: MenuDish, supplier: Supplier): number {
  const multiplier = supplier === 'premium' ? balance.supplier.premiumCostMultiplier : 1;
  const extras = extrasOf(dish).reduce((sum, extra) => sum + EXTRAS[extra].ingredientCost, 0);
  return (variantOf(dish).ingredientCost + extras) * multiplier;
}

/** The lunch set's dishes and price if it is being served at this minute, otherwise null. */
export function lunchSetServing(
  restaurant: Restaurant,
  minute: number,
): { soup: MenuDish; main: MenuDish; price: number } | null {
  const set = restaurant.lunchSet;
  if (!set) return null;
  const hour = minute / 60;
  if (hour < balance.lunchSet.startHour || hour >= balance.lunchSet.endHour) return null;
  const soup = restaurant.menu.find((dish) => recipeKey(dish) === set.soup);
  const main = restaurant.menu.find((dish) => recipeKey(dish) === set.main);
  return soup && main ? { soup, main, price: set.price } : null;
}
