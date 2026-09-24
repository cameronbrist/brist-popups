import {useLoaderData} from 'react-router';
import type {Route} from './+types/_index';
import {Image} from '@shopify/hydrogen';
import {ProductItem} from '~/components/ProductItem';
import {requirePopup} from '~/lib/popup.server';
import {usePopup} from '~/lib/usePopup';

export const meta: Route.MetaFunction = ({matches}) => {
  const root = matches.find((m) => m?.id === 'root')?.data as
    | {popup?: {name: string; intro: string | null}}
    | undefined;
  return [
    {title: root?.popup?.name ?? ''},
    {name: 'description', content: root?.popup?.intro ?? ''},
  ];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const {storefront} = context;
  const {popup} = await requirePopup(request, context);

  if (popup.collectionHandle) {
    const {collection} = await storefront.query(POPUP_COLLECTION_QUERY, {
      variables: {handle: popup.collectionHandle},
      cache: storefront.CacheShort(),
    });
    return {products: collection?.products.nodes ?? []};
  }

  // No collection set (sample fixtures on mock.shop): show recent products.
  const {products} = await storefront.query(POPUP_FALLBACK_PRODUCTS_QUERY, {
    cache: storefront.CacheShort(),
  });
  return {products: products.nodes};
}

export default function PopupHome() {
  const {products} = useLoaderData<typeof loader>();
  const {popup} = usePopup();

  return (
    <div className="popup-home">
      <section className="popup-hero">
        {popup.heroImage && (
          <div className="popup-hero-media">
            <Image
              data={popup.heroImage}
              alt={popup.heroImage.altText || ''}
              sizes="100vw"
              loading="eager"
            />
          </div>
        )}
        <div className="popup-hero-copy">
          <h1>{popup.headline ?? popup.name}</h1>
          {popup.intro && <p>{popup.intro}</p>}
        </div>
      </section>

      <section className="popup-products" aria-label="Products in this drop">
        {products.length ? (
          <div className="popup-product-grid">
            {products.map((product, i) => (
              <ProductItem
                key={product.id}
                product={product}
                loading={i < 4 ? 'eager' : 'lazy'}
              />
            ))}
          </div>
        ) : (
          <p className="popup-empty">
            Products for this drop haven&apos;t been added yet. Add them to the
            pop-up&apos;s collection in Shopify admin.
          </p>
        )}
      </section>
    </div>
  );
}

const POPUP_PRODUCT_FRAGMENT = `#graphql
  fragment PopupProduct on Product {
    id
    title
    handle
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    featuredImage {
      id
      url
      altText
      width
      height
    }
  }
` as const;

const POPUP_COLLECTION_QUERY = `#graphql
  ${POPUP_PRODUCT_FRAGMENT}
  query PopupCollection(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      products(first: 100, sortKey: MANUAL) {
        nodes {
          ...PopupProduct
        }
      }
    }
  }
` as const;

const POPUP_FALLBACK_PRODUCTS_QUERY = `#graphql
  ${POPUP_PRODUCT_FRAGMENT}
  query PopupFallbackProducts($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    products(first: 8, sortKey: UPDATED_AT, reverse: true) {
      nodes {
        ...PopupProduct
      }
    }
  }
` as const;
