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
  const image = product.featuredImage;
  return (
    <Link className="product-item" prefetch="intent" to={variantUrl}>
      {image && (
        <Image
          alt={image.altText || product.title}
          aspectRatio="4/5"
          data={image}
          loading={loading}
          sizes="(min-width: 45em) 400px, 50vw"
        />
      )}
      <span className="product-item-title">{product.title}</span>
      <span className="product-item-price">
        <Money data={product.priceRange.minVariantPrice} />
      </span>
    </Link>
  );
}
