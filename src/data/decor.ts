// Decor styles and items. See project.md section 6.6.

import type { GroupId } from './groups';

export type DecorStyle = 'hanseatic' | 'maritime' | 'rustic' | 'modern' | 'portuguese';

export type DecorId =
  | 'chandelier'
  | 'portraits'
  | 'panelling'
  | 'shipsInBottles'
  | 'lanterns'
  | 'seaChart'
  | 'tablecloths'
  | 'clayPots'
  | 'tiledStove'
  | 'pendantLights'
  | 'plantWall'
  | 'communalTable'
  | 'azulejoTiles'
  | 'amberCase'
  | 'shipsBell';

export interface DecorItem {
  name: string;
  style: DecorStyle;
  cost: number;
  /** Ambiance points added (the restaurant's ambiance runs from 0 to 100). */
  ambiance: number;
  /** Hidden in the shop until a choice card unlocks it (see data/moments.ts). */
  unlockable?: boolean;
  /** Never sold: one of Mewa's finds (data/finds.ts), given for free when she brings it. */
  found?: boolean;
}

export const DECOR_STYLE_IDS: readonly DecorStyle[] = ['hanseatic', 'maritime', 'rustic', 'modern', 'portuguese'];

export const DECOR_STYLES: Record<DecorStyle, { name: string; description: string; favouredBy: GroupId[] }> = {
  hanseatic: {
    name: 'Hanseatic',
    description: 'Dark wood, brass and merchant portraits, like a townhouse on Długa.',
    favouredBy: ['foodies'],
  },
  maritime: {
    name: 'Maritime',
    description: 'Rope, lanterns and sea charts. You can almost hear the gulls.',
    favouredBy: ['tourists'],
  },
  rustic: {
    name: 'Rustic Polish',
    description: 'Embroidered cloths, clay pots and a warm tiled stove. Like visiting Babcia.',
    favouredBy: ['locals'],
  },
  modern: {
    name: 'Modern',
    description: 'Clean lines, plants and good lighting. Quick lunches feel at home.',
    favouredBy: ['office', 'students'],
  },
  portuguese: {
    name: 'Portuguese corner',
    description: 'Blue and white azulejo tiles, like a café in Lisbon or Coimbra.',
    favouredBy: ['tourists', 'foodies'],
  },
};

export const DECOR_IDS: readonly DecorId[] = [
  'chandelier', 'portraits', 'panelling',
  'shipsInBottles', 'lanterns', 'seaChart',
  'tablecloths', 'clayPots', 'tiledStove',
  'pendantLights', 'plantWall', 'communalTable',
  'azulejoTiles', 'amberCase', 'shipsBell',
];

export const DECOR: Record<DecorId, DecorItem> = {
  chandelier: { name: 'Brass chandelier', style: 'hanseatic', cost: 2_500, ambiance: 8 },
  portraits: { name: 'Merchant portraits', style: 'hanseatic', cost: 1_800, ambiance: 6 },
  panelling: { name: 'Carved oak panelling', style: 'hanseatic', cost: 4_000, ambiance: 12 },
  shipsInBottles: { name: 'Ships in bottles', style: 'maritime', cost: 1_200, ambiance: 5 },
  lanterns: { name: 'Rope and lantern lamps', style: 'maritime', cost: 2_000, ambiance: 7 },
  seaChart: { name: 'Painted chart of the Bay of Gdańsk', style: 'maritime', cost: 3_000, ambiance: 9 },
  tablecloths: { name: 'Kashubian embroidered tablecloths', style: 'rustic', cost: 1_200, ambiance: 5 },
  clayPots: { name: 'Shelf of clay pots', style: 'rustic', cost: 1_500, ambiance: 6 },
  tiledStove: { name: 'Tiled stove corner', style: 'rustic', cost: 3_500, ambiance: 11 },
  pendantLights: { name: 'Designer pendant lights', style: 'modern', cost: 2_200, ambiance: 7 },
  plantWall: { name: 'Living plant wall', style: 'modern', cost: 2_800, ambiance: 8 },
  communalTable: { name: 'Long oak communal table', style: 'modern', cost: 3_000, ambiance: 9 },
  azulejoTiles: { name: 'Azulejo tiles from Coimbra', style: 'portuguese', cost: 2_500, ambiance: 10, unlockable: true },
  amberCase: { name: 'Baltic amber in a little case (Mewa’s find)', style: 'hanseatic', cost: 0, ambiance: 4, found: true },
  shipsBell: { name: 'A ship’s bell by the door (Mewa’s find)', style: 'maritime', cost: 0, ambiance: 4, found: true },
};
