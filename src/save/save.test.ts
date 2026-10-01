import { describe, expect, it } from 'vitest';
import { newGame, openRestaurant, playTick, closeDay } from '../sim/game';
import { exportSaveCode, importSaveCode, loadGame, migrate, saveGame, SAVE_VERSION, type SaveStorage } from './save';

/** A stand-in for the browser's localStorage. */
function fakeStorage(): SaveStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
  };
}

const brokenStorage: SaveStorage = {
  getItem: () => {
    throw new Error('blocked');
  },
  setItem: () => {
    throw new Error('storage full');
  },
};

describe('saving and loading', () => {
  it('brings back exactly the game that was saved', () => {
    const storage = fakeStorage();
    let game = newGame(12);
    const open = openRestaurant(game);
    while (!open.progress.done) playTick(open);
    game = closeDay(game, open).state;

    expect(saveGame(game, storage)).toBe(true);
    expect(loadGame(storage)).toEqual(game);
  });

  it('plays on identically after loading', () => {
    const storage = fakeStorage();
    const game = newGame(13);
    saveGame(game, storage);
    const loaded = loadGame(storage)!;

    const play = (state: typeof game) => {
      const open = openRestaurant(state);
      while (!open.progress.done) playTick(open);
      return closeDay(state, open).summary;
    };
    expect(play(loaded)).toEqual(play(game));
  });

  it('writes the save version into the save', () => {
    const storage = fakeStorage();
    saveGame(newGame(1), storage);
    const [text] = storage.data.values();
    expect(JSON.parse(text).saveVersion).toBe(SAVE_VERSION);
  });

  it('finds nothing when there is no save', () => {
    expect(loadGame(fakeStorage())).toBeNull();
  });

  it('shrugs off a damaged save instead of crashing', () => {
    const storage = fakeStorage();
    storage.setItem('old-town-kitchen/save', '{ this is not json');
    expect(loadGame(storage)).toBeNull();
  });

  it('copes with a browser that blocks storage', () => {
    expect(saveGame(newGame(1), brokenStorage)).toBe(false);
    expect(loadGame(brokenStorage)).toBeNull();
    expect(saveGame(newGame(1), null)).toBe(false);
    expect(loadGame(null)).toBeNull();
  });
});

describe('migrating saves', () => {
  it('accepts a current save', () => {
    const game = newGame(3);
    expect(migrate({ saveVersion: SAVE_VERSION, savedAt: '', game })).toEqual(game);
  });

  it('refuses saves from a newer version, or that are not saves at all', () => {
    expect(migrate({ saveVersion: SAVE_VERSION + 1, savedAt: '', game: newGame(3) })).toBeNull();
    expect(migrate({ saveVersion: SAVE_VERSION, savedAt: '', game: { hello: 'there' } })).toBeNull();
    expect(migrate('a string')).toBeNull();
    expect(migrate(null)).toBeNull();
  });
});

describe('upgrading version 1 saves (from before M3)', () => {
  /** What a version 1 save looked like: the same game without the M3 fields. */
  function versionOneSave(game: ReturnType<typeof newGame>) {
    const {
      terracePermitUntilDay: _permit,
      campaigns: _campaigns,
      weather: _weather,
      events: _events,
      news: _news,
      week: _week,
      mewa: _mewa,
      goal: _goal,
      season: _season,
      trophies: _trophies,
      difficulty: _difficulty,
      ...rest
    } = game;
    const restaurants = game.restaurants.map(
      ({ supplier: _s, happyHour: _h, lunchSet: _l, terraceTables: _t, decor: _d, ...old }) => old,
    );
    return { saveVersion: 1, savedAt: '', game: { ...rest, restaurants } };
  }

  it('fills in the new fields with their starting values', () => {
    const game = newGame(21);
    expect(migrate(versionOneSave(game))).toEqual({ ...game, weather: 'cloudy' });
  });

  it('keeps the player’s progress', () => {
    const game = { ...newGame(22), day: 9, cash: 12_345 };
    const upgraded = migrate(versionOneSave(game))!;
    expect(upgraded.day).toBe(9);
    expect(upgraded.cash).toBe(12_345);
    expect(upgraded.team).toEqual(game.team);
  });

  it('loads an old save from storage and plays on', () => {
    const storage = fakeStorage();
    storage.setItem('old-town-kitchen/save', JSON.stringify(versionOneSave(newGame(23))));
    const loaded = loadGame(storage)!;
    const open = openRestaurant(loaded);
    while (!open.progress.done) playTick(open);
    expect(closeDay(loaded, open).state.day).toBe(1);
  });
});

describe('upgrading version 2 saves (from before weather and events)', () => {
  it('starts a cloudy day with no events or news', () => {
    const {
      weather: _w,
      events: _e,
      news: _n,
      week: _k,
      mewa: _m,
      goal: _g,
      season: _s,
      trophies: _t,
      difficulty: _d,
      ...old
    } = newGame(31);
    const upgraded = migrate({ saveVersion: 2, savedAt: '', game: old })!;
    expect(upgraded.weather).toBe('cloudy');
    expect(upgraded.events).toEqual([]);
    expect(upgraded.news).toEqual([]);
    expect(upgraded.week).toEqual({ served: {}, turnedAway: {} });
  });
});

describe('upgrading version 3 saves (from before Mewa)', () => {
  it('gives Mewa’s first goal, an empty season and no trophies yet', () => {
    const game = newGame(41);
    const { mewa: _m, goal: _g, season: _s, trophies: _t, difficulty: _d, ...old } = game;
    expect(migrate({ saveVersion: 3, savedAt: '', game: old })).toEqual(game);
  });
});

describe('upgrading version 4 saves (from before difficulty)', () => {
  it('treats older games as Normal', () => {
    const game = newGame(51);
    const { difficulty: _d, ...old } = game;
    expect(migrate({ saveVersion: 4, savedAt: '', game: old })).toEqual(game);
  });
});

describe('upgrading version 5 saves (from before game over)', () => {
  it('lets older games carry on, even ones in debt', () => {
    const game = { ...newGame(52), cash: -500 };
    const { gameOver: _g, ...old } = game;
    expect(migrate({ saveVersion: 5, savedAt: '', game: old })).toEqual(game);
  });
});

describe('save codes', () => {
  it('turn a game into text and back again, Polish letters and all', () => {
    let game = newGame(61);
    const open = openRestaurant(game);
    while (!open.progress.done) playTick(open);
    game = closeDay(game, open).state;
    const code = exportSaveCode(game);
    expect(code.startsWith('OTK-')).toBe(true);
    expect(code).toMatch(/^[A-Za-z0-9+/=-]+$/);
    expect(importSaveCode(code)).toEqual(game);
    expect(importSaveCode(`  ${code}\n`)).toEqual(game);
  });

  it('refuse anything that isn’t a save code', () => {
    expect(importSaveCode('')).toBeNull();
    expect(importSaveCode('hello there')).toBeNull();
    expect(importSaveCode('OTK-this is not base64!!')).toBeNull();
    expect(importSaveCode(`OTK-${btoa('{"not":"a save"}')}`)).toBeNull();
  });
});
