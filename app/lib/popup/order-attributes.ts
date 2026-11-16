import type {PopupConfig} from './types';

/**
 * Hidden order attributes that identify the pop-up an order came from.
 * Keys start with "_" so shoppers never see them at checkout.
 *
 * - _popup        handle; Flow turns it into the popup:<handle> order tag
 * - _popup_name   display name for emails
 * - _popup_logo   logo URL for emails (Shopify CDN)
 * - _popup_url    the pop-up's store address, for "visit the store" links
 * - _popup_color  accent color, for email buttons
 * - _popup_mode   preorder | in_stock | gift, so emails can adjust wording
 * - _popup_ship   the pop-up's ship message, for pre-order and gift emails
 *
 * Email templates read these directly, so they need no lookups.
 */
export const POPUP_ATTRIBUTE_KEYS = {
  handle: '_popup',
  name: '_popup_name',
  logo: '_popup_logo',
  url: '_popup_url',
  color: '_popup_color',
  mode: '_popup_mode',
  ship: '_popup_ship',
} as const;

export function popupOrderAttributes(
  popup: Pick<PopupConfig, 'handle' | 'name' | 'logo' | 'mode' | 'theme' | 'shipMessage'>,
  storeUrl: string,
): Array<{key: string; value: string}> {
  const k = POPUP_ATTRIBUTE_KEYS;
  const attrs = [
    {key: k.handle, value: popup.handle},
    {key: k.name, value: popup.name},
    {key: k.logo, value: popup.logo?.url ?? ''},
    {key: k.url, value: storeUrl},
    {key: k.color, value: popup.theme.colors.accent},
    {key: k.mode, value: popup.mode},
    // In-stock orders ship now, so they never carry a ship message.
    {key: k.ship, value: popup.mode === 'in_stock' ? '' : popup.shipMessage ?? ''},
  ];
  // Shopify rejects empty attribute values; leave unset ones out.
  return attrs.filter((a) => a.value.trim() !== '');
}

/**
 * True when a cart already carries exactly the pop-up attributes it should.
 * Any difference (a new ship message, a changed logo, a field that was
 * removed) means the cart gets re-stamped.
 */
export function popupAttributesMatch(
  current: Array<{key: string; value?: string | null}> | null | undefined,
  desired: Array<{key: string; value: string}>,
): boolean {
  const ours = new Set<string>(Object.values(POPUP_ATTRIBUTE_KEYS));
  const have = new Map(
    (current ?? []).filter((a) => ours.has(a.key)).map((a) => [a.key, a.value ?? '']),
  );
  if (have.size !== desired.length) return false;
  return desired.every((d) => have.get(d.key) === d.value);
}
