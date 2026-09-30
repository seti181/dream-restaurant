// The end of the day: a short summary before planning tomorrow.
// The full daily report arrives in the next checklist item.

import { dateOf, formatDate } from '../sim/calendar';
import { money, signedMoney, stars } from './format';
import { useGame } from './store';

function Row({ label, value, total = false }: { label: string; value: string | number; total?: boolean }) {
  return (
    <li className={total ? 'total' : undefined}>
      <span>{label}</span>
      <span>{value}</span>
    </li>
  );
}

export function DayOverScreen() {
  const summary = useGame((s) => s.summary);
  const planNextDay = useGame((s) => s.planNextDay);
  if (!summary) return null;

  const headline =
    summary.profit > 0
      ? 'A good day! 🎉'
      : summary.guestsServed > 0
        ? 'A tough day, but tomorrow is another one.'
        : 'A quiet day.';

  return (
    <main className="screen">
      <div className="card">
        <p className="eyebrow">{formatDate(dateOf(summary.day))} · day over</p>
        <h1>{headline}</h1>

        <div className="columns">
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
        </div>

        <button type="button" className="primary" onClick={planNextDay}>
          Plan tomorrow
        </button>
      </div>
    </main>
  );
}
