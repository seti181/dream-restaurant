// The bar across the top: date, clock, cash, rating and speed controls. During the day the same
// things sit in small panels in the corners of the day screen instead (see DayScreen).

import { WEATHER } from '../data/weather';
import { dateOf, formatDate, seasonWeek } from '../sim/calendar';
import { formatTime } from '../sim/clock';
import { playerRating } from '../sim/game';
import { money } from './format';
import { COIN, STAR, WEATHER_ICONS } from './pixel/icons';
import { PixelIcon } from './PixelIcon';
import { setSoundPrefs, useSoundPrefs } from './sound';
import { useGame, type Speed } from './store';

const SPEEDS: { speed: Speed; label: string; name: string }[] = [
  { speed: 0, label: '⏸', name: 'Pause' },
  { speed: 1, label: '1×', name: 'Normal speed' },
  { speed: 2, label: '2×', name: 'Double speed' },
  { speed: 4, label: '4×', name: 'Four times speed' },
];

export function SpeedControls() {
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
export function MuteButton() {
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

/** The date, weather, cash and rating, as the top bar and the day screen's corners show them. */
export function useHudFacts() {
  const game = useGame((s) => s.game);
  const phase = useGame((s) => s.phase);
  const live = useGame((s) => s.live);
  const summary = useGame((s) => s.summary);
  // Once the doors are open, the real weather (the forecast can be wrong).
  const openWeather = useGame((s) => s.openDay?.weather);

  // While the day's results are showing, keep showing that day's date.
  const day = phase === 'dayOver' && summary ? summary.day : game.day;
  const weatherId = phase === 'dayOver' && summary ? summary.weather : (openWeather ?? game.weather);
  return {
    date: formatDate(dateOf(day)),
    week: seasonWeek(day),
    weatherId,
    weather: WEATHER[weatherId],
    cash: game.cash + (live ? live.revenue - live.ingredientCost : 0),
    rating: playerRating(game),
  };
}

/** The weather, with its pixel icon. */
export function WeatherName({ facts }: { facts: ReturnType<typeof useHudFacts> }) {
  return (
    <>
      <PixelIcon art={WEATHER_ICONS[facts.weatherId]} name={`weather:${facts.weatherId}`} /> {facts.weather.name}
    </>
  );
}

/** Cash, with its coin. */
export function Cash({ facts }: { facts: ReturnType<typeof useHudFacts> }) {
  return (
    <>
      <PixelIcon art={COIN} name="coin" /> {money(facts.cash)}
    </>
  );
}

/** The star rating, with its star. */
export function Rating({ facts }: { facts: ReturnType<typeof useHudFacts> }) {
  return (
    <>
      {facts.rating.toFixed(1)} <PixelIcon art={STAR} name="star" label="stars" />
    </>
  );
}

export function Hud() {
  const live = useGame((s) => s.live);
  const facts = useHudFacts();

  return (
    <header className="hud">
      <div className="hud-date">
        <strong>{facts.date}</strong>
        <span>Week {facts.week}</span>
      </div>
      <div className="hud-weather" aria-label="Weather">
        <WeatherName facts={facts} />
      </div>
      {live && <div className="hud-clock">{formatTime(live.minute)}</div>}
      <div className="hud-spacer" />
      <div className="hud-stat" aria-label="Cash">
        <Cash facts={facts} />
      </div>
      <div className="hud-stat" aria-label="Rating">
        <Rating facts={facts} />
      </div>
      <MuteButton />
      <SpeedControls />
    </header>
  );
}
