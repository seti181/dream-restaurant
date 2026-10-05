// Lookups for dishes on a menu.

import { balance } from '../data/balance';
import {
  DISH_TEMPLATES,
  EXTRA_IDS,
  EXTRAS,
  PAIRINGS,
  type DishTemplate,
  type ExtraId,
  type MenuDish,
  type Pairing,
  type Tag,
  type Variant,
} from '../data/dishes';
import type { MenuWant } from '../data/bookings';
import { dateOf, MONTH_NAMES } from './calendar';
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

/** The taste tag a dish earns at three stars: the first of balance.dishLevels.masteryTags it doesn't already have. */
export function masteryTagOf(dish: MenuDish): Tag | null {
  const tags = baseTagsOf(dish);
  return balance.dishLevels.masteryTags.find((tag) => !tags.includes(tag)) ?? null;
}

/** Every taste tag of the dish: template, variant and extras (and one earned at three stars), without repeats. */
export function tagsOf(dish: MenuDish): Tag[] {
  const mastered = (dish.stars ?? 0) >= balance.dishLevels.starsAt.length ? masteryTagOf(dish) : null;
  return [
    ...new Set([...baseTagsOf(dish), ...extrasOf(dish).flatMap((extra) => EXTRAS[extra].tags), ...(mastered ? [mastered] : [])]),
  ];
}

/** True if the dish is what they want: in this category, with this tag, or this very dish (every one given must match). */
export function dishFits(dish: MenuDish, want: MenuWant): boolean {
  return (
    (want.category === undefined || templateOf(dish).category === want.category) &&
    (want.tag === undefined || tagsOf(dish).includes(want.tag)) &&
    (want.template === undefined || dish.template === want.template)
  );
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

/** Cytrynówka on its own, or a glass of it on the side: what the Friday regular wants. */
export function hasCytrynowka(dish: MenuDish): boolean {
  return dish.template === 'cytrynowka' || extrasOf(dish).includes('cytrynowka');
}

/** Quality gained or lost from the dish's pairings. */
export function pairingQuality(dish: MenuDish): number {
  return pairingsOf(dish).reduce((sum, pairing) => sum + pairing.quality, 0);
}

/**
 * What one portion's ingredients cost from the given supplier. Fresh produce out of season
 * is imported and dearer: pass what's in season (all of it counts as in season if left out).
 */
export function ingredientCostOf(dish: MenuDish, supplier: Supplier, inSeason?: readonly ExtraId[]): number {
  const multiplier = supplier === 'premium' ? balance.supplier.premiumCostMultiplier : 1;
  const extras = extrasOf(dish).reduce((sum, extra) => sum + extraCost(extra, inSeason), 0);
  return (variantOf(dish).ingredientCost + extras) * multiplier;
}

/** What an extra adds to a portion (from the market): fresh produce out of season is imported, and dearer. */
export function extraCost(extra: ExtraId, inSeason?: readonly ExtraId[]): number {
  const imported = inSeason !== undefined && EXTRAS[extra].season !== undefined && !inSeason.includes(extra);
  return EXTRAS[extra].ingredientCost * (imported ? balance.seasonal.outOfSeasonCost : 1);
}

// ---------- What's in season, and today's special ----------

/** True if the date (month, day of month) falls within the season, both ends included. */
function withinSeason(month: number, dayOfMonth: number, season: { from: [number, number]; until: [number, number] }): boolean {
  const at = month * 100 + dayOfMonth;
  return at >= season.from[0] * 100 + season.from[1] && at <= season.until[0] * 100 + season.until[1];
}

/** The fresh produce in season on this day. */
export function inSeasonOn(day: number): ExtraId[] {
  const { month, dayOfMonth } = dateOf(day);
  return EXTRA_IDS.filter((id) => {
    const season = EXTRAS[id].season;
    return season !== undefined && withinSeason(month, dayOfMonth, season);
  });
}

/** The extras on this dish that are fresh produce in season right now. */
export function freshOn(dish: MenuDish, inSeason: readonly ExtraId[]): ExtraId[] {
  return extrasOf(dish).filter((extra) => inSeason.includes(extra));
}

/** An extra's everyday name, without the Polish in brackets: "chanterelles". */
export const produceName = (extra: ExtraId) => EXTRAS[extra].name.replace(/ \(.*\)$/, '');

/** The morning news when fresh produce comes into season, or goes out of it. */
export function seasonNews(yesterday: number, today: number): { title: string; text: string }[] {
  const before = inSeasonOn(yesterday);
  const now = inSeasonOn(today);
  const until = (id: ExtraId) => {
    const [month, dayOfMonth] = EXTRAS[id].season!.until;
    return `${dayOfMonth} ${MONTH_NAMES[month - 1]}`;
  };
  return [
    ...now
      .filter((id) => !before.includes(id))
      .map((id) => ({
        title: 'Fresh at the market',
        text: `The first ${produceName(id)} are in! In season until ${until(id)}: fresh, they make any dish better (dish creator, Menu tab).`,
      })),
    ...before
      .filter((id) => !now.includes(id))
      .map((id) => ({
        title: 'Out of season',
        text: `That’s the last of the ${produceName(id)} for this year. From now on they’re imported: dearer, and not as fresh.`,
      })),
  ];
}

/** Today's special ("Dziś polecamy"), if one is chosen and still on the menu. */
export function specialOf(restaurant: Restaurant): MenuDish | null {
  if (!restaurant.special) return null;
  return restaurant.menu.find((dish) => recipeKey(dish) === restaurant.special) ?? null;
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

/** What share of menu prices guests pay at this minute: less during happy hour. */
export function priceMultiplier(restaurant: Restaurant, minute: number): number {
  return happyHourOn(restaurant, minute) ? 1 - balance.happyHour.discount : 1;
}

/** True during the hour after the player started today's happy hour. */
export function happyHourOn(restaurant: Restaurant, minute: number): boolean {
  const from = restaurant.happyHourFrom;
  return from !== undefined && minute >= from && minute < from + balance.happyHour.minutes;
}
