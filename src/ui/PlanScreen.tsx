// Planning: time is paused. Tabs for today's overview, the menu and the staff,
// with the "Open the restaurant" button always at hand.

import { InteriorPanel } from './plan/InteriorPanel';
import { KitchenPanel } from './plan/KitchenPanel';
import { MapPanel } from './plan/MapPanel';
import { MarketingPanel } from './plan/MarketingPanel';
import { MenuPanel } from './plan/MenuPanel';
import { StaffPanel } from './plan/StaffPanel';
import { TodayPanel } from './plan/TodayPanel';
import { useGame, type PlanTab } from './store';

const TABS: { tab: PlanTab; label: string }[] = [
  { tab: 'today', label: 'Today' },
  { tab: 'menu', label: 'Menu' },
  { tab: 'kitchen', label: 'Kitchen' },
  { tab: 'interior', label: 'Interior' },
  { tab: 'staff', label: 'Staff' },
  { tab: 'marketing', label: 'Marketing' },
  { tab: 'map', label: 'Map' },
];

export function PlanScreen() {
  const planTab = useGame((s) => s.planTab);
  const setPlanTab = useGame((s) => s.setPlanTab);
  const open = useGame((s) => s.open);

  return (
    <main className="screen">
      <div className="card plan-card">
        <nav className="tabs" aria-label="Planning">
          {TABS.map(({ tab, label }) => (
            <button
              key={tab}
              type="button"
              className="tab"
              aria-pressed={planTab === tab}
              onClick={() => setPlanTab(tab)}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="plan-body">
          {planTab === 'today' && <TodayPanel />}
          {planTab === 'menu' && <MenuPanel />}
          {planTab === 'kitchen' && <KitchenPanel />}
          {planTab === 'interior' && <InteriorPanel />}
          {planTab === 'staff' && <StaffPanel />}
          {planTab === 'marketing' && <MarketingPanel />}
          {planTab === 'map' && <MapPanel />}
        </div>
        <footer className="plan-footer">
          <button type="button" className="primary" onClick={open}>
            Open the restaurant
          </button>
        </footer>
      </div>
    </main>
  );
}
