// Dziennik Bałtycki's Old Town top five on the Today tab: the whole table on the Monday it comes
// out, and a line on the other days. See project.md section 6.15, B8.

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

export function RankingBox() {
  const game = useGame((s) => s.game);
  const ranking = game.ranking;
  if (!ranking) return null;
  const place = ranking.rows.findIndex((row) => row.id === 'player');

  if (ranking.day !== game.day) {
    return (
      <p className="ranking-line">
        📰 <strong>{capitalise(placeName(place))}</strong> in this week’s Old Town top five
        {ranking.daysToNeptune !== null && ` · ${daysText(ranking.daysToNeptune)} to the Golden Neptune`}.
      </p>
    );
  }

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
            <th>Neptune score</th>
            <th aria-label="Since last week" />
          </tr>
        </thead>
        <tbody>
          {ranking.rows.map((row, i) => (
            <tr key={row.id} className={row.id === 'player' ? 'you' : undefined}>
              <td>{i + 1}.</td>
              <td>{row.name}</td>
              <td>{row.stars.toFixed(1)} ★</td>
              <td>{row.guests.toLocaleString('en-GB')}</td>
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
      </p>
    </section>
  );
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const daysText = (days: number) => (days === 0 ? 'today' : days === 1 ? 'one day' : `${days} days`);
