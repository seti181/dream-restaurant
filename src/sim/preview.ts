// What the restaurant on any street looks like, for "Have a look" on the map: yours on your
// own street, a rival's on theirs, or yours as it would be after moving to an empty street.
// Reads the game; changes nothing.

import { balance } from '../data/balance';
import { LOCATIONS, type LocationId } from '../data/locations';
import { afterMove } from './actions';
import { dateOf } from './calendar';
import type { FloorView } from './day';
import { playerOf, restingFloor, terraceTablesBuilt, type GameState } from './game';

export interface StreetPreview {
  floor: FloorView;
  /** Whose restaurant it is: yours, a rival's, or yours after a move. */
  whose: 'yours' | 'rival' | 'moved';
  /** The restaurant's name. */
  name: string;
}

export function previewOf(state: GameState, location: LocationId): StreetPreview {
  const player = playerOf(state);
  if (location === player.location) return { floor: restingFloor(state), whose: 'yours', name: player.name };
  const place = LOCATIONS[location];
  const seats = balance.service.seatsPerTable;
  const rival = state.restaurants.slice(1).find((r) => r.location === location);
  const month = dateOf(state.day).month;
  const terraceSeason = month >= balance.terrace.firstMonth && month <= balance.terrace.lastMonth;
  const terraceTables = Math.floor(place.terraceSeats / seats);
  const restaurant = rival ?? afterMove(state, location);
  const inside = Math.min(restaurant.tables, Math.floor(place.maxSeats / seats));
  // Rivals set out their terrace in season; you'd take your permit with you.
  const terrace = rival ? (terraceSeason ? terraceTables : 0) : terraceTablesBuilt(state) > 0 ? terraceTables : 0;
  const team = state.team;
  return {
    floor: {
      location,
      tables: Array<null>(inside + terrace).fill(null),
      insideTables: inside,
      terraceTables: terrace,
      chefsBusy: (rival ? rival.chefs : team.filter((p) => p.role === 'chef')).map(() => false),
      waiters: rival ? rival.waiters.map(() => null) : team.filter((p) => p.role === 'waiter').map((p) => p.special ?? null),
      ordersWaiting: 0,
      walkouts: [],
      atTheDoor: [],
      leftTheDoor: [],
      decor: restaurant.decor,
      equipment: restaurant.equipment,
    },
    whose: rival ? 'rival' : 'moved',
    name: restaurant.name,
  };
}
