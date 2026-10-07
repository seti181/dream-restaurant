// The morning market: ingredient prices change a little every day, with a deal or two worth
// building the special around. The goods are in data/market.ts. See project.md section 6.15, D13.

import { balance } from '../data/balance';
import { EXTRAS, type ExtraId, type MenuDish } from '../data/dishes';
import { DISH_GOODS, EXTRA_GOODS, GOOD_IDS, GOODS, type GoodId } from '../data/market';
import { chance, createRng, nextFloat, nextInt, pick, weightedPick } from './rng';

/** A deal at the market, or a good that's dear, and which of its stories is told. */
export interface MarketNote {
  good: GoodId;
  story: number;
}

/** This morning's market. Saved with the game. */
export interface MarketState {
  day: number;
  /** Each good's everyday price, compared with its usual price (1), before any deal. */
  drift: Record<GoodId, number>;
  deals: MarketNote[];
  dear: MarketNote | null;
}

/** What each good costs today, compared with usual (1 if missing). */
export type MarketPrices = Partial<Record<GoodId, number>>;

const round = (n: number) => Math.round(n * 100) / 100;

/** The goods with fresh produce in season today (strawberries make fruit a likelier deal). */
function goodsInSeason(inSeason: readonly ExtraId[]): GoodId[] {
  return inSeason.map((extra) => EXTRA_GOODS[extra]).filter((good): good is GoodId => good !== undefined);
}

/** This morning's market for `day`, following on from yesterday's. Its own dice, so nothing else changes. */
export function rollMarket(seed: number, day: number, yesterday: MarketState | null, inSeason: readonly ExtraId[]): MarketState {
  const m = balance.market;
  const rng = createRng(seed);
  const drift = {} as Record<GoodId, number>;
  for (const good of GOOD_IDS) {
    const before = yesterday?.drift[good] ?? 1;
    const moved = 1 + (before - 1) * (1 - m.pullBack) + (nextFloat(rng) * 2 - 1) * m.drift;
    drift[good] = round(Math.max(1 - m.driftLimit, Math.min(1 + m.driftLimit, moved)));
  }
  const fresh = goodsInSeason(inSeason);
  const note = (good: GoodId, stories: string[]): MarketNote => ({ good, story: nextInt(rng, 0, stories.length - 1) });
  const deals: MarketNote[] = [];
  const dealCount = chance(rng, m.secondDealChance) ? 2 : 1;
  while (deals.length < dealCount) {
    const options = GOOD_IDS.filter((g) => !deals.some((d) => d.good === g));
    const good = weightedPick(rng, options, (g) => (fresh.includes(g) ? m.inSeasonDealWeight : 1));
    deals.push(note(good, GOODS[good].dealStories));
  }
  let dear: MarketNote | null = null;
  if (chance(rng, m.dearChance)) {
    const good = pick(rng, GOOD_IDS.filter((g) => !deals.some((d) => d.good === g)));
    dear = note(good, GOODS[good].dearStories);
  }
  return { day, drift, deals, dear };
}

/** What each good costs on this day: nothing changes without a market for that day (an older save). */
export function marketPrices(market: MarketState | null, day: number): MarketPrices {
  if (!market || market.day !== day) return {};
  const prices: MarketPrices = { ...market.drift };
  for (const deal of market.deals) prices[deal.good] = round(market.drift[deal.good] * balance.market.dealPrice);
  if (market.dear) prices[market.dear.good] = round(market.drift[market.dear.good] * balance.market.dearPrice);
  return prices;
}

/** Today's deals, or none without a market for that day. */
export function marketDeals(market: MarketState | null, day: number): GoodId[] {
  return market && market.day === day ? market.deals.map((d) => d.good) : [];
}

/** What a dish is mostly made of, at the market, or null for a dish the market doesn't change. */
export function goodOf(dish: MenuDish): GoodId | null {
  return DISH_GOODS[`${dish.template}.${dish.variant}`] ?? DISH_GOODS[dish.template] ?? null;
}

/** True when the dish is made of one of today's deals: on the board outside, it's fresh from the market. */
export function fromTheMarket(dish: MenuDish, deals: readonly GoodId[]): boolean {
  const good = goodOf(dish);
  return good !== null && deals.includes(good);
}

/** The deal's headline: "Cheap cod at the harbour today!", or the fresh produce in season by name. */
export function dealHeadline(good: GoodId, inSeason: readonly ExtraId[]): string {
  const produce = inSeason.find((extra) => EXTRA_GOODS[extra] === good);
  if (produce) {
    const name = EXTRAS[produce].name.replace(/ \(.*\)$/, '');
    return `${name.charAt(0).toUpperCase()}${name.slice(1)} going cheap at the market!`;
  }
  return GOODS[good].deal;
}

/** "Fish dishes cost about 35% less to make today." */
export function priceChangeText(good: GoodId, price: number): string {
  const percent = Math.round(Math.abs(1 - price) * 100);
  const name = GOODS[good].name;
  return price < 1 ? `Dishes with ${name} cost about ${percent}% less to make today.` : `Dishes with ${name} cost about ${percent}% more to make today.`;
}
