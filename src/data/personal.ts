// Personal touches from project.md section 10: the things that make this game hers.

import type { GroupId } from './groups';
import type { TraitId } from './staff';

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
  unlockStars: 3.3,
  /** ...or on this day at the latest (day 7 is the Monday of week 2). */
  unlockByDay: 7,
  news: {
    title: 'A secret recipe!',
    text:
      'Mewa dropped a crumpled recipe card on your doorstep: Arroz de vitela, in handwriting from far away. ' +
      'You can add it in the dish creator now. Mewa thinks it would go perfectly with something Polish and lemony…',
  },
} as const;

/** The Portuguese corner: a choice card on this day brings cabrito assado and azulejo tiles. */
export const PORTUGUESE_CORNER = {
  card: 'portugueseStudent',
  /** Tuesday of week 2. */
  day: 8,
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

// ---------- Two waiters she knows ----------

export type SpecialStaffId = 'tomek' | 'adrian';

export interface SpecialStaff {
  name: string;
  bio: string;
  skill: number;
  speed: number;
  trait: TraitId;
  /** Fixed daily wage, or null to pay the usual rate for their skill and speed. */
  wage: number | null;
  /** First day they look for work (a Monday), then again every few weeks until hired. */
  firstDay: number;
  everyDays: number;
  /** Reputation lost with every group on each day they work, and what went wrong. */
  reputationLossPerDay?: number;
  mishaps?: string[];
  /** Chance of not turning up on a given day, and what they say... */
  absenceChance?: number;
  /** ...multiplied by this while they're in good spirits (their story: data/teamStories.ts). */
  happyAbsenceFactor?: number;
  /** In the day report when a skill course makes them good enough that the mishaps stop. */
  trainedNews?: string;
  excuses?: string[];
}

export const SPECIAL_STAFF_IDS: readonly SpecialStaffId[] = ['tomek', 'adrian'];

export const SPECIAL_STAFF: Record<SpecialStaffId, SpecialStaff> = {
  tomek: {
    name: 'Tomek Graczyk',
    bio:
      'Asks for the lowest wage in Gdańsk, and means it. A lovely smile. ' +
      'Has never once carried three plates at the same time, and never will.',
    skill: 1,
    speed: 2,
    trait: 'cheerful',
    wage: 180,
    firstDay: 7,
    everyDays: 21,
    reputationLossPerDay: 2,
    trainedNews: 'Tomek carried three plates across the room without dropping one, and took a bow. No more mishaps!',
    mishaps: [
      'Tomek dropped a whole tray of pierogi right in front of the window.',
      'Tomek brought a family three soups they hadn’t ordered and called it “a surprise from the chef”.',
      'Tomek forgot table four for forty minutes. They have written about it online.',
      'Tomek spilled kompot all over a tourist’s map of Gdańsk.',
      'Tomek told a foodie that the pierogi come “from the freezer, but a nice freezer”.',
    ],
  },
  adrian: {
    name: 'Adrian Żabka',
    bio:
      'The best waiter in the Old Town, when he turns up. Remembers every order, every name and every allergy. ' +
      'His alarm clock is less reliable. Gets paid either way, somehow.',
    skill: 5,
    speed: 5,
    trait: 'calm',
    wage: null,
    firstDay: 14,
    everyDays: 21,
    absenceChance: 0.5,
    happyAbsenceFactor: 0.5,
    excuses: [
      'Adrian didn’t come in today. His text says: “tram broke down, will explain later”.',
      '“My cat sat on my alarm clock,” says Adrian’s message. No Adrian today.',
      'No Adrian today. Someone saw him on the beach in Brzeźno.',
      'Adrian called in: “a family thing”. The family thing is a football match.',
      'Adrian’s text just says “😴”. No Adrian today.',
    ],
  },
};
