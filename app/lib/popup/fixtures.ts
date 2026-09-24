import type {PopupConfig} from './types';
import {normalizeTheme} from './theme';

/**
 * Local-only sample pop-ups so the storefront runs against mock.shop
 * before the real store is linked. Enabled with POPUP_USE_FIXTURES="true".
 * Switch between them with ?popup=sample-quiet or ?popup=sample-loud.
 */
const inDays = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString();

export const FIXTURE_POPUPS: PopupConfig[] = [
  {
    handle: 'sample-quiet',
    name: 'Sample: Quiet Morning Capsule',
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
    theme: normalizeTheme({
      colors: {
        background: '#efe9df',
        foreground: '#2b2622',
        accent: '#3d5a73',
        accentForeground: '#ffffff',
        muted: '#7a7068',
        border: '#d8cfc2',
      },
      fonts: {
        display: '"Fraunces", Georgia, serif',
        body: '"Inter", system-ui, sans-serif',
        href: 'https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600&family=Inter:wght@400;500&display=swap',
      },
      radius: 999,
    }),
    maxPerOrder: 6,
    klaviyoListId: null,
  },
  {
    handle: 'sample-loud',
    name: 'Sample: Night Shift Drop',
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
        background: '#12161c',
        foreground: '#f2f2ee',
        accent: '#ffcc33',
        accentForeground: '#12161c',
        muted: '#9aa3ad',
        border: '#2a313b',
      },
      fonts: {
        display: '"Archivo Black", Impact, sans-serif',
        body: '"Archivo", system-ui, sans-serif',
        href: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Archivo:wght@400;500&display=swap',
      },
      radius: 0,
    }),
    maxPerOrder: 2,
    klaviyoListId: null,
  },
];
