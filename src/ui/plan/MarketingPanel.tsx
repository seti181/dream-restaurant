// Marketing: campaigns, how well each group knows you, and the happy hour.

import { balance } from '../../data/balance';
import { GROUP_IDS, GROUPS } from '../../data/groups';
import { CAMPAIGN_IDS, CAMPAIGNS, type CampaignId } from '../../data/marketing';
import { campaignUnavailableReason } from '../../sim/actions';
import { dateOf, formatDate } from '../../sim/calendar';
import { awarenessToday } from '../../sim/game';
import { money } from '../format';
import { useGame } from '../store';
import { ThemeNightBox } from './ThemeNightBox';

function reaches(id: CampaignId): string {
  const groups = GROUP_IDS.filter((g) => CAMPAIGNS[id].boost[g]);
  if (groups.length === GROUP_IDS.length) return 'everyone';
  return groups.map((g) => GROUPS[g].name.toLowerCase()).join(' and ');
}

function duration(id: CampaignId): string {
  const { days } = CAMPAIGNS[id];
  if (days === 'season') return 'rest of the season';
  return days % 7 === 0 ? `${days / 7} week${days === 7 ? '' : 's'}` : `${days} days`;
}

export function MarketingPanel() {
  const game = useGame((s) => s.game);
  const launchCampaign = useGame((s) => s.launchCampaign);
  const today = awarenessToday(game);
  const { minutes, discount } = balance.happyHour;

  return (
    <div className="two-panels even">
      <section className="panel-column">
        <h2>Campaigns</h2>
        <div className="shop">
          {CAMPAIGN_IDS.map((id) => {
            const running = game.campaigns.find((c) => c.id === id && c.untilDay >= game.day);
            const reason = campaignUnavailableReason(game, id);
            return (
              <article key={id} className={`shop-item${running ? ' owned' : ''}`}>
                <div>
                  <strong>{CAMPAIGNS[id].name}</strong>{' '}
                  <span className="muted small">
                    · {duration(id)} · reaches {reaches(id)}
                  </span>
                  <p className="small muted">{CAMPAIGNS[id].description}</p>
                </div>
                {running ? (
                  <span className="owned-mark small">Running until {formatDate(dateOf(running.untilDay))}</span>
                ) : (
                  <div className="buy">
                    <button
                      type="button"
                      className="secondary"
                      disabled={reason !== null}
                      onClick={() => launchCampaign(id)}
                    >
                      {money(CAMPAIGNS[id].cost)}
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
        <ThemeNightBox />

        <h2 className="spaced">Who knows you</h2>
        <p className="small muted">
          People can’t visit a place they’ve never heard of. Campaigns raise this; it slowly fades afterwards.
        </p>
        <table className="groups awareness">
          <tbody>
            {GROUP_IDS.map((g) => (
              <tr key={g}>
                <th>{GROUPS[g].name}</th>
                <td className="bar-cell">
                  <div className="meter" aria-hidden="true">
                    <div style={{ width: `${today[g]}%` }} />
                  </div>
                </td>
                <td>{Math.round(today[g])}%</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2 className="spaced">Happy hour</h2>
        <p className="small">
          🍹 Start a happy hour any time during the day with the button above the restaurant: {minutes} minutes,{' '}
          {Math.round(discount * 100)}% off everything, and a board outside that tempts passers-by. Once a day, so pick
          your moment: a quiet afternoon fills up, a full lunch just earns less.
        </p>
      </section>
    </div>
  );
}
