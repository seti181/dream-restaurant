// The day playing out: the clock runs and the counters tick up.

import { useEffect } from 'react';
import { balance } from '../data/balance';
import { formatTime, ticksPerDay } from '../sim/clock';
import { money } from './format';
import { useGame } from './store';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

export function DayScreen() {
  const live = useGame((s) => s.live);
  const speed = useGame((s) => s.speed);
  const tick = useGame((s) => s.tick);

  // Advance the day on a timer; faster speeds tick more often. Paused means no timer.
  useEffect(() => {
    if (speed === 0) return;
    const msPerTick = (balance.clock.realSecondsPerDay * 1000) / ticksPerDay() / speed;
    const timer = window.setInterval(tick, msPerTick);
    return () => window.clearInterval(timer);
  }, [speed, tick]);

  if (!live) return null;

  const { openMinute, closeMinute } = balance.clock;
  const progress = Math.min(1, (live.minute - openMinute) / (closeMinute - openMinute));

  return (
    <main className="screen">
      <div className="card">
        <p className="eyebrow">{live.closing ? 'Closed · finishing the last orders' : 'Open for business'}</p>
        <div className="big-clock">{formatTime(live.minute)}</div>
        <div className="day-progress" aria-hidden="true">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="stats">
          <Stat label="Guests served" value={live.guestsServed} />
          <Stat label="Takings" value={money(live.revenue)} />
          <Stat label="Walked out" value={live.guestsWalkedOut} />
          <Stat label="No free table" value={live.guestsTurnedAway} />
        </div>
        {speed === 0 && <p className="paused">Paused. Tap 1× to carry on.</p>}
      </div>
    </main>
  );
}
