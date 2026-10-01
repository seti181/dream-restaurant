// The dining room: seats, the summer terrace and decor.

import { balance } from '../../data/balance';
import { DECOR, DECOR_IDS, DECOR_STYLE_IDS, DECOR_STYLES } from '../../data/decor';
import { GROUPS } from '../../data/groups';
import { LOCATIONS } from '../../data/locations';
import {
  decorUnavailableReason,
  tableUnavailableReason,
  terraceUnavailableReason,
} from '../../sim/actions';
import { dateOf, formatDate, MONTH_NAMES } from '../../sim/calendar';
import { playerOf, terraceOpenOn } from '../../sim/game';
import { decorStyleOf } from '../../sim/interior';
import { money } from '../format';
import { useGame } from '../store';

function SeatsCard() {
  const game = useGame((s) => s.game);
  const buyTable = useGame((s) => s.buyTable);
  const player = playerOf(game);
  const perTable = balance.service.seatsPerTable;
  const reason = tableUnavailableReason(game);
  return (
    <article className="shop-item">
      <div>
        <strong>
          {player.tables * perTable} seats <span className="muted">· {player.tables} tables</span>
        </strong>
        <p className="small muted">
          This room holds up to {LOCATIONS[player.location].maxSeats} seats. Full tables turn guests away.
        </p>
      </div>
      <div className="buy">
        <button type="button" className="secondary" disabled={reason !== null} onClick={buyTable}>
          +1 table · {money(balance.interior.tableCost)}
        </button>
        {reason && <span className="small muted">{reason}</span>}
      </div>
    </article>
  );
}

function TerraceCard() {
  const game = useGame((s) => s.game);
  const buyTerracePermit = useGame((s) => s.buyTerracePermit);
  const player = playerOf(game);
  const { firstMonth, lastMonth, permitCost } = balance.terrace;
  const seats = LOCATIONS[player.location].terraceSeats;
  const reason = terraceUnavailableReason(game);
  const hasPermit = game.terracePermitUntilDay !== null && game.day <= game.terracePermitUntilDay;

  let status = `Open ${MONTH_NAMES[firstMonth - 1]} to ${MONTH_NAMES[lastMonth - 1]} with a permit.`;
  if (hasPermit) {
    const inSeason = dateOf(game.day).month >= firstMonth;
    status = terraceOpenOn(game, game.day)
      ? `Open today! Permit valid until ${formatDate(dateOf(game.terracePermitUntilDay!))}.`
      : inSeason
        ? 'Closed today because of the rain. The tables wait for sunnier weather.'
        : `Permit ready. The terrace opens on 1 ${MONTH_NAMES[firstMonth - 1]}.`;
  }

  return (
    <article className={`shop-item${hasPermit ? ' owned' : ''}`}>
      <div>
        <strong>
          ☀️ Summer terrace <span className="muted">· {seats} seats outside</span>
        </strong>
        <p className="small muted">Tourists love a terrace. {status}</p>
      </div>
      {hasPermit ? (
        <span className="owned-mark">✓ Permit</span>
      ) : (
        <div className="buy">
          <button type="button" className="secondary" disabled={reason !== null} onClick={buyTerracePermit}>
            Permit · {money(permitCost)}
          </button>
          {reason && <span className="small muted">{reason}</span>}
        </div>
      )}
    </article>
  );
}

function DecorShop() {
  const game = useGame((s) => s.game);
  const buyDecor = useGame((s) => s.buyDecor);
  const player = playerOf(game);
  const style = decorStyleOf(player.decor);

  return (
    <section className="panel-column">
      <h2>
        Decor <span className="muted">· ambiance {Math.round(player.ambiance)} / 100</span>
      </h2>
      <div className="meter" aria-hidden="true">
        <div style={{ width: `${player.ambiance}%` }} />
      </div>
      <p className="small">
        {style
          ? `Your style: ${DECOR_STYLES[style].name}. ${DECOR_STYLES[style].favouredBy
              .map((g) => GROUPS[g].name)
              .join(' and ')} feel right at home.`
          : `Buy ${balance.decor.itemsForStyle} items of one style to give the room a style that certain guests love.`}
      </p>
      {DECOR_STYLE_IDS.filter((styleId) =>
        // A style whose items are all still hidden doesn't show yet.
        DECOR_IDS.some((id) => DECOR[id].style === styleId && (!DECOR[id].unlockable || game.unlocks.includes(id))),
      ).map((styleId) => (
        <div key={styleId} className="decor-style">
          <h3>
            {DECOR_STYLES[styleId].name}{' '}
            <span className="muted small">
              · loved by {DECOR_STYLES[styleId].favouredBy.map((g) => GROUPS[g].name.toLowerCase()).join(' and ')}
            </span>
          </h3>
          <p className="small muted">{DECOR_STYLES[styleId].description}</p>
          <div className="shop">
            {DECOR_IDS.filter((id) => DECOR[id].style === styleId).map((id) => {
              const owned = player.decor.includes(id);
              const reason = decorUnavailableReason(game, id);
              return (
                <article key={id} className={`shop-item compact${owned ? ' owned' : ''}`}>
                  <span>
                    {DECOR[id].name} <span className="muted small">· +{DECOR[id].ambiance} ambiance</span>
                  </span>
                  {owned ? (
                    <span className="owned-mark">✓</span>
                  ) : (
                    <button type="button" className="secondary" disabled={reason !== null} onClick={() => buyDecor(id)}>
                      {money(DECOR[id].cost)}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  );
}

export function InteriorPanel() {
  return (
    <div className="two-panels even">
      <section className="panel-column">
        <h2>Seats</h2>
        <div className="shop">
          <SeatsCard />
          <TerraceCard />
        </div>
      </section>
      <DecorShop />
    </div>
  );
}
