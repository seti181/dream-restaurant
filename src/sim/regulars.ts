// Named regulars with stories: who comes when, whether their wish comes true, and how
// each visit moves their story along. The regulars themselves are in data/regulars.ts.

import { balance } from '../data/balance';
import type { GroupId } from '../data/groups';
import { REGULAR_IDS, REGULARS, walkedOutLine, type RegularId, type RegularWish } from '../data/regulars';
import { weekdayOf } from './calendar';
import { lunchSetServing, templateOf } from './menu';
import type { Booking, PartyOutcome, Restaurant } from './types';

/** How far each regular's story has got. Saved with the game. */
export interface RegularStory {
  /** Visits where they ate with you: each one told the next part of the story. */
  visits: number;
  /** Of those, visits where their wish came true and they enjoyed it. */
  happy: number;
}

export type RegularStories = Partial<Record<RegularId, RegularStory>>;

/** One regular's visit today, for the day report. */
export interface RegularVisitReport {
  id: RegularId;
  /** Happy: their wish came true and they enjoyed it. Okay: they ate, but not quite. Missed: no table, or no food in time. */
  mood: 'happy' | 'okay' | 'missed';
  /** Today's part of their story. */
  story: string;
  /** How their wish went, or what wasn't quite right. */
  note: string | null;
  /** True on the day their story ends with them as friends of the house. */
  friends: boolean;
}

/** Whether the restaurant has what a regular wishes for, at this minute. */
export function wishMet(restaurant: Restaurant, wish: RegularWish, minute: number): boolean {
  const mains = restaurant.menu.filter((dish) => templateOf(dish).category === 'main');
  switch (wish) {
    case 'soup':
      return restaurant.menu.some((dish) => templateOf(dish).category === 'soup');
    case 'pierogi':
      return restaurant.menu.some((dish) => dish.template === 'pierogi');
    case 'lunchSet':
      return lunchSetServing(restaurant, minute) !== null;
    case 'cheapMain':
      return mains.some((dish) => dish.price <= balance.regulars.cheapMainPrice);
  }
}

/** The regulars who have booked at the player's restaurant today. */
export function regularsBookings(day: number, restaurant: string): Booking[] {
  return REGULAR_IDS.filter((id) => day >= REGULARS[id].firstDay && weekdayOf(day) === REGULARS[id].weekday).map(
    (id) => ({
      restaurant,
      group: REGULARS[id].group,
      size: 1,
      minute: REGULARS[id].hour * 60 + REGULARS[id].minute,
      critic: false,
      regularId: id,
    }),
  );
}

/** The morning news for a regular's very first visit: who they are, with a hint of their wish. */
export function regularsNews(day: number, stories: RegularStories): { title: string; text: string }[] {
  return regularsBookings(day, '')
    .filter((booking) => !stories[booking.regularId!])
    .map((booking) => ({ title: 'A new face', text: REGULARS[booking.regularId!].intro }));
}

/** What today's visits did to the regulars' stories, and what they say about you afterwards. */
export function regularsDay(
  stories: RegularStories,
  outcomes: PartyOutcome[],
  playerId: string,
): {
  stories: RegularStories;
  visits: RegularVisitReport[];
  reputation: Partial<Record<GroupId, number>>;
  awareness: Partial<Record<GroupId, number>>;
} {
  const next: RegularStories = { ...stories };
  const visits: RegularVisitReport[] = [];
  const reputation: Partial<Record<GroupId, number>> = {};
  const awareness: Partial<Record<GroupId, number>> = {};
  const add = (points: Partial<Record<GroupId, number>>, group: GroupId, amount: number) => {
    points[group] = (points[group] ?? 0) + amount;
  };

  for (const outcome of outcomes) {
    if (!outcome.regularVisit || outcome.restaurant !== playerId) continue;
    const { id, wishMet } = outcome.regularVisit;
    const regular = REGULARS[id];
    const story = next[id] ?? { visits: 0, happy: 0 };
    if (outcome.kind !== 'served') {
      // The story waits for next week.
      next[id] = story;
      const line = outcome.kind === 'walkedOut' ? walkedOutLine(regular.name) : regular.missed;
      visits.push({ id, mood: 'missed', story: line, note: null, friends: false });
      continue;
    }

    const happy = wishMet && (outcome.satisfaction ?? 0) >= balance.regulars.happyFrom;
    const happyVisits = story.happy + (happy ? 1 : 0);
    const chapters = regular.chapters.length;
    let text: string;
    let friends = false;
    if (story.visits < chapters) text = regular.chapters[story.visits];
    else if (story.visits === chapters) {
      friends = happyVisits >= balance.regulars.friendsVisits;
      text = friends ? regular.ending.friends : regular.ending.polite;
    } else text = regular.after[(story.visits - chapters - 1) % regular.after.length];

    if (happy) add(reputation, regular.group, balance.regulars.happyReputation);
    if (friends) {
      add(reputation, regular.group, balance.regulars.friendsReputation);
      add(awareness, regular.group, balance.regulars.friendsAwareness);
    }
    next[id] = { visits: story.visits + 1, happy: happyVisits };
    const note = happy ? regular.wishMet : wishMet ? regular.notHappy : regular.wishMissed;
    visits.push({ id, mood: happy ? 'happy' : 'okay', story: text, note, friends });
  }
  return { stories: next, visits, reputation, awareness };
}
