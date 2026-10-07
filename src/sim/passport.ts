// The sticker album, "Gdańsk passport" (project.md section 6.14): which stamps a day earns. Checked at
// the end of every day from the game as it now stands and the day's report, so an older save earns
// what it already has at its next closing. The stamps themselves are in data/passport.ts.

import { balance } from '../data/balance';
import { GULLS_FOR_STAMP, GUESTS_FOR_STAMP, RAINY_DAY_GUESTS, STAMP_IDS, STREAK_FOR_STAMP, WISHES_FOR_STAMP, type StampId } from '../data/passport';
import { RANKS } from '../data/ranks';
import { FIND_IDS } from '../data/finds';
import { calendarEventsOn } from './events';
import type { DaySummary, GameState, OpenDay } from './game';
import { pairingQuality } from './menu';
import { isFairDay } from './neptune';
import { MAX_STARS, starsFor } from './practice';

/** The passport, saved with the game: the day each stamp was earned, and the one running count it needs. */
export interface PassportState {
  stamps: Partial<Record<StampId, number>>;
  gullsShooed: number;
}

export const EMPTY_PASSPORT: PassportState = { stamps: {}, gullsShooed: 0 };

/** What the day just closed earns: `state` is the game after closing, `day` the day that was played. */
function earned(state: GameState, summary: DaySummary, open: OpenDay, gullsShooed: number): Set<StampId> {
  const player = state.restaurants[0];
  const served = Object.values(state.guestsServed).reduce((sum, n) => sum + (n ?? 0), 0);
  const day = summary.day;
  const got = new Set<StampId>();
  const when = (id: StampId, yes: boolean) => yes && got.add(id);
  when('firstGuest', served > 0);
  when('fiveStars', summary.reviews.some((r) => r.stars === 5));
  when('thousandGuests', served >= GUESTS_FOR_STAMP);
  when('fullHouse', open.fullHouse);
  when('threeStarDish', Object.values(state.dishPractice).some((p) => starsFor(p ?? 0) >= MAX_STARS));
  when('secretRecipe', state.secretRecipe);
  when('pairing', player.menu.some((dish) => pairingQuality(dish) > 0));
  when('marketSpecial', summary.market?.special != null);
  when('friendOfTheHouse', summary.regulars.some((r) => r.friends));
  when('walesa', open.moments.results.some((r) => r.id === 'walesa'));
  when('happyCritic', summary.reviews.some((r) => r.critic && r.stars >= 4));
  when('wedding', summary.bookings.some((b) => b.icon === '💒' && b.good));
  when('fair', isFairDay(day) && summary.guestsServed > 0);
  when('tallShips', calendarEventsOn(day).includes('tallShips') && summary.guestsServed > 0);
  when('neptune', summary.neptune?.playerWon === true);
  when('rainyDay', summary.weather === 'rain' && summary.guestsServed >= RAINY_DAY_GUESTS);
  when('cookOffWon', summary.cookOff?.won === true);
  when('topOfTheTown', state.ranking?.rows[0]?.id === 'player');
  when('oldTownFavourite', state.rank >= RANKS.length - 1);
  when('cellar', player.works?.includes('cellar') ?? false);
  when('newAddress', player.location !== balance.start.location);
  when('gulls', gullsShooed >= GULLS_FOR_STAMP);
  when('quickStreak', summary.rush.bestStreak >= STREAK_FOR_STAMP);
  when('everyWish', summary.wishes.asked >= WISHES_FOR_STAMP && summary.wishes.granted === summary.wishes.asked);
  when('mewasTreasures', FIND_IDS.every((id) => state.finds?.found.includes(id)));
  return got;
}

/** The passport after a day: anything new is stamped with the day it was earned, in the album's order. */
export function stampAfterDay(state: GameState, summary: DaySummary, open: OpenDay): { passport: PassportState; newStamps: StampId[] } {
  const before = state.passport ?? EMPTY_PASSPORT;
  const gullsShooed = before.gullsShooed + summary.gulls.shooed;
  const got = earned(state, summary, open, gullsShooed);
  const newStamps = STAMP_IDS.filter((id) => got.has(id) && before.stamps[id] === undefined);
  const stamps = { ...before.stamps };
  for (const id of newStamps) stamps[id] = summary.day;
  return { passport: { stamps, gullsShooed }, newStamps };
}
