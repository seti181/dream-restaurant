import { describe, expect, it } from 'vitest';
import { DAILY_GOAL_IDS, DAILY_GOALS } from '../data/dailyGoals';
import { dailyGoalMet, dailyGoalText, dailyProgress, dailyTarget, rollDailyGoal } from './dailyGoals';
import { closeDay, dailyGoalToday, newGame, openRestaurant, playerOf, playTick, type GameState } from './game';
import { templateOf } from './menu';

const player = playerOf(newGame(1));

describe('daily goals', () => {
  it('grow with the room, and never ask for less than their minimum', () => {
    expect(dailyTarget('soupsBeforeTwo', 4)).toBe(5);
    expect(dailyTarget('soupsBeforeTwo', 8)).toBe(10);
    expect(dailyTarget('soupsBeforeTwo', 1)).toBe(DAILY_GOALS.soupsBeforeTwo.min);
    expect(dailyTarget('happyFoodie', 12)).toBe(1);
  });

  it('ask for more takings than yesterday’s, once there was a yesterday', () => {
    expect(dailyTarget('takings', 4)).toBe(2_000);
    expect(dailyTarget('takings', 4, 3_000)).toBe(3_300);
    expect(dailyTarget('takings', 4, 100)).toBe(DAILY_GOALS.takings.min);
  });

  it('never repeat yesterday’s, and only ask for what the menu makes possible', () => {
    const noSoup = { ...player, menu: player.menu.filter((dish) => templateOf(dish).category !== 'soup'), lunchSet: null };
    for (let seed = 0; seed < 200; seed++) {
      const goal = rollDailyGoal(seed, 'fullHouse', noSoup);
      expect(goal.id).not.toBe('fullHouse');
      expect(['soupsBeforeTwo', 'desserts', 'specialPortions', 'lunchSets']).not.toContain(goal.id);
      expect(dailyGoalText(goal)).not.toContain('{n}');
    }
    // Every kind comes up for a restaurant that has everything.
    const everything = { ...player, special: undefined };
    const seen = new Set(Array.from({ length: 400 }, (_, seed) => rollDailyGoal(seed, null, everything).id));
    expect(seen.has('soupsBeforeTwo')).toBe(true);
    expect(DAILY_GOAL_IDS.length).toBeGreaterThan(seen.size - 1);
  });
});

describe('a daily goal over a day', () => {
  function play(state: GameState) {
    const open = openRestaurant(state);
    while (!open.progress.done) playTick(open);
    return { open, ...closeDay(state, open) };
  }

  it('is counted during the day, noticed when it’s reached, and paid at closing', () => {
    const easy: GameState = { ...newGame(9), dailyGoal: { id: 'takings', target: 1 } };
    const none: GameState = { ...easy, dailyGoal: null };
    const done = play(easy);
    expect(done.open.dailyGoalDoneAt).not.toBeNull();
    expect(done.summary.dailyGoal).toEqual(expect.objectContaining({ done: true }));
    expect(done.state.cash - play(none).state.cash).toBe(DAILY_GOALS.takings.reward);
    // And a new one comes the next morning.
    expect(done.state.dailyGoal).not.toBeNull();
    expect(done.state.dailyGoal?.id).not.toBe('takings');
  });

  it('“Nobody walks out” is only settled at closing', () => {
    const state: GameState = { ...newGame(10), dailyGoal: { id: 'nobodyWalksOut', target: 0 } };
    const open = openRestaurant(state);
    for (let i = 0; i < 20; i++) playTick(open);
    expect(dailyGoalMet(state.dailyGoal!, open.progress, open.everyTableTaken)).toBe(false);
    expect(open.dailyGoalDoneAt).toBeNull();
    while (!open.progress.done) playTick(open);
    const walkedOut = dailyProgress(state.dailyGoal!, open.progress, false);
    expect(closeDay(state, open).summary.dailyGoal?.done).toBe(walkedOut === 0);
    expect(dailyGoalToday(open)?.atClosing).toBe(true);
  });
});
