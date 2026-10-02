// Settings: difficulty, backing up with a save code, and starting afresh.

import { useState } from 'react';
import { balance } from '../../data/balance';
import { exportSaveCode } from '../../save/save';
import type { Difficulty } from '../../sim/game';
import { dateOf, MONTH_NAMES } from '../../sim/calendar';
import { money } from '../format';
import { setSoundPrefs, useSoundPrefs } from '../sound';
import { useGame } from '../store';

export const DIFFICULTIES: { difficulty: Difficulty; name: string; description: string }[] = [
  {
    difficulty: 'relaxed',
    name: 'Relaxed',
    description: `Calmer rivals, and new games start with ${money(balance.difficulty.relaxed.startingCash)}.`,
  },
  {
    difficulty: 'normal',
    name: 'Normal',
    description: `The balanced game. New games start with ${money(balance.difficulty.normal.startingCash)}.`,
  },
];

/** A button that needs a second tap, for things that can't be undone. */
function ConfirmButton({ label, confirmLabel, onConfirm }: { label: string; confirmLabel: string; onConfirm: () => void }) {
  const [asking, setAsking] = useState(false);
  return (
    <button
      type="button"
      className={asking ? 'secondary danger' : 'secondary'}
      onClick={() => {
        if (asking) onConfirm();
        setAsking(!asking);
      }}
      onBlur={() => setAsking(false)}
    >
      {asking ? confirmLabel : label}
    </button>
  );
}

/** Paste a save code to carry on from it. */
export function LoadSaveCode({ confirm = true }: { confirm?: boolean }) {
  const importSave = useGame((s) => s.importSave);
  const [pasted, setPasted] = useState('');
  const [message, setMessage] = useState('');
  const load = () => {
    const ok = importSave(pasted);
    setMessage(ok ? '✓ Loaded! Welcome back.' : 'That doesn’t look like a save code. Check it was copied whole.');
    if (ok) setPasted('');
  };

  return (
    <>
      <textarea
        className="code-box"
        rows={4}
        value={pasted}
        placeholder="Paste a save code here"
        onChange={(e) => {
          setPasted(e.target.value);
          setMessage('');
        }}
      />
      {confirm ? (
        <ConfirmButton label="Load this save" confirmLabel="This replaces your current game. Tap again" onConfirm={load} />
      ) : (
        <button type="button" className="secondary" onClick={load}>
          Load this save
        </button>
      )}
      {message && <p className="small">{message}</p>}
    </>
  );
}

/** During the day, with the tabs open over the restaurant. */
const useDuringDay = () => useGame((s) => s.phase === 'open' && s.managing);

/** Said in place of the things that can only change before opening. */
function BeforeOpeningNote({ what }: { what: string }) {
  return <p className="note small">⏸ {what} before opening, in the morning. The restaurant is open now.</p>;
}

function Backup() {
  const game = useGame((s) => s.game);
  const duringDay = useDuringDay();
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
    } catch {
      setMessage('Couldn’t copy automatically. Select the code and copy it by hand.');
    }
  };

  return (
    <section className="panel-column">
      <h2>Backup</h2>
      <p className="small muted">
        A save code is your whole game as one long line of text. Keep it somewhere safe, for example in a message to
        yourself, and paste it back here to carry on.
        {duringDay && ' Made now, it holds your game as it was this morning.'}
      </p>
      <div className="buy left">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setCode(exportSaveCode(game));
            setCopied(false);
          }}
        >
          Make a save code
        </button>
      </div>
      {code && (
        <>
          <textarea className="code-box" readOnly value={code} rows={4} onFocus={(e) => e.target.select()} />
          <button type="button" className="secondary" onClick={copy}>
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </>
      )}

      {message && <p className="small">{message}</p>}

      <h3 className="spaced">Load a save code</h3>
      {duringDay ? <BeforeOpeningNote what="A save code can be loaded" /> : <LoadSaveCode />}
    </section>
  );
}

function SoundSettings() {
  const prefs = useSoundPrefs();
  const switches: { key: 'music' | 'sound'; name: string }[] = [
    { key: 'music', name: '🎵 Music' },
    { key: 'sound', name: '🔔 Sounds' },
  ];
  return (
    <>
      <h2 className="spaced">Sound</h2>
      <div className="chips">
        {switches.map(({ key, name }) => (
          <button
            key={key}
            type="button"
            className="chip"
            aria-pressed={prefs[key]}
            onClick={() => setSoundPrefs({ [key]: !prefs[key], muted: false })}
          >
            {name}: {prefs[key] ? 'on' : 'off'}
          </button>
        ))}
      </div>
      <p className="small muted">The 🔊 button in the top bar mutes everything at once.</p>
    </>
  );
}

export function SettingsPanel() {
  const game = useGame((s) => s.game);
  const setDifficulty = useGame((s) => s.setDifficulty);
  const startNewGame = useGame((s) => s.startNewGame);
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>(game.difficulty);
  const duringDay = useDuringDay();

  return (
    <div className="two-panels even">
      <section className="panel-column">
        <h2>Difficulty</h2>
        <p className="small muted">You can change this any morning. Rivals change their manner straight away.</p>
        {duringDay && <BeforeOpeningNote what="The difficulty can be changed" />}
        <div className="choice-cards">
          {DIFFICULTIES.map(({ difficulty, name, description }) => (
            <button
              key={difficulty}
              type="button"
              className="choice-card"
              aria-pressed={game.difficulty === difficulty}
              disabled={duringDay}
              onClick={() => setDifficulty(difficulty)}
            >
              <strong>{name}</strong>
              <span className="small">{description}</span>
            </button>
          ))}
        </div>

        <h2 className="spaced">Start a new game</h2>
        <p className="small muted">Starts again from {dateOf(0).dayOfMonth} {MONTH_NAMES[dateOf(0).month - 1]}. Your current game will be gone, so make a save code first.</p>
        {duringDay ? (
          <BeforeOpeningNote what="A new game can be started" />
        ) : (
          <>
            <div className="chips">
              {DIFFICULTIES.map(({ difficulty, name }) => (
                <button
                  key={difficulty}
                  type="button"
                  className="chip"
                  aria-pressed={newDifficulty === difficulty}
                  onClick={() => setNewDifficulty(difficulty)}
                >
                  {name}
                </button>
              ))}
            </div>
            <p />
            <ConfirmButton
              label="Start a new game"
              confirmLabel="Everything starts again. Tap again"
              onConfirm={() => startNewGame(newDifficulty)}
            />
          </>
        )}

        <SoundSettings />
      </section>
      <Backup />
    </div>
  );
}
