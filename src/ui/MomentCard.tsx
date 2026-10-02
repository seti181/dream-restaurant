// A choice card during service: a small moment that stops the clock and asks for an answer.
// See project.md section 6.13.

import { useEffect, useState } from 'react';
import type { MomentResult } from '../sim/moments';
import { useGame } from './store';

/** Real seconds that what an answer did stays on screen, whatever the speed. */
const RESULT_SECONDS = 6;

export function MomentCard() {
  const moment = useGame((s) => s.live?.moment ?? null);
  const answer = useGame((s) => s.answerMoment);
  if (!moment) return null;
  return (
    <div className="moment-backdrop">
      <div className="moment-card" role="dialog" aria-modal="true" aria-labelledby="moment-title">
        {/* Closing the card is the same as the second answer: what a player who doesn't get involved would say. */}
        <button type="button" className="note-close moment-close" aria-label={`Close: ${moment.choices[1]}`} onClick={() => answer(1)}>
          ✕
        </button>
        <h2 id="moment-title">{moment.title}</h2>
        <p>{moment.text}</p>
        <div className="moment-choices">
          <button type="button" className="primary" onClick={() => answer(0)}>
            {moment.choices[0]}
          </button>
          <button type="button" className="secondary" onClick={() => answer(1)}>
            {moment.choices[1]}
          </button>
        </div>
      </div>
    </div>
  );
}

/** The ✕ on the short notes over the restaurant, to close one straight away. */
export function NoteClose({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" className="note-close" aria-label="Close" onClick={onClose}>
      ✕
    </button>
  );
}

/** What the last answer did, for a little while afterwards. */
export function MomentResultNote() {
  const last = useGame((s) => s.live?.lastMoment ?? null);
  const [shownOut, setShownOut] = useState<MomentResult | null>(null);
  useEffect(() => {
    if (!last) return;
    const timer = window.setTimeout(() => setShownOut(last), RESULT_SECONDS * 1000);
    return () => window.clearTimeout(timer);
  }, [last]);
  if (!last || shownOut === last) return null;
  return (
    <p key={last.minute} className="moment-result">
      <span>
        {last.result}
        {last.cash !== 0 && <strong> {last.cash > 0 ? '+' : '−'}{Math.abs(Math.round(last.cash))} zł</strong>}
      </span>
      <NoteClose onClose={() => setShownOut(last)} />
    </p>
  );
}
