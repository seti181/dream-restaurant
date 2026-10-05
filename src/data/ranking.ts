// The headlines over Dziennik Bałtycki's weekly Old Town top five (sim/ranking.ts).
// {player} is the player's restaurant, {leader} the one on top, {place} a place in words.
// See project.md section 6.15, B8.

export const RANKING_HEADLINES = {
  playerTop: '{player} tops the Old Town! Gdańsk can’t get enough of it.',
  playerStaysTop: '{player} stays on top of the Old Town for another week.',
  playerUp: '{player} climbs to {place}!',
  playerDown: '{player} slips to {place}. Time to win them back!',
  leaderNew: '{leader} takes the top spot this week.',
  leaderStays: '{leader} holds on to the top spot.',
  first: 'The race for the Golden Neptune is on: here’s how the Old Town stands.',
} as const;

/** "first", "second"... for places in the top five. */
export const PLACES = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'] as const;
