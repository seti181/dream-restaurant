// The team and this week's job candidates.

import { useState, type ReactNode } from 'react';
import { balance } from '../../data/balance';
import { COURSES, CUISINE_NAMES, TRAITS } from '../../data/staff';
import { courseCost, courseUnavailableReason, dayOffUnavailableReason } from '../../sim/actions';
import { teamWages } from '../../sim/game';
import { fairWageOf, moodOf, offOn, underpaid, type Mood } from '../../sim/staff';
import type { Employee } from '../../sim/types';
import { Portrait as SketchPortrait } from '../Portrait';
import { money } from '../format';
import { dayOffDay, useGame } from '../store';

const MOODS: Record<Mood, string> = {
  happy: '😊 In good spirits',
  fine: '🙂 Fine',
  tired: '😩 Tired: works a little slower',
  wornOut: '🤒 Worn out: may call in sick',
};

/** How someone feels about the job: a little bar and a word. */
function Morale({ person }: { person: Employee }) {
  const mood = moodOf(person.morale);
  const low = mood === 'tired' || mood === 'wornOut';
  return (
    <span className="morale">
      <span className="morale-bar" aria-hidden="true">
        <span className={low ? 'low' : undefined} style={{ width: `${person.morale}%` }} />
      </span>
      {MOODS[mood]}
    </span>
  );
}

/** "●●●○○" for a level from 1 to 5. */
function Dots({ level }: { level: number }) {
  return (
    <span className="dots" aria-label={`${level} out of 5`}>
      {'●'.repeat(level)}
      <span className="dots-empty">{'○'.repeat(5 - level)}</span>
    </span>
  );
}

/** Someone's face: the same person as in the restaurant, looking as they feel. */
function Portrait({ person, onTeam }: { person: Employee; onTeam: boolean }) {
  return <SketchPortrait kind={person.special ?? person.role} variant={person.look ?? person.id} mood={onTeam ? moodOf(person.morale) : 'fine'} />;
}

function PersonCard({ person, action, onTeam = false }: { person: Employee; action: ReactNode; onTeam?: boolean }) {
  const trait = person.trait ? TRAITS[person.trait] : null;
  return (
    <article className="person">
      <header>
        <Portrait person={person} onTeam={onTeam} />
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
        {onTeam && (
          <>
            <dt>Morale</dt>
            <dd>
              <Morale person={person} />
            </dd>
            <dt>Training</dt>
            <dd className="courses">
              <CourseButton person={person} stat="skill" />
              <CourseButton person={person} stat="speed" />
            </dd>
          </>
        )}
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
        <span className="wage">
          {money(person.wage)} a day
          {onTeam && underpaid(person) && <span className="fair-wage"> · worth {money(fairWageOf(person))}</span>}
        </span>
        <span className="person-actions">
          {onTeam && underpaid(person) && <RaiseButton person={person} />}
          {action}
        </span>
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

function CourseButton({ person, stat }: { person: Employee; stat: 'skill' | 'speed' }) {
  const game = useGame((s) => s.game);
  const open = useGame((s) => s.phase === 'open');
  const toggleCourse = useGame((s) => s.toggleCourse);
  const day = dayOffDay();
  const course = COURSES[person.role][stat];
  const booked = person.course?.day === day && person.course.stat === stat;
  const reason = booked ? null : courseUnavailableReason(game, person.id, stat, day);
  // Only the course they're booked on shows when it's that day; the other one waits.
  if (person.course && !booked) return null;
  return (
    <button
      type="button"
      className={booked ? 'secondary chosen' : 'secondary'}
      disabled={reason !== null}
      onClick={() => toggleCourse(person.id, stat)}
    >
      {booked ? `📚 ${course.name} ${open ? 'tomorrow' : 'today'} ✓` : `📚 ${course.name}`}
      <span className="small">{booked ? 'tap to cancel' : (reason ?? `${money(courseCost(person, stat))} · ${stat} +1`)}</span>
    </button>
  );
}

function RaiseButton({ person }: { person: Employee }) {
  const giveRaise = useGame((s) => s.giveRaise);
  return (
    <button type="button" className="secondary" onClick={() => giveRaise(person.id)}>
      Raise to {money(fairWageOf(person))}
    </button>
  );
}

function DayOffButton({ person }: { person: Employee }) {
  const game = useGame((s) => s.game);
  const open = useGame((s) => s.phase === 'open');
  const toggleDayOff = useGame((s) => s.toggleDayOff);
  const day = dayOffDay();
  const when = open ? 'tomorrow' : 'today';
  const off = offOn(person, day);
  const reason = off ? null : dayOffUnavailableReason(game, person.id, day);
  return (
    <button
      type="button"
      className={off ? 'secondary chosen' : 'secondary'}
      disabled={reason !== null}
      onClick={() => toggleDayOff(person.id)}
    >
      {off ? `🛌 Off ${when} ✓` : reason ?? `Day off ${when}`}
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
        {game.team.length > 0 && (
          <p className="muted small">
            Every day’s work tires people a little; a day off puts them right (+{balance.staff.morale.dayOff} morale). Tired
            people work a little slower, so give days off on quiet days, when someone else can cover. A one-day course makes
            someone a level better, and worth a fair raise.
          </p>
        )}
        <div className="people">
          {game.team.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onTeam
              action={
                <>
                  <DayOffButton person={person} />
                  <GoodbyeButton person={person} />
                </>
              }
            />
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
