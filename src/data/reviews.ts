// Review lines. A review joins what a guest liked most with what they liked least,
// e.g. "Best pierogi on ul. Piwna, but the waiter vanished." See project.md section 6.8.
// {dish} is the dish they ate and {street} is where the restaurant is.

import type { GroupId } from './groups';

export type ReviewFactor = 'quality' | 'value' | 'wait' | 'ambiance' | 'service';

// Lines are written so they work for any dish, singular or plural (pierogi, gołąbki…).

/** Opening praise, without a full stop. */
export const PRAISE: Record<ReviewFactor, string[]> = {
  quality: [
    'Best {dish} on {street}',
    'Real comfort food, that {dish}',
    'I’d come back just for the {dish}',
    'The {dish} tasted like home',
  ],
  value: ['Great value for money', 'Generous portions at fair prices', 'Fair prices for the Old Town'],
  wait: ['Our food came in no time', 'Quick, even at the busiest hour', 'Barely time to butter the bread before the food arrived'],
  ambiance: ['Such a cosy room', 'A lovely, warm atmosphere', 'A proper Gdańsk feel to the place'],
  service: ['Wonderful service', 'Our waiter was an absolute star', 'The staff made us feel like regulars'],
};

/** A complaint, to follow "but". */
export const COMPLAINTS: Record<ReviewFactor, string[]> = {
  quality: ['the {dish} tasted a bit bland', 'the {dish} could have been better', 'Babcia would have added more salt to the {dish}'],
  value: ['it’s a bit pricey', 'my wallet is still recovering', 'the prices made my eyes water'],
  wait: ['we waited forever', 'the kitchen was so slow', 'we could have walked to Sopot and back'],
  ambiance: ['the room felt a bit bare', 'it isn’t very cosy yet', 'the walls could do with a picture or two'],
  service: ['the waiter vanished', 'nobody came to take our order for ages', 'we had to wave for the bill'],
};

export const WALKOUT_LINES = [
  'Waited and waited, then gave up. We had a kebab instead.',
  'Never got our food. The seagulls ate better than we did.',
];

export const SO_SO_LINES = ['Perfectly fine. Nothing to write home about.', 'Nice enough. We might come back.'];

export const REVIEWER: Record<GroupId, string> = {
  tourists: 'a tourist',
  students: 'a student',
  locals: 'a local family',
  office: 'an office worker',
  foodies: 'a foodie',
};

export const CRITIC_NAME = 'the Baltic Gourmet column';
