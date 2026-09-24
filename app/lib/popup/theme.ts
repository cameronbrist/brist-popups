import type {PopupTheme} from './types';

export const DEFAULT_THEME: PopupTheme = {
  colors: {
    background: '#ffffff',
    foreground: '#1a1a1a',
    accent: '#1a1a1a',
    accentForeground: '#ffffff',
    muted: '#6b6b6b',
    border: '#e4e4e4',
  },
  fonts: {
    display: 'system-ui, sans-serif',
    body: 'system-ui, sans-serif',
    href: null,
  },
  radius: 4,
};

const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|hsla?\([\d\s.,%deg]+\))$/i;
const FONT_RE = /^[\w\s"',.-]+$/;
const FONT_HREF_RE = /^https:\/\/fonts\.googleapis\.com\/css2?\?[\w\-=&:;@,.+%]+$/;

function color(value: unknown, fallback: string): string {
  return typeof value === 'string' && COLOR_RE.test(value.trim()) ? value.trim() : fallback;
}

function font(value: unknown, fallback: string): string {
  return typeof value === 'string' && FONT_RE.test(value.trim()) ? value.trim() : fallback;
}

/**
 * Builds a safe PopupTheme from untrusted JSON (the metaobject's `theme` field).
 * Anything malformed falls back to the default, so a typo in the admin can
 * never inject CSS or break the page.
 */
export function normalizeTheme(raw: unknown): PopupTheme {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>;
  const c = (r.colors ?? {}) as Record<string, unknown>;
  const f = (r.fonts ?? {}) as Record<string, unknown>;
  const d = DEFAULT_THEME;
  const radius = Number(r.radius);

  return {
    colors: {
      background: color(c.background, d.colors.background),
      foreground: color(c.foreground, d.colors.foreground),
      accent: color(c.accent, d.colors.accent),
      accentForeground: color(c.accentForeground, d.colors.accentForeground),
      muted: color(c.muted, d.colors.muted),
      border: color(c.border, d.colors.border),
    },
    fonts: {
      display: font(f.display, d.fonts.display),
      body: font(f.body, d.fonts.body),
      href: typeof f.href === 'string' && FONT_HREF_RE.test(f.href) ? f.href : null,
    },
    radius: Number.isFinite(radius) ? Math.min(40, Math.max(0, radius)) : d.radius,
  };
}

/** Theme -> CSS custom properties consumed by app/styles/popup.css. */
export function themeToCss(theme: PopupTheme): string {
  const {colors: c, fonts: f} = theme;
  return `:root{--popup-bg:${c.background};--popup-fg:${c.foreground};--popup-accent:${c.accent};--popup-accent-fg:${c.accentForeground};--popup-muted:${c.muted};--popup-border:${c.border};--popup-font-display:${f.display};--popup-font-body:${f.body};--popup-radius:${theme.radius}px;}`;
}
