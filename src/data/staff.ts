// Staff content: traits, specialties, names and bios. See project.md section 6.5.
// How much each trait changes skill and speed is tuned in balance.ts.

import type { Cuisine } from './dishes';

export type TraitId = 'cheerful' | 'perfectionist' | 'speedy' | 'chatty' | 'calm';

export const TRAIT_IDS: readonly TraitId[] = ['cheerful', 'perfectionist', 'speedy', 'chatty', 'calm'];

export const TRAITS: Record<TraitId, { name: string; description: string }> = {
  cheerful: { name: 'Cheerful', description: 'Puts everyone in a good mood. A little better at the job.' },
  perfectionist: { name: 'Perfectionist', description: 'Every plate is a painting. Better work, but slower.' },
  speedy: { name: 'Speedy', description: 'Gets things done fast, not always neatly.' },
  chatty: { name: 'Chatty', description: 'Guests love the stories. The stories take time.' },
  calm: { name: 'Calm', description: 'Unflappable in the lunch rush. A little quicker.' },
};

export const CUISINES: readonly Cuisine[] = ['polish', 'italian', 'grill', 'pastry'];

export const CUISINE_NAMES: Record<Cuisine, string> = {
  polish: 'Polish',
  italian: 'Italian',
  grill: 'Grill',
  pastry: 'Pastry',
};

export const FIRST_NAMES = [
  'Kasia', 'Tomek', 'Ania', 'Bartek', 'Magda', 'Piotr', 'Zosia', 'Kuba', 'Ola', 'Marek',
  'Ewa', 'Wojtek', 'Agnieszka', 'Paweł', 'Basia', 'Staszek', 'Iga', 'Janek', 'Hania', 'Franek',
];

/** Gdańsk neighbourhoods and nearby towns, for names like "Kasia from Wrzeszcz". */
export const HOMETOWNS = [
  'Wrzeszcz', 'Oliwa', 'Przymorze', 'Zaspa', 'Brzeźno', 'Orunia', 'Stogi',
  'Jelitkowo', 'Chełm', 'Letnica', 'Sopot', 'Gdynia', 'Hel', 'Kashubia',
];

export const CHEF_BIOS = [
  'Learned to cook from a grandmother who still phones to check the salt.',
  'Once made pierogi for a wedding of 300. Still dreams in dough.',
  'Worked on a ferry to Sweden. Can cook in any weather.',
  'Believes every dish improves with dill. Is usually right.',
  'Taught themself from cooking shows, then started correcting the cooking shows.',
  'Keeps a sourdough starter named Zbyszek. Zbyszek is older than most of the staff.',
  'Came for one summer season in 2009 and never left.',
  'Can peel a potato in four seconds. Has been timed.',
  'Hums sea shanties while stirring. The soup seems to like it.',
  'Says the secret ingredient is patience. The other secret ingredient is butter.',
];

export const WAITER_BIOS = [
  'Remembers every regular’s order, birthday and dog’s name.',
  'Can carry six plates and a conversation at the same time.',
  'Former tour guide. Will tell you about the Crane whether you ask or not.',
  'Plays trumpet in a jazz band at weekends. Walks in rhythm.',
  'Has never dropped a plate. Is very proud of this.',
  'Speaks four languages and a little bit of seagull.',
  'Moved from Kraków and is slowly admitting that Gdańsk is nicer.',
  'Once served a famous footballer without recognising him. Still won’t say who.',
  'Knows the fastest route between any two tables, and most of the Old Town.',
  'Writes poems about the specials on the back of order slips.',
];

/** One-day courses that make someone a level better; the cost is in balance.ts (balance.staff.training). */
export const COURSES: Record<'chef' | 'waiter', Record<'skill' | 'speed', { name: string; done: string }>> = {
  chef: {
    skill: { name: 'Cooking course', done: 'learned three new ways with dill at the culinary school' },
    speed: { name: 'Kitchen rush workshop', done: 'came back from the kitchen rush workshop chopping twice as fast' },
  },
  waiter: {
    skill: { name: 'Service and wine course', done: 'came back from the service course pouring wine like a sommelier' },
    speed: { name: 'Fast floor workshop', done: 'learned to carry four plates and a smile at a jog' },
  },
};

/** The team you start with. */
export const STARTER_TEAM = [
  {
    role: 'chef' as const,
    name: 'Pani Krystyna',
    bio: 'Has made pierogi every Sunday since 1979 and sees no reason to stop now.',
    skill: 3,
    speed: 3,
    trait: 'calm' as const,
    specialty: 'polish' as const,
    starter: 'krystyna' as const,
  },
  {
    role: 'waiter' as const,
    name: 'Kacper',
    bio: 'Studies philosophy. Asks guests how they really feel about the soup.',
    skill: 3,
    speed: 3,
    trait: 'chatty' as const,
    starter: 'kacper' as const,
  },
];
