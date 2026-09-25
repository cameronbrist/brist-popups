import type {PopupConfig} from './types';
import {DEFAULT_THEME, normalizeTheme} from './theme';

/**
 * Local-only sample pop-ups so the storefront runs against mock.shop
 * before the real store is linked. Enabled with POPUP_USE_FIXTURES="true".
 * Switch between them with ?popup=sample-quiet or ?popup=sample-loud.
 */
const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

export const FIXTURE_POPUPS: PopupConfig[] = [
  {
    handle: 'sample-quiet',
    name: 'Sample Spruce Capsule',
    status: 'active',
    domains: ['localhost'],
    collectionHandle: null,
    opensAt: inDays(-1),
    closesAt: inDays(6),
    mode: 'preorder',
    shipMessage: 'Made to order. Ships about three weeks after the drop closes.',
    headline: 'The fall capsule is open for seven days.',
    intro: 'Four pieces, made to order in small runs. When the window closes, it is gone.',
    logo: null,
    heroImage: null,
    layout: 'editorial',
    theme: DEFAULT_THEME,
    maxPerOrder: 6,
    klaviyoListId: null,
  },
  {
    handle: 'sample-loud',
    name: 'Sample Fog Drop',
    status: 'active',
    domains: [],
    collectionHandle: null,
    opensAt: inDays(2),
    closesAt: inDays(9),
    mode: 'in_stock',
    shipMessage: null,
    headline: 'Drop 02 lands soon.',
    intro: 'Limited quantities. Join the list to get the link first.',
    logo: null,
    heroImage: null,
    layout: 'grid',
    theme: normalizeTheme({
      colors: {
        background: '#dde6ea',
        foreground: '#102a3a',
        accent: '#e8452c',
        accentForeground: '#ffffff',
        muted: '#4f6675',
        border: '#bfccd3',
      },
      fonts: {
        display: '"Archivo Black", Impact, sans-serif',
        body: '"Archivo", system-ui, sans-serif',
        href: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500;600&display=swap',
      },
      radius: 0,
    }),
    maxPerOrder: 2,
    klaviyoListId: null,
  },
];
