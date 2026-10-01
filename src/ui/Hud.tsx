// The bar across the top: date, clock, cash, rating and speed controls.

import { WEATHER } from '../data/weather';
import { dateOf, formatDate, seasonWeek } from '../sim/calendar';
import { formatTime } from '../sim/clock';
import { playerOf, starRating } from '../sim/game';
import { money, stars } from './format';
import { setSoundPrefs, useSoundPrefs } from './sound';
import { useGame, type Speed } from './store';

const SPEEDS: { speed: Speed; label: string; name: string }[] = [
  { speed: 0, label: '⏸', name: 'Pause' },
  { speed: 1, label: '1×', name: 'Normal speed' },
  { speed: 2, label: '2×', name: 'Double speed' },
  { speed: 4, label: '4×', name: 'Four times speed' },
];

function SpeedControls() {
  const phase = useGame((s) => s.phase);
  const speed = useGame((s) => s.speed);
  const setSpeed = useGame((s) => s.setSpeed);
  const running = phase === 'open';
  return (
    <div className="speed" role="group" aria-label="Game speed">
      {SPEEDS.map((option) => (
        <button
          key={option.speed}
          type="button"
          aria-label={option.name}
          aria-pressed={running && speed === option.speed}
          disabled={!running}
          onClick={() => setSpeed(option.speed)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

/** Quick mute for everything; music and sounds can be chosen separately in Settings. */
function MuteButton() {
  const { muted } = useSoundPrefs();
  return (
    <button
      type="button"
      className="mute"
      aria-label={muted ? 'Sound off. Tap to turn it on' : 'Sound on. Tap to mute'}
      aria-pressed={muted}
      onClick={() => setSoundPrefs({ muted: !muted })}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}

export function Hud() {
  const game = useGame((s) => s.game);
  const phase = useGame((s) => s.phase);
  const live = useGame((s) => s.live);
  const summary = useGame((s) => s.summary);

  // While the day's results are showing, keep showing that day's date.
  const day = phase === 'dayOver' && summary ? summary.day : game.day;
  const weather = WEATHER[phase === 'dayOver' && summary ? summary.weather : game.weather];
  const cash = game.cash + (live ? live.revenue - live.ingredientCost : 0);

  return (
    <header className="hud">
      <div className="hud-date">
        <strong>{formatDate(dateOf(day))}</strong>
        <span>Week {seasonWeek(day)}</span>
      </div>
      <div className="hud-weather" aria-label="Weather">
        {weather.icon} {weather.name}
      </div>
      {live && <div className="hud-clock">{formatTime(live.minute)}</div>}
      <div className="hud-spacer" />
      <div className="hud-stat" aria-label="Cash">
        💰 {money(cash)}
      </div>
      <div className="hud-stat" aria-label="Rating">
        {stars(starRating(playerOf(game)))}
      </div>
      <MuteButton />
      <SpeedControls />
    </header>
  );
}
