// The daily report: who came, what they thought, where the money went,
// and how the rest of the Old Town did.

import { GROUP_IDS, GROUPS } from '../data/groups';
import { dateOf, formatDate } from '../sim/calendar';
import type { DaySummary } from '../sim/game';
import type { SatisfactionFactors } from '../sim/types';
import { dishName, money, signedMoney, stars } from './format';
import { useGame } from './store';

type Factor = keyof SatisfactionFactors;

const PRAISE: Record<Factor, string> = {
  quality: 'loved the food',
  value: 'thought the prices were fair',
  wait: 'hardly had to wait',
  ambiance: 'enjoyed the cosy room',
  service: 'praised the service',
};

const COMPLAINT: Record<Factor, string> = {
  quality: 'found the food a bit disappointing',
  value: 'thought it was a bit pricey',
  wait: 'found the wait too long',
  ambiance: 'found the room a bit bare',
  service: 'felt the service was slow',
};

/** Factors closer to zero than this don't stand out enough to mention. */
const NOTICEABLE = 0.1;

/** One sentence built from the day's strongest good and bad points. */
function guestsSaid(feedback: SatisfactionFactors | null): string {
  if (!feedback) return 'No guests today, so nobody had anything to say.';
  const factors = Object.keys(feedback) as Factor[];
  const best = factors.reduce((a, b) => (feedback[b] > feedback[a] ? b : a));
  const worst = factors.reduce((a, b) => (feedback[b] < feedback[a] ? b : a));
  const praise = feedback[best] > NOTICEABLE ? PRAISE[best] : null;
  const complaint = feedback[worst] < -NOTICEABLE ? COMPLAINT[worst] : null;
  if (praise && complaint) return `Guests ${praise}, but ${complaint}.`;
  if (praise) return `Guests ${praise}.`;
  if (complaint) return `Guests ${complaint}.`;
  return 'Guests thought it was fine. Nothing more, nothing less.';
}

function headline(summary: DaySummary): string {
  if (summary.profit > 0) return 'A good day! 🎉';
  if (summary.guestsServed > 0) return 'A tough day, but tomorrow is another one.';
  return 'A quiet day.';
}

function Row({ label, value, total = false }: { label: string; value: string | number; total?: boolean }) {
  return (
    <li className={total ? 'total' : undefined}>
      <span>{label}</span>
      <span>{value}</span>
    </li>
  );
}

function Change({ before, after }: { before: number; after: number }) {
  const change = after - before;
  if (Math.abs(change) < 0.05) return <span className="muted">–</span>;
  return (
    <span className={change > 0 ? 'up' : 'down'}>
      {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}
    </span>
  );
}

export function DayOverScreen() {
  const summary = useGame((s) => s.summary);
  const planNextDay = useGame((s) => s.planNextDay);
  const saved = useGame((s) => s.saved);
  if (!summary) return null;

  return (
    <main className="screen">
      <div className="card plan-card">
        <div className="plan-body">
          <p className="eyebrow">{formatDate(dateOf(summary.day))} · day over</p>
          <h1>{headline(summary)}</h1>
          <p className="said">💬 {guestsSaid(summary.feedback)}</p>
          {summary.pairingComments.slice(0, 3).map(({ comment, happy }) => (
            <p key={comment} className="said small">
              {happy ? '😋' : '🤔'} “{comment}”
            </p>
          ))}

          <div className="report">
            <section>
              <h2>Guests</h2>
              <ul className="rows">
                <Row label="Served" value={summary.guestsServed} />
                <Row label="Walked out (waited too long)" value={summary.guestsWalkedOut} />
                <Row label="Turned away (no free table)" value={summary.guestsTurnedAway} />
                <Row
                  label="Average happiness"
                  value={summary.averageSatisfaction === null ? '–' : `${Math.round(summary.averageSatisfaction)} / 100`}
                />
                <Row label="Rating" value={`${stars(summary.ratingBefore)} → ${stars(summary.ratingAfter)}`} />
              </ul>
              <h2 className="spaced">By group</h2>
              <table className="groups">
                <thead>
                  <tr>
                    <th />
                    <th>Served</th>
                    <th>Lost</th>
                    <th>Reputation</th>
                  </tr>
                </thead>
                <tbody>
                  {GROUP_IDS.map((g) => {
                    const day = summary.groups[g];
                    return (
                      <tr key={g}>
                        <th>{GROUPS[g].name}</th>
                        <td>{day.served}</td>
                        <td>{day.lost}</td>
                        <td>
                          {Math.round(day.reputationAfter)}{' '}
                          <Change before={day.reputationBefore} after={day.reputationAfter} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <section>
              <h2>Money</h2>
              <ul className="rows">
                <Row label="Takings" value={money(summary.revenue)} />
                <Row label="Ingredients" value={`−${money(summary.ingredientCost)}`} />
                <Row label="Wages" value={`−${money(summary.wages)}`} />
                {summary.rent > 0 && <Row label="Rent for the week" value={`−${money(summary.rent)}`} />}
                {summary.utilities > 0 && <Row label="Utilities" value={`−${money(summary.utilities)}`} />}
                <Row label="Profit" value={signedMoney(summary.profit)} total />
              </ul>
            </section>

            <section>
              <h2>Best sellers</h2>
              {summary.dishesSold.length === 0 ? (
                <p className="muted">Nothing sold today.</p>
              ) : (
                <ul className="rows">
                  {summary.dishesSold.slice(0, 5).map(({ dish, count }) => (
                    <Row key={`${dish.template}/${dish.variant}`} label={dishName(dish)} value={`× ${count}`} />
                  ))}
                </ul>
              )}
              {summary.lunchSetsSold > 0 && (
                <p className="small">🍲 {summary.lunchSetsSold} lunch sets sold</p>
              )}
              <h2 className="spaced">Around the Old Town</h2>
              <ul className="rows">
                {summary.rivals.map((rival) => (
                  <Row key={rival.id} label={rival.name} value={`${rival.guestsServed} guests`} />
                ))}
              </ul>
            </section>
          </div>
        </div>
        <footer className="plan-footer">
          <span className={saved ? 'save-note' : 'save-note warning'}>
            {saved ? '✓ Progress saved' : 'Couldn’t save this time. Your browser may be blocking storage.'}
          </span>
          <button type="button" className="primary" onClick={planNextDay}>
            Plan tomorrow
          </button>
        </footer>
      </div>
    </main>
  );
}
