// A hidden performance meter for checking the game on the tablet (project.md M5).
// Open the game with "?perf" at the end of the address to see it; normal play never shows it.

import { useEffect, useState } from 'react';

export const perfMeterWanted = typeof location !== 'undefined' && new URLSearchParams(location.search).has('perf');

export function PerfMeter() {
  const [reading, setReading] = useState({ fps: 0, slowest: 0 });

  useEffect(() => {
    let frames = 0;
    let slowest = 0;
    let last = performance.now();
    let windowStart = last;
    let id = requestAnimationFrame(function frame(now) {
      frames++;
      slowest = Math.max(slowest, now - last);
      last = now;
      // Report once a second: frames in that second, and the longest gap between two frames.
      if (now - windowStart >= 1000) {
        setReading({ fps: Math.round((frames * 1000) / (now - windowStart)), slowest: Math.round(slowest) });
        frames = 0;
        slowest = 0;
        windowStart = now;
      }
      id = requestAnimationFrame(frame);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  const smooth = reading.fps >= 50 && reading.slowest < 50;
  return (
    <div className={smooth ? 'perf-meter' : 'perf-meter slow'} aria-hidden="true">
      {reading.fps} fps · slowest frame {reading.slowest} ms
    </div>
  );
}
