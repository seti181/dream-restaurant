// The whole game and the rhythm of a day: plan, open, and close with the day's results.
// See project.md section 4.

import { balance } from '../data/balance';
import { GROUP_IDS } from '../data/groups';
import { RIVAL_IDS } from '../data/rivals';
import { startDay, stepDay, type DayInProgress } from './day';
import { dailyWages, weeklyBillsDue } from './finance';
import { createRng, type RngState } from './rng';
import { createPlayerRestaurant, createRivalRestaurant } from './setup';
import type { PartyOutcome, Restaurant } from './types';

/** Everything that makes up a game in progress. Plain data, so it can be saved. */
export interface GameState {
  /** Days since the season started; day 0 is Monday 1 April. */
  day: number;
  cash: number;
  rng: RngState;
  /** The player's restaurant first, then the rivals. */
  restaurants: Restaurant[];
}

/** A day that is currently being played. */
export interface OpenDay {
  progress: DayInProgress;
  /** The day's own copy of the random generator; handed back to the game at closing. */
  rng: RngState;
}

/** The player's numbers for a day, so far or in total. */
export interface DayTally {
  guestsServed: number;
  guestsWalkedOut: number;
  guestsTurnedAway: number;
  revenue: number;
  ingredientCost: number;
  /** Average satisfaction (0–100) of served guests, or null if nobody was served. */
  averageSatisfaction: number | null;
}

export interface DaySummary extends DayTally {
  day: number;
  wages: number;
  rent: number;
  utilities: number;
  profit: number;
  ratingBefore: number;
  ratingAfter: number;
}

export function newGame(seed: number): GameState {
  const start = balance.start;
  return {
    day: 0,
    cash: balance.finance.startingCash,
    rng: createRng(seed),
    restaurants: [
      createPlayerRestaurant(start.name, start.menu, start.chefs, start.waiters),
      ...RIVAL_IDS.map(createRivalRestaurant),
    ],
  };
}

export function playerOf(state: GameState): Restaurant {
  return state.restaurants[0];
}

/** Star rating from 0 to 5: the average reputation across all groups. */
export function starRating(restaurant: Restaurant): number {
  const total = GROUP_IDS.reduce((sum, group) => sum + restaurant.reputation[group], 0);
  return total / GROUP_IDS.length / 20;
}

export function openRestaurant(state: GameState): OpenDay {
  return { progress: startDay(state.day, state.restaurants), rng: { ...state.rng } };
}

/** Plays one tick (five in-game minutes). */
export function playTick(open: OpenDay): void {
  stepDay(open.rng, open.progress);
}

/** The player's results from a list of party outcomes. */
export function tallyFor(outcomes: PartyOutcome[], restaurantId: string): DayTally {
  const tally: DayTally = {
    guestsServed: 0,
    guestsWalkedOut: 0,
    guestsTurnedAway: 0,
    revenue: 0,
    ingredientCost: 0,
    averageSatisfaction: null,
  };
  let satisfactionTotal = 0;
  let servedParties = 0;
  for (const o of outcomes) {
    if (o.restaurant !== restaurantId) continue;
    tally.revenue += o.revenue;
    tally.ingredientCost += o.ingredientCost;
    if (o.kind === 'served') {
      tally.guestsServed += o.size;
      satisfactionTotal += o.satisfaction ?? 0;
      servedParties++;
    } else if (o.kind === 'walkedOut') {
      tally.guestsWalkedOut += o.size;
    } else if (o.kind === 'noTable') {
      tally.guestsTurnedAway += o.size;
    }
  }
  if (servedParties > 0) tally.averageSatisfaction = satisfactionTotal / servedParties;
  return tally;
}

/** Ends the day: pays wages and any weekly bills, and moves on to the next day. */
export function closeDay(state: GameState, open: OpenDay): { state: GameState; summary: DaySummary } {
  const playerBefore = playerOf(state);
  const playerAfter = open.progress.restaurants[0];
  const tally = tallyFor(open.progress.outcomes, playerBefore.id);
  const wages = dailyWages(playerBefore);
  const { rent, utilities } = weeklyBillsDue(playerBefore, state.day);
  const profit = tally.revenue - tally.ingredientCost - wages - rent - utilities;

  return {
    state: {
      day: state.day + 1,
      cash: state.cash + profit,
      rng: { ...open.rng },
      restaurants: open.progress.restaurants,
    },
    summary: {
      ...tally,
      day: state.day,
      wages,
      rent,
      utilities,
      profit,
      ratingBefore: starRating(playerBefore),
      ratingAfter: starRating(playerAfter),
    },
  };
}
