import {useState} from 'react';
import {Link, useNavigate} from 'react-router';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import type {ProductFragment} from 'storefrontapi.generated';
import {usePopup} from '~/lib/usePopup';

export function ProductForm({
  productOptions,
  selectedVariant,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const navigate = useNavigate();
  const {open} = useAside();
  const {popup, drop} = usePopup();
  const [quantity, setQuantity] = useState(1);
  const available = Boolean(selectedVariant?.availableForSale);
  const max = popup.maxPerOrder ?? 99;

  let label = 'Sold out';
  if (drop.phase === 'upcoming') label = 'Opens soon';
  else if (drop.phase === 'closed') label = 'Drop closed';
  else if (available) label = popup.mode === 'preorder' ? 'Pre-order' : 'Add to cart';

  const canBuy = available && drop.canPurchase;

  return (
    <div className="product-form">
      {productOptions.map((option) => {
        if (option.optionValues.length === 1) return null;
        const current = option.optionValues.find((v) => v.selected)?.name;
        const isSwatch = option.optionValues.some((v) => v.swatch?.color || v.swatch?.image);

        return (
          <fieldset className="product-option" key={option.name}>
            <legend>
              {option.name}
              {current && <span className="product-option-current">{current}</span>}
            </legend>
            <div className={`product-option-values${isSwatch ? ' is-swatch' : ''}`}>
              {option.optionValues.map((value) => {
                const {name, handle, variantUriQuery, selected, available, exists, isDifferentProduct, swatch} =
                  value;
                const common = {
                  className: 'product-option-value',
                  'data-selected': selected ? '' : undefined,
                  'data-unavailable': available ? undefined : '',
                  'aria-label': name,
                  title: available ? name : `${name} (sold out)`,
                };

                if (isDifferentProduct) {
                  return (
                    <Link
                      {...common}
                      key={option.name + name}
                      prefetch="intent"
                      preventScrollReset
                      replace
                      to={`/products/${handle}?${variantUriQuery}`}
                    >
                      <OptionLabel swatch={swatch} name={name} />
                    </Link>
                  );
                }
                return (
                  <button
                    {...common}
                    type="button"
                    key={option.name + name}
                    aria-pressed={selected}
                    disabled={!exists}
                    onClick={() => {
                      if (!selected) {
                        void navigate(`?${variantUriQuery}`, {replace: true, preventScrollReset: true});
                      }
                    }}
                  >
                    <OptionLabel swatch={swatch} name={name} />
                  </button>
                );
              })}
            </div>
          </fieldset>
        );
      })}

      <div className="product-buy">
        <div className="quantity-stepper" aria-label="Quantity">
          <button
            type="button"
            className="reset"
            aria-label="Decrease quantity"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Minus />
          </button>
          <span aria-live="polite">{quantity}</span>
          <button
            type="button"
            className="reset"
            aria-label="Increase quantity"
            disabled={quantity >= max}
            onClick={() => setQuantity((q) => Math.min(max, q + 1))}
          >
            <Plus />
          </button>
        </div>
        <AddToCartButton
          disabled={!canBuy}
          onClick={() => open('cart')}
          lines={selectedVariant ? [{merchandiseId: selectedVariant.id, quantity, selectedVariant}] : []}
        >
          {label}
        </AddToCartButton>
      </div>
      {popup.maxPerOrder && canBuy ? (
        <p className="product-limit">Limit {popup.maxPerOrder} per order</p>
      ) : null}
    </div>
  );
}

function OptionLabel({swatch, name}: {swatch?: Maybe<ProductOptionValueSwatch>; name: string}) {
  const image = swatch?.image?.previewImage?.url;
  const color = swatch?.color;
  if (!image && !color) return <>{name}</>;
  return (
    <span className="product-option-swatch" style={{backgroundColor: color || 'transparent'}}>
      {image && <img src={image} alt="" />}
    </span>
  );
}

const Minus = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
    <path d="M2 7h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
const Plus = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
    <path d="M2 7h10M7 2v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);
