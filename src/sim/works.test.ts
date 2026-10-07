import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { RIVAL_IDS } from '../data/rivals';
import { afterMove, buildWork, workCost, workUnavailableReason } from './actions';
import { minuteOfDay } from './clock';
import { counterPlaces, floorView, moveParty, seat, startDay, stepDay, type DayInProgress } from './day';
import { ORDINARY_DAY } from './events';
import { newGame, playerOf, restingFloor } from './game';
import { createRng } from './rng';
import { createPlayerRestaurant, createRivalRestaurant } from './setup';
import type { BuildingWorkId } from '../data/works';
import type { Party, Staff } from './types';

const staff: Staff = { skill: 3, speed: 3, look: 1 };
const menu: MenuDish[] = [{ template: 'pierogi', variant: 'ruskie', price: 36 }];

/** A quiet day (nobody walks in by themselves) with these building works and this many tables. */
function quietDay(works: BuildingWorkId[], tables = 2): DayInProgress {
  const player = { ...createPlayerRestaurant('Test Kitchen', menu, [staff], [staff]), tables, works };
  const progress = startDay(2, [player, ...RIVAL_IDS.map(createRivalRestaurant)], { ...ORDINARY_DAY, traffic: 0 });
  while (minuteOfDay(progress.tick) < 12 * 60) stepDay(createRng(1), progress);
  return progress;
}

const party = (size: number): Party => ({ group: 'students', size, origin: 'ogarna', arrivalMinute: 12 * 60 });

describe('building works', () => {
  it('are bought once, ready the next morning, and stay behind when moving', () => {
    const state = { ...newGame(5), cash: 50_000 };
    const built = buildWork(state, 'counter');
    expect(playerOf(built).works).toEqual(['counter']);
    expect(built.cash).toBe(state.cash - workCost('counter'));
    expect(workUnavailableReason(built, 'counter')).toBe('Already done');
    expect(workUnavailableReason({ ...state, cash: 100 }, 'toilet')).not.toBeNull();
    expect(afterMove(built, 'dluga').works).toEqual([]);
    expect(restingFloor(built).tables).toHaveLength(playerOf(built).tables + balance.works.counterPlaces);
  });

  it('seat someone on their own or a pair at the bar counter, after every table', () => {
    const progress = quietDay(['counter']);
    const floor = progress.floors[0];
    expect(counterPlaces(progress.restaurants[0])).toBe(balance.works.counterPlaces);
    seat(createRng(2), progress, 0, party(2), 12 * 60);
    seat(createRng(2), progress, 0, party(1), 12 * 60);
    expect(floor.freeCounter).toBe(0);
    expect(floor.freeTables).toBe(2);
    const view = floorView(progress, 0);
    expect(view.counterFrom).toBe(2);
    expect(view.tables.slice(2).every((t) => t !== null)).toBe(true);
    // The counter is full now: the next pair takes a table, and three people never sit at the counter.
    seat(createRng(2), progress, 0, party(2), 12 * 60);
    expect(floor.freeTables).toBe(1);
    const fresh = quietDay(['counter']);
    seat(createRng(2), fresh, 0, party(3), 12 * 60);
    expect(fresh.floors[0].freeCounter).toBe(balance.works.counterPlaces);
    expect(fresh.floors[0].freeTables).toBe(1);
  });

  it('free the counter place when the guests leave, and nobody is moved off it', () => {
    const progress = quietDay(['counter']);
    seat(createRng(2), progress, 0, party(2), 12 * 60);
    const visit = progress.floors[0].visits[0];
    expect(visit.counter).toBe(true);
    expect(moveParty(progress, 0, visit.tables[0], 0)).toBeNull();
    while (progress.floors[0].visits.length > 0) stepDay(createRng(3), progress);
    expect(progress.floors[0].freeCounter).toBe(balance.works.counterPlaces);
  });

  it('without a counter, everyone sits at a table as before', () => {
    const progress = quietDay([]);
    seat(createRng(2), progress, 0, party(1), 12 * 60);
    expect(progress.floors[0].freeTables).toBe(1);
    expect(floorView(progress, 0).tables).toHaveLength(2);
  });

  it('make every guest a little happier with a toilet', () => {
    const plain = quietDay([]);
    const toilet = quietDay(['toilet']);
    seat(createRng(2), plain, 0, party(2), 12 * 60);
    seat(createRng(2), toilet, 0, party(2), 12 * 60);
    expect(toilet.floors[0].visits[0].mood - plain.floors[0].visits[0].mood).toBe(balance.works.toiletMood);
  });
});
