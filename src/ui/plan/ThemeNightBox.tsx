// Theme nights on the Marketing tab: pick a theme and an evening this week, once a week.
// See project.md section 6.15, A4.

import { useState } from 'react';
import { GROUPS } from '../../data/groups';
import { THEME_NIGHT_IDS, THEME_NIGHTS, type ThemeNightId } from '../../data/themeNights';
import { themeNightUnavailableReason } from '../../sim/actions';
import { wantMet } from '../../sim/bookings';
import { dateOf, WEEKDAY_NAMES } from '../../sim/calendar';
import { playerOf } from '../../sim/game';
import { weekOf } from '../../sim/themeNights';
import { money } from '../format';
import { useGame } from '../store';

const dayName = (day: number, today: number) => (day === today ? 'Tonight' : WEEKDAY_NAMES[dateOf(day).weekday]);

export function ThemeNightBox() {
  const game = useGame((s) => s.game);
  const book = useGame((s) => s.bookThemeNight);
  const duringDay = useGame((s) => s.phase === 'open');
  const [chosen, setChosen] = useState<ThemeNightId | null>(null);
  const booked = game.themeNight && weekOf(game.themeNight.day) === weekOf(game.day) ? game.themeNight : null;
  const sunday = weekOf(game.day) * 7 + 6;
  const evenings = Array.from({ length: sunday - game.day + 1 }, (_, i) => game.day + i);
  const { menu } = playerOf(game);

  return (
    <section className="theme-nights">
      <h2>Theme night</h2>
      {booked ? (
        <p>
          {THEME_NIGHTS[booked.id].icon} <strong>{THEME_NIGHTS[booked.id].name}</strong>:{' '}
          {booked.day < game.day ? 'done for this week' : `${dayName(booked.day, game.day).toLowerCase()} from 18:00`}. Next
          week, another.
        </p>
      ) : (
        <p className="small muted">Once a week, pick an evening and a theme: from 18:00 it brings in its own crowd.</p>
      )}
      {!booked && (
        <div className="theme-list">
          {THEME_NIGHT_IDS.map((id) => {
            const night = THEME_NIGHTS[id];
            const hasIt = !night.wants || wantMet(menu, night.wants);
            return (
              <button
                key={id}
                type="button"
                className="chip theme-chip"
                aria-pressed={chosen === id}
                onClick={() => setChosen(chosen === id ? null : id)}
              >
                {night.icon} {night.name} · {money(night.cost)}
                {!hasIt && ' ⚠️'}
              </button>
            );
          })}
        </div>
      )}
      {!booked && chosen && (
        <div className="theme-detail">
          <p className="small">
            {THEME_NIGHTS[chosen].text}{' '}
            <span className="muted">
              Brings in {THEME_NIGHTS[chosen].groups.map((g) => GROUPS[g].name.toLowerCase()).join(' and ')}.
            </span>
          </p>
          {THEME_NIGHTS[chosen].wants && !wantMet(menu, THEME_NIGHTS[chosen].wants!) && (
            <p className="small down">
              ⚠️ Nothing on your menu is {THEME_NIGHTS[chosen].wantText}: they’d come, but be disappointed. Add some in the
              dish creator first.
            </p>
          )}
          {duringDay ? (
            <p className="small muted">Book it while planning, before the doors open.</p>
          ) : (
            <div className="booking-buttons">
              {evenings.map((day) => {
                const reason = themeNightUnavailableReason(game, chosen, day);
                return (
                  <button key={day} type="button" className="secondary" disabled={reason !== null} onClick={() => book(chosen, day)}>
                    {dayName(day, game.day)}
                  </button>
                );
              })}
              {themeNightUnavailableReason(game, chosen, game.day) === 'Not enough cash' && (
                <span className="small muted">Not enough cash</span>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
