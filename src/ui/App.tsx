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
  return (
    <div className="app">
      <Hud />
      {phase === 'plan' && <PlanScreen />}
      {phase === 'open' && <DayScreen />}
      {phase === 'dayOver' && <DayOverScreen />}
      {phase === 'ceremony' && <CeremonyScreen />}
      {phase === 'gameOver' && <GameOverScreen />}
      {perfMeterWanted && <PerfMeter />}
    </div>
  );
}
