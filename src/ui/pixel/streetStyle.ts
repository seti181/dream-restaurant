// How each of the six streets looks (project.md section 6.14, part 6): the paving, the landmark
// over the roofs, the river on Długie Pobrzeże, and what kind of houses line it. What stands on
// the street (cafés, przedproża, the Neptune Fountain, boats...) is in room.ts, streetFurniture().

import type { LocationId } from '../../data/locations';
import type { Gable } from './townhouse';

export type Paving = 'cobbles' | 'granite' | 'slabs';
export type Landmark = 'townHall' | 'stMarys' | 'crane';

export interface StreetStyle {
  paving: Paving;
  /** The big building peeking over the roofs behind the restaurant, if any. */
  landmark: Landmark | null;
  /** The Motława in front of the street, with a stone quay. */
  river: boolean;
  houses: {
    gables: Gable[];
    /** Chances, from 0 to 1, for each house. */
    awning: number;
    sign: number;
    flowers: number;
    flag: number;
    /** Brick granaries instead of townhouses. */
    granary: number;
  };
}

export const STREET_STYLES: Record<LocationId, StreetStyle> = {
  // Quiet and residential: plainer houses, flowers on the sills, few shops.
  ogarna: {
    paving: 'cobbles',
    landmark: 'townHall',
    river: false,
    houses: { gables: ['pointed', 'stepped', 'pointed', 'scroll', 'attic'], awning: 0.2, sign: 0.3, flowers: 0.6, flag: 0.05, granary: 0 },
  },
  // Beer Street, in the shadow of St. Mary's Basilica.
  piwna: {
    paving: 'cobbles',
    landmark: 'stMarys',
    river: false,
    houses: { gables: ['stepped', 'scroll', 'pointed', 'stepped', 'attic'], awning: 0.45, sign: 0.6, flowers: 0.3, flag: 0.15, granary: 0 },
  },
  // Romantic and ornate: scroll and stepped gables, amber shops, flowers everywhere, St. Mary's at the end.
  mariacka: {
    paving: 'cobbles',
    landmark: 'stMarys',
    river: false,
    houses: { gables: ['scroll', 'stepped', 'scroll', 'stepped', 'scroll'], awning: 0.2, sign: 0.8, flowers: 0.6, flag: 0.1, granary: 0 },
  },
  // The Royal Way: wide, granite, cafés and awnings, flags out, the Town Hall.
  dluga: {
    paving: 'granite',
    landmark: 'townHall',
    river: false,
    houses: { gables: ['scroll', 'attic', 'scroll', 'stepped', 'pointed', 'scroll'], awning: 0.65, sign: 0.6, flowers: 0.35, flag: 0.45, granary: 0 },
  },
  // The waterfront: the Motława and its boats in front, the Żuraw over the roofs.
  pobrzeze: {
    paving: 'cobbles',
    landmark: 'crane',
    river: true,
    houses: { gables: ['scroll', 'stepped', 'pointed', 'scroll', 'attic'], awning: 0.6, sign: 0.5, flowers: 0.3, flag: 0.25, granary: 0 },
  },
  // Granary Island: brick granaries among newer houses, smooth modern paving.
  spichrzow: {
    paving: 'slabs',
    landmark: null,
    river: false,
    houses: { gables: ['pointed', 'stepped', 'attic'], awning: 0.4, sign: 0.5, flowers: 0.15, flag: 0.05, granary: 0.6 },
  },
};
