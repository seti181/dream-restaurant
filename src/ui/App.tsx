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
  return (
    <div className="app">
      <Hud />
      {(phase === 'plan' || (phase === 'open' && managing)) && <PlanScreen />}
      {phase === 'open' && !managing && <DayScreen />}
      {phase === 'dayOver' && <DayOverScreen />}
      {phase === 'ceremony' && <CeremonyScreen />}
      {phase === 'gameOver' && <GameOverScreen />}
      {perfMeterWanted && <PerfMeter />}
    </div>
  );
}
