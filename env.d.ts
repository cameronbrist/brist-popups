/// <reference types="vite/client" />
/// <reference types="react-router" />
/// <reference types="@shopify/oxygen-workers-types" />
/// <reference types="@shopify/hydrogen/react-router-types" />

// Enhance TypeScript's built-in typings.
import '@total-typescript/ts-reset';

declare global {
  interface Env {
    /** Pop-up served when no domain matches (local dev, Oxygen preview URLs). */
    POPUP_DEFAULT_HANDLE?: string;
    /** "true" lets ?popup=<handle> switch pop-ups. Enable on preview environments only. */
    POPUP_ALLOW_OVERRIDE?: string;
    /** "true" uses the sample pop-ups in app/lib/popup/fixtures.ts (mock.shop dev). */
    POPUP_USE_FIXTURES?: string;
  }
}
