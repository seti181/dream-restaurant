import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { FIRST_GOAL, GOALS } from '../data/mewa';
import { dismissTip, skipTips } from './actions';
import { closeDay, newGame, openRestaurant, playTick, type GameState } from './game';
import { goalProgress, goalText, nextGoal, startGoal, trackGoal, type GoalDay } from './goals';
import { isNeptuneDay, neptuneResult } from './neptune';
import { createRng } from './rng';

const quietDay = (state: GameState): GoalDay => ({
  guestsServed: 0,
  servedByGroup: {},
  fiveStarReviews: 0,
  profit: 0,
  lunchSetsSold: 0,
  averageSatisfaction: null,
  player: state.restaurants[0],
});

const playDay = (state: GameState) => {
  const open = openRestaurant(state);
  while (!open.progress.done) playTick(open);
  return closeDay(state, open);
};

describe('Mewa’s tips', () => {
  it('remember which tips were read, or all switched off', () => {
    const state = dismissTip(newGame(1), 'welcome');
    expect(state.mewa.seenTips).toEqual(['welcome']);
    expect(dismissTip(state, 'welcome')).toBe(state);
    expect(skipTips(state).mewa.tipsOff).toBe(true);
  });
});

describe('weekly goals', () => {
  it('start with Mewa’s first goal and write it in words', () => {
    const state = newGame(1);
    expect(state.goal).toEqual(startGoal(FIRST_GOAL));
    expect(goalText(GOALS[FIRST_GOAL])).toBe('Serve 250 guests this week');
  });

  it('count progress and finish when the target is reached', () => {
    const state = newGame(1);
    const { target } = GOALS[FIRST_GOAL];
    let goal = startGoal(FIRST_GOAL);
    goal = trackGoal(goal, { ...quietDay(state), guestsServed: target - 50 });
    expect(goalProgress(goal)).toBe(target - 50);
    expect(goal.done).toBe(false);
    goal = trackGoal(goal, { ...quietDay(state), guestsServed: 60 });
    expect(goal.done).toBe(true);
  });

  it('average the days for a happiness goal', () => {
    const state = newGame(1);
    const index = GOALS.findIndex((g) => g.kind === 'happiness');
    let goal = startGoal(index);
    goal = trackGoal(goal, { ...quietDay(state), averageSatisfaction: 50 });
    goal = trackGoal(goal, { ...quietDay(state), averageSatisfaction: 70 });
    expect(goalProgress(goal)).toBe(60);
    expect(goal.done).toBe(true);
  });

  it('pick a different goal each week', () => {
    const rng = createRng(2);
    for (let previous = 0; previous < GOALS.length; previous++) {
      expect(nextGoal(rng, previous).index).not.toBe(previous);
    }
  });

  it('pay the reward on the day the goal is done, once', () => {
    // The same day played twice: once finishing the goal, once not.
    const almostDone = { ...newGame(3), goal: { ...startGoal(FIRST_GOAL), total: GOALS[FIRST_GOAL].target - 1 } };
    const notClose = { ...newGame(3), goal: startGoal(FIRST_GOAL) };
    const finished = playDay(almostDone);
    expect(finished.summary.goalCompleted).toEqual({
      text: 'Serve 250 guests this week',
      reward: GOALS[FIRST_GOAL].reward,
    });
    expect(finished.state.cash - playDay(notClose).state.cash).toBeCloseTo(GOALS[FIRST_GOAL].reward);
    expect(playDay(finished.state).summary.goalCompleted).toBeNull();
  });

  it('bring a new goal every Monday', () => {
    let state = newGame(4);
    for (let day = 0; day < 6; day++) state = playDay(state).state;
    const sundayGoal = state.goal.index;
    state = playDay(state).state; // Sunday closes; Monday begins
    expect(state.goal.index).not.toBe(sundayGoal);
    expect(state.goal.total).toBe(0);
    expect(state.news.some((n) => n.title.startsWith('Mewa'))).toBe(true);
  });
});

describe('the Golden Neptune', () => {
  it('is awarded on the last day of the Fair, every summer', () => {
    const LAST_DAY = balance.calendar.seasonLengthDays - 1;
    expect(isNeptuneDay(LAST_DAY)).toBe(true);
    expect(isNeptuneDay(LAST_DAY - 1)).toBe(false);
    expect(isNeptuneDay(LAST_DAY + 365)).toBe(true);
  });

  it('goes to the best Neptune score', () => {
    const state = newGame(5);
    const season = {
      ratings: { player: { total: 70 * 10, count: 10 }, nonnaRosa: { total: 60 * 10, count: 10 } },
      fairGuests: { player: 300, nonnaRosa: 100 },
    };
    const result = neptuneResult(season, state.restaurants);
    expect(result.scores[0].id).toBe('player');
    expect(result.playerWon).toBe(true);
    expect(result.scores[0].score).toBeCloseTo(0.6 * 70 + 0.4 * 75);
    expect(result.scores).toHaveLength(5);
  });

  it('is announced at the end of the Fair and starts a fresh season tally', () => {
    const state = { ...newGame(6), day: balance.calendar.seasonLengthDays - 1 };
    const { state: next, summary } = playDay(state);
    expect(summary.neptune).not.toBeNull();
    expect(next.season).toEqual({ ratings: {}, fairGuests: {} });
    expect(next.trophies).toBe(summary.neptune!.playerWon ? 1 : 0);
    expect(playDay(next).summary.neptune).toBeNull();
  });
});
