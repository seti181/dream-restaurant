// The four friendly rival restaurants. See project.md section 6.9.
// Their weekly decisions (prices, promotions, upgrades) arrive with the rival AI in M3.

import type { TemplateId } from './dishes';
import type { GroupId } from './groups';
import type { LocationId } from './locations';

export type RivalId = 'nonnaRosa' | 'blyskawica' | 'karczma' | 'spichlerz';

export interface RivalDish {
  template: TemplateId;
  /** A variant id from that template in dishes.ts. */
  variant: string;
  price: number;
}

export interface Rival {
  name: string;
  location: LocationId;
  owner: string;
  personality: string;
  menu: RivalDish[];
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
    waiters: 1,
    ambiance: 30,
    startingReputation: { tourists: 35, students: 60, locals: 45, office: 60, foodies: 20 },
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
    chefs: 2,
    chefSkill: 3,
    chefSpeed: 3,
    waiters: 3,
    ambiance: 60,
    startingReputation: { tourists: 60, students: 30, locals: 55, office: 35, foodies: 35 },
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
  },
};
