import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { THEME_NIGHTS } from '../data/themeNights';
import { bookThemeNight, themeNightUnavailableReason } from './actions';
import { utility } from './choice';
import { seat, startDay } from './day';
import { closeDay, newGame, openRestaurant, playerOf, playTick, type GameState } from './game';
import { createRng } from './rng';
import { themeCraving, themeNightFor } from './themeNights';

const evening = balance.themeNights.fromMinute;

describe('booking a theme night', () => {
  it('takes one evening this week, once a week, and is paid at once', () => {
    const game: GameState = { ...newGame(1), day: 2 };
    expect(themeNightUnavailableReason(game, 'pierogi', 1)).toBe('Pick an evening this week');
    expect(themeNightUnavailableReason(game, 'pierogi', 7)).toBe('Pick an evening this week');
    const booked = bookThemeNight(game, 'pierogi', 4);
    expect(booked.themeNight).toEqual({ id: 'pierogi', day: 4 });
    expect(booked.cash).toBe(game.cash - THEME_NIGHTS.pierogi.cost);
    expect(themeNightUnavailableReason(booked, 'seafood', 5)).toBe('This week’s theme night is booked');
    // Next week, another.
    expect(themeNightUnavailableReason({ ...booked, day: 7 }, 'seafood', 8)).toBeNull();
    expect(bookThemeNight({ ...game, cash: 100 }, 'accordion', 3)).toEqual({ ...game, cash: 100 });
  });
});

describe('a theme night', () => {
  const player = playerOf(newGame(2));
  const pierogiNight = { ...player, themeNight: themeNightFor({ id: 'pierogi', day: 0 }, 0) };
  const party = (group: 'tourists' | 'students', minute: number) => ({ group, size: 2, origin: player.location, arrivalMinute: minute });

  it('is only on its own day', () => {
    expect(themeNightFor({ id: 'pierogi', day: 3 }, 2)).toBeUndefined();
    expect(themeNightFor({ id: 'pierogi', day: 3 }, 3)?.from).toBe(evening);
  });

  it('draws its crowd from 18:00, and nobody else', () => {
    const gain = (p: ReturnType<typeof party>) => utility(pierogiNight, p, 10)! - utility(player, p, 10)!;
    expect(gain(party('tourists', evening))).toBeCloseTo(balance.themeNights.appealBonus);
    expect(gain(party('tourists', evening - 60))).toBeCloseTo(0);
    expect(gain(party('students', evening))).toBeCloseTo(0);
    expect(themeCraving(pierogiNight, evening, 'tourists')).toEqual({ group: 'tourists', wants: { template: 'pierogi' } });
    expect(themeCraving(pierogiNight, evening, 'students')).toBeNull();
  });

  it('cheers everyone up with live music, and disappoints guests who find nothing they came for', () => {
    const accordion = { ...player, themeNight: themeNightFor({ id: 'accordion', day: 0 }, 0) };
    const seafoodNoFish = { ...player, themeNight: themeNightFor({ id: 'seafood', day: 0 }, 0) };
    const moodAt = (restaurant: typeof player) => {
      const progress = startDay(0, [restaurant]);
      seat(createRng(1), progress, 0, party('tourists', evening), evening);
      return progress.floors[0].visits[0].mood;
    };
    expect(moodAt(accordion)).toBe(THEME_NIGHTS.accordion.mood);
    expect(moodAt(seafoodNoFish)).toBe(balance.themeNights.missingMood);
    expect(moodAt(player)).toBe(0);
  });

  it('is on when its evening comes, and the day report says how it went', () => {
    const state: GameState = { ...newGame(3), themeNight: { id: 'pierogi', day: 0 } };
    const open = openRestaurant(state);
    expect(open.progress.restaurants[0].themeNight?.from).toBe(evening);
    while (!open.progress.done) playTick(open);
    const { summary, state: next } = closeDay(state, open);
    expect(summary.themeNight).toEqual(expect.objectContaining({ name: THEME_NIGHTS.pierogi.name }));
    expect(summary.themeNight!.guests).toBeGreaterThan(0);
    // It's over: the saved restaurant doesn't carry it on.
    expect(playerOf(next).themeNight).toBeUndefined();
    expect(openRestaurant(next).progress.restaurants[0].themeNight).toBeUndefined();
  });
});
