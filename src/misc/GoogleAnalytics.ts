import ReactGA from 'react-ga4';

// GA4 property id, injected at build time via the environment - never
// hardcoded here. The old Universal Analytics integration hardcoded
// 'UA-212134595-1' directly in this file, but that code was always gated
// on a production-mode check as well (`NODE_ENV === 'production'`, later
// `import.meta.env.PROD`) - it never fired from a dev machine.
// `ensureInitialized()` below keeps that same mode guard alongside the id
// check, so GA4 loads only in a production build *and* only when a
// measurement id is configured. The mode guard still matters even with the
// id no longer hardcoded: Vite loads `.env.local` in dev and test mode
// too, so a developer who follows `.env.example` and fills in a real id
// there would otherwise get live GA4 hits from `npm run dev`.
const MEASUREMENT_ID: string | undefined = import.meta.env
  .VITE_GA_MEASUREMENT_ID;

// GA4 sets cookies, and the clinic operates in the EU (GDPR applies).
// There is no consent-collection UI yet - that's #67 - so every session
// starts with Google's Consent Mode v2 signals explicitly denied. With
// these denied, the gtag script still loads and can queue commands, but
// GA4 stores no advertising/analytics cookies and sends no attributable
// hit until something calls
// `ReactGA.gtag('consent', 'update', { analytics_storage: 'granted' })`.
// Nothing in this codebase does that yet.
//
// ⚠️ Consequence: the GA4 dashboard will show zero traffic until #67
// ships a consent banner that grants it. That's expected, not a bug -
// don't burn a day debugging an "empty" dashboard before #67 lands.
const DEFAULT_CONSENT = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied'
} as const;

let initialized = false;

// Both init() and pageview() below feed into this. init() is called from
// ICLContainer's own mount effect and pageview() from RouteTracker's -
// RouteTracker is a *descendant* of the component that calls init(), and
// React fires mount effects child-first, so RouteTracker's effect can run
// before init()'s. Routing every entry point through this one idempotent
// function - rather than assuming init() always runs first - guarantees
// the consent-default command is always the first thing queued in
// dataLayer, no matter which effect happens to fire first.
function ensureInitialized(): boolean {
  if (initialized) {
    return true;
  }

  if (!import.meta.env.PROD || !MEASUREMENT_ID) {
    return false;
  }

  // Consent must be queued before initialize(): the "config" command GA4
  // sends on init reads whatever consent state already sits in dataLayer
  // at that point, not one set afterwards.
  ReactGA.gtag('consent', 'default', DEFAULT_CONSENT);

  ReactGA.initialize(MEASUREMENT_ID, {
    gtagOptions: {
      // GA4's automatic pageview-on-init would double-count against the
      // explicit per-tab pageview `pageview()` below sends - this is a
      // hash-router SPA, so a tab switch is never a real page load and
      // needs to be reported explicitly instead.
      send_page_view: false
    }
  });

  initialized = true;
  return true;
}

const GA = {
  /**
   * Initialises GA4 with consent denied by default. Safe to call
   * unconditionally and more than once - it is a no-op outside a
   * production build, and a no-op whenever VITE_GA_MEASUREMENT_ID is not
   * set, and only initialises GA4 once.
   */
  init: (): void => {
    ensureInitialized();
  },

  /**
   * Sends one GA4 pageview for `path`. No-ops outside a production build
   * and no-ops whenever VITE_GA_MEASUREMENT_ID is not set. Safe to call
   * before `init()` has run - it initialises GA4 itself (with consent
   * still denied first) if nothing has yet, so a pageview can never be
   * queued ahead of the consent-default command.
   */
  pageview: (path: string): void => {
    if (!ensureInitialized()) {
      return;
    }

    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export default GA;
