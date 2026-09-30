// The kitchen: equipment, ingredient supplier and the menu board.

import { balance } from '../../data/balance';
import { DISH_TEMPLATES, TEMPLATE_IDS, type EquipmentId } from '../../data/dishes';
import { EQUIPMENT, EQUIPMENT_IDS } from '../../data/equipment';
import { LOCATIONS } from '../../data/locations';
import { equipmentUnavailableReason, menuBoardUnavailableReason } from '../../sim/actions';
import { playerOf } from '../../sim/game';
import type { Supplier } from '../../sim/types';
import { money } from '../format';
import { useGame } from '../store';

/** "Pizza" or "Szarlotka, Sernik and Ice cream": the dishes a machine unlocks. */
function unlocks(id: EquipmentId): string {
  const names = TEMPLATE_IDS.filter((t) => DISH_TEMPLATES[t].equipment === id).map((t) => DISH_TEMPLATES[t].name);
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;
}

const SUPPLIERS: { supplier: Supplier; name: string; description: string }[] = [
  { supplier: 'market', name: 'Market', description: 'Good, honest ingredients at everyday prices.' },
  {
    supplier: 'premium',
    name: 'Premium',
    description: `Finer ingredients: +${balance.supplier.premiumQualityBonus} quality on every dish, but they cost ${balance.supplier.premiumCostMultiplier}× as much.`,
  },
];

export function KitchenPanel() {
  const game = useGame((s) => s.game);
  const buyEquipment = useGame((s) => s.buyEquipment);
  const upgradeMenuBoard = useGame((s) => s.upgradeMenuBoard);
  const setSupplier = useGame((s) => s.setSupplier);
  const player = playerOf(game);
  const slots = LOCATIONS[player.location].equipmentSlots;
  const boardReason = menuBoardUnavailableReason(game);

  return (
    <div className="two-panels">
      <section className="panel-column">
        <h2>
          Equipment <span className="muted">· {player.equipment.length} of {slots} kitchen spaces used</span>
        </h2>
        <div className="shop">
          {EQUIPMENT_IDS.map((id) => {
            const owned = player.equipment.includes(id);
            const reason = equipmentUnavailableReason(game, id);
            return (
              <article key={id} className={`shop-item${owned ? ' owned' : ''}`}>
                <div>
                  <strong>{EQUIPMENT[id].name}</strong>
                  <p className="small muted">{EQUIPMENT[id].description}</p>
                  <p className="small">Unlocks: {unlocks(id)}</p>
                </div>
                {owned ? (
                  <span className="owned-mark">✓ In your kitchen</span>
                ) : (
                  <div className="buy">
                    <button type="button" className="secondary" disabled={reason !== null} onClick={() => buyEquipment(id)}>
                      Buy · {money(EQUIPMENT[id].cost)}
                    </button>
                    {reason && <span className="small muted">{reason}</span>}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel-column">
        <h2>Ingredients</h2>
        <div className="choice-cards">
          {SUPPLIERS.map(({ supplier, name, description }) => (
            <button
              key={supplier}
              type="button"
              className="choice-card"
              aria-pressed={player.supplier === supplier}
              onClick={() => setSupplier(supplier)}
            >
              <strong>{name}</strong>
              <span className="small">{description}</span>
            </button>
          ))}
        </div>

        <h2 className="spaced">Menu board</h2>
        <p>
          Your board has room for <strong>{game.menuSlots} dishes</strong>. A bigger menu tempts more kinds of guests,
          but slows the kitchen a little.
        </p>
        <div className="buy">
          <button type="button" className="secondary" disabled={boardReason !== null} onClick={upgradeMenuBoard}>
            +{balance.menu.slotUpgrade.slots} dishes · {money(balance.menu.slotUpgrade.cost)}
          </button>
          {boardReason && <span className="small muted">{boardReason}</span>}
        </div>
      </section>
    </div>
  );
}
