// Rival moves to answer: on some Mondays one rival acts against the player, and the player picks
// one of three answers on the Today tab. The moves themselves are in data/rivalMoves.ts.
// See project.md section 6.15, C9.

import { balance } from '../data/balance';
import type { GroupId } from '../data/groups';
import { RIVAL_MOVE_IDS, RIVAL_MOVES, type RivalMoveId } from '../data/rivalMoves';
import type { GameState } from './game';
import { recipeKey, specialOf } from './menu';
import { isNeptuneDay } from './neptune';
import { chance, createRng, pick } from './rng';
import { staffOf } from './staff';
import type { MenuDish } from '../data/dishes';
import type { Restaurant } from './types';

/** A rival move on the go. Saved with the game. */
export interface RivalMoveState {
  id: RivalMoveId;
  /** The Monday it came. */
  day: number;
  /** Its last day. */
  untilDay: number;
  /** The answer picked (0–2), or null while waiting for one. */
  answer: number | null;
  /** The chef the rival is after (an employee id). */
  chefId?: number;
  chefName?: string;
  /** The special the rival copied. */
  dish?: MenuDish;
  /** How it came out, in a sentence, once answered. */
  result?: string;
}

/** The chef a rival would most like: the best cook. */
function bestChef(state: GameState) {
  return state.team
    .filter((person) => person.role === 'chef')
    .sort((a, b) => b.skill + b.speed - (a.skill + a.speed))[0];
}

function possible(id: RivalMoveId, state: GameState, monday: number): boolean {
  // No price war in the Fair's last week: the Golden Neptune shouldn't be decided by a discount.
  if (id === 'priceWar' && isNeptuneDay(monday + 6)) return false;
  switch (RIVAL_MOVES[id].needs) {
    case 'twoChefs':
      return state.team.filter((person) => person.role === 'chef').length >= 2;
    case 'special':
      return specialOf(state.restaurants[0]) !== null;
    default:
      return true;
  }
}

/** Maybe a rival makes a move against the player this Monday, never the same as last time. Its own dice. */
export function rollRivalMove(seed: number, monday: number, state: GameState): RivalMoveState | null {
  const rng = createRng(seed);
  if (monday < balance.rivalMoves.firstDay || !chance(rng, balance.rivalMoves.chancePerMonday)) return null;
  const options = RIVAL_MOVE_IDS.filter((id) => id !== state.rivalMove?.id && possible(id, state, monday));
  if (options.length === 0) return null;
  const id = pick(rng, options);
  const move: RivalMoveState = { id, day: monday, untilDay: monday + RIVAL_MOVES[id].days - 1, answer: null };
  if (id === 'poachChef') {
    const chef = bestChef(state);
    move.chefId = chef.id;
    move.chefName = chef.name;
  }
  if (id === 'copySpecial') move.dish = { ...specialOf(state.restaurants[0])! };
  return move;
}

/** The card's text, with the chef's name and the dish filled in. */
export function rivalMoveText(move: RivalMoveState, text: string): string {
  return text.replaceAll('{chef}', move.chefName ?? 'your chef').replaceAll('{dish}', move.dish?.name ?? move.dish?.template ?? '');
}

const addPoints = (points: Record<GroupId, number>, change: Partial<Record<GroupId, number>> = {}) => {
  const result = { ...points };
  for (const [g, n] of Object.entries(change)) result[g as GroupId] = Math.max(0, Math.min(100, result[g as GroupId] + (n ?? 0)));
  return result;
};

/** Whether this answer is possible: one about the lunch set needs a lunch set. */
export function canAnswer(state: GameState, answer: number): boolean {
  const move = state.rivalMove;
  if (!move || move.answer !== null || answer < 0 || answer > 2) return false;
  return RIVAL_MOVES[move.id].answers[answer].needs !== 'lunchSet' || state.restaurants[0].lunchSet !== null;
}

/** Answers the rival move on the go (once): the answer's effects happen now. */
export function answerRivalMove(state: GameState, answer: number): GameState {
  const move = state.rivalMove;
  if (!move || !canAnswer(state, answer)) return state;
  const kind = RIVAL_MOVES[move.id];
  const { effects, result } = kind.answers[answer];
  let next: GameState = { ...state, cash: state.cash + (effects.cash ?? 0) };
  let [player, ...rivals] = next.restaurants;
  player = {
    ...player,
    awareness: addPoints(player.awareness, effects.awareness),
    reputation: addPoints(player.reputation, effects.reputation),
  };
  if (effects.lunchSetPrice && player.lunchSet) {
    player = { ...player, lunchSet: { ...player.lunchSet, price: Math.round(player.lunchSet.price * effects.lunchSetPrice) } };
  }
  let text = result;
  if (move.id === 'poachChef' && move.chefId !== undefined) {
    // Does the chef stay? Its own dice, so the answer never changes anything else.
    const dice = createRng((state.rng.s ^ Math.imul(move.day + 41, 0x2c1b3c6d)) >>> 0);
    const stays = effects.stayChance === undefined || chance(dice, effects.stayChance);
    const chef = next.team.find((person) => person.id === move.chefId);
    if (chef && stays) {
      const kept = {
        ...chef,
        wage: Math.round(chef.wage * (effects.raise ?? 1)),
        morale: Math.min(100, chef.morale + (effects.morale ?? 0)),
      };
      next = { ...next, team: next.team.map((person) => (person.id === chef.id ? kept : person)) };
      if (effects.stayChance !== undefined && effects.stayChance < 1) text += ` ${chef.name} stays.`;
    } else if (chef) {
      // They leave for Nonna Rosa's kitchen, which gets a little better.
      next = { ...next, team: next.team.filter((person) => person.id !== chef.id) };
      rivals = rivals.map((r) => (r.id === kind.rival ? { ...r, chefs: [...r.chefs, ...staffOf([chef], 'chef')] } : r));
      if (effects.stayChance !== undefined && effects.stayChance > 0) text += ` But ${chef.name} has made up their mind, and goes.`;
      player = { ...player, chefs: staffOf(next.team, 'chef') };
    }
  }
  return {
    ...next,
    restaurants: [player, ...rivals],
    rivalMove: { ...move, answer, result: rivalMoveText(move, text) },
  };
}

/** What the move on the go does to the restaurants on this day (answered or not). */
export function rivalMoveOn(state: GameState, day: number, restaurants: Restaurant[]): Restaurant[] {
  const move = state.rivalMove;
  if (!move || day < move.day || day > move.untilDay) return restaurants;
  const kind = RIVAL_MOVES[move.id];
  const answer = kind.answers[move.answer ?? kind.unanswered].effects;
  return restaurants.map((restaurant) => {
    if (restaurant.id === 'player') {
      return {
        ...restaurant,
        priceFactor: answer.priceFactor ?? restaurant.priceFactor,
        moodBonus: answer.mood ?? restaurant.moodBonus,
        pull: answer.pull ?? restaurant.pull,
      };
    }
    if (restaurant.id !== kind.rival) return restaurant;
    const side = kind.rivalSide;
    let changed: Restaurant = { ...restaurant, priceFactor: side.priceFactor ?? restaurant.priceFactor, pull: side.pull ?? restaurant.pull };
    if (side.copySpecial && move.dish) {
      const onMenu = changed.menu.some((dish) => recipeKey(dish) === recipeKey(move.dish!));
      changed = { ...changed, menu: onMenu ? changed.menu : [...changed.menu, move.dish], special: recipeKey(move.dish) };
    }
    return changed;
  });
}
