// The morning market on the Today tab: today's deal or two, and anything dear.
// See project.md section 6.15, D13.

import { GOODS } from '../../data/market';
import { playerOf } from '../../sim/game';
import { dealHeadline, fromTheMarket, goodOf, marketDeals, marketPrices, priceChangeText } from '../../sim/market';
import { inSeasonOn, specialOf } from '../../sim/menu';
import { dishName } from '../format';
import { useGame } from '../store';

export function MarketBox() {
  const game = useGame((s) => s.game);
  const market = game.market;
  if (!market || market.day !== game.day) return null;
  const player = playerOf(game);
  const prices = marketPrices(market, game.day);
  const inSeason = inSeasonOn(game.day);
  const special = specialOf(player);
  const specialFresh = special !== null && fromTheMarket(special, marketDeals(market, game.day));

  return (
    <section className="market">
      <h2>🧺 The morning market</h2>
      {market.deals.map(({ good, story }) => {
        const onMenu = player.menu.filter((dish) => goodOf(dish) === good);
        return (
          <p key={good}>
            <strong>
              {GOODS[good].icon} {dealHeadline(good, inSeason)}
            </strong>{' '}
            {GOODS[good].dealStories[story]} {priceChangeText(good, prices[good] ?? 1)}{' '}
            <span className="muted">
              {onMenu.length > 0 ? `On your menu: ${onMenu.map(dishName).join(', ')}.` : 'Nothing on your menu is made with it yet.'}
            </span>
          </p>
        );
      })}
      {market.dear && (
        <p>
          {GOODS[market.dear.good].icon} <strong>Dear today:</strong> {GOODS[market.dear.good].dearStories[market.dear.story]}{' '}
          {priceChangeText(market.dear.good, prices[market.dear.good] ?? 1)}
        </p>
      )}
      <p className="muted small">
        {specialFresh
          ? `⭐ Your special, ${dishName(special)}, is fresh from the market today: the board outside tempts more people in.`
          : '⭐ Make a dish with today’s deal the special (☆ on the Menu tab): fresh from the market, the board outside tempts more people in.'}
      </p>
    </section>
  );
}
