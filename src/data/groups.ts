// The five customer groups and what they like. See project.md section 6.2.

import type { Category, Tag, TemplateId } from './dishes';

export type GroupId = 'tourists' | 'students' | 'locals' | 'office' | 'foodies';

/** How much each thing matters when a party picks a restaurant. See project.md section 7. */
export interface ChoiceWeights {
  taste: number;
  price: number;
  reputation: number;
  awareness: number;
  proximity: number;
  ambiance: number;
  wait: number;
}

export interface Group {
  choiceWeights: ChoiceWeights;
  name: string;
  /** Taste tags, dish categories and dishes this group is drawn to. */
  likes: { tags: Tag[]; categories: Category[]; templates: TemplateId[] };
  /** 0 = barely looks at prices, 1 = counts every złoty. */
  priceSensitivity: number;
  /** Food quality (0–100) the group expects. Better than this delights them. */
  expectedQuality: number;
  /** Minutes a party will wait for its food before giving up. */
  patienceMinutes: number;
  partySize: { min: number; max: number };
  /** How keen the group is to eat out at each time of day (1 = normal). */
  timeOfDay: { lunch: number; afternoon: number; evening: number };
  /** Multiplier on Saturdays and Sundays. */
  weekendFactor: number;
  /** Multiplier for each month, January first. */
  monthFactors: readonly number[];
}

export const GROUP_IDS: readonly GroupId[] = ['tourists', 'students', 'locals', 'office', 'foodies'];

export const GROUPS: Record<GroupId, Group> = {
  tourists: {
    // Location first, then Polish classics.
    choiceWeights: { taste: 2.5, price: 1, reputation: 1.5, awareness: 1.5, proximity: 3, ambiance: 1, wait: 1 },
    name: 'Tourists',
    likes: { tags: ['polish', 'seafood'], categories: ['dessert'], templates: [] },
    priceSensitivity: 0.35,
    expectedQuality: 55,
    patienceMinutes: 40,
    partySize: { min: 2, max: 4 },
    timeOfDay: { lunch: 1, afternoon: 1, evening: 0.9 },
    weekendFactor: 1.4,
    monthFactors: [0.3, 0.3, 0.4, 0.6, 0.8, 1, 1.4, 1.5, 1, 0.7, 0.4, 0.6],
  },
  students: {
    // Price above all.
    choiceWeights: { taste: 2, price: 3.5, reputation: 1, awareness: 1, proximity: 1.5, ambiance: 0.5, wait: 1 },
    name: 'Students',
    likes: { tags: ['hearty', 'cheap'], categories: [], templates: ['pizza', 'burger'] },
    priceSensitivity: 0.9,
    expectedQuality: 40,
    patienceMinutes: 35,
    partySize: { min: 1, max: 4 },
    timeOfDay: { lunch: 0.7, afternoon: 0.8, evening: 1.2 },
    weekendFactor: 0.9,
    // Summer holidays: most students leave town in July and August.
    monthFactors: [1, 1, 1, 1, 1, 0.9, 0.5, 0.5, 0.8, 1, 1, 0.9],
  },
  locals: {
    // Quality and familiarity.
    choiceWeights: { taste: 2.5, price: 1.5, reputation: 3, awareness: 1.5, proximity: 1.5, ambiance: 1, wait: 1 },
    name: 'Locals and families',
    likes: { tags: ['polish', 'homemade'], categories: ['dessert'], templates: [] },
    priceSensitivity: 0.6,
    expectedQuality: 60,
    patienceMinutes: 45,
    partySize: { min: 2, max: 5 },
    timeOfDay: { lunch: 0.8, afternoon: 0.7, evening: 1.1 },
    weekendFactor: 1.5,
    monthFactors: [0.9, 0.9, 1, 1, 1, 1, 0.9, 0.85, 1, 1, 1, 1.1],
  },
  office: {
    // Speed, and not walking far on a lunch break.
    choiceWeights: { taste: 2, price: 1.5, reputation: 1, awareness: 1, proximity: 2.5, ambiance: 0.3, wait: 3.5 },
    name: 'Office workers',
    likes: { tags: ['quick'], categories: ['soup'], templates: [] },
    priceSensitivity: 0.6,
    expectedQuality: 50,
    patienceMinutes: 25,
    partySize: { min: 1, max: 3 },
    // Weekday lunch only.
    timeOfDay: { lunch: 1.5, afternoon: 0.2, evening: 0 },
    weekendFactor: 0,
    monthFactors: [1, 1, 1, 1, 1, 1, 0.85, 0.8, 1, 1, 1, 0.9],
  },
  foodies: {
    // Creativity, quality and ambiance; happy to walk and wait.
    choiceWeights: { taste: 3, price: 0.5, reputation: 2.5, awareness: 1, proximity: 0.5, ambiance: 2.5, wait: 0.5 },
    name: 'Foodies',
    likes: { tags: ['premium', 'creative', 'seafood'], categories: [], templates: [] },
    priceSensitivity: 0.2,
    expectedQuality: 75,
    patienceMinutes: 55,
    partySize: { min: 1, max: 2 },
    timeOfDay: { lunch: 0.5, afternoon: 0.6, evening: 1.4 },
    weekendFactor: 1.2,
    monthFactors: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  },
};
