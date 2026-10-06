// Saving and loading the game in the browser's localStorage.
// Every save carries a version number, so saves made by older versions of the
// game can be upgraded by `migrate` instead of being lost.

import { balance } from '../data/balance';
import { FIRST_GOAL } from '../data/mewa';
import type { GameState } from '../sim/game';
import { startGoal } from '../sim/goals';
import { PORTUGUESE_CORNER } from '../data/personal';

export const SAVE_VERSION = 26;
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

function upgradeFrom7(game: Record<string, unknown>): Record<string, unknown> {
  // Version 8 remembers which choice cards came up recently; older games start with a clean slate.
  return { momentsSeen: {}, ...game };
}

function upgradeFrom8(game: Record<string, unknown>): Record<string, unknown> {
  // Version 9 starts the happy hour with a button during the day, so the old daily setting goes.
  const restaurants = (game.restaurants as Record<string, unknown>[]).map(({ happyHour: _old, ...restaurant }) => restaurant);
  return { ...game, restaurants };
}

function upgradeFrom9(game: Record<string, unknown>): Record<string, unknown> {
  // Version 10 deals choice cards from a shuffled deck, and remembers what answers set in motion.
  return { momentDeck: [], upcoming: [], ...game };
}

function upgradeFrom10(game: Record<string, unknown>): Record<string, unknown> {
  // Version 11 adds the Portuguese corner: Ana from Coimbra comes by on day 8, or tomorrow if that's past.
  const day = Math.max(PORTUGUESE_CORNER.day, (game.day as number) ?? 0);
  const upcoming = (game.upcoming as { card?: string }[] | undefined) ?? [];
  const unlocks = (game.unlocks as string[] | undefined) ?? [];
  const already = upcoming.some((u) => u.card === PORTUGUESE_CORNER.card) || unlocks.length > 0;
  const visit = { fromDay: day, untilDay: day, card: PORTUGUESE_CORNER.card };
  return { ...game, unlocks, upcoming: already ? upcoming : [...upcoming, visit] };
}

function upgradeFrom11(game: Record<string, unknown>): Record<string, unknown> {
  // Version 12 lets each card rest for a while after it comes up, instead of dealing them from a deck.
  const { momentDeck: _old, ...rest } = game;
  return rest;
}

function upgradeFrom12(game: Record<string, unknown>): Record<string, unknown> {
  // Version 13 brings the named regulars: nobody has come by yet, so every story starts at the beginning.
  return { regulars: {}, ...game };
}

function upgradeFrom13(game: Record<string, unknown>): Record<string, unknown> {
  // Version 14 adds morale: everyone starts in good spirits.
  const withMorale = (people: unknown) =>
    (people as Record<string, unknown>[]).map((person) => ({ morale: balance.staff.morale.start, ...person }));
  return { ...game, team: withMorale(game.team), candidates: withMorale(game.candidates) };
}

function upgradeFrom14(game: Record<string, unknown>): Record<string, unknown> {
  // Version 15 adds stories for the team: everyone counts as having joined on day 0,
  // and Pani Krystyna and Kacper are recognised as the team you started with.
  const starters: Record<string, string> = { 'Pani Krystyna': 'krystyna', Kacper: 'kacper' };
  const team = (game.team as Record<string, unknown>[]).map((person) => {
    const starter = !person.special && starters[person.name as string];
    return { since: 0, ...person, ...(starter ? { starter } : {}) };
  });
  return { ...game, team };
}

function upgradeFrom15(game: Record<string, unknown>): Record<string, unknown> {
  // Version 16 renames three regulars, so their names don't clash with the rival owners:
  // Marek is now Filip, Pan Zbigniew is Pan Henryk, and Ola is Weronika. Their stories carry on.
  const renamed: Record<string, string> = { marek: 'filip', zbigniew: 'henryk', ola: 'weronika' };
  const stories = (game.regulars as Record<string, unknown> | undefined) ?? {};
  const regulars = Object.fromEntries(Object.entries(stories).map(([id, story]) => [renamed[id] ?? id, story]));
  return { ...game, regulars };
}

/** Version 16 → 17 (M7b forecast): the game remembers today's small happening in town (none in older saves). */
function upgradeFrom16(game: Record<string, unknown>): Record<string, unknown> {
  return { happening: null, ...game };
}

/**
 * Version 17 → 18 (M7b bookings): booking requests to accept or decline (none yet in older saves).
 * The tour bus, the wedding party and the birthday table are requests now, no longer surprise events.
 */
function upgradeFrom17(game: Record<string, unknown>): Record<string, unknown> {
  const nowRequests = ['tourBus', 'wedding', 'birthday'];
  const events = ((game.events as { id: string }[] | undefined) ?? []).filter((e) => !nowRequests.includes(e.id));
  return { bookings: [], ...game, events };
}

/** Version 18 → 19 (M7b dishes level up): portions served of each kind of dish (none counted in older saves). */
function upgradeFrom18(game: Record<string, unknown>): Record<string, unknown> {
  return { dishPractice: {}, ...game };
}

/**
 * Version 19 → 20 (M7b rank-ups): guests served by each group (counted from now on) and the
 * restaurant's rank, starting as a Bar; it catches up as guests are served.
 */
function upgradeFrom19(game: Record<string, unknown>): Record<string, unknown> {
  return { guestsServed: {}, rank: 0, ...game };
}

/** Version 20 → 21 (M7b weekly ranking): the paper's Old Town top five comes out next Monday. */
function upgradeFrom20(game: Record<string, unknown>): Record<string, unknown> {
  return { ranking: null, ...game };
}

/** Version 21 → 22 (M7b daily goals): Mewa's small goal for the day starts the next morning. */
function upgradeFrom21(game: Record<string, unknown>): Record<string, unknown> {
  return { dailyGoal: null, ...game };
}

/** Version 22 → 23 (M7b weekly trends): Gdańsk's first craze comes next Monday. */
function upgradeFrom22(game: Record<string, unknown>): Record<string, unknown> {
  return { trend: null, ...game };
}

/** Version 23 → 24 (M7b theme nights): none booked yet. */
function upgradeFrom23(game: Record<string, unknown>): Record<string, unknown> {
  return { themeNight: null, ...game };
}

/** Version 24 → 25 (M7b rival moves): no rival has made a move against the player yet. */
function upgradeFrom24(game: Record<string, unknown>): Record<string, unknown> {
  return { rivalMove: null, ...game };
}

/** Version 25 → 26 (M7b cook-offs): no challenge yet. */
function upgradeFrom25(game: Record<string, unknown>): Record<string, unknown> {
  return { cookOff: null, ...game };
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
  if (version === 7) {
    game = upgradeFrom7(game as unknown as Record<string, unknown>);
    version = 8;
  }
  if (version === 8) {
    game = upgradeFrom8(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 9;
  }
  if (version === 9) {
    game = upgradeFrom9(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 10;
  }
  if (version === 10) {
    game = upgradeFrom10(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 11;
  }
  if (version === 11) {
    game = upgradeFrom11(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 12;
  }
  if (version === 12) {
    game = upgradeFrom12(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 13;
  }
  if (version === 13) {
    game = upgradeFrom13(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 14;
  }
  if (version === 14) {
    game = upgradeFrom14(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 15;
  }
  if (version === 15) {
    game = upgradeFrom15(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 16;
  }
  if (version === 16) {
    game = upgradeFrom16(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 17;
  }
  if (version === 17) {
    game = upgradeFrom17(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 18;
  }
  if (version === 18) {
    game = upgradeFrom18(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 19;
  }
  if (version === 19) {
    game = upgradeFrom19(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 20;
  }
  if (version === 20) {
    game = upgradeFrom20(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 21;
  }
  if (version === 21) {
    game = upgradeFrom21(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 22;
  }
  if (version === 22) {
    game = upgradeFrom22(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 23;
  }
  if (version === 23) {
    game = upgradeFrom23(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 24;
  }
  if (version === 24) {
    game = upgradeFrom24(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 25;
  }
  if (version === 25) {
    game = upgradeFrom25(game as unknown as Record<string, unknown>) as unknown as GameState;
    version = 26;
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
