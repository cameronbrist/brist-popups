import type {PopupConfig} from './types';

/**
 * Is a product (given the handles of the collections it belongs to) part of
 * this pop-up? All pop-ups share one Shopify store, so this is what keeps one
 * client's products off another client's pop-up.
 *
 * Fails closed: a pop-up with no collection has no products. The only
 * exception is the local sample pop-ups (allowUnscoped), which run against
 * mock.shop and never on Oxygen.
 */
export function isInPopup(
  popup: Pick<PopupConfig, 'collectionHandle'>,
  collectionHandles: string[],
  {allowUnscoped = false}: {allowUnscoped?: boolean} = {},
): boolean {
  if (!popup.collectionHandle) return allowUnscoped;
  return collectionHandles.includes(popup.collectionHandle);
}
