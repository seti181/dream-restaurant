import { describe, expect, it } from 'vitest';
import { RANKING_HEADLINES } from '../data/ranking';
import { closeDay, newGame, openRestaurant, playTick, playerRating, type GameState } from './game';
import { neptuneScore, type SeasonTally } from './neptune';
import { weeklyRanking, type RankingInput } from './ranking';

const restaurants = newGame(1).restaurants;
const [player, rosa, blyskawica] = restaurants;

const season: SeasonTally = {
  ratings: {
    player: { total: 600, count: 10 },
    nonnaRosa: { total: 500, count: 10 },
    blyskawica: { total: 700, count: 10 },
  },
  fairGuests: { player: 300, nonnaRosa: 100 },
};

const input = (changes: Partial<RankingInput> = {}): RankingInput => ({
  day: 7,
  restaurants,
  stars: () => 3,
  weekServed: { player: { tourists: 200 }, nonnaRosa: { locals: 100 }, blyskawica: { students: 700 } },
  season,
  daysToNeptune: null,
  previous: null,
  ...changes,
});

describe('the weekly Old Town top five', () => {
  it('ranks everyone by the Neptune score so far, with last week’s share of guests', () => {
    const ranking = weeklyRanking(input());
    expect(ranking.rows).toHaveLength(restaurants.length);
    expect(ranking.rows[0].id).toBe(blyskawica.id);
    const you = ranking.rows.find((row) => row.id === player.id)!;
    expect(you.score).toBeCloseTo(neptuneScore(60, 200 / 1000));
    expect(you.guests).toBe(200);
    for (let i = 1; i < ranking.rows.length; i++) expect(ranking.rows[i - 1].score).toBeGreaterThanOrEqual(ranking.rows[i].score);
  });

  it('counts the Fair’s guests while the Fair is on, as the Golden Neptune does', () => {
    const ranking = weeklyRanking(input({ daysToNeptune: 6 }));
    expect(ranking.daysToNeptune).toBe(6);
    expect(ranking.rows.find((row) => row.id === player.id)!.score).toBeCloseTo(neptuneScore(60, 300 / 400));
    expect(ranking.rows[0].id).toBe(player.id);
  });

  it('remembers last week’s places, and the headline follows the player', () => {
    const first = weeklyRanking(input());
    expect(first.before).toBeNull();
    expect(first.headline).toBe(RANKING_HEADLINES.first);
    const place = first.rows.findIndex((row) => row.id === player.id);
    // The next week the player is far ahead.
    const next = weeklyRanking(input({ day: 14, previous: first, weekServed: { player: { tourists: 5_000 } } }));
    expect(next.before?.[player.id]).toBe(place);
    expect(next.rows[0].id).toBe(player.id);
    expect(next.headline).toContain(player.name);
    expect(next.headline).not.toContain('{');
    expect(rosa.id).not.toBe(player.id);
  });
});

describe('the paper over a week', () => {
  const play = (state: GameState) => {
    const open = openRestaurant(state);
    while (!open.progress.done) playTick(open);
    return closeDay(state, open).state;
  };

  it('comes out on Monday mornings from the second week, with the player’s stars as shown on screen', () => {
    let state = newGame(4);
    for (let day = 0; day < 6; day++) {
      state = play(state);
      expect(state.ranking).toBeNull();
    }
    state = play(state);
    expect(state.day).toBe(7);
    expect(state.ranking?.day).toBe(7);
    expect(state.ranking?.rows.find((row) => row.id === 'player')?.stars).toBeCloseTo(playerRating(state));
    // It stays all week.
    expect(play(state).ranking?.day).toBe(7);
  });
});
