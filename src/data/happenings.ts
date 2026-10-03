// Small things going on in town that change who is out for one day: a cruise ship,
// a Lechia match, a conference. One may come up each evening, and the day report's
// forecast tells the player about it. How often is tuned in balance.ts (balance.forecast).
// See project.md section 6.15, A1.

import type { GroupId } from './groups';
import type { Weather } from './weather';

export type HappeningId =
  | 'cruiseShip'
  | 'examsOver'
  | 'lechiaMatch'
  | 'conference'
  | 'foodBloggers'
  | 'beachDay'
  | 'lateTrains'
  | 'openAirConcert'
  | 'earlyFriday';

export interface Happening {
  icon: string;
  /** The line in the forecast (and on the Today tab the next morning). */
  text: string;
  /** A few words for the one-line teaser at the top of the day report. */
  short: string;
  /** Multiplies how many of each group are out that day. */
  groups: Partial<Record<GroupId, number>>;
  /** How likely this one is compared with the others. */
  weight: number;
  /** Only on these weekdays (0 = Monday … 6 = Sunday). */
  weekdays?: number[];
  /** Only in this weather (as forecast). */
  weather?: Weather[];
}

export const HAPPENING_IDS: readonly HappeningId[] = [
  'cruiseShip', 'examsOver', 'lechiaMatch', 'conference', 'foodBloggers', 'beachDay', 'lateTrains', 'openAirConcert',
  'earlyFriday',
];

export const HAPPENINGS: Record<HappeningId, Happening> = {
  cruiseShip: {
    icon: '🚢',
    text: 'A cruise ship docks at Westerplatte: lots of tourists come into town.',
    short: 'a cruise ship docks',
    groups: { tourists: 1.5 },
    weight: 3,
  },
  examsOver: {
    icon: '🎓',
    text: 'The summer exam retakes are over: students are out celebrating.',
    short: 'students celebrate the end of exams',
    groups: { students: 1.6 },
    weight: 2,
    weekdays: [0, 1, 2, 3, 4],
  },
  lechiaMatch: {
    icon: '⚽',
    text: 'Lechia play at home: locals eat out before the match.',
    short: 'Lechia play at home',
    groups: { locals: 1.35 },
    weight: 2,
    weekdays: [2, 5, 6],
  },
  conference: {
    icon: '💼',
    text: 'A big conference at AmberExpo: office workers come into the Old Town for lunch.',
    short: 'a big conference is in town',
    groups: { office: 1.5 },
    weight: 2,
    weekdays: [0, 1, 2, 3],
  },
  foodBloggers: {
    icon: '📸',
    text: 'Food bloggers meet on Długi Targ: foodies are out hunting for a good plate.',
    short: 'food bloggers are out',
    groups: { foodies: 1.5 },
    weight: 2,
  },
  beachDay: {
    icon: '🏖️',
    text: 'Perfect beach weather: many locals head for the sea at Brzeźno instead.',
    short: 'locals head for the beach',
    groups: { locals: 0.75 },
    weight: 2,
    weather: ['sunny', 'heatwave'],
  },
  lateTrains: {
    icon: '🚆',
    text: 'Trains from Warsaw are running late: fewer day-trippers.',
    short: 'trains from Warsaw run late',
    groups: { tourists: 0.8 },
    weight: 1,
  },
  openAirConcert: {
    icon: '🎻',
    text: 'An open-air concert on Ołowianka: tourists and foodies are out and about.',
    short: 'an open-air concert on Ołowianka',
    groups: { tourists: 1.15, foodies: 1.3 },
    weight: 2,
  },
  earlyFriday: {
    icon: '🏃',
    text: 'Offices close early for the weekend: fewer office workers about.',
    short: 'offices close early',
    groups: { office: 0.7 },
    weight: 2,
    weekdays: [4],
  },
};
