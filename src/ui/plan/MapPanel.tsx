// The Old Town map: the six streets, where the rivals are, and moving house.

import { useState } from 'react';
import { balance } from '../../data/balance';
import { GROUP_IDS, GROUPS } from '../../data/groups';
import { LOCATIONS, type LocationId } from '../../data/locations';
import { RIVALS, type RivalId } from '../../data/rivals';
import { afterMove, relocateUnavailableReason } from '../../sim/actions';
import { playerOf } from '../../sim/game';
import { money } from '../format';
import { OldTownMap } from '../OldTownMap';
import { useGame } from '../store';

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
