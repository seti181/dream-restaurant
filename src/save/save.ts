// Saving and loading the game in the browser's localStorage.
// Every save carries a version number, so saves made by older versions of the
// game can be upgraded by `migrate` instead of being lost.

import { FIRST_GOAL } from '../data/mewa';
import type { GameState } from '../sim/game';
import { startGoal } from '../sim/goals';

export const SAVE_VERSION = 7;
const SAVE_KEY = 'old-town-kitchen/save';

interface SaveFile {
  saveVersion: number;
  /** When the save was made, as an ISO date string. */
  savedAt: string;
  game: GameState;
}

/** The parts of localStorage we use. Tests pass a stand-in. */
export type SaveStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function browserStorage(): SaveStorage | null {
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

/** Version 3 → 4 (M3 Mewa): tutorial tips, weekly goals, the season's tally and trophies. */
function upgradeFrom3(game: Record<string, unknown>): Record<string, unknown> {
  return {
    mewa: { seenTips: [], tipsOff: false },
    goal: startGoal(FIRST_GOAL),
    season: { ratings: {}, fairGuests: {} },
    trophies: 0,
    ...game,
  };
}

/** Version 4 → 5 (M3 settings): difficulty. Older games were all Normal. */
function upgradeFrom4(game: Record<string, unknown>): Record<string, unknown> {
  return { difficulty: 'normal', ...game };
}

function upgradeFrom5(game: Record<string, unknown>): Record<string, unknown> {
  // Older games had no game over; they get a fresh start under the new rule.
  return { gameOver: false, ...game };
}

function upgradeFrom6(game: Record<string, unknown>): Record<string, unknown> {
  // The secret recipe arrived in version 7; older games find it at the end of their next day.
  return { secretRecipe: false, ...game };
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
  if (version === 3 && looksLikeGame(game)) {
    game = upgradeFrom3(game as unknown as Record<string, unknown>);
    version = 4;
  }
  if (version === 4 && looksLikeGame(game)) {
    game = upgradeFrom4(game as unknown as Record<string, unknown>);
    version = 5;
  }
  if (version === 5 && looksLikeGame(game)) {
    game = upgradeFrom5(game as unknown as Record<string, unknown>);
    version = 6;
  }
  if (version === 6 && looksLikeGame(game)) {
    game = upgradeFrom6(game as unknown as Record<string, unknown>);
    version = 7;
  }

  return looksLikeGame(game) ? game : null;
}

// ---------- Save codes (backups) ----------

/** Every save code starts with this, so a code from elsewhere is easy to spot. */
const CODE_PREFIX = 'OTK-';

/**
 * The whole game as a line of text that can be copied somewhere safe and pasted
 * back later. It is the save file, packed into letters and digits (base64).
 */
export function exportSaveCode(game: GameState): string {
  const file: SaveFile = { saveVersion: SAVE_VERSION, savedAt: new Date().toISOString(), game };
  const bytes = new TextEncoder().encode(JSON.stringify(file));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return CODE_PREFIX + btoa(binary);
}

/** The game inside a save code, or null if the code isn't a save code or is damaged. */
export function importSaveCode(code: string): GameState | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith(CODE_PREFIX)) return null;
  try {
    const binary = atob(trimmed.slice(CODE_PREFIX.length));
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return migrate(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return null;
  }
}
