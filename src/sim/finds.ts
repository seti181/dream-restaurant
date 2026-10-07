// Mewa's finds (project.md section 6.14): now and then, in the morning, Mewa has dropped something she
// found in town on the doorstep. Which finds there are, and what each does, is in data/finds.ts; the
// game applies them at closing (game.ts), for the next morning.

import { balance } from '../data/balance';
import { CATEGORY_NAMES, DISH_TEMPLATES, EXTRAS, PAIRINGS, type MenuDish, type Pairing } from '../data/dishes';
import { FIND_IDS, FINDS, type FindId } from '../data/finds';
import { pairingsOf } from './menu';
import { chance, createRng, pick } from './rng';

/** Mewa's finds so far, saved with the game. */
export interface FindsState {
  found: FindId[];
  /** The morning of the latest find, or null before the first. */
  lastDay: number | null;
}

export const NO_FINDS: FindsState = { found: [], lastDay: null };

/** Whether Mewa brings something on the morning of `day`, and what: each find only once. Its own dice. */
export function rollFind(seed: number, day: number, finds: FindsState): FindId | null {
  const f = balance.finds;
  if (day < f.firstDay) return null;
  if (finds.lastDay !== null && day - finds.lastDay <= f.restDays) return null;
  const left = FIND_IDS.filter((id) => !finds.found.includes(id));
  if (left.length === 0) return null;
  const rng = createRng(seed);
  return chance(rng, f.chance) ? pick(rng, left) : null;
}

/** What a pairing is, in a few words, as written on the recipe card: "dill with anything from the sea". */
export function pairingWords(pairing: Pairing): string {
  const extras = pairing.extras.map((e) => EXTRAS[e].name.replace(/ \(.*\)$/, '')).join(' and ');
  const w = pairing.with;
  if (!w) return extras;
  if (w.template) return `${DISH_TEMPLATES[w.template].name} with ${extras}`;
  if (w.tag === 'seafood') return `${extras} with anything from the sea`;
  if (w.tag) return `${extras} on anything ${w.tag}`;
  return `${extras} in ${CATEGORY_NAMES[w.category!].toLowerCase()}`;
}

/** A perfect pairing the menu doesn't have yet, for the recipe card (the first one, if the menu has them all). */
export function pairingToTry(menu: readonly MenuDish[], seed: number): Pairing {
  const good = PAIRINGS.filter((p) => p.quality > 0);
  const onMenu = new Set(menu.flatMap((dish) => pairingsOf(dish)));
  const fresh = good.filter((p) => !onMenu.has(p));
  return fresh.length > 0 ? pick(createRng(seed), fresh) : good[0];
}

/** The morning news for a find. */
export function findNews(id: FindId, menu: readonly MenuDish[], seed: number): { title: string; text: string } {
  const find = FINDS[id];
  const pairing = find.pairing ? ` “${pairingWords(pairingToTry(menu, seed))}: perfect together.”` : '';
  return { title: `🐦 Mewa found something: ${find.icon} ${find.name}`, text: `${find.story}${pairing}` };
}
