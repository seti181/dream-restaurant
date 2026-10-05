// Satisfaction and reputation. See project.md sections 6.8 and 7, step 4.

import { balance } from '../data/balance';
import { GROUPS, type GroupId } from '../data/groups';
import type { SatisfactionFactors } from './types';

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

export interface VisitDetails {
  group: GroupId;
  /** Average quality (0–100) of the dishes served. */
  quality: number;
  /** What the party paid. */
  bill: number;
  /** What the same order costs at typical Old Town prices. */
  typicalBill: number;
  /** Minutes from sitting down to the food arriving. */
  waitMinutes: number;
  /** Minutes from sitting down to the order being taken. */
  orderMinutes: number;
  /** Average skill (1–5) of the restaurant's waiters. */
  waiterSkill: number;
  /** 0–100. */
  ambiance: number;
}

export function satisfactionFactors(visit: VisitDetails): SatisfactionFactors {
  const group = GROUPS[visit.group];
  const s = balance.satisfaction;
  const skillAboveAverage = visit.waiterSkill - balance.staff.averageLevel;
  // What they'd find a fair price: the usual one, or more for food better than they expected.
  const fairBill = visit.typicalBill * Math.max(0.5, 1 + (visit.quality - group.expectedQuality) * s.fairPricePerQualityPoint);
  return {
    quality: clamp((visit.quality - group.expectedQuality) / s.qualityRange),
    // Paying less than seems fair pleases; paying more annoys, especially price-sensitive groups.
    value: clamp(
      (1 - visit.bill / fairBill) * s.valueSlope * (0.5 + group.priceSensitivity),
    ),
    // No wait is wonderful, half their patience is fine, their full patience is awful.
    wait: clamp(1 - (2 * visit.waitMinutes) / group.patienceMinutes),
    ambiance: clamp((visit.ambiance - 50) / 50),
    service: clamp(
      1 -
        visit.orderMinutes / balance.service.slowOrderMinutes +
        skillAboveAverage * balance.service.serviceBonusPerSkillPoint,
    ),
  };
}

/** Turns the factors into one score from 0 to 100, where 50 is "fine". */
export function satisfactionScore(factors: SatisfactionFactors): number {
  const w = balance.satisfaction.weights;
  const weighted =
    w.quality * factors.quality +
    w.value * factors.value +
    w.wait * factors.wait +
    w.ambiance * factors.ambiance +
    w.service * factors.service;
  return 50 + 50 * weighted;
}

/**
 * Reputation drifts a little towards each party's satisfaction.
 * @param weight how much this visit counts; a food critic counts for many
 */
export function updatedReputation(reputation: number, satisfaction: number, weight = 1): number {
  const step = Math.min(1, balance.reputation.smoothing * weight);
  return reputation + step * (satisfaction - reputation);
}
