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
} as const;

export function popupOrderAttributes(
  popup: Pick<PopupConfig, 'handle' | 'name' | 'logo' | 'mode' | 'theme'>,
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
  ];
  // Shopify rejects empty attribute values; leave unset ones out.
  return attrs.filter((a) => a.value.trim() !== '');
}
