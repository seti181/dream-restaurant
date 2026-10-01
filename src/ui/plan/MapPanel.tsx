// The Old Town map: the six streets, where the rivals are, and moving house.
// A simple schematic for now; the illustrated map arrives in M4.

import { useState } from 'react';
import { balance } from '../../data/balance';
import { GROUP_IDS, GROUPS } from '../../data/groups';
import { LOCATION_IDS, LOCATIONS, type LocationId } from '../../data/locations';
import { RIVALS, type RivalId } from '../../data/rivals';
import { afterMove, relocateUnavailableReason } from '../../sim/actions';
import { playerOf } from '../../sim/game';
import { money } from '../format';
import { useGame } from '../store';

/** Map coordinates are metres east and north; SVG's y axis points down, hence the minus. */
const at = (id: LocationId) => ({ x: LOCATIONS[id].mapPosition.x, y: -LOCATIONS[id].mapPosition.y });

const BADGES: Record<RivalId, string> = { nonnaRosa: 'NR', blyskawica: 'BB', karczma: 'KŻ', spichlerz: 'SB' };

function OldTownMap({ selected, onSelect }: { selected: LocationId; onSelect: (id: LocationId) => void }) {
  const game = useGame((s) => s.game);
  const home = playerOf(game).location;
  const rivals = game.restaurants.slice(1);

  return (
    <svg className="old-town-map" viewBox="150 -330 900 540" role="img" aria-label="Map of the Old Town">
      {/* The Motława and the New Motława, with Granary Island between them */}
      <path d="M 880 -330 C 860 -150, 900 0, 870 210" className="river" />
      <path d="M 1040 -330 C 1020 -150, 1060 0, 1030 210" className="river" />
      <text x="915" y="-290" className="map-note">Motława</text>

      {LOCATION_IDS.map((id) => {
        const { x, y } = at(id);
        const here = rivals.filter((r) => r.location === id);
        return (
          <g
            key={id}
            className={`map-spot${id === home ? ' home' : ''}${id === selected ? ' selected' : ''}`}
            onClick={() => onSelect(id)}
            role="button"
            aria-label={LOCATIONS[id].name}
          >
            <circle cx={x} cy={y} r={40} />
            <text x={x} y={y + 9} className="map-icon">
              {id === home ? '🏠' : '•'}
            </text>
            <text x={x} y={y + 68} className="map-label">
              {LOCATIONS[id].name}
            </text>
            {here.map((rival, i) => (
              <g key={rival.id}>
                <rect x={x + 26 + i * 44} y={y - 60} width={40} height={26} rx={8} className="map-badge" />
                <text x={x + 46 + i * 44} y={y - 41} className="map-badge-text">
                  {BADGES[rival.id as RivalId]}
                </text>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

function LocationCard({ id }: { id: LocationId }) {
  const game = useGame((s) => s.game);
  const relocate = useGame((s) => s.relocate);
  const player = playerOf(game);
  const place = LOCATIONS[id];
  const rivalsHere = game.restaurants.slice(1).filter((r) => r.location === id);
  const topGroups = [...GROUP_IDS].sort((a, b) => place.groupMix[b] - place.groupMix[a]).slice(0, 3);
  const reason = relocateUnavailableReason(game, id);
  const moved = afterMove(game, id);
  const tablesLost = player.tables - moved.tables;
  const decorLost = player.decor.length - moved.decor.length;

  return (
    <section className="panel-column">
      <h2>
        {place.name} {id === player.location && <span className="muted">· you are here</span>}
      </h2>
      <p className="small muted">{place.blurb}</p>
      <ul className="rows">
        <li>
          <span>Rent</span>
          <span>{money(place.rentPerDay * 7)} a week</span>
        </li>
        <li>
          <span>Foot traffic</span>
          <span>{place.trafficLabel}</span>
        </li>
        <li>
          <span>Who walks by</span>
          <span>{topGroups.map((g) => `${GROUPS[g].name} ${Math.round(place.groupMix[g] * 100)}%`).join(', ')}</span>
        </li>
        <li>
          <span>Room</span>
          <span>
            {place.maxSeats} seats · {place.terraceSeats} on a terrace
          </span>
        </li>
        <li>
          <span>Kitchen</span>
          <span>{place.equipmentSlots} spaces for equipment</span>
        </li>
        <li>
          <span>Rivals here</span>
          <span>{rivalsHere.length === 0 ? 'None' : rivalsHere.map((r) => RIVALS[r.id as RivalId].name).join(', ')}</span>
        </li>
      </ul>

      {id !== player.location && (
        <div className="move">
          <p className="small">
            Moving costs {money(balance.relocation.fee)}. Your equipment, menu, team and terrace permit come with you. You
            keep about {Math.round(balance.relocation.reputationKept * 100)}% of your reputation
            {decorLost > 0 && `, and ${decorLost} of your decor items stay behind`}
            {tablesLost > 0 && `. ${tablesLost} tables won’t fit the new room`}.
          </p>
          <div className="buy">
            <button type="button" className="primary" disabled={reason !== null} onClick={() => relocate(id)}>
              Move here
            </button>
            {reason && <span className="small muted">{reason}</span>}
          </div>
        </div>
      )}
    </section>
  );
}

export function MapPanel() {
  const game = useGame((s) => s.game);
  const [selected, setSelected] = useState<LocationId>(playerOf(game).location);
  return (
    <div className="two-panels map-panel">
      <OldTownMap selected={selected} onSelect={setSelected} />
      <LocationCard id={selected} />
    </div>
  );
}
