/**
 * Pop-up store config. One of these per pop-up, stored as a
 * `popup_store` metaobject in the Brist pop-up store admin.
 *
 * Framework-agnostic on purpose: nothing in app/lib/popup imports
 * Hydrogen or React Router, so this logic survives a framework change.
 */

export type PopupStatus = 'draft' | 'active' | 'archived';
export type PopupMode = 'preorder' | 'in_stock';
export type PopupLayout = 'classic' | 'editorial' | 'grid';

export interface PopupImage {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
}

export interface PopupTheme {
  colors: {
    background: string;
    foreground: string;
    accent: string;
    accentForeground: string;
    muted: string;
    border: string;
  };
  fonts: {
    display: string;
    body: string;
    /** Optional Google Fonts stylesheet URL for the families above. */
    href?: string | null;
  };
  /** Corner radius in px for buttons and inputs. */
  radius: number;
}

export interface PopupConfig {
  handle: string;
  name: string;
  status: PopupStatus;
  /** Hostnames that serve this pop-up, e.g. ["shop.slowmornings.com"]. */
  domains: string[];
  /** Handle of the Shopify collection holding this pop-up's products. */
  collectionHandle: string | null;
  opensAt: string | null; // ISO 8601
  closesAt: string | null; // ISO 8601
  mode: PopupMode;
  /** Shown on product pages in pre-order mode, e.g. "Ships the week of Nov 10". */
  shipMessage: string | null;
  headline: string | null;
  intro: string | null;
  logo: PopupImage | null;
  heroImage: PopupImage | null;
  layout: PopupLayout;
  theme: PopupTheme;
  /** 0 or null = no limit. Enforced server-side in the cart action. */
  maxPerOrder: number | null;
  klaviyoListId: string | null;
}
