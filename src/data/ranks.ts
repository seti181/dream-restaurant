// The restaurant's rank: it grows with guests served and stars, and each rank unlocks something.
// See project.md section 6.15, B7.

export interface Rank {
  name: string;
  /** The name in a sentence: "a bistro". */
  inSentence: string;
  /** Guests served, all game, to reach this rank... */
  guests: number;
  /** ...and the star rating (0–5) needed at the same time. */
  stars: number;
  /** What Mewa says on the day it's reached. */
  mewa: string;
  /** What it unlocks, in a sentence for the day report and the Mewa tab. */
  unlockText: string;
  /** Menu slots added, beyond the menu board's biggest size. */
  menuSlots?: number;
  /** Awareness points added with every group, once. */
  awareness?: number;
  /** From this rank, choice cards that need a known place can come (data/moments.ts). */
  knownPlace?: boolean;
}

/** From the start to the top. A rank once reached is never lost. */
export const RANKS: readonly Rank[] = [
  {
    name: 'Bar',
    inSentence: 'a little bar',
    guests: 0,
    stars: 0,
    mewa: '',
    unlockText: '',
  },
  {
    name: 'Bistro',
    inSentence: 'a bistro',
    guests: 500,
    stars: 3.0,
    mewa: 'Squawk! People have started calling us a bistro. A proper bistro! I’ve told every gull on the Motława.',
    unlockText: 'One more dish fits on the menu, even beyond the biggest menu board.',
    menuSlots: 1,
  },
  {
    name: 'Restaurant',
    inSentence: 'a proper restaurant',
    guests: 1_500,
    stars: 3.2,
    mewa: 'We’re a real restaurant now! Tablecloths, reservations, the lot. I may need a little bow tie.',
    unlockText: 'Bigger names start to notice you: a TV cooking show, a famous chef and the city guidebook may come calling.',
    knownPlace: true,
  },
  {
    name: 'Old Town Favourite',
    inSentence: 'an Old Town Favourite',
    guests: 3_500,
    stars: 3.4,
    mewa: 'An Old Town Favourite! The whole of Gdańsk is talking about us. I’m having a fish to celebrate.',
    unlockText: 'A brass “Old Town Favourite” plaque goes up on the front door, and word gets round: more of every group have heard of you.',
    awareness: 5,
  },
];
