// Short storylines for the team: who has a story, what's in the morning news, how a wished-for
// day off turned out, and the small moments that happen to anyone. The stories are in
// data/teamStories.ts.

import { balance } from '../data/balance';
import { TEAM_BEATS, TEAM_MOMENTS, type StoryPerson } from '../data/teamStories';
import { chance, pick, type RngState } from './rng';
import { offOn } from './staff';
import type { Employee } from './types';

/** Who this person is in the stories, if they have a story of their own. */
export function storyOf(person: Employee): StoryPerson | null {
  return person.special ?? person.starter ?? null;
}

/** Days since they joined the team. */
const daysIn = (person: Employee, day: number) => day - (person.since ?? 0);

const withMorale = (person: Employee, change: number): Employee => ({
  ...person,
  morale: Math.max(0, Math.min(100, person.morale + change)),
});

/** The team's stories in the morning news of this day. */
export function teamNews(team: Employee[], day: number): { title: string; text: string }[] {
  return team.flatMap((person) =>
    TEAM_BEATS.filter((beat) => beat.news && beat.who === storyOf(person) && beat.day === daysIn(person, day)).map(
      (beat) => ({ title: person.name, text: beat.news! }),
    ),
  );
}

/**
 * At the end of the day: anyone who wished for today off finds out whether they got it.
 * Returns the team with their morale changed, and lines for the day report.
 */
export function settleWishes(team: Employee[], day: number): { team: Employee[]; news: string[] } {
  let after = team;
  const news: string[] = [];
  for (const person of team) {
    for (const beat of TEAM_BEATS) {
      const wish = beat.wishDayOff;
      if (!wish || beat.who !== storyOf(person) || beat.day !== daysIn(person, day)) continue;
      const granted = offOn(person, day);
      news.push(granted ? wish.granted : wish.refused);
      after = after.map((p) => {
        if (p.id === person.id) return withMorale(p, granted ? wish.grantedMorale : wish.refusedMorale);
        return granted && wish.teamMorale ? withMorale(p, wish.teamMorale) : p;
      });
    }
  }
  return { team: after, news };
}

/**
 * About once a week, a small moment for someone who has been on the team a while: a birthday,
 * pączki, a song. Returns the team, the złoty it cost, and the morning news, if anything happened.
 */
export function teamMoment(
  rng: RngState,
  team: Employee[],
  day: number,
): { team: Employee[]; cash: number; news: { title: string; text: string } | null } {
  const { chance: likely, settledInDays } = balance.staff.teamMoments;
  const settled = team.filter((person) => daysIn(person, day) >= settledInDays);
  if (settled.length === 0 || !chance(rng, likely)) return { team, cash: 0, news: null };
  const person = pick(rng, settled);
  const moment = pick(rng, TEAM_MOMENTS);
  const after = team.map((p) => {
    const change = (p.id === person.id ? (moment.morale ?? 0) : 0) + (moment.teamMorale ?? 0);
    return change === 0 ? p : withMorale(p, change);
  });
  const text = moment.text.replace('{name}', person.name);
  return { team: after, cash: moment.cash ?? 0, news: { title: 'The team', text } };
}
