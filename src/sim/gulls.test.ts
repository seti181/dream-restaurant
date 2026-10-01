import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { GULLS } from '../data/gulls';
import { closeDay, newGame, openRestaurant, playTick, shooTheGull, type GameState, type OpenDay } from './game';

/** A sunny June day with the terrace open. */
const terraceDay = (seed: number): GameState => ({ ...newGame(seed), day: 62, weather: 'sunny', terracePermitUntilDay: 200, cash: 1e6 });

/** A day with a party eating at the first terrace table and a gull due right now. */
function gullDue(seed = 31): OpenDay {
  const open = openRestaurant(terraceDay(seed));
  const player = open.progress.restaurants[0];
  const table = player.tables;
  open.progress.floors[0].visits.push({
    party: { group: 'tourists', size: 2, origin: player.location, arrivalMinute: 660 },
    tablesUsed: 1,
    tables: [table],
    order: player.menu.slice(0, 1),
    seatedAt: 660,
    orderedAt: 662,
    readyAt: 665,
    skipped: false,
    quality: 60,
    eating: true,
    leaveAt: 900,
    satisfaction: 70,
    mood: 0,
    extraPatience: 0,
  });
  open.progress.floors[0].freeTables -= 1;
  open.gulls.slots = [660];
  return open;
}

describe('gulls on the terrace', () => {
  it('only come on days the terrace is open', () => {
    expect(openRestaurant(newGame(30)).gulls.slots).toEqual([]);
    const slots = openRestaurant(terraceDay(30)).gulls.slots;
    expect(slots.length).toBeGreaterThanOrEqual(balance.gulls.perDay.min);
    expect(slots.length).toBeLessThanOrEqual(balance.gulls.perDay.max);
  });

  it('land by a terrace table that is eating', () => {
    const open = gullDue();
    playTick(open);
    expect(open.gulls.active?.table).toBe(open.progress.restaurants[0].tables);
    expect(open.gulls.active?.group).toBe('tourists');
  });

  it('steal the plate if nobody shoos them, and the table writes about it', () => {
    const open = gullDue();
    playTick(open);
    const before = open.progress.restaurants[0].reputation.tourists;
    for (let i = 0; i < balance.gulls.windowTicks; i++) playTick(open);
    expect(open.gulls.active).toBeNull();
    expect(open.gulls.stolen).toBe(1);
    expect(open.progress.restaurants[0].reputation.tourists).toBeLessThan(before);
    expect(GULLS.reviews.map((r) => r.text)).toContain(open.gulls.reviews[0].text);
    expect(GULLS.stolen).toContain(open.gulls.last?.text);
  });

  it('fly off when tapped in time, and the guests are pleased', () => {
    const open = gullDue();
    playTick(open);
    const before = open.progress.restaurants[0].reputation.tourists;
    expect(shooTheGull(open)).toBe(true);
    expect(open.gulls.shooed).toBe(1);
    expect(open.progress.restaurants[0].reputation.tourists).toBeGreaterThan(before);
    expect(shooTheGull(open)).toBe(false);
    for (let i = 0; i < balance.gulls.windowTicks + 2; i++) playTick(open);
    expect(open.gulls.stolen).toBe(0);
  });

  it('end up in the day report, with any reviews', () => {
    const state = terraceDay(32);
    const open = gullDue(32);
    playTick(open);
    for (let i = 0; i < balance.gulls.windowTicks; i++) playTick(open);
    while (!open.progress.done) playTick(open);
    const { summary } = closeDay(state, open);
    expect(summary.gulls.stolen).toBeGreaterThanOrEqual(1);
    expect(summary.reviews).toContainEqual(open.gulls.reviews[0]);
  });
});
