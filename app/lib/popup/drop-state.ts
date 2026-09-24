import type {PopupConfig} from './types';

export type DropPhase = 'upcoming' | 'live' | 'closed';

export interface DropState {
  phase: DropPhase;
  /** ISO time of the next phase change, or null if none is scheduled. */
  nextChangeAt: string | null;
  /** True when shoppers may add to cart and check out. */
  canPurchase: boolean;
}

function parse(iso: string | null): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
}

/**
 * Pure function: given a config and a moment in time, what phase is the drop in?
 *
 * - Not active (draft/archived)       -> closed
 * - No open time                       -> live until close (or indefinitely)
 * - Before open time                   -> upcoming
 * - Between open and close             -> live
 * - After close time                   -> closed
 */
export function getDropState(
  popup: Pick<PopupConfig, 'status' | 'opensAt' | 'closesAt'>,
  now: Date = new Date(),
): DropState {
  const t = now.getTime();
  const opens = parse(popup.opensAt);
  const closes = parse(popup.closesAt);

  if (popup.status !== 'active') {
    return {phase: 'closed', nextChangeAt: null, canPurchase: false};
  }
  if (opens !== null && t < opens) {
    return {phase: 'upcoming', nextChangeAt: popup.opensAt, canPurchase: false};
  }
  if (closes !== null && t >= closes) {
    return {phase: 'closed', nextChangeAt: null, canPurchase: false};
  }
  return {phase: 'live', nextChangeAt: popup.closesAt, canPurchase: true};
}

/**
 * How long a page for this pop-up can safely be cached, in seconds.
 * Keeps edge caches from serving an "upcoming" page after the drop opens.
 */
export function maxCacheSeconds(state: DropState, now: Date = new Date(), ceiling = 300): number {
  const next = parse(state.nextChangeAt);
  if (next === null) return ceiling;
  const secs = Math.floor((next - now.getTime()) / 1000);
  return Math.max(0, Math.min(ceiling, secs));
}

/**
 * Checks a proposed cart quantity against the pop-up's per-order limit.
 * Returns an error message, or null if the quantity is allowed.
 */
export function checkOrderLimit(
  popup: Pick<PopupConfig, 'maxPerOrder'>,
  currentQuantity: number,
  addingQuantity: number,
): string | null {
  const max = popup.maxPerOrder;
  if (!max || max <= 0) return null;
  if (currentQuantity + addingQuantity > max) {
    return `This drop has a limit of ${max} item${max === 1 ? '' : 's'} per order.`;
  }
  return null;
}
