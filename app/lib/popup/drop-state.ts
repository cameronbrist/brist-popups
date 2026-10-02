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
 * The per-order item limit that applies to a pop-up. Gift pop-ups default to
 * one gift per order when no limit is set. Returns null for no limit.
 */
export function orderLimit(popup: Pick<PopupConfig, 'maxPerOrder'> & {mode?: PopupConfig['mode']}): number | null {
  if (popup.maxPerOrder && popup.maxPerOrder > 0) return popup.maxPerOrder;
  return popup.mode === 'gift' ? 1 : null;
}

/**
 * Checks a proposed cart quantity against the pop-up's per-order limit.
 * Returns an error message, or null if the quantity is allowed.
 */
export function checkOrderLimit(
  popup: Pick<PopupConfig, 'maxPerOrder'> & {mode?: PopupConfig['mode']},
  currentQuantity: number,
  addingQuantity: number,
): string | null {
  const max = orderLimit(popup);
  if (!max) return null;
  if (currentQuantity + addingQuantity <= max) return null;

  if (popup.mode === 'gift') {
    return max === 1
      ? 'You can choose one gift. Remove the one in your cart to pick a different one.'
      : `You can choose up to ${max} gifts.`;
  }
  return `This drop has a limit of ${max} item${max === 1 ? '' : 's'} per order.`;
}

/**
 * Checks per-product quantities in a cart against the pop-up's per-item
 * limit. Lines are grouped by product, so two sizes of one hoodie count as
 * two of that item. Returns an error message, or null if the cart is allowed.
 */
export function checkItemLimit(
  popup: Pick<PopupConfig, 'maxPerItem'> & {mode?: PopupConfig['mode']},
  lines: Array<{productId: string; quantity: number}>,
): string | null {
  const max = popup.maxPerItem;
  if (!max || max <= 0) return null;

  const totals = new Map<string, number>();
  for (const l of lines) totals.set(l.productId, (totals.get(l.productId) ?? 0) + l.quantity);
  const over = [...totals.values()].some((q) => q > max);
  if (!over) return null;

  if (popup.mode === 'gift') {
    return max === 1
      ? "You've already chosen this one. Pick something different."
      : `You can choose up to ${max} of each gift.`;
  }
  return `Limit ${max} per item.`;
}
