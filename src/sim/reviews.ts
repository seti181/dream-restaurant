// Reviews: a star rating and a line built from what the guest liked most and least.
// See project.md section 6.8.

import { balance } from '../data/balance';
import type { MenuDish } from '../data/dishes';
import type { GroupId } from '../data/groups';
import {
  COMPLAINTS,
  CRITIC_NAME,
  PRAISE,
  REVIEWER,
  SO_SO_LINES,
  WALKOUT_LINES,
  type ReviewFactor,
} from '../data/reviews';
import { REGULAR } from '../data/personal';
import { hasCytrynowka, pairingsOf, templateOf } from './menu';
import { chance, pick, type RngState } from './rng';
import type { Review, SatisfactionFactors } from './types';

/** Factors closer to zero than this don't stand out enough to write about. */
const NOTICEABLE = 0.1;

/** How a guest refers to a dish mid-sentence: its own name, or e.g. "pierogi". */
function dishWords(dish: MenuDish): string {
  if (dish.name) return `“${dish.name}”`;
  const name = templateOf(dish).name;
  return name.startsWith('Baltic') ? name : name[0].toLowerCase() + name.slice(1);
}

/** The dish a guest remembers: their soup or main, if they had one. */
function mainDish(order: MenuDish[]): MenuDish | undefined {
  return order.find((dish) => ['soup', 'main'].includes(templateOf(dish).category)) ?? order[0];
}

function fill(line: string, dish: MenuDish | undefined, street: string): string {
  return line.replace('{dish}', dish ? dishWords(dish) : 'food').replace('{street}', street);
}

const capitalise = (text: string) => text[0].toUpperCase() + text.slice(1);

/** True if the day report lets the player answer this review: an unhappy guest we know the group of. */
export function canReply(review: Review): boolean {
  return review.group !== undefined && review.stars < balance.reviews.replyBelowStars;
}

export interface ReviewInput {
  group: GroupId;
  order: MenuDish[];
  /** Where the restaurant is, e.g. "ul. Ogarna". */
  street: string;
  /** Null if the party walked out. */
  factors: SatisfactionFactors | null;
  satisfaction: number;
  critic: boolean;
  /** The Friday regular, who only cares whether there was cytrynówka. */
  regular?: boolean;
}

/** The regular's review: delighted with cytrynówka, loudly disappointed without. */
function regularsReview(rng: RngState, input: ReviewInput): Review {
  const gotIt = input.order.some(hasCytrynowka);
  const stars = Math.max(1, Math.min(5, 1 + Math.floor(input.satisfaction / 20)));
  const text = !input.factors
    ? `${REGULAR.shout} And some food, eventually!`
    : gotIt
      ? pick(rng, REGULAR.happy)
      : `${REGULAR.shout} ${pick(rng, REGULAR.grumpy)}`;
  return {
    stars: !input.factors ? 1 : gotIt ? 5 : Math.min(3, stars),
    text,
    reviewer: REGULAR.name,
    critic: false,
  };
}

export function writeReview(rng: RngState, input: ReviewInput): Review {
  if (input.regular) return regularsReview(rng, input);
  const reviewer = input.critic ? CRITIC_NAME : pick(rng, REVIEWER[input.group]);
  if (!input.factors) {
    return { stars: 1, text: pick(rng, WALKOUT_LINES), reviewer, critic: input.critic, group: input.group };
  }
  const stars = Math.max(1, Math.min(5, 1 + Math.floor(input.satisfaction / 20)));

  // Sometimes the guest talks about a pairing on their plate: a hint for the dish creator.
  const pairings = input.order.flatMap(pairingsOf);
  if (pairings.length > 0 && chance(rng, balance.reviews.pairingMentionChance)) {
    return { stars, text: pick(rng, pairings).comment, reviewer, critic: input.critic, group: input.group };
  }

  // Guests mention one of the two things they liked most, and one of the two they liked least.
  const factors = input.factors;
  const keys = Object.keys(factors) as ReviewFactor[];
  const goods = keys.filter((k) => factors[k] > NOTICEABLE).sort((a, b) => factors[b] - factors[a]).slice(0, 2);
  const bads = keys.filter((k) => factors[k] < -NOTICEABLE).sort((a, b) => factors[a] - factors[b]).slice(0, 2);
  const dish = mainDish(input.order);
  const praise = goods.length > 0 ? fill(pick(rng, PRAISE[pick(rng, goods)]), dish, input.street) : null;
  const complaint = bads.length > 0 ? fill(pick(rng, COMPLAINTS[pick(rng, bads)]), dish, input.street) : null;

  let text: string;
  if (praise && complaint) text = `${praise}, but ${complaint}.`;
  else if (praise) text = `${praise}!`;
  else if (complaint) text = `${capitalise(complaint)}.`;
  else text = pick(rng, SO_SO_LINES);
  return { stars, text, reviewer, critic: input.critic, group: input.group };
}
