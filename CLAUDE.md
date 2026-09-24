# Brist Pop-ups: working notes for Claude

Multi-tenant Hydrogen storefront. One Brist Shopify store (Basic plan), many pop-ups, each
a `popup_store` metaobject selected by request hostname. Read README.md first.

Rules for changes:
- Business logic goes in `app/lib/popup/` as plain TypeScript with unit tests.
  No Hydrogen or React Router imports there (keeps a framework migration small).
- Anything that could expose products across pop-ups must check `belongsToPopup()`.
  Don't re-add collection, search, sitemap, or cart-permalink routes without scoping.
- Drop rules are enforced in `app/routes/cart.tsx`. UI state is a convenience, not the guard.
- Styling uses only `--popup-*` variables in `app/styles/popup.css`; new theme values
  must go through `normalizeTheme()` validation.
- Run `npm test && npm run typecheck` before committing.
