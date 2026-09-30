// The four friendly rival restaurants. See project.md section 6.9.
// Every Monday each rival makes one move (see src/sim/rivalAi.ts), announced with one of their lines.

import type { MenuDish } from './dishes';
import type { GroupId } from './groups';
import type { LocationId } from './locations';

export type RivalId = 'nonnaRosa' | 'blyskawica' | 'karczma' | 'spichlerz';

/** The kinds of weekly move a rival can make. */
export type RivalMove = 'cutPrices' | 'raisePrices' | 'newDish' | 'promotion' | 'upgrade' | 'reactToPlayer';

export interface Rival {
  name: string;
  location: LocationId;
  owner: string;
  personality: string;
  menu: MenuDish[];
  seats: number;
  chefs: number;
  /** 1–5, like the player's staff. */
  chefSkill: number;
  chefSpeed: number;
  waiters: number;
  /** 0–100. */
  ambiance: number;
  /** Reputation (0–100) with each group when the season starts. */
  startingReputation: Record<GroupId, number>;
  /** Dishes they may add once the season reaches that month. */
  seasonalDishes: { fromMonth: number; dish: MenuDish }[];
  /** What the town hears when they make each move. {dish} is a new dish's name. */
  lines: Record<RivalMove, string>;
}

export const RIVAL_IDS: readonly RivalId[] = ['nonnaRosa', 'blyskawica', 'karczma', 'spichlerz'];

export const RIVALS: Record<RivalId, Rival> = {
  nonnaRosa: {
    name: 'Trattoria Nonna Rosa',
    location: 'mariacka',
    owner: 'Nonna Rosa',
    personality:
      'Came from Naples forty years ago and has never once admitted that pierogi ' +
      'are just ravioli with better manners.',
    menu: [
      { template: 'pizza', variant: 'margherita', price: 49 },
      { template: 'pizza', variant: 'salami', price: 54 },
      { template: 'pasta', variant: 'carbonara', price: 48 },
      { template: 'pasta', variant: 'seafood', price: 62 },
      { template: 'saladBowl', variant: 'goatCheese', price: 42 },
      { template: 'iceCream', variant: 'sorbet', price: 22 },
      { template: 'coffee', variant: 'cappuccino', price: 17 },
      { template: 'lemonade', variant: 'mint', price: 16 },
    ],
    seats: 24,
    chefs: 2,
    chefSkill: 4,
    chefSpeed: 3,
    waiters: 2,
    ambiance: 70,
    startingReputation: { tourists: 55, students: 30, locals: 40, office: 30, foodies: 65 },
    seasonalDishes: [
      { fromMonth: 5, dish: { template: 'pasta', variant: 'pesto', price: 46 } },
      { fromMonth: 6, dish: { template: 'iceCream', variant: 'vanilla', price: 20 } },
    ],
    lines: {
      cutPrices: 'Nonna Rosa lowers her prices a little. “Only because I am generous,” she insists.',
      raisePrices: 'Nonna Rosa raises her prices. “Quality costs,” she shrugs.',
      newDish: 'Nonna Rosa adds {dish} to her menu. “A classic,” she says, looking at yours.',
      promotion: 'Nonna Rosa hands out free breadsticks on Mariacka. The tourists are charmed.',
      upgrade: 'Nonna Rosa hangs new lanterns over her terrace. Very romantic. Very annoying.',
      reactToPlayer: 'Nonna Rosa sniffs at your cooking. Politely. Then she quietly lowers her prices.',
    },
  },
  blyskawica: {
    name: 'Bar Błyskawica',
    location: 'dluga',
    owner: 'Pani Halina',
    personality:
      'Runs the counter like a ship’s captain. Nobody has ever waited more than ten ' +
      'minutes, and nobody has ever dared to leave a pieróg on their plate.',
    menu: [
      { template: 'tomatoSoup', variant: 'noodles', price: 14 },
      { template: 'barszcz', variant: 'mug', price: 12 },
      { template: 'pierogi', variant: 'ruskie', price: 26 },
      { template: 'pierogi', variant: 'meat', price: 28 },
      { template: 'schabowy', variant: 'cabbage', price: 34 },
      { template: 'golabki', variant: 'tomato', price: 30 },
      { template: 'kompot', variant: 'strawberry', price: 7 },
    ],
    seats: 40,
    chefs: 3,
    chefSkill: 2,
    chefSpeed: 5,
    waiters: 3,
    ambiance: 30,
    startingReputation: { tourists: 35, students: 60, locals: 45, office: 60, foodies: 20 },
    seasonalDishes: [
      { fromMonth: 5, dish: { template: 'pierogi', variant: 'blueberry', price: 24 } },
      { fromMonth: 6, dish: { template: 'lemonade', variant: 'mint', price: 9 } },
    ],
    lines: {
      cutPrices: 'Pani Halina cuts her prices again. Students cheer on Długa.',
      raisePrices: 'Pani Halina adds a złoty to the menu board. Nobody dares to complain.',
      newDish: 'Bar Błyskawica now serves {dish}. Pani Halina calls it “fast food, the proper way”.',
      promotion: 'Pani Halina puts up a sign: “Second kompot free.” Queues form.',
      upgrade: 'Bar Błyskawica squeezes in another table. Pani Halina measured the gap herself.',
      reactToPlayer: 'Pani Halina has heard about you. “Competition,” she says, and cuts her prices.',
    },
  },
  karczma: {
    name: 'Karczma pod Żurawiem',
    location: 'pobrzeze',
    owner: 'Pan Zbigniew',
    personality:
      'Wears a fisherman’s jumper even in July, and insists the Crane was built ' +
      'to keep an eye on his soup.',
    menu: [
      { template: 'zurek', variant: 'breadBowl', price: 34 },
      { template: 'fishSoup', variant: 'classic', price: 36 },
      { template: 'pierogi', variant: 'meat', price: 40 },
      { template: 'schabowy', variant: 'cabbage', price: 52 },
      { template: 'golabki', variant: 'mushroom', price: 44 },
      { template: 'friedCod', variant: 'classic', price: 54 },
      { template: 'szarlotka', variant: 'warm', price: 24 },
      { template: 'kompot', variant: 'cherry', price: 11 },
    ],
    seats: 40,
    chefs: 3,
    chefSkill: 3,
    chefSpeed: 3,
    waiters: 3,
    ambiance: 60,
    startingReputation: { tourists: 60, students: 30, locals: 55, office: 35, foodies: 35 },
    seasonalDishes: [
      { fromMonth: 5, dish: { template: 'fishSoup', variant: 'creamy', price: 40 } },
      { fromMonth: 7, dish: { template: 'iceCream', variant: 'sorbet', price: 18 } },
    ],
    lines: {
      cutPrices: 'Pan Zbigniew lowers his prices “for the sailors”. There are no sailors.',
      raisePrices: 'Pan Zbigniew raises his prices. “The view of the Crane is not free,” he says.',
      newDish: 'Karczma pod Żurawiem adds {dish}. Pan Zbigniew claims his grandfather invented it.',
      promotion: 'Pan Zbigniew stands outside in his fisherman’s jumper, singing sea shanties. It works.',
      upgrade: 'Karczma pod Żurawiem hangs a ship’s wheel above the door. Nobody knows why.',
      reactToPlayer: 'Pan Zbigniew sends you a note: “Nice żurek. Mine is better.” Then he lowers his prices.',
    },
  },
  spichlerz: {
    name: 'Spichlerz Bistro',
    location: 'spichrzow',
    owner: 'Kuba and Ola',
    personality:
      'Two friends who met at a cooking class and have argued lovingly about ' +
      'fermentation ever since.',
    menu: [
      { template: 'barszcz', variant: 'uszka', price: 26 },
      { template: 'saladBowl', variant: 'salmon', price: 44 },
      { template: 'burger', variant: 'veggie', price: 44 },
      { template: 'pierogi', variant: 'blueberry', price: 36 },
      { template: 'pizza', variant: 'kielbasa', price: 46 },
      { template: 'sernik', variant: 'classic', price: 24 },
      { template: 'coffee', variant: 'cappuccino', price: 16 },
      { template: 'lemonade', variant: 'rhubarb', price: 16 },
    ],
    seats: 32,
    chefs: 2,
    chefSkill: 3,
    chefSpeed: 4,
    waiters: 2,
    ambiance: 65,
    startingReputation: { tourists: 30, students: 50, locals: 35, office: 45, foodies: 60 },
    seasonalDishes: [
      { fromMonth: 5, dish: { template: 'saladBowl', variant: 'goatCheese', price: 38 } },
      { fromMonth: 7, dish: { template: 'iceCream', variant: 'sorbet', price: 22 } },
    ],
    lines: {
      cutPrices: 'Kuba and Ola lower their prices after a long argument about fermentation.',
      raisePrices: 'Kuba and Ola raise their prices and add the word “artisanal” to everything.',
      newDish: 'Spichlerz Bistro launches {dish}. Served on a slate, obviously.',
      promotion: 'Kuba and Ola’s latest post goes viral: a pierogi-shaped latte. Foodies flock.',
      upgrade: 'Spichlerz Bistro installs a neon sign that says “Eat, love, ferment”.',
      reactToPlayer: 'Kuba and Ola visited you in sunglasses, indoors. Their prices are lower now.',
    },
  },
};
