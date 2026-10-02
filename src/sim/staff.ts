// The player's team and the weekly pool of job candidates. See project.md section 6.5.

import { balance } from '../data/balance';
import {
  CHEF_BIOS,
  COURSES,
  CUISINES,
  FIRST_NAMES,
  HOMETOWNS,
  STARTER_TEAM,
  TRAIT_IDS,
  WAITER_BIOS,
} from '../data/staff';
import { SPECIAL_STAFF, SPECIAL_STAFF_IDS, type SpecialStaffId } from '../data/personal';
import { wageOf } from './finance';
import { nextFloat, nextInt, pick, type RngState } from './rng';
import type { Employee, Role, Staff } from './types';

/** The simulation's view of the team members in one role. Tired people work a little slower. */
export function staffOf(team: Employee[], role: Role): Staff[] {
  return team
    .filter((person) => person.role === role)
    .map(({ id, skill, speed, trait, specialty, special, morale }) => {
      const tired = moodOf(morale) === 'tired' || moodOf(morale) === 'wornOut';
      const slower = tired ? balance.staff.morale.tiredSpeedLoss : 0;
      const staff: Staff = { skill, speed: Math.max(1, speed - slower), trait, specialty, look: id };
      if (special) staff.special = special;
      return staff;
    });
}

// ---------- Morale and days off ----------

export type Mood = 'happy' | 'fine' | 'tired' | 'wornOut';

/** How someone is doing, from their morale. */
export function moodOf(morale: number): Mood {
  const { happyFrom, tiredBelow, wornOutBelow } = balance.staff.morale;
  if (morale < wornOutBelow) return 'wornOut';
  if (morale < tiredBelow) return 'tired';
  return morale >= happyFrom ? 'happy' : 'fine';
}

/** True if this person has the given day off. */
export const offOn = (person: Employee, day: number) => person.dayOff === day;

/** True if this person is booked on a course on the given day. */
export const onCourseOn = (person: Employee, day: number) => person.course?.day === day;

/** True if this person isn't at work that day: a day off, or a course. */
export const awayOn = (person: Employee, day: number) => offOn(person, day) || onCourseOn(person, day);

/** What someone's skill and speed are worth (Tomek's famously low wage is his own idea, so it's always fair). */
export function fairWageOf(person: Employee): number {
  if (person.special && SPECIAL_STAFF[person.special].wage !== null) return person.wage;
  return wageOf(person.role, person);
}

/** True if someone is paid less than their skill and speed are worth (after a course, say). */
export const underpaid = (person: Employee) => person.wage < fairWageOf(person);

/**
 * The team after a day: those who worked are a little more tired, those who rested (a day off,
 * or a day in bed) feel better. Returns the team and a line for the day report about anyone
 * who rested or is getting tired.
 */
export function moraleAfterDay(
  team: Employee[],
  day: number,
  /** Who was on the team this morning, and who of them was ill in bed. */
  morning: { ids: number[]; sick: number[] },
): { team: Employee[]; news: string[] } {
  const m = balance.staff.morale;
  const news: string[] = [];
  const after = team.map((person) => {
    // Hired during the day: they start tomorrow.
    if (!morning.ids.includes(person.id)) return person;
    const rested = offOn(person, day) || morning.sick.includes(person.id);
    const course = onCourseOn(person, day) ? person.course! : null;
    const tiring = (person.trait === 'cheerful' ? m.cheerfulWorkDay : m.workDay) + (underpaid(person) ? m.underpaidWorkDay : 0);
    const change = rested ? m.dayOff : course ? balance.staff.training.morale : -tiring;
    const morale = Math.max(0, Math.min(100, person.morale + change));
    if (offOn(person, day)) news.push(`${person.name} had the day off and comes back rested.`);
    // Back from a course a level better, and worth a little more.
    const learned = course ? { [course.stat]: Math.min(5, person[course.stat] + 1) } : {};
    if (course) {
      const fair = fairWageOf({ ...person, ...learned });
      const wage = fair > person.wage ? ` A fair wage for that is now ${fair} zł a day.` : '';
      news.push(`${person.name} ${COURSES[person.role][course.stat].done}: ${course.stat} ${person[course.stat] + 1}!${wage}`);
    }
    const before = moodOf(person.morale);
    const now = moodOf(morale);
    if (now === 'tired' && before !== 'tired' && before !== 'wornOut') {
      news.push(`${person.name} is getting tired. A day off would do wonders.`);
    } else if (now === 'wornOut' && before !== 'wornOut') {
      news.push(`${person.name} is worn out and might call in sick. A day off, please!`);
    }
    const { dayOff, course: booked, ...rest } = { ...person, ...learned };
    return {
      ...rest,
      morale,
      ...(dayOff !== undefined && dayOff > day ? { dayOff } : {}),
      ...(booked && booked.day > day ? { course: booked } : {}),
    };
  });
  return { team: after, news };
}

export function starterTeam(): Employee[] {
  return STARTER_TEAM.map((person, index) => ({
    ...person,
    id: index + 1,
    wage: wageOf(person.role, person),
    morale: balance.staff.morale.start,
  }));
}

/** A skill or speed from 1 to 5, with middling levels most common. */
function randomLevel(rng: RngState): number {
  const weights = balance.staff.candidateLevelWeights;
  let roll = nextFloat(rng) * weights.reduce((sum, w) => sum + w, 0);
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll < 0) return i + 1;
  }
  return weights.length;
}

const firstNameOf = (name: string) => name.split(' ')[0];

/** A name whose first name isn't already used by anyone in `taken`. */
function randomName(rng: RngState, taken: Set<string>): string {
  const takenFirstNames = new Set([...taken].map(firstNameOf));
  let first = pick(rng, FIRST_NAMES);
  for (let attempt = 0; attempt < 20 && takenFirstNames.has(first); attempt++) first = pick(rng, FIRST_NAMES);
  return `${first} from ${pick(rng, HOMETOWNS)}`;
}

/**
 * A fresh pool of job candidates: always at least one chef and one waiter.
 * @param firstId the id to give the first candidate; the rest follow on
 * @param takenNames names already in use, to avoid two people with the same name
 */
export function generateCandidates(rng: RngState, firstId: number, takenNames: Set<string>): Employee[] {
  const { min, max } = balance.staff.candidatePool;
  const count = nextInt(rng, min, max);
  const names = new Set(takenNames);
  return Array.from({ length: count }, (_, index) => {
    const role: Role = index === 0 ? 'chef' : index === 1 ? 'waiter' : pick(rng, ['chef', 'waiter'] as const);
    const skill = randomLevel(rng);
    const speed = randomLevel(rng);
    const name = randomName(rng, names);
    names.add(name);
    const person: Employee = {
      id: firstId + index,
      role,
      name,
      bio: pick(rng, role === 'chef' ? CHEF_BIOS : WAITER_BIOS),
      skill,
      speed,
      trait: pick(rng, TRAIT_IDS),
      wage: wageOf(role, { skill, speed }),
      morale: balance.staff.morale.start,
    };
    if (role === 'chef') person.specialty = pick(rng, CUISINES);
    return person;
  });
}

/** One of the two special waiters as a job candidate. */
export function specialCandidate(id: SpecialStaffId, employeeId: number): Employee {
  const person = SPECIAL_STAFF[id];
  const { skill, speed, trait } = person;
  return {
    id: employeeId,
    role: 'waiter',
    name: person.name,
    bio: person.bio,
    skill,
    speed,
    trait,
    wage: person.wage ?? wageOf('waiter', { skill, speed }),
    morale: balance.staff.morale.start,
    special: id,
  };
}

/** The special waiters looking for work on this day (a Monday): not yet hired, and it's their week. */
export function specialsLookingForWork(day: number, team: Employee[]): SpecialStaffId[] {
  return SPECIAL_STAFF_IDS.filter((id) => {
    const { firstDay, everyDays } = SPECIAL_STAFF[id];
    const theirWeek = day >= firstDay && (day - firstDay) % everyDays === 0;
    return theirWeek && !team.some((person) => person.special === id);
  });
}
