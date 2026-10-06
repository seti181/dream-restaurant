import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { COOK_OFFS } from '../data/cookOffs';
import { GROUP_IDS } from '../data/groups';
import { cookOffEntries, cookOffScore, judgeCookOff, pickCookOffEntry, rivalCookOffScore, rollCookOff, type CookOffState } from './cookOffs';
import { closeDay, newGame, openRestaurant, playerOf, playTick, type GameState } from './game';
import { recipeKey } from './menu';

const WEDNESDAY = 9;
const duel = (changes: Partial<CookOffState> = {}): CookOffState => ({
  rival: 'karczma',
  offeredDay: WEDNESDAY,
  day: WEDNESDAY + 3,
  entry: null,
  declined: false,
  ...changes,
});

describe('cook-off challenges', () => {
  it('come on some Wednesdays from the second week, from a rival whose field the player can enter', () => {
    const game = newGame(1);
    for (let seed = 0; seed < 50; seed++) expect(rollCookOff(seed, 2, game)).toBeNull();
    for (let seed = 0; seed < 50; seed++) expect(rollCookOff(seed, WEDNESDAY + 1, game)).toBeNull();
    const rolls = Array.from({ length: 400 }, (_, seed) => rollCookOff(seed, WEDNESDAY, game)).filter((c) => c !== null);
    expect(rolls.length / 400).toBeCloseTo(balance.cookOffs.chance, 1);
    // The starter menu has soups and mains, but no desserts: Spichlerz waits for another time.
    expect(rolls.every((c) => c!.rival !== 'spichlerz' && c!.day === WEDNESDAY + balance.cookOffs.duelInDays)).toBe(true);
    expect(rolls.every((c) => rollCookOff(1, WEDNESDAY, { ...game, cookOff: c })?.rival !== c!.rival)).toBe(true);
  });

  it('score quality plus value for money: cheaper is better, and counts double at Bar Błyskawica', () => {
    const player = playerOf(newGame(2));
    const [zurek] = cookOffEntries(player, 'karczma');
    const cheaper = { ...zurek, price: zurek.price * 0.8 };
    expect(cookOffScore(player, cheaper, [], 1) - cookOffScore(player, zurek, [], 1)).toBeCloseTo(balance.cookOffs.valuePoints * 0.2);
    expect(cookOffScore(player, cheaper, [], 2) - cookOffScore(player, zurek, [], 2)).toBeCloseTo(balance.cookOffs.valuePoints * 0.4);
  });

  it('take an entry from the menu, or a polite no, until the morning of the duel', () => {
    const game: GameState = { ...newGame(3), day: WEDNESDAY, cookOff: duel() };
    const soup = cookOffEntries(playerOf(game), 'karczma')[0];
    expect(pickCookOffEntry(game, recipeKey(soup)).cookOff?.entry).toBe(recipeKey(soup));
    expect(pickCookOffEntry(game, 'pierogi/ruskie')).toBe(game);
    expect(pickCookOffEntry(game, null).cookOff?.declined).toBe(true);
    expect(pickCookOffEntry({ ...game, day: WEDNESDAY + 4 }, null)).toEqual({ ...game, day: WEDNESDAY + 4 });
  });

  it('are judged with the rival’s signature bonus and a little luck', () => {
    const game = newGame(4);
    const player = playerOf(game);
    const karczma = game.restaurants.find((r) => r.id === 'karczma')!;
    const soup = cookOffEntries(player, 'karczma')[0];
    const theirs = rivalCookOffScore(karczma, 'karczma');
    for (let seed = 0; seed < 50; seed++) {
      const result = judgeCookOff(duel({ entry: recipeKey(soup) }), player, karczma, [], seed);
      expect(Math.abs(result.rivalScore - theirs.score)).toBeLessThanOrEqual(balance.cookOffs.luck);
      expect(Math.abs(result.playerScore - cookOffScore(player, soup, [], 1))).toBeLessThanOrEqual(balance.cookOffs.luck);
      expect(result.won).toBe(result.playerScore > result.rivalScore);
    }
    expect(judgeCookOff(duel({ declined: true }), player, karczma, [], 1).won).toBe(false);
    expect(COOK_OFFS.karczma.field).toEqual({ category: 'soup' });
  });
});

describe('a cook-off on its day', () => {
  function play(state: GameState) {
    const open = openRestaurant(state);
    while (!open.progress.done) playTick(open);
    return closeDay(state, open);
  }

  it('gives the rival the word when the player stays out of it', () => {
    const start: GameState = { ...newGame(5), day: WEDNESDAY + 3, cookOff: duel({ declined: true }) };
    const { summary, state } = play(start);
    const without = play({ ...start, cookOff: null }).state;
    expect(summary.cookOff?.playerDish).toBeNull();
    const karczma = (s: GameState) => s.restaurants.find((r) => r.id === 'karczma')!;
    for (const g of GROUP_IDS) {
      expect(karczma(state).awareness[g]).toBeCloseTo(Math.min(100, karczma(without).awareness[g] + balance.cookOffs.declineRivalAwareness));
    }
  });

  it('brings the player word of mouth, win or lose', () => {
    const start: GameState = { ...newGame(6), day: WEDNESDAY + 3 };
    const soup = cookOffEntries(playerOf(start), 'karczma')[0];
    const { summary, state } = play({ ...start, cookOff: duel({ entry: recipeKey(soup) }) });
    const without = play(start).state;
    const gain = balance.cookOffs[summary.cookOff!.won ? 'winAwareness' : 'loseAwareness'];
    expect(playerOf(state).awareness.locals).toBeCloseTo(Math.min(100, playerOf(without).awareness.locals + gain));
  });
});
