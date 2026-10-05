// Booking requests on the Today tab: new ones to accept or decline, and the ones accepted.
// See project.md section 6.15, A2.

import type { BookingKind } from '../../data/bookings';
import { bookingKindOf, wantMet, type BookingRequest } from '../../sim/bookings';
import { dateOf, formatDate, WEEKDAY_NAMES } from '../../sim/calendar';
import { formatTime } from '../../sim/clock';
import { playerOf } from '../../sim/game';
import { money } from '../format';
import { useGame } from '../store';

/** "Today", "Tomorrow" or "Saturday 20 July". */
export function bookingDay(day: number, today: number): string {
  if (day === today) return 'Today';
  if (day === today + 1) return 'Tomorrow';
  return formatDate(dateOf(day));
}

/** "a wedding party of 14 at 17:00" or "25 lunches for an office, ready at 12:30". */
export function bookingLine(request: BookingRequest): string {
  const kind = bookingKindOf(request);
  const time = formatTime(kind.minute);
  return kind.kind === 'table'
    ? `${kind.name.charAt(0).toLowerCase()}${kind.name.slice(1)} of ${request.size} at ${time}`
    : `${request.size} ${kind.portionName} at ${money(kind.pricePerPortion)} each, ready at ${time}`;
}

/** What it asks of the menu, and whether today's menu has it. */
function menuCheck(kind: BookingKind, hasIt: boolean): string {
  if (kind.kind === 'table') return `${hasIt ? '✓' : '✗'} ${capitalise(kind.wishText)}${hasIt ? ': on your menu.' : ': not on your menu yet.'}`;
  return hasIt
    ? '✓ Your menu has something for it. One chef will be busy cooking before it’s due.'
    : `✗ Nothing on your menu is right for ${kind.portionName} yet. Without it, the order falls through.`;
}

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export function BookingsBox() {
  const game = useGame((s) => s.game);
  const accept = useGame((s) => s.acceptBooking);
  const decline = useGame((s) => s.declineBooking);
  const { menu } = playerOf(game);
  const offered = game.bookings.filter((r) => !r.accepted).sort((a, b) => a.day - b.day);
  const accepted = game.bookings.filter((r) => r.accepted).sort((a, b) => a.day - b.day);

  return (
    <section className="bookings">
      <h2>Bookings</h2>
      {game.bookings.length === 0 && (
        <p className="muted small">No bookings yet. Requests come in a few times a week, a day or three ahead.</p>
      )}
      {offered.map((request) => {
        const kind = bookingKindOf(request);
        const hasIt = wantMet(menu, kind.kind === 'table' ? kind.wish : kind.needs);
        return (
          <div key={request.id} className="booking-request">
            <p>
              <strong>
                {kind.icon} {bookingDay(request.day, game.day)}: {bookingLine(request)}
              </strong>
            </p>
            <p>{request.text}</p>
            <p className={hasIt ? 'small up' : 'small down'}>{menuCheck(kind, hasIt)}</p>
            {kind.kind === 'order' && (
              <p className="small muted">They pay {money(request.size * kind.pricePerPortion)}, and you pay the ingredients.</p>
            )}
            {kind.kind === 'table' && (
              <p className="small muted">
                Their tables are kept free for a while before they come. Make them happy and they leave a tip.
              </p>
            )}
            <div className="booking-buttons">
              <button type="button" className="secondary" onClick={() => accept(request.id)}>
                Accept
              </button>
              <button type="button" className="secondary quiet" onClick={() => decline(request.id)}>
                Decline
              </button>
              <span className="small muted">
                Answer by {request.day - 1 === game.day ? 'tonight' : `${WEEKDAY_NAMES[dateOf(request.day - 1).weekday]} evening`}.
              </span>
            </div>
          </div>
        );
      })}
      {accepted.length > 0 && (
        <ul className="rows">
          {accepted.map((request) => {
            const kind = bookingKindOf(request);
            const hasIt = wantMet(menu, kind.kind === 'table' ? kind.wish : kind.needs);
            return (
              <li key={request.id}>
                <span>
                  {kind.icon} <strong>{bookingDay(request.day, game.day)}:</strong> {bookingLine(request)}
                </span>
                <span className={hasIt ? 'up' : 'down'}>
                  {kind.kind === 'table' ? kind.wishText : kind.portionName} {hasIt ? '✓' : '✗'}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
