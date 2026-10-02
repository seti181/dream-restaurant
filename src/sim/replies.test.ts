import { describe, expect, it } from 'vitest';
import { balance } from '../data/balance';
import { REPLIES } from '../data/reviews';
import { replyToReview } from './actions';
import { closeDay, newGame, openRestaurant, playerOf, playTick } from './game';
import { canReply } from './reviews';
import type { Review } from './types';

const unhappy: Review = { stars: 1, text: 'We waited forever.', reviewer: 'a student', critic: false, group: 'students' };

describe('replying to reviews', () => {
  it('is for unhappy guests whose group we know', () => {
    expect(canReply(unhappy)).toBe(true);
    expect(canReply({ ...unhappy, stars: balance.reviews.replyBelowStars })).toBe(false);
    expect(canReply({ ...unhappy, group: undefined })).toBe(false);
  });

  it('wins the group back a little with kind words, more with a dessert, and loses it by arguing', () => {
    const state = newGame(1);
    const before = playerOf(state).reputation.students;
    const after = (reply: keyof typeof REPLIES) => replyToReview(state, unhappy, reply);

    expect(playerOf(after('thanks').state).reputation.students).toBeCloseTo(before + REPLIES.thanks.reputation);
    expect(after('thanks').state.cash).toBe(state.cash);
    const invited = after('invite');
    expect(playerOf(invited.state).reputation.students).toBeCloseTo(before + REPLIES.invite.reputation);
    expect(invited.state.cash).toBe(state.cash + REPLIES.invite.cash!);
    expect(playerOf(after('defend').state).reputation.students).toBeCloseTo(before + REPLIES.defend.reputation);
    // Other groups don't notice.
    expect(playerOf(invited.state).reputation.locals).toBe(playerOf(state).reputation.locals);
  });

  it('tells you how the guest took it, by name', () => {
    const { result } = replyToReview(newGame(1), unhappy, 'invite');
    expect(result.startsWith('A student')).toBe(true);
    expect(replyToReview(newGame(1), unhappy, 'invite').result).toBe(result);
  });

  it('does nothing for a happy review', () => {
    const state = newGame(1);
    expect(replyToReview(state, { ...unhappy, stars: 5 }, 'thanks').state).toBe(state);
  });

  it('puts unhappy reviews that can be answered before the others in the day report', () => {
    let state = newGame(3);
    for (let day = 0; day < 6; day++) {
      const open = openRestaurant(state);
      while (!open.progress.done) {
        open.moments.slots = [];
        playTick(open);
      }
      const { state: next, summary } = closeDay(state, open);
      const answerable = summary.reviews.filter((r) => !r.critic).map(canReply);
      // Once one can't be answered, none after it can.
      expect(answerable.slice(answerable.indexOf(false) < 0 ? answerable.length : answerable.indexOf(false))).not.toContain(true);
      state = next;
    }
  });
});
