import { CeremonyScreen } from './CeremonyScreen';
import { DayOverScreen } from './DayOverScreen';
import { DayScreen } from './DayScreen';
import { GameOverScreen } from './GameOverScreen';
import { Hud } from './Hud';
import { PerfMeter, perfMeterWanted } from './PerfMeter';
import { PlanScreen } from './PlanScreen';
import { useGame } from './store';

export function App() {
  const phase = useGame((s) => s.phase);
  const managing = useGame((s) => s.managing);
  // During the day the restaurant fills the screen, with the clock and the money in its corners.
  const dayScreen = phase === 'open' && !managing;
  return (
    // The sketchbook look (M8): its styles for the screens around the day hang off this class.
    <div className="app sketchbook">
      {!dayScreen && <Hud />}
      {(phase === 'plan' || (phase === 'open' && managing)) && <PlanScreen />}
      {dayScreen && <DayScreen />}
      {phase === 'dayOver' && <DayOverScreen />}
      {phase === 'ceremony' && <CeremonyScreen />}
      {phase === 'gameOver' && <GameOverScreen />}
      {perfMeterWanted && <PerfMeter />}
    </div>
  );
}
