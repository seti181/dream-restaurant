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
import { MONTH_NAMES } from '../../sim/calendar';
import { extraCost, extrasOf, freshOn, ingredientCostOf, inSeasonOn, produceName, recipeKey, tagsOf, templateOf } from '../../sim/menu';
import { money, recipeText } from '../format';
import { FoodIcon } from '../PixelIcon';
import { useGame } from '../store';

const CATEGORIES: Category[] = ['soup', 'main', 'dessert', 'drink'];


/** "🌱 fresh until 20 Jul", or "imported" out of season; nothing for things that keep all year. */
function seasonLabel(extra: ExtraId, inSeason: readonly ExtraId[]): string | null {
  const season = EXTRAS[extra].season;
  if (!season) return null;
  if (!inSeason.includes(extra)) return 'imported, dearer';
  const [month, day] = season.until;
  return `🌱 fresh until ${day} ${MONTH_NAMES[month - 1].slice(0, 3)}`;
}

/** What a dish's fresh produce is doing right now: in season, or imported. */
function SeasonNote({ dish, inSeason }: { dish: MenuDish; inSeason: readonly ExtraId[] }) {
  const fresh = freshOn(dish, inSeason);
  const imported = extrasOf(dish).filter((extra) => EXTRAS[extra].season && !inSeason.includes(extra));
  if (fresh.length === 0 && imported.length === 0) return null;
  return (
    <span className="small season-note">
      {fresh.length > 0 && `🌱 Fresh ${fresh.map(produceName).join(' and ')}: tastes better. `}
      {imported.length > 0 && `Imported ${imported.map(produceName).join(' and ')}: out of season, dearer.`}
    </span>
  );
}

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
  const toggleSpecial = useGame((s) => s.toggleSpecial);
  const player = playerOf(game);
  const emptySlots = Math.max(0, game.menuSlots - player.menu.length);
  const inSeason = inSeasonOn(game.day);

  return (
    <section className="panel-column">
      <h2>
        Your menu <span className="muted">· {player.menu.length} of {game.menuSlots} dishes</span>
      </h2>
      <p className="small muted">
        Tap ☆ to put a dish on the board outside as today’s special, “Dziś polecamy”: more guests order it, and it
        tempts people walking by, all the more with something fresh in season.
      </p>
      <ul className="dish-list">
        {player.menu.map((dish, index) => {
          const special = player.special === recipeKey(dish);
          return (
          <li key={index} className={special ? 'dish-row special' : 'dish-row'}>
            <FoodIcon template={dish.template} scale={3} />
            <div className="dish-info">
              {special && <span className="special-label">⭐ Dziś polecamy</span>}
              <strong>{dish.name ?? templateOf(dish).name}</strong>
              <Tags dish={dish} />
              <span className="small muted">{recipeText(dish)}</span>
              <SeasonNote dish={dish} inSeason={inSeason} />
              <span className="small muted">
                Ingredients {money(ingredientCostOf(dish, player.supplier, inSeason))} · usually sells for{' '}
                {money(templateOf(dish).referencePrice)}
              </span>
            </div>
            <PriceStepper dish={dish} index={index} />
            <button
              type="button"
              className="icon-button"
              aria-pressed={special}
              aria-label={special ? 'Take it off the board' : 'Make it today’s special'}
              onClick={() => toggleSpecial(index)}
            >
              {special ? '⭐' : '☆'}
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label={`Remove ${dish.name ?? templateOf(dish).name} from the menu`}
              onClick={() => removeDish(index)}
            >
              ✕
            </button>
          </li>
          );
        })}
        {Array.from({ length: emptySlots }, (_, i) => (
          <li key={`empty-${i}`} className="dish-row empty">
            Empty slot: create a dish on the right
          </li>
        ))}
      </ul>
    </section>
  );
}

/** "Obiad dnia": a soup and a main from the menu at one price, served 12:00–15:00. */
function LunchSetCard() {
  const game = useGame((s) => s.game);
  const setLunchSet = useGame((s) => s.setLunchSet);
  const setLunchSetPrice = useGame((s) => s.setLunchSetPrice);
  const clearLunchSet = useGame((s) => s.clearLunchSet);
  const { menu, lunchSet } = playerOf(game);

  const inCategory = (category: Category) =>
    menu.map((dish, index) => ({ dish, index })).filter(({ dish }) => templateOf(dish).category === category);
  const soups = inCategory('soup');
  const mains = inCategory('main');
  const indexOf = (key: string | undefined) => menu.findIndex((dish) => recipeKey(dish) === key);
  const soupIndex = indexOf(lunchSet?.soup);
  const mainIndex = indexOf(lunchSet?.main);

  // Until both halves are chosen, remember the first pick here.
  const [pending, setPending] = useState<{ soup?: number; main?: number }>({});
  const pick = (part: 'soup' | 'main', index: number) => {
    const next = {
      soup: part === 'soup' ? index : lunchSet ? soupIndex : pending.soup,
      main: part === 'main' ? index : lunchSet ? mainIndex : pending.main,
    };
    if (next.soup !== undefined && next.main !== undefined) {
      setLunchSet(next.soup, next.main);
      setPending({});
    } else {
      setPending(next);
    }
  };
  const chosen = (part: 'soup' | 'main', index: number) =>
    lunchSet ? (part === 'soup' ? soupIndex : mainIndex) === index : pending[part] === index;

  const separately = lunchSet ? menu[soupIndex].price + menu[mainIndex].price : 0;
  const { startHour, endHour } = balance.lunchSet;

  return (
    <div className="lunch-set">
      <h2>
        Obiad dnia <span className="muted">· lunch set, {startHour}:00–{endHour}:00</span>
      </h2>
      <p className="small muted">A soup and a main at one price. Office workers love it.</p>
      {soups.length === 0 || mains.length === 0 ? (
        <p className="note">Put at least one soup and one main on your menu to offer a lunch set.</p>
      ) : (
        <>
          {(['soup', 'main'] as const).map((part) => (
            <div key={part} className="chips">
              {(part === 'soup' ? soups : mains).map(({ dish, index }) => (
                <button
                  key={index}
                  type="button"
                  className="chip"
                  aria-pressed={chosen(part, index)}
                  onClick={() => pick(part, index)}
                >
                  {dish.name ?? templateOf(dish).name}
                </button>
              ))}
            </div>
          ))}
          {lunchSet ? (
            <div className="lunch-set-price">
              <div className="stepper">
                {[-5, -1].map((change) => (
                  <button key={change} type="button" onClick={() => setLunchSetPrice(lunchSet.price + change)}>
                    −{-change}
                  </button>
                ))}
                <output>{money(lunchSet.price)}</output>
                {[1, 5].map((change) => (
                  <button key={change} type="button" onClick={() => setLunchSetPrice(lunchSet.price + change)}>
                    +{change}
                  </button>
                ))}
              </div>
              <span className="small muted">Separately {money(separately)}</span>
              <button type="button" className="secondary" onClick={clearLunchSet}>
                Stop serving
              </button>
            </div>
          ) : (
            <p className="small muted">Pick a soup and a main to start serving it.</p>
          )}
        </>
      )}
    </div>
  );
}

function DishCreator() {
  const game = useGame((s) => s.game);
  const addDish = useGame((s) => s.addDish);
  const [template, setTemplate] = useState<TemplateId | null>(null);
  const [variant, setVariant] = useState('');
  const [extras, setExtras] = useState<ExtraId[]>([]);
  const inSeason = inSeasonOn(game.day);

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
    addDish(template, variant, extras);
    setTemplate(null);
    setExtras([]);
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
            {TEMPLATE_IDS.filter(
              (id) =>
                DISH_TEMPLATES[id].category === category &&
                (!DISH_TEMPLATES[id].secret || game.secretRecipe) &&
                (!DISH_TEMPLATES[id].unlockable || game.unlocks.includes(id)),
            ).map((id) => {
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
                  {locked ? '🔒 ' : <FoodIcon template={id} />}
                  {DISH_TEMPLATES[id].secret && ' ⭐'}
                  {DISH_TEMPLATES[id].unlockable && ' 🇵🇹'} {DISH_TEMPLATES[id].name}
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
                {EXTRAS[extra].name}{' '}
                <span className="muted">
                  +{money(extraCost(extra, inSeason))}
                </span>
                {seasonLabel(extra, inSeason) && (
                  <span className={inSeason.includes(extra) ? 'small season-note' : 'small muted'}> {seasonLabel(extra, inSeason)}</span>
                )}
              </button>
            ))}
          </div>

          <div className="creator-summary">
            <div>
              <strong>{recipeText(draft)}</strong>
              <Tags dish={draft} />
              <span className="small muted">
                Ingredients {money(ingredientCostOf(draft, playerOf(game).supplier, inSeason))} a portion · usually sells for{' '}
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
      <div>
        <CurrentMenu />
        <LunchSetCard />
      </div>
      <DishCreator />
    </div>
  );
}
