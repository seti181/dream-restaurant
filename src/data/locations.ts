// The six Old Town locations. See project.md section 6.1.

import type { GroupId } from './groups';

export type LocationId = 'ogarna' | 'piwna' | 'mariacka' | 'dluga' | 'pobrzeze' | 'spichrzow';

export interface Location {
  name: string;
  blurb: string;
  rentPerDay: number;
  /** Hungry passers-by per hour at the busiest hour of an ordinary weekday. */
  peakGuestsPerHour: number;
  /** Foot traffic in words, for the map. */
  trafficLabel: string;
  /** Relative foot traffic for each opening hour, 11:00 first (1 = busiest). */
  hourCurve: readonly number[];
  /** Multiplier on Saturdays and Sundays. */
  weekendFactor: number;
  /** Multiplier for each month, January first. */
  monthFactors: readonly number[];
  /** Share of passers-by from each group. The shares add up to 1. */
  groupMix: Record<GroupId, number>;
  /** Most seats the room can hold. */
  maxSeats: number;
  /** Outdoor seats with a summer terrace permit. */
  terraceSeats: number;
  /** Pieces of kitchen equipment that fit, including the stove. */
  equipmentSlots: number;
  /** Tables the vaulted cellar holds, once it's been done up (building works, data/works.ts). */
  cellarTables: number;
  /** Position on the Old Town map in metres (x = east, y = north). */
  mapPosition: { x: number; y: number };
}

// Hour curves, one value per opening hour:
//   11:00 12:00 13:00 14:00 15:00 16:00 17:00 18:00 19:00 20:00 21:00
const LUNCH_AND_DINNER = [0.5, 0.8, 1.0, 0.8, 0.5, 0.4, 0.5, 0.8, 1.0, 0.8, 0.5];
const LUNCH_HEAVY = [0.6, 1.0, 1.0, 0.7, 0.4, 0.3, 0.4, 0.6, 0.7, 0.5, 0.3];
const EVENING_HEAVY = [0.3, 0.5, 0.6, 0.5, 0.4, 0.4, 0.6, 0.9, 1.0, 1.0, 0.7];
const ALL_DAY = [0.6, 0.8, 1.0, 0.9, 0.8, 0.7, 0.8, 0.9, 1.0, 0.8, 0.6];

const STEADY_YEAR = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
const WATERFRONT_YEAR = [0.6, 0.6, 0.7, 0.8, 0.9, 1.1, 1.3, 1.3, 1, 0.8, 0.6, 0.7];

export const LOCATION_IDS: readonly LocationId[] = [
  'ogarna', 'piwna', 'mariacka', 'dluga', 'pobrzeze', 'spichrzow',
];

export const LOCATIONS: Record<LocationId, Location> = {
  ogarna: {
    name: 'ul. Ogarna',
    blurb:
      'A quiet cobbled street just south of Długa. Cheap rent, loyal neighbours, ' +
      'and a cat who visits every windowsill.',
    rentPerDay: 600,
    peakGuestsPerHour: 30,
    trafficLabel: 'Low',
    hourCurve: LUNCH_AND_DINNER,
    weekendFactor: 1.1,
    monthFactors: STEADY_YEAR,
    groupMix: { tourists: 0.1, students: 0.35, locals: 0.45, office: 0.05, foodies: 0.05 },
    maxSeats: 24,
    terraceSeats: 8,
    equipmentSlots: 3,
    cellarTables: 2,
    mapPosition: { x: 300, y: -100 },
  },
  piwna: {
    name: 'ul. Piwna',
    blurb:
      'Beer Street, in the shadow of St. Mary’s Basilica. ' +
      'Locals and tourists wander past in equal measure.',
    rentPerDay: 1200,
    peakGuestsPerHour: 60,
    trafficLabel: 'Medium',
    hourCurve: LUNCH_AND_DINNER,
    weekendFactor: 1.2,
    monthFactors: STEADY_YEAR,
    groupMix: { tourists: 0.35, students: 0.1, locals: 0.35, office: 0.1, foodies: 0.1 },
    maxSeats: 32,
    terraceSeats: 12,
    equipmentSlots: 4,
    cellarTables: 2,
    mapPosition: { x: 250, y: 200 },
  },
  mariacka: {
    name: 'ul. Mariacka',
    blurb:
      'The most romantic street in Gdańsk: amber shops, stone terraces, ' +
      'and gargoyles that watch you eat. Small inside, lovely outside.',
    rentPerDay: 1800,
    peakGuestsPerHour: 55,
    trafficLabel: 'Medium',
    hourCurve: EVENING_HEAVY,
    weekendFactor: 1.3,
    monthFactors: STEADY_YEAR,
    groupMix: { tourists: 0.4, students: 0.05, locals: 0.15, office: 0.05, foodies: 0.35 },
    maxSeats: 24,
    terraceSeats: 20,
    equipmentSlots: 3,
    cellarTables: 3,
    mapPosition: { x: 650, y: 220 },
  },
  dluga: {
    name: 'ul. Długa / Długi Targ',
    blurb:
      'The Royal Way, right by the Neptune Fountain. ' +
      'Crowds all day long, and rent to match.',
    rentPerDay: 3000,
    peakGuestsPerHour: 150,
    trafficLabel: 'Very high',
    hourCurve: ALL_DAY,
    weekendFactor: 1.3,
    monthFactors: STEADY_YEAR,
    groupMix: { tourists: 0.6, students: 0.1, locals: 0.15, office: 0.1, foodies: 0.05 },
    maxSeats: 48,
    terraceSeats: 16,
    equipmentSlots: 6,
    cellarTables: 3,
    mapPosition: { x: 450, y: 0 },
  },
  pobrzeze: {
    name: 'Długie Pobrzeże',
    blurb:
      'The waterfront by the old Crane. Quiet in spring, bustling in summer, ' +
      'and the terrace is the best seat in town when the sun is out.',
    rentPerDay: 2200,
    peakGuestsPerHour: 90,
    trafficLabel: 'High in summer',
    hourCurve: ALL_DAY,
    weekendFactor: 1.3,
    monthFactors: WATERFRONT_YEAR,
    groupMix: { tourists: 0.6, students: 0.05, locals: 0.2, office: 0.05, foodies: 0.1 },
    maxSeats: 40,
    terraceSeats: 24,
    equipmentSlots: 5,
    cellarTables: 2,
    mapPosition: { x: 800, y: 150 },
  },
  spichrzow: {
    name: 'Wyspa Spichrzów',
    blurb:
      'Granary Island: modern, busy at lunchtime, and full of offices, students, ' +
      'and people who photograph their food.',
    rentPerDay: 1600,
    peakGuestsPerHour: 60,
    trafficLabel: 'Medium',
    hourCurve: LUNCH_HEAVY,
    weekendFactor: 0.8,
    monthFactors: STEADY_YEAR,
    groupMix: { tourists: 0.05, students: 0.25, locals: 0.1, office: 0.35, foodies: 0.25 },
    maxSeats: 40,
    terraceSeats: 16,
    equipmentSlots: 5,
    cellarTables: 3,
    mapPosition: { x: 950, y: -80 },
  },
};
