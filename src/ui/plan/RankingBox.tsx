// Dziennik Bałtycki's Old Town top five (project.md section 6.15, B8): on the Today tab, the whole
// table on the Monday it comes out and a line the other days, with a button to see the table any
// day; and during the day, from the Top five button, with each restaurant's guests so far today.

import { useState } from 'react';
import { placeName, type OldTownRanking } from '../../sim/ranking';
import { useGame } from '../store';

/** ▲2, ▼1 or – since last week; "new" in the first ranking. */
function Movement({ ranking, id, place }: { ranking: OldTownRanking; id: string; place: number }) {
  const was = ranking.before?.[id];
  if (was === undefined) return <span className="muted">–</span>;
  if (was > place) return <span className="up">▲{was - place}</span>;
  if (was < place) return <span className="down">▼{place - was}</span>;
  return <span className="muted">–</span>;
}

/**
 * The top five as a newspaper clipping: this week's table, and with `today` a column of the guests
 * each restaurant has served so far today. Before the first Monday there's no table yet, only today's race.
 */
export function RankingTable({ today }: { today?: Record<string, number> }) {
  const game = useGame((s) => s.game);
  const ranking = game.ranking;
  const names = Object.fromEntries(game.restaurants.map((r) => [r.id, r.name]));
  const todayColumn = today !== undefined;

  if (!ranking)
    return (
      <section className="ranking">
        <p className="ranking-masthead">Dziennik Bałtycki · The Old Town top five</p>
        <p className="small">📰 The first top five comes out next Monday.</p>
        {todayColumn && (
          <table className="ranking-table">
            <thead>
              <tr>
                <th>Restaurant</th>
                <th>Guests today</th>
              </tr>
            </thead>
            <tbody>
              {[...game.restaurants]
                .sort((a, b) => (today[b.id] ?? 0) - (today[a.id] ?? 0))
                .map((r) => (
                  <tr key={r.id} className={r.id === 'player' ? 'you' : undefined}>
                    <td>{r.name}</td>
                    <td>{(today[r.id] ?? 0).toLocaleString('en-GB')}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </section>
    );

  return (
    <section className="ranking">
      <p className="ranking-masthead">Dziennik Bałtycki · The Old Town top five</p>
      <h2>{ranking.headline}</h2>
      {ranking.daysToNeptune !== null && (
        <p className="small">
          🔱 The Fair is on: {daysText(ranking.daysToNeptune)} until the Golden Neptune. This is the race as it stands.
        </p>
      )}
      <table className="ranking-table">
        <thead>
          <tr>
            <th aria-label="Place" />
            <th>Restaurant</th>
            <th>Stars</th>
            <th>Guests last week</th>
            {todayColumn && <th>Today so far</th>}
            <th>Neptune score</th>
            <th aria-label="Since last week" />
          </tr>
        </thead>
        <tbody>
          {ranking.rows.map((row, i) => (
            <tr key={row.id} className={row.id === 'player' ? 'you' : undefined}>
              <td>{i + 1}.</td>
              <td>{names[row.id] ?? row.name}</td>
              <td>{row.stars.toFixed(1)} ★</td>
              <td>{row.guests.toLocaleString('en-GB')}</td>
              {todayColumn && <td>{(today[row.id] ?? 0).toLocaleString('en-GB')}</td>}
              <td>{row.score.toFixed(1)}</td>
              <td>
                <Movement ranking={ranking} id={row.id} place={i} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="small muted">
        The Neptune score: 60% how happy guests have been all season, 40% your share of the Old Town’s guests
        {ranking.daysToNeptune !== null ? ' during the Fair' : ' last week (during the Fair, the Fair’s guests)'}.
        {todayColumn && ' The table comes out every Monday; today’s guests count towards next week’s.'}
      </p>
    </section>
  );
}

/** On the Today tab: the table on the Monday it comes out; the other days a line, and the table on a tap. */
export function RankingBox() {
  const game = useGame((s) => s.game);
  const [open, setOpen] = useState(false);
  const ranking = game.ranking;
  if (!ranking) return null;
  const place = ranking.rows.findIndex((row) => row.id === 'player');

  if (ranking.day !== game.day && !open) {
    return (
      <p className="ranking-line">
        <span>
          📰 <strong>{capitalise(placeName(place))}</strong> in this week’s Old Town top five
          {ranking.daysToNeptune !== null && ` · ${daysText(ranking.daysToNeptune)} to the Golden Neptune`}.
        </span>
        <button type="button" className="secondary" onClick={() => setOpen(true)}>
          See the table
        </button>
      </p>
    );
  }
  return <RankingTable />;
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const daysText = (days: number) => (days === 0 ? 'today' : days === 1 ? 'one day' : `${days} days`);
