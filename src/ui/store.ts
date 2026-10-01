// UI state: wraps the simulation's game state and turns player actions into
// simulation calls. Screens read from here and call the actions; they never
// change the game state themselves.

import { create } from 'zustand';
import { balance } from '../data/balance';
import type { DecorId } from '../data/decor';
import type { EquipmentId, ExtraId, TemplateId } from '../data/dishes';
import type { LocationId } from '../data/locations';
import type { CampaignId } from '../data/marketing';
import { MOMENTS } from '../data/moments';
import type { TipId } from '../data/mewa';
import { importSaveCode, loadGame, saveGame } from '../save/save';
import * as actions from '../sim/actions';
import { minuteOfDay } from '../sim/clock';
import { floorView, type FloorView, type Help } from '../sim/day';
import {
  answerTheMoment,
  apologiesLeft,
  closeDay,
  drinkCost,
  helpGuests,
  momentDue,
  newGame,
  openRestaurant,
  playTick,
  tallyFor,
  type DaySummary,
  type DayTally,
  type Difficulty,
  type GameState,
  type OpenDay,
} from '../sim/game';
import type { MomentResult } from '../sim/moments';
import type { Supplier } from '../sim/types';
import { play, startAmbience, stopAmbience } from './sound';

/**
 * Plan: time paused, getting ready. Open: the day is playing. Day over: the results.
 * Ceremony: the Golden Neptune, after the Fair's last day. Game over: the money ran out.
 */
export type Phase = 'plan' | 'open' | 'dayOver' | 'ceremony' | 'gameOver';

/** 0 = paused. */
export type Speed = 0 | 1 | 2 | 4;

/** The tabs of the planning screen. */
export type PlanTab =
  | 'today'
  | 'menu'
  | 'kitchen'
  | 'interior'
  | 'staff'
  | 'marketing'
  | 'restaurant'
  | 'map'
  | 'mewa'
  | 'settings';

export interface LiveDay extends DayTally {
  minute: number;
  /** True after 22:00, while the last guests finish. */
  closing: boolean;
  /** Who is sitting where, for the restaurant view. */
  floor: FloorView;
  /** Excuses from anyone who didn't turn up today. */
  absent: string[];
  /** A choice card waiting for an answer; the clock stops until it gets one. */
  moment: { title: string; text: string; choices: [string, string] } | null;
  /** What the last answer did; the day screen shows it for a few seconds. */
  lastMoment: MomentResult | null;
  /** The chef's apologies left today. */
  apologiesLeft: number;
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
  /** Answers the choice card on screen with its first (0) or second (1) answer. */
  answerMoment: (choice: 0 | 1) => void;
  /** Helps the guests waiting at one of the tables. */
  helpTable: (table: number, help: Help) => void;
  /** What a free drink would cost at a table right now, or null if it can't have one. */
  drinkCostAt: (table: number) => number | null;
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
  buyTable: () => void;
  buyDecor: (id: DecorId) => void;
  buyTerracePermit: () => void;
  launchCampaign: (id: CampaignId) => void;
  setHappyHour: (on: boolean) => void;
  relocate: (to: LocationId) => void;
  dismissTip: (tip: TipId) => void;
  skipTips: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  /** Loads a save code; returns false if it isn't a valid one. */
  importSave: (code: string) => boolean;
  startNewGame: (difficulty: Difficulty) => void;
  upgradeMenuBoard: () => void;
  setSupplier: (supplier: Supplier) => void;
}

function liveFrom(openDay: OpenDay): LiveDay {
  const { progress, moments } = openDay;
  const minute = minuteOfDay(Math.max(0, progress.tick - 1));
  const pending = moments.pending && MOMENTS[moments.pending.id];
  return {
    ...tallyFor(progress.outcomes, 'player'),
    minute,
    closing: minute >= balance.clock.closeMinute,
    floor: { ...floorView(progress, 0), terraceTables: openDay.terraceBuilt },
    absent: openDay.absent.map((a) => a.excuse),
    moment: pending
      ? { title: pending.title, text: pending.text, choices: [pending.choices[0].label, pending.choices[1].label] }
      : null,
    lastMoment: moments.results[moments.results.length - 1] ?? null,
    apologiesLeft: apologiesLeft(openDay),
  };
}

const startingGame = loadGame() ?? newGame(Date.now() >>> 0);

export const useGame = create<GameStore>((set, get) => ({
  // Carry on from the saved game, or start a new one with a fresh seed.
  game: startingGame,
  phase: startingGame.gameOver ? 'gameOver' : 'plan',
  speed: 1,
  openDay: null,
  live: null,
  summary: null,
  planTab: 'today',
  saved: null,

  open: () => {
    if (get().phase !== 'plan' || get().game.gameOver) return;
    // Save the plan first, so menu and staff changes survive if the app closes mid-day.
    const saved = saveGame(get().game);
    const openDay = openRestaurant(get().game);
    play('doorbell');
    startAmbience();
    set({
      saved,
      phase: 'open',
      openDay,
      live: liveFrom(openDay),
      speed: get().speed === 0 ? 1 : get().speed,
    });
  },

  tick: () => {
    const { openDay, game, live } = get();
    if (!openDay) return;
    // A choice card stops the clock until it is answered.
    if (openDay.moments.pending) return;
    if (momentDue(openDay)) {
      play('card');
      set({ live: liveFrom(openDay) });
      return;
    }
    playTick(openDay);
    if (openDay.progress.done) {
      const { state, summary } = closeDay(game, openDay);
      stopAmbience();
      if (state.gameOver) play('sad');
      else if (summary.goalCompleted) play('goal');
      set({ game: state, summary, phase: 'dayOver', openDay: null, live: null, saved: saveGame(state) });
    } else {
      const next = liveFrom(openDay);
      // The till rings as guests pay.
      if (live && next.guestsServed > live.guestsServed) play('ding');
      set({ live: next });
    }
  },

  answerMoment: (choice) => {
    const { openDay } = get();
    if (!openDay) return;
    const result = answerTheMoment(openDay, choice);
    if (result && result.cash < 0) play('coin');
    set({ live: liveFrom(openDay) });
  },

  helpTable: (table, help) => {
    const { openDay } = get();
    if (!openDay || !helpGuests(openDay, table, help)) return;
    play(help === 'drink' ? 'coin' : 'ding');
    set({ live: liveFrom(openDay) });
  },

  drinkCostAt: (table) => {
    const { openDay } = get();
    return openDay ? drinkCost(openDay, table) : null;
  },

  setSpeed: (speed) => set({ speed }),

  planNextDay: () => {
    // After the Fair's last report comes the Golden Neptune ceremony, unless the money ran out.
    if (get().game.gameOver) set({ phase: 'gameOver', summary: null });
    else if (get().phase === 'dayOver' && get().summary?.neptune) {
      if (get().summary?.neptune?.playerWon) play('fanfare');
      set({ phase: 'ceremony' });
    }
    else set({ phase: 'plan', summary: null, planTab: 'today' });
  },

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
  buyTable: () => plan((game) => actions.buyTable(game)),
  buyDecor: (id) => plan((game) => actions.buyDecor(game, id)),
  buyTerracePermit: () => plan((game) => actions.buyTerracePermit(game)),
  launchCampaign: (id) => plan((game) => actions.launchCampaign(game, id)),
  setHappyHour: (on) => plan((game) => actions.setHappyHour(game, on)),
  relocate: (to) => plan((game) => actions.relocate(game, to)),
  // Mewa's tips can be dismissed on any screen, even mid-day.
  dismissTip: (tip) => set({ game: actions.dismissTip(get().game, tip) }),
  skipTips: () => set({ game: actions.skipTips(get().game) }),
  setDifficulty: (difficulty) => plan((game) => actions.setDifficulty(game, difficulty)),

  importSave: (code) => {
    const game = importSaveCode(code);
    if (!game || !canStartOver()) return false;
    set({ game, phase: game.gameOver ? 'gameOver' : 'plan', planTab: 'today', saved: saveGame(game) });
    return true;
  },

  startNewGame: (difficulty) => {
    if (!canStartOver()) return;
    const game = newGame(Date.now() >>> 0, difficulty);
    set({ game, phase: 'plan', planTab: 'today', saved: saveGame(game) });
  },
  upgradeMenuBoard: () => plan((game) => actions.upgradeMenuBoard(game)),
  setSupplier: (supplier) => plan((game) => actions.setSupplier(game, supplier)),
}));

/** A new or loaded game can replace the current one while planning, or after a game over. */
function canStartOver(): boolean {
  const { phase } = useGame.getState();
  return phase === 'plan' || phase === 'gameOver';
}

/** Applies a planning action. Plans can only change while time is paused before opening. */
function plan(action: (game: GameState) => GameState): void {
  const { phase, game } = useGame.getState();
  if (phase !== 'plan') return;
  const next = action(game);
  // Money spent: a little coin sound.
  if (next.cash < game.cash) play('coin');
  useGame.setState({ game: next });
}
