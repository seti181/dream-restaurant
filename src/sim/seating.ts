// Where tables stand in the room, and which spots each kind of guest likes best.
// See project.md section 6.13 ("Seat guests yourself"). The restaurant view uses the
// same grid, so a "window" table here is the one drawn along the window wall.

import { balance } from '../data/balance';
import { FAVOURITE_SPOTS, type GroupId, type TableSpot } from '../data/groups';
import { LOCATIONS, type LocationId } from '../data/locations';

/** How many tables a street's premises can hold. */
export function maxTablesAt(location: LocationId): number {
  return Math.floor(LOCATIONS[location].maxSeats / balance.service.seatsPerTable);
}

/** Columns of tables in the room: three in small rooms, four in big ones. Tables fill rows from the back wall. */
export function tableColumns(maxTables: number): number {
  return maxTables <= 6 ? 3 : 4;
}

/** What kind of spot a table is: on the terrace, along the window wall, at the quiet back, or near the door. */
export function spotsOf(location: LocationId, insideTables: number, table: number): TableSpot[] {
  if (table >= insideTables) return ['terrace'];
  const max = maxTablesAt(location);
  const columns = tableColumns(max);
  const rows = Math.ceil(max / columns);
  const row = Math.floor(table / columns);
  const spots: TableSpot[] = [];
  if (table % columns === 0) spots.push('window');
  if (row === 0) spots.push('back');
  if (row === rows - 1) spots.push('front');
  return spots;
}

/** True if this table is one of the group's favourite spots. */
export function isFavourite(group: GroupId, location: LocationId, insideTables: number, table: number): boolean {
  return spotsOf(location, insideTables, table).some((spot) => FAVOURITE_SPOTS[group].includes(spot));
}
