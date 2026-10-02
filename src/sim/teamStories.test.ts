import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { SPECIAL_STAFF } from '../data/personal';
import { TEAM_BEATS } from '../data/teamStories';
import { hire, toggleCourse, toggleDayOff } from './actions';
import { closeDay, newGame, openRestaurant, playTick, type GameState } from './game';
import { createRng } from './rng';
import { moraleAfterDay, specialCandidate } from './staff';
import { settleWishes, storyOf, teamMoment, teamNews } from './teamStories';

const kacper = (state: GameState) => state.team.find((p) => p.starter === 'kacper')!;
const krystyna = (state: GameState) => state.team.find((p) => p.starter === 'krystyna')!;

/** A game with a second waiter, so Kacper can have a day off. */
function twoWaiters(): GameState {
  const state = newGame(3);
  return hire(state, state.candidates.find((c) => c.role === 'waiter')!.id);
}

describe('team stories', () => {
  it('know who has a story: the team you start with, Tomek and Adrian', () => {
    const state = newGame(1);
    expect(state.team.map(storyOf)).toEqual(['krystyna', 'kacper']);
    expect(storyOf(specialCandidate('tomek', 9))).toBe('tomek');
    expect(storyOf(state.candidates[0])).toBeNull();
  });

  it('are in the morning news on their day, counted from when someone joined', () => {
    const state = newGame(1);
    const beat = TEAM_BEATS.find((b) => b.who === 'kacper' && b.news)!;
    expect(teamNews(state.team, beat.day)).toContainEqual({ title: 'Kacper', text: beat.news });
    expect(teamNews(state.team, beat.day + 1).map((n) => n.text)).not.toContain(beat.news);
    // Tomek's start when he joins.
    const tomek = { ...specialCandidate('tomek', 9), since: 10 };
    const first = TEAM_BEATS.find((b) => b.who === 'tomek' && b.news)!;
    expect(teamNews([tomek], 10 + first.day).map((n) => n.text)).toEqual([first.news]);
  });

  it('let Kacper pass his exam with the day off, and the team share his cake', () => {
    const beat = TEAM_BEATS.find((b) => b.who === 'kacper' && b.wishDayOff)!;
    const wish = beat.wishDayOff!;
    const state = toggleDayOff(twoWaiters(), kacper(twoWaiters()).id, beat.day);
    const granted = settleWishes(state.team, beat.day);
    expect(granted.news).toEqual([wish.granted]);
    expect(granted.team.find((p) => p.starter === 'kacper')!.morale).toBe(kacper(state).morale + wish.grantedMorale);
    expect(granted.team.find((p) => p.starter === 'krystyna')!.morale).toBe(krystyna(state).morale + (wish.teamMorale ?? 0));

    const refused = settleWishes(twoWaiters().team, beat.day);
    expect(refused.news).toEqual([wish.refused]);
    expect(refused.team.find((p) => p.starter === 'kacper')!.morale).toBe(kacper(twoWaiters()).morale + wish.refusedMorale);
  });

  it('settle Pani Krystyna’s Sunday at the end of the day, before her day off is cleared', () => {
    const beat = TEAM_BEATS.find((b) => b.who === 'krystyna' && b.wishDayOff)!;
    let state = newGame(5);
    state = hire(state, state.candidates.find((c) => c.role === 'chef')!.id);
    state = toggleDayOff({ ...state, day: beat.day }, krystyna(state).id, beat.day);
    const open = openRestaurant(state);
    while (!open.progress.done) {
      open.moments.slots = [];
      playTick(open);
    }
    const { summary } = closeDay(state, open);
    expect(summary.staffNews).toContain(beat.wishDayOff!.granted);
  });

  it('end Tomek’s mishaps once a skill course has made him better', () => {
    const tomek = { ...specialCandidate('tomek', 9), since: 0 };
    const state = { ...twoWaiters(), team: [...twoWaiters().team, tomek] };
    const booked = toggleCourse({ ...state, cash: 100_000 }, tomek.id, 'skill', state.day);
    const after = moraleAfterDay(booked.team, state.day, { ids: booked.team.map((p) => p.id), sick: [] });
    expect(after.news).toContain(SPECIAL_STAFF.tomek.trainedNews);
    const trained = after.team.find((p) => p.special === 'tomek')!;
    expect(trained.skill).toBeGreaterThan(SPECIAL_STAFF.tomek.skill);

    // Working with the new skill: no reputation lost, and no mishap in the report.
    const day = { ...state, team: [...state.team.filter((p) => p.special !== 'tomek'), trained] };
    const open = openRestaurant(day);
    while (!open.progress.done) {
      open.moments.slots = [];
      playTick(open);
    }
    const { summary } = closeDay(day, open);
    expect(summary.staffNews.some((line) => line.includes('Reputation −'))).toBe(false);
  });

  it('let Adrian turn up more often while he’s happy at work', () => {
    const state = newGame(7);
    const count = (morale: number) => {
      const team = [...state.team, { ...specialCandidate('adrian', 99), morale }];
      let absent = 0;
      for (let seed = 1; seed <= 200; seed++) absent += openRestaurant({ ...state, team, rng: createRng(seed) }).absent.length;
      return absent;
    };
    expect(count(90)).toBeLessThan(count(60) * 0.75);
  });

  it('bring a small moment now and then for someone who has been there a while', () => {
    const team = newGame(1).team;
    const { settledInDays } = balance.staff.teamMoments;
    let moments = 0;
    for (let seed = 1; seed <= 100; seed++) {
      const result = teamMoment(createRng(seed), team, settledInDays);
      if (!result.news) continue;
      moments++;
      expect(team.some((p) => result.news!.text.includes(p.name))).toBe(true);
    }
    expect(moments).toBeGreaterThan(5);
    expect(moments).toBeLessThan(30);
    // Nobody new gets one in their first days.
    for (let seed = 1; seed <= 50; seed++) expect(teamMoment(createRng(seed), team, settledInDays - 1).news).toBeNull();
  });
});
