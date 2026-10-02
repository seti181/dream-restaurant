// Named regulars with stories (project.md section 6.14, item 7): guests who come back every
// week, each wishing for one thing, and whose little stories unfold over the season.
// Pan Cytrynówka, the Friday regular, is in personal.ts and has rules of his own.
// The rewards are tuned in balance.ts (balance.regulars).

import type { GroupId } from './groups';

export type RegularId = 'filip' | 'fletcher' | 'henryk' | 'weronika';

/** What makes a regular's visit: a soup, pierogi, the lunch set, or a main they can afford. */
export type RegularWish = 'soup' | 'pierogi' | 'lunchSet' | 'cheapMain';

export interface Regular {
  /** As the day report names them. */
  name: string;
  group: GroupId;
  /** Shown over their table and in the day report. */
  emoji: string;
  /** 0 = Monday … 6 = Sunday. */
  weekday: number;
  hour: number;
  minute: number;
  /** The first day they come (then every week on their weekday). */
  firstDay: number;
  wish: RegularWish;
  /** The morning news before their first visit: who they are, with a hint of their wish. */
  intro: string;
  /** Said in the day report when the wish came true, or didn't. */
  wishMet: string;
  wishMissed: string;
  /** Their wish came true, but the meal itself wasn't much good (slow, dear, so-so). */
  notHappy: string;
  /** They couldn't get a table, or gave up waiting: the story waits for next week. */
  missed: string;
  /** One part of the story per visit; the last one has two endings. */
  chapters: string[];
  ending: {
    /** After enough happy visits: they become a friend of the house, and tell everyone. */
    friends: string;
    /** Otherwise: a kind goodbye to the story, and they keep coming anyway. */
    polite: string;
  };
  /** Little moments once the story is over, one per visit, round and round. */
  after: string[];
}

export const REGULAR_IDS: RegularId[] = ['filip', 'fletcher', 'henryk', 'weronika'];

export const REGULARS: Record<RegularId, Regular> = {
  filip: {
    name: 'Filip',
    group: 'office',
    emoji: '💻',
    weekday: 3,
    hour: 12,
    minute: 30,
    // Thursday of week 1.
    firstDay: 3,
    wish: 'lunchSet',
    intro:
      'Filip, from an office on Granary Island, booked a table for 12:30 today. He asked if you do a lunch set. ' +
      '“I only have forty minutes,” he said. “Every Thursday.”',
    wishMet: 'He had the lunch set and was back at his desk in forty minutes, as promised.',
    wishMissed: 'He asked for the lunch set. There wasn’t one. He typed something sad into his phone.',
    notHappy: 'He gave you three stars in his head. You could tell.',
    missed: 'Filip came for lunch, found no table and ate a drożdżówka on the bridge. Next Thursday, then.',
    chapters: [
      'A young man with a laptop and a lanyard ate with one hand and typed with the other. ' +
        'Filip’s start-up on Granary Island is making an app. “For what?” “We’re still deciding.”',
      'Filip’s app is for finding a free table in a restaurant. He tested it here. It said you were full. You were.',
      'The investors said no. Filip ate his lunch very slowly and didn’t open the laptop once.',
      'A new idea: an app that tells you what your friends had for lunch. Filip photographed his plate from six angles. “For the database.”',
    ],
    ending: {
      friends:
        'The investors said yes! Filip’s whole team comes for lunch on Thursdays now, ' +
        'and every office on Granary Island has heard about you.',
      polite: 'The investors said yes! Filip celebrated with a quick lunch, shook your hand and ran back to the office.',
    },
    after: [
      'Filip’s app sent you a notification about yourself. He apologised.',
      'Filip closed the laptop and just ate. “Doctor’s orders,” he said.',
      'Filip brought the new intern, who also had a laptop.',
    ],
  },
  fletcher: {
    name: 'Mr Fletcher',
    group: 'tourists',
    emoji: '📖',
    weekday: 5,
    hour: 13,
    minute: 0,
    // Saturday of week 1.
    firstDay: 5,
    wish: 'pierogi',
    intro:
      'A man with a Manchester accent rang to book a table for one at 13:00 today. ' +
      'He asked, twice, if you have “pier-OH-gee”.',
    wishMet: 'He ordered the pierogi in Polish. Nearly.',
    wishMissed: 'He looked for pierogi on the menu, very carefully, twice, then had something else.',
    notHappy: 'He said “lovely, lovely”, the way the English do when it wasn’t.',
    missed: 'Mr Fletcher came by, found no free table and went to feed the gulls on Długie Pobrzeże. Next Saturday!',
    chapters: [
      'A sunburnt man in a bucket hat asked for “two pier-OH-gee, please”. Graham Fletcher, from Manchester, ' +
        'here for a long weekend. “Back to the office on Monday,” he said.',
      'Mr Fletcher is still here. “Changed my flight,” he said. “Just one more week. For the amber. And the pierogi.”',
      'Mr Fletcher has a phrasebook now. “Dzień dobry! Poproszę… erm…” He pointed at the menu. Progress.',
      'Mr Fletcher has a job: telling tourists about Gdańsk on the galleon on the Motława. ' +
        '“I’ve been here a month,” he said. “I’m practically a local.”',
    ],
    ending: {
      friends:
        'Mr Fletcher has cancelled his flight for good and rented a flat on Ogarna. Every tour on his galleon ' +
        'now ends with: “And for lunch, my friends, I know a place.”',
      polite: 'Mr Fletcher is staying in Gdańsk for good, he says. He’s trying all the restaurants, “for research”.',
    },
    after: [
      'Mr Fletcher brought two tourists from his galleon. They both say “pier-OH-gee” now.',
      'Mr Fletcher ordered without the phrasebook. The waiter only had to guess a little.',
      'Mr Fletcher has bought an amber ring. He says it’s for nobody. He’s blushing.',
    ],
  },
  henryk: {
    name: 'Pan Henryk',
    group: 'locals',
    emoji: '⚓',
    weekday: 1,
    hour: 13,
    minute: 0,
    // Tuesday of week 2, after Mewa's first days.
    firstDay: 8,
    wish: 'soup',
    intro:
      'Someone booked the corner table for one o’clock today. “Every Tuesday,” he said on the phone, ' +
      '“if the soup is good.”',
    wishMet: 'He had his soup and said it was nearly as good as his Danusia’s. High praise.',
    wishMissed: 'He looked for a soup on the menu, sighed, and had what there was.',
    notHappy: 'He didn’t complain. He never does. But he left his crossword unfinished.',
    missed: 'Pan Henryk came by at one, saw no free table and went home with his newspaper. Next Tuesday, then.',
    chapters: [
      'A quiet man in a navy jumper took the corner table. Forty years on the cranes at the shipyard. ' +
        '“From up there you could see all of Gdańsk,” he said. “Now I see your menu.”',
      'Pan Henryk brought a photo of the shipyard in August 1980, the gates full of flowers and flags. ' +
        '“That one is me,” he said, tapping a tiny dot. “Probably.”',
      'His granddaughter Zosia got into the Maritime University in Gdynia! Pan Henryk told every table. Twice.',
      'Pan Henryk fixed the wobbly table by the door with a folded beer mat and a crane operator’s eye. “Level,” he said. It is.',
    ],
    ending: {
      friends:
        'Pan Henryk brought his old yellow shipyard helmet and asked if it could live by the kitchen. ' +
        '“It should be somewhere with people,” he said. Every local in the Old Town knows whose it is.',
      polite: 'Pan Henryk shook your hand at the door. “Good place,” he said. “Could be a great one.” He’ll still come on Tuesdays.',
    },
    after: [
      'Pan Henryk told the story of the crane that got stuck in 1978. It gets longer every week.',
      'Pan Henryk read the paper at the corner table and did the crossword out loud.',
      'Pan Henryk brought Zosia, in her new uniform. She ordered for both of them.',
    ],
  },
  weronika: {
    name: 'Weronika',
    group: 'students',
    emoji: '✏️',
    weekday: 2,
    hour: 18,
    minute: 30,
    // Wednesday of week 2.
    firstDay: 9,
    wish: 'cheapMain',
    intro:
      'A note under the door: “Table for one, today at 18:30? I can’t pay much for a main, ' +
      'but I’ll draw you something. Weronika (Academy of Fine Arts)”',
    wishMet: 'She found a main she could afford and ate every crumb.',
    wishMissed: 'Every main was a bit dear for a student. She had a kompot and drew the bread basket.',
    notHappy: 'Weronika’s drawing tonight was a bit gloomy. Grey pencil only.',
    missed: 'Weronika came with her sketchbook, found every table taken and drew the queue instead. See you next Wednesday.',
    chapters: [
      'A student with paint on her sleeves drew your whole dining room in ten minutes flat. ' +
        '“Sorry,” said Weronika. “I draw everything. Your lamps are very drawable.”',
      'Weronika drew the chef. The chef pretended not to notice and stood up a little straighter.',
      'Exam week at the Academy. Weronika drew nothing at all, ate in silence and stared at the ceiling. ' +
        '“Perspective,” she whispered. “I hate perspective.”',
      'Weronika passed! Her teacher chose her drawings of your restaurant for the summer show in the Great Armoury. ' +
        '“Is that okay?” she asked. “You’re in it.”',
    ],
    ending: {
      friends:
        'Weronika brought the drawing from the show, framed, and hung it by the door herself. ' +
        'Students keep stopping to look at it, and then coming in.',
      polite: 'Weronika’s show was a success. She gave the framed drawing to her mum, but promised you a postcard of it.',
    },
    after: [
      'Weronika drew Mewa on a napkin. Mewa looked offended, then flattered.',
      'Weronika brought three friends from the Academy. All of them drew the same lamp.',
      'Weronika is painting the Żuraw now, but she still comes on Wednesdays.',
    ],
  },
};

/** When a regular got a table but gave up waiting for the food. */
export const walkedOutLine = (name: string) =>
  `${name} waited and waited for the food, then had to go. The rest of the story will have to wait until next week.`;
