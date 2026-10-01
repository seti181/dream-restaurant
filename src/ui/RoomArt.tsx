// What the player has bought, drawn into the restaurant view: decor in the dining
// room and equipment in the kitchen. Simple flat SVG in the game's warm colours.

import type { DecorId } from '../data/decor';
import type { EquipmentId } from '../data/dishes';

type Spot = { x: number; y: number; size: number };

// ---------- Decor ----------

/** Decor that hangs from the ceiling. */
function CeilingDecor({ id, left, width }: { id: DecorId; left: number; width: number }) {
  const cord = (x: number, length: number) => <line x1={x} y1={0} x2={x} y2={length} className="cord" />;
  switch (id) {
    case 'chandelier': {
      const x = left + width * 0.45;
      return (
        <g>
          {cord(x, 22)}
          <path d={`M${x - 30} 30 Q${x} 48 ${x + 30} 30`} className="brass" fill="none" strokeWidth={4} />
          {[-30, -10, 10, 30].map((dx) => (
            <g key={dx}>
              <rect x={x + dx - 2} y={20} width={4} height={10} className="candle" />
              <circle cx={x + dx} cy={17} r={3} className="flame" />
            </g>
          ))}
          <circle cx={x} cy={36} r={6} className="brass" />
        </g>
      );
    }
    case 'lanterns':
      return (
        <g>
          {[0.47, 0.93].map((f) => {
            const x = left + width * f;
            return (
              <g key={f}>
                {cord(x, 24)}
                <rect x={x - 8} y={24} width={16} height={20} rx={3} className="lantern" />
                <rect x={x - 4} y={28} width={8} height={12} rx={2} className="flame" />
              </g>
            );
          })}
        </g>
      );
    case 'pendantLights':
      return (
        <g>
          {[0.27, 0.5, 0.73].map((f) => {
            const x = left + width * f;
            return (
              <g key={f}>
                {cord(x, 26)}
                <path d={`M${x - 12} 38 L${x - 6} 26 H${x + 6} L${x + 12} 38 Z`} className="pendant" />
                <circle cx={x} cy={40} r={3} className="flame" />
              </g>
            );
          })}
        </g>
      );
    default:
      return null;
  }
}

/** Decor that hangs on a wall or stands on a shelf, drawn in a box of the given size. */
function WallDecor({ id, spot }: { id: DecorId; spot: Spot }) {
  const { x, y, size: s } = spot;
  const half = s / 2;
  switch (id) {
    case 'portraits':
      return (
        <g>
          {[-0.28, 0.28].map((f) => (
            <g key={f}>
              <rect x={x + f * s - s * 0.2} y={y - half * 0.6} width={s * 0.4} height={s * 0.55} className="frame" />
              <rect x={x + f * s - s * 0.15} y={y - half * 0.6 + 4} width={s * 0.3} height={s * 0.55 - 8} className="portrait-bg" />
              <circle cx={x + f * s} cy={y - half * 0.6 + s * 0.2} r={s * 0.07} className="face" />
              <path d={`M${x + f * s - s * 0.12} ${y + s * 0.18} q${s * 0.12} ${-s * 0.2} ${s * 0.24} 0`} className="coat" />
            </g>
          ))}
        </g>
      );
    case 'seaChart':
      return (
        <g>
          <rect x={x - half} y={y - half * 0.7} width={s} height={s * 0.7} className="frame" />
          <rect x={x - half + 4} y={y - half * 0.7 + 4} width={s - 8} height={s * 0.7 - 8} className="chart-sea" />
          <path d={`M${x - half + 6} ${y + s * 0.1} q${s * 0.3} ${-s * 0.25} ${s * 0.5} ${-s * 0.05} t${s * 0.35} ${s * 0.1}`} className="chart-coast" />
          <circle cx={x + s * 0.15} cy={y - s * 0.12} r={2.5} className="chart-pin" />
        </g>
      );
    case 'shipsInBottles':
    case 'clayPots': {
      const items = [-0.3, 0, 0.3];
      return (
        <g>
          <rect x={x - half} y={y + s * 0.15} width={s} height={5} className="shelf" />
          {items.map((f) =>
            id === 'shipsInBottles' ? (
              <g key={f}>
                <rect x={x + f * s - s * 0.12} y={y - s * 0.05} width={s * 0.24} height={s * 0.2} rx={5} className="bottle" />
                <path d={`M${x + f * s - s * 0.06} ${y + s * 0.1} h${s * 0.12} l-3 3 h${-s * 0.12 + 6} z`} className="tiny-hull" />
                <path d={`M${x + f * s} ${y + s * 0.1} v${-s * 0.12} l${s * 0.06} ${s * 0.1} z`} className="tiny-sail" />
              </g>
            ) : (
              <path
                key={f}
                d={`M${x + f * s - s * 0.1} ${y + s * 0.15} q${-s * 0.04} ${-s * 0.2} ${s * 0.04} ${-s * 0.24} h${s * 0.12} q${s * 0.08} ${s * 0.04} ${s * 0.04} ${s * 0.24} z`}
                className={f === 0 ? 'pot-clay dark' : 'pot-clay'}
              />
            ),
          )}
        </g>
      );
    }
    case 'plantWall':
      return (
        <g>
          <rect x={x - half} y={y - half * 0.8} width={s} height={s * 0.9} rx={6} className="plant-panel" />
          {Array.from({ length: 9 }, (_, i) => (
            <circle
              key={i}
              cx={x - half + s * (0.2 + (i % 3) * 0.3)}
              cy={y - half * 0.8 + s * (0.18 + Math.floor(i / 3) * 0.27)}
              r={s * 0.13}
              className={i % 2 === 0 ? 'leaf' : 'leaf light'}
            />
          ))}
        </g>
      );
    default:
      return null;
  }
}

const CEILING: DecorId[] = ['chandelier', 'lanterns', 'pendantLights'];
const WALL: DecorId[] = ['portraits', 'seaChart', 'shipsInBottles', 'clayPots', 'plantWall'];

export interface DecorLayerProps {
  decor: DecorId[];
  left: number;
  width: number;
  floorY: number;
  /** Free stretches of wall between and beside the windows. */
  wallSpots: Spot[];
}

/** Everything bought for the dining room, drawn behind the tables. */
export function DecorLayer({ decor, left, width, floorY, wallSpots }: DecorLayerProps) {
  const wallItems = decor.filter((id) => WALL.includes(id));
  return (
    <g>
      {decor.includes('panelling') && <rect x={left} y={floorY - 48} width={width} height={48} className="panelling" />}
      {decor.includes('panelling') &&
        Array.from({ length: Math.floor(width / 60) }, (_, i) => (
          <rect key={i} x={left + 10 + i * 60} y={floorY - 41} width={44} height={34} rx={3} className="panel-inset" />
        ))}
      {wallItems.slice(0, wallSpots.length).map((id, i) => (
        <WallDecor key={id} id={id} spot={wallSpots[i]} />
      ))}
      {decor.includes('tiledStove') && (
        <g>
          <rect x={left + width - 64} y={floorY - 110} width={50} height={110} rx={4} className="tiled-stove" />
          {Array.from({ length: 12 }, (_, i) => (
            <rect
              key={i}
              x={left + width - 60 + (i % 3) * 14}
              y={floorY - 104 + Math.floor(i / 3) * 26}
              width={11}
              height={22}
              rx={2}
              className="stove-tile"
            />
          ))}
        </g>
      )}
      {decor.includes('communalTable') && (
        <g>
          <rect x={left + width * 0.3} y={floorY + 18} width={width * 0.4} height={12} rx={3} className="oak" />
          <rect x={left + width * 0.32} y={floorY + 30} width={6} height={18} className="oak" />
          <rect x={left + width * 0.68 - 6} y={floorY + 30} width={6} height={18} className="oak" />
        </g>
      )}
      {decor
        .filter((id) => CEILING.includes(id))
        .map((id) => (
          <CeilingDecor key={id} id={id} left={left} width={width} />
        ))}
    </g>
  );
}

// ---------- Kitchen equipment ----------

function Appliance({ id, x, y }: { id: EquipmentId; x: number; y: number }) {
  switch (id) {
    case 'fryer':
      return (
        <g>
          <rect x={x - 20} y={y - 26} width={40} height={30} rx={3} className="steel" />
          <rect x={x - 14} y={y - 34} width={28} height={10} className="basket" />
          <line x1={x + 14} y1={y - 30} x2={x + 26} y2={y - 42} className="handle" />
        </g>
      );
    case 'grill':
      return (
        <g>
          <rect x={x - 22} y={y - 20} width={44} height={24} rx={3} className="steel dark" />
          {[-12, -4, 4, 12].map((dx) => (
            <line key={dx} x1={x + dx} y1={y - 18} x2={x + dx} y2={y} className="grill-bar" />
          ))}
        </g>
      );
    case 'pizzaOven':
      return (
        <g>
          <path d={`M${x - 26} ${y + 4} V${y - 14} A26 22 0 0 1 ${x + 26} ${y - 14} V${y + 4} Z`} className="oven-brick" />
          <path d={`M${x - 11} ${y + 4} V${y - 6} A11 10 0 0 1 ${x + 11} ${y - 6} V${y + 4} Z`} className="oven-mouth" />
          <circle cx={x} cy={y - 1} r={4} className="flame" />
        </g>
      );
    case 'espresso':
      return (
        <g>
          <rect x={x - 16} y={y - 34} width={32} height={38} rx={4} className="espresso" />
          <rect x={x - 10} y={y - 16} width={20} height={6} className="steel" />
          <rect x={x - 5} y={y - 6} width={10} height={8} rx={2} className="cup" />
        </g>
      );
    case 'dessertDisplay':
      return (
        <g>
          <rect x={x - 24} y={y - 34} width={48} height={38} rx={4} className="glass" />
          <rect x={x - 24} y={y - 15} width={48} height={3} className="steel" />
          {[-12, 12].map((dx) => (
            <path key={dx} d={`M${x + dx - 8} ${y - 18} h16 v-8 l-8 -4 l-8 4 z`} className="cake" />
          ))}
          {[-12, 12].map((dx) => (
            <rect key={`b${dx}`} x={x + dx - 8} y={y - 4} width={16} height={7} rx={2} className="cake dark" />
          ))}
        </g>
      );
    default:
      return null;
  }
}

/** Machines on the kitchen's back counter, beside the stove. */
export function KitchenEquipment({ equipment, left, width, y }: { equipment: EquipmentId[]; left: number; width: number; y: number }) {
  const machines = equipment.filter((id) => id !== 'stove');
  return (
    <g>
      {machines.length > 0 && <rect x={left + 14} y={y + 4} width={width - 28} height={8} rx={2} className="counter-top" />}
      {machines.map((id, i) => (
        <Appliance key={id} id={id} x={left + (width * (i + 1)) / (machines.length + 1)} y={y} />
      ))}
    </g>
  );
}
