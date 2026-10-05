// Dishes level up with use: the more portions of a kind of dish the kitchen serves, the better
// it cooks them, up to three stars, and at three stars the dish earns a taste tag.
// Only the player's kitchen keeps count. See project.md section 6.15, B5.

import { balance } from '../data/balance';
import { DISH_TEMPLATES, type MenuDish, type TemplateId } from '../data/dishes';
import { MASTERY_WORDS, STAR_LINES } from '../data/practice';
import { masteryTagOf } from './menu';
import type { PartyOutcome } from './types';

/** Portions of each kind of dish the player's kitchen has served. Saved with the game. */
export type DishPractice = Partial<Record<TemplateId, number>>;

export const MAX_STARS = balance.dishLevels.starsAt.length;

/** Stars (0–3) for this many portions served. */
export function starsFor(portions: number): number {
  return balance.dishLevels.starsAt.filter((needed) => portions >= needed).length;
}

/** Portions still to serve for the next star, or null at three stars. */
export function portionsToNextStar(portions: number): number | null {
  const next = balance.dishLevels.starsAt.find((needed) => portions < needed);
  return next === undefined ? null : next - portions;
}

/** The menu as the kitchen cooks it today: each dish with the stars its kind has earned. */
export function withStars(menu: MenuDish[], practice: DishPractice): MenuDish[] {
  return menu.map((dish) => {
    const stars = starsFor(practice[dish.template] ?? 0);
    return stars > 0 ? { ...dish, stars } : dish;
  });
}

/** A kind of dish that earned a star today, and the line for the day report. */
export interface StarEarned {
  template: TemplateId;
  stars: number;
  text: string;
}

/** Counts today's portions served by the player, and any stars they earned. */
export function practiceAfterDay(
  practice: DishPractice,
  outcomes: readonly PartyOutcome[],
  playerId: string,
  headChef: string | null,
): { practice: DishPractice; earned: StarEarned[] } {
  const next: DishPractice = { ...practice };
  const examples = new Map<TemplateId, MenuDish>();
  for (const o of outcomes) {
    if (o.restaurant !== playerId || o.kind !== 'served') continue;
    for (const dish of o.order) {
      next[dish.template] = (next[dish.template] ?? 0) + 1;
      examples.set(dish.template, dish);
    }
  }
  const earned: StarEarned[] = [];
  for (const [template, dish] of examples) {
    const before = starsFor(practice[template] ?? 0);
    const after = starsFor(next[template] ?? 0);
    if (after <= before) continue;
    const tag = masteryTagOf(dish);
    const text = STAR_LINES[after - 1]
      .replace('{dish}', DISH_TEMPLATES[template].name)
      .replace('{chef}', headChef ?? 'The kitchen')
      .replace('{tag}', (tag && MASTERY_WORDS[tag]) ?? 'better than ever');
    earned.push({ template, stars: after, text });
  }
  return { practice: next, earned };
}
