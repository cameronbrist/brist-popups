import {describe, expect, it} from 'vitest';
import {checkOrderLimit, getDropState, maxCacheSeconds} from './drop-state';
import {matchPopup, normalizeHost, parsePopup} from './parse';
import {DEFAULT_THEME, normalizeTheme, themeToCss} from './theme';
import {FIXTURE_POPUPS} from './fixtures';

const now = new Date('2026-10-10T12:00:00Z');
const base = {status: 'active' as const, opensAt: '2026-10-11T16:00:00Z', closesAt: '2026-10-18T16:00:00Z'};

describe('getDropState', () => {
  it('is upcoming before open', () => {
    expect(getDropState(base, now)).toEqual({phase: 'upcoming', nextChangeAt: base.opensAt, canPurchase: false});
  });
  it('is live inside the window', () => {
    const s = getDropState(base, new Date('2026-10-12T00:00:00Z'));
    expect(s.phase).toBe('live');
    expect(s.canPurchase).toBe(true);
    expect(s.nextChangeAt).toBe(base.closesAt);
  });
  it('is closed at and after close', () => {
    expect(getDropState(base, new Date(base.closesAt)).phase).toBe('closed');
  });
  it('is closed when not active, regardless of dates', () => {
    expect(getDropState({...base, status: 'draft'}, new Date('2026-10-12T00:00:00Z')).phase).toBe('closed');
  });
  it('is live indefinitely with no dates', () => {
    expect(getDropState({status: 'active', opensAt: null, closesAt: null}, now)).toEqual({
      phase: 'live',
      nextChangeAt: null,
      canPurchase: true,
    });
  });
  it('ignores unparseable dates', () => {
    expect(getDropState({status: 'active', opensAt: 'nope', closesAt: null}, now).phase).toBe('live');
  });
});

describe('maxCacheSeconds', () => {
  it('never caches past the next phase change', () => {
    const s = getDropState({...base, opensAt: '2026-10-10T12:01:00Z'}, now);
    expect(maxCacheSeconds(s, now)).toBe(60);
  });
  it('uses the ceiling when nothing is scheduled', () => {
    expect(maxCacheSeconds(getDropState({status: 'active', opensAt: null, closesAt: null}, now), now)).toBe(300);
  });
});

describe('checkOrderLimit', () => {
  it('allows anything with no limit', () => {
    expect(checkOrderLimit({maxPerOrder: null}, 50, 50)).toBeNull();
  });
  it('blocks going over the limit', () => {
    expect(checkOrderLimit({maxPerOrder: 2}, 1, 2)).toMatch(/limit of 2 items/);
    expect(checkOrderLimit({maxPerOrder: 2}, 1, 1)).toBeNull();
    expect(checkOrderLimit({maxPerOrder: 1}, 1, 1)).toMatch(/limit of 1 item per/);
  });
});

describe('theme', () => {
  it('falls back on malformed input', () => {
    expect(normalizeTheme(null)).toEqual(DEFAULT_THEME);
    expect(normalizeTheme({colors: {background: 'red;}</style><script>'}}).colors.background).toBe(
      DEFAULT_THEME.colors.background,
    );
  });
  it('rejects non-Google font stylesheets', () => {
    expect(normalizeTheme({fonts: {href: 'https://evil.example/x.css'}}).fonts.href).toBeNull();
  });
  it('clamps radius and emits CSS variables', () => {
    const t = normalizeTheme({radius: 999, colors: {accent: '#ff0000'}});
    expect(t.radius).toBe(40);
    expect(themeToCss(t)).toContain('--popup-accent:#ff0000');
    expect(themeToCss(t)).not.toContain('<');
  });
});

describe('parsePopup + matchPopup', () => {
  const node = {
    handle: 'slow-mornings-fall',
    fields: [
      {key: 'name', value: 'Slow Mornings Fall'},
      {key: 'status', value: 'Active'},
      {key: 'domains', value: '["Shop.SlowMornings.com", "www.fall.example.com:443"]'},
      {key: 'mode', value: 'Pre-order'},
      {key: 'max_per_order', value: '4'},
      {key: 'theme', value: '{"colors":{"accent":"#3d5a73"}}'},
      {key: 'collection', value: 'gid://shopify/Collection/1', reference: {handle: 'sm-fall-capsule'}},
    ],
  };
  const popup = parsePopup(node);

  it('parses and normalizes fields', () => {
    expect(popup.status).toBe('active');
    expect(popup.mode).toBe('preorder');
    expect(popup.domains).toEqual(['shop.slowmornings.com', 'fall.example.com']);
    expect(popup.collectionHandle).toBe('sm-fall-capsule');
    expect(popup.maxPerOrder).toBe(4);
    expect(popup.theme.colors.accent).toBe('#3d5a73');
    expect(popup.layout).toBe('classic');
  });

  it('matches by host, override, then default', () => {
    const all = [popup, ...FIXTURE_POPUPS];
    expect(matchPopup(all, 'www.shop.slowmornings.com')?.handle).toBe('slow-mornings-fall');
    expect(matchPopup(all, 'shop.slowmornings.com', {overrideHandle: 'sample-loud'})?.handle).toBe('sample-loud');
    expect(matchPopup(all, 'unknown.example.com')).toBeNull();
    expect(matchPopup(all, 'unknown.example.com', {defaultHandle: 'sample-quiet'})?.handle).toBe('sample-quiet');
    expect(normalizeHost('LOCALHOST:3000')).toBe('localhost');
  });
});
