// The illustrated Old Town map: the Motława and Granary Island, streets lined with
// gabled houses, the landmarks, and a marker for each street you can move to.
// Map coordinates are metres east and north; SVG's y axis points down, hence the minus.

import { LOCATION_IDS, LOCATIONS, type LocationId } from '../data/locations';
import type { RivalId } from '../data/rivals';
import { playerOf } from '../sim/game';
import { MewaIcon } from './MewaIcon';
import { useGame } from './store';

const at = (id: LocationId) => ({ x: LOCATIONS[id].mapPosition.x, y: -LOCATIONS[id].mapPosition.y });

const BADGES: Record<RivalId, string> = { nonnaRosa: 'NR', blyskawica: 'BB', karczma: 'KŻ', spichlerz: 'SB' };

/** A little picture for each street's marker. */
const STREET_ICONS: Record<LocationId, string> = {
  ogarna: '🏘️',
  piwna: '🍺',
  mariacka: '💍',
  dluga: '⛲',
  pobrzeze: '⚓',
  spichrzow: '🌾',
};

const HOUSE_COLOURS = ['#e9a23b', '#b5452f', '#5d8aa8', '#e4c9a0', '#7a9e6b', '#d98c6a', '#c9b458'];

/** East–west streets: where they run, so houses can line them. */
const STREETS: { y: number; from: number; to: number }[] = [
  { y: 0, from: 170, to: 810 }, // Długa and Długi Targ
  { y: 100, from: 170, to: 810 }, // Ogarna
  { y: -200, from: 170, to: 520 }, // Piwna
  { y: -215, from: 560, to: 810 }, // Mariacka
];

/** North–south lanes crossing the town. */
const LANES = [380, 560, 720];

/** A gabled house front, its base at (x, y). */
function House({ x, y, i }: { x: number; y: number; i: number }) {
  const w = 20;
  const h = 22 + (i % 3) * 5;
  return (
    <g>
      <path
        d={`M${x} ${y} V${y - h} L${x + w / 2} ${y - h - 10} L${x + w} ${y - h} V${y} Z`}
        fill={HOUSE_COLOURS[i % HOUSE_COLOURS.length]}
        stroke="#8a5a3c"
        strokeWidth="1"
      />
      <rect x={x + 7} y={y - h + 6} width={6} height={7} rx={1} fill="#fdf6e3" />
    </g>
  );
}

/** Rows of houses along both sides of every street, leaving gaps for the lanes. */
function Houses() {
  const houses: { x: number; y: number }[] = [];
  for (const street of STREETS) {
    for (let x = street.from + 4; x + 20 < street.to; x += 24) {
      if (LANES.some((lane) => Math.abs(x + 10 - lane) < 24)) continue;
      houses.push({ x, y: street.y - 16 }, { x, y: street.y + 50 });
    }
  }
  return (
    <g>
      {houses.map((house, i) => (
        <House key={i} x={house.x} y={house.y} i={i * 7 + Math.floor(house.x / 24)} />
      ))}
    </g>
  );
}

/** Tall brick granaries on the island. */
function Granaries() {
  return (
    <g>
      {[-260, -150, -40, 130].map((y, i) => (
        <g key={y}>
          <path d={`M922 ${y + 50} V${y + 12} L944 ${y - 14} L966 ${y + 12} V${y + 50} Z`} className="granary" />
          {i % 2 === 0 && (
            <path d={`M972 ${y + 50} V${y + 16} L990 ${y - 4} L1008 ${y + 16} V${y + 50} Z`} className="granary" />
          )}
        </g>
      ))}
    </g>
  );
}

/** St. Mary's Basilica, the Neptune Fountain, the Green Gate and the Crane. */
function Landmarks() {
  return (
    <g>
      {/* St. Mary's: a huge brick hall church with a square tower */}
      <g className="landmark">
        <rect x={440} y={-322} width={34} height={88} className="brick" />
        <rect x={474} y={-286} width={92} height={52} className="brick" />
        <path d="M474 -286 L486 -300 L554 -300 L566 -286 Z" className="roof" />
        {[490, 512, 534].map((x) => (
          <rect key={x} x={x} y={-276} width={10} height={24} rx={5} className="church-window" />
        ))}
        <text x={503} y={-312} className="map-note small">
          St. Mary’s
        </text>
      </g>
      {/* The Neptune Fountain on Długi Targ */}
      <g className="landmark">
        <circle cx={660} cy={22} r={13} className="fountain" />
        <path d="M660 22 V2 M653 6 V-2 M667 6 V-2 M653 6 H667" className="trident" />
      </g>
      {/* The Green Gate, where Długi Targ meets the river */}
      <g className="landmark">
        <rect x={792} y={-30} width={34} height={58} className="green-gate" />
        <path d="M792 -30 L800 -40 L818 -40 L826 -30 Z" className="roof" />
        <rect x={803} y={8} width={12} height={20} rx={6} className="gate-arch" />
      </g>
      {/* Żuraw, the medieval Crane, on the waterfront */}
      <g className="landmark">
        <rect x={836} y={-150} width={22} height={60} className="crane-wood" />
        <circle cx={834} cy={-90} r={11} className="brick" />
        <circle cx={860} cy={-90} r={11} className="brick" />
        <path d="M832 -150 L847 -170 L862 -150 Z" className="crane-wood" />
        <text x={850} y={-58} className="map-note small">
          Żuraw
        </text>
      </g>
    </g>
  );
}

export function OldTownMap({ selected, onSelect }: { selected: LocationId; onSelect: (id: LocationId) => void }) {
  const game = useGame((s) => s.game);
  const home = playerOf(game).location;
  const rivals = game.restaurants.slice(1);

  return (
    <svg className="old-town-map" viewBox="150 -330 900 540" role="img" aria-label="Map of the Old Town">
      <rect x={150} y={-330} width={900} height={540} className="land" />

      {/* Streets and lanes */}
      {LANES.map((x) => (
        <line key={x} x1={x} y1={-330} x2={x} y2={210} className="lane" />
      ))}
      {STREETS.map((s) => (
        <line key={s.y} x1={s.from} y1={s.y + 17} x2={s.to} y2={s.y + 17} className="street" />
      ))}
      <line x1={815} y1={-330} x2={815} y2={210} className="street" />

      <Houses />

      {/* The Motława and the New Motława, with Granary Island between them */}
      <path d="M 880 -340 C 860 -150, 900 0, 870 220" className="river" />
      <path d="M 1045 -340 C 1025 -150, 1065 0, 1035 220" className="river" />
      <line x1={958} y1={-330} x2={958} y2={210} className="street" />
      <Granaries />
      <text x={958} y={-300} className="map-note small">
        Granary Island
      </text>
      <text x={872} y={180} className="map-note river-name">
        Motława
      </text>
      {/* A little boat on the river */}
      <g transform="translate(880 40)">
        <path d="M-14 0 H14 L9 8 H-9 Z" className="boat" />
        <path d="M0 0 V-22 L12 -4 Z" className="sail" />
      </g>

      <Landmarks />

      {LOCATION_IDS.map((id) => {
        const { x, y } = at(id);
        const here = rivals.filter((r) => r.location === id);
        const name = LOCATIONS[id].name;
        const labelWidth = name.length * 11 + 20;
        return (
          <g
            key={id}
            className={`map-spot${id === home ? ' home' : ''}${id === selected ? ' selected' : ''}`}
            onClick={() => onSelect(id)}
            role="button"
            aria-label={name}
          >
            <circle cx={x} cy={y} r={34} />
            <text x={x} y={y + 11} className="map-icon">
              {STREET_ICONS[id]}
            </text>
            <rect x={x - labelWidth / 2} y={y + 40} width={labelWidth} height={30} rx={10} className="map-label-bg" />
            <text x={x} y={y + 62} className="map-label">
              {name}
            </text>
            {id === 'mariacka' && (
              <text x={x - 46} y={y - 22} className="map-heart" aria-hidden="true">
                ❤
              </text>
            )}
            {id === home && (
              <g transform={`translate(${x - 92} ${y - 70})`}>
                <MewaIcon size={64} />
              </g>
            )}
            {here.map((rival, i) => (
              <g key={rival.id}>
                <rect x={x + 22 + i * 44} y={y - 56} width={40} height={26} rx={8} className="map-badge" />
                <text x={x + 42 + i * 44} y={y - 37} className="map-badge-text">
                  {BADGES[rival.id as RivalId]}
                </text>
              </g>
            ))}
          </g>
        );
      })}
    </svg>
  );
}
