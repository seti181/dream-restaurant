// Tomorrow's forecast at the end of the day report, and the weather that now and then
// turns out differently from it. See project.md section 6.15, A1.

import { balance } from '../data/balance';
import { GROUP_IDS } from '../data/groups';
import type { HappeningId } from '../data/happenings';
import { FORECAST_MISSES, type Weather } from '../data/weather';
import { ticksPerDay } from './clock';
import { conditionsFor } from './events';
import type { GameState } from './game';
import { expectedGuests } from './guests';
import { chance, createRng, pick } from './rng';
import type { DayConditions } from './types';

export interface Forecast {
  day: number;
  /** The weather as forecast; it can still turn out differently. */
  weather: Weather;
  /** Something small going on in town, if anything. */
  happening: HappeningId | null;
  /** How many people are expected on the player's street, compared with today. */
  crowd: 'busier' | 'same' | 'quieter';
}

/** The weather as the doors open: the forecast's (kept in state.weather), or now and then something else. */
export function weatherAtOpening(state: GameState): Weather {
  // Its own generator, so the forecast being right or wrong never changes anything else that's rolled.
  const rng = createRng((state.rng.s ^ Math.imul(state.day + 19, 0x165667b1)) >>> 0);
  if (!chance(rng, balance.forecast.wrongChance)) return state.weather;
  return pick(rng, FORECAST_MISSES[state.weather]);
}

/** How many hungry people are expected on the player's street over a whole day. */
function peopleOnStreet(state: GameState, conditions: DayConditions): number {
  const { location } = state.restaurants[0];
  let total = 0;
  for (let tick = 0; tick < ticksPerDay(); tick++) {
    for (const group of GROUP_IDS) total += expectedGuests(location, group, state.day, tick, conditions);
  }
  return total;
}

/** The forecast for `tomorrow`, made at the end of `today` (which ran with `todayConditions`). */
export function forecastFor(tomorrow: GameState, today: GameState, todayConditions: DayConditions): Forecast {
  const ratio = peopleOnStreet(tomorrow, conditionsFor(tomorrow)) / Math.max(1, peopleOnStreet(today, todayConditions));
  const { busierAbove, quieterBelow } = balance.forecast;
  return {
    day: tomorrow.day,
    weather: tomorrow.weather,
    happening: tomorrow.happening,
    crowd: ratio > busierAbove ? 'busier' : ratio < quieterBelow ? 'quieter' : 'same',
  };
}
