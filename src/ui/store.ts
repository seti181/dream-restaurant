// UI state: wraps the simulation's game state and turns player actions into
// simulation calls. Screens read from here and call the actions; they never
// change the game state themselves.

import { create } from 'zustand';
import { balance } from '../data/balance';
import { minuteOfDay } from '../sim/clock';
import {
  closeDay,
  newGame,
  openRestaurant,
  playTick,
  tallyFor,
  type DaySummary,
  type DayTally,
  type GameState,
  type OpenDay,
} from '../sim/game';

/** Plan: time paused, getting ready. Open: the day is playing. Day over: the results. */
export type Phase = 'plan' | 'open' | 'dayOver';

/** 0 = paused. */
export type Speed = 0 | 1 | 2 | 4;

export interface LiveDay extends DayTally {
  minute: number;
  /** True after 22:00, while the last guests finish. */
  closing: boolean;
}

interface GameStore {
  game: GameState;
  phase: Phase;
  speed: Speed;
  openDay: OpenDay | null;
  live: LiveDay | null;
  summary: DaySummary | null;

  open: () => void;
  tick: () => void;
  setSpeed: (speed: Speed) => void;
  planNextDay: () => void;
}

function liveFrom(openDay: OpenDay): LiveDay {
  const { progress } = openDay;
  const minute = minuteOfDay(Math.max(0, progress.tick - 1));
  return {
    ...tallyFor(progress.outcomes, 'player'),
    minute,
    closing: minute >= balance.clock.closeMinute,
  };
}

export const useGame = create<GameStore>((set, get) => ({
  game: newGame(Date.now() >>> 0),
  phase: 'plan',
  speed: 1,
  openDay: null,
  live: null,
  summary: null,

  open: () => {
    const openDay = openRestaurant(get().game);
    set({
      phase: 'open',
      openDay,
      live: liveFrom(openDay),
      speed: get().speed === 0 ? 1 : get().speed,
    });
  },

  tick: () => {
    const { openDay, game } = get();
    if (!openDay) return;
    playTick(openDay);
    if (openDay.progress.done) {
      const { state, summary } = closeDay(game, openDay);
      set({ game: state, summary, phase: 'dayOver', openDay: null, live: null });
    } else {
      set({ live: liveFrom(openDay) });
    }
  },

  setSpeed: (speed) => set({ speed }),

  planNextDay: () => set({ phase: 'plan', summary: null }),
}));
