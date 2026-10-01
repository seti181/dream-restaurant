// Choice cards: small moments during service that pause the clock and offer two answers.
// See project.md section 6.13. How many come each day is tuned in balance.ts.

import type { GroupId } from './groups';

export type MomentId =
  | 'blogger'
  | 'shower'
  | 'regularsRound'
  | 'adrianText'
  | 'tomekTray'
  | 'tourGroup'
  | 'stoLat'
  | 'busker';

/** What has to be true right now for a moment to happen. The simulation checks these. */
export type MomentNeed =
  /** A dessert on the menu. */
  | 'dessertOnMenu'
  /** At least one party waiting for its food. */
  | 'guestsWaiting'
  /** At least two parties inside. */
  | 'guestsIn'
  /** Guests sitting on the terrace. */
  | 'terraceGuests'
  /** A cloudy day (on a sunny day there's no shower; on a rainy one the terrace is closed). */
  | 'cloudy'
  /** Pan Cytrynówka is in. */
  | 'regularHere'
  /** Adrian didn't turn up today. */
  | 'adrianAway'
  /** Tomek is working today. */
  | 'tomekWorking'
  /** Two free tables. */
  | 'roomForSix';

/** What an answer does. Everything is optional; `result` says what happened. */
export interface MomentEffect {
  result: string;
  /** Złoty gained (or spent, if negative). */
  cash?: number;
  /** Złoty for every guest in the restaurant right now (a round on the house). */
  cashPerGuest?: number;
  /**
   * Points added to how happy guests end up (0–100), for guests still waiting for their food:
   * all of them, those on the terrace, or the one table the moment is about.
   */
  mood?: { who: 'waiting' | 'terrace' | 'one'; amount: number };
  /** Reputation points with each group. */
  reputation?: Partial<Record<GroupId, number>>;
  /** Awareness points with each group. */
  awareness?: Partial<Record<GroupId, number>>;
  /** Someone comes in to wait tables for the rest of the day. */
  helper?: { skill: number; speed: number };
  /** A group walks in right now. */
  walkIn?: { group: GroupId; size: number };
  /** Terrace guests move to free tables inside. */
  moveInside?: boolean;
  /** Every chef stops for this many minutes. */
  kitchenPause?: number;
  /** A gamble: the chance this answer works out, and what happens if it doesn't. */
  chance?: number;
  otherwise?: MomentEffect;
}

export interface MomentChoice {
  label: string;
  effect: MomentEffect;
}

export interface Moment {
  title: string;
  text: string;
  needs: MomentNeed[];
  /** A moment that belongs to one time of day comes then (if its needs are met); the others come at random times. */
  at?: { hour: number; minute: number };
  /** How likely a random moment is to be picked, compared with the others. */
  weight: number;
  /** The first answer is the "yes"; the second is what a player who doesn't help would choose. */
  choices: [MomentChoice, MomentChoice];
}

export const MOMENT_IDS: readonly MomentId[] = [
  'blogger',
  'shower',
  'regularsRound',
  'adrianText',
  'tomekTray',
  'tourGroup',
  'stoLat',
  'busker',
];

export const MOMENTS: Record<MomentId, Moment> = {
  blogger: {
    title: 'A food blogger',
    text: 'A food blogger with a very big camera asks if she could have a dessert on the house, “just for the photos”.',
    needs: ['dessertOnMenu'],
    weight: 3,
    choices: [
      {
        label: 'Of course!',
        effect: {
          cash: -30,
          awareness: { foodies: 4, students: 2 },
          result: 'Your dessert is all over social media tonight. Foodies and students have heard of you.',
        },
      },
      {
        label: 'Sorry, not today',
        effect: { result: 'She orders a coffee and photographs that instead. It’s a nice coffee.' },
      },
    ],
  },
  shower: {
    title: 'Clouds over the Motława',
    text: 'Dark clouds are rolling in, and the first drops are falling on the terrace!',
    needs: ['terraceGuests', 'cloudy'],
    weight: 4,
    choices: [
      {
        label: 'Bring them inside',
        effect: {
          moveInside: true,
          mood: { who: 'terrace', amount: -5 },
          result: 'Everyone carries their plates inside. Anyone who doesn’t fit gets an umbrella and a smile.',
        },
      },
      {
        label: 'It’ll pass',
        effect: {
          chance: 0.5,
          mood: { who: 'terrace', amount: 5 },
          result: 'It passed! The sun is back, and the terrace guests feel very lucky.',
          otherwise: {
            mood: { who: 'terrace', amount: -20 },
            reputation: { tourists: -1 },
            result: 'It did not pass. Soggy guests, soggy pierogi.',
          },
        },
      },
    ],
  },
  regularsRound: {
    title: 'A round for the room!',
    text:
      'Pan Cytrynówka stands up: “Cytrynówka for everyone!” Then he pats his pockets. ' +
      'He has forgotten his wallet. Again.',
    needs: ['regularHere'],
    at: { hour: 19, minute: 30 },
    weight: 0,
    choices: [
      {
        label: 'On the house!',
        effect: {
          cashPerGuest: -6,
          mood: { who: 'waiting', amount: 10 },
          reputation: { locals: 2 },
          result: 'The whole room raises a glass. “Na zdrowie!” The locals will talk about this for weeks.',
        },
      },
      {
        label: 'Put it on his tab',
        effect: { result: 'He promises to pay next Friday. He says that every Friday.' },
      },
    ],
  },
  adrianText: {
    title: 'A text from Adrian',
    text: '“almost there!! 5 min 🏃” The lunch rush is about to start. A friend could cover for him, for 250 zł.',
    needs: ['adrianAway'],
    at: { hour: 12, minute: 0 },
    weight: 0,
    choices: [
      {
        label: 'Call in a friend',
        effect: {
          cash: -250,
          helper: { skill: 3, speed: 3 },
          result: 'A friend of a friend arrives ten minutes later, apron already on. What a hero.',
        },
      },
      {
        label: 'Wait for Adrian',
        effect: { result: 'Adrian arrives at 21:55, just in time for the staff dinner.' },
      },
    ],
  },
  tomekTray: {
    title: 'CRASH!',
    text: 'Tomek has dropped a tray of kompot all over a table’s tablecloth. And a little bit on the guests.',
    needs: ['tomekWorking', 'guestsWaiting'],
    weight: 4,
    choices: [
      {
        label: 'Dessert on the house',
        effect: {
          cash: -40,
          mood: { who: 'one', amount: 5 },
          result: 'A free slice of cake makes everything better. They’re laughing about it now.',
        },
      },
      {
        label: 'Laugh it off',
        effect: {
          mood: { who: 'one', amount: -15 },
          result: 'They don’t laugh. Tomek does, which doesn’t help.',
        },
      },
    ],
  },
  tourGroup: {
    title: 'A tour group',
    text: 'A tour guide with a little flag pops in: “Can you fit six hungry tourists, right now?”',
    needs: ['roomForSix'],
    weight: 3,
    choices: [
      {
        label: 'Come in!',
        effect: {
          walkIn: { group: 'tourists', size: 6 },
          result: 'Six tourists squeeze in, cameras and all. The kitchen is about to get busy!',
        },
      },
      {
        label: 'Sorry, we’re full',
        effect: { result: 'They head off towards Długa. Maybe next time.' },
      },
    ],
  },
  stoLat: {
    title: 'A birthday',
    text: 'A family asks if the whole room could sing “Sto lat” for their grandma’s 80th birthday.',
    needs: ['guestsIn'],
    weight: 3,
    choices: [
      {
        label: 'Everyone sing!',
        effect: {
          kitchenPause: 5,
          mood: { who: 'waiting', amount: 8 },
          reputation: { locals: 2 },
          result: '“Sto lat, sto lat!” Grandma cries happy tears. The kitchen lost five minutes, and nobody minds.',
        },
      },
      {
        label: 'Just a candle',
        effect: { result: 'A candle on her plate. Grandma blows it out on the first try.' },
      },
    ],
  },
  busker: {
    title: 'An accordion player',
    text: 'An accordion player offers to play outside your door for the afternoon, for 150 zł.',
    needs: [],
    weight: 2,
    choices: [
      {
        label: 'Play us something!',
        effect: {
          cash: -150,
          mood: { who: 'waiting', amount: 5 },
          awareness: { tourists: 3, locals: 2 },
          result: 'Old Polish songs drift down the street. People stop to listen, and some of them peek in.',
        },
      },
      {
        label: 'No, thank you',
        effect: { result: 'He plays outside a rival’s door instead. It sounds lovely from here.' },
      },
    ],
  },
};
