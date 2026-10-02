import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import { hire, letGo } from './actions';
import { wageOf } from './finance';
import { closeDay, newGame, openRestaurant, playerOf, playTick, teamWages, type GameState } from './game';
import { createRng } from './rng';
import { effectiveLevel, orderQuality } from './service';
import { generateCandidates } from './staff';

const playDay = (state: GameState) => {
  const open = openRestaurant(state);
  while (!open.progress.done) playTick(open);
  return closeDay(state, open).state;
};

describe('job candidates', () => {
  const pool = generateCandidates(createRng(9), 100, new Set());

  it('come in a pool of 3–4 with at least one chef and one waiter', () => {
    expect(pool.length).toBeGreaterThanOrEqual(balance.staff.candidatePool.min);
    expect(pool.length).toBeLessThanOrEqual(balance.staff.candidatePool.max);
    expect(pool.some((p) => p.role === 'chef')).toBe(true);
    expect(pool.some((p) => p.role === 'waiter')).toBe(true);
  });

  it('have levels from 1 to 5, a trait, a fair wage, and chefs have a specialty', () => {
    for (const person of pool) {
      for (const level of [person.skill, person.speed]) {
        expect(level).toBeGreaterThanOrEqual(1);
        expect(level).toBeLessThanOrEqual(5);
      }
      expect(person.trait).toBeDefined();
      expect(person.wage).toBe(wageOf(person.role, person));
      expect(person.specialty !== undefined).toBe(person.role === 'chef');
    }
  });

  it('get unique ids and first names', () => {
    expect(new Set(pool.map((p) => p.id)).size).toBe(pool.length);
    expect(new Set(pool.map((p) => p.name.split(' ')[0])).size).toBe(pool.length);
    expect(pool[0].id).toBe(100);
  });
});

describe('the team', () => {
  it('starts with the starter team mirrored in the restaurant', () => {
    const state = newGame(1);
    expect(playerOf(state).chefs).toHaveLength(state.team.filter((p) => p.role === 'chef').length);
    expect(playerOf(state).waiters).toHaveLength(state.team.filter((p) => p.role === 'waiter').length);
    expect(state.candidates.length).toBeGreaterThan(0);
  });

  it('grows when hiring, and the candidate leaves the pool', () => {
    const state = newGame(2);
    const chef = state.candidates.find((c) => c.role === 'chef')!;
    const after = hire(state, chef.id);
    expect(after.team).toContainEqual({ ...chef, since: state.day });
    expect(after.candidates).not.toContainEqual(chef);
    expect(playerOf(after).chefs).toHaveLength(playerOf(state).chefs.length + 1);
    expect(teamWages(after)).toBe(teamWages(state) + chef.wage);
  });

  it('shrinks when saying goodbye', () => {
    const state = newGame(3);
    const waiter = state.team.find((p) => p.role === 'waiter')!;
    const after = letGo(state, waiter.id);
    expect(after.team).not.toContainEqual(waiter);
    expect(playerOf(after).waiters).toHaveLength(playerOf(state).waiters.length - 1);
  });

  it('ignores unknown people', () => {
    const state = newGame(4);
    expect(hire(state, 9999)).toBe(state);
    expect(letGo(state, 9999)).toBe(state);
  });

  it('meets new candidates every Monday, and only on Mondays', () => {
    let state = newGame(5);
    const firstPool = state.candidates;
    for (let day = 0; day < 6; day++) state = playDay(state); // Monday to Saturday
    expect(state.candidates).toEqual(firstPool);
    state = playDay(state); // Sunday closes; next day is Monday
    expect(state.candidates).not.toEqual(firstPool);
    expect(state.candidates.every((c) => !firstPool.some((old) => old.id === c.id))).toBe(true);
  });
});

describe('traits and specialties', () => {
  it('nudge skill and speed at work', () => {
    const base = { skill: 3, speed: 3 };
    expect(effectiveLevel({ ...base, trait: 'perfectionist' }, 'skill')).toBe(4);
    expect(effectiveLevel({ ...base, trait: 'perfectionist' }, 'speed')).toBe(2);
    expect(effectiveLevel({ ...base, trait: 'speedy' }, 'speed')).toBe(4);
    expect(effectiveLevel({ skill: 1, speed: 1, trait: 'perfectionist' }, 'speed')).toBe(
      balance.staff.minEffectiveLevel,
    );
  });

  it('make a specialist’s own cuisine taste better', () => {
    const pierogi: MenuDish = { template: 'pierogi', variant: 'ruskie', price: 36 };
    const plain = orderQuality([pierogi], { skill: 3, speed: 3 });
    expect(orderQuality([pierogi], { skill: 3, speed: 3, specialty: 'polish' })).toBe(
      plain + balance.kitchen.specialtyBonus,
    );
    expect(orderQuality([pierogi], { skill: 3, speed: 3, specialty: 'italian' })).toBe(plain);
  });
});
