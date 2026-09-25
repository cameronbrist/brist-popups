import {Suspense} from 'react';
import {Await, Link, useAsyncValue} from 'react-router';
import {
  Image,
  type CartViewPayload,
  useAnalytics,
  useOptimisticCart,
} from '@shopify/hydrogen';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {useAside} from '~/components/Aside';
import {usePopup} from '~/lib/usePopup';

export function PopupHeader({cart}: {cart: Promise<CartApiQueryFragment | null>}) {
  const {popup} = usePopup();
  return (
    <header className="popup-header">
      <Link to="/" prefetch="intent" className="popup-brand">
        {popup.logo ? (
          <Image data={popup.logo} alt={popup.logo.altText || popup.name} sizes="160px" />
        ) : (
          <span>{popup.name}</span>
        )}
      </Link>
      <Suspense fallback={<CartButton count={0} />}>
        <Await resolve={cart}>
          <CartCount />
        </Await>
      </Suspense>
    </header>
  );
}

function CartCount() {
  const original = useAsyncValue() as CartApiQueryFragment | null;
  const cart = useOptimisticCart(original);
  return <CartButton count={cart?.totalQuantity ?? 0} />;
}

function CartButton({count}: {count: number}) {
  const {open} = useAside();
  const {publish, shop, cart, prevCart} = useAnalytics();
  return (
    <a
      href="/cart"
      className="popup-cart-button"
      onClick={(e) => {
        e.preventDefault();
        open('cart');
        publish('cart_viewed', {cart, prevCart, shop, url: window.location.href || ''} as CartViewPayload);
      }}
    >
      <span>Cart</span>
      <span className="popup-cart-count" data-empty={count === 0 ? '' : undefined}>
        {count}
      </span>
      <span className="sr-only">{count === 1 ? 'item' : 'items'}</span>
    </a>
  );
}
