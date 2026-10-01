import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { GROUPS } from '../data/groups';
import { minuteOfDay } from './clock';
import { floorView } from './day';
import { apologiesLeft, closeDay, drinkCost, helpGuests, newGame, openRestaurant, playTick, type OpenDay } from './game';

/** A day with a party of four sitting at table 0, waiting for their food. */
function waitingTable(): OpenDay {
  const open = openRestaurant(newGame(21));
  const player = open.progress.restaurants[0];
  expect(open.progress.floors[0].visits).toHaveLength(0);
  open.progress.floors[0].visits.push({
    party: { group: 'tourists', size: 4, origin: player.location, arrivalMinute: 660 },
    tablesUsed: 1,
    tables: [0],
    order: player.menu.slice(0, 2),
    seatedAt: 660,
    orderedAt: 665,
    readyAt: null,
    skipped: false,
    quality: 0,
    eating: false,
    leaveAt: 0,
    satisfaction: null,
    mood: 0,
    extraPatience: 0,
  });
  open.progress.floors[0].freeTables -= 1;
  return open;
}

describe('helping a waiting table', () => {
  it('a free drink buys them patience and costs a little for each guest', () => {
    const open = waitingTable();
    expect(drinkCost(open, 0)).toBe(4 * balance.help.drinkCostPerGuest);
    const before = floorView(open.progress, 0).tables[0]!;
    expect(helpGuests(open, 0, 'drink')).toBe(true);
    const visit = open.progress.floors[0].visits[0];
    expect(visit.extraPatience).toBe(balance.help.drinkPatienceMinutes);
    expect(visit.mood).toBe(balance.help.drinkMood);
    expect(open.help).toEqual({ drinks: 1, apologies: 0, cash: -4 * balance.help.drinkCostPerGuest });
    // Only once per party; and the view shows it.
    expect(helpGuests(open, 0, 'drink')).toBe(false);
    expect(drinkCost(open, 0)).toBeNull();
    expect(floorView(open.progress, 0).tables[0]!.drink).toBe(true);
    expect(before.drink).toBe(false);
  });

  it('a drink means they wait longer before walking out', () => {
    const patience = GROUPS.tourists.patienceMinutes;
    const walkoutMinute = (drink: boolean) => {
      const open = waitingTable();
      // No chef, so the food never comes.
      open.progress.floors[0].chefFreeAt = [99999];
      if (drink) helpGuests(open, 0, 'drink');
      while (open.progress.floors[0].visits.length > 0) playTick(open);
      return minuteOfDay(open.progress.tick - 1);
    };
    expect(walkoutMinute(false)).toBeGreaterThanOrEqual(660 + patience);
    expect(walkoutMinute(true) - walkoutMinute(false)).toBeGreaterThanOrEqual(balance.help.drinkPatienceMinutes - 5);
  });

  it('the chef’s apology puts their order first, a few times a day', () => {
    const open = waitingTable();
    const floor = open.progress.floors[0];
    const ours = floor.visits[0];
    // Someone else ordered earlier and is ahead in the queue.
    const earlier = { ...ours, tables: [1], orderedAt: 661, party: { ...ours.party } };
    floor.visits.push(earlier);
    floor.chefFreeAt = floor.chefFreeAt.map(() => 99999);
    playTick(open);
    playTick(open);
    expect(floor.queue[0]).toBe(earlier);
    helpGuests(open, 0, 'apology');
    playTick(open);
    expect(floor.queue[0]).toBe(ours);
    expect(ours.mood).toBe(balance.help.apologyMood);
    expect(apologiesLeft(open)).toBe(balance.help.apologiesPerDay - 1);
    open.help.apologies = balance.help.apologiesPerDay;
    expect(helpGuests(open, 1, 'apology')).toBe(false);
  });

  it('nobody to help at an empty table or one already eating', () => {
    const open = waitingTable();
    expect(helpGuests(open, 3, 'drink')).toBe(false);
    open.progress.floors[0].visits[0].eating = true;
    expect(helpGuests(open, 0, 'drink')).toBe(false);
  });

  it('free drinks show up in the day’s money', () => {
    const state = newGame(22);
    const open = waitingTable();
    helpGuests(open, 0, 'drink');
    while (!open.progress.done) playTick(open);
    const { summary } = closeDay(state, open);
    expect(summary.help.drinks).toBe(1);
    expect(summary.momentsCash).toBe(open.help.cash + open.moments.cash);
  });
});
