import {Link} from 'react-router';
import {Image, Money} from '@shopify/hydrogen';
import type {PopupProductFragment} from 'storefrontapi.generated';
import {useVariantUrl} from '~/lib/variants';

export function ProductItem({
  product,
  loading,
}: {
  product: PopupProductFragment;
  loading?: 'eager' | 'lazy';
}) {
  const variantUrl = useVariantUrl(product.handle);
  const [primary, secondary] = product.images.nodes;
  const sizes = '(min-width: 64em) 30vw, (min-width: 40em) 45vw, 50vw';

  return (
    <Link className="product-item" prefetch="intent" to={variantUrl}>
      <div className="product-item-media" data-has-alt={secondary ? '' : undefined}>
        {primary && (
          <Image
            alt={primary.altText || product.title}
            aspectRatio="4/5"
            crop="center"
            data={primary}
            loading={loading}
            sizes={sizes}
          />
        )}
        {secondary && (
          <Image
            alt=""
            aria-hidden
            aspectRatio="4/5"
            crop="center"
            className="product-item-alt"
            data={secondary}
            loading="lazy"
            sizes={sizes}
          />
        )}
        {!product.availableForSale && <span className="product-item-flag">Sold out</span>}
      </div>
      <div className="product-item-meta">
        <span className="product-item-title">{product.title}</span>
        <Money className="product-item-price" data={product.priceRange.minVariantPrice} />
      </div>
    </Link>
  );
}
