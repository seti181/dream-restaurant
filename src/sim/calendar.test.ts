import { describe, expect, it } from 'vitest';
import { dateOf, formatDate, isInSeason, isMonday, isWeekend, seasonWeek } from './calendar';

const text = (day: number) => formatDate(dateOf(day));

describe('calendar', () => {
  it('starts the season on Monday 8 July', () => {
    expect(text(0)).toBe('Monday 8 July');
  });

  it('rolls over month ends', () => {
    expect(text(23)).toBe('Wednesday 31 July');
    expect(text(24)).toBe('Thursday 1 August');
  });

  it('ends the season after six weeks on Sunday 18 August, the last day of the Fair', () => {
    expect(text(41)).toBe('Sunday 18 August');
    expect(seasonWeek(41)).toBe(6);
    expect(isInSeason(41)).toBe(true);
    expect(isInSeason(42)).toBe(false);
  });

  it('keeps counting into free play and the next year', () => {
    expect(text(177)).toBe('Wednesday 1 January');
    expect(dateOf(365)).toMatchObject({ month: 7, dayOfMonth: 8 });
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
