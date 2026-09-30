// The rivals' weekly decisions. Every Monday each rival looks at last week and
// makes one move: react to the player, make room, add a seasonal dish, run a
// promotion, upgrade, or nudge its prices. See project.md section 6.9.

import { balance } from '../data/balance';
import { DISH_TEMPLATES, type MenuDish } from '../data/dishes';
import { GROUP_IDS, type GroupId } from '../data/groups';
import { LOCATIONS } from '../data/locations';
import { RIVALS, type RivalId, type RivalMove } from '../data/rivals';
import { dateOf } from './calendar';
import type { GameState } from './game';
import { recipeKey, templateOf } from './menu';
import { nextFloat, type RngState } from './rng';
import type { Restaurant } from './types';

/** The two groups a rival cares about most: where it started with the best reputation. */
export function favouriteGroups(id: RivalId): GroupId[] {
  const reputation = RIVALS[id].startingReputation;
  return [...GROUP_IDS].sort((a, b) => reputation[b] - reputation[a]).slice(0, 2);
}

/** Every price the rival has ever put on the menu, so price changes stay within reason. */
function startingPrices(id: RivalId): Map<string, number> {
  const dishes = [...RIVALS[id].menu, ...RIVALS[id].seasonalDishes.map((s) => s.dish)];
  return new Map(dishes.map((dish) => [recipeKey(dish), dish.price]));
}

function repriced(rival: Restaurant, factor: number): MenuDish[] {
  const original = startingPrices(rival.id as RivalId);
  const r = balance.rivals;
  return rival.menu.map((dish) => {
    const base = original.get(recipeKey(dish)) ?? dish.price;
    let price = Math.min(base * r.maxPriceFactor, Math.max(base * r.minPriceFactor, dish.price * factor));
    if (templateOf(dish).category === 'dessert') price = Math.min(price, balance.menu.maxDessertPrice);
    return { ...dish, price: Math.round(price) };
  });
}

/** A seasonal dish that's due and not on the menu yet, or undefined. */
function dueSeasonalDish(rival: Restaurant, day: number): MenuDish | undefined {
  const { month } = dateOf(day);
  const onMenu = new Set(rival.menu.map(recipeKey));
  return RIVALS[rival.id as RivalId].seasonalDishes.find((s) => s.fromMonth <= month && !onMenu.has(recipeKey(s.dish)))
    ?.dish;
}

function weightedMove(rng: RngState, options: [RivalMove, number][]): RivalMove {
  let roll = nextFloat(rng) * options.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [move, weight] of options) {
    roll -= weight;
    if (roll < 0) return move;
  }
  return options[options.length - 1][0];
}

function sumGroups(counts: Partial<Record<GroupId, number>> | undefined, groups: GroupId[]): number {
  return groups.reduce((sum, g) => sum + (counts?.[g] ?? 0), 0);
}

/** Decides and makes one rival's move for the week. */
function planRival(state: GameState, rival: Restaurant, rng: RngState): { rival: Restaurant; news: string } {
  const id = rival.id as RivalId;
  const r = balance.rivals;
  const favourites = favouriteGroups(id);
  const served = state.week.served[id];
  const theirFavourites = sumGroups(served, favourites);
  const playerFavourites = sumGroups(state.week.served.player, favourites);
  const totalServed = sumGroups(served, [...GROUP_IDS]);
  const turnedAway = state.week.turnedAway[id] ?? 0;
  const maxTables = Math.floor(LOCATIONS[rival.location].maxSeats / balance.service.seatsPerTable);
  const newDish = dueSeasonalDish(rival, state.day);

  let move: RivalMove;
  if (theirFavourites > 0 && playerFavourites >= theirFavourites * r.playerThreatShare) {
    move = 'reactToPlayer';
  } else if (totalServed > 0 && turnedAway > totalServed * r.crowdedShare) {
    move = rival.tables < maxTables ? 'upgrade' : 'raisePrices';
  } else {
    const options: [RivalMove, number][] = [
      ['promotion', 2],
      ['cutPrices', 1],
      ['raisePrices', 1],
    ];
    if (newDish) options.push(['newDish', 3]);
    if (rival.ambiance < r.maxAmbiance || rival.tables < maxTables) options.push(['upgrade', 1]);
    move = weightedMove(rng, options);
  }

  let updated = rival;
  let dishName = '';
  switch (move) {
    case 'reactToPlayer':
      updated = { ...rival, menu: repriced(rival, 1 - r.reactionPriceCut) };
      break;
    case 'cutPrices':
      updated = { ...rival, menu: repriced(rival, 1 - r.priceStep) };
      break;
    case 'raisePrices':
      updated = { ...rival, menu: repriced(rival, 1 + r.priceStep) };
      break;
    case 'newDish': {
      const dish = newDish!;
      const needs = DISH_TEMPLATES[dish.template].equipment;
      const equipment = needs && !rival.equipment.includes(needs) ? [...rival.equipment, needs] : rival.equipment;
      updated = { ...rival, menu: [...rival.menu, { ...dish }], equipment };
      dishName = DISH_TEMPLATES[dish.template].name.toLowerCase();
      break;
    }
    case 'promotion': {
      const awareness = { ...rival.awareness };
      for (const g of favourites) awareness[g] = Math.min(100, awareness[g] + r.promotionAwareness);
      updated = { ...rival, awareness };
      break;
    }
    case 'upgrade':
      updated =
        turnedAway > totalServed * r.crowdedShare && rival.tables < maxTables
          ? { ...rival, tables: rival.tables + 1 }
          : { ...rival, ambiance: Math.min(r.maxAmbiance, rival.ambiance + r.upgradeAmbiance) };
      break;
  }
  return { rival: updated, news: RIVALS[id].lines[move].replace('{dish}', dishName) };
}

/** Every rival makes its move for the week. The player's restaurant is unchanged. */
export function planRivalWeek(state: GameState, rng: RngState): { restaurants: Restaurant[]; news: string[] } {
  const [player, ...rivals] = state.restaurants;
  const planned = rivals.map((rival) => planRival(state, rival, rng));
  return { restaurants: [player, ...planned.map((p) => p.rival)], news: planned.map((p) => p.news) };
}

/** Rivals' promotions wear off: their awareness drifts back to where it started. */
export function rivalAwarenessToday(rival: Restaurant): Restaurant['awareness'] {
  const base = balance.rivals.awareness;
  const today = { ...rival.awareness };
  for (const g of GROUP_IDS) today[g] = today[g] - (today[g] - base) * balance.marketing.fadePerDay;
  return today;
}
