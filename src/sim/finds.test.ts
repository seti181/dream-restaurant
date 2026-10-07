import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { DECOR } from '../data/decor';
import type { MenuDish } from '../data/dishes';
import { FIND_IDS, FINDS, type FindId } from '../data/finds';
import { decorUnavailableReason } from './actions';
import { closeDay, newGame, openRestaurant, playTick, type GameState } from './game';
import { findNews, NO_FINDS, pairingToTry, pairingWords, rollFind } from './finds';
import { pairingsOf } from './menu';

/** Plays and closes one day from this state. */
function closeOneDay(state: GameState): GameState {
  const open = openRestaurant(state);
  while (!open.progress.done) playTick(open);
  return closeDay(state, open).state;
}

describe('Mewa’s finds', () => {
  it('come now and then from day 3, never two close together, each only once', () => {
    expect(rollFind(1, 1, NO_FINDS)).toBeNull();
    let finds = { ...NO_FINDS };
    const days: number[] = [];
    for (let day = 0; day < 60; day++) {
      const id = rollFind(day * 7919 + 3, day, finds);
      if (!id) continue;
      expect(finds.found).not.toContain(id);
      if (finds.lastDay !== null) expect(day - finds.lastDay).toBeGreaterThan(balance.finds.restDays);
      finds = { found: [...finds.found, id], lastDay: day };
      days.push(day);
    }
    expect(days[0]).toBeGreaterThanOrEqual(balance.finds.firstDay);
    expect(finds.found.length).toBe(FIND_IDS.length);
    expect(rollFind(5, 100, finds)).toBeNull();
  });

  it('turn into what they promise: free decor, more guests tomorrow, money, good spirits', () => {
    const state = newGame(9);
    const at = (id: FindId) => {
      // A state where this find is the only one left, on a day it's bound to come.
      const others = FIND_IDS.filter((f) => f !== id);
      for (let day = 10; day < 400; day++) {
        const next = closeOneDay({ ...state, day, finds: { found: others, lastDay: 0 } });
        if (next.finds.found.includes(id)) return { before: { ...state, day }, next };
      }
      throw new Error('never found');
    };
    const amber = at('amber');
    expect(amber.next.restaurants[0].decor).toContain('amberCase');
    expect(amber.next.news.some((n) => n.title.includes(FINDS.amber.name))).toBe(true);
    const key = at('lostKey');
    expect(key.next.upcoming.some((u) => u.fromDay === key.next.day && u.groups?.locals === balance.finds.groupBoost)).toBe(true);
    const card = at('postcard');
    const moraleOf = (s: GameState) => s.team.reduce((sum, p) => sum + p.morale, 0) / s.team.length;
    // The same day closed with nothing left to find: the postcard is the only difference.
    const without = closeOneDay({ ...card.before, finds: { found: [...FIND_IDS], lastDay: 0 } });
    expect(moraleOf(card.next) - moraleOf(without)).toBeGreaterThan(balance.finds.morale / 2);
  });

  it('a found decor item is never sold in the shop', () => {
    const state = newGame(2);
    expect(DECOR.amberCase.found).toBe(true);
    expect(decorUnavailableReason(state, 'amberCase')).toBe('Only Mewa can find this');
  });

  it('the recipe card names a perfect pairing the menu doesn’t have yet', () => {
    const dish: MenuDish = { template: 'fishSoup', variant: 'classic', price: 34, extras: ['dill'] };
    const pairing = pairingToTry([dish], 4);
    expect(pairing.quality).toBeGreaterThan(0);
    expect(pairingsOf(dish)).not.toContain(pairing);
    expect(pairingWords({ extras: ['dill'], with: { tag: 'seafood' }, quality: 10, comment: '' })).toBe('dill with anything from the sea');
    expect(findNews('recipeCard', [dish], 4).text).toContain('perfect together');
  });
});
