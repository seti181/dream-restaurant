// Planning: time is paused. Tabs for today's overview, the menu and the staff,
// with the "Open the restaurant" button always at hand.

import { useState } from 'react';
import { Icon } from './Icon';
import type { IconId } from './sketch/icons';
import { NoteClose } from './MomentCard';
import { InteriorPanel } from './plan/InteriorPanel';
import { KitchenPanel } from './plan/KitchenPanel';
import { MapPanel } from './plan/MapPanel';
import { RestaurantPanel } from './plan/RestaurantPanel';
import { MarketingPanel } from './plan/MarketingPanel';
import { MewaPanel } from './plan/MewaPanel';
import { SettingsPanel } from './plan/SettingsPanel';
import { MewaTip } from './Mewa';
import { MenuPanel } from './plan/MenuPanel';
import { StaffPanel } from './plan/StaffPanel';
import { TodayPanel } from './plan/TodayPanel';
import { PanoramaScreen } from './Panorama';
import { isFairDay } from '../sim/neptune';
import { useGame, type PlanTab } from './store';

/** The tabs, each a ribbon bookmark with its drawn icon in the sketchbook look. */
const TABS: { tab: PlanTab; label: string; icon: IconId }[] = [
  { tab: 'today', label: 'Today', icon: 'clipboard' },
  { tab: 'menu', label: 'Menu', icon: 'plate' },
  { tab: 'kitchen', label: 'Kitchen', icon: 'pan' },
  { tab: 'interior', label: 'Interior', icon: 'chair' },
  { tab: 'staff', label: 'Staff', icon: 'chefHat' },
  { tab: 'marketing', label: 'Marketing', icon: 'newspaper' },
  { tab: 'restaurant', label: 'Restaurant', icon: 'candle' },
  { tab: 'map', label: 'Map', icon: 'anchor' },
  { tab: 'mewa', label: 'Mewa', icon: 'mewa' },
  { tab: 'settings', label: 'Settings', icon: 'gear' },
];

/** Tabs that only make sense before opening: the empty restaurant. */
const BEFORE_OPENING_ONLY: PlanTab[] = ['restaurant'];

export function PlanScreen() {
  const planTab = useGame((s) => s.planTab);
  const setPlanTab = useGame((s) => s.setPlanTab);
  const open = useGame((s) => s.open);
  // During the day the same tabs open over the restaurant, with the clock paused.
  const duringDay = useGame((s) => s.phase === 'open' && s.managing);
  const closeManager = useGame((s) => s.closeManager);
  const tabs = duringDay ? TABS.filter(({ tab }) => !BEFORE_OPENING_ONLY.includes(tab)) : TABS;
  const shown = duringDay && BEFORE_OPENING_ONLY.includes(planTab) ? 'menu' : planTab;
  const day = useGame((s) => s.game.day);
  const weather = useGame((s) => s.openDay?.weather ?? s.game.weather);
  const [waitNoteClosed, setWaitNoteClosed] = useState(false);

  return (
    <PanoramaScreen weather={weather} evening={false} fair={isFairDay(day)}>
      <div className="card plan-card notebook">
        <nav className="tabs" aria-label="Planning">
          {tabs.map(({ tab, label, icon }) => (
            <button
              key={tab}
              type="button"
              className="tab"
              aria-pressed={shown === tab}
              onClick={() => setPlanTab(tab)}
            >
              <Icon id={icon} size={26} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        {/* The page under the tabs: the sketchbook look draws it as paper, with the tabs sticking out above. */}
        <div className="plan-page">
          <div className="plan-body">
            {duringDay ? (
              !waitNoteClosed && (
                <p className="note small closable">
                  <span>
                    ⏸ The restaurant waits while you're here. Changes to the menu, prices, the lunch set and the supplier
                    count straight away; purchases, campaigns and new staff arrive tomorrow morning.
                  </span>
                  <NoteClose onClose={() => setWaitNoteClosed(true)} />
                </p>
              )
            ) : (
              <MewaTip screen="plan" />
            )}
            {shown === 'today' && <TodayPanel />}
            {shown === 'menu' && <MenuPanel />}
            {shown === 'kitchen' && <KitchenPanel />}
            {shown === 'interior' && <InteriorPanel />}
            {shown === 'staff' && <StaffPanel />}
            {shown === 'marketing' && <MarketingPanel />}
            {shown === 'restaurant' && <RestaurantPanel />}
            {shown === 'map' && <MapPanel />}
            {shown === 'mewa' && <MewaPanel />}
            {shown === 'settings' && <SettingsPanel />}
          </div>
          <footer className="plan-footer">
            {duringDay ? (
              <button type="button" className="primary" onClick={closeManager}>
                Back to the restaurant
              </button>
            ) : (
              <button type="button" className="primary" onClick={open}>
                Open the restaurant
              </button>
            )}
          </footer>
        </div>
      </div>
    </PanoramaScreen>
  );
}
