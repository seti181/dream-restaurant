// Mewa the seagull: tutorial tips, weekly goals and the help book. See project.md section 6.11.

import type { Category } from './dishes';
import type { GroupId } from './groups';

// ---------- Tutorial tips (the first three days) ----------

export type TipId = 'welcome' | 'speed' | 'report' | 'prices' | 'hiring' | 'helpTables' | 'happyHour' | 'farewell' | 'daysOff' | 'training' | 'special' | 'replies' | 'flyers';

export interface Tip {
  /** When the tip appears: on this day, on this screen. */
  day: number;
  screen: 'plan' | 'open' | 'dayOver';
  text: string;
}

export const TIP_IDS: readonly TipId[] = ['welcome', 'speed', 'report', 'prices', 'hiring', 'helpTables', 'happyHour', 'farewell', 'daysOff', 'training', 'special', 'replies', 'flyers'];

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
      'Tap 2× or 4× in the bottom corner if you’re impatient. I always am.',
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
  daysOff: {
    day: 4,
    screen: 'plan',
    text:
      'Your team works every day, and it shows. Tired people cook and serve a little slower. ' +
      'Give someone a day off in the Staff tab on a quiet day, when someone else can cover.',
  },
  flyers: {
    day: 3,
    screen: 'open',
    text:
      'See the people walking past? Tap one to hand them a flyer. Some will come in, and the rest will remember you. ' +
      'You have a few every day.',
  },
  replies: {
    day: 3,
    screen: 'dayOver',
    text:
      'Not every review is kind. Tap “Reply…” under an unhappy one: a kind answer can win a guest back. ' +
      'Arguing with them, less so.',
  },
  special: {
    day: 6,
    screen: 'plan',
    text:
      'Summer in Gdańsk means fresh chanterelles and blueberries! Add some in the dish creator, then tap ☆ in the Menu tab ' +
      'to make a dish today’s special. It goes on the board outside, and fresh produce on it tempts people in.',
  },
  training: {
    day: 9,
    screen: 'plan',
    text:
      'Good people can get even better. In the Staff tab, send someone on a one-day course for skill or speed. ' +
      'Afterwards they’re worth a little more, so remember the raise, or they’ll tire faster.',
  },
  helpTables: {
    day: 1,
    screen: 'open',
    text:
      'Tap any table that’s still waiting for food! Show them to their favourite spot (tourists love the ' +
      'terrace, locals the quiet back), give a free drink if they’re ⏳ or 😤, or ask the chef to come out ' +
      'and apologise. Happy guests, happy reviews.',
  },
  happyHour: {
    day: 2,
    screen: 'open',
    text:
      'Quiet afternoon? Tap 🍹 Happy hour down in the corner: an hour of cheaper food and drinks, and people ' +
      'flock in. Only once a day, so save it for when the tables are empty.',
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
  { kind: 'serveGuests', text: 'Serve {n} guests this week', target: 250, reward: 500 },
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
    title: 'Morale and days off',
    text: 'Every day of work tires people a little; a day off puts them right. Below 40 morale, someone is tired and works a little slower. Below 15 they’re worn out and may stay in bed, if someone else can do their job. Cheerful people tire more slowly. Days off are paid, and someone has to be left to cook and to serve.',
  },
  {
    title: 'Fresh produce and today’s special',
    text: 'Some extras are fresh produce with a season: strawberries early in July, new potatoes until August, blueberries and chanterelles all summer, plums from mid-August. In season they make a dish taste better; out of season they’re imported, dearer and not as good. One dish a day can be today’s special, “Dziś polecamy”, on the board outside: more guests order it, it tempts people walking by, and fresh produce on it tempts them more.',
  },
  {
    title: 'Flyers',
    text: 'While the restaurant is open, tap someone walking past to hand them a flyer: a few a day. The better their group likes you, the more likely they are to come in, with their friends. Everyone who takes one has heard of you afterwards.',
  },
  {
    title: 'Replying to reviews',
    text: 'Unhappy reviews (one or two stars) can be answered in the day report. Thanking them kindly wins their group back a little; inviting them back for a free dessert costs a little and wins back more; standing your ground makes things worse. One reply per review.',
  },
  {
    title: 'Training and fair wages',
    text: 'A one-day course makes someone a level better in skill or speed. The higher the level, the dearer the course, and they’re away that day. A better person is worth a higher wage: until you give them the raise, they tire faster.',
  },
  {
    title: 'Regulars',
    text: 'A few guests come back every week on their own day, each hoping for one thing: a soup, pierogi, the lunch set, or a main a student can afford. Each visit tells the next part of their story in the day report. Make them happy and their friends like you more; make them happy often enough and they become friends of the house.',
  },
  {
    title: 'Bookings',
    text: 'A few times a week someone asks to book: a party for a table, or a big order the kitchen cooks ahead. Accept or decline on the Today tab by the evening before. A party’s tables are kept free for a while before they come, and they tip when their wish is on the menu and they enjoy it. A big order keeps a chef busy before it’s due, and falls through if nothing on the menu fits. Letting a booking down disappoints their group.',
  },
  {
    title: 'The Golden Neptune',
    text: 'Awarded on the last day of St. Dominic’s Fair to the Old Town’s favourite restaurant. Neptune Score = 60% average rating through the season + 40% of all Old Town guests served during the Fair.',
  },
];
