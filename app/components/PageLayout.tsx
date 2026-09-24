import {Await} from 'react-router';
import {Suspense} from 'react';
import type {CartApiQueryFragment} from 'storefrontapi.generated';
import {Aside} from '~/components/Aside';
import {CartMain} from '~/components/CartMain';
import {PopupHeader} from '~/components/popup/PopupHeader';
import {PopupFooter} from '~/components/popup/PopupFooter';
import {DropBanner} from '~/components/popup/DropBanner';

interface PageLayoutProps {
  cart: Promise<CartApiQueryFragment | null>;
  children?: React.ReactNode;
}

export function PageLayout({cart, children = null}: PageLayoutProps) {
  return (
    <Aside.Provider>
      <CartAside cart={cart} />
      <DropBanner />
      <PopupHeader cart={cart} />
      <main>{children}</main>
      <PopupFooter />
    </Aside.Provider>
  );
}

function CartAside({cart}: {cart: PageLayoutProps['cart']}) {
  return (
    <Aside type="cart" heading="Your cart">
      <Suspense fallback={<p>Loading cart…</p>}>
        <Await resolve={cart}>
          {(cart) => <CartMain cart={cart} layout="aside" />}
        </Await>
      </Suspense>
    </Aside>
  );
}
