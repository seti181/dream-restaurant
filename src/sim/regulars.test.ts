import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { REGULAR } from '../data/personal';
import { REGULAR_IDS, REGULARS, type RegularId } from '../data/regulars';
import { weekdayOf } from './calendar';
import { answerTheMoment, closeDay, momentDue, newGame, openRestaurant, playTick, type GameState } from './game';
import { recipeKey } from './menu';
import { regularsBookings, regularsDay, regularsNews, wishMet, type RegularStories } from './regulars';
import type { PartyOutcome } from './types';

/** A regular's outcome at the player's restaurant. */
function visit(id: RegularId, kind: PartyOutcome['kind'], wish = true, satisfaction = 80): PartyOutcome {
  return {
    restaurant: 'player',
    group: REGULARS[id].group,
    size: 1,
    kind,
    order: [],
    revenue: 0,
    ingredientCost: 0,
    waitMinutes: 0,
    satisfaction: kind === 'served' ? satisfaction : null,
    factors: null,
    review: null,
    regularVisit: { id, wishMet: wish },
  };
}

/** Plays a whole day, saying no to every card, and closes it. */
function playDay(state: GameState) {
  const open = openRestaurant(state);
  while (!open.progress.done) {
    if (momentDue(open)) answerTheMoment(open, 1);
    playTick(open);
  }
  return closeDay(state, open);
}

describe('named regulars', () => {
  it('each come on their own weekday from their first day, never on Pan Cytrynówka’s Friday', () => {
    const weekdays = REGULAR_IDS.map((id) => REGULARS[id].weekday);
    expect(new Set([...weekdays, REGULAR.weekday]).size).toBe(REGULAR_IDS.length + 1);
    for (const id of REGULAR_IDS) {
      const { firstDay, weekday } = REGULARS[id];
      expect(weekdayOf(firstDay)).toBe(weekday);
      expect(regularsBookings(firstDay - 7, 'player').some((b) => b.regularId === id)).toBe(false);
      for (const day of [firstDay, firstDay + 7, firstDay + 70]) {
        expect(regularsBookings(day, 'player')).toEqual([expect.objectContaining({ regularId: id, size: 1 })]);
      }
    }
  });

  it('each have a story with an ending and something to say afterwards', () => {
    for (const id of REGULAR_IDS) {
      const regular = REGULARS[id];
      expect(regular.chapters.length).toBeGreaterThan(1);
      expect(regular.after.length).toBeGreaterThan(0);
      // A story ends within the six-week season, with a week to spare for a missed visit.
      expect(regular.firstDay + 7 * regular.chapters.length).toBeLessThanOrEqual(41);
    }
  });

  it('wish for a soup, pierogi, the lunch set or a main a student can afford', () => {
    const player = newGame(1).restaurants[0];
    expect(wishMet(player, 'soup', 13 * 60)).toBe(true);
    expect(wishMet(player, 'pierogi', 13 * 60)).toBe(true);
    expect(wishMet({ ...player, lunchSet: null }, 'lunchSet', 12 * 60 + 30)).toBe(false);
    const cheap = player.menu.map((dish) => (dish.template === 'pierogi' ? { ...dish, price: balance.regulars.cheapMainPrice } : dish));
    const dear = player.menu.map((dish) => ({ ...dish, price: Math.max(dish.price, balance.regulars.cheapMainPrice + 1) }));
    expect(wishMet({ ...player, menu: cheap }, 'cheapMain', 18 * 60)).toBe(true);
    expect(wishMet({ ...player, menu: dear }, 'cheapMain', 18 * 60)).toBe(false);
    expect(wishMet({ ...player, menu: dear.filter((d) => d.template !== 'pierogi') }, 'pierogi', 13 * 60)).toBe(false);
  });

  it('tell the next part of their story on each visit, and like you more when their wish comes true', () => {
    const first = regularsDay({}, [visit('marek', 'served')], 'player');
    expect(first.visits).toEqual([
      { id: 'marek', mood: 'happy', story: REGULARS.marek.chapters[0], note: REGULARS.marek.wishMet, friends: false },
    ]);
    expect(first.stories.marek).toEqual({ visits: 1, happy: 1 });
    expect(first.reputation.office).toBe(balance.regulars.happyReputation);

    const noWish = regularsDay(first.stories, [visit('marek', 'served', false)], 'player');
    expect(noWish.visits[0]).toMatchObject({ mood: 'okay', story: REGULARS.marek.chapters[1], note: REGULARS.marek.wishMissed });
    expect(noWish.stories.marek).toEqual({ visits: 2, happy: 1 });
    expect(noWish.reputation).toEqual({});

    const slow = regularsDay(first.stories, [visit('marek', 'served', true, balance.regulars.happyFrom - 1)], 'player');
    expect(slow.visits[0]).toMatchObject({ mood: 'okay', note: REGULARS.marek.notHappy });
  });

  it('keep their story for next week when they can’t get a table or give up waiting', () => {
    const stories: RegularStories = { ola: { visits: 2, happy: 1 } };
    for (const kind of ['noTable', 'walkedOut'] as const) {
      const day = regularsDay(stories, [visit('ola', kind)], 'player');
      expect(day.stories.ola).toEqual({ visits: 2, happy: 1 });
      expect(day.visits[0]).toMatchObject({ mood: 'missed', note: null });
    }
    expect(regularsDay(stories, [visit('ola', 'noTable')], 'player').visits[0].story).toBe(REGULARS.ola.missed);
  });

  it('become friends of the house after enough happy visits, and tell everyone', () => {
    const chapters = REGULARS.zbigniew.chapters.length;
    const enough = { zbigniew: { visits: chapters, happy: balance.regulars.friendsVisits - 1 } };
    const friends = regularsDay(enough, [visit('zbigniew', 'served')], 'player');
    expect(friends.visits[0]).toMatchObject({ story: REGULARS.zbigniew.ending.friends, friends: true });
    expect(friends.reputation.locals).toBe(balance.regulars.happyReputation + balance.regulars.friendsReputation);
    expect(friends.awareness.locals).toBe(balance.regulars.friendsAwareness);

    const notYet = { zbigniew: { visits: chapters, happy: 0 } };
    const polite = regularsDay(notYet, [visit('zbigniew', 'served')], 'player');
    expect(polite.visits[0]).toMatchObject({ story: REGULARS.zbigniew.ending.polite, friends: false });
    expect(polite.awareness).toEqual({});

    // Afterwards they keep coming, with a little moment each time.
    const later = regularsDay(friends.stories, [visit('zbigniew', 'served')], 'player');
    expect(later.visits[0].story).toBe(REGULARS.zbigniew.after[0]);
  });

  it('only count at the player’s own restaurant', () => {
    expect(regularsDay({}, [{ ...visit('fletcher', 'served'), restaurant: 'nonnaRosa' }], 'player').visits).toEqual([]);
  });

  it('are announced in the morning news before their first visit, and only then', () => {
    const { firstDay } = REGULARS.fletcher;
    expect(regularsNews(firstDay, {}).map((n) => n.text)).toEqual([REGULARS.fletcher.intro]);
    expect(regularsNews(firstDay + 7, { fletcher: { visits: 0, happy: 0 } })).toEqual([]);
  });

  it('come in on their day, and the day report tells their story', () => {
    let state = newGame(4);
    const { firstDay } = REGULARS.marek;
    while (state.day < firstDay) state = playDay(state).state;
    expect(state.news.map((n) => n.text)).toContain(REGULARS.marek.intro);
    // Give Marek his lunch set.
    const player = state.restaurants[0];
    const soup = player.menu.find((d) => d.template === 'zurek')!;
    const main = player.menu.find((d) => d.template === 'pierogi')!;
    const lunchSet = { soup: recipeKey(soup), main: recipeKey(main), price: 40 };
    state = { ...state, restaurants: [{ ...player, lunchSet }, ...state.restaurants.slice(1)] };
    const { state: next, summary } = playDay(state);
    expect(summary.regulars.map((r) => r.id)).toEqual(['marek']);
    if (summary.regulars[0].mood !== 'missed') expect(summary.regulars[0].note).not.toBe(REGULARS.marek.wishMissed);
    expect(next.regulars.marek?.visits ?? 0).toBe(summary.regulars[0].mood === 'missed' ? 0 : 1);
  });
});
