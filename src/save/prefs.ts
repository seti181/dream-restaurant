// The player's sound settings. They belong to this tablet, not to the game,
// so they live in their own small entry in localStorage, apart from the save.

import { browserStorage, type SaveStorage } from './save';

const PREFS_KEY = 'old-town-kitchen/prefs';

export interface SoundPrefs {
  /** The quick mute button in the top bar: silences everything. */
  muted: boolean;
  music: boolean;
  /** Sound effects: the till, the seagulls, the café murmur. */
  sound: boolean;
}

export const DEFAULT_PREFS: SoundPrefs = { muted: false, music: true, sound: true };

export function loadPrefs(storage: SaveStorage | null = browserStorage()): SoundPrefs {
  try {
    const raw = storage?.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    const saved = JSON.parse(raw) as Partial<SoundPrefs>;
    const flag = (value: unknown, fallback: boolean) => (typeof value === 'boolean' ? value : fallback);
    return {
      muted: flag(saved.muted, DEFAULT_PREFS.muted),
      music: flag(saved.music, DEFAULT_PREFS.music),
      sound: flag(saved.sound, DEFAULT_PREFS.sound),
    };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function savePrefs(prefs: SoundPrefs, storage: SaveStorage | null = browserStorage()): boolean {
  try {
    storage?.setItem(PREFS_KEY, JSON.stringify(prefs));
    return storage !== null;
  } catch {
    return false;
  }
}
