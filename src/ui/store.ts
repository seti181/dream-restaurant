// UI state: wraps the simulation's game state and turns player actions into
// simulation calls. Screens read from here and call the actions; they never
// change the game state themselves.

import { create } from 'zustand';
import { balance } from '../data/balance';
import type { EquipmentId, ExtraId, TemplateId } from '../data/dishes';
import { loadGame, saveGame } from '../save/save';
import * as actions from '../sim/actions';
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
import type { Supplier } from '../sim/types';

/** Plan: time paused, getting ready. Open: the day is playing. Day over: the results. */
export type Phase = 'plan' | 'open' | 'dayOver';

/** 0 = paused. */
export type Speed = 0 | 1 | 2 | 4;

/** The tabs of the planning screen. */
export type PlanTab = 'today' | 'menu' | 'kitchen' | 'staff';

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
  planTab: PlanTab;
  /** Whether the last autosave worked; null before the first one. */
  saved: boolean | null;

  open: () => void;
  tick: () => void;
  setSpeed: (speed: Speed) => void;
  planNextDay: () => void;
  setPlanTab: (tab: PlanTab) => void;

  addDish: (template: TemplateId, variant: string, extras?: ExtraId[], name?: string) => void;
  removeDish: (index: number) => void;
  setDishPrice: (index: number, price: number) => void;
  hire: (candidateId: number) => void;
  letGo: (employeeId: number) => void;
  setLunchSet: (soupIndex: number, mainIndex: number) => void;
  setLunchSetPrice: (price: number) => void;
  clearLunchSet: () => void;
  buyEquipment: (id: EquipmentId) => void;
  upgradeMenuBoard: () => void;
  setSupplier: (supplier: Supplier) => void;
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
  // Carry on from the saved game, or start a new one with a fresh seed.
  game: loadGame() ?? newGame(Date.now() >>> 0),
  phase: 'plan',
  speed: 1,
  openDay: null,
  live: null,
  summary: null,
  planTab: 'today',
  saved: null,

  open: () => {
    // Save the plan first, so menu and staff changes survive if the app closes mid-day.
    const saved = saveGame(get().game);
    const openDay = openRestaurant(get().game);
    set({
      saved,
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
      set({ game: state, summary, phase: 'dayOver', openDay: null, live: null, saved: saveGame(state) });
    } else {
      set({ live: liveFrom(openDay) });
    }
  },

  setSpeed: (speed) => set({ speed }),

  planNextDay: () => set({ phase: 'plan', summary: null, planTab: 'today' }),

  setPlanTab: (planTab) => set({ planTab }),

  addDish: (template, variant, extras, name) =>
    plan((game) => actions.addDish(game, template, variant, extras, name)),
  removeDish: (index) => plan((game) => actions.removeDish(game, index)),
  setDishPrice: (index, price) => plan((game) => actions.setDishPrice(game, index, price)),
  hire: (candidateId) => plan((game) => actions.hire(game, candidateId)),
  letGo: (employeeId) => plan((game) => actions.letGo(game, employeeId)),
  setLunchSet: (soupIndex, mainIndex) => plan((game) => actions.setLunchSet(game, soupIndex, mainIndex)),
  setLunchSetPrice: (price) => plan((game) => actions.setLunchSetPrice(game, price)),
  clearLunchSet: () => plan((game) => actions.clearLunchSet(game)),
  buyEquipment: (id) => plan((game) => actions.buyEquipment(game, id)),
  upgradeMenuBoard: () => plan((game) => actions.upgradeMenuBoard(game)),
  setSupplier: (supplier) => plan((game) => actions.setSupplier(game, supplier)),
}));

/** Applies a planning action. Plans can only change while time is paused before opening. */
function plan(action: (game: GameState) => GameState): void {
  const { phase, game } = useGame.getState();
  if (phase !== 'plan') return;
  useGame.setState({ game: action(game) });
}
