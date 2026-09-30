// Money going out: wages, rent and utilities. See project.md section 6.12.

import { balance } from '../data/balance';
import { LOCATIONS } from '../data/locations';
import { isMonday } from './calendar';
import type { Restaurant, Role, Staff } from './types';

/** Daily wage: better and faster people cost more. */
export function wageOf(role: Role, person: Staff): number {
  const s = balance.staff;
  const base = role === 'chef' ? s.chefWage : s.waiterWage;
  const levelsAboveAverage = person.skill - s.averageLevel + (person.speed - s.averageLevel);
  return Math.round(base * (1 + s.wageStepPerLevel * levelsAboveAverage));
}

export function dailyWages(restaurant: Restaurant): number {
  return (
    restaurant.chefs.reduce((sum, chef) => sum + wageOf('chef', chef), 0) +
    restaurant.waiters.reduce((sum, waiter) => sum + wageOf('waiter', waiter), 0)
  );
}

/** Rent and utilities for the week ahead are paid every Monday. */
export function weeklyBillsDue(restaurant: Restaurant, day: number): { rent: number; utilities: number } {
  if (!isMonday(day)) return { rent: 0, utilities: 0 };
  return {
    rent: LOCATIONS[restaurant.location].rentPerDay * 7,
    utilities: balance.finance.weeklyUtilities,
  };
}
