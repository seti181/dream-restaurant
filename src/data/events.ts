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
  description: string;
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
    description: 'A coach full of hungry tourists has booked your place for lunch at 13:00.',
    weight: 3,
    days: 1,
    booking: { group: 'tourists', size: 12, hour: 13 },
  },
  foodCritic: {
    name: 'A food critic is in town',
    description: 'The Baltic Gourmet column’s critic is dining with you tonight. No pressure.',
    weight: 1,
    days: 1,
    booking: { group: 'foodies', size: 1, hour: 19, critic: true },
  },
  newspaper: {
    name: 'In the newspaper',
    description: 'The local paper ran a little feature about you. People are curious!',
    weight: 2,
    days: 1,
    awareness: 12,
  },
  supplierDiscount: {
    name: 'Supplier discount week',
    description: 'Your supplier has too many potatoes and a kind heart: ingredients are 30% cheaper this week.',
    weight: 2,
    days: 7,
    ingredientCost: 0.7,
  },
  streetWorks: {
    name: 'Street works',
    description: 'The cobbles on your street are being relaid. Fewer people walk past for a few days.',
    weight: 2,
    days: 3,
    streetTraffic: 0.6,
  },
  wedding: {
    name: 'A wedding party',
    description: 'A wedding party has booked your dining room for 17:00. Get the kompot ready!',
    weight: 1,
    days: 1,
    booking: { group: 'locals', size: 16, hour: 17 },
  },
  birthday: {
    name: 'A regular’s birthday',
    description: 'One of your regulars is celebrating with family tonight at 19:00.',
    weight: 2,
    days: 1,
    booking: { group: 'locals', size: 6, hour: 19 },
  },
  seagull: {
    name: 'Seagull thief',
    description:
      'A seagull swooped in and stole a pieróg straight off a plate. The guest laughed; you brought them a new one.',
    weight: 3,
    days: 1,
    cash: -9,
  },
};
