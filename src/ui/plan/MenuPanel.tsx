// The menu: current dishes with price controls, and every dish that could be added.

import { CATEGORY_NAMES, DISH_TEMPLATES, TEMPLATE_IDS, type Category, type MenuDish } from '../../data/dishes';
import { dishUnavailableReason, priceRange } from '../../sim/actions';
import { playerOf } from '../../sim/game';
import { tagsOf, templateOf, variantOf } from '../../sim/menu';
import { money } from '../format';
import { useGame } from '../store';

const CATEGORIES: Category[] = ['soup', 'main', 'dessert', 'drink'];

function Tags({ dish }: { dish: MenuDish }) {
  return (
    <span className="tags">
      {tagsOf(dish).map((tag) => (
        <span key={tag} className="tag">
          {tag}
        </span>
      ))}
    </span>
  );
}

function PriceStepper({ dish, index }: { dish: MenuDish; index: number }) {
  const setDishPrice = useGame((s) => s.setDishPrice);
  const { min, max } = priceRange(dish.template);
  const step = (change: number) => (
    <button
      type="button"
      disabled={dish.price + change < min || dish.price + change > max}
      onClick={() => setDishPrice(index, dish.price + change)}
      aria-label={`${change > 0 ? 'Raise' : 'Lower'} price by ${Math.abs(change)} złoty`}
    >
      {change > 0 ? `+${change}` : `−${-change}`}
    </button>
  );
  return (
    <div className="stepper">
      {step(-5)}
      {step(-1)}
      <output>{money(dish.price)}</output>
      {step(1)}
      {step(5)}
    </div>
  );
}

function CurrentMenu() {
  const game = useGame((s) => s.game);
  const removeDish = useGame((s) => s.removeDish);
  const menu = playerOf(game).menu;
  const emptySlots = Math.max(0, game.menuSlots - menu.length);

  return (
    <section className="panel-column">
      <h2>
        Your menu <span className="muted">· {menu.length} of {game.menuSlots} dishes</span>
      </h2>
      <ul className="dish-list">
        {menu.map((dish, index) => (
          <li key={`${dish.template}-${dish.variant}`} className="dish-row">
            <div className="dish-info">
              <strong>{templateOf(dish).name}</strong> <span className="muted">{variantOf(dish).name}</span>
              <Tags dish={dish} />
              <span className="small muted">
                Ingredients {money(variantOf(dish).ingredientCost)} · usually sells for{' '}
                {money(templateOf(dish).referencePrice)}
              </span>
            </div>
            <PriceStepper dish={dish} index={index} />
            <button
              type="button"
              className="icon-button"
              aria-label={`Remove ${templateOf(dish).name} from the menu`}
              onClick={() => removeDish(index)}
            >
              ✕
            </button>
          </li>
        ))}
        {Array.from({ length: emptySlots }, (_, i) => (
          <li key={`empty-${i}`} className="dish-row empty">
            Empty slot: pick a dish on the right
          </li>
        ))}
      </ul>
    </section>
  );
}

function DishPicker() {
  const game = useGame((s) => s.game);
  const addDish = useGame((s) => s.addDish);
  const menuFull = playerOf(game).menu.length >= game.menuSlots;

  return (
    <section className="panel-column">
      <h2>Add a dish</h2>
      {menuFull && <p className="note">Your menu is full. Remove a dish to make room.</p>}
      {CATEGORIES.map((category) => (
        <div key={category} className="picker-group">
          <h3>{CATEGORY_NAMES[category]}</h3>
          {TEMPLATE_IDS.filter((id) => DISH_TEMPLATES[id].category === category).map((id) => {
            const template = DISH_TEMPLATES[id];
            const missingEquipment = dishUnavailableReason(game, id, template.variants[0].id)?.startsWith('Needs');
            return (
              <div key={id} className={`picker-dish${missingEquipment ? ' locked' : ''}`}>
                <div>
                  <strong>{template.name}</strong>
                  {missingEquipment && (
                    <span className="small muted"> · {dishUnavailableReason(game, id, template.variants[0].id)}</span>
                  )}
                </div>
                <div className="chips">
                  {template.variants.map((variant) => {
                    const reason = dishUnavailableReason(game, id, variant.id);
                    const onMenu = reason === 'Already on your menu';
                    return (
                      <button
                        key={variant.id}
                        type="button"
                        className="chip"
                        disabled={reason !== null}
                        onClick={() => addDish(id, variant.id)}
                      >
                        {onMenu ? '✓ ' : '+ '}
                        {variant.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}

export function MenuPanel() {
  return (
    <div className="two-panels">
      <CurrentMenu />
      <DishPicker />
    </div>
  );
}
