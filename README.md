# Brist Pop-ups

One Hydrogen storefront that serves every Brist pop-up store. Each pop-up is a
`popup_store` metaobject in the Brist Shopify Plus admin: its domain, products,
drop window, and look. Launching a pop-up means creating an entry and pointing
a domain, not building a store.

Checkout, orders, and fulfillment run through the one Brist Plus store, so
ShipHero, Apparel Magic, and Klaviyo work exactly as they do for every other store.

## How a request is handled

1. `app/root.tsx` calls `resolvePopup()` with the request host.
2. The pop-up whose `domains` list contains the host is selected (cached at the edge).
   No match means a 404, so an unmapped domain never shows another client's store.
3. The theme becomes CSS variables; `data-layout` on `<html>` picks a layout variant.
4. The drop state (`upcoming` / `live` / `closed`) drives the banner, the
   add-to-cart button, and the server-side cart guard.
5. Every cart is tagged with a hidden `_popup` attribute, which lands on the order.

## Project map

| Path | What it is |
| --- | --- |
| `app/lib/popup/` | Portable core: types, drop-state rules, theme validation, metaobject parsing. No Hydrogen imports. Keep it that way. |
| `app/lib/popup.server.ts` | Hydrogen wiring: fetches configs, resolves the pop-up per request, scoping helpers. |
| `app/components/popup/` | Header, footer, drop countdown banner. |
| `app/routes/_index.tsx` | Pop-up landing page: hero plus the pop-up's collection. |
| `app/routes/cart.tsx` | Enforces drop window, per-order limits, and product scoping; tags the cart. |
| `app/styles/popup.css` | Everything visual, driven by `--popup-*` variables. |
| `scripts/` | Admin scripts to create the metaobject definition and pop-up entries. |

## Local development

```bash
npm install
npm run dev        # http://localhost:3000, uses mock.shop + sample pop-ups
npm test           # unit tests for the portable core
npm run typecheck
```

`.env` ships with `POPUP_USE_FIXTURES="true"`, so the two sample pop-ups in
`app/lib/popup/fixtures.ts` load without a real store. Switch between them with
`?popup=sample-quiet` (live, pre-order, editorial layout) and
`?popup=sample-loud` (upcoming, grid layout).

## Connecting the Brist Plus store (one time)

1. **Link the storefront**
   ```bash
   npx shopify hydrogen link     # choose the Brist Plus store, create a storefront
   npx shopify hydrogen env pull
   ```
   Then remove `POPUP_USE_FIXTURES` from `.env`.
2. **Create an admin app for the scripts.** In the Plus store admin, create a custom
   app with `write_metaobject_definitions`, `write_metaobjects`, and `read_products`.
   Copy `.env.admin.example` to `.env.admin` and add the token.
3. **Create the metaobject definition**
   ```bash
   npm run popup:setup
   ```
4. **Add the Shopify Flow workflow** (order tagging for ShipHero and reporting):
   - Trigger: *Order created*
   - Action: *Add order tags*, tag:
     ```liquid
     {% for attr in order.customAttributes %}{% if attr.key == "_popup" %}popup:{{ attr.value }}{% endif %}{% endfor %}
     ```
   Every pop-up order now carries a `popup:<handle>` tag. Confirm ShipHero is
   importing Shopify order tags so it can filter, route, or brand packing slips by pop-up.
5. **Set environment variables** in Hydrogen storefront settings:

| Variable | Production | Preview |
| --- | --- | --- |
| `POPUP_ALLOW_OVERRIDE` | unset | `true` |
| `POPUP_DEFAULT_HANDLE` | unset | a pop-up handle (optional) |
| `POPUP_USE_FIXTURES` | unset | unset |

## Launching a pop-up

1. Create the products (SKUs prefixed per pop-up) and a collection holding them.
2. Create the entry as a draft:
   ```bash
   npm run popup:new -- \
     --handle slow-mornings-fall --name "Slow Mornings Fall Capsule" \
     --domain shop.slowmornings.com --collection sm-fall-capsule \
     --opens 2026-11-01T16:00:00Z --closes 2026-11-08T16:00:00Z \
     --mode preorder --max 6 --layout editorial \
     --headline "The fall capsule is open for seven days." \
     --ship-message "Ships the week of Dec 1" \
     --theme scripts/themes/example.json
   ```
   Everything is also editable afterward in Shopify admin under Content → Metaobjects.
3. Upload the logo and hero image in the metaobject entry.
4. Preview on any preview deployment with `?popup=slow-mornings-fall`.
5. Add the domain to the Hydrogen storefront (Hydrogen → storefront → Domains)
   and point DNS at it.
6. Set status to `active`. The banner counts down and the store opens itself at `opens_at`.
7. After the drop: set status to `archived`. The domain stops serving.

## Guardrails built in

- **Product scoping.** Product pages and cart adds check that the product is in the
  pop-up's collection, so one pop-up's domain can't sell another's products.
- **Removed routes** that would expose the whole shared catalog: collections,
  search, blogs, sitemap, and `/cart/<variant>:<qty>` permalinks (which would skip the drop guard).
- **Server-side drop rules.** Closed drops and over-limit carts are rejected in the
  cart action, not just disabled in the UI.
- **Theme validation.** Colors, fonts, and font URLs from the admin are validated;
  bad values fall back to defaults instead of breaking the page.

## Not built yet

- Per-pop-up checkout branding (checkout UI extension reading the `_popup` attribute)
- Klaviyo waitlist capture for upcoming drops (`klaviyo_list_id` is already in the config)
- Per-pop-up sales report for client payouts (Flow tag makes this a filter on orders)
- Edge cache headers tied to the drop window (`maxCacheSeconds()` is ready and tested)
- Upcoming-drop product pages currently show products; decide whether to hide them before open
