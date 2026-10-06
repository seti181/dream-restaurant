// The Old Town map: the six streets, where the rivals are, having a look, and moving house.

import { useMemo, useState } from 'react';
import { balance } from '../../data/balance';
import { GROUP_IDS, GROUPS } from '../../data/groups';
import { LOCATIONS, type LocationId } from '../../data/locations';
import { RIVALS, type RivalId } from '../../data/rivals';
import { afterMove, relocateUnavailableReason } from '../../sim/actions';
import { playerOf } from '../../sim/game';
import { previewOf } from '../../sim/preview';
import { money } from '../format';
import { NoteClose } from '../MomentCard';
import { OldTownMap } from '../OldTownMap';
import { PixelRestaurantView } from '../PixelRestaurantView';
import { SketchRoomView, sketchWanted } from '../SketchRoomView';
import { useGame } from '../store';

/** Mid-morning, before the doors open. */
const BEFORE_OPENING = 10 * 60 + 30;

/** The restaurant on a street, drawn over the map: yours, a rival's, or yours if you moved there. */
function StreetPreviewDialog({ id, onClose }: { id: LocationId; onClose: () => void }) {
  const game = useGame((s) => s.game);
  const preview = useMemo(() => previewOf(game, id), [game, id]);
  const place = LOCATIONS[id];
  const lines = {
    yours: 'Your restaurant, as it is this morning.',
    rival: 'A rival’s restaurant. Have a peek at the competition!',
    moved: 'Your restaurant if you moved here: your tables, and the decor that comes along.',
  };
  return (
    <div className="preview-backdrop" role="dialog" aria-modal="true" aria-label={`${preview.name} on ${place.name}`}>
      <div className="preview-card">
        <header>
          <div>
            <h2>
              {preview.name} <span className="muted">· {place.name}</span>
            </h2>
            <p className="small muted">{lines[preview.whose]}</p>
          </div>
          <NoteClose onClose={onClose} />
        </header>
        <div className="preview-view">
          {sketchWanted ? (
            <SketchRoomView floor={preview.floor} weather={game.weather} minute={BEFORE_OPENING} />
          ) : (
            <PixelRestaurantView floor={preview.floor} weather={game.weather} minute={BEFORE_OPENING} />
          )}
        </div>
      </div>
    </div>
  );
}

function LocationCard({ id }: { id: LocationId }) {
  const game = useGame((s) => s.game);
  const relocate = useGame((s) => s.relocate);
  const player = playerOf(game);
  const place = LOCATIONS[id];
  const rivalsHere = game.restaurants.slice(1).filter((r) => r.location === id);
  const topGroups = [...GROUP_IDS].sort((a, b) => place.groupMix[b] - place.groupMix[a]).slice(0, 3);
  // Moving happens before opening; during the day the button says so instead of doing nothing.
  const duringDay = useGame((s) => s.phase === 'open' && s.managing);
  const reason = duringDay ? 'You can move before opening, in the morning' : relocateUnavailableReason(game, id);
  const moved = afterMove(game, id);
  const tablesLost = player.tables - moved.tables;
  const decorLost = player.decor.length - moved.decor.length;
  const [looking, setLooking] = useState(false);

  return (
    <section className="panel-column">
      <h2>
        {place.name} {id === player.location && <span className="muted">· you are here</span>}
      </h2>
      <p className="small muted">{place.blurb}</p>
      <button type="button" className="secondary look-button" onClick={() => setLooking(true)}>
        👀 Have a look
      </button>
      {looking && <StreetPreviewDialog id={id} onClose={() => setLooking(false)} />}
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
      {rivalsHere.map((r) => {
        const rival = RIVALS[r.id as RivalId];
        return (
          <p key={r.id} className="small rival-note">
            <strong>{rival.owner}</strong> runs {rival.name}. {rival.personality}
          </p>
        );
      })}

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
