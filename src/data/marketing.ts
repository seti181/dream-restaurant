// Marketing campaigns. See project.md section 6.7.
// How fast awareness fades afterwards, and the happy hour, are tuned in balance.ts.

import type { GroupId } from './groups';

export type CampaignId = 'flyers' | 'tramPoster' | 'radio' | 'social' | 'guideListing';

export interface Campaign {
  name: string;
  description: string;
  cost: number;
  /** How many days it runs, or 'season' for the rest of the season. */
  days: number | 'season';
  /** Awareness points gained per day with each group (less as awareness nears 100). */
  boost: Partial<Record<GroupId, number>>;
}

export const CAMPAIGN_IDS: readonly CampaignId[] = ['flyers', 'tramPoster', 'radio', 'social', 'guideListing'];

export const CAMPAIGNS: Record<CampaignId, Campaign> = {
  flyers: {
    name: 'Flyers',
    description: 'Hand them out on the Old Town streets. Cheap and cheerful.',
    cost: 400,
    days: 3,
    boost: { students: 6, locals: 6 },
  },
  tramPoster: {
    name: 'Tram stop poster',
    description: 'A big poster at the tram stop on Podwale. Commuters see it twice a day.',
    cost: 2_500,
    days: 7,
    boost: { locals: 5, office: 5 },
  },
  radio: {
    name: 'Local radio',
    description: 'A jingle between the traffic news and the weather. Everyone hears it, a little.',
    cost: 6_000,
    days: 7,
    boost: { tourists: 3, students: 3, locals: 3, office: 3, foodies: 3 },
  },
  social: {
    name: 'Social media push',
    description: 'Beautiful photos of your food. Students share them, foodies save them.',
    cost: 1_500,
    days: 7,
    boost: { students: 5, foodies: 5 },
  },
  guideListing: {
    name: 'Tourist guide listing',
    description: 'A page in the guidebook every visitor carries. Lasts the rest of the season.',
    cost: 5_000,
    days: 'season',
    boost: { tourists: 3 },
  },
};
