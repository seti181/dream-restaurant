// Building works: bigger premises, bought in the Interior tab (project.md section 6.14, M7c).
// They belong to the premises: moving to another street leaves them behind. How much each costs
// and does is in balance.ts (balance.works).

export type BuildingWorkId = 'counter' | 'toilet';

export interface BuildingWork {
  icon: string;
  name: string;
  /** What it is and does, for the Interior tab. */
  blurb: string;
}

export const BUILDING_WORK_IDS: readonly BuildingWorkId[] = ['counter', 'toilet'];

export const BUILDING_WORKS: Record<BuildingWorkId, BuildingWork> = {
  counter: {
    icon: '🥃',
    name: 'Bar counter',
    blurb: 'Four stools along the bar: someone on their own or a pair sits there for a coffee or a quick lunch, and your tables stay free for bigger parties.',
  },
  toilet: {
    icon: '🚪',
    name: 'Toilet',
    blurb: 'A little door at the back with the ○ and ▽ on it. Guests feel looked after, and are a little happier.',
  },
};
