// The restaurant view: a cosy cross-section of the terrace, dining room and kitchen
// while the day plays. Guests are simple figures in their group's colour, with a
// bubble showing how they feel. See project.md section 8.

import type { GroupId } from '../data/groups';
import type { FloorView, TableGuests } from '../sim/day';

/** Each kind of guest has its own colour, so you can see at a glance who's in. */
export const GROUP_COLOURS: Record<GroupId, string> = {
  tourists: '#e9a23b',
  students: '#3c7a3a',
  locals: '#b5452f',
  office: '#2f6f8f',
  foodies: '#7b4f9d',
};

const WIDTH = 1200;
const HEIGHT = 440;
const FLOOR_Y = 190;
const KITCHEN_WIDTH = 290;
const TERRACE_WIDTH = 270;

/** How a table feels, as an emoji bubble, or null for no bubble. */
function bubbleFor(guests: TableGuests): string | null {
  // The Friday regular wants one thing, and the whole room knows it.
  if (guests.regular && guests.stage !== 'eating') return '🍋';
  if (guests.stage === 'ordering') return '💬';
  if (guests.stage === 'waiting') {
    if (guests.impatience > 0.8) return '😤';
    if (guests.impatience > 0.5) return '⏳';
    return null;
  }
  // A reaction when the food arrives, then they just enjoy it.
  if (guests.eatingFor > 15 || guests.satisfaction === null) return null;
  if (guests.satisfaction >= 80) return '😋';
  if (guests.satisfaction >= 60) return '🙂';
  if (guests.satisfaction >= 40) return '😐';
  return '😞';
}

/** A simple person: a round head on a rounded body. */
function Person({ x, y, colour, scale = 1 }: { x: number; y: number; colour: string; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect x={-8} y={-4} width={16} height={20} rx={7} fill={colour} />
      <circle cx={0} cy={-11} r={7} fill="#f3d2b5" />
    </g>
  );
}

/** Chair positions around a table: two on each side. */
const SEATS = [
  [-30, -10],
  [30, -10],
  [-30, 14],
  [30, 14],
];

function Table({
  x,
  y,
  size,
  guests,
  outdoor,
}: {
  x: number;
  y: number;
  size: number;
  guests: TableGuests | null;
  outdoor: boolean;
}) {
  const bubble = guests && bubbleFor(guests);
  const colour = guests ? GROUP_COLOURS[guests.group] : '';
  return (
    <g transform={`translate(${x} ${y}) scale(${size}) translate(${-x} ${-y})`}>
      {SEATS.map(([dx, dy], i) => (
        <rect key={i} x={x + dx - 7} y={y + dy - 2} width={14} height={14} rx={3} className="chair" />
      ))}
      {guests &&
        SEATS.slice(0, guests.seated).map(([dx, dy], i) => (
          <Person key={i} x={x + dx * 0.9} y={y + dy - 4} colour={colour} />
        ))}
      <rect x={x - 22} y={y - 8} width={44} height={28} rx={5} className={outdoor ? 'table outdoor' : 'table'} />
      {guests?.stage === 'eating' &&
        [-10, 10].map((dx) => <circle key={dx} cx={x + dx} cy={y + 6} r={6} className="plate" />)}
      {/* They've paid: a coin floats up from the table. */}
      {guests?.stage === 'eating' && guests.eatingFor <= 10 && (
        <text x={x} y={y - 8} className="scene-emoji coin-pop">
          🪙
        </text>
      )}
      {guests?.critic && (
        <text x={x} y={y + 40} className="scene-emoji small-emoji">
          🖋️
        </text>
      )}
      {bubble && (
        <g key={bubble} className="bubble">
          <rect x={x - 17} y={y - 66} width={34} height={30} rx={12} />
          <text x={x} y={y - 44} className="scene-emoji">
            {bubble}
          </text>
        </g>
      )}
    </g>
  );
}

/**
 * Table centres spread evenly inside a box: one row for a few tables, two rows for more.
 * Also returns how big to draw each table so neighbours never overlap.
 */
function tableSpots(count: number, left: number, width: number, top: number, bottom: number, maxPerRow: number) {
  const perRow = Math.min(maxPerRow, count <= 4 ? count : Math.ceil(count / 2));
  const rows = Math.max(1, Math.ceil(count / perRow));
  const spacing = width / (perRow + 1);
  // A table with its chairs is about 80 units wide at size 1; leave some room between them.
  const size = Math.min(1.4, spacing / 100);
  const spots: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / perRow);
    const inRow = Math.min(perRow, count - row * perRow);
    const col = i % perRow;
    spots.push({
      x: left + (width * (col + 1)) / (inRow + 1),
      y: rows === 1 ? (top + bottom) / 2 : top + ((bottom - top) * row) / (rows - 1),
    });
  }
  return { spots, size };
}

/** A row of gabled Old Town houses, seen through a window. */
function TownWindow({ x, y, width }: { x: number; y: number; width: number }) {
  const colours = ['#e9a23b', '#b5452f', '#5d8aa8', '#e4c9a0', '#7a9e6b'];
  const houses = 4;
  const w = width / houses;
  return (
    <g>
      <rect x={x} y={y} width={width} height={100} rx={8} className="window-sky" />
      {Array.from({ length: houses }, (_, i) => {
        const hx = x + i * w;
        const top = y + 30 + (i % 2) * 10;
        return (
          <g key={i}>
            <path
              d={`M${hx + 2} ${y + 100} V${top + 14} L${hx + w / 2} ${top} L${hx + w - 2} ${top + 14} V${y + 100} Z`}
              fill={colours[(i + Math.round(x)) % colours.length]}
            />
            <rect x={hx + w / 2 - 5} y={top + 26} width={10} height={14} rx={2} className="house-window" />
          </g>
        );
      })}
      <rect x={x} y={y} width={width} height={100} rx={8} className="window-frame" />
      <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + 100} className="window-bar" />
    </g>
  );
}

export function RestaurantView({ floor }: { floor: FloorView }) {
  const terraceCount = floor.tables.length - floor.insideTables;
  const terraceWidth = terraceCount > 0 ? TERRACE_WIDTH : 0;
  const diningLeft = terraceWidth;
  const diningWidth = WIDTH - KITCHEN_WIDTH - terraceWidth;
  const kitchenLeft = WIDTH - KITCHEN_WIDTH;

  const inside = tableSpots(floor.insideTables, diningLeft + 40, diningWidth - 110, FLOOR_Y + 80, FLOOR_Y + 200, 6);
  const outside = tableSpots(terraceCount, 0, terraceWidth, FLOOR_Y + 80, FLOOR_Y + 200, 3);
  const doorX = diningLeft + 10;

  return (
    <svg className="restaurant-view" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} role="img" aria-label="Your restaurant">
      {/* Terrace: open sky, an awning and cobbles */}
      {terraceCount > 0 && (
        <g>
          <rect x={0} y={0} width={terraceWidth} height={HEIGHT} className="terrace-sky" />
          <rect x={0} y={FLOOR_Y} width={terraceWidth} height={HEIGHT - FLOOR_Y} className="cobbles" />
          {Array.from({ length: 6 }, (_, i) => (
            <rect
              key={i}
              x={(i * terraceWidth) / 6}
              y={40}
              width={terraceWidth / 6}
              height={34}
              className={i % 2 === 0 ? 'awning' : 'awning light'}
            />
          ))}
          <text x={terraceWidth / 2} y={120} className="scene-label">
            Terrace
          </text>
        </g>
      )}

      {/* Dining room: warm wall, windows onto the Old Town, wooden floor */}
      <rect x={diningLeft} y={0} width={diningWidth} height={FLOOR_Y} className="wall" />
      <rect x={diningLeft} y={FLOOR_Y - 26} width={diningWidth} height={26} className="wainscot" />
      <TownWindow x={diningLeft + diningWidth * 0.12} y={36} width={Math.min(220, diningWidth * 0.3)} />
      <TownWindow x={diningLeft + diningWidth * 0.55} y={36} width={Math.min(220, diningWidth * 0.3)} />
      <rect x={diningLeft} y={FLOOR_Y} width={diningWidth} height={HEIGHT - FLOOR_Y} className="floorboards" />
      <rect x={doorX} y={FLOOR_Y - 120} width={44} height={120} rx={6} className="door" />

      {/* Kitchen: tiles, the pass, the stove and the chefs */}
      <rect x={kitchenLeft} y={0} width={KITCHEN_WIDTH} height={HEIGHT} className="kitchen-wall" />
      <rect x={kitchenLeft} y={FLOOR_Y} width={KITCHEN_WIDTH} height={HEIGHT - FLOOR_Y} className="kitchen-floor" />
      <rect x={kitchenLeft - 8} y={0} width={12} height={HEIGHT} className="partition" />
      <text x={kitchenLeft + KITCHEN_WIDTH / 2} y={30} className="scene-label">
        Kitchen
      </text>
      {/* Order tickets waiting on the rail */}
      <line x1={kitchenLeft + 20} y1={58} x2={WIDTH - 20} y2={58} className="rail" />
      {Array.from({ length: Math.min(8, floor.ordersWaiting) }, (_, i) => (
        <rect key={i} x={kitchenLeft + 26 + i * 30} y={58} width={22} height={28} rx={2} className="ticket" />
      ))}
      {floor.ordersWaiting > 8 && (
        <text x={WIDTH - 30} y={100} className="scene-note" textAnchor="end">
          +{floor.ordersWaiting - 8} more
        </text>
      )}
      <rect x={kitchenLeft + 20} y={FLOOR_Y + 40} width={KITCHEN_WIDTH - 40} height={40} rx={6} className="stove" />
      {floor.chefsBusy.map((busy, i) => {
        const x = kitchenLeft + (KITCHEN_WIDTH * (i + 1)) / (floor.chefsBusy.length + 1);
        return (
          <g key={i}>
            <Person x={x} y={FLOOR_Y + 14} colour="#ffffff" scale={1.4} />
            <rect x={x - 9} y={FLOOR_Y - 18} width={18} height={10} rx={4} className="chef-hat" />
            <rect x={x + 14} y={FLOOR_Y + 30} width={26} height={14} rx={4} className="pot" />
            {busy && (
              <path d={`M${x + 21} ${FLOOR_Y + 26} q4 -8 0 -16 M${x + 33} ${FLOOR_Y + 26} q4 -8 0 -16`} className="steam" />
            )}
          </g>
        );
      })}
      {floor.chefsBusy.length === 0 && (
        <text x={kitchenLeft + KITCHEN_WIDTH / 2} y={FLOOR_Y + 20} className="scene-note">
          Nobody is cooking!
        </text>
      )}

      {/* Guests at their tables */}
      {inside.spots.map((spot, i) => (
        <Table key={`in${i}`} x={spot.x} y={spot.y} size={inside.size} guests={floor.tables[i]} outdoor={false} />
      ))}
      {outside.spots.map((spot, i) => (
        <Table
          key={`out${i}`}
          x={spot.x}
          y={spot.y}
          size={outside.size}
          guests={floor.tables[floor.insideTables + i]}
          outdoor={true}
        />
      ))}

      {/* Waiters, ready by the kitchen door with their trays */}
      {Array.from({ length: floor.waiters }, (_, i) => {
        const x = kitchenLeft - 40 - i * 38;
        return (
          <g key={i}>
            <Person x={x} y={FLOOR_Y + 30} colour="#3b2a22" scale={1.4} />
            <ellipse cx={x + 16} cy={FLOOR_Y + 22} rx={12} ry={3} className="tray" />
          </g>
        );
      })}

      {/* Parties who gave up, on their way out of the door */}
      {floor.walkouts.slice(0, 3).map((walkout, i) => (
        <g key={i} className="walkout">
          <Person x={doorX + 70 + i * 30} y={FLOOR_Y + 30} colour={GROUP_COLOURS[walkout.group]} scale={1.3} />
          <text x={doorX + 70 + i * 30} y={FLOOR_Y - 2} className="scene-emoji small-emoji">
            😠
          </text>
        </g>
      ))}
    </svg>
  );
}
