import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { MOMENT_IDS, MOMENTS, type MomentId } from '../data/moments';
import { minuteOfDay } from './clock';
import { specialCandidate } from './staff';
import {
  answerTheMoment,
  closeDay,
  momentDue,
  newGame,
  openRestaurant,
  playTick,
  type GameState,
  type OpenDay,
} from './game';

/** Plays the day without any choice cards, up to the given time. */
function playUntil(open: OpenDay, minute: number): void {
  while (minuteOfDay(open.progress.tick) < minute) playTick(open);
}

/** Plays the whole day, answering every card the same way. */
function playDay(state: GameState, answer: 0 | 1): OpenDay {
  const open = openRestaurant(state);
  while (!open.progress.done) {
    if (momentDue(open)) answerTheMoment(open, answer);
    playTick(open);
  }
  return open;
}

/** Puts a card on screen right now, as if it had just come up. */
function show(open: OpenDay, id: MomentId, table: number | null = null): void {
  open.moments.pending = { id, minute: minuteOfDay(open.progress.tick), table };
}

const player = (open: OpenDay) => open.progress.restaurants[0];

describe('choice cards', () => {
  it('come two or three times a day, between lunch and the evening', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const { slots } = openRestaurant(newGame(seed)).moments;
      expect(slots.length).toBeGreaterThanOrEqual(balance.moments.perDay.min);
      expect(slots.length).toBeLessThanOrEqual(balance.moments.perDay.max);
      for (const minute of slots) {
        expect(minute).toBeGreaterThanOrEqual(balance.moments.firstMinute);
        expect(minute).toBeLessThanOrEqual(balance.moments.lastMinute);
      }
      expect([...slots].sort((a, b) => a - b)).toEqual(slots);
    }
  });

  it('are the same every time the same day is played', () => {
    const a = playDay(newGame(3), 0).moments.results;
    const b = playDay(newGame(3), 0).moments.results;
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('stop the clock until they are answered', () => {
    const open = openRestaurant(newGame(4));
    while (!momentDue(open)) playTick(open);
    const tick = open.progress.tick;
    expect(momentDue(open)).toBe(true);
    answerTheMoment(open, 1);
    expect(open.moments.pending).toBeNull();
    expect(open.progress.tick).toBe(tick);
  });

  it('never change who comes in or what they order, when the player says no', () => {
    // On a plain April day, every "no" answer leaves the day as it was.
    const state = newGame(5);
    const watched = openRestaurant(state);
    while (!watched.progress.done) playTick(watched);
    const declined = playDay(state, 1);
    expect(declined.moments.results.length).toBeGreaterThan(0);
    expect(declined.progress.outcomes).toEqual(watched.progress.outcomes);
  });

  it('each have two answers, and every answer says what happened', () => {
    for (const id of MOMENT_IDS) {
      const moment = MOMENTS[id];
      expect(moment.choices).toHaveLength(2);
      for (const choice of moment.choices) {
        expect(choice.label.length).toBeGreaterThan(0);
        expect(choice.effect.result.length).toBeGreaterThan(0);
        if (choice.effect.chance !== undefined) expect(choice.effect.otherwise?.result).toBeTruthy();
      }
    }
  });

  it('count in the day’s profit and appear in the report', () => {
    const state = newGame(6);
    const open = openRestaurant(state);
    playUntil(open, 14 * 60);
    show(open, 'blogger');
    const result = answerTheMoment(open, 0);
    expect(result?.cash).toBe(MOMENTS.blogger.choices[0].effect.cash);
    while (!open.progress.done) playTick(open);
    const { summary } = closeDay(state, open);
    expect(summary.momentsCash).toBe(result!.cash);
    expect(summary.moments).toEqual([result]);
    expect(summary.profit).toBeCloseTo(
      summary.revenue - summary.ingredientCost - summary.wages - summary.rent - summary.utilities + result!.cash,
    );
  });
});

describe('what the answers do', () => {
  it('the blogger spreads the word among foodies', () => {
    const open = openRestaurant(newGame(7));
    const before = player(open).awareness.foodies;
    show(open, 'blogger');
    answerTheMoment(open, 0);
    expect(player(open).awareness.foodies).toBeGreaterThan(before);
  });

  it('the tour group comes in when you say yes', () => {
    const open = openRestaurant(newGame(8));
    playUntil(open, 11 * 60 + 15);
    const parties = open.progress.floors[0].visits.length;
    show(open, 'tourGroup');
    answerTheMoment(open, 0);
    const visits = open.progress.floors[0].visits;
    expect(visits).toHaveLength(parties + 1);
    expect(visits[visits.length - 1].party).toMatchObject({ group: 'tourists', size: 6 });
  });

  it('a friend covers for Adrian, at noon on a day he doesn’t turn up', () => {
    const state = newGame(9);
    const team = [...state.team, specialCandidate('adrian', 99)];
    // Find a morning when Adrian stays in bed.
    let open = openRestaurant({ ...state, team });
    for (let seed = 1; open.absent.length === 0; seed++) open = openRestaurant({ ...state, team, rng: { s: seed } });
    const waiters = player(open).waiters.length;
    while (!momentDue(open)) playTick(open);
    expect(open.moments.pending?.id).toBe('adrianText');
    expect(open.moments.pending?.minute).toBe(12 * 60);
    answerTheMoment(open, 0);
    expect(player(open).waiters).toHaveLength(waiters + 1);
  });

  it('the round on the house costs more the fuller the room', () => {
    const open = openRestaurant(newGame(10));
    playUntil(open, 13 * 60);
    show(open, 'tourGroup');
    answerTheMoment(open, 0);
    const guests = open.progress.floors[0].visits.reduce((sum, v) => sum + v.party.size, 0);
    show(open, 'regularsRound');
    const result = answerTheMoment(open, 0);
    expect(result?.cash).toBe(guests * MOMENTS.regularsRound.choices[0].effect.cashPerGuest!);
  });

  it('cheering up the room makes the waiting guests happier', () => {
    const open = openRestaurant(newGame(11));
    playUntil(open, 13 * 60);
    show(open, 'tourGroup');
    answerTheMoment(open, 0);
    show(open, 'stoLat');
    answerTheMoment(open, 0);
    const waiting = open.progress.floors[0].visits.filter((v) => !v.eating);
    expect(waiting.length).toBeGreaterThan(0);
    for (const visit of waiting) expect(visit.mood).toBe(MOMENTS.stoLat.choices[0].effect.mood!.amount);
  });

  it('the merry group tips well, but keeps new guests away while they’re in', () => {
    const open = openRestaurant(newGame(13));
    playUntil(open, 12 * 60);
    const floor = open.progress.floors[0];
    const before = floor.visits.length;
    show(open, 'merryTourists');
    const result = answerTheMoment(open, 0);
    expect(result?.cash).toBe(500);
    const group = floor.visits[before];
    expect(group.party).toMatchObject({ group: 'tourists', size: 4 });
    expect(group.order).toEqual([]);
    // Nobody new sits down until they leave, and they don't stay for ever.
    const until = floor.closedUntil;
    expect(until).toBe(12 * 60 + 45);
    playUntil(open, until);
    expect(floor.visits.filter((v) => v.seatedAt > 12 * 60)).toEqual([]);
    expect(open.progress.outcomes.some((o) => o.restaurant === 'player' && o.kind === 'noTable')).toBe(true);
    playUntil(open, until + 10);
    expect(floor.visits).not.toContain(group);
  });

  it('a shower sends the terrace guests inside, if there’s room', () => {
    const june = { ...newGame(12), day: 62, weather: 'cloudy' as const, terracePermitUntilDay: 200 };
    const open = openRestaurant(june);
    const inside = player(open).tables;
    // Sit someone on the terrace, with the room empty.
    open.progress.floors[0].visits = [];
    open.progress.floors[0].freeTables = inside + player(open).terraceTables;
    show(open, 'tourGroup');
    answerTheMoment(open, 0);
    const party = open.progress.floors[0].visits[0];
    party.tables = [inside, inside + 1];
    show(open, 'shower');
    answerTheMoment(open, 0);
    expect(party.tables.every((t) => t < inside)).toBe(true);
  });
});
