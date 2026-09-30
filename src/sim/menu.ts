// Lookups for dishes on a menu.

import { balance } from '../data/balance';
import { DISH_TEMPLATES, type DishTemplate, type MenuDish, type Tag, type Variant } from '../data/dishes';
import type { Supplier } from './types';

export function templateOf(dish: MenuDish): DishTemplate {
  return DISH_TEMPLATES[dish.template];
}

export function variantOf(dish: MenuDish): Variant {
  const variant = templateOf(dish).variants.find((v) => v.id === dish.variant);
  if (!variant) throw new Error(`Unknown variant ${dish.template}/${dish.variant}`);
  return variant;
}

/** The template's tags plus the variant's. */
export function tagsOf(dish: MenuDish): Tag[] {
  return [...templateOf(dish).tags, ...variantOf(dish).tags];
}

/** What one portion's ingredients cost from the given supplier. */
export function ingredientCostOf(dish: MenuDish, supplier: Supplier): number {
  const multiplier = supplier === 'premium' ? balance.supplier.premiumCostMultiplier : 1;
  return variantOf(dish).ingredientCost * multiplier;
}
