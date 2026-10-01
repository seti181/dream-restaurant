import { describe, expect, it } from 'vitest';
import { drawPanorama, PANORAMA_HEIGHT, PANORAMA_WIDTH, panoramaSky } from './panorama';

const differences = (a: ReturnType<typeof drawPanorama>, b: ReturnType<typeof drawPanorama>) => {
  let n = 0;
  for (let y = 0; y < PANORAMA_HEIGHT; y += 2) for (let x = 0; x < PANORAMA_WIDTH; x += 2) {
    if (JSON.stringify(a.get(x, y)) !== JSON.stringify(b.get(x, y))) n++;
  }
  return n;
};

describe('the riverside panorama', () => {
  it('fills the bottom of the strip, and leaves the sky see-through', () => {
    const day = drawPanorama({ evening: false, fair: false });
    expect(day.width).toBe(PANORAMA_WIDTH);
    expect(day.get(0, 0)).toBeNull();
    for (let x = 0; x < PANORAMA_WIDTH; x += 10) expect(day.get(x, PANORAMA_HEIGHT - 1)).not.toBeNull();
  });

  it('lights up in the evening, and gets its stalls during the Fair', () => {
    const day = drawPanorama({ evening: false, fair: false });
    expect(differences(day, drawPanorama({ evening: true, fair: false }))).toBeGreaterThan(500);
    expect(differences(day, drawPanorama({ evening: false, fair: true }))).toBeGreaterThan(200);
  });

  it('has a sky for every weather, and a dusk sky in the evening', () => {
    expect(panoramaSky('sunny', false)).not.toBe(panoramaSky('rain', false));
    expect(panoramaSky('sunny', true)).toContain('#1f2a55');
  });
});
