import { describe, expect, it } from 'vitest';
import { newGame, openRestaurant, playTick, closeDay } from '../sim/game';
import { loadGame, migrate, saveGame, SAVE_VERSION, type SaveStorage } from './save';

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
