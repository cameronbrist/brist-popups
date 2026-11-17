import type {PopupConfig} from './types';

/**
 * The browser-tab icon for a pop-up.
 * 1. The pop-up's own Favicon image, sized down by Shopify's CDN.
 * 2. Otherwise, a letter icon from the pop-up's name in its accent color,
 *    so no pop-up ever shows a generic or another brand's icon.
 */
export function popupFavicon(
  popup: Pick<PopupConfig, 'name' | 'favicon' | 'theme'>,
): {href: string; type: string} {
  if (popup.favicon?.url) {
    return {href: sizedImageUrl(popup.favicon.url, 96), type: guessType(popup.favicon.url)};
  }
  return {href: letterFavicon(popup.name, popup.theme.colors.accent, popup.theme.colors.accentForeground), type: 'image/svg+xml'};
}

function sizedImageUrl(url: string, size: number): string {
  try {
    const u = new URL(url);
    // Shopify's CDN resizes on the fly; SVGs are left alone.
    if (!u.pathname.toLowerCase().endsWith('.svg')) {
      u.searchParams.set('width', String(size));
      u.searchParams.set('height', String(size));
      u.searchParams.set('crop', 'center');
    }
    return u.toString();
  } catch {
    return url;
  }
}

function guessType(url: string): string {
  const path = url.split('?')[0].toLowerCase();
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.ico')) return 'image/x-icon';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.webp')) return 'image/webp';
  return 'image/png';
}

/** A rounded square with the first letter of the name. Colors are pre-validated theme values. */
export function letterFavicon(name: string, background: string, foreground: string): string {
  const letter = (name.trim().match(/[\p{L}\p{N}]/u)?.[0] ?? 'B').toUpperCase();
  const safe = letter.replace(/[<>&"']/g, '');
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" rx="14" fill="${background}"/>` +
    `<text x="32" y="44" text-anchor="middle" font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif" ` +
    `font-size="38" font-weight="700" fill="${foreground}">${safe}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
