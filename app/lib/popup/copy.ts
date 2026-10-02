import type {PopupConfig} from './types';
import type {DropState} from './drop-state';
import {orderLimit} from './drop-state';

/**
 * Words and display rules that change by pop-up mode, in one place so
 * components don't each re-derive them.
 */
export interface PopupCopy {
  showPrices: boolean;
  showQuantity: boolean;
  showShipMessage: boolean;
  cartTitle: string;
  cartButton: string;
  cartEmpty: string;
  browse: string;
  checkout: string;
  checkoutNote: string;
  soldOut: string;
  /** Shown instead of the product grid when a pop-up has no products yet. */
  emptyTitle: string;
  emptyBody: string;
}

export function popupCopy(
  popup: Pick<PopupConfig, 'mode' | 'shipMessage'> & {maxPerOrder?: number | null},
): PopupCopy {
  const gift = popup.mode === 'gift';
  const several = gift && (orderLimit({mode: popup.mode, maxPerOrder: popup.maxPerOrder ?? null}) ?? 1) > 1;
  const ship = popup.mode !== 'in_stock' && popup.shipMessage ? popup.shipMessage : null;

  return {
    showPrices: !gift,
    showQuantity: !gift,
    showShipMessage: Boolean(ship),
    cartTitle: several ? 'Your gifts' : gift ? 'Your gift' : 'Your cart',
    cartButton: gift ? 'Gift' : 'Cart',
    cartEmpty: several
      ? "You haven't chosen your gifts yet."
      : gift
        ? "You haven't chosen a gift yet."
        : 'Your cart is empty.',
    browse: gift ? 'See the gifts' : 'Browse the drop',
    checkout: gift ? 'Enter shipping details' : 'Check out',
    checkoutNote: gift
      ? [ship, 'No payment needed. Just tell us where to send it.'].filter(Boolean).join(' ')
      : [ship, 'Shipping and taxes calculated at checkout.'].filter(Boolean).join(' '),
    soldOut: gift ? 'All claimed' : 'Sold out',
    emptyTitle: gift ? 'Gifts are on the way' : 'Products are on the way',
    emptyBody: gift
      ? "We're still setting up the gift options. Check back soon."
      : "We're still setting up this drop. Check back soon.",
  };
}

/** Label for the main buy button on a product page. */
export function buyLabel(
  popup: Pick<PopupConfig, 'mode'>,
  drop: Pick<DropState, 'phase'>,
  available: boolean,
): string {
  if (drop.phase === 'upcoming') return 'Opens soon';
  if (drop.phase === 'closed') return popup.mode === 'gift' ? 'Gift selection closed' : 'Drop closed';
  if (!available) return popupCopy({mode: popup.mode, shipMessage: null}).soldOut;
  if (popup.mode === 'gift') return 'Choose this gift';
  return popup.mode === 'preorder' ? 'Pre-order' : 'Add to cart';
}

type LimitFields = Pick<PopupConfig, 'mode' | 'maxPerOrder' | 'maxPerItem'>;

/**
 * One line explaining the pop-up's limits, for the product page.
 * Gift: "Choose up to 3 gifts, one of each." Drops: "Limit 6 per order, 2 per item."
 * Returns null when there is nothing worth saying (a single gift, or no limits).
 */
export function limitHint(popup: LimitFields): string | null {
  const total = orderLimit(popup);
  const item = popup.maxPerItem;

  if (popup.mode === 'gift') {
    if (!total || total <= 1) return null;
    if (item === 1) return `Choose up to ${total} gifts, one of each.`;
    if (item) return `Choose up to ${total} gifts, up to ${item} of each.`;
    return `Choose up to ${total} gifts.`;
  }

  if (total && item) return `Limit ${total} per order, ${item} per item.`;
  if (total) return `Limit ${total} per order.`;
  if (item) return `Limit ${item} per item.`;
  return null;
}

/** Gift drawer progress, e.g. "2 of 3 gifts chosen". Null unless multi-gift. */
export function giftProgress(popup: LimitFields, chosen: number): {text: string; canChooseMore: boolean} | null {
  const total = orderLimit(popup);
  if (popup.mode !== 'gift' || !total || total <= 1) return null;
  return {text: `${chosen} of ${total} gifts chosen`, canChooseMore: chosen < total};
}
