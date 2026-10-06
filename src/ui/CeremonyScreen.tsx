// The Golden Neptune ceremony, after the last day of St. Dominic's Fair.

import { ENDING } from '../data/personal';
import { playerOf } from '../sim/game';
import { Confetti } from './Juice';
import { useGame } from './store';
import { PanoramaScreen } from './Panorama';

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth'];

export function CeremonyScreen() {
  const summary = useGame((s) => s.summary);
  const game = useGame((s) => s.game);
  const carryOn = useGame((s) => s.planNextDay);
  const neptune = summary?.neptune;
  if (!neptune) return null;

  const winner = neptune.scores[0];
  const place = neptune.scores.findIndex((s) => s.id === 'player');
  const best = winner.score;

  return (
    <PanoramaScreen weather="sunny" evening>
      <div className="card plan-card ceremony">
        <div className="plan-body">
          <p className="eyebrow">St. Dominic’s Fair · the Golden Neptune</p>
          {neptune.playerWon ? (
            <>
              <Confetti pieces={60} />
              <div className="trophy trophy-bounce" aria-hidden="true">
                🏆
              </div>
              <h1>The Golden Neptune goes to {playerOf(game).name}!</h1>
              <p className="ending-title">{ENDING.title}</p>
              <p className="ending-message">{ENDING.message}</p>
            </>
          ) : (
            <>
              <h1>{winner.name} takes the Golden Neptune this year</h1>
              <p>
                {playerOf(game).name} came {ORDINALS[place]}. The Fair comes back next summer, and so will you. Mewa
                believes in you. Mostly.
              </p>
            </>
          )}

          <table className="groups neptune-table">
            <thead>
              <tr>
                <th />
                <th>Average rating</th>
                <th>Fair guests</th>
                <th>Neptune score</th>
              </tr>
            </thead>
            <tbody>
              {neptune.scores.map((s) => (
                <tr key={s.id} className={s.id === 'player' ? 'you' : undefined}>
                  <th>{s.name}</th>
                  <td>{Math.round(s.rating)}</td>
                  <td>{Math.round(s.fairShare * 100)}%</td>
                  <td className="bar-cell">
                    <div className="meter" aria-hidden="true">
                      <div style={{ width: `${(s.score / best) * 100}%` }} />
                    </div>
                    {s.score.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="small muted">Neptune score = 60% average rating + 40% share of Old Town guests during the Fair.</p>
        </div>
        <footer className="plan-footer">
          <button type="button" className="primary" onClick={carryOn}>
            Carry on into free play
          </button>
        </footer>
      </div>
    </PanoramaScreen>
  );
}
