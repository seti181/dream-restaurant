// Mewa's corner: the week's goal, the restaurant's rank, the Gdańsk passport and the help book.

import { HELP } from '../../data/mewa';
import { FIND_IDS, FINDS } from '../../data/finds';
import { GoalCard } from '../Mewa';
import { RankCard } from '../RankCard';
import { useGame } from '../store';
import { PassportBook } from './PassportBook';

/** What Mewa has brought so far, on a little shelf. */
function MewasFinds() {
  const found = useGame((s) => s.game.finds?.found ?? []);
  return (
    <section className="mewas-finds">
      <h2>
        🐦 Mewa’s finds{' '}
        <span className="muted">
          · {found.length} of {FIND_IDS.length}
        </span>
      </h2>
      {found.length === 0 ? (
        <p className="small muted">Nothing yet. Mewa flies all over Gdańsk, and now and then she brings something back to the doorstep.</p>
      ) : (
        <ul className="finds-shelf">
          {found.map((id) => (
            <li key={id}>
              <span className="find-icon">{FINDS[id].icon}</span> {FINDS[id].name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function MewaPanel() {
  const trophies = useGame((s) => s.game.trophies);
  return (
    <div>
      <GoalCard />
      <RankCard />
      {trophies > 0 && (
        <p className="trophies">
          🏆 Golden Neptunes won: <strong>{trophies}</strong>
        </p>
      )}
      <MewasFinds />
      <PassportBook />
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
