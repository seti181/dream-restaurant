// Rival moves to answer: now and then, on a Monday, one rival acts against the player, gently,
// and a card on the Today tab offers three answers. How often is in balance.ts (balance.rivalMoves).
// See project.md section 6.15, C9.

import type { GroupId } from './groups';
import type { RivalId } from './rivals';

export type RivalMoveId = 'poachChef' | 'priceWar' | 'copySpecial' | 'lunchDeal';

/** What an answer does. Everything is optional. */
export interface RivalAnswerEffects {
  /** Złoty spent (negative) or gained, once. */
  cash?: number;
  /** The chef they're after: their wage is multiplied by this, for good... */
  raise?: number;
  /** ...their morale goes up this much... */
  morale?: number;
  /** ...and they stay with this chance (1: they stay, 0: they go). */
  stayChance?: number;
  /** The player's menu prices are multiplied by this while the move lasts. */
  priceFactor?: number;
  /** Guests are this much happier (0–100) while the move lasts, for a cost per guest served... */
  mood?: number;
  costPerGuest?: number;
  /** ...and word of it tempts these groups more, between these times. */
  pull?: { groups: GroupId[]; from: number; until: number; bonus: number };
  /** The lunch set's price is multiplied by this (it stays so; the player can change it back). */
  lunchSetPrice?: number;
  awareness?: Partial<Record<GroupId, number>>;
  reputation?: Partial<Record<GroupId, number>>;
}

export interface RivalAnswer {
  label: string;
  /** Only possible with a lunch set on the menu. */
  needs?: 'lunchSet';
  /** What happened, for the card and the day report. */
  result: string;
  effects: RivalAnswerEffects;
}

/** What the rival does while the move lasts. */
export interface RivalSideEffects {
  /** Their menu prices are multiplied by this. */
  priceFactor?: number;
  /** They tempt these groups more, between these times. */
  pull?: { groups: GroupId[]; from: number; until: number; bonus: number };
  /** They put the player's special on their own board. */
  copySpecial?: boolean;
}

export interface RivalMoveKind {
  rival: RivalId;
  icon: string;
  title: string;
  /** The card's text; {chef} is the chef they're after, {dish} the player's special. */
  text: string;
  /** Only when the player has two chefs or more, or a special on the board. */
  needs?: 'twoChefs' | 'special';
  /** Days it lasts, from the Monday it comes. */
  days: number;
  rivalSide: RivalSideEffects;
  answers: [RivalAnswer, RivalAnswer, RivalAnswer];
  /** The answer taken when the player opens without answering. */
  unanswered: 0 | 1 | 2;
}

export const RIVAL_MOVE_IDS: readonly RivalMoveId[] = ['poachChef', 'priceWar', 'copySpecial', 'lunchDeal'];

export const RIVAL_MOVES: Record<RivalMoveId, RivalMoveKind> = {
  poachChef: {
    rival: 'nonnaRosa',
    icon: '🍝',
    title: 'Nonna Rosa wants your chef',
    text: 'Nonna Rosa came by with a tiramisu and a job offer for {chef}. “Better pay, and my famous Sunday lunches.”',
    needs: 'twoChefs',
    days: 1,
    rivalSide: {},
    answers: [
      {
        label: 'Match the offer',
        result: '{chef} stays, with a 20% raise and a big smile.',
        effects: { raise: 1.2, morale: 25, stayChance: 1 },
      },
      {
        label: 'A heart-to-heart',
        result: 'You talk late into the evening over a glass of cytrynówka.',
        effects: { morale: 10, stayChance: 0.5 },
      },
      {
        label: 'Wish them well',
        result: '{chef} hugs everyone and leaves for Nonna Rosa’s kitchen.',
        effects: { stayChance: 0 },
      },
    ],
    unanswered: 1,
  },
  priceWar: {
    rival: 'blyskawica',
    icon: '⚡',
    title: 'A price war',
    text: 'Pani Halina has put up a sign at Bar Błyskawica: “Everything 20% off this week!” Your guests have noticed.',
    days: 7,
    // Cheaper, and the price-sensitive notice: students, office workers and families.
    rivalSide: {
      priceFactor: 0.8,
      pull: { groups: ['students', 'office', 'locals'], from: 0, until: 24 * 60, bonus: 0.5 },
    },
    answers: [
      {
        label: 'Match it',
        result: 'Your prices are 15% lower this week. Pani Halina sniffs.',
        effects: { priceFactor: 0.85 },
      },
      {
        label: 'Stay put',
        result: 'You keep your prices. Good food speaks for itself.',
        effects: {},
      },
      {
        label: 'Out-cozy them',
        result: 'A free glass of kompot for every guest this week. Bar Błyskawica can’t compete with that.',
        effects: {
          mood: 8,
          costPerGuest: 2,
          pull: { groups: ['tourists', 'students', 'locals', 'office', 'foodies'], from: 0, until: 24 * 60, bonus: 0.4 },
        },
      },
    ],
    unanswered: 1,
  },
  copySpecial: {
    rival: 'karczma',
    icon: '🪵',
    title: 'Karczma copied your special',
    text: 'Pan Zbigniew has chalked “{dish}” on Karczma pod Żurawiem’s board. It looks suspiciously like yours.',
    needs: 'special',
    days: 7,
    rivalSide: { copySpecial: true },
    answers: [
      {
        label: 'Tell everyone it’s yours',
        result: 'Flyers all over the Old Town: “The original, since this summer.”',
        effects: { cash: -300, awareness: { tourists: 5, students: 5, locals: 5, office: 5, foodies: 5 } },
      },
      {
        label: 'Take it as a compliment',
        result: 'You send Pan Zbigniew your recipe card with a smile. The locals think that’s very classy.',
        effects: { reputation: { locals: 3 } },
      },
      {
        label: 'Let it be',
        result: 'There’s room on Gdańsk’s boards for two.',
        effects: {},
      },
    ],
    unanswered: 2,
  },
  lunchDeal: {
    rival: 'spichlerz',
    icon: '🌾',
    title: 'A lunch deal on Granary Island',
    text: 'Kuba and Ola at Spichlerz Bistro are offering office workers “Lunch in 15 minutes or it’s free” all week.',
    days: 7,
    rivalSide: { pull: { groups: ['office'], from: 11 * 60, until: 15 * 60, bonus: 1.2 } },
    answers: [
      {
        label: 'Lunchtime flyers',
        result: 'Flyers in every office lobby on Granary Island.',
        effects: { cash: -300, awareness: { office: 12 } },
      },
      {
        label: 'Cut your lunch set price',
        needs: 'lunchSet',
        result: 'Your lunch set is 20% cheaper from today.',
        effects: { lunchSetPrice: 0.8 },
      },
      {
        label: 'Let it be',
        result: 'Some office workers try the new deal. They’ll be back.',
        effects: {},
      },
    ],
    unanswered: 2,
  },
};
