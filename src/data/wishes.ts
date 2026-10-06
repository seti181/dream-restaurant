// Guests with wishes: now and then a party walks in hoping for something. On the menu, they're
// delighted; missing, it's a hint for tomorrow. How often is in balance.ts (balance.wishes).
// See project.md section 6.15, D12.

import type { MenuWant } from './bookings';
import type { GroupId } from './groups';

export type WishId =
  | 'noMeat'
  | 'dill'
  | 'fish'
  | 'hotSoup'
  | 'sweet'
  | 'pierogi'
  | 'coffee'
  | 'spicy'
  | 'polish'
  | 'mushrooms';

export interface Wish {
  /** The bubble over their table while they order. */
  bubble: string;
  /** What they ask, for the day report. */
  text: string;
  want: MenuWant;
  /** The groups who ask for it. */
  groups: GroupId[];
}

export const WISH_IDS: readonly WishId[] = [
  'noMeat', 'dill', 'fish', 'hotSoup', 'sweet', 'pierogi', 'coffee', 'spicy', 'polish', 'mushrooms',
];

export const WISHES: Record<WishId, Wish> = {
  noMeat: { bubble: '🌱?', text: 'something without meat', want: { tag: 'veggie' }, groups: ['foodies', 'students'] },
  dill: { bubble: '🌿!', text: 'extra dill', want: { extras: ['dill'] }, groups: ['locals'] },
  fish: { bubble: '🐟?', text: 'anything with fish', want: { tag: 'seafood' }, groups: ['tourists', 'foodies'] },
  hotSoup: { bubble: '🥣?', text: 'a hot soup', want: { category: 'soup' }, groups: ['locals', 'office'] },
  sweet: { bubble: '🍰?', text: 'something sweet', want: { category: 'dessert' }, groups: ['students', 'tourists'] },
  pierogi: { bubble: '🥟!', text: 'pierogi', want: { template: 'pierogi' }, groups: ['tourists'] },
  coffee: { bubble: '☕?', text: 'a coffee', want: { template: 'coffee' }, groups: ['office'] },
  spicy: { bubble: '🌶️?', text: 'something spicy', want: { tag: 'spicy' }, groups: ['students'] },
  polish: { bubble: '🇵🇱?', text: 'a Polish classic', want: { tag: 'polish' }, groups: ['tourists'] },
  mushrooms: {
    bubble: '🍄?',
    text: 'anything with mushrooms',
    want: {
      anyOf: [
        { extras: ['wildMushrooms', 'chanterelles'] },
        { template: 'pierogi', variant: 'mushroomCabbage' },
        { template: 'golabki', variant: 'mushroom' },
        { template: 'golabki', variant: 'buckwheat' },
      ],
    },
    groups: ['locals', 'foodies'],
  },
};
