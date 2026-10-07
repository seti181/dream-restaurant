// Mewa's finds (project.md section 6.14, M7c): now and then Mewa drops something she found in town on
// the doorstep, and it turns into a little something: decor for the room, a few more guests tomorrow,
// a pairing to try, a coin, good spirits. Each is found once. How often and how much: balance.finds.

import type { DecorId } from './decor';
import type { GroupId } from './groups';

export type FindId = 'amber' | 'shipsBell' | 'lostKey' | 'recipeCard' | 'grosz' | 'concertTicket' | 'postcard';

export interface Find {
  icon: string;
  /** "A piece of Baltic amber". */
  name: string;
  /** Where Mewa found it, and what comes of it, for the morning news. */
  story: string;
  /** Decor it becomes, free, in the room from that morning. */
  decor?: DecorId;
  /** A group that comes out more the next day (balance.finds.groupBoost). */
  group?: GroupId;
  /** A little money (balance.finds.cash). */
  cash?: boolean;
  /** The team's spirits lift (balance.finds.morale). */
  morale?: boolean;
  /** The back of the card names a perfect pairing not on the menu yet. */
  pairing?: boolean;
}

export const FIND_IDS: readonly FindId[] = ['amber', 'shipsBell', 'lostKey', 'recipeCard', 'grosz', 'concertTicket', 'postcard'];

export const FINDS: Record<FindId, Find> = {
  amber: {
    icon: '✨',
    name: 'A piece of Baltic amber',
    story: 'Washed up at Brzeźno after last night’s waves, and carried all the way here in her beak. It now glows in a little case on your wall.',
    decor: 'amberCase',
  },
  shipsBell: {
    icon: '🔔',
    name: 'A ship’s bell',
    story: 'Fished out of a crate by the Motława (Mewa is not saying how). It hangs by the door now and rings for every guest.',
    decor: 'shipsBell',
  },
  lostKey: {
    icon: '🔑',
    name: 'A lost key',
    story: 'It belongs to Pan Zbyszek from the flower stall on Długi Targ, who had locked himself out. To say thank you, he’s bringing the whole family tomorrow: more locals than usual.',
    group: 'locals',
  },
  recipeCard: {
    icon: '📜',
    name: 'An old recipe card',
    story: 'Blown out of a kitchen window on Mariacka, with a note on the back in someone’s Babcia’s handwriting:',
    pairing: true,
  },
  grosz: {
    icon: '🪙',
    name: 'A lucky grosz',
    story: 'Shiny, from the bottom of the Neptune Fountain (Mewa swears it fell out). Luck brings luck: the till is a little fuller.',
    cash: true,
  },
  concertTicket: {
    icon: '🎻',
    name: 'A concert ticket',
    story: 'For the Philharmonic on Ołowianka, dropped by a cellist in a hurry. Mewa took it back, and the orchestra will come to eat after tomorrow’s concert: more foodies than usual.',
    group: 'foodies',
  },
  postcard: {
    icon: '📬',
    name: 'A postcard from Coimbra',
    story: 'Joana’s family, with a photo of the old university and “Saudades!” in big letters. It goes up behind the bar, and the whole team is in good spirits.',
    morale: true,
  },
};
