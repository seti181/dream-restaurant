// What the day report says when the kitchen earns a star for a kind of dish (sim/practice.ts).
// {dish} is the dish's name, {chef} the head chef's, {tag} what the dish earned at three stars.
// See project.md section 6.15, B5.

import type { Tag } from './dishes';

/** One line for each star: the first, the second and the third. */
export const STAR_LINES: readonly string[] = [
  '{dish}: a first star ★! The kitchen is getting the hang of it.',
  '{dish}: ★★! {chef} could cook it blindfolded now.',
  '{dish}: ★★★, a house speciality! Guests say it tastes {tag}.',
];

/** How guests describe a dish with the taste tag it earned at three stars. */
export const MASTERY_WORDS: Partial<Record<Tag, string>> = {
  homemade: 'just like at home',
  creative: 'like nowhere else in Gdańsk',
};
