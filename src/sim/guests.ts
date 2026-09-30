// Guest generation: how many hungry parties appear on each street, every tick.
// See project.md section 7, step 1.

import { balance } from '../data/balance';
import { GROUP_IDS, GROUPS, type GroupId } from '../data/groups';
import { LOCATION_IDS, LOCATIONS, type LocationId } from '../data/locations';
import { dateOf, isWeekend } from './calendar';
import { minuteOfDay } from './clock';
import { nextInt, poisson, type RngState } from './rng';
import { ORDINARY_DAY } from './events';
import type { DayConditions, Party } from './types';

type TimeOfDay = 'lunch' | 'afternoon' | 'evening';

function timeOfDay(minute: number): TimeOfDay {
  const hour = Math.floor(minute / 60);
  if (hour >= balance.clock.eveningStartHour) return 'evening';
  if (hour >= balance.clock.afternoonStartHour) return 'afternoon';
  return 'lunch';
}

/**
 * Average number of guests (not parties) of one group appearing on one street
 * during one tick.
 */
export function expectedGuests(
  location: LocationId,
  group: GroupId,
  day: number,
  tick: number,
  conditions: DayConditions = ORDINARY_DAY,
): number {
  const place = LOCATIONS[location];
  const people = GROUPS[group];
  const minute = minuteOfDay(tick);
  const hourIndex = Math.floor((minute - balance.clock.openMinute) / 60);
  const monthIndex = dateOf(day).month - 1;
  const weekend = isWeekend(day);

  const streetTraffic =
    place.peakGuestsPerHour *
    (balance.clock.tickMinutes / 60) *
    place.hourCurve[hourIndex] *
    place.monthFactors[monthIndex] *
    (weekend ? place.weekendFactor : 1);

  const groupShare =
    place.groupMix[group] *
    people.timeOfDay[timeOfDay(minute)] *
    people.monthFactors[monthIndex] *
    (weekend ? people.weekendFactor : 1);

  const today =
    conditions.traffic *
    balance.weather.traffic[conditions.weather] *
    (conditions.groups[group] ?? 1) *
    (conditions.locations[location] ?? 1);

  return streetTraffic * groupShare * today;
}

/** All the parties that appear across the Old Town during one tick. */
export function generateParties(
  rng: RngState,
  day: number,
  tick: number,
  conditions: DayConditions = ORDINARY_DAY,
): Party[] {
  const parties: Party[] = [];
  const arrivalMinute = minuteOfDay(tick);
  for (const origin of LOCATION_IDS) {
    for (const group of GROUP_IDS) {
      const { min, max } = GROUPS[group].partySize;
      const averageSize = (min + max) / 2;
      const count = poisson(rng, expectedGuests(origin, group, day, tick, conditions) / averageSize);
      for (let i = 0; i < count; i++) {
        parties.push({ group, size: nextInt(rng, min, max), origin, arrivalMinute });
      }
    }
  }
  return parties;
}
