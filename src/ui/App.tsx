import { DayOverScreen } from './DayOverScreen';
import { DayScreen } from './DayScreen';
import { Hud } from './Hud';
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
    </div>
  );
}
