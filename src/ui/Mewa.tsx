// Mewa the seagull: tutorial tips in a speech bubble, and the week's goal.

import { useEffect } from 'react';
import { TIP_IDS, TIPS } from '../data/mewa';
import { goalOf, goalProgress, goalText } from '../sim/goals';
import { money } from './format';
import { MewaIcon } from './MewaIcon';
import { play } from './sound';
import { useGame } from './store';

/** Mewa's tip for this screen today, if there is one she hasn't given yet. */
export function MewaTip({ screen }: { screen: 'plan' | 'open' | 'dayOver' }) {
  const game = useGame((s) => s.game);
  const summary = useGame((s) => s.summary);
  const dismissTip = useGame((s) => s.dismissTip);
  const skipTips = useGame((s) => s.skipTips);

  // On the report, it's still the day that just ended.
  const day = screen === 'dayOver' && summary ? summary.day : game.day;
  const tip = game.mewa.tipsOff
    ? undefined
    : TIP_IDS.find((id) => TIPS[id].screen === screen && TIPS[id].day === day && !game.mewa.seenTips.includes(id));
  // Mewa announces herself.
  useEffect(() => {
    if (tip) play('seagull');
  }, [tip]);
  if (!tip) return null;

  return (
    <aside className="mewa" aria-label="Mewa says">
      <span className="mewa-face" aria-hidden="true">
        <MewaIcon size={64} />
      </span>
      <div className="mewa-bubble">
        <p>{TIPS[tip].text}</p>
        <div className="mewa-buttons">
          <button type="button" className="secondary" onClick={() => dismissTip(tip)}>
            Got it
          </button>
          <button type="button" className="link-button" onClick={skipTips}>
            Skip all tips
          </button>
        </div>
      </div>
    </aside>
  );
}

/** This week's goal from Mewa, with progress. */
export function GoalCard() {
  const game = useGame((s) => s.game);
  const goal = goalOf(game.goal);
  const progress = goalProgress(game.goal);
  const share = Math.max(0, Math.min(1, progress / goal.target));
  const shown = goal.kind === 'happiness' ? Math.round(progress) : Math.floor(progress).toLocaleString('en-GB');

  return (
    <section className={`goal-card${game.goal.done ? ' done' : ''}`}>
      <h2 className="with-icon">
        <MewaIcon size={32} /> Mewa’s goal this week
      </h2>
      <p>
        <strong>{goalText(goal)}</strong> <span className="muted">· reward {money(goal.reward)}</span>
      </p>
      {game.goal.done ? (
        <p className="goal-done">✓ Done! Mewa dropped the reward at your door.</p>
      ) : (
        <>
          <div className="meter" aria-hidden="true">
            <div style={{ width: `${share * 100}%` }} />
          </div>
          <p className="small muted">
            {shown} of {goal.target.toLocaleString('en-GB')}
          </p>
        </>
      )}
    </section>
  );
}
