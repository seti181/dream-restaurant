// Scripted "pretend players" for the balance simulation. See project.md section 13.
// For now they can only choose a menu, prices and staff: the starting kitchen has
// just a stove, and equipment, seats and marketing arrive in M2 and M3.

import { DISH_TEMPLATES, type MenuDish, type TemplateId } from '../src/data/dishes';
import type { Staff } from '../src/sim/types';

export interface Strategy {
  name: string;
  description: string;
  menu: MenuDish[];
  chefs: Staff[];
  waiters: Staff[];
}

/** A menu line priced at a multiple of the typical Old Town price. */
function dish(template: TemplateId, variant: string, priceFactor: number): MenuDish {
  return { template, variant, price: Math.round(DISH_TEMPLATES[template].referencePrice * priceFactor) };
}

const average: Staff = { skill: 3, speed: 3 };

export const STRATEGIES: Strategy[] = [
  {
    name: 'do nothing',
    description: 'Keeps a simple starter setup all season and never changes it.',
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
    description: 'Quick, cheap dishes 20% below typical prices, two speedy chefs.',
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
  },
  {
    name: 'quality focus',
    description: 'Premium dishes 20% above typical prices, a top chef and a top waiter.',
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
  },
  {
    name: 'balanced',
    description: 'A varied menu at typical prices, a good chef and a good waiter.',
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
  },
];
