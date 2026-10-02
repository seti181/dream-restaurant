// Short storylines for the team (project.md section 6.14, staff growth): little things that happen
// to the people who work for you, in the morning news, and a few wishes that matter.
// Tomek's and Adrian's own rules are in personal.ts; how often the small moments come is in balance.ts.

/** The people with a story of their own: the starter team and the two waiters from section 10. */
export type StoryPerson = 'krystyna' | 'kacper' | 'tomek' | 'adrian';

/** A moment in someone's story, counted in days from when they joined. */
export interface TeamBeat {
  who: StoryPerson;
  /** Days after they joined: the morning it's in the news, or the evening a wish is settled. */
  day: number;
  /** In the morning news that day. */
  news?: string;
  /**
   * A day off they wish for, on this day: settled that evening in the day report.
   * Morale changes for them (and, with `teamMorale`, for everyone else on the team).
   */
  wishDayOff?: { granted: string; refused: string; grantedMorale: number; refusedMorale: number; teamMorale?: number };
}

export const TEAM_BEATS: TeamBeat[] = [
  {
    who: 'krystyna',
    day: 6,
    news:
      'Pani Krystyna brought her own rolling pin from home. It is older than the restaurant, ' +
      'and nobody else is allowed to touch it.',
  },
  {
    who: 'krystyna',
    day: 12,
    news:
      'Tomorrow is Sunday. Pani Krystyna has made pierogi for her family every Sunday since 1979, ' +
      'and never missed one. She won’t ask, but she would love tomorrow off. (Staff tab, once someone can cover.)',
  },
  {
    who: 'krystyna',
    day: 13,
    wishDayOff: {
      granted:
        'Pani Krystyna made pierogi for eleven grandchildren, and came back with a tin of them for the team. ' +
        'The whole kitchen is in a good mood.',
      refused: 'Pani Krystyna worked through her first Sunday since 1979. She didn’t complain. She did sigh, twice.',
      grantedMorale: 15,
      refusedMorale: -10,
      teamMorale: 5,
    },
  },
  {
    who: 'krystyna',
    day: 34,
    news: 'Pani Krystyna’s granddaughter Ania has started at cooking school in Kraków, “because of Babcia”. Pani Krystyna pretends not to be proud.',
  },
  {
    who: 'kacper',
    day: 2,
    news: 'Kacper asked a German tour group what soup means to them. A long conversation followed. They left a big tip, and a reading list.',
  },
  {
    who: 'kacper',
    day: 15,
    news:
      'Kacper’s philosophy exam is on Thursday. He would love the day off for it. ' +
      '(Staff tab on Thursday morning, once another waiter can cover.)',
  },
  {
    who: 'kacper',
    day: 17,
    wishDayOff: {
      granted: 'Kacper passed his philosophy exam with a 5! He came back with a cake and a quote from Kant for everyone.',
      refused: 'Kacper sat his exam in his lunch break, still in his apron. He got a 3: “satisfactory, like a decent żurek”.',
      grantedMorale: 15,
      refusedMorale: -5,
      teamMorale: 3,
    },
  },
  {
    who: 'kacper',
    day: 30,
    news: 'Kacper has started his thesis: “The Ethics of Soup”. He interviews guests between orders. Most of them answer.',
  },
  {
    who: 'tomek',
    day: 2,
    news: 'Tomek went to the barber’s. There was nothing to cut. “It’s the principle,” he says, beaming.',
  },
  {
    who: 'tomek',
    day: 5,
    news:
      'Tomek asked if there is a course he could go on. “I’d like to be good at this,” he said, and dropped a spoon. ' +
      '(A service course in the Staff tab might be just the thing.)',
  },
  {
    who: 'adrian',
    day: 2,
    news:
      'Adrian overslept again. “When I’m happy at work, I jump out of bed,” he says. ' +
      'Keep him in good spirits and he might turn up more often.',
  },
  {
    who: 'adrian',
    day: 10,
    news: 'Adrian’s band, Żabka i Kumple, played on Długa last night. He arrived this morning with his guitar, and on time.',
  },
];

/** Small moments for anyone on the team, about once a week. `{name}` is who it happens to. */
export interface TeamMoment {
  text: string;
  /** Morale for the one it happens to, and for everyone on the team. */
  morale?: number;
  teamMorale?: number;
  /** Złoty spent (a cake, say). */
  cash?: number;
}

export const TEAM_MOMENTS: TeamMoment[] = [
  { text: 'It’s {name}’s birthday! The team shared a cake in the kitchen before opening.', teamMorale: 5, cash: -80 },
  { text: '{name} brought pączki from the bakery on Długa for everyone. The kitchen smells of rose jam.', teamMorale: 3 },
  { text: '{name} taught the team a Kashubian song. The kitchen will be humming it all day.', teamMorale: 3 },
  { text: '{name} found a kitten by the bins and named it Mewa. The real Mewa is not amused.', morale: 8 },
  { text: '{name}’s mum came by to check they’re eating properly. She approves of the żurek.', morale: 5 },
  { text: '{name} missed the tram and walked along the Motława at sunrise. “Worth it,” they say.', morale: 5 },
];
