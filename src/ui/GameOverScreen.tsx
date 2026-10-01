// The end of the road: the money ran out at the end of a day.

import { dateOf, formatDate } from '../sim/calendar';
import { playerOf } from '../sim/game';
import { money } from './format';
import { DIFFICULTIES, LoadSaveCode } from './plan/SettingsPanel';
import { useGame } from './store';
import { PanoramaScreen } from './Panorama';

export function GameOverScreen() {
  const game = useGame((s) => s.game);
  const startNewGame = useGame((s) => s.startNewGame);
  const lastDay = Math.max(0, game.day - 1);

  return (
    <PanoramaScreen weather="sunny" evening fair={false}>
      <div className="card plan-card ceremony">
        <div className="plan-body">
          <p className="eyebrow">{formatDate(dateOf(lastDay))} · closing time</p>
          <div className="trophy" aria-hidden="true">
            🕯️
          </div>
          <h1>{playerOf(game).name} has run out of money</h1>
          <p>
            The cash box is empty ({money(game.cash)}), so the doors close for good after {game.day}{' '}
            {game.day === 1 ? 'day' : 'days'}. Mewa sits on the sign and looks thoughtful. Every great cook has a first
            restaurant that didn’t work out.
          </p>
          {game.trophies > 0 && (
            <p>
              You still have {game.trophies === 1 ? 'a Golden Neptune' : `${game.trophies} Golden Neptunes`} on the
              shelf. 🏆
            </p>
          )}

          <h2 className="spaced">Start again</h2>
          <div className="choice-cards">
            {DIFFICULTIES.map(({ difficulty, name, description }) => (
              <button key={difficulty} type="button" className="choice-card" onClick={() => startNewGame(difficulty)}>
                <strong>New game: {name}</strong>
                <span className="small">{description}</span>
              </button>
            ))}
          </div>

          <h2 className="spaced">Or carry on from a save code</h2>
          <div className="game-over-load">
            <LoadSaveCode confirm={false} />
          </div>
        </div>
      </div>
    </PanoramaScreen>
  );
}
