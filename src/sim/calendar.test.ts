import { describe, expect, it } from 'vitest';
import { dateOf, formatDate, isInSeason, isMonday, isWeekend, seasonWeek } from './calendar';

const text = (day: number) => formatDate(dateOf(day));

describe('calendar', () => {
  it('starts the season on Monday 1 April', () => {
    expect(text(0)).toBe('Monday 1 April');
  });

  it('rolls over month ends', () => {
    expect(text(29)).toBe('Tuesday 30 April');
    expect(text(30)).toBe('Wednesday 1 May');
  });

  it('ends the season after 20 weeks on Sunday 18 August', () => {
    expect(text(139)).toBe('Sunday 18 August');
    expect(seasonWeek(139)).toBe(20);
    expect(isInSeason(139)).toBe(true);
    expect(isInSeason(140)).toBe(false);
  });

  it('keeps counting into free play and the next year', () => {
    expect(text(275)).toBe('Wednesday 1 January');
    expect(dateOf(365)).toMatchObject({ month: 4, dayOfMonth: 1 });
  });

  it('starts a new week every Monday', () => {
    expect(seasonWeek(0)).toBe(1);
    expect(seasonWeek(6)).toBe(1);
    expect(seasonWeek(7)).toBe(2);
    expect(isMonday(7)).toBe(true);
    expect(isMonday(8)).toBe(false);
  });

  it('knows the weekend', () => {
    expect(isWeekend(4)).toBe(false); // Friday
    expect(isWeekend(5)).toBe(true); // Saturday
    expect(isWeekend(6)).toBe(true); // Sunday
  });
});
