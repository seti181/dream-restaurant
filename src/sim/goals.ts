// Mewa's weekly goals: progress through the week, and a new goal every Monday.
// See project.md section 6.11.

import { GOALS, type Goal } from '../data/mewa';
import { nextInt, type RngState } from './rng';
import { templateOf } from './menu';
import type { Restaurant } from './types';

export interface GoalState {
  /** Which goal, as a position in GOALS. */
  index: number;
  /** This week's running total (for happiness: the sum of each day's average). */
  total: number;
  /** Days counted so far, for goals about averages. */
  days: number;
  done: boolean;
}

/** What the goal's numbers come from each day. */
export interface GoalDay {
  guestsServed: number;
  servedByGroup: Partial<Record<string, number>>;
  fiveStarReviews: number;
  profit: number;
  lunchSetsSold: number;
  /** Average happiness today, or null if nobody was served. */
  averageSatisfaction: number | null;
  /** The player's restaurant at the end of the day. */
  player: Restaurant;
}

export function goalOf(state: GoalState): Goal {
  return GOALS[state.index];
}

export function goalText(goal: Goal): string {
  return goal.text.replace('{n}', goal.target.toLocaleString('en-GB'));
}

/** Progress towards the target, in the goal's own units. */
export function goalProgress(state: GoalState): number {
  if (goalOf(state).kind === 'happiness') return state.days === 0 ? 0 : state.total / state.days;
  return state.total;
}

export function startGoal(index: number): GoalState {
  return { index, total: 0, days: 0, done: false };
}

/** A new goal for the week, different from last week's. */
export function nextGoal(rng: RngState, previous: number): GoalState {
  const offset = nextInt(rng, 1, GOALS.length - 1);
  return startGoal((previous + offset) % GOALS.length);
}

/** Adds a day to the goal. Once done, a goal stays done. */
export function trackGoal(state: GoalState, day: GoalDay): GoalState {
  if (state.done) return state;
  const goal = goalOf(state);
  let { total, days } = state;
  switch (goal.kind) {
    case 'serveGuests':
      total += day.guestsServed;
      break;
    case 'serveGroup':
      total += day.servedByGroup[goal.group!] ?? 0;
      break;
    case 'fiveStarReview':
      total += day.fiveStarReviews;
      break;
    case 'menuCategory':
      total = day.player.menu.some((dish) => templateOf(dish).category === goal.category) ? 1 : 0;
      break;
    case 'weekProfit':
      total += day.profit;
      break;
    case 'lunchSets':
      total += day.lunchSetsSold;
      break;
    case 'happiness':
      if (day.averageSatisfaction !== null) {
        total += day.averageSatisfaction;
        days += 1;
      }
      break;
  }
  const updated = { ...state, total, days };
  return { ...updated, done: goalProgress(updated) >= goal.target };
}
