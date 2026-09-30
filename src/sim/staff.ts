// The player's team and the weekly pool of job candidates. See project.md section 6.5.

import { balance } from '../data/balance';
import {
  CHEF_BIOS,
  CUISINES,
  FIRST_NAMES,
  HOMETOWNS,
  STARTER_TEAM,
  TRAIT_IDS,
  WAITER_BIOS,
} from '../data/staff';
import { wageOf } from './finance';
import { nextFloat, nextInt, pick, type RngState } from './rng';
import type { Employee, Role, Staff } from './types';

/** The simulation's view of the team members in one role. */
export function staffOf(team: Employee[], role: Role): Staff[] {
  return team
    .filter((person) => person.role === role)
    .map(({ skill, speed, trait, specialty }) => ({ skill, speed, trait, specialty }));
}

export function starterTeam(): Employee[] {
  return STARTER_TEAM.map((person, index) => ({
    ...person,
    id: index + 1,
    wage: wageOf(person.role, person),
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
    };
    if (role === 'chef') person.specialty = pick(rng, CUISINES);
    return person;
  });
}
