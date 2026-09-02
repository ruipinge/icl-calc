import ReactGA from 'react-ga4';

// GA4 property id, injected at build time via the environment - never
// hardcoded here. The old Universal Analytics integration hardcoded
// 'UA-212134595-1' directly in this file, which is also why it kept firing
// from every dev machine and CI run for years after UA itself stopped
// processing data (1 July 2023). `init()` below no-ops entirely when this
// is unset, so dev builds, test runs, and any build the owner hasn't
// configured with a real GA4 property never talk to Google at all.
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

const GA = {
  /**
   * Initialises GA4 with consent denied by default. Safe to call
   * unconditionally - it is a no-op whenever VITE_GA_MEASUREMENT_ID is
   * not set.
   */
  init: (): void => {
    if (!MEASUREMENT_ID) {
      return;
    }

    // Consent must be queued before initialize(): the "config" command
    // GA4 sends on init reads whatever consent state already sits in
    // dataLayer at that point, not one set afterwards.
    ReactGA.gtag('consent', 'default', DEFAULT_CONSENT);

    ReactGA.initialize(MEASUREMENT_ID, {
      gtagOptions: {
        // GA4's automatic pageview-on-init would double-count against
        // the explicit per-tab pageview `pageview()` below sends - this
        // is a hash-router SPA, so a tab switch is never a real page
        // load and needs to be reported explicitly instead.
        send_page_view: false
      }
    });
  },

  /**
   * Sends one GA4 pageview for `path`. No-ops whenever GA4 was never
   * initialised (see `init` above) - callers don't need to check that
   * themselves.
   */
  pageview: (path: string): void => {
    if (!MEASUREMENT_ID) {
      return;
    }

    ReactGA.send({ hitType: 'pageview', page: path });
  }
};

export default GA;
