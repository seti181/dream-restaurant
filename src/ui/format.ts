// Formatting helpers for player-facing text.

import { EXTRAS, type MenuDish } from '../data/dishes';
import { extrasOf, templateOf, variantOf } from '../sim/menu';

/** "40,000 zł" */
export function money(value: number): string {
  return `${Math.round(value).toLocaleString('en-GB')} zł`;
}

/** "+1,200 zł" or "−300 zł" */
export function signedMoney(value: number): string {
  const rounded = Math.round(value);
  return `${rounded < 0 ? '−' : '+'}${money(Math.abs(rounded))}`;
}

/** "dill and sour cream", or "" with no extras. */
export function extrasText(dish: MenuDish): string {
  const names = extrasOf(dish).map((extra) => EXTRAS[extra].name);
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

/** The recipe in plain words: "Pierogi · ruskie (potato and cheese), with fried onions" */
export function recipeText(dish: MenuDish): string {
  const extras = extrasText(dish);
  return `${templateOf(dish).name} · ${variantOf(dish).name}${extras ? `, with ${extras}` : ''}`;
}

/** The player's name for the dish if they gave one, otherwise the recipe. */
export function dishName(dish: MenuDish): string {
  return dish.name ?? recipeText(dish);
}

/** "2.4 ★" */
export function stars(rating: number): string {
  return `${rating.toFixed(1)} ★`;
}
