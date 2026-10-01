// The day playing out: the clock runs and the counters tick up.

import { useEffect, useState } from 'react';
import type { TableGuests } from '../sim/day';
import { balance } from '../data/balance';
import { formatTime, ticksPerDay } from '../sim/clock';
import { money } from './format';
import { MewaTip } from './Mewa';
import { MomentCard, MomentResultNote } from './MomentCard';
import { GROUP_COLOURS } from './pixel/sprites';
import { canTend, PixelRestaurantView } from './PixelRestaurantView';
import { isFavourite } from '../sim/seating';
import { playerOf } from '../sim/game';
import { FAVOURITE_SPOTS, GROUP_IDS, GROUPS, SPOT_NAMES } from '../data/groups';
import { GULLS } from '../data/gulls';
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

/** How a seated party is doing, in a few words. */
function howTheyAre(guests: TableGuests): string {
  if (guests.stage === 'ordering') return 'are choosing from the menu 💬';
  if (guests.impatience > 0.8) return 'are losing patience 😤';
  if (guests.impatience > 0.5) return 'have been waiting a while ⏳';
  return 'are waiting for their food';
}

/** What the player can do for a seated table: a better table, a free drink, or the chef's apology. */
function HelpPanel({
  table,
  freeTables,
  onMove,
  onClose,
}: {
  table: number;
  freeTables: number;
  onMove: () => void;
  onClose: () => void;
}) {
  const guests = useGame((s) => s.live?.floor.tables[table] ?? null);
  const apologies = useGame((s) => s.live?.apologiesLeft ?? 0);
  const helpTable = useGame((s) => s.helpTable);
  const cost = useGame((s) => s.drinkCostAt)(table);
  if (!guests) return null;
  const help = (kind: 'drink' | 'apology') => {
    helpTable(table, kind);
    onClose();
  };
  const canMove = !guests.moved && guests.tablesUsed === 1 && freeTables > 0;
  return (
    <div className="help-panel" role="dialog" aria-label="Look after this table">
      <p>
        <strong>{GROUPS[guests.group].name}</strong> {howTheyAre(guests)}
        <br />
        <span className="small muted">
          They love {FAVOURITE_SPOTS[guests.group].map((spot) => SPOT_NAMES[spot]).join(' or ')}.
        </span>
      </p>
      <div className="help-buttons">
        <button type="button" className="primary" disabled={!canMove} onClick={onMove}>
          {guests.moved ? '🪑 Already moved ✓' : guests.tablesUsed > 1 ? '🪑 Too many to move' : '🪑 Move them'}
        </button>
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

/** Opens the planning tabs during the day: menu, map, staff and the rest. The clock waits meanwhile. */
function ManageButton() {
  const openManager = useGame((s) => s.openManager);
  return (
    <button type="button" className="happy-hour manage" onClick={openManager}>
      📋 <strong>Manage</strong>
      <span>menu, map, staff…</span>
    </button>
  );
}

/** Today's happy hour: a button to start it, then how long is left, then done. */
function HappyHourButton() {
  const hour = useGame((s) => s.live?.happyHour ?? null);
  const minute = useGame((s) => s.live?.minute ?? 0);
  const closing = useGame((s) => s.live?.closing ?? false);
  const start = useGame((s) => s.startHappyHour);
  const { minutes, discount } = balance.happyHour;
  if (hour && minute < hour.until) {
    return (
      <div className="happy-hour on" role="status">
        🍹 <strong>Happy hour!</strong>
        <span>until {formatTime(hour.until)}</span>
      </div>
    );
  }
  return (
    <button type="button" className="happy-hour" disabled={hour !== null || closing} onClick={start}>
      🍹 <strong>{hour ? 'Happy hour done' : 'Start happy hour'}</strong>
      <span>{hour ? 'see you tomorrow' : `${minutes} min, ${Math.round(discount * 100)}% off`}</span>
    </button>
  );
}

/** What the last gull did, for a few seconds. */
function GullNote() {
  const last = useGame((s) => s.live?.lastGull ?? null);
  const [shownOut, setShownOut] = useState<typeof last>(null);
  useEffect(() => {
    if (!last) return;
    const timer = window.setTimeout(() => setShownOut(last), 4000);
    return () => window.clearTimeout(timer);
  }, [last]);
  if (!last || shownOut === last) return null;
  return <p className={`gull-warning ${last.shooed ? 'good' : 'bad'}`}>{last.shooed ? '🎉' : '🐦'} {last.text}</p>;
}

export function DayScreen() {
  const live = useGame((s) => s.live);
  const shooGull = useGame((s) => s.shooGull);
  const [selected, setSelected] = useState<{ table: number; since: number } | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [seatNote, setSeatNote] = useState<{ text: string; at: number } | null>(null);
  const location = useGame((s) => playerOf(s.game).location);
  const moveGuests = useGame((s) => s.moveGuests);
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
  const stillThere = selected !== null && selectedGuests?.since === selected.since && canTend(selectedGuests);
  useEffect(() => {
    if (selected && !stillThere) {
      setSelected(null);
      setChoosing(false);
    }
  }, [selected, stillThere]);
  useEffect(() => {
    if (!seatNote) return;
    const timer = window.setTimeout(() => setSeatNote(null), 3500);
    return () => window.clearTimeout(timer);
  }, [seatNote]);

  if (!live) return null;

  // The free tables the selected guests could move to, their favourites marked.
  const free = live.floor.tables
    .map((guests, table) => ({ guests, table }))
    .filter(({ guests, table }) => guests === null && (!selected || table !== selected.table))
    .map(({ table }) => ({
      table,
      favourite: selectedGuests ? isFavourite(selectedGuests.group, location, live.floor.insideTables, table) : false,
    }));
  const close = () => {
    setSelected(null);
    setChoosing(false);
  };

  const { openMinute, closeMinute } = balance.clock;
  const progress = Math.min(1, (live.minute - openMinute) / (closeMinute - openMinute));

  return (
    <main className="screen">
      <div className="card day-card">
        <MewaTip screen="open" />
        <div className="day-header">
          <p className="eyebrow day-status">{live.closing ? 'Closed · last orders' : 'Open for business'}</p>
          <HappyHourButton />
          <ManageButton />
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
            onGullTap={shooGull}
            freeTables={choosing && stillThere ? free : []}
            onFreeTableTap={(to) => {
              if (!selected) return;
              const favourite = moveGuests(selected.table, to);
              if (favourite !== null) {
                setSeatNote({
                  text: favourite ? 'Their favourite spot! They’re delighted. ⭐' : 'They follow you to their new table.',
                  at: Date.now(),
                });
              }
              close();
            }}
          />
          {seatNote && !live.moment && <p className="gull-warning good">🪑 {seatNote.text}</p>}
          {choosing && stillThere && !live.moment && (
            <div className="help-panel" role="dialog" aria-label="Choose a table">
              <p>
                Tap a free table. <span className="small muted">⭐ marks their favourite spots.</span>
              </p>
              <div className="help-buttons">
                <button type="button" className="secondary" onClick={close}>
                  Cancel
                </button>
              </div>
            </div>
          )}
          {live.floor.gull && !live.moment && <p className="gull-warning">🐦 {GULLS.warning}</p>}
          {!live.floor.gull && !live.moment && <GullNote />}
          {stillThere && !choosing && !live.moment && (
            <HelpPanel table={selected!.table} freeTables={free.length} onMove={() => setChoosing(true)} onClose={close} />
          )}
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
          <li className="muted">💬 ordering · ⏳ 😤 waiting · tap a table to look after it · 😋 🙂 😐 😞 how the food went · 😠 walked out</li>
        </ul>
      </div>
    </main>
  );
}
