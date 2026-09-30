// Saving and loading the game in the browser's localStorage.
// Every save carries a version number, so saves made by older versions of the
// game can be upgraded by `migrate` instead of being lost.

import type { GameState } from '../sim/game';

export const SAVE_VERSION = 3;
const SAVE_KEY = 'old-town-kitchen/save';

interface SaveFile {
  saveVersion: number;
  /** When the save was made, as an ISO date string. */
  savedAt: string;
  game: GameState;
}

/** The parts of localStorage we use. Tests pass a stand-in. */
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): SaveStorage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Some browsers throw just for looking at localStorage when it is blocked.
    return null;
  }
}

/** Saves the game. Returns false if the browser wouldn't let us. */
export function saveGame(game: GameState, storage: SaveStorage | null = browserStorage()): boolean {
  if (!storage) return false;
  const file: SaveFile = { saveVersion: SAVE_VERSION, savedAt: new Date().toISOString(), game };
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(file));
    return true;
  } catch {
    return false;
  }
}

/** Loads the saved game, or null if there is none or it can't be read. */
export function loadGame(storage: SaveStorage | null = browserStorage()): GameState | null {
  if (!storage) return null;
  try {
    const text = storage.getItem(SAVE_KEY);
    return text === null ? null : migrate(JSON.parse(text));
  } catch {
    return null;
  }
}

function looksLikeGame(game: unknown): game is GameState {
  if (typeof game !== 'object' || game === null) return false;
  const g = game as Partial<GameState>;
  return typeof g.day === 'number' && typeof g.cash === 'number' && Array.isArray(g.restaurants);
}

/**
 * Version 1 → 2 (M3): restaurants gain a supplier, happy hour, lunch set, terrace
 * tables and decor; the game gains a terrace permit and marketing campaigns.
 */
function upgradeFrom1(game: Record<string, unknown>): Record<string, unknown> {
  const restaurants = (game.restaurants as Record<string, unknown>[]).map((restaurant) => ({
    supplier: 'market',
    happyHour: false,
    lunchSet: null,
    terraceTables: 0,
    decor: [],
    ...restaurant,
  }));
  return { terracePermitUntilDay: null, campaigns: [], ...game, restaurants };
}

/** Version 2 → 3 (M3 events): the game gains weather, surprise events, news and the week's tally. */
function upgradeFrom2(game: Record<string, unknown>): Record<string, unknown> {
  return { weather: 'cloudy', events: [], news: [], week: { served: {}, turnedAway: {} }, ...game };
}

/**
 * Brings a save from any older version up to date, one version at a time.
 * Returns null for saves that can't be understood.
 */
export function migrate(data: unknown): GameState | null {
  if (typeof data !== 'object' || data === null) return null;
  const file = data as Partial<SaveFile>;
  if (typeof file.saveVersion !== 'number' || file.saveVersion > SAVE_VERSION) return null;

  // When the save format changes, bump SAVE_VERSION and add a step here.
  let game: unknown = file.game;
  let version = file.saveVersion;
  if (version === 1 && looksLikeGame(game)) {
    game = upgradeFrom1(game as unknown as Record<string, unknown>);
    version = 2;
  }
  if (version === 2 && looksLikeGame(game)) {
    game = upgradeFrom2(game as unknown as Record<string, unknown>);
    version = 3;
  }

  return looksLikeGame(game) ? game : null;
}
