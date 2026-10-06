import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { RIVAL_MOVES } from '../data/rivalMoves';
import { closeDay, newGame, openRestaurant, playerOf, playTick, type GameState } from './game';
import { answerRivalMove, canAnswer, rivalMoveOn, rollRivalMove, type RivalMoveState } from './rivalMoves';
import type { Employee } from './types';

/** A game with a second chef, so Nonna Rosa has someone to be after. */
function withTwoChefs(): GameState {
  const game = newGame(1);
  const chef = game.team.find((p) => p.role === 'chef')!;
  const second: Employee = { ...chef, id: 99, name: 'Marek', skill: 5, speed: 5, starter: undefined };
  return { ...game, day: 7, team: [...game.team, second] };
}

const poach = (state: GameState): RivalMoveState => ({ id: 'poachChef', day: state.day, untilDay: state.day, answer: null, chefId: 99, chefName: 'Marek' });

describe('rival moves', () => {
  it('come on some Mondays from the second week, and only when they make sense', () => {
    const game = newGame(1);
    for (let seed = 0; seed < 50; seed++) expect(rollRivalMove(seed, 0, game)).toBeNull();
    const rolls = Array.from({ length: 400 }, (_, seed) => rollRivalMove(seed, 7, game)).filter((m) => m !== null);
    expect(rolls.length / 400).toBeCloseTo(balance.rivalMoves.chancePerMonday, 1);
    // One chef and no special: Nonna Rosa and Karczma have nothing to go after.
    expect(rolls.every((m) => m!.id !== 'poachChef' && m!.id !== 'copySpecial')).toBe(true);
    expect(rolls.every((m) => m!.untilDay === 7 + RIVAL_MOVES[m!.id].days - 1)).toBe(true);
  });

  it('only offer the lunch set answer with a lunch set on the menu', () => {
    const state: GameState = { ...newGame(4), day: 7, rivalMove: { id: 'lunchDeal', day: 7, untilDay: 13, answer: null } };
    expect(playerOf(state).lunchSet).toBeNull();
    expect(canAnswer(state, 1)).toBe(false);
    expect(answerRivalMove(state, 1)).toBe(state);
    expect(canAnswer(state, 0)).toBe(true);
  });

  it('never start a price war in the Fair’s last week', () => {
    const game = { ...newGame(1), rivalMove: null };
    for (let seed = 0; seed < 200; seed++) expect(rollRivalMove(seed, 35, game)?.id).not.toBe('priceWar');
  });

  it('can be answered once: matching the offer keeps the chef, with a raise', () => {
    const state = { ...withTwoChefs() };
    const asked = { ...state, rivalMove: poach(state) };
    const kept = answerRivalMove(asked, 0);
    const marek = kept.team.find((p) => p.id === 99)!;
    expect(marek.wage).toBe(Math.round(state.team.find((p) => p.id === 99)!.wage * 1.2));
    expect(kept.rivalMove?.answer).toBe(0);
    expect(kept.rivalMove?.result).toContain('Marek');
    expect(answerRivalMove(kept, 2)).toBe(kept);
  });

  it('lose the chef to Nonna Rosa, who cooks better for it', () => {
    const state = withTwoChefs();
    const gone = answerRivalMove({ ...state, rivalMove: poach(state) }, 2);
    expect(gone.team.some((p) => p.id === 99)).toBe(false);
    expect(playerOf(gone).chefs).toHaveLength(1);
    const rosa = gone.restaurants.find((r) => r.id === 'nonnaRosa')!;
    expect(rosa.chefs.length).toBe(state.restaurants.find((r) => r.id === 'nonnaRosa')!.chefs.length + 1);
  });

  it('change prices while a price war is on, the answer’s or the one taken unanswered', () => {
    const state: GameState = { ...newGame(2), day: 7, rivalMove: { id: 'priceWar', day: 7, untilDay: 13, answer: null } };
    const unanswered = rivalMoveOn(state, 8, state.restaurants);
    expect(unanswered.find((r) => r.id === 'blyskawica')!.priceFactor).toBeCloseTo(0.8);
    expect(unanswered[0].priceFactor).toBeUndefined();
    const matched = rivalMoveOn(answerRivalMove(state, 0), 8, state.restaurants);
    expect(matched[0].priceFactor).toBeCloseTo(0.85);
    expect(rivalMoveOn(state, 14, state.restaurants)).toBe(state.restaurants);
  });

  it('are settled at closing if nobody answered, and free kompot is paid for every guest', () => {
    const state: GameState = { ...newGame(3), day: 7, rivalMove: { id: 'priceWar', day: 7, untilDay: 7, answer: null } };
    const unanswered = (() => {
      const open = openRestaurant(state);
      while (!open.progress.done) playTick(open);
      return closeDay(state, open);
    })();
    expect(unanswered.state.rivalMove?.answer).toBe(RIVAL_MOVES.priceWar.unanswered);
    expect(unanswered.summary.rivalMove?.title).toBe(RIVAL_MOVES.priceWar.title);
    expect(unanswered.summary.rivalMoveCost).toBe(0);
    const kompot = answerRivalMove(state, 2);
    const open = openRestaurant(kompot);
    while (!open.progress.done) playTick(open);
    const { summary } = closeDay(kompot, open);
    expect(summary.rivalMoveCost).toBe(summary.guestsServed * RIVAL_MOVES.priceWar.answers[2].effects.costPerGuest!);
  });
});
