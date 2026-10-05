// Weekly trends: every Monday Gdańsk goes crazy about something, and for a week one group
// craves it. How strong a trend is, is in balance.ts (balance.trends). See project.md section 6.15, B6.

import type { MenuWant } from './bookings';
import type { GroupId } from './groups';

export type TrendId =
  | 'seafood'
  | 'sweetTooth'
  | 'pierogiFever'
  | 'veggie'
  | 'hearty'
  | 'coffee'
  | 'kashubian'
  | 'iceCream'
  | 'pizza'
  | 'soup';

export interface Trend {
  icon: string;
  /** "Seafood week". */
  name: string;
  /** Why, in a sentence for Monday's news. */
  story: string;
  group: GroupId;
  /** What they crave this week. */
  wants: MenuWant;
  /** What they crave, in a few words: "anything from the sea". */
  wantText: string;
}

export const TREND_IDS: readonly TrendId[] = [
  'seafood', 'sweetTooth', 'pierogiFever', 'veggie', 'hearty', 'coffee', 'kashubian', 'iceCream', 'pizza', 'soup',
];

export const TRENDS: Record<TrendId, Trend> = {
  seafood: {
    icon: '🐟',
    name: 'Seafood week',
    story: 'The herring boats came in heavy and the radio talks of nothing else.',
    group: 'locals',
    wants: { tag: 'seafood' },
    wantText: 'anything from the sea',
  },
  sweetTooth: {
    icon: '🍰',
    name: 'Sweet tooth week',
    story: 'Exams are over and the students are celebrating with cake.',
    group: 'students',
    wants: { category: 'dessert' },
    wantText: 'desserts',
  },
  pierogiFever: {
    icon: '🥟',
    name: 'Pierogi fever',
    story: 'A travel show called Gdańsk “the pierogi capital of the Baltic”.',
    group: 'tourists',
    wants: { template: 'pierogi' },
    wantText: 'pierogi',
  },
  veggie: {
    icon: '🥗',
    name: 'Green week',
    story: 'A famous chef has gone vegetarian, and the food blogs followed.',
    group: 'foodies',
    wants: { tag: 'veggie' },
    wantText: 'veggie dishes',
  },
  hearty: {
    icon: '🍖',
    name: 'Hearty week',
    story: 'The office football league starts on Friday, and everyone is “carb-loading”.',
    group: 'office',
    wants: { tag: 'hearty' },
    wantText: 'something hearty',
  },
  coffee: {
    icon: '☕',
    name: 'Coffee culture',
    story: 'A barista from Gdynia won a world prize, and now every student has an opinion on beans.',
    group: 'students',
    wants: { template: 'coffee' },
    wantText: 'coffee',
  },
  kashubian: {
    icon: '🧶',
    name: 'Kashubian week',
    story: 'The Kashubian folk festival is in town, and everyone wants cooking like Babcia’s.',
    group: 'foodies',
    wants: { tag: 'homemade' },
    wantText: 'homemade cooking',
  },
  iceCream: {
    icon: '🍦',
    name: 'Ice cream summer',
    story: 'A new gelato shop on Długa has the whole Old Town queueing for ice cream.',
    group: 'tourists',
    wants: { template: 'iceCream' },
    wantText: 'ice cream',
  },
  pizza: {
    icon: '🍕',
    name: 'Pizza craze',
    story: 'Lechia’s new Italian striker posted his favourite pizza, and Gdańsk wants a slice.',
    group: 'locals',
    wants: { template: 'pizza' },
    wantText: 'pizza',
  },
  soup: {
    icon: '🥣',
    name: 'Soup week',
    story: 'A cool Baltic wind blew in, and the guidebooks are all about Polish soups.',
    group: 'tourists',
    wants: { category: 'soup' },
    wantText: 'a good soup',
  },
};
