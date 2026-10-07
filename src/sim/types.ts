// Shapes of the simulation's state. Everything here is plain data so it can be saved as JSON.

import type { MenuWant } from '../data/bookings';
import type { WishId } from '../data/wishes';
import type { Cuisine, EquipmentId, ExtraId, MenuDish } from '../data/dishes';
import type { DecorId } from '../data/decor';
import type { GroupId } from '../data/groups';
import type { LocationId } from '../data/locations';
import type { GoodId } from '../data/market';
import type { MarketPrices } from './market';
import type { SpecialStaffId } from '../data/personal';
import type { RegularId } from '../data/regulars';
import type { TraitId } from '../data/staff';
import type { Weather } from '../data/weather';

export type Role = 'chef' | 'waiter';

/** Where ingredients come from. Premium is better and dearer. */
export type Supplier = 'market' | 'premium';

/** What the simulation needs to know about a chef or waiter. Skill and speed run from 1 to 5. */
export interface Staff {
  skill: number;
  speed: number;
  trait?: TraitId;
  /** Chefs only. */
  specialty?: Cuisine;
  /** One of the two waiters from section 10; only the restaurant view uses it. */
  special?: SpecialStaffId;
  /** Which face they have (their employee number): only the pictures use it. */
  look?: number;
}

/** One of the player's staff, or a job candidate. */
export interface Employee extends Staff {
  id: number;
  role: Role;
  name: string;
  bio: string;
  /** Złoty per day. */
  wage: number;
  /** How they feel about the job, 0–100 (see balance.staff.morale). */
  morale: number;
  /** A day they have off (the day number), if one is planned. */
  dayOff?: number;
  /** The day they joined the team (stories count from it). */
  since?: number;
  /** For the team you start with: who they are, for their story (data/teamStories.ts). */
  starter?: 'krystyna' | 'kacper';
  /** A one-day course they're booked on: the day, and what it improves. */
  course?: { day: number; stat: 'skill' | 'speed' };
}

/** The player's restaurant or a rival. Both follow exactly the same rules. */
export interface Restaurant {
  /** 'player' or a rival id. */
  id: string;
  name: string;
  location: LocationId;
  menu: MenuDish[];
  /** Kitchen equipment owned; dishes that need other equipment can't be cooked. */
  equipment: EquipmentId[];
  supplier: Supplier;
  /** When today's happy hour started (minutes after midnight); only set while a day runs. See balance.happyHour. */
  happyHourFrom?: number;
  /** Samples at the door: when they went out, how good they taste, and the dish (a recipe key); only set while a day runs (sim/samples.ts). */
  samples?: { from: number; until: number; quality: number; dish: string };
  /** A rival move's effects on this restaurant, only set while that day runs (see sim/rivalMoves.ts): */
  /** menu prices multiplied by this (a price war)... */
  priceFactor?: number;
  /** ...these groups tempted more between these times (a lunch deal)... */
  pull?: { groups: GroupId[]; from: number; until: number; bonus: number };
  /** ...and every guest this much happier (free kompot). */
  moodBonus?: number;
  /** Tonight's theme night, from its start: only set on the day it's on, while that day runs. */
  themeNight?: { from: number; groups: GroupId[]; wants?: MenuWant; mood?: number };
  /** "Dziś polecamy": today's special on the board outside (a recipe key), if one is chosen. */
  special?: string;
  /** "Obiad dnia": a soup and a main (identified by recipe key) at one price, or null. */
  lunchSet: { soup: string; main: string; price: number } | null;
  tables: number;
  /** Terrace tables in use today (0 when closed). Set each morning when the restaurant opens. */
  terraceTables: number;
  /** Decor items bought. */
  decor: DecorId[];
  chefs: Staff[];
  waiters: Staff[];
  /** 0–100. */
  ambiance: number;
  /** 0–100 for each group. */
  reputation: Record<GroupId, number>;
  /** 0–100 for each group: how many have heard of this place. */
  awareness: Record<GroupId, number>;
}

/** A group of guests walking through the Old Town, looking for a meal. */
export interface Party {
  group: GroupId;
  size: number;
  /** The street where they start looking. */
  origin: LocationId;
  /** Minutes after midnight. */
  arrivalMinute: number;
  /** For a party that booked ahead: the restaurant it goes straight to. */
  bookedAt?: string;
  /** A food critic, whose review counts for much more. */
  critic?: boolean;
  /** The Friday regular, who always wants cytrynówka with his dish. */
  regular?: boolean;
  /** One of the named regulars with a story (data/regulars.ts). */
  regularId?: RegularId;
  /** A party that booked through a request the player accepted: which one (see sim/bookings.ts). */
  requestId?: number;
  /** What a party that booked hopes to find on the menu. */
  wish?: MenuWant;
  /** They tasted the player's samples at the door on their way past: they know the place now. */
  tasted?: boolean;
}

/** A review left by a guest. */
export interface Review {
  /** 1 to 5. */
  stars: number;
  text: string;
  /** "a student", "a local family"... */
  reviewer: string;
  critic: boolean;
  /** The guest's group, so a reply to the review reaches them. */
  group?: GroupId;
}

/** A party that booked ahead, e.g. a tour bus or a wedding. */
export interface Booking {
  restaurant: string;
  group: GroupId;
  size: number;
  /** Minutes after midnight. */
  minute: number;
  critic: boolean;
  regular?: boolean;
  regularId?: RegularId;
  /** A booking request the player accepted (see sim/bookings.ts): tables are held for them. */
  requestId?: number;
  /** What they hope to find on the menu. */
  wish?: MenuWant;
}

/** Portions a chef cooks ahead for a big order the player accepted, ready by a set time. */
export interface BigOrder {
  restaurant: string;
  requestId: number;
  /** When it should be ready, in minutes after midnight. */
  minute: number;
  portions: number;
  /** The kind of dish they ordered. */
  needs: MenuWant;
}

/** Everything about a day that isn't the restaurants: weather, events and bookings. */
export interface DayConditions {
  weather: Weather;
  /** Multiplies foot traffic everywhere. */
  traffic: number;
  /** Multiplies foot traffic of each group (1 if missing). */
  groups: Partial<Record<GroupId, number>>;
  /** Multiplies foot traffic on each street (1 if missing). */
  locations: Partial<Record<LocationId, number>>;
  bookings: Booking[];
  bigOrders: BigOrder[];
  /** Multiplies ingredient costs for a restaurant id (1 if missing). */
  ingredientCost: Record<string, number>;
  /** Fresh produce in season today (see the extras in data/dishes.ts). */
  inSeason: ExtraId[];
  /** This week's trend: one group craves something (data/trends.ts). */
  trend?: TrendToday | null;
  /** This morning's market prices for each good, compared with usual (sim/market.ts; usual if missing)... */
  prices?: MarketPrices;
  /** ...and its deals: a special made of one of them is fresh from the market. */
  deals?: GoodId[];
}

/** What a weekly trend does: this group craves dishes that are what they want. */
export interface TrendToday {
  group: GroupId;
  wants: MenuWant;
}

/** Each factor runs from -1 (awful) through 0 (fine) to +1 (wonderful). */
export interface SatisfactionFactors {
  quality: number;
  value: number;
  wait: number;
  ambiance: number;
  service: number;
}

/**
 * What happened to one party. Logged for every party so reports and reviews
 * can explain why things happened.
 */
export interface PartyOutcome {
  /** Restaurant id, or null if the party went somewhere else entirely. */
  restaurant: string | null;
  group: GroupId;
  size: number;
  kind: 'served' | 'walkedOut' | 'noTable' | 'elsewhere';
  order: MenuDish[];
  revenue: number;
  ingredientCost: number;
  /** Minutes from sitting down to the food arriving (or to giving up). */
  waitMinutes: number;
  /** 0–100; null when the party never sat down. */
  satisfaction: number | null;
  /** Only for served parties. */
  factors: SatisfactionFactors | null;
  /** Some parties leave a review. */
  review: Review | null;
  /** For a named regular: who it was, and whether their wish came true. */
  regularVisit?: { id: RegularId; wishMet: boolean };
  /** For a party that booked through a request: which one, and whether their wish was on the menu. */
  booking?: { id: number; wishMet: boolean };
  /** Served parties: when their food arrived (minutes after midnight). */
  servedAt?: number;
  /** A party that walked in hoping for something (data/wishes.ts), and whether the menu had it. */
  wish?: { id: WishId; met: boolean };
}
