// The day playing out: the clock runs and the counters tick up.

import { useEffect, useState } from 'react';
import { balance } from '../data/balance';
import { ticksPerDay } from '../sim/clock';
import { money } from './format';
import { MewaTip } from './Mewa';
import { MomentCard, MomentResultNote } from './MomentCard';
import { GROUP_COLOURS } from './pixel/sprites';
import { canHelp, PixelRestaurantView } from './PixelRestaurantView';
import { GROUP_IDS, GROUPS } from '../data/groups';
import { useGame } from './store';

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      {/* A new key each time the number changes replays the little bump. */}
      <strong key={value} className="bump">
        {value}
      </strong>
      <span>{label}</span>
    </div>
  );
}

/** What the player can do for a waiting table: a free drink, or the chef's apology. */
function HelpPanel({ table, onClose }: { table: number; onClose: () => void }) {
  const guests = useGame((s) => s.live?.floor.tables[table] ?? null);
  const apologies = useGame((s) => s.live?.apologiesLeft ?? 0);
  const helpTable = useGame((s) => s.helpTable);
  const cost = useGame((s) => s.drinkCostAt)(table);
  if (!guests) return null;
  const help = (kind: 'drink' | 'apology') => {
    helpTable(table, kind);
    onClose();
  };
  return (
    <div className="help-panel" role="dialog" aria-label="Help this table">
      <p>
        <strong>{GROUPS[guests.group].name}</strong> {guests.impatience > 0.8 ? 'are losing patience 😤' : 'have been waiting a while ⏳'}
      </p>
      <div className="help-buttons">
        <button type="button" className="primary" disabled={guests.drink || cost === null} onClick={() => help('drink')}>
          {guests.drink ? '🥤 Drink given ✓' : `🥤 Free drink · ${money(cost ?? 0)}`}
        </button>
        <button type="button" className="primary" disabled={guests.apology || apologies === 0} onClick={() => help('apology')}>
          {guests.apology ? '👨‍🍳 Chef came out ✓' : `👨‍🍳 Chef’s apology · ${apologies} left today`}
        </button>
        <button type="button" className="secondary" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </div>
    </div>
  );
}

export function DayScreen() {
  const live = useGame((s) => s.live);
  const [selected, setSelected] = useState<{ table: number; since: number } | null>(null);
  const weather = useGame((s) => s.game.weather);
  const speed = useGame((s) => s.speed);
  const tick = useGame((s) => s.tick);

  // Advance the day on a timer; faster speeds tick more often. Paused means no timer.
  useEffect(() => {
    if (speed === 0) return;
    const msPerTick = (balance.clock.realSecondsPerDay * 1000) / ticksPerDay() / speed;
    const timer = window.setInterval(tick, msPerTick);
    return () => window.clearInterval(timer);
  }, [speed, tick]);

  // The panel closes by itself once that party is served, gone, or beyond help.
  const selectedGuests = selected ? live?.floor.tables[selected.table] ?? null : null;
  const stillThere = selected !== null && selectedGuests?.since === selected.since && canHelp(selectedGuests);
  useEffect(() => {
    if (selected && !stillThere) setSelected(null);
  }, [selected, stillThere]);

  if (!live) return null;

  const { openMinute, closeMinute } = balance.clock;
  const progress = Math.min(1, (live.minute - openMinute) / (closeMinute - openMinute));

  return (
    <main className="screen">
      <div className="card day-card">
        <MewaTip screen="open" />
        <div className="day-header">
          <p className="eyebrow day-status">{live.closing ? 'Closed · last orders' : 'Open for business'}</p>
          <div className="stats">
            <Stat label="Guests served" value={live.guestsServed} />
            <Stat label="Takings" value={money(live.revenue)} />
            <Stat label="Walked out" value={live.guestsWalkedOut} />
            <Stat label="No free table" value={live.guestsTurnedAway} />
          </div>
        </div>
        {live.absent.map((excuse) => (
          <p key={excuse} className="note small">
            📵 {excuse}
          </p>
        ))}
        <div className="day-progress" aria-hidden="true">
          <div style={{ width: `${progress * 100}%` }} />
        </div>
        <div className="scene-wrap">
          <PixelRestaurantView
            floor={live.floor}
            weather={weather}
            minute={live.minute}
            selectedTable={stillThere ? selected!.table : null}
            onTableTap={(table) => {
              const guests = live.floor.tables[table];
              if (guests) setSelected({ table, since: guests.since });
            }}
          />
          {stillThere && !live.moment && <HelpPanel table={selected!.table} onClose={() => setSelected(null)} />}
          {speed === 0 && !live.moment && <p className="paused">Paused. Tap 1× to carry on.</p>}
          {!live.moment && <MomentResultNote />}
          <MomentCard />
        </div>
        <ul className="legend" aria-label="Who is who">
          {GROUP_IDS.map((g) => (
            <li key={g}>
              <span className="swatch" style={{ background: GROUP_COLOURS[g] }} />
              {GROUPS[g].name}
            </li>
          ))}
          <li className="muted">💬 ordering · ⏳ 😤 waiting (tap to help) · 😋 🙂 😐 😞 how the food went · 😠 walked out</li>
        </ul>
      </div>
    </main>
  );
}
