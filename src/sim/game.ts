// The whole game and the rhythm of a day: plan, open, and close with the day's results.
// See project.md section 4.

import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { GROUP_IDS, type GroupId } from '../data/groups';
import { RIVAL_IDS } from '../data/rivals';
import { startDay, stepDay, type DayInProgress } from './day';
import { isMonday } from './calendar';
import { weeklyBillsDue } from './finance';
import { createRng, type RngState } from './rng';
import { createPlayerRestaurant, createRivalRestaurant } from './setup';
import { generateCandidates, starterTeam, staffOf } from './staff';
import type { Employee, PartyOutcome, Restaurant, SatisfactionFactors } from './types';

/** Everything that makes up a game in progress. Plain data, so it can be saved. */
export interface GameState {
  /** Days since the season started; day 0 is Monday 1 April. */
  day: number;
  cash: number;
  rng: RngState;
  /** How many dishes the player's menu can hold. */
  menuSlots: number;
  /** The player's staff. The player's restaurant always mirrors this list. */
  team: Employee[];
  /** This week's job candidates; a new pool arrives every Monday. */
  candidates: Employee[];
  /** The id the next new person will get. */
  nextEmployeeId: number;
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

export interface GroupDay {
  served: number;
  /** Walked out or found no free table. */
  lost: number;
  reputationBefore: number;
  reputationAfter: number;
}

export interface DaySummary extends DayTally {
  day: number;
  wages: number;
  rent: number;
  utilities: number;
  profit: number;
  ratingBefore: number;
  ratingAfter: number;
  groups: Record<GroupId, GroupDay>;
  /** Average of each satisfaction factor over served parties, or null if nobody was served. */
  feedback: SatisfactionFactors | null;
  /** Portions sold of each dish, best sellers first. */
  dishesSold: { dish: MenuDish; count: number }[];
  /** Guests each rival served today. */
  rivals: { id: string; name: string; guestsServed: number }[];
}

export function newGame(seed: number): GameState {
  const start = balance.start;
  const rng = createRng(seed);
  const team = starterTeam();
  const candidates = generateCandidates(rng, team.length + 1, namesOf(team));
  return {
    day: 0,
    cash: balance.finance.startingCash,
    rng,
    menuSlots: balance.menu.startingSlots,
    team,
    candidates,
    nextEmployeeId: team.length + candidates.length + 1,
    restaurants: [
      createPlayerRestaurant(start.name, start.menu, staffOf(team, 'chef'), staffOf(team, 'waiter')),
      ...RIVAL_IDS.map(createRivalRestaurant),
    ],
  };
}

function namesOf(people: Employee[]): Set<string> {
  return new Set(people.map((person) => person.name));
}

export function playerOf(state: GameState): Restaurant {
  return state.restaurants[0];
}

/** What the player's team costs per day. */
export function teamWages(state: GameState): number {
  return state.team.reduce((sum, person) => sum + person.wage, 0);
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

function groupDays(outcomes: PartyOutcome[], before: Restaurant, after: Restaurant): Record<GroupId, GroupDay> {
  const groups = Object.fromEntries(
    GROUP_IDS.map((g) => [
      g,
      { served: 0, lost: 0, reputationBefore: before.reputation[g], reputationAfter: after.reputation[g] },
    ]),
  ) as Record<GroupId, GroupDay>;
  for (const o of outcomes) {
    if (o.restaurant !== before.id) continue;
    if (o.kind === 'served') groups[o.group].served += o.size;
    else if (o.kind === 'walkedOut' || o.kind === 'noTable') groups[o.group].lost += o.size;
  }
  return groups;
}

function averageFeedback(outcomes: PartyOutcome[], restaurantId: string): SatisfactionFactors | null {
  const served = outcomes.filter((o) => o.restaurant === restaurantId && o.factors !== null);
  if (served.length === 0) return null;
  const mean = (key: keyof SatisfactionFactors) =>
    served.reduce((sum, o) => sum + o.factors![key], 0) / served.length;
  return {
    quality: mean('quality'),
    value: mean('value'),
    wait: mean('wait'),
    ambiance: mean('ambiance'),
    service: mean('service'),
  };
}

function dishesSold(outcomes: PartyOutcome[], restaurantId: string): { dish: MenuDish; count: number }[] {
  const counts = new Map<string, { dish: MenuDish; count: number }>();
  for (const o of outcomes) {
    if (o.restaurant !== restaurantId || o.kind !== 'served') continue;
    for (const dish of o.order) {
      const key = `${dish.template}/${dish.variant}`;
      const entry = counts.get(key) ?? { dish, count: 0 };
      entry.count++;
      counts.set(key, entry);
    }
  }
  return [...counts.values()].sort((a, b) => b.count - a.count);
}

/** Ends the day: pays wages and any weekly bills, and moves on to the next day. */
export function closeDay(state: GameState, open: OpenDay): { state: GameState; summary: DaySummary } {
  const playerBefore = playerOf(state);
  const playerAfter = open.progress.restaurants[0];
  const tally = tallyFor(open.progress.outcomes, playerBefore.id);
  const wages = teamWages(state);
  const { rent, utilities } = weeklyBillsDue(playerBefore, state.day);
  const profit = tally.revenue - tally.ingredientCost - wages - rent - utilities;

  const rng = { ...open.rng };
  const nextDay = state.day + 1;
  let { candidates, nextEmployeeId } = state;
  if (isMonday(nextDay)) {
    // A new week brings new faces looking for work.
    candidates = generateCandidates(rng, nextEmployeeId, namesOf(state.team));
    nextEmployeeId += candidates.length;
  }

  return {
    state: {
      ...state,
      day: nextDay,
      cash: state.cash + profit,
      rng,
      candidates,
      nextEmployeeId,
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
      groups: groupDays(open.progress.outcomes, playerBefore, playerAfter),
      feedback: averageFeedback(open.progress.outcomes, playerBefore.id),
      dishesSold: dishesSold(open.progress.outcomes, playerBefore.id),
      rivals: open.progress.restaurants.slice(1).map((rival) => ({
        id: rival.id,
        name: rival.name,
        guestsServed: tallyFor(open.progress.outcomes, rival.id).guestsServed,
      })),
    },
  };
}
