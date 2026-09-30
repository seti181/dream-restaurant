// The team and this week's job candidates.

import { useState, type ReactNode } from 'react';
import { CUISINE_NAMES, TRAITS } from '../../data/staff';
import { teamWages } from '../../sim/game';
import type { Employee } from '../../sim/types';
import { money } from '../format';
import { useGame } from '../store';

/** "●●●○○" for a level from 1 to 5. */
function Dots({ level }: { level: number }) {
  return (
    <span className="dots" aria-label={`${level} out of 5`}>
      {'●'.repeat(level)}
      <span className="dots-empty">{'○'.repeat(5 - level)}</span>
    </span>
  );
}

function PersonCard({ person, action }: { person: Employee; action: ReactNode }) {
  const trait = person.trait ? TRAITS[person.trait] : null;
  return (
    <article className="person">
      <header>
        <strong>{person.name}</strong>
        <span className="role">
          {person.role === 'chef' ? '🧑‍🍳 Chef' : '🍽️ Waiter'}
          {person.specialty && ` · ${CUISINE_NAMES[person.specialty]} cuisine`}
        </span>
      </header>
      <dl className="person-stats">
        <dt>Skill</dt>
        <dd>
          <Dots level={person.skill} />
        </dd>
        <dt>Speed</dt>
        <dd>
          <Dots level={person.speed} />
        </dd>
        {trait && (
          <>
            <dt>Trait</dt>
            <dd>
              <strong>{trait.name}</strong> <span className="muted small">· {trait.description}</span>
            </dd>
          </>
        )}
      </dl>
      <p className="bio">“{person.bio}”</p>
      <footer>
        <span className="wage">{money(person.wage)} a day</span>
        {action}
      </footer>
    </article>
  );
}

function GoodbyeButton({ person }: { person: Employee }) {
  const letGo = useGame((s) => s.letGo);
  const [confirming, setConfirming] = useState(false);
  return (
    <button
      type="button"
      className={confirming ? 'secondary danger' : 'secondary'}
      onClick={() => (confirming ? letGo(person.id) : setConfirming(true))}
      onBlur={() => setConfirming(false)}
    >
      {confirming ? 'Tap again to say goodbye' : 'Say goodbye'}
    </button>
  );
}

export function StaffPanel() {
  const game = useGame((s) => s.game);
  const hire = useGame((s) => s.hire);

  return (
    <div className="two-panels even">
      <section className="panel-column">
        <h2>
          Your team <span className="muted">· {money(teamWages(game))} a day in wages</span>
        </h2>
        {game.team.length === 0 && <p className="note warning">Nobody works here yet. Hire someone on the right!</p>}
        <div className="people">
          {game.team.map((person) => (
            <PersonCard key={person.id} person={person} action={<GoodbyeButton person={person} />} />
          ))}
        </div>
      </section>
      <section className="panel-column">
        <h2>
          Looking for work <span className="muted">· new faces every Monday</span>
        </h2>
        {game.candidates.length === 0 && <p className="note">You’ve met everyone this week. More will come on Monday.</p>}
        <div className="people">
          {game.candidates.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              action={
                <button type="button" className="secondary" onClick={() => hire(person.id)}>
                  Hire
                </button>
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}
