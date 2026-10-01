// The gulls on the terrace: what happens when one is shooed away in time, or isn't.
// See project.md section 6.13. How often they come is tuned in balance.ts.

export const GULLS = {
  /** Shown while a gull is eyeing a plate. */
  warning: 'A gull is eyeing a plate on the terrace! Tap it!',
  shooed: [
    'Shoo! The gull flaps off, and the whole terrace laughs.',
    'Away it goes! A guest gives you a round of applause.',
    'The gull leaves with nothing but its pride. The guests cheer.',
  ],
  stolen: [
    'Too late! The gull flew off with a whole plate.',
    'Whoosh! A pierogi is gone, and the gull looks very pleased with itself.',
    'The gull got there first. The guests are telling everyone.',
  ],
  /** The review a table writes after losing its lunch to a gull. */
  reviews: [
    { stars: 3, text: 'A seagull stole my pierogi right off the fork. What I tasted was lovely, though.' },
    { stars: 2, text: 'Beautiful terrace, but a gull the size of a small dog took my fish. Bring a broom.' },
    { stars: 3, text: 'The seagull enjoyed my schabowy more than I did. Five stars from the seagull.' },
    { stars: 2, text: 'Watch your plate! The local gulls have no manners at all.' },
  ],
  reviewers: ['a tourist with an empty plate', 'a family on the terrace', 'a student, still hungry', 'a very surprised local'],
};
