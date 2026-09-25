import type {CartApiQueryFragment} from 'storefrontapi.generated';
import type {CartLayout} from '~/components/CartMain';
import {Money, type OptimisticCart} from '@shopify/hydrogen';
import {usePopup} from '~/lib/usePopup';

type CartSummaryProps = {
  cart: OptimisticCart<CartApiQueryFragment | null>;
  layout: CartLayout;
};

/**
 * Pop-ups keep the drawer to what matters: subtotal and one way forward.
 * Discount codes and gift cards are entered in Shopify checkout.
 */
export function CartSummary({cart, layout}: CartSummaryProps) {
  const {copy} = usePopup();
  const className = layout === 'page' ? 'cart-summary-page' : 'cart-summary-aside';

  return (
    <div className={className}>
      {copy.showPrices && (
        <dl className="cart-subtotal">
          <dt>Subtotal</dt>
          <dd>{cart?.cost?.subtotalAmount?.amount ? <Money data={cart.cost.subtotalAmount} /> : '-'}</dd>
        </dl>
      )}
      <p className="cart-summary-note">{copy.checkoutNote}</p>
      {cart?.checkoutUrl && (
        <a className="button cart-checkout" href={cart.checkoutUrl} target="_self">
          {copy.checkout}
        </a>
      )}
    </div>
  );
}
