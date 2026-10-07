import { describe, expect, it } from 'vitest';
import { GULLS_FOR_STAMP, STAMP_GROUPS, STAMP_IDS, STAMPS } from '../data/passport';
import { RANKS } from '../data/ranks';
import { closeDay, newGame, openRestaurant, playTick, type DaySummary, type GameState, type OpenDay } from './game';
import { EMPTY_PASSPORT, stampAfterDay } from './passport';

/** One day played from a new game: the game after closing, the report and the day itself. */
function playedDay(seed = 3): { state: GameState; summary: DaySummary; open: OpenDay; before: GameState } {
  const before = newGame(seed);
  const open = openRestaurant(before);
  while (!open.progress.done) playTick(open);
  const { state, summary } = closeDay(before, open);
  return { state, summary, open, before };
}

describe('the Gdańsk passport', () => {
  it('has every stamp in a group, with its text and hint', () => {
    expect(new Set(STAMP_IDS).size).toBe(STAMP_IDS.length);
    for (const id of STAMP_IDS) {
      expect(STAMP_GROUPS).toContain(STAMPS[id].group);
      expect(STAMPS[id].hint.length).toBeGreaterThan(0);
    }
  });

  it('stamps the first guests at the first closing, once', () => {
    const { state, summary, open } = playedDay();
    expect(summary.newStamps).toContain('firstGuest');
    expect(state.passport.stamps.firstGuest).toBe(0);
    // The same day again earns nothing new.
    expect(stampAfterDay(state, summary, open).newStamps).toEqual([]);
  });

  it('stamps what the game already has: the secret recipe, the top rank, a cellar, a new address', () => {
    const { state, summary, open } = playedDay();
    const player = state.restaurants[0];
    const grown: GameState = {
      ...state,
      passport: EMPTY_PASSPORT,
      secretRecipe: true,
      rank: RANKS.length - 1,
      restaurants: [{ ...player, location: 'dluga', works: ['toilet', 'cellar'] }, ...state.restaurants.slice(1)],
    };
    const { newStamps } = stampAfterDay(grown, summary, open);
    for (const id of ['secretRecipe', 'oldTownFavourite', 'cellar', 'newAddress'] as const) expect(newStamps).toContain(id);
  });

  it('counts the gulls over many days', () => {
    const { state, summary, open } = playedDay();
    const shooing = { ...summary, gulls: { shooed: 10, stolen: 0 } };
    let passport = { ...EMPTY_PASSPORT };
    for (let day = 0; day < 3; day++) {
      const result = stampAfterDay({ ...state, passport }, shooing, open);
      passport = result.passport;
      expect(result.newStamps.includes('gulls')).toBe(passport.gullsShooed >= GULLS_FOR_STAMP && day === 2);
    }
    expect(passport.gullsShooed).toBe(30);
  });

  it('stamps the day’s moments: a five-star review, a won cook-off, every wish granted', () => {
    const { state, summary, open } = playedDay();
    const great: DaySummary = {
      ...summary,
      reviews: [{ stars: 5, text: 'Wonderful', reviewer: 'a foodie', critic: true }],
      cookOff: { ...(summary.cookOff ?? ({} as NonNullable<DaySummary['cookOff']>)), won: true },
      wishes: { asked: 5, granted: 5, missing: [] },
    };
    const { newStamps } = stampAfterDay({ ...state, passport: EMPTY_PASSPORT }, great, open);
    for (const id of ['fiveStars', 'happyCritic', 'cookOffWon', 'everyWish'] as const) expect(newStamps).toContain(id);
    expect(stampAfterDay({ ...state, passport: EMPTY_PASSPORT }, { ...great, wishes: { asked: 5, granted: 4, missing: [] } }, open).newStamps).not.toContain('everyWish');
  });
});
