// Settings: difficulty, backing up with a save code, and starting afresh.

import { useState } from 'react';
import { balance } from '../../data/balance';
import { exportSaveCode } from '../../save/save';
import type { Difficulty } from '../../sim/game';
import { money } from '../format';
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

function Backup() {
  const game = useGame((s) => s.game);
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
      <LoadSaveCode />
    </section>
  );
}

export function SettingsPanel() {
  const game = useGame((s) => s.game);
  const setDifficulty = useGame((s) => s.setDifficulty);
  const startNewGame = useGame((s) => s.startNewGame);
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>(game.difficulty);

  return (
    <div className="two-panels even">
      <section className="panel-column">
        <h2>Difficulty</h2>
        <p className="small muted">You can change this any time. Rivals change their manner straight away.</p>
        <div className="choice-cards">
          {DIFFICULTIES.map(({ difficulty, name, description }) => (
            <button
              key={difficulty}
              type="button"
              className="choice-card"
              aria-pressed={game.difficulty === difficulty}
              onClick={() => setDifficulty(difficulty)}
            >
              <strong>{name}</strong>
              <span className="small">{description}</span>
            </button>
          ))}
        </div>

        <h2 className="spaced">Start a new game</h2>
        <p className="small muted">Starts again from 1 April. Your current game will be gone, so make a save code first.</p>
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

        <h2 className="spaced">Sound</h2>
        <p className="small muted">Music and sounds arrive in a later update, with a mute switch here.</p>
      </section>
      <Backup />
    </div>
  );
}
