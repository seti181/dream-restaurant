// The daily report: who came, what they thought, where the money went,
// and how the rest of the Old Town did.

import { useState, type ReactNode } from 'react';
import { GROUP_IDS, GROUPS } from '../data/groups';
import { HAPPENINGS } from '../data/happenings';
import { LOCATIONS } from '../data/locations';
import { RANKS } from '../data/ranks';
import { REGULARS } from '../data/regulars';
import { REPLIES, REPLY_IDS } from '../data/reviews';
import { WEATHER } from '../data/weather';
import { canReply } from '../sim/reviews';
import { dateOf, formatDate } from '../sim/calendar';
import { formatTime } from '../sim/clock';
import { eventsToday, playerOf, type DaySummary } from '../sim/game';
import { recipeKey } from '../sim/menu';
import type { Review, SatisfactionFactors } from '../sim/types';
import { bookingKindOf } from '../sim/bookings';
import { bookingLine } from './plan/BookingsBox';
import { goalProgressText } from './DayScreen';
import { dishName, forecastMiss, money, signedMoney, stars } from './format';
import { Confetti, StarRow } from './Juice';
import { MewaTip } from './Mewa';
import { MewaIcon } from './MewaIcon';
import { WEATHER_ICONS } from './pixel/icons';
import { FoodIcon, PixelIcon } from './PixelIcon';
import { PanoramaScreen } from './Panorama';
import { isFairDay } from '../sim/neptune';
import { useGame } from './store';

type Factor = keyof SatisfactionFactors;

const PRAISE: Record<Factor, string> = {
  quality: 'loved the food',
  value: 'thought the prices were fair',
  wait: 'hardly had to wait',
  ambiance: 'enjoyed the cosy room',
  service: 'praised the service',
};

const COMPLAINT: Record<Factor, string> = {
  quality: 'found the food a bit disappointing',
  value: 'thought it was a bit pricey',
  wait: 'found the wait too long',
  ambiance: 'found the room a bit bare',
  service: 'felt the service was slow',
};

/** Factors closer to zero than this don't stand out enough to mention. */
const NOTICEABLE = 0.1;

/** One sentence built from the day's strongest good and bad points. */
function guestsSaid(feedback: SatisfactionFactors | null): string {
  if (!feedback) return 'No guests today, so nobody had anything to say.';
  const factors = Object.keys(feedback) as Factor[];
  const best = factors.reduce((a, b) => (feedback[b] > feedback[a] ? b : a));
  const worst = factors.reduce((a, b) => (feedback[b] < feedback[a] ? b : a));
  const praise = feedback[best] > NOTICEABLE ? PRAISE[best] : null;
  const complaint = feedback[worst] < -NOTICEABLE ? COMPLAINT[worst] : null;
  if (praise && complaint) return `Guests ${praise}, but ${complaint}.`;
  if (praise) return `Guests ${praise}.`;
  if (complaint) return `Guests ${complaint}.`;
  return 'Guests thought it was fine. Nothing more, nothing less.';
}

/** How a regular's visit went, at a glance. */
const MOOD: Record<DaySummary['regulars'][number]['mood'], string> = { happy: '😊', okay: '🙂', missed: '' };

function headline(summary: DaySummary): string {
  if (summary.profit > 0) return 'A good day! 🎉';
  if (summary.guestsServed > 0) return 'A tough day, but tomorrow is another one.';
  return 'A quiet day.';
}

/** How tomorrow's crowd compares with today's. */
const CROWD: Record<DaySummary['tomorrow']['crowd'], string> = {
  busier: 'Busier than today on',
  same: 'About as busy as today on',
  quieter: 'Quieter than today on',
};

/** The same comparison in a few words, for the teaser at the top. */
const CROWD_SHORT: Record<DaySummary['tomorrow']['crowd'], string> = {
  busier: 'busier than today',
  same: 'about as busy as today',
  quieter: 'quieter than today',
};

/** "You hurried 2 chefs and a waiter. Best quick-service streak: 9 tables in a row (+120 zł in tips)." */
function rushText(rush: DaySummary['rush']): string {
  const people = [
    rush.chefs > 0 ? (rush.chefs === 1 ? 'a chef' : `${rush.chefs} chefs`) : null,
    rush.waiters > 0 ? (rush.waiters === 1 ? 'a waiter' : `${rush.waiters} waiters`) : null,
  ].filter(Boolean);
  const hurried = people.length > 0 ? `In the rush you hurried ${people.join(' and ')}.` : '';
  const tips = rush.tips > 0 ? ` (+${money(rush.tips)} in tips)` : '';
  const streak = rush.bestStreak >= 3 ? `Best quick-service streak: ${rush.bestStreak} tables in a row${tips}.` : '';
  return [hurried, streak].filter(Boolean).join(' ');
}

/** One line near the top of the report, so tomorrow isn't missed: the whole forecast is at the bottom. */
function TomorrowTeaser({ summary }: { summary: DaySummary }) {
  const game = useGame((s) => s.game);
  const { tomorrow } = summary;
  if (game.day !== tomorrow.day) return null;
  const happening = tomorrow.happening && HAPPENINGS[tomorrow.happening];
  const booked = game.bookings.filter((r) => r.accepted && r.day === tomorrow.day).map((r) => bookingKindOf(r).name.toLowerCase());
  return (
    <p className="tomorrow-teaser">
      <PixelIcon art={WEATHER_ICONS[tomorrow.weather]} name={`weather:${tomorrow.weather}`} />{' '}
      <strong>Tomorrow:</strong> {WEATHER[tomorrow.weather].name.toLowerCase()} and {CROWD_SHORT[tomorrow.crowd]}
      {happening && `, and ${happening.short}`}
      {booked.length > 0 && `, with ${booked.join(' and ')} booked`}. <span className="muted">More at the bottom.</span>
    </p>
  );
}

/** The end of the report: what tomorrow brings, so the menu, the special and the team can be planned for it. */
function Tomorrow({ summary }: { summary: DaySummary }) {
  // After closing, the game has already moved on to tomorrow.
  const game = useGame((s) => s.game);
  const { tomorrow } = summary;
  if (game.day !== tomorrow.day) return null;
  const happening = tomorrow.happening && HAPPENINGS[tomorrow.happening];
  const events = eventsToday(game);
  const booked = game.bookings.filter((r) => r.accepted && r.day === tomorrow.day);
  const waiting = game.bookings.filter((r) => !r.accepted).length;
  return (
    <section className="today-news tomorrow">
      <h2>Tomorrow: {formatDate(dateOf(tomorrow.day))}</h2>
      <p>
        <PixelIcon art={WEATHER_ICONS[tomorrow.weather]} name={`weather:${tomorrow.weather}`} />{' '}
        <strong>{WEATHER[tomorrow.weather].name}, says the forecast.</strong> {WEATHER[tomorrow.weather].forecast}
      </p>
      {happening && (
        <p>
          {happening.icon} {happening.text}
        </p>
      )}
      {events.length > 0 && (
        <p>
          🎪 <strong>On tomorrow:</strong> {events.join(' · ')}
        </p>
      )}
      <p>
        👥 {CROWD[tomorrow.crowd]} {LOCATIONS[playerOf(game).location].name}.
      </p>
      {booked.map((request) => (
        <p key={request.id}>
          {bookingKindOf(request).icon} <strong>Booked:</strong> {bookingLine(request)}.
        </p>
      ))}
      {waiting > 0 && (
        <p>
          📬 {waiting === 1 ? 'A booking request is' : `${waiting} booking requests are`} waiting for an answer on the
          Today tab.
        </p>
      )}
      <p className="small muted">The forecast is right most days, but Gdańsk weather has a mind of its own.</p>
    </section>
  );
}

function Row({
  label,
  value,
  total = false,
  icon,
}: {
  label: string;
  value: string | number;
  total?: boolean;
  icon?: ReactNode;
}) {
  return (
    <li className={total ? 'total' : undefined}>
      <span>
        {icon} {label}
      </span>
      <span>{value}</span>
    </li>
  );
}

function Change({ before, after }: { before: number; after: number }) {
  const change = after - before;
  if (Math.abs(change) < 0.05) return <span className="muted">–</span>;
  return (
    <span className={change > 0 ? 'up' : 'down'}>
      {change > 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}
    </span>
  );
}

/** Under an unhappy review: answer it, kindly or otherwise, once. */
function ReplyBox({ review, index }: { review: Review; index: number }) {
  const done = useGame((s) => s.replies[index]);
  const replyToReview = useGame((s) => s.replyToReview);
  const [choosing, setChoosing] = useState(false);
  if (!canReply(review)) return null;
  if (done) {
    return (
      <div className="reply-done">
        <p className="small">💬 You: {REPLIES[done.reply].reply}</p>
        <p className="small">{done.result}</p>
      </div>
    );
  }
  if (!choosing) {
    return (
      <button type="button" className="secondary reply-button" onClick={() => setChoosing(true)}>
        💬 Reply…
      </button>
    );
  }
  return (
    <div className="reply-options">
      {REPLY_IDS.map((id) => (
        <button key={id} type="button" className="secondary" onClick={() => replyToReview(index, id)}>
          {REPLIES[id].label}
          {REPLIES[id].cash !== undefined && ` (${money(-REPLIES[id].cash!)})`}
        </button>
      ))}
    </div>
  );
}

export function DayOverScreen() {
  const summary = useGame((s) => s.summary);
  const planNextDay = useGame((s) => s.planNextDay);
  const saved = useGame((s) => s.saved);
  const gameOver = useGame((s) => s.game.gameOver);
  const specialKey = useGame((s) => playerOf(s.game).special);
  const restaurantName = useGame((s) => playerOf(s.game).name);
  if (!summary) return null;

  return (
    <PanoramaScreen weather={summary.weather} evening fair={isFairDay(summary.day)}>
      <div className="card plan-card">
        <div className="plan-body">
          <MewaTip screen="dayOver" />
          <p className="eyebrow">
            {formatDate(dateOf(summary.day))} · day over
            {summary.events.length > 0 && ` · ${summary.events.join(' · ')}`}
          </p>
          <h1>{headline(summary)}</h1>
          {!gameOver && <TomorrowTeaser summary={summary} />}
          {(summary.goalCompleted || summary.rankUp !== null) && <Confetti />}
          {summary.rankUp !== null && (
            <div className="note goal-complete rank-up">
              <p>
                🏅 <strong>
                  {restaurantName} is {RANKS[summary.rankUp].inSentence} now!
                </strong>
              </p>
              <p className="with-icon">
                <MewaIcon size={32} /> “{RANKS[summary.rankUp].mewa}”
              </p>
              <p className="small">✨ {RANKS[summary.rankUp].unlockText}</p>
            </div>
          )}
          {summary.goalCompleted && (
            <p className="note goal-complete">
              🎉 Goal complete: {summary.goalCompleted.text}! Mewa drops {money(summary.goalCompleted.reward)} at your
              door.
            </p>
          )}
          <p className="said">💬 {guestsSaid(summary.feedback)}</p>
          {summary.forecastSaid && (
            <p className="said small">
              <PixelIcon art={WEATHER_ICONS[summary.weather]} name={`weather:${summary.weather}`} />{' '}
              {forecastMiss(summary.forecastSaid, summary.weather)}
            </p>
          )}
          {summary.regulars.map((visit) => {
            const regular = REGULARS[visit.id];
            return (
              <p key={visit.id} className={visit.friends ? 'said small regular-story friends' : 'said small regular-story'}>
                {regular.emoji} <strong>{regular.name}</strong> {visit.story}
                {visit.note && (
                  <span className="muted">
                    {' '}
                    {MOOD[visit.mood]} {visit.note}
                  </span>
                )}
                {visit.friends && (
                  <strong>
                    {' '}
                    💛 Friends of the house! {GROUPS[regular.group].name} like you more, and more of them have heard of you.
                  </strong>
                )}
              </p>
            );
          })}
          {summary.rivalMove && (
            <p className="said small">
              {summary.rivalMove.icon} <strong>{summary.rivalMove.title}</strong> is over. {summary.rivalMove.result}
            </p>
          )}
          {summary.themeNight && (
            <p className="said small">
              {summary.themeNight.icon} <strong>{summary.themeNight.name}:</strong> {summary.themeNight.guests}{' '}
              {summary.themeNight.guests === 1 ? 'guest' : 'guests'} from 18:00
              {summary.themeNight.wantText !== null && `, and ${summary.themeNight.portions} portions of ${summary.themeNight.wantText}`}.
            </p>
          )}
          {summary.dailyGoal && (
            <p className="said small">
              🎯 <strong>Today’s goal:</strong> {summary.dailyGoal.text}.{' '}
              {summary.dailyGoal.done
                ? `Done! Mewa drops ${money(summary.dailyGoal.reward)} at the door.`
                : `Not this time: ${goalProgressText(summary.dailyGoal, true).replace(/\.$/, '')}.`}
            </p>
          )}
          {summary.starsEarned.map((earned) => (
            <p key={earned.template} className="said small">
              <FoodIcon template={earned.template} /> {earned.text}
            </p>
          ))}
          {summary.bookings.map((booking) => (
            <p key={booking.name} className="said small">
              {booking.icon} <strong>{booking.name}.</strong> {booking.text}
            </p>
          ))}
          {summary.staffNews.map((line) => (
            <p key={line} className="said small">
              🧑‍🍳 {line}
            </p>
          ))}
          {summary.moments.map((moment) => (
            <p key={moment.id} className="said small">
              🃏 <strong>{moment.title}</strong> <span className="muted">({moment.choice})</span> {moment.result}
            </p>
          ))}
          {(summary.help.drinks > 0 || summary.help.apologies > 0) && (
            <p className="said small">
              {summary.help.drinks > 0 &&
                `🥤 ${summary.help.drinks} free ${summary.help.drinks === 1 ? 'drink' : 'drinks'} for waiting tables (${money(-summary.help.cash)}). `}
              {summary.help.apologies > 0 &&
                `👨‍🍳 The chef came out to apologise ${summary.help.apologies === 1 ? 'once' : `${summary.help.apologies} times`}.`}
            </p>
          )}
          {(summary.rush.chefs + summary.rush.waiters > 0 || summary.rush.bestStreak >= 3) && (
            <p className="said small">
              ⚡ {rushText(summary.rush)}
            </p>
          )}
          {summary.seating.moved > 0 && (
            <p className="said small">
              🪑 You showed {summary.seating.moved} {summary.seating.moved === 1 ? 'group' : 'groups'} to a new table
              {summary.seating.favourites > 0 && `, ${summary.seating.favourites} to a favourite spot`}.
            </p>
          )}
          {summary.happyHour && (
            <p className="said small">
              🍹 Happy hour from {formatTime(summary.happyHour.from)} to {formatTime(summary.happyHour.until)}.
            </p>
          )}
          {summary.flyers.handedOut > 0 && (
            <p className="said small">
              📜 You handed out {summary.flyers.handedOut} {summary.flyers.handedOut === 1 ? 'flyer' : 'flyers'}
              {summary.flyers.parties > 0
                ? `, and ${summary.flyers.guests} ${summary.flyers.guests === 1 ? 'guest' : 'guests'} came in because of them.`
                : '. Nobody came in this time, but now they know where you are.'}
            </p>
          )}
          {(summary.gulls.shooed > 0 || summary.gulls.stolen > 0) && (
            <p className="said small">
              <MewaIcon size={24} label="A gull" /> Gulls on the terrace: {summary.gulls.shooed} shooed away
              {summary.gulls.stolen > 0 && `, ${summary.gulls.stolen} ${summary.gulls.stolen === 1 ? 'plate' : 'plates'} stolen`}.
            </p>
          )}
          {summary.pairingComments.slice(0, 3).map(({ comment, happy }) => (
            <p key={comment} className="said small">
              {happy ? '😋' : '🤔'} “{comment}”
            </p>
          ))}

          {summary.reviews.length > 0 && (
            <div className="reviews">
              {summary.reviews.slice(0, 4).map((review, i) => (
                <blockquote key={i} className={review.critic ? 'review critic' : 'review'}>
                  <span className="review-stars">
                    <StarRow stars={review.stars} delay={0.2 + i * 0.3} />
                  </span>
                  <p>“{review.text}”</p>
                  <footer>
                    {review.critic ? '🖋️ ' : '— '}
                    {review.reviewer}
                  </footer>
                  <ReplyBox review={review} index={i} />
                </blockquote>
              ))}
            </div>
          )}

          <div className="report">
            <section>
              <h2>Guests</h2>
              <ul className="rows">
                <Row label="Served" value={summary.guestsServed} />
                <Row label="Walked out (waited too long)" value={summary.guestsWalkedOut} />
                <Row label="Turned away (no free table)" value={summary.guestsTurnedAway} />
                <Row
                  label="Average happiness"
                  value={summary.averageSatisfaction === null ? '–' : `${Math.round(summary.averageSatisfaction)} / 100`}
                />
                <Row label="Rating" value={`${stars(summary.ratingBefore)} → ${stars(summary.ratingAfter)}`} />
              </ul>
              <h2 className="spaced">By group</h2>
              <table className="groups">
                <thead>
                  <tr>
                    <th />
                    <th>Served</th>
                    <th>Lost</th>
                    <th>Reputation</th>
                  </tr>
                </thead>
                <tbody>
                  {GROUP_IDS.map((g) => {
                    const day = summary.groups[g];
                    return (
                      <tr key={g}>
                        <th>{GROUPS[g].name}</th>
                        <td>{day.served}</td>
                        <td>{day.lost}</td>
                        <td>
                          {Math.round(day.reputationAfter)}{' '}
                          <Change before={day.reputationBefore} after={day.reputationAfter} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </section>

            <section>
              <h2>Money</h2>
              <ul className="rows">
                <Row label="Takings" value={money(summary.revenue)} />
                <Row label="Ingredients" value={`−${money(summary.ingredientCost)}`} />
                <Row label="Wages" value={`−${money(summary.wages)}`} />
                {summary.momentsCash !== 0 && (
                  <Row label="Cards and free drinks" value={signedMoney(summary.momentsCash)} />
                )}
                {summary.rush.tips > 0 && <Row label="Quick-service tips" value={signedMoney(summary.rush.tips)} />}
                {summary.rivalMoveCost > 0 && <Row label="Free kompot (price war)" value={`−${money(summary.rivalMoveCost)}`} />}
                {summary.bookingsCash !== 0 && (
                  <Row label="Bookings: tips and orders" value={signedMoney(summary.bookingsCash)} />
                )}
                {summary.rent > 0 && <Row label="Rent for the week" value={`−${money(summary.rent)}`} />}
                {summary.utilities > 0 && <Row label="Utilities" value={`−${money(summary.utilities)}`} />}
                <Row label="Profit" value={signedMoney(summary.profit)} total />
              </ul>
            </section>

            <section>
              <h2>Best sellers</h2>
              {summary.dishesSold.length === 0 ? (
                <p className="muted">Nothing sold today.</p>
              ) : (
                <ul className="rows">
                  {summary.dishesSold.slice(0, 5).map(({ dish, count }) => (
                    <Row
                      key={`${dish.template}/${dish.variant}`}
                      icon={<FoodIcon template={dish.template} />}
                      label={recipeKey(dish) === specialKey ? `⭐ ${dishName(dish)}` : dishName(dish)}
                      value={`× ${count}`}
                    />
                  ))}
                </ul>
              )}
              {summary.lunchSetsSold > 0 && (
                <p className="small">🍲 {summary.lunchSetsSold} lunch sets sold</p>
              )}
              <h2 className="spaced">Around the Old Town</h2>
              <ul className="rows">
                {summary.rivals.map((rival) => (
                  <Row key={rival.id} label={rival.name} value={`${rival.guestsServed} guests`} />
                ))}
              </ul>
            </section>
          </div>
          {!gameOver && <Tomorrow summary={summary} />}
        </div>
        <footer className="plan-footer">
          <span className={saved ? 'save-note' : 'save-note warning'}>
            {saved ? '✓ Progress saved' : 'Couldn’t save this time. Your browser may be blocking storage.'}
          </span>
          <button type="button" className="primary" onClick={planNextDay}>
            {gameOver ? 'Continue' : summary.neptune ? 'To the Golden Neptune ceremony!' : 'Plan tomorrow'}
          </button>
        </footer>
      </div>
    </PanoramaScreen>
  );
}
