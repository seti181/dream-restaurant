// A rival's move against the player, on the Today tab: three answers, then how it came out.
// See project.md section 6.15, C9.

import { RIVAL_MOVES } from '../../data/rivalMoves';
import { RIVALS } from '../../data/rivals';
import { dateOf, WEEKDAY_NAMES } from '../../sim/calendar';
import { canAnswer, rivalMoveText } from '../../sim/rivalMoves';
import { useGame } from '../store';

export function RivalMoveCard() {
  const game = useGame((s) => s.game);
  const answer = useGame((s) => s.answerRivalMove);
  const duringDay = useGame((s) => s.phase === 'open');
  const move = game.rivalMove;
  if (!move || game.day < move.day || game.day > move.untilDay) return null;
  const kind = RIVAL_MOVES[move.id];
  const rival = RIVALS[kind.rival];

  return (
    <section className="rival-move">
      <p className="rival-move-from">
        {kind.icon} {rival.name} · {rival.owner}
      </p>
      <h2>{kind.title}</h2>
      <p>{rivalMoveText(move, kind.text)}</p>
      {move.answer === null ? (
        duringDay ? (
          <p className="small muted">You opened without answering, so it’s “{kind.answers[kind.unanswered].label}”.</p>
        ) : (
          <>
            <div className="booking-buttons">
              {kind.answers.map((a, i) => (
                <button key={a.label} type="button" className="secondary" disabled={!canAnswer(game, i)} onClick={() => answer(i)}>
                  {a.label}
                  {a.needs === 'lunchSet' && !canAnswer(game, i) && <span className="small muted"> (no lunch set)</span>}
                </button>
              ))}
            </div>
            <p className="small muted">
              Open without answering and it’s “{kind.answers[kind.unanswered].label}”.
              {kind.days > 1 && ` It lasts until ${WEEKDAY_NAMES[dateOf(move.untilDay).weekday]}.`}
            </p>
          </>
        )
      ) : (
        <p>
          <strong>{kind.answers[move.answer].label}:</strong> {move.result}
          {kind.days > 1 && move.untilDay > game.day && (
            <span className="muted"> Until {WEEKDAY_NAMES[dateOf(move.untilDay).weekday]}.</span>
          )}
        </p>
      )}
    </section>
  );
}
