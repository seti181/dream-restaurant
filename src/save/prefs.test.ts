import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFS, loadPrefs, savePrefs } from './prefs';

function memory() {
  const items = new Map<string, string>();
  return { getItem: (k: string) => items.get(k) ?? null, setItem: (k: string, v: string) => void items.set(k, v) };
}

describe('sound settings', () => {
  it('start with music and sounds on', () => {
    expect(loadPrefs(memory())).toEqual(DEFAULT_PREFS);
  });

  it('are remembered', () => {
    const storage = memory();
    savePrefs({ muted: true, music: false, sound: true }, storage);
    expect(loadPrefs(storage)).toEqual({ muted: true, music: false, sound: true });
  });

  it('fall back to the defaults when storage is broken or blocked', () => {
    const broken = { getItem: () => '{not json', setItem: () => {} };
    expect(loadPrefs(broken)).toEqual(DEFAULT_PREFS);
    const blocked = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); } };
    expect(loadPrefs(blocked)).toEqual(DEFAULT_PREFS);
    expect(savePrefs(DEFAULT_PREFS, blocked)).toBe(false);
  });
});
