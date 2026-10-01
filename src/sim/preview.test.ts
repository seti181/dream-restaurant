import { describe, expect, it } from 'vitest';
import { LOCATION_IDS } from '../data/locations';
import { newGame, playerOf, restingFloor } from './game';
import { previewOf } from './preview';

describe('having a look at a street from the map', () => {
  const game = newGame(3);

  it('shows your own restaurant on your street', () => {
    const preview = previewOf(game, playerOf(game).location);
    expect(preview.whose).toBe('yours');
    expect(preview.floor).toEqual(restingFloor(game));
  });

  it("shows a rival's restaurant on their street, and yours moved there on an empty one", () => {
    for (const location of LOCATION_IDS) {
      if (location === playerOf(game).location) continue;
      const rival = game.restaurants.slice(1).find((r) => r.location === location);
      const preview = previewOf(game, location);
      expect(preview.floor.location).toBe(location);
      expect(preview.whose).toBe(rival ? 'rival' : 'moved');
      expect(preview.name).toBe(rival ? rival.name : playerOf(game).name);
      expect(preview.floor.tables.length).toBe(preview.floor.insideTables + preview.floor.terraceTables);
    }
  });

  it('changes nothing', () => {
    const before = JSON.stringify(game);
    for (const location of LOCATION_IDS) previewOf(game, location);
    expect(JSON.stringify(game)).toBe(before);
  });
});
