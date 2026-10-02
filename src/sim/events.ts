// Weather, calendar events and random events, and the day conditions they create.
// See project.md section 6.10.

import { balance } from '../data/balance';
import {
  CALENDAR_EVENT_IDS,
  CALENDAR_EVENTS,
  RANDOM_EVENT_IDS,
  RANDOM_EVENTS,
  type CalendarEventId,
  type EventEffects,
  type RandomEventId,
} from '../data/events';
import { REGULAR } from '../data/personal';
import { inSeasonOn } from './menu';
import { regularsBookings } from './regulars';
import { WEATHER_IDS, type Weather } from '../data/weather';
import { dateOf, weekdayOf } from './calendar';
import type { GameState } from './game';
import { chance, nextFloat, type RngState } from './rng';
import type { DayConditions } from './types';

/** A plain day: cloudy, no events, no bookings. */
export const ORDINARY_DAY: DayConditions = {
  weather: 'cloudy',
  traffic: 1,
  groups: {},
  locations: {},
  bookings: [],
  ingredientCost: {},
  inSeason: [],
};

/** Picks one of several options, each with a weight. */
function weightedPick<T>(rng: RngState, options: readonly T[], weight: (option: T) => number): T {
  let roll = nextFloat(rng) * options.reduce((sum, option) => sum + weight(option), 0);
  for (const option of options) {
    roll -= weight(option);
    if (roll < 0) return option;
  }
  return options[options.length - 1];
}

export function rollWeather(rng: RngState, day: number): Weather {
  const chances = balance.weather.monthChances[dateOf(day).month - 1];
  return weightedPick(rng, WEATHER_IDS, (w) => chances[WEATHER_IDS.indexOf(w)]);
}

/** Month and day as one comparable number, e.g. 7 July → 707. */
const dateNumber = (month: number, day: number) => month * 100 + day;

export function calendarEventsOn(day: number): CalendarEventId[] {
  const { month, dayOfMonth } = dateOf(day);
  const today = dateNumber(month, dayOfMonth);
  return CALENDAR_EVENT_IDS.filter((id) => {
    const { start, end } = CALENDAR_EVENTS[id];
    return today >= dateNumber(start.month, start.day) && today <= dateNumber(end.month, end.day);
  });
}

export function calendarEventsStarting(day: number): CalendarEventId[] {
  const { month, dayOfMonth } = dateOf(day);
  return CALENDAR_EVENT_IDS.filter(
    (id) => CALENDAR_EVENTS[id].start.month === month && CALENDAR_EVENTS[id].start.day === dayOfMonth,
  );
}

/** Maybe something unexpected happens: returns the event, or null for an ordinary day. */
export function rollRandomEvent(rng: RngState): RandomEventId | null {
  if (!chance(rng, balance.events.randomChancePerDay)) return null;
  return weightedPick(rng, RANDOM_EVENT_IDS, (id) => RANDOM_EVENTS[id].weight);
}

function applyEffects(conditions: DayConditions, effects: EventEffects): void {
  conditions.traffic *= effects.traffic ?? 1;
  for (const [group, factor] of Object.entries(effects.groups ?? {})) {
    const g = group as keyof DayConditions['groups'];
    conditions.groups[g] = (conditions.groups[g] ?? 1) * factor;
  }
  for (const [location, factor] of Object.entries(effects.locations ?? {})) {
    const l = location as keyof DayConditions['locations'];
    conditions.locations[l] = (conditions.locations[l] ?? 1) * factor;
  }
}

/** Today's conditions for the whole Old Town, from the weather and every event that is on. */
export function conditionsFor(state: GameState): DayConditions {
  const conditions: DayConditions = {
    weather: state.weather,
    traffic: 1,
    groups: {},
    locations: {},
    bookings: [],
    ingredientCost: {},
    inSeason: inSeasonOn(state.day),
  };
  for (const id of calendarEventsOn(state.day)) applyEffects(conditions, CALENDAR_EVENTS[id].effects);

  const player = state.restaurants[0];
  const seats = player.tables * balance.service.seatsPerTable;
  for (const active of state.events) {
    if (active.fromDay > state.day || active.untilDay < state.day) continue;
    const event = RANDOM_EVENTS[active.id];
    if (event.streetTraffic) {
      conditions.locations[player.location] = (conditions.locations[player.location] ?? 1) * event.streetTraffic;
    }
    if (event.ingredientCost) {
      conditions.ingredientCost[player.id] = (conditions.ingredientCost[player.id] ?? 1) * event.ingredientCost;
    }
    if (event.booking && active.fromDay === state.day) {
      conditions.bookings.push({
        restaurant: player.id,
        group: event.booking.group,
        size: Math.max(1, Math.min(event.booking.size, seats)),
        minute: event.booking.hour * 60,
        critic: event.booking.critic ?? false,
      });
    }
  }
  // Word of mouth from earlier answers (a blogger's post, say) brings more of some groups.
  for (const u of state.upcoming ?? []) {
    if (u.fromDay > state.day || u.untilDay < state.day || !u.groups) continue;
    applyEffects(conditions, { groups: u.groups });
  }
  // The Friday regular comes in for dinner, as always.
  if (weekdayOf(state.day) === REGULAR.weekday) {
    conditions.bookings.push({
      restaurant: player.id,
      group: REGULAR.group,
      size: 1,
      minute: REGULAR.hour * 60,
      critic: false,
      regular: true,
    });
  }
  // The named regulars come on their own days, each with a story to tell.
  conditions.bookings.push(...regularsBookings(state.day, player.id));
  return conditions;
}
