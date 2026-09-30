// Lookups for dishes on a menu.

import { DISH_TEMPLATES, type DishTemplate, type MenuDish, type Tag, type Variant } from '../data/dishes';

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
