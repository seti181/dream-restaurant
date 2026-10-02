import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { dayOffUnavailableReason, hire, toggleDayOff } from './actions';
import { newGame, openRestaurant, teamWages, type GameState } from './game';
import { moodOf, moraleAfterDay, staffOf } from './staff';
import type { Employee } from './types';

const m = balance.staff.morale;

/** A game with a second chef on the team, so either chef can have a day off. */
function twoChefs(): GameState {
  const state = newGame(3);
  const chef = state.candidates.find((c) => c.role === 'chef')!;
  return hire(state, chef.id);
}

const krystyna = (state: GameState) => state.team.find((p) => p.name === 'Pani Krystyna')!;

describe('morale', () => {
  it('reads as in good spirits, fine, tired or worn out', () => {
    expect(moodOf(m.start)).toBe('happy');
    expect(moodOf(m.happyFrom - 1)).toBe('fine');
    expect(moodOf(m.tiredBelow - 1)).toBe('tired');
    expect(moodOf(m.wornOutBelow - 1)).toBe('wornOut');
  });

  it('drops a little with each day’s work (less for cheerful people), and a day off puts it right', () => {
    const team: Employee[] = newGame(1).team.map((p, i) => ({ ...p, morale: 50, trait: i === 0 ? 'calm' : 'cheerful' }));
    const ids = team.map((p) => p.id);
    const worked = moraleAfterDay(team, 4, { ids, sick: [] }).team;
    expect(worked.map((p) => p.morale)).toEqual([50 - m.workDay, 50 - m.cheerfulWorkDay]);

    const rested = moraleAfterDay([{ ...team[0], dayOff: 4 }], 4, { ids, sick: [] });
    expect(rested.team[0].morale).toBe(50 + m.dayOff);
    expect(rested.team[0].dayOff).toBeUndefined();
    expect(rested.news[0]).toContain('day off');

    // A day in bed counts as rest; someone hired during the day starts tomorrow.
    expect(moraleAfterDay(team, 4, { ids, sick: [team[0].id] }).team[0].morale).toBe(50 + m.dayOff);
    expect(moraleAfterDay(team, 4, { ids: [], sick: [] }).team[0].morale).toBe(50);
    // A day off planned for later stays planned.
    expect(moraleAfterDay([{ ...team[0], dayOff: 6 }], 4, { ids, sick: [] }).team[0].dayOff).toBe(6);
  });

  it('says so in the day report when someone gets tired or worn out', () => {
    const person = { ...newGame(1).team[0], trait: 'calm' as const };
    const tired = moraleAfterDay([{ ...person, morale: m.tiredBelow }], 4, { ids: [person.id], sick: [] });
    expect(tired.news[0]).toContain('getting tired');
    const wornOut = moraleAfterDay([{ ...person, morale: m.wornOutBelow }], 4, { ids: [person.id], sick: [] });
    expect(wornOut.news[0]).toContain('worn out');
  });

  it('makes tired people work a little slower, never below 1', () => {
    const [chef] = newGame(1).team;
    const tired = m.tiredBelow - 1;
    expect(staffOf([{ ...chef, skill: 3, speed: 3, morale: tired }], 'chef')[0]).toMatchObject({ skill: 3, speed: 3 - m.tiredSpeedLoss });
    expect(staffOf([{ ...chef, skill: 3, speed: 1, morale: tired }], 'chef')[0]).toMatchObject({ speed: 1 });
    expect(staffOf([{ ...chef, skill: 3, speed: 3, morale: m.tiredBelow }], 'chef')[0]).toMatchObject({ skill: 3, speed: 3 });
  });

  it('never leaves the only chef in bed: they come in, worn out', () => {
    const base = newGame(4);
    const team = base.team.map((p) => ({ ...p, morale: 0 }));
    for (let seed = 1; seed <= 10; seed++) expect(openRestaurant({ ...base, team, rng: { s: seed } }).absent).toEqual([]);
  });

  it('runs down over four weeks without days off, and keeps up with one a week', () => {
    const chef: Employee = { ...newGame(2).team[0], trait: 'calm' };
    let tiredOut = [chef];
    let rested = [chef];
    for (let day = 0; day < 28; day++) {
      const morning = { ids: [chef.id], sick: [] };
      tiredOut = moraleAfterDay(tiredOut, day, morning).team;
      rested = moraleAfterDay(day % 7 === 0 ? [{ ...rested[0], dayOff: day }] : rested, day, morning).team;
    }
    expect(moodOf(tiredOut[0].morale)).toBe('tired');
    expect(rested[0].morale).toBeGreaterThanOrEqual(m.start);
  });

  it('can leave worn-out people in bed some mornings, if someone can cover', () => {
    const base = twoChefs();
    const team = base.team.map((p) => ({ ...p, morale: 0 }));
    let sickDays = 0;
    for (let seed = 1; seed <= 20; seed++) {
      const open = openRestaurant({ ...base, team, rng: { s: seed } });
      sickDays += open.absent.filter((a) => a.sick).length;
    }
    expect(sickDays).toBeGreaterThan(5);
    expect(sickDays).toBeLessThan(35);
  });
});

describe('days off', () => {
  it('can’t take away the last chef or the last waiter', () => {
    const state = newGame(1);
    const [chef, waiter] = state.team;
    expect(dayOffUnavailableReason(state, chef.id, state.day)).toBe('Someone has to cook');
    expect(dayOffUnavailableReason(state, waiter.id, state.day)).toBe('Someone has to serve');
    expect(toggleDayOff(state, chef.id, state.day)).toBe(state);
  });

  it('keeps someone home for the day, paid, and the tap again takes it back', () => {
    const state = twoChefs();
    const chef = krystyna(state);
    const off = toggleDayOff(state, chef.id, state.day);
    expect(krystyna(off).dayOff).toBe(state.day);
    // The other chef can't have the same day off: someone has to cook.
    const other = off.team.find((p) => p.role === 'chef' && p.id !== chef.id)!;
    expect(dayOffUnavailableReason(off, other.id, state.day)).toBe('Someone has to cook');

    const open = openRestaurant(off);
    expect(open.progress.restaurants[0].chefs).toHaveLength(1);
    expect(teamWages(off)).toBe(teamWages(state));

    expect(krystyna(toggleDayOff(off, chef.id, state.day)).dayOff).toBeUndefined();
  });
});
