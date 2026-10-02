// Shapes of the simulation's state. Everything here is plain data so it can be saved as JSON.

import type { Cuisine, EquipmentId, MenuDish } from '../data/dishes';
import type { DecorId } from '../data/decor';
import type { GroupId } from '../data/groups';
import type { LocationId } from '../data/locations';
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
}

/** One of the player's staff, or a job candidate. */
export interface Employee extends Staff {
  id: number;
  role: Role;
  name: string;
  bio: string;
  /** Złoty per day. */
  wage: number;
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
}

/** A review left by a guest. */
export interface Review {
  /** 1 to 5. */
  stars: number;
  text: string;
  /** "a student", "a local family"... */
  reviewer: string;
  critic: boolean;
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
  /** Multiplies ingredient costs for a restaurant id (1 if missing). */
  ingredientCost: Record<string, number>;
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
}
