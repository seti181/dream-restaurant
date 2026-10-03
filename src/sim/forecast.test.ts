import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { HAPPENINGS } from '../data/happenings';
import { FORECAST_MISSES, WEATHER_IDS } from '../data/weather';
import { weekdayOf } from './calendar';
import { conditionsFor, happeningIn, rollHappening } from './events';
import { forecastFor, weatherAtOpening } from './forecast';
import { closeDay, newGame, openRestaurant, playTick, type GameState } from './game';
import { createRng } from './rng';

const SATURDAY = [0, 1, 2, 3, 4, 5, 6].find((day) => weekdayOf(day) === 5)!;

describe('the weather at opening', () => {
  it('is the same every time for the same game', () => {
    const state = newGame(7);
    expect(weatherAtOpening(state)).toBe(weatherAtOpening({ ...state }));
  });

  it('usually matches the forecast, and when it does not, turns into a nearby kind of weather', () => {
    let wrong = 0;
    const games = 2000;
    for (let seed = 0; seed < games; seed++) {
      for (const weather of WEATHER_IDS) {
        const state: GameState = { ...newGame(1), rng: createRng(seed), weather };
        const actual = weatherAtOpening(state);
        if (actual === weather) continue;
        wrong++;
        expect(FORECAST_MISSES[weather]).toContain(actual);
      }
    }
    expect(wrong / (games * WEATHER_IDS.length)).toBeCloseTo(balance.forecast.wrongChance, 1);
  });
});

describe('happenings in town', () => {
  it('come up about as often as balance.ts says', () => {
    const rng = createRng(3);
    const rolls = Array.from({ length: 2000 }, () => rollHappening(rng, 1, 'cloudy'));
    const share = rolls.filter((h) => h !== null).length / rolls.length;
    expect(share).toBeCloseTo(balance.forecast.happeningChance, 1);
  });

  it('only fall on their weekdays and in their weather', () => {
    const rng = createRng(5);
    const rainySaturday = new Set(Array.from({ length: 2000 }, () => rollHappening(rng, SATURDAY, 'rain')));
    expect(rainySaturday).not.toContain('examsOver'); // weekdays only
    expect(rainySaturday).not.toContain('earlyFriday'); // Fridays only
    expect(rainySaturday).not.toContain('beachDay'); // sunshine only
    expect(rainySaturday).toContain('cruiseShip');
    expect(rainySaturday).toContain('lechiaMatch');
  });

  it('are called off when they need weather the day did not bring', () => {
    expect(happeningIn('beachDay', 'sunny')).toBe('beachDay');
    expect(happeningIn('beachDay', 'cloudy')).toBeNull();
    expect(happeningIn('cruiseShip', 'rain')).toBe('cruiseShip');
    expect(happeningIn(null, 'sunny')).toBeNull();
  });

  it('change who is out that day', () => {
    const plain: GameState = { ...newGame(1), weather: 'sunny', happening: null };
    const cruise = conditionsFor({ ...plain, happening: 'cruiseShip' });
    expect(cruise.groups.tourists).toBeCloseTo((conditionsFor(plain).groups.tourists ?? 1) * HAPPENINGS.cruiseShip.groups.tourists!);

    // The beach day was forecast, but it turned cloudy: the locals stay in town after all.
    const beach = conditionsFor({ ...plain, happening: 'beachDay' });
    const calledOff = conditionsFor({ ...plain, weather: 'cloudy', happening: 'beachDay' });
    expect(beach.groups.locals).toBeLessThan(1);
    expect(calledOff.groups.locals ?? 1).toBe(conditionsFor({ ...plain, weather: 'cloudy' }).groups.locals ?? 1);
  });
});

describe("tomorrow's forecast", () => {
  const today: GameState = { ...newGame(1), day: SATURDAY, weather: 'sunny', happening: null };
  const todayConditions = conditionsFor(today);

  it('says how busy the street will be compared with today', () => {
    expect(forecastFor(today, today, todayConditions).crowd).toBe('same');
    expect(forecastFor({ ...today, weather: 'rain' }, today, todayConditions).crowd).toBe('quieter');
    const rainyToday = { ...today, weather: 'rain' as const };
    expect(forecastFor(today, rainyToday, conditionsFor(rainyToday)).crowd).toBe('busier');
  });

  it("ends the day report with the next day's weather and happening", () => {
    const state = newGame(11);
    const open = openRestaurant(state);
    while (!open.progress.done) playTick(open);
    const { state: next, summary } = closeDay(state, open);
    expect(summary.tomorrow).toMatchObject({ day: next.day, weather: next.weather, happening: next.happening });
    expect(summary.weather).toBe(open.weather);
    expect(summary.forecastSaid).toBe(open.weather === state.weather ? null : state.weather);
  });
});
