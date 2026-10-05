// Mewa's daily mini-goals: which one comes each morning, how far it has got, and whether it's
// done. The goals themselves are in data/dailyGoals.ts. See project.md section 6.15, A3.

import { balance } from '../data/balance';
import { DAILY_GOAL_IDS, DAILY_GOALS, type DailyGoalId } from '../data/dailyGoals';
import type { DayInProgress } from './day';
import { recipeKey, specialOf, templateOf } from './menu';
import { createRng, pick } from './rng';
import type { Restaurant } from './types';

/** Today's goal and its target. Saved with the game. */
export interface DailyGoalState {
  id: DailyGoalId;
  target: number;
}

/** The goal in a sentence: "Sell 8 soups before 14:00". */
export function dailyGoalText(goal: DailyGoalState): string {
  return DAILY_GOALS[goal.id].text.replace('{n}', goal.target.toLocaleString('en-GB'));
}

/** Whether the restaurant's menu, special and lunch set make this goal possible. */
function possible(id: DailyGoalId, player: Restaurant): boolean {
  const has = (category: string) => player.menu.some((dish) => templateOf(dish).category === category);
  switch (DAILY_GOALS[id].needs) {
    case 'soup':
      return has('soup');
    case 'dessert':
      return has('dessert');
    case 'special':
      return specialOf(player) !== null;
    case 'lunchSet':
      return player.lunchSet !== null;
    default:
      return true;
  }
}

/** The target for this goal in a room with this many tables (and yesterday's takings, if there was a yesterday). */
export function dailyTarget(id: DailyGoalId, tables: number, yesterdayTakings: number | null = null): number {
  const goal = DAILY_GOALS[id];
  if (goal.fixed !== undefined) return goal.fixed;
  const fromYesterday = goal.beatYesterday && yesterdayTakings ? yesterdayTakings * goal.beatYesterday : 0;
  const target = Math.max(goal.min ?? 0, fromYesterday || (goal.perTable ?? 0) * tables);
  // Round to something that reads nicely: złoty to the hundred, portions to a whole number.
  return target >= 500 ? Math.round(target / 100) * 100 : Math.round(target);
}

/** A goal for the day, one that today's menu makes possible and not the same as yesterday's. */
export function rollDailyGoal(
  seed: number,
  yesterday: DailyGoalId | null,
  player: Restaurant,
  yesterdayTakings: number | null = null,
): DailyGoalState {
  const options = DAILY_GOAL_IDS.filter((id) => id !== yesterday && possible(id, player));
  const id = pick(createRng(seed), options);
  return { id, target: dailyTarget(id, player.tables, yesterdayTakings) };
}

/**
 * How far today's goal has got, in its own units (for "Nobody walks out": guests who did).
 * `everyTableTaken` is whether the room has been full at some point today.
 */
export function dailyProgress(goal: DailyGoalState, progress: DayInProgress, everyTableTaken: boolean): number {
  const player = progress.restaurants[0];
  const served = progress.outcomes.filter((o) => o.restaurant === player.id && o.kind === 'served');
  const dishes = (keep: (o: (typeof served)[number]) => boolean) => served.filter(keep).flatMap((o) => o.order);
  switch (goal.id) {
    case 'soupsBeforeTwo':
      return dishes((o) => (o.servedAt ?? 0) < 14 * 60).filter((d) => templateOf(d).category === 'soup').length;
    case 'nobodyWalksOut':
      return progress.outcomes
        .filter((o) => o.restaurant === player.id && o.kind === 'walkedOut')
        .reduce((sum, o) => sum + o.size, 0);
    case 'happyFoodie':
      return served.filter((o) => o.group === 'foodies' && (o.satisfaction ?? 0) >= balance.dailyGoals.happyFoodieFrom).length;
    case 'specialPortions': {
      const special = specialOf(player);
      return special ? dishes(() => true).filter((d) => recipeKey(d) === recipeKey(special)).length : 0;
    }
    case 'desserts':
      return dishes(() => true).filter((d) => templateOf(d).category === 'dessert').length;
    case 'dinnerGuests':
      return served.filter((o) => (o.servedAt ?? 0) >= 18 * 60).reduce((sum, o) => sum + o.size, 0);
    case 'fullHouse':
      return everyTableTaken ? 1 : 0;
    case 'quickStreak':
      return progress.floors[0].streak.best;
    case 'takings':
      return served.reduce((sum, o) => sum + o.revenue, 0);
    case 'lunchSets':
      return dishes(() => true).filter((d) => d.fromLunchSet).length / 2;
  }
}

/** Whether the goal is met. One settled at closing (nobody walks out) only counts once the day is done. */
export function dailyGoalMet(goal: DailyGoalState, progress: DayInProgress, everyTableTaken: boolean): boolean {
  const done = dailyProgress(goal, progress, everyTableTaken);
  if (DAILY_GOALS[goal.id].atClosing) return progress.done && done <= goal.target;
  return done >= goal.target;
}
