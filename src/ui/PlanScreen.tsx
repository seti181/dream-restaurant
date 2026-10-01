// Planning: time is paused. Tabs for today's overview, the menu and the staff,
// with the "Open the restaurant" button always at hand.

import type { ReactNode } from 'react';
import { InteriorPanel } from './plan/InteriorPanel';
import { KitchenPanel } from './plan/KitchenPanel';
import { MapPanel } from './plan/MapPanel';
import { MarketingPanel } from './plan/MarketingPanel';
import { MewaPanel } from './plan/MewaPanel';
import { SettingsPanel } from './plan/SettingsPanel';
import { MewaTip } from './Mewa';
import { MewaIcon } from './MewaIcon';
import { MenuPanel } from './plan/MenuPanel';
import { StaffPanel } from './plan/StaffPanel';
import { TodayPanel } from './plan/TodayPanel';
import { useGame, type PlanTab } from './store';

const TABS: { tab: PlanTab; label: ReactNode }[] = [
  { tab: 'today', label: 'Today' },
  { tab: 'menu', label: 'Menu' },
  { tab: 'kitchen', label: 'Kitchen' },
  { tab: 'interior', label: 'Interior' },
  { tab: 'staff', label: 'Staff' },
  { tab: 'marketing', label: 'Marketing' },
  { tab: 'map', label: 'Map' },
  {
    tab: 'mewa',
    label: (
      <span className="with-icon">
        <MewaIcon size={24} /> Mewa
      </span>
    ),
  },
  { tab: 'settings', label: '⚙️ Settings' },
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
          <MewaTip screen="plan" />
          {planTab === 'today' && <TodayPanel />}
          {planTab === 'menu' && <MenuPanel />}
          {planTab === 'kitchen' && <KitchenPanel />}
          {planTab === 'interior' && <InteriorPanel />}
          {planTab === 'staff' && <StaffPanel />}
          {planTab === 'marketing' && <MarketingPanel />}
          {planTab === 'map' && <MapPanel />}
          {planTab === 'mewa' && <MewaPanel />}
          {planTab === 'settings' && <SettingsPanel />}
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
