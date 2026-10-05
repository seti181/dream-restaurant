// Booking requests: a few a week, for a day or three ahead, which the player accepts or
// declines. Table bookings come at their time with a wish for the menu; big orders keep a
// chef busy before their deadline. The requests themselves are in data/bookings.ts.
// See project.md section 6.15, A2.

import { balance } from '../data/balance';
import { BOOKING_KIND_IDS, BOOKING_KINDS, type BookingKind, type BookingKindId, type MenuWant } from '../data/bookings';
import type { MenuDish } from '../data/dishes';
import type { GroupId } from '../data/groups';
import { weekdayOf } from './calendar';
import { ingredientCostOf, tagsOf, templateOf } from './menu';
import { chance, createRng, nextInt, pick, weightedPick } from './rng';
import { effectiveLevel, tablesNeeded } from './service';
import type { BigOrder, Booking, PartyOutcome, Restaurant, Staff } from './types';

/** A booking request, offered or accepted. Saved with the game. */
export interface BookingRequest {
  /** The day the request came in: it also tells requests apart, as at most one comes each day. */
  id: number;
  kind: BookingKindId;
  /** The day they come, or want their order. */
  day: number;
  /** Guests at the table, or portions in the order. */
  size: number;
  /** The request in their own words. */
  text: string;
  accepted: boolean;
}

/** How a big order went on its day. Only lives while the day runs. */
export interface BigOrderJob {
  order: BigOrder;
  /** Waiting for its time; cooking (ready at `readyAt`); or fallen through, because nothing on the menu fits or nobody cooks. */
  status: 'waiting' | 'cooking' | 'fellThrough';
  /** The dish cooked for it. */
  dish?: MenuDish;
  readyAt?: number;
  /** It fell through because nobody was in the kitchen. */
  noChef?: boolean;
}

export const bookingKindOf = (request: BookingRequest): BookingKind => BOOKING_KINDS[request.kind];

/** True if the dish is what they want. */
function fits(dish: MenuDish, want: MenuWant): boolean {
  return (
    (want.category === undefined || templateOf(dish).category === want.category) &&
    (want.tag === undefined || tagsOf(dish).includes(want.tag)) &&
    (want.template === undefined || dish.template === want.template)
  );
}

/** The dishes on a menu that are what they want. */
export function matchingDishes(menu: MenuDish[], want: MenuWant): MenuDish[] {
  return menu.filter((dish) => fits(dish, want));
}

export function wantMet(menu: MenuDish[], want: MenuWant): boolean {
  return matchingDishes(menu, want).length > 0;
}

/** Guests a table booking can bring: never more than the dining room holds. */
function seatsFor(restaurant: Restaurant): number {
  return restaurant.tables * balance.service.seatsPerTable;
}

/**
 * Maybe a new request comes in this evening, for a day or three after tomorrow morning.
 * Never for a day that already has one. Returns it, or null.
 */
export function rollRequest(
  seed: number,
  nextDay: number,
  requests: BookingRequest[],
  player: Restaurant,
): BookingRequest | null {
  // Its own generator, so requests never change anything else that's rolled.
  const rng = createRng(seed);
  if (!chance(rng, balance.bookings.requestChance)) return null;
  const { min, max } = balance.bookings.daysAhead;
  const day = nextDay + nextInt(rng, min, max);
  if (requests.some((r) => r.day === day)) return null;
  const possible = BOOKING_KIND_IDS.filter((id) => {
    const { weekdays } = BOOKING_KINDS[id];
    return !weekdays || weekdays.includes(weekdayOf(day));
  });
  if (possible.length === 0) return null;
  const kind = weightedPick(rng, possible, (id) => BOOKING_KINDS[id].weight);
  const details = BOOKING_KINDS[kind];
  let size = nextInt(rng, details.size.min, details.size.max);
  if (details.kind === 'table') size = Math.max(1, Math.min(size, seatsFor(player)));
  const text = pick(rng, details.texts).replaceAll('{size}', String(size));
  return { id: nextDay, kind, day, size, text, accepted: false };
}

/** The requests accepted for this day, as parties coming to their tables and orders for the kitchen. */
export function acceptedOn(
  requests: readonly BookingRequest[] | undefined,
  day: number,
  player: Restaurant,
): { tables: Booking[]; orders: BigOrder[] } {
  const tables: Booking[] = [];
  const orders: BigOrder[] = [];
  for (const request of requests ?? []) {
    if (!request.accepted || request.day !== day) continue;
    const kind = bookingKindOf(request);
    if (kind.kind === 'table') {
      tables.push({
        restaurant: player.id,
        group: kind.group,
        size: Math.max(1, Math.min(request.size, seatsFor(player))),
        minute: kind.minute,
        critic: false,
        requestId: request.id,
        wish: kind.wish,
      });
    } else {
      orders.push({ restaurant: player.id, requestId: request.id, minute: kind.minute, portions: request.size, needs: kind.needs });
    }
  }
  return { tables, orders };
}

/** Minutes this chef needs to cook a big order. */
export function bigOrderMinutes(portions: number, chef: Staff): number {
  const speedFactor = effectiveLevel(chef, 'speed') / balance.staff.averageLevel;
  return (portions * balance.bookings.minutesPerPortion) / speedFactor;
}

/** Tables kept free for booked parties due soon, or already waiting at the door. */
export function tablesHeld(
  bookings: readonly Booking[],
  waiting: readonly { requestId?: number; size: number }[],
  restaurant: string,
  minute: number,
): number {
  const soon = bookings.filter(
    (b) =>
      b.restaurant === restaurant &&
      b.requestId !== undefined &&
      b.minute >= minute &&
      b.minute < minute + balance.bookings.holdTablesMinutes,
  );
  const atTheDoor = waiting.filter((party) => party.requestId !== undefined);
  return [...soon, ...atTheDoor].reduce((sum, party) => sum + tablesNeeded(party.size), 0);
}

// ---------- The day report ----------

export interface BookingReport {
  icon: string;
  name: string;
  /** What happened, in a sentence or two. */
  text: string;
  good: boolean;
}

export interface BookingsDay {
  reports: BookingReport[];
  /** Tips from happy parties, and what big orders paid. */
  cash: number;
  /** Ingredients for big orders. */
  ingredientCost: number;
  /** Reputation points gained or lost with each group. */
  reputation: Partial<Record<GroupId, number>>;
}

const money = (amount: number) => `${Math.round(amount).toLocaleString('en-GB')} zł`;

/** What today's accepted bookings brought: tips, payments, reputation, and a line each for the report. */
export function bookingsDay(
  requests: readonly BookingRequest[],
  day: number,
  outcomes: readonly PartyOutcome[],
  jobs: readonly BigOrderJob[],
  player: Restaurant,
  costMultiplier: number,
  inSeason: Parameters<typeof ingredientCostOf>[2],
): BookingsDay {
  const result: BookingsDay = { reports: [], cash: 0, ingredientCost: 0, reputation: {} };
  const b = balance.bookings;
  const addReputation = (group: GroupId, points: number) => {
    result.reputation[group] = (result.reputation[group] ?? 0) + points;
  };

  for (const request of requests) {
    if (!request.accepted || request.day !== day) continue;
    const kind = bookingKindOf(request);
    const report = (text: string, good: boolean) => result.reports.push({ icon: kind.icon, name: kind.name, text, good });
    const letDown = `Reputation −${b.letDownReputation} with them.`;

    if (kind.kind === 'table') {
      const outcome = outcomes.find((o) => o.booking?.id === request.id && o.restaurant === player.id);
      if (!outcome || outcome.kind !== 'served') {
        addReputation(kind.group, -b.letDownReputation);
        const why = outcome?.kind === 'walkedOut' ? 'waited too long for their food and left' : 'couldn’t get their tables';
        report(`They ${why}, disappointed. ${letDown}`, false);
      } else if (!outcome.booking!.wishMet) {
        report(`They came, but missed something on the menu (${kind.wishText}).`, false);
      } else if ((outcome.satisfaction ?? 0) < b.happyFrom) {
        report('They came and found what they hoped for, but the evening didn’t quite live up to it.', false);
      } else {
        const tip = b.tipPerGuest * outcome.size;
        result.cash += tip;
        addReputation(kind.group, b.happyReputation);
        report(`${kind.delighted} Tip: ${money(tip)}.`, true);
      }
      continue;
    }

    const job = jobs.find((j) => j.order.requestId === request.id);
    if (!job || job.status !== 'cooking' || !job.dish) {
      addReputation(kind.group, -b.letDownReputation);
      const why = job?.noChef ? 'Nobody was cooking' : `Nothing on the menu was right for ${kind.portionName}`;
      report(`${why}, so the order fell through. ${letDown}`, false);
      continue;
    }
    const paid = request.size * kind.pricePerPortion;
    const ingredients = request.size * ingredientCostOf(job.dish, player.supplier, inSeason) * costMultiplier;
    result.cash += paid;
    result.ingredientCost += ingredients;
    const late = job.readyAt !== undefined && job.readyAt > job.order.minute;
    report(
      `${request.size} ${kind.portionName} went out${late ? ', a little late' : ' on time'}: ${money(paid)}, less ${money(ingredients)} for ingredients.`,
      true,
    );
  }
  return result;
}
