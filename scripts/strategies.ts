// Scripted "pretend players" for the balance simulation. See project.md section 13.
// Each one picks a starting menu and team, then (except "do nothing") looks at last
// week every Monday and invests through the same actions the real player uses.

import { balance } from '../src/data/balance';
import { DECOR, type DecorId, type DecorStyle } from '../src/data/decor';
import { DISH_TEMPLATES, type MenuDish, type TemplateId } from '../src/data/dishes';
import type { LocationId } from '../src/data/locations';
import type { CampaignId } from '../src/data/marketing';
import * as actions from '../src/sim/actions';
import { dateOf } from '../src/sim/calendar';
import { playerOf, type GameState } from '../src/sim/game';
import type { Employee, Role, Staff } from '../src/sim/types';

/** The player's numbers for last week, which the strategies react to. */
export interface WeekReport {
  served: number;
  walkedOut: number;
  turnedAway: number;
  profit: number;
}

/** How a strategy grows its restaurant. Everything is optional: "do nothing" uses none of it. */
interface Plan {
  /** Cash it always keeps in hand, never spending below this. */
  reserve: number;
  /** Buys a table when it turned away more than this share of the guests it served. */
  tableWhenTurnedAway?: number;
  /** Hires a chef when this share of guests walked out. */
  chefWhenWalkouts?: number;
  /** Moves to this street once it has this much cash, before the Fair. */
  relocate?: { to: LocationId; whenCash: number };
  /** Which candidate it prefers: the best cook, the fastest, or a mix. */
  hireFor?: 'skill' | 'speed' | 'both';
  /** A waiter for every this many tables. */
  tablesPerWaiter?: number;
  /** Decor style it furnishes in, cheapest items first. */
  decorStyle?: DecorStyle;
  /** Decor items it wants in the end. */
  decorItems?: number;
  /** Campaigns it runs whenever they're not already running and cash allows. */
  campaigns?: CampaignId[];
  terrace?: boolean;
  premiumSupplier?: boolean;
  /** Starts the happy hour at this time every day (minutes after midnight). */
  happyHourAt?: number;
  /** Menu positions of a soup and a main for the lunch set. */
  lunchSet?: [number, number];
}

export interface Strategy {
  name: string;
  description: string;
  menu: MenuDish[];
  chefs: Staff[];
  waiters: Staff[];
  plan?: Plan;
}

/** A menu line priced at a multiple of the typical Old Town price. */
function dish(template: TemplateId, variant: string, priceFactor: number): MenuDish {
  return { template, variant, price: Math.round(DISH_TEMPLATES[template].referencePrice * priceFactor) };
}

const average: Staff = { skill: 3, speed: 3 };

function canSpend(state: GameState, plan: Plan, cost: number): boolean {
  return state.cash - cost >= plan.reserve;
}

function bestCandidate(state: GameState, role: Role, plan: Plan): Employee | undefined {
  const score = (p: Staff) =>
    plan.hireFor === 'skill' ? p.skill * 2 + p.speed : plan.hireFor === 'speed' ? p.speed * 2 + p.skill : p.skill + p.speed;
  return state.candidates
    .filter((c) => c.role === role && canSpend(state, plan, c.wage * 14))
    .sort((a, b) => score(b) - score(a))[0];
}

/** One morning's decisions. Called every Monday with last week's numbers, and on the very first day. */
export function manage(strategy: Strategy, state: GameState, week: WeekReport | null): GameState {
  const plan = strategy.plan;
  if (!plan) return state;
  let s = state;

  if (week === null) {
    // Opening day: settle the running choices.
    if (plan.premiumSupplier) s = actions.setSupplier(s, 'premium');
    if (plan.lunchSet) s = actions.setLunchSet(s, ...plan.lunchSet);
  }

  if (week) {
    // More room when guests are being turned away...
    const crowded = plan.tableWhenTurnedAway !== undefined && week.turnedAway > week.served * plan.tableWhenTurnedAway;
    for (let i = 0; i < 2 && crowded && canSpend(s, plan, balance.interior.tableCost); i++) {
      if (actions.tableUnavailableReason(s) !== null) break;
      s = actions.buyTable(s);
    }
    // ...another chef when the kitchen can't keep up...
    const guests = week.served + week.walkedOut;
    const kitchenFull = playerOf(s).chefs.length >= Math.ceil(playerOf(s).tables / 3);
    if (plan.chefWhenWalkouts !== undefined && guests > 0 && week.walkedOut > guests * plan.chefWhenWalkouts && !kitchenFull) {
      const chef = bestCandidate(s, 'chef', plan);
      if (chef) s = actions.hire(s, chef.id);
    }
    // ...and enough waiters for the tables.
    if (plan.tablesPerWaiter && playerOf(s).waiters.length * plan.tablesPerWaiter < playerOf(s).tables) {
      const waiter = bestCandidate(s, 'waiter', plan);
      if (waiter) s = actions.hire(s, waiter.id);
    }
  }

  if (plan.relocate && playerOf(s).location !== plan.relocate.to && s.cash >= plan.relocate.whenCash) {
    s = actions.relocate(s, plan.relocate.to);
  }

  if (plan.decorStyle && plan.decorItems) {
    const wanted = (Object.keys(DECOR) as DecorId[])
      .filter((id) => DECOR[id].style === plan.decorStyle)
      .sort((a, b) => DECOR[a].cost - DECOR[b].cost)
      .slice(0, plan.decorItems);
    for (const id of wanted) {
      if (!playerOf(s).decor.includes(id) && canSpend(s, plan, DECOR[id].cost)) s = actions.buyDecor(s, id);
    }
  }

  if (plan.terrace && dateOf(s.day).month >= balance.terrace.firstMonth && canSpend(s, plan, balance.terrace.permitCost)) {
    s = actions.buyTerracePermit(s);
  }

  for (const id of plan.campaigns ?? []) {
    if (actions.campaignUnavailableReason(s, id) === null && canSpend(s, plan, 0)) {
      const after = actions.launchCampaign(s, id);
      if (after.cash >= plan.reserve) s = after;
    }
  }
  return s;
}

export const STRATEGIES: Strategy[] = [
  {
    name: 'do nothing',
    description: 'Keeps the starter setup all season and never changes it.',
    menu: [
      dish('tomatoSoup', 'noodles', 1),
      dish('zurek', 'classic', 1),
      dish('pierogi', 'ruskie', 1),
      dish('schabowy', 'cabbage', 1),
      dish('golabki', 'tomato', 1),
      dish('kompot', 'strawberry', 1),
    ],
    chefs: [average],
    waiters: [average],
  },
  {
    name: 'cheap and fast',
    description: 'Quick, cheap dishes 20% below typical prices, speedy chefs, happy hour and flyers.',
    menu: [
      dish('tomatoSoup', 'noodles', 0.8),
      dish('barszcz', 'mug', 0.8),
      dish('pierogi', 'ruskie', 0.8),
      dish('pasta', 'pesto', 0.8),
      dish('saladBowl', 'garden', 0.8),
      dish('kompot', 'strawberry', 0.8),
    ],
    chefs: [
      { skill: 2, speed: 5 },
      { skill: 2, speed: 5 },
    ],
    waiters: [{ skill: 3, speed: 4 }],
    plan: {
      reserve: 5_000,
      tableWhenTurnedAway: 0.1,
      chefWhenWalkouts: 0.08,
      hireFor: 'speed',
      tablesPerWaiter: 4,
      decorStyle: 'modern',
      decorItems: 2,
      campaigns: ['flyers'],
      happyHourAt: 15 * 60,
      lunchSet: [0, 2],
    },
  },
  {
    name: 'quality focus',
    description: 'Premium dishes and ingredients 20% above typical prices, top staff, Hanseatic decor.',
    menu: [
      dish('fishSoup', 'creamy', 1.2),
      dish('zurek', 'breadBowl', 1.2),
      dish('pierogi', 'meat', 1.2),
      dish('schabowy', 'mizeria', 1.2),
      dish('pasta', 'seafood', 1.2),
      dish('lemonade', 'rhubarb', 1.2),
    ],
    chefs: [{ skill: 5, speed: 3 }],
    waiters: [{ skill: 5, speed: 3 }],
    plan: {
      reserve: 10_000,
      tableWhenTurnedAway: 0.2,
      chefWhenWalkouts: 0.1,
      hireFor: 'skill',
      tablesPerWaiter: 4,
      decorStyle: 'hanseatic',
      decorItems: 3,
      campaigns: ['social'],
      premiumSupplier: true,
    },
  },
  {
    name: 'balanced',
    description: 'A varied menu at typical prices, good staff, decor, terrace and marketing; moves to Długa once it can afford to.',
    menu: [
      dish('zurek', 'classic', 1),
      dish('fishSoup', 'classic', 1),
      dish('pierogi', 'ruskie', 1),
      dish('schabowy', 'cabbage', 1),
      dish('saladBowl', 'goatCheese', 1),
      dish('kompot', 'cherry', 1),
    ],
    chefs: [{ skill: 4, speed: 4 }],
    waiters: [{ skill: 4, speed: 3 }],
    plan: {
      reserve: 8_000,
      tableWhenTurnedAway: 0.15,
      chefWhenWalkouts: 0.08,
      hireFor: 'both',
      tablesPerWaiter: 4,
      decorStyle: 'maritime',
      decorItems: 2,
      campaigns: ['tramPoster', 'guideListing'],
      terrace: true,
      lunchSet: [0, 3],
      relocate: { to: 'dluga', whenCash: 80_000 },
    },
  },
];
