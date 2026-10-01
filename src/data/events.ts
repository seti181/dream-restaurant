// Calendar events and cozy random events. See project.md section 6.10.
// The effects here belong to each event; how often random events happen is in balance.ts.

import type { GroupId } from './groups';
import type { LocationId } from './locations';

/** Multipliers on foot traffic while an event is on. */
export interface EventEffects {
  /** Everyone, everywhere. */
  traffic?: number;
  groups?: Partial<Record<GroupId, number>>;
  locations?: Partial<Record<LocationId, number>>;
}

// ---------- Calendar events (same dates every year) ----------

export type CalendarEventId =
  | 'easter'
  | 'majowka'
  | 'juwenalia'
  | 'corpusChristi'
  | 'summerHolidays'
  | 'tallShips'
  | 'fair'
  | 'cookOff';

export interface CalendarEvent {
  name: string;
  description: string;
  start: { month: number; day: number };
  end: { month: number; day: number };
  effects: EventEffects;
}

export const CALENDAR_EVENT_IDS: readonly CalendarEventId[] = [
  'easter', 'majowka', 'juwenalia', 'corpusChristi', 'summerHolidays', 'tallShips', 'fair', 'cookOff',
];

export const CALENDAR_EVENTS: Record<CalendarEventId, CalendarEvent> = {
  easter: {
    name: 'Easter week',
    description: 'Families are out together, hungry for żurek and a slice of mazurek.',
    start: { month: 4, day: 15 },
    end: { month: 4, day: 21 },
    effects: { groups: { locals: 1.4 } },
  },
  majowka: {
    name: 'Majówka',
    description: 'The long May weekend! Visitors from all over Poland fill the Old Town.',
    start: { month: 5, day: 1 },
    end: { month: 5, day: 3 },
    effects: { groups: { tourists: 1.8 } },
  },
  juwenalia: {
    name: 'Juwenalia',
    description: 'Students take over the city for their spring festival. Hungry, cheerful and on a budget.',
    start: { month: 5, day: 16 },
    end: { month: 5, day: 19 },
    effects: { groups: { students: 2 } },
  },
  corpusChristi: {
    name: 'Corpus Christi long weekend',
    description: 'A long weekend, and it feels like everyone is in town.',
    start: { month: 6, day: 20 },
    end: { month: 6, day: 23 },
    effects: { traffic: 1.3 },
  },
  summerHolidays: {
    name: 'Summer holidays',
    description: 'Schools are out! Tourists arrive for the summer, and families have time to eat out.',
    start: { month: 6, day: 28 },
    end: { month: 8, day: 31 },
    effects: { groups: { tourists: 1.2 } },
  },
  tallShips: {
    name: 'Tall ships festival',
    description: 'Tall ships sail up the Motława. The waterfront by the Crane is packed.',
    start: { month: 7, day: 11 },
    end: { month: 7, day: 14 },
    effects: { groups: { tourists: 1.3 }, locations: { pobrzeze: 2 } },
  },
  fair: {
    name: 'St. Dominic’s Fair',
    description: 'Jarmark św. Dominika! Stalls from the Crane to the Green Gate, and crowds everywhere.',
    start: { month: 7, day: 27 },
    end: { month: 8, day: 18 },
    effects: { traffic: 1.7 },
  },
  cookOff: {
    name: 'The Fair cook-off',
    description:
      'Pan Zbigniew’s żurek against Nonna Rosa’s minestrone on Długi Targ. Pani Halina judges, Kuba and Ola heckle. ' +
      'Everyone is talking about food today.',
    start: { month: 8, day: 10 },
    end: { month: 8, day: 10 },
    effects: { traffic: 1.1 },
  },
};

// ---------- Random events ----------

export type RandomEventId =
  | 'tourBus'
  | 'foodCritic'
  | 'newspaper'
  | 'supplierDiscount'
  | 'streetWorks'
  | 'wedding'
  | 'birthday'
  | 'seagull';

export interface RandomEvent {
  name: string;
  /** A few ways of telling the news; one is picked at random. */
  descriptions: string[];
  /** How likely this event is compared with the others. */
  weight: number;
  /** How many days it lasts. */
  days: number;
  /** A group that comes straight to the player's restaurant (fewer if there aren't enough seats). */
  booking?: { group: GroupId; size: number; hour: number; critic?: boolean };
  /** Awareness points added with every group, once. */
  awareness?: number;
  /** Multiplies ingredient costs while it lasts. */
  ingredientCost?: number;
  /** Multiplies foot traffic on the player's street while it lasts. */
  streetTraffic?: number;
  /** Złoty gained or lost, once. */
  cash?: number;
}

export const RANDOM_EVENT_IDS: readonly RandomEventId[] = [
  'tourBus', 'foodCritic', 'newspaper', 'supplierDiscount', 'streetWorks', 'wedding', 'birthday', 'seagull',
];

export const RANDOM_EVENTS: Record<RandomEventId, RandomEvent> = {
  tourBus: {
    name: 'A tour bus!',
    descriptions: [
      'A coach full of hungry tourists has booked your place for lunch at 13:00.',
      'A tour group from Kraków has booked lunch at 13:00. Their guide promised them “the real Gdańsk”.',
      'A coach of Swedish cruise passengers has booked your tables for 13:00. They have heard about the żurek.',
    ],
    weight: 3,
    days: 1,
    booking: { group: 'tourists', size: 12, hour: 13 },
  },
  foodCritic: {
    name: 'A food critic is in town',
    descriptions: [
      'The Baltic Gourmet column’s critic is dining with you tonight. No pressure.',
      'Rumour has it the Baltic Gourmet critic has booked a table for 19:00 under a false name. Watch out for berets.',
      'The Baltic Gourmet critic is coming at 19:00. Mewa has promised to behave.',
    ],
    weight: 1,
    days: 1,
    booking: { group: 'foodies', size: 1, hour: 19, critic: true },
  },
  newspaper: {
    name: 'In the newspaper',
    descriptions: [
      'The local paper ran a little feature about you. People are curious!',
      'Dziennik Bałtycki printed a photo of your front door. Half of Gdańsk now knows where you are.',
      'A radio presenter mentioned your restaurant on the morning show. People are curious!',
    ],
    weight: 2,
    days: 1,
    awareness: 12,
  },
  supplierDiscount: {
    name: 'Supplier discount week',
    descriptions: [
      'Your supplier has too many potatoes and a kind heart: ingredients are 30% cheaper this week.',
      'The market had a bumper harvest: ingredients are 30% cheaper this week.',
      'Your supplier’s daughter just got married and he is feeling generous: ingredients are 30% cheaper this week.',
    ],
    weight: 2,
    days: 7,
    ingredientCost: 0.7,
  },
  streetWorks: {
    name: 'Street works',
    descriptions: [
      'The cobbles on your street are being relaid. Fewer people walk past for a few days.',
      'Workmen are digging up your street. Again. Fewer people walk past for a few days.',
      'A water pipe burst under your street. Fewer people walk past while it’s fixed.',
    ],
    weight: 2,
    days: 3,
    streetTraffic: 0.6,
  },
  wedding: {
    name: 'A wedding party',
    descriptions: [
      'A wedding party has booked your dining room for 17:00. Get the kompot ready!',
      'A young couple from Oliwa are celebrating their wedding with you at 17:00. Babcia will be inspecting the pierogi.',
      'A wedding party is coming at 17:00, straight from St. Mary’s. Expect dancing.',
    ],
    weight: 1,
    days: 1,
    booking: { group: 'locals', size: 16, hour: 17 },
  },
  birthday: {
    name: 'A regular’s birthday',
    descriptions: [
      'One of your regulars is celebrating with family tonight at 19:00.',
      'A regular is turning seventy and wants to celebrate with you at 19:00. There will be singing.',
      'A regular has booked a birthday table for 19:00. They asked for “the usual, times six”.',
    ],
    weight: 2,
    days: 1,
    booking: { group: 'locals', size: 6, hour: 19 },
  },
  seagull: {
    name: 'Seagull thief',
    descriptions: [
      'A seagull swooped in and stole a pieróg straight off a plate. The guest laughed; you brought them a new one.',
      'A seagull snatched a whole schabowy from a table by the window and flew off towards the Crane. You made another.',
      'A seagull walked in, took a bread roll from the counter and walked out again. Mewa says it was her cousin.',
    ],
    weight: 3,
    days: 1,
    cash: -9,
  },
};
