import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { WISH_IDS, WISHES } from '../data/wishes';
import { seat, startDay } from './day';
import { closeDay, newGame, openRestaurant, playerOf, playTick } from './game';
import { dishFits } from './menu';
import { createRng } from './rng';

const pierogi = (variant: string): MenuDish => ({ template: 'pierogi', variant, price: 36 });

describe('wishes', () => {
  it('know what counts: an extra, a variant, or any one of several', () => {
    expect(dishFits({ ...pierogi('ruskie'), extras: ['dill'] }, WISHES.dill.want)).toBe(true);
    expect(dishFits(pierogi('ruskie'), WISHES.dill.want)).toBe(false);
    expect(dishFits(pierogi('mushroomCabbage'), WISHES.mushrooms.want)).toBe(true);
    expect(dishFits({ ...pierogi('meat'), extras: ['chanterelles'] }, WISHES.mushrooms.want)).toBe(true);
    expect(dishFits(pierogi('meat'), WISHES.mushrooms.want)).toBe(false);
    expect(dishFits(pierogi('ruskie'), WISHES.noMeat.want)).toBe(true);
    for (const id of WISH_IDS) expect(WISHES[id].groups.length, id).toBeGreaterThan(0);
  });

  it('come with some walk-ins to the player’s restaurant, and change their mood', () => {
    const player = playerOf(newGame(1));
    const progress = startDay(2, [player]);
    for (let i = 0; i < 400; i++) {
      seat(createRng(i), progress, 0, { group: 'locals', size: 1, origin: player.location, arrivalMinute: 700 }, 700);
      // Make room for the next one.
      progress.floors[0].freeTables = 1;
    }
    const wished = progress.floors[0].visits.filter((v) => v.walkInWish);
    expect(wished.length / 400).toBeCloseTo(balance.wishes.chance, 1);
    for (const visit of wished) {
      expect(WISHES[visit.walkInWish!.id].groups).toContain('locals');
      expect(visit.mood).toBe(visit.walkInWish!.met ? balance.wishes.metMood : balance.wishes.missedMood);
    }
  });

  it('are tallied for the day report, with what was missing', () => {
    const state = newGame(2);
    const open = openRestaurant(state);
    while (!open.progress.done) playTick(open);
    const { summary } = closeDay(state, open);
    const wished = open.progress.outcomes.filter((o) => o.restaurant === 'player' && o.wish);
    expect(summary.wishes.asked).toBe(wished.length);
    expect(summary.wishes.granted).toBe(wished.filter((o) => o.wish!.met).length);
    expect(summary.wishes.missing.reduce((sum, m) => sum + m.count, 0)).toBe(summary.wishes.asked - summary.wishes.granted);
  });
});
