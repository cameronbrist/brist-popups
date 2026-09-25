import type {PopupConfig, PopupImage, PopupLayout, PopupMode, PopupStatus} from './types';
import {normalizeTheme} from './theme';

/** Shape of a metaobject node as returned by POPUP_STORES_QUERY. */
export interface MetaobjectNode {
  handle: string;
  fields: Array<{
    key: string;
    value: string | null;
    reference?: {
      __typename?: string;
      handle?: string;
      image?: PopupImage | null;
    } | null;
  }>;
}

const STATUSES: PopupStatus[] = ['draft', 'active', 'archived'];
const MODES: PopupMode[] = ['preorder', 'in_stock'];
const LAYOUTS: PopupLayout[] = ['classic', 'editorial', 'grid'];

function pick<T extends string>(value: string | null | undefined, allowed: T[], fallback: T): T {
  // Tolerant of admin-entered variations: "Pre-order", "pre_order", "PREORDER"
  const squash = (s: string) => s.toLowerCase().replace(/[\s_-]+/g, '');
  const key = squash(value ?? '');
  return allowed.find((a) => squash(a) === key) ?? fallback;
}

function json(value: string | null | undefined): unknown {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/:\d+$/, '').replace(/^www\./, '');
}

/** Converts a raw metaobject into a validated PopupConfig. */
export function parsePopup(node: MetaobjectNode): PopupConfig {
  const f = new Map(node.fields.map((field) => [field.key, field]));
  const val = (k: string) => f.get(k)?.value ?? null;
  const ref = (k: string) => f.get(k)?.reference ?? null;

  // Accepts a list field (JSON array) or a plain single-line field with
  // comma-separated hostnames, since both are easy to create in the admin.
  const domainsRaw = json(val('domains'));
  const domainList = Array.isArray(domainsRaw)
    ? domainsRaw.filter((d): d is string => typeof d === 'string')
    : (val('domains') ?? '').split(',');
  const domains = domainList.map(normalizeHost).filter(Boolean);

  const max = Number(val('max_per_order'));

  return {
    handle: node.handle,
    name: val('name') ?? node.handle,
    status: pick(val('status'), STATUSES, 'draft'),
    domains,
    collectionHandle: ref('collection')?.handle ?? null,
    opensAt: val('opens_at'),
    closesAt: val('closes_at'),
    mode: pick(val('mode'), MODES, 'in_stock'),
    shipMessage: val('ship_message'),
    headline: val('headline'),
    intro: val('intro'),
    logo: ref('logo')?.image ?? null,
    heroImage: ref('hero_image')?.image ?? null,
    layout: pick(val('layout'), LAYOUTS, 'classic'),
    theme: normalizeTheme(json(val('theme'))),
    maxPerOrder: Number.isFinite(max) && max > 0 ? Math.floor(max) : null,
    klaviyoListId: val('klaviyo_list_id'),
  };
}

/**
 * Picks the pop-up for a request.
 * 1. An explicit override handle (preview environments only)
 * 2. A pop-up whose `domains` list contains the request host
 * 3. The default handle (local dev / Oxygen preview URLs)
 */
export function matchPopup(
  popups: PopupConfig[],
  host: string,
  opts: {overrideHandle?: string | null; defaultHandle?: string | null} = {},
): PopupConfig | null {
  const byHandle = (h?: string | null) => (h ? popups.find((p) => p.handle === h) ?? null : null);

  const override = byHandle(opts.overrideHandle);
  if (override) return override;

  const h = normalizeHost(host);
  const byDomain = popups.find((p) => p.domains.includes(h));
  if (byDomain) return byDomain;

  return byHandle(opts.defaultHandle);
}
