// Marketing: campaigns, how well each group knows you, and the happy hour.

import { balance } from '../../data/balance';
import { GROUP_IDS, GROUPS } from '../../data/groups';
import { CAMPAIGN_IDS, CAMPAIGNS, type CampaignId } from '../../data/marketing';
import { campaignUnavailableReason } from '../../sim/actions';
import { dateOf, formatDate } from '../../sim/calendar';
import { awarenessToday, playerOf } from '../../sim/game';
import { money } from '../format';
import { useGame } from '../store';

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
  const setHappyHour = useGame((s) => s.setHappyHour);
  const player = playerOf(game);
  const today = awarenessToday(game);
  const { startHour, endHour, discount } = balance.happyHour;

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
        <h2>Who knows you</h2>
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
        <button
          type="button"
          className="choice-card"
          aria-pressed={player.happyHour}
          onClick={() => setHappyHour(!player.happyHour)}
        >
          <strong>{player.happyHour ? '✓ Happy hour is on' : 'Happy hour is off'}</strong>
          <span className="small">
            {Math.round(discount * 100)}% off everything from {startHour}:00 to {endHour}:00. Fills the quiet afternoon,
            especially with students, but you earn less per dish. Tap to turn it {player.happyHour ? 'off' : 'on'}.
          </span>
        </button>
      </section>
    </div>
  );
}
