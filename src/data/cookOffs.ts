// Cook-off challenges: now and then a rival challenges the player to a dish duel in its own
// field, judged by guests on quality and value. How often, and what's at stake, is in
// balance.ts (balance.cookOffs). See project.md section 6.15, C10.

import type { MenuWant } from './bookings';
import type { TemplateId } from './dishes';
import type { RivalId } from './rivals';

export interface CookOffKind {
  icon: string;
  /** "the best soup in the Old Town". */
  title: string;
  /** The challenge, as the rival puts it. */
  text: string;
  /** The kind of dish that can be entered. */
  field: MenuWant;
  /** "soups". */
  fieldName: string;
  /** How much value for money counts, compared with an ordinary duel (Bar Błyskawica's is all about value). */
  valueWeight: number;
  /** The rival's signature dish, which it enters when it's on its menu (otherwise its best). */
  signature: TemplateId;
  /** What people say about the rival's entry, as a hint. */
  hint: string;
}

export const COOK_OFFS: Record<RivalId, CookOffKind> = {
  karczma: {
    icon: '🥣',
    title: 'the best soup in the Old Town',
    text: 'Pan Zbigniew challenges you: the best soup in the Old Town, judged by guests on Długi Targ.',
    field: { category: 'soup' },
    fieldName: 'soups',
    valueWeight: 1,
    signature: 'zurek',
    hint: 'Karczma’s żurek in a bread bowl is famous from here to Sopot.',
  },
  nonnaRosa: {
    icon: '🍝',
    title: 'the best main course',
    text: 'Nonna Rosa challenges you: “My pasta against your best main. The guests will decide, cara.”',
    field: { category: 'main' },
    fieldName: 'mains',
    valueWeight: 1,
    signature: 'pasta',
    hint: 'Nonna Rosa has been rolling pasta since before you were born. She says so often.',
  },
  blyskawica: {
    icon: '⚡',
    title: 'the best-value plate in town',
    text: 'Pani Halina challenges you: “Real food at real prices. Let’s see who gives Gdańsk the best plate for its money.”',
    field: { category: 'main' },
    fieldName: 'mains',
    valueWeight: 2,
    signature: 'pierogi',
    hint: 'Bar Błyskawica’s pierogi cost next to nothing, and nobody leaves hungry.',
  },
  spichlerz: {
    icon: '🍰',
    title: 'the best dessert on the Motława',
    text: 'Kuba and Ola challenge you: the best dessert on the Motława, judged by guests on Granary Island.',
    field: { category: 'dessert' },
    fieldName: 'desserts',
    valueWeight: 1,
    signature: 'sernik',
    hint: 'Spichlerz’s sernik has its own fan club on social media.',
  },
};
