// Mewa the seagull: tutorial tips, weekly goals and the help book. See project.md section 6.11.

import type { Category } from './dishes';
import type { GroupId } from './groups';

// ---------- Tutorial tips (the first three days) ----------

export type TipId = 'welcome' | 'speed' | 'report' | 'prices' | 'hiring' | 'farewell';

export interface Tip {
  /** When the tip appears: on this day, on this screen. */
  day: number;
  screen: 'plan' | 'open' | 'dayOver';
  text: string;
}

export const TIP_IDS: readonly TipId[] = ['welcome', 'speed', 'report', 'prices', 'hiring', 'farewell'];

export const TIPS: Record<TipId, Tip> = {
  welcome: {
    day: 0,
    screen: 'plan',
    text:
      'Cześć! I’m Mewa, the cheekiest seagull in Gdańsk. This little place is yours now! ' +
      'Have a look around the tabs, then tap “Open the restaurant” when you’re ready. ' +
      'I’ll be right here. Probably eating something.',
  },
  speed: {
    day: 0,
    screen: 'open',
    text:
      'The day is on! Guests pick where to eat by taste, price, reputation and how close you are. ' +
      'Tap 2× or 4× up top if you’re impatient. I always am.',
  },
  report: {
    day: 0,
    screen: 'dayOver',
    text:
      'Your first daily report! Read what guests said and the reviews: they tell you what to fix. ' +
      'Then money in, money out, and how each kind of guest feels about you.',
  },
  prices: {
    day: 1,
    screen: 'plan',
    text:
      'Today, try the Menu tab. Every dish shows what it usually sells for in the Old Town. ' +
      'Cheaper pulls in students; dearer earns more per plate. Small steps!',
  },
  hiring: {
    day: 2,
    screen: 'plan',
    text:
      'One chef cooks one order at a time. If guests walk out waiting, the Staff tab has people ' +
      'looking for work. New faces turn up every Monday.',
  },
  farewell: {
    day: 2,
    screen: 'dayOver',
    text:
      'That’s the basics! From now on I’ll drop by every Monday with a little goal. ' +
      'If anything is a mystery, my help book is on the Mewa tab. Smacznego!',
  },
};

// ---------- Weekly goals ----------

export type GoalKind =
  | 'serveGuests'
  | 'serveGroup'
  | 'fiveStarReview'
  | 'menuCategory'
  | 'weekProfit'
  | 'lunchSets'
  | 'happiness';

export interface Goal {
  kind: GoalKind;
  /** {n} is the target. */
  text: string;
  target: number;
  /** Złoty Mewa drops at your door when it's done. */
  reward: number;
  group?: GroupId;
  category?: Category;
}

/** The first goal, on the first Monday. */
export const FIRST_GOAL = 0;

export const GOALS: Goal[] = [
  { kind: 'serveGuests', text: 'Serve {n} guests this week', target: 300, reward: 500 },
  { kind: 'serveGroup', group: 'office', text: 'Serve {n} office workers this week', target: 40, reward: 500 },
  { kind: 'serveGroup', group: 'students', text: 'Serve {n} students this week', target: 60, reward: 500 },
  { kind: 'serveGroup', group: 'tourists', text: 'Serve {n} tourists this week', target: 80, reward: 600 },
  { kind: 'serveGroup', group: 'foodies', text: 'Serve {n} foodies this week', target: 15, reward: 600 },
  { kind: 'fiveStarReview', text: 'Earn a 5-star review', target: 1, reward: 400 },
  { kind: 'menuCategory', category: 'dessert', text: 'Put a dessert on the menu', target: 1, reward: 500 },
  { kind: 'weekProfit', text: 'Make {n} zł profit this week', target: 5_000, reward: 600 },
  { kind: 'lunchSets', text: 'Sell {n} lunch sets this week', target: 25, reward: 500 },
  { kind: 'happiness', text: 'Keep average happiness at {n} or more this week', target: 60, reward: 500 },
];

// ---------- The help book ----------

export const HELP: { title: string; text: string }[] = [
  {
    title: 'Cash',
    text: 'Your money. Takings come in as guests pay; ingredients and wages go out every day, rent and utilities every Monday. Keep an eye on it: if it runs out at the end of a day, the restaurant has to close for good.',
  },
  {
    title: 'Rating ★',
    text: 'How well thought of you are overall, from 0 to 5 stars. It’s the average of your reputation with all five kinds of guests.',
  },
  {
    title: 'Reputation',
    text: 'What each kind of guest thinks of you, from 0 to 100. Every visit nudges it a little towards how happy that party was. Food critics nudge it a lot.',
  },
  {
    title: 'Awareness',
    text: 'How many people of each kind have heard of you. Nobody visits a place they’ve never heard of. Marketing raises it; it fades slowly afterwards.',
  },
  {
    title: 'Happiness',
    text: 'How a party felt after eating, from 0 to 100. It comes from five things: the food compared with what they expected, value for money, how long they waited, how cosy the room is, and the service.',
  },
  {
    title: 'Customer groups',
    text: 'Tourists love location and Polish classics. Students count every złoty. Locals and families want good, homely food. Office workers want it fast at lunchtime. Foodies want something special and will pay for it.',
  },
  {
    title: 'Chefs and waiters',
    text: 'Skill makes better food or service; speed makes it faster. Traits nudge both. A chef cooking their specialty cuisine does it better. One chef cooks one order at a time.',
  },
  {
    title: 'Dishes and pairings',
    text: 'Every dish has taste tags that some guests love. Extras add tags and cost, and some extras go together beautifully. Others really don’t. Guests will drop hints.',
  },
  {
    title: 'Lunch set (Obiad dnia)',
    text: 'A soup and a main at one price from 12:00 to 15:00. Office workers adore it; students and locals like it too.',
  },
  {
    title: 'Ambiance and decor',
    text: 'How cosy the room is, from 0 to 100. Decor raises it. Two items of one style give the room a style that certain guests love.',
  },
  {
    title: 'Terrace',
    text: 'Extra seats outside from May to September with a permit. Tourists love it. It stays closed when it rains.',
  },
  {
    title: 'Weather and events',
    text: 'Sun brings people out, rain keeps them home. Festivals bring crowds of particular guests. Check the Today tab each morning.',
  },
  {
    title: 'Rivals',
    text: 'Four friendly rivals compete for the same hungry guests. Every Monday each makes a move, and they notice when you win over their favourite customers.',
  },
  {
    title: 'The Golden Neptune',
    text: 'Awarded on the last day of St. Dominic’s Fair to the Old Town’s favourite restaurant. Neptune Score = 60% average rating through the season + 40% of all Old Town guests served during the Fair.',
  },
];
