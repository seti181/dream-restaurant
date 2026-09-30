// Kitchen equipment. See project.md section 6.4.

import type { EquipmentId } from './dishes';

export interface Equipment {
  name: string;
  /** Złoty. The stove comes with every kitchen. */
  cost: number;
  description: string;
}

export const EQUIPMENT_IDS: readonly EquipmentId[] = [
  'stove', 'fryer', 'grill', 'pizzaOven', 'espresso', 'dessertDisplay',
];

export const EQUIPMENT: Record<EquipmentId, Equipment> = {
  stove: {
    name: 'Stove',
    cost: 0,
    description: 'Soups, pierogi, pasta, gołąbki and schabowy. Every kitchen has one.',
  },
  fryer: {
    name: 'Deep fryer',
    cost: 6_000,
    description: 'For fried Baltic cod with fries.',
  },
  grill: {
    name: 'Grill',
    cost: 9_000,
    description: 'Burgers, straight off the flames.',
  },
  pizzaOven: {
    name: 'Pizza oven',
    cost: 18_000,
    description: 'Proper pizza. Nonna Rosa will be watching.',
  },
  espresso: {
    name: 'Espresso machine',
    cost: 7_000,
    description: 'Coffee. The smell alone brings people in.',
  },
  dessertDisplay: {
    name: 'Dessert display',
    cost: 4_000,
    description: 'Szarlotka, sernik and ice cream, where everyone can see them. Guests order more desserts.',
  },
};
