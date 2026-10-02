import {describe, expect, it} from 'vitest';
import {checkItemLimit, checkOrderLimit, getDropState, maxCacheSeconds, orderLimit} from './drop-state';
import {matchPopup, normalizeHost, parsePopup} from './parse';
import {DEFAULT_THEME, normalizeTheme, themeToCss} from './theme';
import {FIXTURE_POPUPS} from './fixtures';
import {buyLabel, giftProgress, limitHint, popupCopy} from './copy';
import {isInPopup} from './scope';
import {popupOrderAttributes} from './order-attributes';

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
    const href = normalizeTheme({fonts: {href: 'https://evil.example/x.css'}}).fonts.href;
    expect(href).not.toContain('evil.example');
    expect(normalizeTheme({fonts: {display: 'Custom', href: 'https://evil.example/x.css'}}).fonts.href).toBeNull();
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

describe('domains field formats', () => {
  it('accepts comma-separated plain text', () => {
    const p = parsePopup({
      handle: 'x',
      fields: [{key: 'domains', value: 'shop.example.com, www.Drops.example.com'}],
    });
    expect(p.domains).toEqual(['shop.example.com', 'drops.example.com']);
  });
});

describe('gift mode', () => {
  it('parses gift mode', () => {
    expect(parsePopup({handle: 'g', fields: [{key: 'mode', value: 'Gift'}]}).mode).toBe('gift');
  });
  it('defaults to one gift per order', () => {
    expect(orderLimit({maxPerOrder: null, mode: 'gift'})).toBe(1);
    expect(orderLimit({maxPerOrder: 2, mode: 'gift'})).toBe(2);
    expect(orderLimit({maxPerOrder: null, mode: 'preorder'})).toBeNull();
  });
  it('explains the gift limit in plain terms', () => {
    expect(checkOrderLimit({maxPerOrder: null, mode: 'gift'}, 1, 1)).toMatch(/choose one gift/);
    expect(checkOrderLimit({maxPerOrder: null, mode: 'gift'}, 0, 1)).toBeNull();
  });
  it('hides prices and quantity, keeps the ship message', () => {
    const c = popupCopy({mode: 'gift', shipMessage: 'Ships Dec 8.'});
    expect(c.showPrices).toBe(false);
    expect(c.showQuantity).toBe(false);
    expect(c.showShipMessage).toBe(true);
    expect(c.checkoutNote).toContain('No payment needed');
  });
  it('labels the buy button by phase', () => {
    expect(buyLabel({mode: 'gift'}, {phase: 'live'}, true)).toBe('Choose this gift');
    expect(buyLabel({mode: 'gift'}, {phase: 'live'}, false)).toBe('All claimed');
    expect(buyLabel({mode: 'gift'}, {phase: 'closed'}, true)).toBe('Gift selection closed');
    expect(buyLabel({mode: 'preorder'}, {phase: 'live'}, true)).toBe('Pre-order');
  });
  it('in-stock drops never show a ship message', () => {
    expect(popupCopy({mode: 'in_stock', shipMessage: 'x'}).showShipMessage).toBe(false);
  });
});

describe('product scoping', () => {
  it('a pop-up with no collection has no products', () => {
    expect(isInPopup({collectionHandle: null}, ['anything'])).toBe(false);
    expect(isInPopup({collectionHandle: null}, [])).toBe(false);
  });
  it('only local samples may skip scoping', () => {
    expect(isInPopup({collectionHandle: null}, [], {allowUnscoped: true})).toBe(true);
  });
  it('matches on the pop-up collection only', () => {
    expect(isInPopup({collectionHandle: 'kk-drop-2'}, ['kk-drop-2', 'all'])).toBe(true);
    expect(isInPopup({collectionHandle: 'kk-drop-2'}, ['slow-mornings'])).toBe(false);
  });
});

describe('order attributes for emails', () => {
  const popup = parsePopup({
    handle: 'kk-drop-2',
    fields: [
      {key: 'name', value: 'Kim Komando Drop 2'},
      {key: 'mode', value: 'preorder'},
      {key: 'theme', value: '{"colors":{"accent":"#0a84ff"}}'},
      {key: 'logo', value: 'gid://x', reference: {image: {url: 'https://cdn.shopify.com/kk.png', altText: null, width: 1, height: 1}}},
    ],
  });
  it('stamps handle, name, logo, url, color and mode', () => {
    const a = Object.fromEntries(popupOrderAttributes(popup, 'https://kimkomando.brist.store').map((x) => [x.key, x.value]));
    expect(a).toEqual({
      _popup: 'kk-drop-2',
      _popup_name: 'Kim Komando Drop 2',
      _popup_logo: 'https://cdn.shopify.com/kk.png',
      _popup_url: 'https://kimkomando.brist.store',
      _popup_color: '#0a84ff',
      _popup_mode: 'preorder',
    });
  });
  it('leaves out empty values', () => {
    const keys = popupOrderAttributes({...popup, logo: null}, 'https://x.brist.store').map((x) => x.key);
    expect(keys).not.toContain('_popup_logo');
  });
});

describe('per-item limits', () => {
  const lines = (...q: Array<[string, number]>) => q.map(([productId, quantity]) => ({productId, quantity}));
  it('counts sizes of the same product together', () => {
    expect(checkItemLimit({maxPerItem: 1, mode: 'gift'}, lines(['hoodie', 1], ['hoodie', 1]))).toMatch(/already chosen/);
    expect(checkItemLimit({maxPerItem: 1, mode: 'gift'}, lines(['hoodie', 1], ['hat', 1]))).toBeNull();
  });
  it('explains limits above one', () => {
    expect(checkItemLimit({maxPerItem: 2, mode: 'gift'}, lines(['hat', 3]))).toMatch(/up to 2 of each/);
    expect(checkItemLimit({maxPerItem: 2, mode: 'preorder'}, lines(['hat', 3]))).toBe('Limit 2 per item.');
  });
  it('no limit when unset', () => {
    expect(checkItemLimit({maxPerItem: null}, lines(['hat', 50]))).toBeNull();
  });
  it('parses max_per_item', () => {
    expect(parsePopup({handle: 'x', fields: [{key: 'max_per_item', value: '1'}]}).maxPerItem).toBe(1);
  });
});

describe('limit hints', () => {
  it('gift hints', () => {
    expect(limitHint({mode: 'gift', maxPerOrder: 3, maxPerItem: 1})).toBe('Choose up to 3 gifts, one of each.');
    expect(limitHint({mode: 'gift', maxPerOrder: 3, maxPerItem: null})).toBe('Choose up to 3 gifts.');
    expect(limitHint({mode: 'gift', maxPerOrder: null, maxPerItem: null})).toBeNull();
  });
  it('drop hints', () => {
    expect(limitHint({mode: 'preorder', maxPerOrder: 6, maxPerItem: 2})).toBe('Limit 6 per order, 2 per item.');
    expect(limitHint({mode: 'preorder', maxPerOrder: null, maxPerItem: 1})).toBe('Limit 1 per item.');
  });
  it('gift progress', () => {
    expect(giftProgress({mode: 'gift', maxPerOrder: 3, maxPerItem: 1}, 2)).toEqual({text: '2 of 3 gifts chosen', canChooseMore: true});
    expect(giftProgress({mode: 'gift', maxPerOrder: 3, maxPerItem: 1}, 3)?.canChooseMore).toBe(false);
    expect(giftProgress({mode: 'gift', maxPerOrder: 1, maxPerItem: null}, 1)).toBeNull();
  });
});

describe('gift wording with several gifts', () => {
  it('pluralizes the drawer', () => {
    expect(popupCopy({mode: 'gift', shipMessage: null, maxPerOrder: 3}).cartTitle).toBe('Your gifts');
    expect(popupCopy({mode: 'gift', shipMessage: null, maxPerOrder: null}).cartTitle).toBe('Your gift');
    expect(popupCopy({mode: 'preorder', shipMessage: null, maxPerOrder: 3}).cartTitle).toBe('Your cart');
  });
});
