// Mewa's corner: the week's goal and the help book.

import { HELP } from '../../data/mewa';
import { GoalCard } from '../Mewa';
import { useGame } from '../store';

export function MewaPanel() {
  const trophies = useGame((s) => s.game.trophies);
  return (
    <div>
      <GoalCard />
      {trophies > 0 && (
        <p className="trophies">
          🏆 Golden Neptunes won: <strong>{trophies}</strong>
        </p>
      )}
      <h2 className="spaced">Mewa’s help book</h2>
      <div className="help-book">
        {HELP.map((entry) => (
          <article key={entry.title} className="help-entry">
            <h3>{entry.title}</h3>
            <p>{entry.text}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
