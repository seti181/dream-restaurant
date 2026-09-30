// The menu: current dishes with price controls, and the dish creator.

import { useState } from 'react';
import { balance } from '../../data/balance';
import {
  CATEGORY_NAMES,
  DISH_TEMPLATES,
  EXTRA_IDS,
  EXTRAS,
  TEMPLATE_IDS,
  type Category,
  type ExtraId,
  type MenuDish,
  type TemplateId,
} from '../../data/dishes';
import { dishUnavailableReason, extraUnavailableReason, priceRange } from '../../sim/actions';
import { playerOf } from '../../sim/game';
import { ingredientCostOf, tagsOf, templateOf } from '../../sim/menu';
import { money, recipeText } from '../format';
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
  const player = playerOf(game);
  const emptySlots = Math.max(0, game.menuSlots - player.menu.length);

  return (
    <section className="panel-column">
      <h2>
        Your menu <span className="muted">· {player.menu.length} of {game.menuSlots} dishes</span>
      </h2>
      <ul className="dish-list">
        {player.menu.map((dish, index) => (
          <li key={index} className="dish-row">
            <div className="dish-info">
              <strong>{dish.name ?? templateOf(dish).name}</strong>
              <Tags dish={dish} />
              <span className="small muted">{recipeText(dish)}</span>
              <span className="small muted">
                Ingredients {money(ingredientCostOf(dish, player.supplier))} · usually sells for{' '}
                {money(templateOf(dish).referencePrice)}
              </span>
            </div>
            <PriceStepper dish={dish} index={index} />
            <button
              type="button"
              className="icon-button"
              aria-label={`Remove ${dish.name ?? templateOf(dish).name} from the menu`}
              onClick={() => removeDish(index)}
            >
              ✕
            </button>
          </li>
        ))}
        {Array.from({ length: emptySlots }, (_, i) => (
          <li key={`empty-${i}`} className="dish-row empty">
            Empty slot: create a dish on the right
          </li>
        ))}
      </ul>
    </section>
  );
}

function DishCreator() {
  const game = useGame((s) => s.game);
  const addDish = useGame((s) => s.addDish);
  const [template, setTemplate] = useState<TemplateId | null>(null);
  const [variant, setVariant] = useState('');
  const [extras, setExtras] = useState<ExtraId[]>([]);
  const [name, setName] = useState('');

  const chooseTemplate = (id: TemplateId) => {
    setTemplate(id);
    setVariant(DISH_TEMPLATES[id].variants[0].id);
    setExtras([]);
  };
  const toggleExtra = (extra: ExtraId) =>
    setExtras((chosen) => (chosen.includes(extra) ? chosen.filter((e) => e !== extra) : [...chosen, extra]));

  const draft: MenuDish | null = template ? { template, variant, extras, price: 0 } : null;
  const reason = template ? dishUnavailableReason(game, template, variant, extras) : 'Choose a dish first';
  const menuFull = playerOf(game).menu.length >= game.menuSlots;

  const add = () => {
    if (!template) return;
    addDish(template, variant, extras, name);
    setTemplate(null);
    setExtras([]);
    setName('');
  };

  return (
    <section className="panel-column creator">
      <h2>Create a dish</h2>
      {menuFull && <p className="note">Your menu is full. Remove a dish, or get a bigger menu board in the Kitchen.</p>}

      <h3>1 · Choose a dish</h3>
      {CATEGORIES.map((category) => (
        <div key={category} className="picker-group">
          <span className="small muted">{CATEGORY_NAMES[category]}</span>
          <div className="chips">
            {TEMPLATE_IDS.filter((id) => DISH_TEMPLATES[id].category === category).map((id) => {
              const locked = dishUnavailableReason(game, id, DISH_TEMPLATES[id].variants[0].id)?.startsWith('Needs');
              return (
                <button
                  key={id}
                  type="button"
                  className="chip"
                  aria-pressed={template === id}
                  disabled={locked}
                  onClick={() => chooseTemplate(id)}
                >
                  {locked && '🔒 '}
                  {DISH_TEMPLATES[id].name}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {template && draft && (
        <>
          <h3>2 · Recipe</h3>
          <div className="chips">
            {DISH_TEMPLATES[template].variants.map((v) => (
              <button
                key={v.id}
                type="button"
                className="chip"
                aria-pressed={variant === v.id}
                onClick={() => setVariant(v.id)}
              >
                {v.name}
              </button>
            ))}
          </div>

          <h3>
            3 · Extras <span className="muted small">· up to {balance.menu.maxExtras}, try combinations!</span>
          </h3>
          <div className="chips">
            {EXTRA_IDS.filter((extra) => extraUnavailableReason(template, [], extra) === null).map((extra) => (
              <button
                key={extra}
                type="button"
                className="chip"
                aria-pressed={extras.includes(extra)}
                disabled={extraUnavailableReason(template, extras, extra) !== null}
                onClick={() => toggleExtra(extra)}
              >
                {EXTRAS[extra].name} <span className="muted">+{money(EXTRAS[extra].ingredientCost)}</span>
              </button>
            ))}
          </div>

          <h3>
            4 · Name <span className="muted small">· optional</span>
          </h3>
          <input
            className="text-input"
            type="text"
            value={name}
            maxLength={balance.menu.maxNameLength}
            placeholder="e.g. Babcia’s Sunday special"
            onChange={(event) => setName(event.target.value)}
          />

          <div className="creator-summary">
            <div>
              <strong>{name.trim() || recipeText(draft)}</strong>
              <Tags dish={draft} />
              <span className="small muted">
                Ingredients {money(ingredientCostOf(draft, playerOf(game).supplier))} a portion · usually sells for{' '}
                {money(templateOf(draft).referencePrice)}
              </span>
            </div>
            <div className="buy">
              <button type="button" className="primary" disabled={reason !== null} onClick={add}>
                Add to menu
              </button>
              {reason && <span className="small muted">{reason}</span>}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export function MenuPanel() {
  return (
    <div className="two-panels">
      <CurrentMenu />
      <DishCreator />
    </div>
  );
}
