// All tunable numbers for the game live here. Logic reads them from this file
// and never hard-codes its own copies.

export const balance = {
  clock: {
    /** In-game minutes that pass in one simulation tick. */
    tickMinutes: 5,
    /** Opening time, in minutes after midnight (11:00). */
    openMinute: 11 * 60,
    /** Closing time, in minutes after midnight (22:00). */
    closeMinute: 22 * 60,
  },

  calendar: {
    /** The season starts on 1 April. */
    seasonStartMonth: 4,
    seasonStartDayOfMonth: 1,
    /** Weekday of the first day: 0 = Monday … 6 = Sunday. */
    seasonStartWeekday: 0,
    /** 20 weeks: 1 April to Sunday 18 August, the last day of St. Dominic's Fair. */
    seasonLengthDays: 140,
  },
} as const;
