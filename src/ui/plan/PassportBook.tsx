// The sticker album, "Gdańsk passport", in the Mewa tab: a round inked stamp for everything done so far,
// and a faint dashed ring with a hint for what's still to do. See project.md section 6.14.

import { STAMP_GROUPS, STAMP_IDS, STAMPS, type StampId } from '../../data/passport';
import { dateOf, MONTH_NAMES } from '../../sim/calendar';
import { useGame } from '../store';

/** "8 Jul" */
function shortDate(day: number): string {
  const { month, dayOfMonth } = dateOf(day);
  return `${dayOfMonth} ${MONTH_NAMES[month - 1].slice(0, 3)}`;
}

/** Each stamp sits a little crooked, the same way every time. */
const tilt = (id: StampId) => ((STAMP_IDS.indexOf(id) * 37) % 13) - 6;

function StampSpot({ id, day }: { id: StampId; day: number | undefined }) {
  const stamp = STAMPS[id];
  if (day === undefined) {
    return (
      <li className="stamp empty" title={stamp.hint}>
        <span className="stamp-ring">?</span>
        <span className="stamp-name">{stamp.name}</span>
        <span className="stamp-text">{stamp.hint}</span>
      </li>
    );
  }
  return (
    <li className={`stamp ink-${stamp.colour}`}>
      <span className="stamp-ring" style={{ transform: `rotate(${tilt(id)}deg)` }}>
        <span className="stamp-icon">{stamp.icon}</span>
        <span className="stamp-date">{shortDate(day)}</span>
      </span>
      <span className="stamp-name">{stamp.name}</span>
      <span className="stamp-text">{stamp.text}</span>
    </li>
  );
}

export function PassportBook() {
  const stamps = useGame((s) => s.game.passport?.stamps ?? {});
  const count = STAMP_IDS.filter((id) => stamps[id] !== undefined).length;
  return (
    <section className="passport">
      <h2>
        📖 Your Gdańsk passport{' '}
        <span className="muted">
          · {count} of {STAMP_IDS.length} stamps
        </span>
      </h2>
      {STAMP_GROUPS.map((group) => (
        <div key={group} className="passport-group">
          <h3>{group}</h3>
          <ul className="stamps">
            {STAMP_IDS.filter((id) => STAMPS[id].group === group).map((id) => (
              <StampSpot key={id} id={id} day={stamps[id]} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}
