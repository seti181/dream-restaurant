// Cook-off challenges: a rival challenges the player to a dish duel, the player picks an entry
// from the menu (or declines), and guests judge them on quality and value on the day.
// The challenges themselves are in data/cookOffs.ts. See project.md section 6.15, C10.

import { balance } from '../data/balance';
import { COOK_OFFS } from '../data/cookOffs';
import type { ExtraId, MenuDish } from '../data/dishes';
import { RIVAL_IDS, type RivalId } from '../data/rivals';
import { weekdayOf } from './calendar';
import type { GameState } from './game';
import { dishFits, recipeKey, templateOf } from './menu';
import { createRng, nextFloat, pick } from './rng';
import { orderQuality } from './service';
import type { Restaurant } from './types';

/** A challenge on the go. Saved with the game. */
export interface CookOffState {
  rival: RivalId;
  /** The day the challenge came, and the day of the duel. */
  offeredDay: number;
  day: number;
  /** The player's entry (a recipe key), or null while none is picked. */
  entry: string | null;
  declined: boolean;
}

/** What a dish scores with the judges: its quality (the best this kitchen can cook it), plus value for money. */
export function cookOffScore(restaurant: Restaurant, dish: MenuDish, inSeason: readonly ExtraId[], valueWeight: number): number {
  const quality = Math.max(0, ...restaurant.chefs.map((chef) => orderQuality([dish], chef, restaurant.supplier, inSeason)));
  const value = (1 - dish.price / templateOf(dish).referencePrice) * balance.cookOffs.valuePoints * valueWeight;
  return quality + value;
}

/** What the rival's entry scores before the luck of the day: its signature dish, cooked for years. */
export function rivalCookOffScore(rival: Restaurant, id: RivalId, inSeason: readonly ExtraId[] = []): { dish: MenuDish | null; score: number } {
  const entries = cookOffEntries(rival, id, inSeason);
  const dish = entries.find((d) => d.template === COOK_OFFS[id].signature) ?? entries[0] ?? null;
  if (!dish) return { dish, score: 0 };
  return { dish, score: cookOffScore(rival, dish, inSeason, COOK_OFFS[id].valueWeight) + balance.cookOffs.rivalSignatureBonus };
}

/** The dishes on a restaurant's menu that can be entered in this rival's duel, best first. */
export function cookOffEntries(restaurant: Restaurant, rival: RivalId, inSeason: readonly ExtraId[] = []): MenuDish[] {
  const kind = COOK_OFFS[rival];
  return restaurant.menu
    .filter((dish) => dishFits(dish, kind.field))
    .sort((a, b) => cookOffScore(restaurant, b, inSeason, kind.valueWeight) - cookOffScore(restaurant, a, inSeason, kind.valueWeight));
}

/** Maybe a rival challenges the player this morning (on Wednesdays, from the second week). Its own dice. */
export function rollCookOff(seed: number, day: number, state: GameState): CookOffState | null {
  const c = balance.cookOffs;
  if (day < c.firstDay || weekdayOf(day) !== c.offerWeekday) return null;
  const rng = createRng(seed);
  if (nextFloat(rng) >= c.chance) return null;
  // A rival whose field the player can enter, if there is one; never the same rival twice running.
  const others = RIVAL_IDS.filter((id) => id !== state.cookOff?.rival);
  const enterable = others.filter((id) => cookOffEntries(state.restaurants[0], id).length > 0);
  const rival = pick(rng, enterable.length > 0 ? enterable : others);
  return { rival, offeredDay: day, day: day + c.duelInDays, entry: null, declined: false };
}

/** Picks the player's entry (a recipe key from the menu), or declines (null). Until the morning of the duel. */
export function pickCookOffEntry(state: GameState, entry: string | null): GameState {
  const duel = state.cookOff;
  if (!duel || state.day > duel.day || state.day < duel.offeredDay) return state;
  if (entry !== null && !cookOffEntries(state.restaurants[0], duel.rival).some((dish) => recipeKey(dish) === entry)) return state;
  return { ...state, cookOff: { ...duel, entry, declined: entry === null } };
}

export interface CookOffResult {
  rival: RivalId;
  /** Null when the player declined, or had nothing to enter. */
  playerDish: MenuDish | null;
  playerScore: number;
  rivalDish: MenuDish | null;
  rivalScore: number;
  won: boolean;
}

/** The duel, judged at the end of its day. `player` and `rival` are the restaurants as they cooked that day. */
export function judgeCookOff(
  duel: CookOffState,
  player: Restaurant,
  rival: Restaurant,
  inSeason: readonly ExtraId[],
  seed: number,
): CookOffResult {
  const kind = COOK_OFFS[duel.rival];
  const rng = createRng(seed);
  const luck = () => (nextFloat(rng) * 2 - 1) * balance.cookOffs.luck;
  const entry = rivalCookOffScore(rival, duel.rival, inSeason);
  const rivalDish = entry.dish;
  const rivalScore = rivalDish ? entry.score + luck() : 0;
  const playerDish = duel.declined || duel.entry === null ? null : (player.menu.find((dish) => recipeKey(dish) === duel.entry) ?? null);
  const playerScore = playerDish ? cookOffScore(player, playerDish, inSeason, kind.valueWeight) + luck() : 0;
  return { rival: duel.rival, playerDish, playerScore, rivalDish, rivalScore, won: playerDish !== null && playerScore > rivalScore };
}
