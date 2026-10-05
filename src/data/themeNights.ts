// Theme nights: once a week the player picks an evening and a theme, for a small cost, and the
// theme's crowd comes in from 18:00. How strong they are is in balance.ts (balance.themeNights).
// A light version of the hosted events left out in section 6.14. See project.md section 6.15, A4.

import type { MenuWant } from './bookings';
import type { GroupId } from './groups';

export type ThemeNightId = 'pierogi' | 'kashubian' | 'accordion' | 'seafood';

export interface ThemeNight {
  icon: string;
  name: string;
  /** What it is, for the Marketing tab. */
  text: string;
  /** Złoty, paid when it's booked. */
  cost: number;
  /** The groups it draws in. */
  groups: GroupId[];
  /** What they come for (a perfect match for them that evening); missing from the menu, they're a little disappointed. */
  wants?: MenuWant;
  wantText?: string;
  /** Happiness (0–100) added for everyone who comes in that evening (live music). */
  mood?: number;
  /** The note at 18:00. */
  tonight: string;
}

export const THEME_NIGHT_IDS: readonly ThemeNightId[] = ['pierogi', 'kashubian', 'accordion', 'seafood'];

export const THEME_NIGHTS: Record<ThemeNightId, ThemeNight> = {
  pierogi: {
    icon: '🥟',
    name: 'Pierogi night',
    text: 'Chalkboards on the street and a pierogi-folding table by the window. Tourists and locals love it.',
    cost: 300,
    groups: ['tourists', 'locals'],
    wants: { template: 'pierogi' },
    wantText: 'pierogi',
    tonight: '🥟 Pierogi night! The folding table is out, and the street smells of fried onions.',
  },
  kashubian: {
    icon: '🧶',
    name: 'Kashubian evening',
    text: 'Embroidered napkins, Kashubian songs and Babcia’s recipes. Locals and foodies come for the homemade cooking.',
    cost: 400,
    groups: ['locals', 'foodies'],
    wants: { tag: 'homemade' },
    wantText: 'homemade cooking',
    tonight: '🧶 A Kashubian evening! Someone’s grandmother has started teaching the waiters a song.',
  },
  accordion: {
    icon: '🪗',
    name: 'Live accordion',
    text: 'A musician plays by the door all evening. Tourists stop to listen, and everyone inside is a little happier.',
    cost: 500,
    groups: ['tourists'],
    mood: 5,
    tonight: '🪗 Live accordion tonight! Tourists are stopping to listen at the door.',
  },
  seafood: {
    icon: '🐟',
    name: 'Seafood night',
    text: 'The Baltic catch of the day on the board outside. Foodies and tourists come for anything from the sea.',
    cost: 400,
    groups: ['foodies', 'tourists'],
    wants: { tag: 'seafood' },
    wantText: 'something from the sea',
    tonight: '🐟 Seafood night! The catch of the day is chalked on the board outside.',
  },
};
