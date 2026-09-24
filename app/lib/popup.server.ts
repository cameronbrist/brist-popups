/**
 * Hydrogen-specific wiring for pop-up resolution. The portable logic lives in
 * app/lib/popup/; this file only knows how to fetch and cache it on Oxygen.
 */
import type {HydrogenRouterContextProvider} from '@shopify/hydrogen';
import {
  FIXTURE_POPUPS,
  POPUP_STORES_QUERY,
  getDropState,
  matchPopup,
  parsePopup,
  type DropState,
  type MetaobjectNode,
  type PopupConfig,
} from '~/lib/popup';

const OVERRIDE_KEY = 'popupOverride';

/** The slice of Hydrogen's context this module needs. */
type PopupContext = Pick<HydrogenRouterContextProvider, 'storefront' | 'env' | 'session'>;

export interface ResolvedPopup {
  popup: PopupConfig;
  drop: DropState;
}

async function loadPopups(context: PopupContext): Promise<PopupConfig[]> {
  const {storefront, env} = context;
  if (env.POPUP_USE_FIXTURES === 'true') return FIXTURE_POPUPS;

  const data = await storefront.query(POPUP_STORES_QUERY, {
    // Configs change rarely. CacheShort keeps admin edits visible within ~1 min
    // while still absorbing drop-day traffic at the edge.
    cache: storefront.CacheShort(),
  });
  const nodes = (data?.metaobjects?.nodes ?? []) as MetaobjectNode[];
  return nodes.map(parsePopup);
}

/**
 * Resolves which pop-up this request belongs to. Returns null when the host
 * isn't mapped to any pop-up, which the root loader turns into a 404.
 */
export async function resolvePopup(
  request: Request,
  context: PopupContext,
): Promise<ResolvedPopup | null> {
  const {env, session} = context;
  const url = new URL(request.url);

  let overrideHandle: string | null = null;
  if (env.POPUP_ALLOW_OVERRIDE === 'true') {
    const fromQuery = url.searchParams.get('popup');
    if (fromQuery) session.set(OVERRIDE_KEY, fromQuery);
    overrideHandle = fromQuery ?? (session.get(OVERRIDE_KEY) as string | undefined) ?? null;
  }

  const popups = await loadPopups(context);
  const popup = matchPopup(popups, url.host, {
    overrideHandle,
    defaultHandle: env.POPUP_DEFAULT_HANDLE ?? null,
  });
  if (!popup) return null;

  // Archived pop-ups never resolve on a live domain. Drafts only resolve via
  // an explicit preview override, so they can be reviewed before launch.
  if (popup.status === 'archived') return null;
  if (popup.status === 'draft' && popup.handle !== overrideHandle) return null;

  return {popup, drop: getDropState(popup)};
}

/** Order attribute that tags every cart with its pop-up (for Flow -> ShipHero). */
export const POPUP_CART_ATTRIBUTE = '_popup';

/** Like resolvePopup, but throws a 404 when no pop-up matches. For child loaders/actions. */
export async function requirePopup(
  request: Request,
  context: PopupContext,
): Promise<ResolvedPopup> {
  const resolved = await resolvePopup(request, context);
  if (!resolved) {
    throw new Response('No pop-up store is live at this address.', {status: 404});
  }
  return resolved;
}

/**
 * All pop-ups share one Shopify store, so a product handle from one pop-up
 * would otherwise load on every pop-up domain. This keeps each pop-up scoped
 * to its own collection. Pop-ups without a collection (fixtures) aren't scoped.
 */
export function belongsToPopup(
  popup: PopupConfig,
  collectionHandles: string[],
): boolean {
  if (!popup.collectionHandle) return true;
  return collectionHandles.includes(popup.collectionHandle);
}
