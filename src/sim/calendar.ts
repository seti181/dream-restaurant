// The in-game calendar. The year is fixed and fictional: no leap days, and the
// season always starts on the same weekday, so dates are predictable.
// Days are counted from the first day of the season (day 0) and keep going
// past the season for free play.

import { balance } from '../data/balance';

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const DAYS_PER_YEAR = 365;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** 0 = Monday … 6 = Sunday. */
export const WEEKDAY_NAMES = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
];

export interface GameDate {
  /** 1 = January … 12 = December. */
  month: number;
  dayOfMonth: number;
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
}

const { seasonStartMonth, seasonStartDayOfMonth, seasonStartWeekday, seasonLengthDays } =
  balance.calendar;

/** Days from 1 January to the given date. */
function dayOfYear(month: number, dayOfMonth: number): number {
  let total = dayOfMonth - 1;
  for (let m = 0; m < month - 1; m++) total += MONTH_LENGTHS[m];
  return total;
}

const seasonStartDayOfYear = dayOfYear(seasonStartMonth, seasonStartDayOfMonth);

export function weekdayOf(day: number): number {
  return (seasonStartWeekday + day) % 7;
}

export function dateOf(day: number): GameDate {
  let remaining = (seasonStartDayOfYear + day) % DAYS_PER_YEAR;
  let month = 0;
  while (remaining >= MONTH_LENGTHS[month]) {
    remaining -= MONTH_LENGTHS[month];
    month++;
  }
  return { month: month + 1, dayOfMonth: remaining + 1, weekday: weekdayOf(day) };
}

/** Week number of the season, starting at 1. Weeks begin on Monday. */
export function seasonWeek(day: number): number {
  return Math.floor((seasonStartWeekday + day) / 7) + 1;
}

export function isWeekend(day: number): boolean {
  return weekdayOf(day) >= 5;
}

/** Mondays bring rent, the weekly summary and a new goal. */
export function isMonday(day: number): boolean {
  return weekdayOf(day) === 0;
}

/** True for days up to and including the last day of the Fair. */
export function isInSeason(day: number): boolean {
  return day < seasonLengthDays;
}

/** "Monday 1 April"-style text. */
export function formatDate(date: GameDate): string {
  return `${WEEKDAY_NAMES[date.weekday]} ${date.dayOfMonth} ${MONTH_NAMES[date.month - 1]}`;
}

/** The first day, from `fromDay` on, that falls on this date. */
export function nextDayOn(month: number, dayOfMonth: number, fromDay: number): number {
  for (let day = fromDay; day < fromDay + DAYS_PER_YEAR; day++) {
    const date = dateOf(day);
    if (date.month === month && date.dayOfMonth === dayOfMonth) return day;
  }
  throw new Error(`No ${dayOfMonth}/${month} in the calendar`);
}

export function daysInMonth(month: number): number {
  return MONTH_LENGTHS[month - 1];
}
