// Formatting helpers for player-facing text.

import type { MenuDish } from '../data/dishes';
import { templateOf, variantOf } from '../sim/menu';

/** "40,000 zł" */
export function money(value: number): string {
  return `${Math.round(value).toLocaleString('en-GB')} zł`;
}

/** "+1,200 zł" or "−300 zł" */
export function signedMoney(value: number): string {
  const rounded = Math.round(value);
  return `${rounded < 0 ? '−' : '+'}${money(Math.abs(rounded))}`;
}

/** "Pierogi · ruskie (potato and cheese)" */
export function dishName(dish: MenuDish): string {
  return `${templateOf(dish).name} · ${variantOf(dish).name}`;
}

/** "2.4 ★" */
export function stars(rating: number): string {
  return `${rating.toFixed(1)} ★`;
}
