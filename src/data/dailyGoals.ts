// Mewa's daily mini-goals: one small goal each morning, next to the weekly one, with a small
// reward. How each is counted is in sim/dailyGoals.ts. See project.md section 6.15, A3.

export type DailyGoalId =
  | 'soupsBeforeTwo'
  | 'nobodyWalksOut'
  | 'happyFoodie'
  | 'specialPortions'
  | 'desserts'
  | 'dinnerGuests'
  | 'fullHouse'
  | 'quickStreak'
  | 'takings'
  | 'lunchSets';

export interface DailyGoal {
  icon: string;
  /** The goal in a sentence; {n} is the target. */
  text: string;
  /** A few words for the box at the top of the day screen. */
  short: string;
  /** The target for each table inside (rounded, and at least `min`)... */
  perTable?: number;
  min?: number;
  /** ...or the same target whatever the size of the room. */
  fixed?: number;
  /** A target this many times yesterday's (takings), when there was a yesterday. */
  beatYesterday?: number;
  /** Złoty Mewa drops at the door when it's done. */
  reward: number;
  /** Only when the menu has this this morning. */
  needs?: 'soup' | 'dessert' | 'special' | 'lunchSet';
  /** It can still go wrong until closing, so it's only settled then. */
  atClosing?: boolean;
}

export const DAILY_GOAL_IDS: readonly DailyGoalId[] = [
  'soupsBeforeTwo', 'nobodyWalksOut', 'happyFoodie', 'specialPortions', 'desserts', 'dinnerGuests', 'fullHouse',
  'quickStreak', 'takings', 'lunchSets',
];

export const DAILY_GOALS: Record<DailyGoalId, DailyGoal> = {
  soupsBeforeTwo: {
    icon: '🥣',
    text: 'Sell {n} soups before 14:00',
    short: 'soups before 14:00',
    perTable: 1.25,
    min: 4,
    reward: 200,
    needs: 'soup',
  },
  nobodyWalksOut: {
    icon: '🤝',
    text: 'Nobody walks out today',
    short: 'nobody walks out',
    fixed: 0,
    reward: 250,
    atClosing: true,
  },
  happyFoodie: {
    icon: '🧐',
    text: 'Make a foodie happy',
    short: 'a happy foodie',
    fixed: 1,
    reward: 200,
  },
  specialPortions: {
    icon: '⭐',
    text: 'Sell {n} portions of today’s special',
    short: 'portions of the special',
    perTable: 2.5,
    min: 8,
    reward: 200,
    needs: 'special',
  },
  desserts: {
    icon: '🍰',
    text: 'Sell {n} desserts',
    short: 'desserts sold',
    perTable: 2,
    min: 6,
    reward: 200,
    needs: 'dessert',
  },
  dinnerGuests: {
    icon: '🌙',
    text: 'Serve {n} guests at dinner, from 18:00',
    short: 'guests at dinner',
    perTable: 4,
    min: 12,
    reward: 250,
  },
  fullHouse: {
    icon: '🪑',
    text: 'Fill every table at once before 14:00',
    short: 'every table full by 14:00',
    fixed: 1,
    reward: 200,
  },
  quickStreak: {
    icon: '⚡',
    text: 'Serve {n} tables quickly in a row',
    short: 'quick tables in a row',
    fixed: 5,
    reward: 250,
  },
  takings: {
    icon: '💰',
    text: 'Take {n} zł today',
    short: 'takings',
    perTable: 500,
    min: 1500,
    beatYesterday: 1.1,
    reward: 150,
  },
  lunchSets: {
    icon: '🍽️',
    text: 'Sell {n} lunch sets',
    short: 'lunch sets',
    perTable: 2,
    min: 6,
    reward: 150,
    needs: 'lunchSet',
  },
};
