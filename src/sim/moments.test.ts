import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { MOMENT_IDS, MOMENTS, type MomentId } from '../data/moments';
import { weightToday } from './moments';
import { minuteOfDay } from './clock';
import { floorView, seat } from './day';
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
  it('come one to four times a day, at random times between lunch and the evening, never on top of each other', () => {
    const counts = new Set<number>();
    for (let seed = 1; seed <= 40; seed++) {
      const { slots } = openRestaurant(newGame(seed)).moments;
      counts.add(slots.length);
      expect(slots.length).toBeGreaterThanOrEqual(balance.moments.perDay.min);
      expect(slots.length).toBeLessThanOrEqual(balance.moments.perDay.max);
      slots.forEach((minute, i) => {
        expect(minute).toBeGreaterThanOrEqual(balance.moments.firstMinute);
        expect(minute).toBeLessThanOrEqual(balance.moments.lastMinute);
        if (i > 0) expect(minute - slots[i - 1]).toBeGreaterThanOrEqual(balance.moments.minGapMinutes);
      });
    }
    // Quiet days and busy days both happen.
    expect(counts.size).toBeGreaterThan(2);
  });

  it('come back less often if they were seen in the last few days, and Wałęsa only every few weeks', () => {
    const today = (momentsSeen: GameState['momentsSeen']) => openRestaurant({ ...newGame(1), day: 30, momentsSeen }).moments;
    expect(weightToday(today({ busker: 29 }), 'busker')).toBeLessThan(weightToday(today({}), 'busker'));
    expect(weightToday(today({ busker: 20 }), 'busker')).toBe(MOMENTS.busker.weight);
    expect(weightToday(today({ walesa: 20 }), 'walesa')).toBe(0);
    expect(weightToday(today({ walesa: 1 }), 'walesa')).toBe(MOMENTS.walesa.weight);
  });

  it('are remembered at the end of the day', () => {
    const state = newGame(3);
    const open = playDay(state, 1);
    const { state: next } = closeDay(state, open);
    for (const { id } of open.moments.results) expect(next.momentsSeen[id]).toBe(state.day);
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

  it('never change who comes in or what they order, when the player says a "no" that does nothing', () => {
    // Days where every card's "no" changes nothing play out exactly as if no card had come.
    let checked = 0;
    for (let seed = 1; seed <= 12; seed++) {
      const state = newGame(seed);
      const watched = openRestaurant(state);
      while (!watched.progress.done) playTick(watched);
      const declined = playDay(state, 1);
      const harmless = declined.moments.results.every((r) => Object.keys(MOMENTS[r.id].choices[1].effect).length === 1);
      if (!harmless || declined.moments.results.length === 0) continue;
      checked++;
      expect(declined.progress.outcomes).toEqual(watched.progress.outcomes);
    }
    expect(checked).toBeGreaterThan(2);
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
    const until = floor.closed!.until;
    expect(until).toBe(12 * 60 + 45);
    playUntil(open, until);
    expect(floor.visits.filter((v) => v.seatedAt > 12 * 60)).toEqual([]);
    playUntil(open, until + 10);
    expect(floor.visits).not.toContain(group);
  });

  it('the merry group shows up in the restaurant view with its shots', () => {
    const open = openRestaurant(newGame(13));
    show(open, 'merryTourists');
    answerTheMoment(open, 0);
    const table = floorView(open.progress, 0).tables.find((t) => t !== null);
    expect(table?.visitor).toBe('merry');
  });

  it('the Brazilian couple tip and write a five-star review', () => {
    const state = newGame(14);
    const open = openRestaurant(state);
    show(open, 'brazilianCouple');
    const result = answerTheMoment(open, 0);
    expect(result?.cash).toBe(50);
    expect(result?.review?.stars).toBe(5);
    while (!open.progress.done) playTick(open);
    expect(closeDay(state, open).summary.reviews).toContainEqual(result!.review);
  });

  it('herring and Babcia make the food better for the rest of the day', () => {
    const open = openRestaurant(newGame(15));
    show(open, 'herring');
    answerTheMoment(open, 0);
    expect(open.progress.floors[0].qualityBonus).toBe(MOMENTS.herring.choices[0].effect.qualityBoost);
  });

  it('a waiter who runs after a guest is gone for a while, then comes back', () => {
    const open = openRestaurant(newGame(16));
    playUntil(open, 12 * 60);
    const waiters = player(open).waiters.length;
    show(open, 'dineAndDash');
    answerTheMoment(open, 0);
    expect(player(open).waiters).toHaveLength(waiters - 1);
    playUntil(open, 12 * 60 + 15);
    expect(player(open).waiters).toHaveLength(waiters);
  });

  it('Lech Wałęsa: a big tip, nobody else gets in for three hours, and locals love you afterwards', () => {
    const open = openRestaurant(newGame(17));
    playUntil(open, 12 * 60);
    const floor = open.progress.floors[0];
    show(open, 'walesa');
    const result = answerTheMoment(open, 0);
    expect(result?.cash).toBe(2500);
    const visit = floor.visits.find((v) => v.visitor === 'walesa')!;
    expect(visit.party.size).toBe(4);
    expect(floor.closed).toEqual({ until: 15 * 60, everyone: true });
    // Even guests who booked are kept out...
    const booked = { group: 'tourists' as const, size: 2, origin: player(open).location, arrivalMinute: 13 * 60, bookedAt: 'player' };
    seat(open.rng, open.progress, 0, booked, 13 * 60);
    expect(floor.visits.some((v) => v.party === booked)).toBe(false);
    // ...except Pan Cytrynówka, whom everybody knows.
    const regular = { ...booked, group: 'locals' as const, size: 1, regular: true };
    seat(open.rng, open.progress, 0, regular, 13 * 60);
    expect(floor.visits.some((v) => v.party === regular)).toBe(true);
    playUntil(open, 15 * 60 - 5);
    const before = player(open).reputation.locals;
    playUntil(open, 15 * 60 + 5);
    expect(floor.visits).not.toContain(visit);
    expect(player(open).reputation.locals).toBeGreaterThan(before * 1.09);
  });

  it('special guests leave by closing time at the latest', () => {
    const open = openRestaurant(newGame(18));
    playUntil(open, 20 * 60);
    show(open, 'walesa');
    answerTheMoment(open, 0);
    expect(open.progress.floors[0].visits.find((v) => v.visitor)?.leaveAt).toBe(22 * 60);
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
