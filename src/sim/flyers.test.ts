import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { closeDay, flyerArrives, handFlyer, newGame, openRestaurant, playTick, type OpenDay } from './game';
import { flyerChance } from './flyers';
import { minuteOfDay } from './clock';

/** Plays the day without any choice cards, up to the given time. */
function playUntil(open: OpenDay, minute: number): void {
  while (minuteOfDay(open.progress.tick) < minute) {
    open.moments.slots = [];
    playTick(open);
  }
}

describe('flyers for people walking past', () => {
  it('come a few a day, and everyone who takes one has heard of the place', () => {
    const open = openRestaurant(newGame(1));
    expect(open.flyers.left).toBe(balance.flyers.perDay);
    const before = open.progress.restaurants[0].awareness.students;
    const comes = handFlyer(open, 'students');
    expect(typeof comes).toBe('boolean');
    expect(open.flyers.left).toBe(balance.flyers.perDay - 1);
    expect(open.progress.restaurants[0].awareness.students).toBeCloseTo(before + balance.flyers.awareness);
  });

  it('run out, and none are handed out once the day is over', () => {
    const open = openRestaurant(newGame(1));
    for (let i = 0; i < balance.flyers.perDay; i++) expect(handFlyer(open, 'tourists')).not.toBeNull();
    expect(handFlyer(open, 'tourists')).toBeNull();
    const late = openRestaurant(newGame(1));
    while (!late.progress.done) {
      late.moments.slots = [];
      playTick(late);
    }
    expect(handFlyer(late, 'tourists')).toBeNull();
  });

  it('bring people in more often the better their group likes the place', () => {
    const open = openRestaurant(newGame(1));
    const reputation = open.progress.restaurants[0].reputation;
    reputation.foodies = 0;
    const unknown = flyerChance(open.progress, 'foodies');
    reputation.foodies = 100;
    expect(flyerChance(open.progress, 'foodies')).toBeCloseTo(unknown + balance.flyers.reputationChance);
  });

  it('bring in a party of that group when they reach the door, counted in the day report', () => {
    const state = newGame(2);
    const open = openRestaurant(state);
    playUntil(open, 11 * 60 + 30);
    const visits = open.progress.floors[0].visits.length;
    const waiting = open.progress.floors[0].door.length;
    flyerArrives(open, 'locals');
    const floor = open.progress.floors[0];
    expect(floor.visits.length + floor.door.length).toBe(visits + waiting + 1);
    const newcomers = [...floor.visits.map((v) => v.party), ...floor.door.map((w) => w.party)].at(-1)!;
    expect(newcomers.group).toBe('locals');
    expect(open.flyers.parties).toBe(1);
    expect(open.flyers.guests).toBe(newcomers.size);

    handFlyer(open, 'students');
    while (!open.progress.done) {
      open.moments.slots = [];
      playTick(open);
    }
    const { summary } = closeDay(state, open);
    expect(summary.flyers).toEqual({ handedOut: 1, parties: 1, guests: newcomers.size });
  });

  it('don’t count people who find every table taken and the queue full', () => {
    const open = openRestaurant(newGame(3));
    playUntil(open, 12 * 60);
    const floor = open.progress.floors[0];
    floor.freeTables = 0;
    while (floor.door.length < balance.service.doorQueueMax) floor.door.push({ party: { group: 'tourists', size: 2, origin: 'ogarna', arrivalMinute: 0 }, since: 12 * 60 });
    flyerArrives(open, 'students');
    expect(open.flyers.parties).toBe(0);
  });
});
