// The day playing out: the restaurant and its street fill the screen, with the clock, the day's
// numbers, the money and the buttons in small framed panels in its corners (project.md section 9.3, A).

import { useEffect, useState, type ReactNode } from 'react';
import type { TableGuests } from '../sim/day';
import { balance } from '../data/balance';
import { formatTime, ticksPerDay } from '../sim/clock';
import { bookingKindOf } from '../sim/bookings';
import { bookingLine } from './plan/BookingsBox';
import { streakTipPerGuest } from '../sim/rush';
import { THEME_NIGHTS } from '../data/themeNights';
import { dishName, forecastMiss, money } from './format';
import { Cash, MuteButton, Rating, SpeedControls, useHudFacts, WeatherName } from './Hud';
import { FoodIcon } from './PixelIcon';
import type { GroupId } from '../data/groups';
import { MewaTip } from './Mewa';
import { MomentCard, MomentResultNote, NoteClose } from './MomentCard';
import { GROUP_COLOURS } from './pixel/sprites';
import { canTend, PixelRestaurantView } from './PixelRestaurantView';
import { isFavourite } from '../sim/seating';
import { playerOf } from '../sim/game';
import { FAVOURITE_SPOTS, GROUP_IDS, GROUPS, SPOT_NAMES } from '../data/groups';
import { GULLS } from '../data/gulls';
import { play } from './sound';
import { useGame, type LiveDay } from './store';

type StatId = 'served' | 'takings' | 'walkedOut' | 'turnedAway' | 'goal';

type DailyGoalView = NonNullable<LiveDay['dailyGoal']>;

/** Today's goal in the little box at the top: "5/8", a share of the takings, ✓ once done. */
function goalValue(goal: DailyGoalView): string {
  if (goal.done) return '✓';
  if (goal.atClosing) return goal.progress <= goal.target ? '🤞' : '✗';
  if (goal.target >= 500) return `${Math.min(99, Math.floor((goal.progress / goal.target) * 100))}%`;
  return `${Math.floor(goal.progress)}/${goal.target}`;
}

/** How far today's goal has got, in a sentence. */
export function goalProgressText(goal: Pick<DailyGoalView, 'atClosing' | 'progress' | 'target'>, finished = false): string {
  if (goal.atClosing) {
    if (goal.progress > goal.target) return `${goal.progress} ${goal.progress === 1 ? 'guest' : 'guests'} walked out.`;
    return finished ? 'Nobody walked out.' : 'Nobody has walked out so far.';
  }
  if (goal.target >= 500) return `${money(goal.progress)} of ${money(goal.target)}.`;
  return `${Math.floor(goal.progress)} of ${goal.target}.`;
}

/** One of the day's numbers. Tapping it opens the list behind it. */
function Stat({
  label,
  value,
  open,
  onToggle,
}: {
  label: string;
  value: string | number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button type="button" className={`stat${open ? ' open' : ''}`} aria-expanded={open} onClick={onToggle}>
      {/* A new key each time the number changes replays the little bump. */}
      <strong key={value} className="bump">
        {value}
      </strong>
      <span>{label}</span>
    </button>
  );
}

/** Groups listed with how many of each, biggest first, each with a bar. */
function GroupRows({ counts }: { counts: Partial<Record<GroupId, number>> }) {
  const rows = GROUP_IDS.map((g) => ({ g, n: counts[g] ?? 0 }))
    .filter((r) => r.n > 0)
    .sort((a, b) => b.n - a.n);
  const most = Math.max(1, ...rows.map((r) => r.n));
  return (
    <ul className="stat-rows">
      {rows.map(({ g, n }) => (
        <li key={g}>
          <span className="swatch" style={{ background: GROUP_COLOURS[g] }} />
          <span className="stat-name">{GROUPS[g].name}</span>
          <span className="stat-bar">
            <span style={{ width: `${(n / most) * 100}%`, background: GROUP_COLOURS[g] }} />
          </span>
          <strong>{n}</strong>
        </li>
      ))}
    </ul>
  );
}

/** The list behind one of the day's numbers, live as the day goes on. */
function StatPanel({ stat, onClose }: { stat: StatId; onClose: () => void }) {
  // Re-reads on every tick, while the day runs.
  useGame((s) => s.live?.minute);
  const breakdown = useGame((s) => s.breakdown)();
  const goal = useGame((s) => s.live?.dailyGoal ?? null);
  if (!breakdown) return null;
  const titles: Record<StatId, string> = {
    served: 'Guests served today',
    takings: 'Takings by dish',
    walkedOut: 'Walked out: waited too long for their food',
    turnedAway: 'No free table: went somewhere else',
    goal: 'Mewa’s goal for today',
  };
  const empty = (counts: Partial<Record<GroupId, number>>) => Object.values(counts).every((n) => !n);
  return (
    <div className="stat-panel" role="dialog" aria-label={titles[stat]}>
      <header>
        <h2>{titles[stat]}</h2>
        <button type="button" className="secondary" onClick={onClose} aria-label="Close">
          ✕
        </button>
      </header>
      {stat === 'served' &&
        (empty(breakdown.served) ? <p className="muted">Nobody has been served yet.</p> : <GroupRows counts={breakdown.served} />)}
      {stat === 'takings' &&
        (breakdown.dishes.length === 0 ? (
          <p className="muted">Nothing sold yet.</p>
        ) : (
          <ul className="stat-rows">
            {breakdown.dishes.slice(0, 10).map(({ dish, count, revenue }) => (
              <li key={`${dish.template}/${dish.variant}/${dish.name ?? ''}`}>
                <FoodIcon template={dish.template} />
                <span className="stat-name">{dishName(dish)}</span>
                <span className="muted">× {count}</span>
                <strong>{money(revenue)}</strong>
              </li>
            ))}
          </ul>
        ))}
      {stat === 'walkedOut' &&
        (empty(breakdown.walkedOut) ? (
          <p className="muted">Nobody has walked out today. 🎉</p>
        ) : (
          <>
            <GroupRows counts={breakdown.walkedOut} />
            <p className="small muted">
              More chefs or a faster kitchen help, and so does a free drink or the chef’s apology for a waiting table.
            </p>
          </>
        ))}
      {stat === 'goal' && goal && (
        <>
          <p>
            <strong>
              {goal.icon} {goal.text}
            </strong>
          </p>
          <p>{goal.done ? 'Done! 🎉' : goalProgressText(goal)}</p>
          <p className="small muted">Mewa drops {money(goal.reward)} at the door when it’s done.</p>
        </>
      )}
      {stat === 'turnedAway' &&
        (empty(breakdown.turnedAway) ? (
          <p className="muted">Everyone has found a table so far.</p>
        ) : (
          <>
            <GroupRows counts={breakdown.turnedAway} />
            <p className="small muted">Every table was taken. More tables in the Interior tab, or a bigger street on the Map.</p>
          </>
        ))}
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

/** Top left: the time, the date and the weather, with how far through the day it is along the bottom. */
function ClockPanel({ minute, closing }: { minute: number; closing: boolean }) {
  const facts = useHudFacts();
  const { openMinute, closeMinute } = balance.clock;
  const progress = Math.max(0, Math.min(1, (minute - openMinute) / (closeMinute - openMinute)));
  return (
    <div className="frame day-clock">
      <strong className="day-time">{formatTime(minute)}</strong>
      <span className="day-date">{facts.date}</span>
      <span className="day-week">
        Week {facts.week} · <WeatherName facts={facts} />
        {closing && <strong className="day-closing"> · Last orders</strong>}
      </span>
      <span className="day-clock-progress" aria-hidden="true">
        <span style={{ width: `${progress * 100}%` }} />
      </span>
    </div>
  );
}

/** A round button along the bottom of the day screen, with its name on a little plate underneath. */
function RoundButton({
  icon,
  label,
  detail,
  disabled,
  expanded,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  detail?: string;
  disabled?: boolean;
  expanded?: boolean;
  onClick: () => void;
}) {
  return (
    <button type="button" className="round-button" disabled={disabled} aria-expanded={expanded} onClick={onClick}>
      <span className="round-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="round-label">
        {label}
        {detail && <small>{detail}</small>}
      </span>
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
      <div className="round-button on" role="status">
        <span className="round-icon" aria-hidden="true">
          🍹
        </span>
        <span className="round-label">
          Happy hour!
          <small>until {formatTime(hour.until)}</small>
        </span>
      </div>
    );
  }
  return (
    <RoundButton
      icon="🍹"
      label="Happy hour"
      detail={hour ? 'done for today' : `${minutes} min, ${Math.round(discount * 100)}% off`}
      disabled={hour !== null || closing}
      onClick={start}
    />
  );
}

/** Who is who on the street and at the tables, opened from its round button. */
function WhoIsWho({ flyersLeft, onClose }: { flyersLeft: number; onClose: () => void }) {
  return (
    <div className="frame legend-panel" role="dialog" aria-label="Who is who">
      <header>
        <h2>Who’s who</h2>
        <NoteClose onClose={onClose} />
      </header>
      <ul className="legend-groups">
        {GROUP_IDS.map((g) => (
          <li key={g}>
            <span className="swatch" style={{ background: GROUP_COLOURS[g] }} />
            {GROUPS[g].name}
          </li>
        ))}
      </ul>
      <ul className="legend-bubbles">
        <li>💬 choosing from the menu</li>
        <li>⏳ 😤 waiting for their food: tap the table to look after them</li>
        <li>😋 🙂 😐 😞 how the food went</li>
        <li>😠 walked out</li>
        {flyersLeft > 0 && <li>📜 tap someone walking past to hand them a flyer</li>}
      </ul>
    </div>
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
  return (
    <p className={`gull-warning ${last.shooed ? 'good' : 'bad'}`}>
      <span>{last.text}</span>
      <NoteClose onClose={() => setShownOut(last)} />
    </p>
  );
}

/** How long the notes at the start of the day stay on screen, in real seconds. */
const MORNING_NOTE_SECONDS = 15;

/**
 * Notes as the doors open: the forecast got the weather wrong, or someone didn't turn up
 * (Adrian's excuses, someone in bed). For a little while, or until closed.
 */
function MorningNotes() {
  const absent = useGame((s) => s.live?.absent ?? []);
  const said = useGame((s) => s.openDay?.forecastSaid ?? null);
  const weather = useGame((s) => s.openDay?.weather ?? null);
  const game = useGame((s) => s.game);
  const booked = game.bookings.filter((r) => r.accepted && r.day === game.day);
  const [closed, setClosed] = useState<string[]>([]);
  const [expired, setExpired] = useState(false);
  useEffect(() => {
    const timer = window.setTimeout(() => setExpired(true), MORNING_NOTE_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, []);
  if (expired) return null;
  const notes = [
    ...(said && weather ? [{ text: forecastMiss(said, weather), good: weather !== 'rain' }] : []),
    ...absent.map((excuse) => ({ text: excuse, good: false })),
    ...booked.map((r) => ({ text: `${bookingKindOf(r).icon} Booked today: ${bookingLine(r)}.`, good: true })),
  ];
  return (
    <>
      {notes
        .filter((note) => !closed.includes(note.text))
        .map((note) => (
          <p key={note.text} className={`gull-warning ${note.good ? 'good' : 'bad'}`}>
            <span>{note.text}</span>
            <NoteClose onClose={() => setClosed((now) => [...now, note.text])} />
          </p>
        ))}
    </>
  );
}

/** Tonight's theme night, once it starts at 18:00: until closed. */
function ThemeNightNote({ minute }: { minute: number }) {
  const booking = useGame((s) => (s.game.themeNight?.day === s.game.day ? s.game.themeNight : null));
  const [closed, setClosed] = useState(false);
  if (!booking || closed || minute < balance.themeNights.fromMinute || minute >= balance.clock.closeMinute) return null;
  return (
    <p className="gull-warning good">
      <span>{THEME_NIGHTS[booking.id].tonight}</span>
      <NoteClose onClose={() => setClosed(true)} />
    </p>
  );
}

/** During the lunch and dinner rushes: the team can be hurried. Until closed, once per rush. */
function RushNote({ rush }: { rush: string | null }) {
  const [closed, setClosed] = useState<string | null>(null);
  if (!rush || closed === rush) return null;
  return (
    <p className="gull-warning good">
      <span>🔥 {rush}! Tap ⚡ on a chef or a waiter to hurry them: faster for a while, then a breather.</span>
      <NoteClose onClose={() => setClosed(rush)} />
    </p>
  );
}

/** Tables served quickly in a row: from five, each one tips a little. */
function StreakNote({ streak }: { streak: number }) {
  if (streak < 3) return null;
  const tips = streakTipPerGuest(streak);
  return (
    <p className="gull-warning good streak-note">
      <span>
        ⚡ {streak} quick tables in a row{tips > 0 ? `: ${tips} zł a guest in tips!` : '. Keep it up!'}
      </span>
    </p>
  );
}

/** "Paused": until the clock runs again, or until closed (it comes back with the next pause). */
function PausedNote({ speed }: { speed: number }) {
  const [closed, setClosed] = useState(false);
  useEffect(() => {
    if (speed !== 0) setClosed(false);
  }, [speed]);
  if (speed !== 0 || closed) return null;
  return (
    <p className="paused">
      <span>Paused. Tap 1× to carry on.</span>
      <NoteClose onClose={() => setClosed(true)} />
    </p>
  );
}

/** How long the gull warning stays up, in real seconds; the gull itself stays until it's shooed or gone. */
const GULL_WARNING_SECONDS = 5;

/** "A gull is eyeing a plate!": shown when a gull lands, for a few seconds, or until closed. */
function GullWarning() {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    const timer = window.setTimeout(() => setShown(false), GULL_WARNING_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, []);
  if (!shown) return null;
  return (
    <p className="gull-warning">
      <span>{GULLS.warning}</span>
      <NoteClose onClose={() => setShown(false)} />
    </p>
  );
}

/** How long a short note (a new seat, how flyers work) stays up, in real seconds. */
const NOTE_SECONDS = 4;

export function DayScreen() {
  const live = useGame((s) => s.live);
  const shooGull = useGame((s) => s.shooGull);
  const hurryStaff = useGame((s) => s.hurry);
  const handFlyer = useGame((s) => s.handFlyer);
  const flyerArrives = useGame((s) => s.flyerArrives);
  const openManager = useGame((s) => s.openManager);
  const [selected, setSelected] = useState<{ table: number; since: number } | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [stat, setStat] = useState<StatId | null>(null);
  const [legend, setLegend] = useState(false);
  const [note, setNote] = useState<{ text: string; at: number } | null>(null);
  const location = useGame((s) => playerOf(s.game).location);
  const moveGuests = useGame((s) => s.moveGuests);
  const weather = useGame((s) => s.openDay?.weather ?? s.game.weather);
  const speed = useGame((s) => s.speed);
  const tick = useGame((s) => s.tick);
  const facts = useHudFacts();
  // The moment today's goal is reached: a little fanfare and a note from Mewa.
  const goalDone = useGame((s) => s.live?.dailyGoal?.done ?? false);
  const goalReward = useGame((s) => s.live?.dailyGoal?.reward ?? 0);
  useEffect(() => {
    if (!goalDone) return;
    play('goal');
    setNote({ text: `🎯 Today’s goal done! Mewa will drop ${money(goalReward)} at the door tonight.`, at: Date.now() });
  }, [goalDone, goalReward]);

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
    if (!note) return;
    const timer = window.setTimeout(() => setNote(null), NOTE_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [note]);

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
  const flyers = !live.closing ? live.flyersLeft : 0;

  return (
    <main className="day-screen">
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
        onStaffTap={hurryStaff}
        onPasserTap={flyers > 0 ? handFlyer : undefined}
        onFlyerArrives={flyerArrives}
        freeTables={choosing && stillThere ? free : []}
        onFreeTableTap={(to) => {
          if (!selected) return;
          const favourite = moveGuests(selected.table, to);
          if (favourite !== null) {
            setNote({
              text: favourite ? '🪑 Their favourite spot! They’re delighted. ⭐' : '🪑 They follow you to their new table.',
              at: Date.now(),
            });
          }
          close();
        }}
      />

      {/* Along the top: the clock, the day's numbers and the money. */}
      <div className="day-top">
        <ClockPanel minute={live.minute} closing={live.closing} />
        <div className="day-stats">
          {(
            [
              ['served', 'served', live.guestsServed],
              ['takings', 'takings', money(live.revenue)],
              ['walkedOut', 'walked out', live.guestsWalkedOut],
              ['turnedAway', 'no table', live.guestsTurnedAway],
            ] as const
          ).map(([id, label, value]) => (
            <Stat key={id} label={label} value={value} open={stat === id} onToggle={() => setStat(stat === id ? null : id)} />
          ))}
          {live.dailyGoal && (
            <Stat
              label="🎯 today’s goal"
              value={goalValue(live.dailyGoal)}
              open={stat === 'goal'}
              onToggle={() => setStat(stat === 'goal' ? null : 'goal')}
            />
          )}
        </div>
        <div className="frame day-money">
          <span aria-label="Cash">
            <Cash facts={facts} />
          </span>
          <span className="day-rating" aria-label="Rating">
            <Rating facts={facts} />
          </span>
        </div>
      </div>

      {/* Short notes under the clock, one under the other, each with its ✕: a gull first, it won't wait. */}
      {!live.moment && (
        <div className="day-notes">
          {live.floor.gull && <GullWarning />}
          {!live.floor.gull && <GullNote />}
          <MewaTip screen="open" />
          <MorningNotes />
          {note && (
            <p key={note.at} className="gull-warning good">
              <span>{note.text}</span>
              <NoteClose onClose={() => setNote(null)} />
            </p>
          )}
          <MomentResultNote />
          <ThemeNightNote minute={live.minute} />
          <RushNote rush={live.floor.rush ?? null} />
          <StreakNote streak={live.floor.streak ?? 0} />
          <PausedNote speed={speed} />
        </div>
      )}

      {/* Along the bottom: the round buttons on the left, sound and speed on the right. */}
      <div className="day-buttons">
        <RoundButton icon="📋" label="Manage" onClick={openManager} />
        <HappyHourButton />
        <RoundButton
          icon="📜"
          label="Flyers"
          detail={`${flyers} left`}
          disabled={flyers === 0}
          onClick={() => setNote({ text: '📜 Tap someone walking past to hand them a flyer.', at: Date.now() })}
        />
        <RoundButton icon="👥" label="Who’s who" expanded={legend} onClick={() => setLegend(!legend)} />
      </div>
      <div className="frame day-controls">
        <MuteButton />
        <SpeedControls />
      </div>

      {legend && <WhoIsWho flyersLeft={flyers} onClose={() => setLegend(false)} />}
      {stat && !live.moment && <StatPanel stat={stat} onClose={() => setStat(null)} />}
      {choosing && stillThere && !live.moment && (
        <div className="help-panel" role="dialog" aria-label="Choose a table">
          <p>
            Tap a free table. <span className="small muted">⭐ marks their favourite spots.</span>
          </p>
          <div className="help-buttons">
            <button type="button" className="secondary" onClick={close} aria-label="Close">
              ✕
            </button>
          </div>
        </div>
      )}
      {stillThere && !choosing && !live.moment && (
        <HelpPanel table={selected!.table} freeTables={free.length} onMove={() => setChoosing(true)} onClose={close} />
      )}
      <MomentCard />
    </main>
  );
}
