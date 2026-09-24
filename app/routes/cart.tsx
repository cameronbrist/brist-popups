import {useLoaderData, data, type HeadersFunction} from 'react-router';
import type {Route} from './+types/cart';
import type {CartQueryDataReturn} from '@shopify/hydrogen';
import {CartForm} from '@shopify/hydrogen';
import {CartMain} from '~/components/CartMain';
import {
  POPUP_CART_ATTRIBUTE,
  belongsToPopup,
  requirePopup,
} from '~/lib/popup.server';
import {checkOrderLimit} from '~/lib/popup';

export const meta: Route.MetaFunction = () => {
  return [{title: 'Cart'}];
};

export const headers: HeadersFunction = ({actionHeaders}) => actionHeaders;

export async function action({request, context}: Route.ActionArgs) {
  const {cart} = context;

  const formData = await request.formData();

  const {action, inputs} = CartForm.getFormInput(formData);

  if (!action) {
    throw new Error('No action provided');
  }

  let status = 200;
  let result!: CartQueryDataReturn;

  // Server-side drop rules. The UI disables buttons too, but this is the
  // source of truth: a closed drop or an over-limit cart never gets through.
  if (
    action === CartForm.ACTIONS.LinesAdd ||
    action === CartForm.ACTIONS.LinesUpdate
  ) {
    const {popup, drop} = await requirePopup(request, context);
    const current = await cart.get();

    const reject = (message: string) =>
      data(
        {cart: current, errors: [{message}], warnings: [], analytics: {}},
        {status: 400},
      );

    if (!drop.canPurchase) {
      return reject(
        drop.phase === 'upcoming'
          ? 'This drop is not open yet.'
          : 'This drop is closed.',
      );
    }

    const currentQty = current?.totalQuantity ?? 0;
    let delta = 0;
    if (action === CartForm.ACTIONS.LinesAdd) {
      const lines = inputs.lines as Array<{merchandiseId: string; quantity?: number}>;
      delta = lines.reduce((sum, l) => sum + (l.quantity ?? 1), 0);

      const allowed = await variantsBelongToPopup(
        context,
        lines.map((l) => l.merchandiseId),
        popup,
      );
      if (!allowed) return reject('That item is not part of this drop.');
    } else {
      const lines = inputs.lines as Array<{id: string; quantity?: number}>;
      for (const l of lines) {
        const existing = current?.lines.nodes.find((n) => n.id === l.id);
        if (existing && l.quantity !== undefined) delta += l.quantity - existing.quantity;
      }
    }

    const limitError = delta > 0 ? checkOrderLimit(popup, currentQty, delta) : null;
    if (limitError) return reject(limitError);

    result =
      action === CartForm.ACTIONS.LinesAdd
        ? await cart.addLines(inputs.lines)
        : await cart.updateLines(inputs.lines);

    // Tag the cart with its pop-up. Carries through to the order as a note
    // attribute; Shopify Flow turns it into an order tag for ShipHero.
    const tagged = result.cart?.attributes?.some(
      (a) => a.key === POPUP_CART_ATTRIBUTE && a.value === popup.handle,
    );
    if (result.cart?.id && !tagged) {
      result = await cart.updateAttributes(
        [{key: POPUP_CART_ATTRIBUTE, value: popup.handle}],
        {cartId: result.cart.id},
      );
    }
  }

  switch (action) {
    case CartForm.ACTIONS.LinesAdd:
    case CartForm.ACTIONS.LinesUpdate:
      // Handled above.
      break;
    case CartForm.ACTIONS.LinesRemove:
      result = await cart.removeLines(inputs.lineIds);
      break;
    case CartForm.ACTIONS.DiscountCodesUpdate: {
      const formDiscountCode = inputs.discountCode;

      // User inputted discount code
      const discountCodes = (
        formDiscountCode ? [formDiscountCode] : []
      ) as string[];

      // Combine discount codes already applied on cart
      discountCodes.push(...inputs.discountCodes);

      result = await cart.updateDiscountCodes(discountCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesAdd: {
      const formGiftCardCode = inputs.giftCardCode;

      const giftCardCodes = (
        formGiftCardCode ? [formGiftCardCode] : []
      ) as string[];

      result = await cart.addGiftCardCodes(giftCardCodes);
      break;
    }
    case CartForm.ACTIONS.GiftCardCodesRemove: {
      const appliedGiftCardIds = inputs.giftCardCodes as string[];
      result = await cart.removeGiftCardCodes(appliedGiftCardIds);
      break;
    }
    case CartForm.ACTIONS.BuyerIdentityUpdate: {
      result = await cart.updateBuyerIdentity({
        ...inputs.buyerIdentity,
      });
      break;
    }
    default:
      throw new Error(`${action} cart action is not defined`);
  }

  const cartId = result?.cart?.id;
  const headers = cartId ? cart.setCartId(result.cart.id) : new Headers();
  const {cart: cartResult, errors, warnings} = result;

  const redirectTo = formData.get('redirectTo') ?? null;
  if (typeof redirectTo === 'string') {
    status = 303;
    headers.set('Location', redirectTo);
  }

  return data(
    {
      cart: cartResult,
      errors,
      warnings,
      analytics: {
        cartId,
      },
    },
    {status, headers},
  );
}

export async function loader({context}: Route.LoaderArgs) {
  const {cart} = context;
  return await cart.get();
}

export default function Cart() {
  const cart = useLoaderData<typeof loader>();

  return (
    <div className="cart">
      <h1>Cart</h1>
      <CartMain layout="page" cart={cart} />
    </div>
  );
}

const VARIANT_COLLECTIONS_QUERY = `#graphql
  query PopupVariantCollections($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        product {
          collections(first: 50) {
            nodes {
              handle
            }
          }
        }
      }
    }
  }
` as const;

async function variantsBelongToPopup(
  context: Route.ActionArgs['context'],
  variantIds: string[],
  popup: Awaited<ReturnType<typeof requirePopup>>['popup'],
) {
  if (!popup.collectionHandle) return true;
  const {nodes} = await context.storefront.query(VARIANT_COLLECTIONS_QUERY, {
    variables: {ids: variantIds},
    cache: context.storefront.CacheShort(),
  });
  return nodes.every((node) => {
    if (!node || !('product' in node)) return false;
    return belongsToPopup(
      popup,
      node.product.collections.nodes.map((c) => c.handle),
    );
  });
}
