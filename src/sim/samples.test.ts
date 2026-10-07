import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { RIVAL_IDS } from '../data/rivals';
import { utility } from './choice';
import { minuteOfDay } from './clock';
import { floorView, startDay, stepDay, type DayInProgress } from './day';
import { ORDINARY_DAY } from './events';
import { closeDay, newGame, openRestaurant, playTick, sendOutSamples } from './game';
import { recipeKey } from './menu';
import { createRng } from './rng';
import { sampleDish, samplesAppeal, samplesUnavailable, startSamples, tasteSamples } from './samples';
import { createPlayerRestaurant, createRivalRestaurant } from './setup';
import type { Party, Staff } from './types';

const waiter: Staff = { skill: 3, speed: 3, look: 2 };
const pierogi: MenuDish = { template: 'pierogi', variant: 'ruskie', price: 36 };
const soup: MenuDish = { template: 'tomatoSoup', variant: 'noodles', price: 18 };

/** A quiet day at Ogarna (nobody walks in by themselves), played until the given minute. */
function dayAt(minute: number, waiters: Staff[] = [waiter, { ...waiter, look: 3 }]): DayInProgress {
  const restaurants = [createPlayerRestaurant('Test Kitchen', [soup, pierogi], [{ skill: 3, speed: 3, look: 1 }], waiters), ...RIVAL_IDS.map(createRivalRestaurant)];
  const progress = startDay(2, restaurants, { ...ORDINARY_DAY, traffic: 0 });
  while (minuteOfDay(progress.tick) < minute) stepDay(createRng(1), progress);
  return progress;
}

const passer = (progress: DayInProgress, origin = progress.restaurants[0].location): Party => ({
  group: 'locals',
  size: 2,
  origin,
  arrivalMinute: minuteOfDay(progress.tick),
});

describe('samples at the door', () => {
  it('offer today’s special, or else the dish the kitchen cooks best', () => {
    const progress = dayAt(15 * 60);
    expect(sampleDish(progress)).toBe(progress.restaurants[0].menu[1]);
    progress.restaurants[0].special = recipeKey(soup);
    expect(sampleDish(progress)).toBe(progress.restaurants[0].menu[0]);
  });

  it('take a waiter off the floor for the hour, once a day', () => {
    const progress = dayAt(15 * 60);
    expect(samplesUnavailable(progress)).toBeNull();
    expect(startSamples(progress)).toBe(true);
    expect(progress.restaurants[0].waiters).toHaveLength(1);
    expect(floorView(progress, 0).samplesWaiter).not.toBeNull();
    expect(startSamples(progress)).toBe(false);
    expect(samplesUnavailable(progress)).toBe('Samples have already been out today.');
    // An hour later the tray is put away and the waiter is back inside.
    while (minuteOfDay(progress.tick) < 15 * 60 + balance.samples.minutes + 10) stepDay(createRng(2), progress);
    expect(progress.restaurants[0].waiters).toHaveLength(2);
    expect(floorView(progress, 0).samplesWaiter).toBeNull();
  });

  it('can be sent out by the only waiter, but not with nobody on the floor', () => {
    const alone = dayAt(15 * 60, [waiter]);
    expect(startSamples(alone)).toBe(true);
    expect(alone.restaurants[0].waiters).toHaveLength(0);
    const nobody = dayAt(15 * 60, []);
    expect(samplesUnavailable(nobody)).toMatch(/Nobody can step out/);
  });

  it('tempt people from the street who walk past, more the better they taste, and nobody else', () => {
    const progress = dayAt(15 * 60);
    const player = progress.restaurants[0];
    const before = utility(player, passer(progress), 10)!;
    startSamples(progress);
    const local = passer(progress);
    expect(samplesAppeal(player, local)).toBeGreaterThan(0);
    expect(utility(player, local, 10)! - before).toBeCloseTo(samplesAppeal(player, local));
    expect(samplesAppeal(player, passer(progress, 'spichrzow'))).toBe(0);
    const tasty = { ...player, samples: { ...player.samples!, quality: 95 } };
    const bland = { ...player, samples: { ...player.samples!, quality: 30 } };
    expect(samplesAppeal(tasty, local)).toBeCloseTo(balance.samples.appeal);
    expect(samplesAppeal(bland, local)).toBeCloseTo(balance.samples.appeal * balance.samples.leastShare);
  });

  it('let everyone who tastes know the place, for a little of the ingredients', () => {
    const progress = dayAt(15 * 60);
    const awareness = progress.restaurants[0].awareness.locals;
    expect(tasteSamples(progress, passer(progress))).toBe(false);
    startSamples(progress);
    expect(tasteSamples(progress, passer(progress))).toBe(true);
    expect(tasteSamples(progress, passer(progress, 'spichrzow'))).toBe(false);
    expect(progress.restaurants[0].awareness.locals).toBeCloseTo(awareness + balance.samples.awareness);
    expect(progress.samples!.tasted).toBe(2);
    expect(progress.samples!.cost).toBeCloseTo(2 * balance.samples.costShare * 8);
  });

  it('last the hour: only so many bites are handed out every few minutes', () => {
    const progress = dayAt(15 * 60);
    startSamples(progress);
    let tasted = 0;
    while (tasteSamples(progress, passer(progress))) tasted = progress.samples!.tasted;
    expect(tasted).toBeGreaterThan(0);
    expect(tasted).toBeLessThan(balance.samples.tray / 4);
  });

  it('reach the streets nearby, and someone who tasted knows the place', () => {
    const progress = dayAt(15 * 60);
    const player = progress.restaurants[0];
    startSamples(progress);
    const fromDluga = passer(progress, 'dluga');
    expect(tasteSamples(progress, fromDluga)).toBe(true);
    expect(fromDluga.tasted).toBe(true);
    // A place nobody's heard of: tasting it makes all the difference.
    const unknown = { ...player, awareness: { ...player.awareness, locals: 0 } };
    const stranger = passer(progress, 'dluga');
    expect(utility(unknown, fromDluga, 10)! - utility(unknown, stranger, 10)!).toBeCloseTo(-Math.log(balance.choice.walkInShare));
  });

  it('end when the tray is empty, and the waiter goes back in', () => {
    const progress = dayAt(15 * 60);
    startSamples(progress);
    // Late in the hour, with the whole tray still to hand out.
    progress.samples!.from -= balance.samples.minutes - 5;
    progress.restaurants[0].samples!.from -= balance.samples.minutes - 5;
    while (progress.samples!.tasted < balance.samples.tray) expect(tasteSamples(progress, passer(progress))).toBe(true);
    expect(progress.samples!.tasted).toBe(balance.samples.tray);
    expect(tasteSamples(progress, passer(progress))).toBe(false);
    stepDay(createRng(4), progress);
    stepDay(createRng(4), progress);
    expect(progress.restaurants[0].waiters).toHaveLength(2);
    expect(floorView(progress, 0).samplesWaiter).toBeNull();
  });

  it('show in the day report, and cost what they cost', () => {
    const state = newGame(4);
    const open = openRestaurant(state);
    while (minuteOfDay(open.progress.tick) < 15 * 60) playTick(open);
    expect(sendOutSamples(open)).toBe(true);
    while (!open.progress.done) playTick(open);
    const { state: next, summary } = closeDay(state, open);
    expect(summary.samples).not.toBeNull();
    expect(summary.samples!.from).toBe(15 * 60 - balance.clock.tickMinutes);
    expect(summary.samples!.tasted).toBeGreaterThan(0);
    expect(summary.samples!.parties).toBeGreaterThanOrEqual(0);
    // The waiter is back on the team tomorrow, and nothing about samples is kept.
    expect(next.restaurants[0].waiters).toHaveLength(state.restaurants[0].waiters.length);
    expect(next.restaurants[0].samples).toBeUndefined();
  });
});
