// Personal touches from project.md section 10: the things that make this game hers.

import type { GroupId } from './groups';

/** Shown when the player wins the Golden Neptune. */
export const ENDING = {
  title: 'Parabéns!!!',
  message: 'You passed a test! Now You are ready to open Your dream restaurant in the real WORLD!!!',
};

/**
 * Her favourite dish, hidden in the dish creator until Mewa finds the recipe card.
 * Its perfect combo is a glass of cytrynówka on the side: Portugal and Poland at one table.
 */
export const SECRET_RECIPE = {
  template: 'arrozDeVitela',
  /** Mewa finds the recipe once the restaurant reaches this many stars... */
  unlockStars: 2,
  /** ...or on this day at the latest (day 14 is the Monday of week 3). */
  unlockByDay: 14,
  news: {
    title: 'A secret recipe!',
    text:
      'Mewa dropped a crumpled recipe card on your doorstep: Arroz de vitela, in handwriting from far away. ' +
      'You can add it in the dish creator now. Mewa thinks it would go perfectly with something Polish and lemony…',
  },
} as const;

/** A regular guest who comes every week and always wants the same thing. */
export const REGULAR = {
  name: 'Pan Cytrynówka, your Friday regular',
  group: 'locals' as GroupId,
  /** 0 = Monday … 4 = Friday. */
  weekday: 4,
  hour: 19,
  shout: 'Give me cytrynówka to my dish!!',
  /** His review when a dish on the menu comes with cytrynówka. */
  happy: [
    'Finally, cytrynówka with my dish! Five stars, and I’m coming back next Friday.',
    'Cytrynówka with my dish, exactly how it should be. This is the best restaurant in Gdańsk.',
    'They gave me cytrynówka to my dish. I may cry. Five stars.',
  ],
  /** His review when there's none, after shouting for it. */
  grumpy: [
    'The food was lovely, but where was my cytrynówka?',
    'Nice dinner. Still no cytrynówka. I will ask again next Friday.',
    'I asked three times. Nobody brought cytrynówka. The food was good though.',
  ],
};
