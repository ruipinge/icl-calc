import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// react-ga4 is the only thing standing between this module and Google's
// servers, so it is mocked outright: these tests must never make a network
// call, and must never reach the real GA4 property.
vi.mock('react-ga4', () => ({
  default: {
    gtag: vi.fn(),
    initialize: vi.fn(),
    send: vi.fn()
  }
}));

const MEASUREMENT_ID = 'G-TEST123456';

const DENIED_CONSENT = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied'
};

interface MockedGA {
  gtag: ReturnType<typeof vi.fn>;
  initialize: ReturnType<typeof vi.fn>;
  send: ReturnType<typeof vi.fn>;
}

// The module reads VITE_GA_MEASUREMENT_ID once, at import time, and keeps
// an `initialized` flag for the life of the module. Every test therefore
// sets the environment it wants and then imports a *fresh* copy.
const loadGA = async (env: { prod: boolean; measurementId?: string }) => {
  import.meta.env.PROD = env.prod;

  // Assigning `undefined` here would not do what it looks like: Vite's env
  // object stringifies its values, so the module would read the *string*
  // "undefined" and treat it as a configured id. Delete the key instead.
  if (env.measurementId === undefined) {
    delete import.meta.env.VITE_GA_MEASUREMENT_ID;
  } else {
    import.meta.env.VITE_GA_MEASUREMENT_ID = env.measurementId;
  }

  vi.resetModules();

  const ga = (await import('./GoogleAnalytics')).default;
  const ReactGA = ((await import('react-ga4')).default as unknown) as MockedGA;

  return { ga, ReactGA };
};

const ORIGINAL_PROD = import.meta.env.PROD;
const ORIGINAL_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  import.meta.env.PROD = ORIGINAL_PROD;
  if (ORIGINAL_ID === undefined) {
    delete import.meta.env.VITE_GA_MEASUREMENT_ID;
  } else {
    import.meta.env.VITE_GA_MEASUREMENT_ID = ORIGINAL_ID;
  }
  vi.resetModules();
});

describe('GoogleAnalytics', () => {
  describe('when configured for a production build', () => {
    it('queues the consent default before initialising, even when a pageview arrives first', async () => {
      const { ga, ReactGA } = await loadGA({
        prod: true,
        measurementId: MEASUREMENT_ID
      });

      // RouteTracker is a descendant of the component that calls init(),
      // and React fires mount effects child-first - so this is the real
      // order in the app, not a contrived one.
      ga.pageview('/patient');
      ga.init();

      expect(ReactGA.gtag).toHaveBeenCalledWith(
        'consent',
        'default',
        DENIED_CONSENT
      );
      expect(ReactGA.initialize).toHaveBeenCalledTimes(1);

      // Ordering across separate mocks: consent must be queued before
      // initialize(), because GA4's "config" command reads whatever
      // consent state is already in dataLayer at that moment.
      expect(ReactGA.gtag.mock.invocationCallOrder[0]).toBeLessThan(
        ReactGA.initialize.mock.invocationCallOrder[0]
      );
      expect(ReactGA.gtag.mock.invocationCallOrder[0]).toBeLessThan(
        ReactGA.send.mock.invocationCallOrder[0]
      );
    });

    it('sends one pageview per call, for the path it was given', async () => {
      const { ga, ReactGA } = await loadGA({
        prod: true,
        measurementId: MEASUREMENT_ID
      });

      ga.init();
      ga.pageview('/normality');

      expect(ReactGA.send).toHaveBeenCalledTimes(1);
      expect(ReactGA.send).toHaveBeenCalledWith({
        hitType: 'pageview',
        page: '/normality'
      });
    });

    it('initialises once however many times init() is called', async () => {
      const { ga, ReactGA } = await loadGA({
        prod: true,
        measurementId: MEASUREMENT_ID
      });

      ga.init();
      ga.init();
      ga.pageview('/patient');

      expect(ReactGA.initialize).toHaveBeenCalledTimes(1);
      expect(ReactGA.gtag).toHaveBeenCalledTimes(1);
    });

    it('suppresses GA4 automatic pageviews, which would double-count', async () => {
      const { ga, ReactGA } = await loadGA({
        prod: true,
        measurementId: MEASUREMENT_ID
      });

      ga.init();

      expect(ReactGA.initialize).toHaveBeenCalledWith(MEASUREMENT_ID, {
        gtagOptions: { send_page_view: false }
      });
    });
  });

  describe('when no measurement id is configured', () => {
    it('talks to Google not at all', async () => {
      const { ga, ReactGA } = await loadGA({
        prod: true,
        measurementId: undefined
      });

      ga.init();
      ga.pageview('/patient');

      expect(ReactGA.gtag).not.toHaveBeenCalled();
      expect(ReactGA.initialize).not.toHaveBeenCalled();
      expect(ReactGA.send).not.toHaveBeenCalled();
    });
  });

  describe('when the measurement id is set but empty', () => {
    // This is what the deploy job actually produces before the owner
    // creates the GA4 property: an unset repository variable expands to
    // the empty string, not to nothing at all.
    it('talks to Google not at all', async () => {
      const { ga, ReactGA } = await loadGA({
        prod: true,
        measurementId: ''
      });

      ga.init();
      ga.pageview('/patient');

      expect(ReactGA.gtag).not.toHaveBeenCalled();
      expect(ReactGA.initialize).not.toHaveBeenCalled();
      expect(ReactGA.send).not.toHaveBeenCalled();
    });
  });

  describe('outside a production build', () => {
    // The mode guard is the second of two independent gates. Vite loads
    // .env.local in dev and test mode too, so a developer who follows
    // .env.example and fills in a real id would otherwise get live GA4
    // hits from `npm run dev`.
    it('talks to Google not at all, even with a real measurement id set', async () => {
      const { ga, ReactGA } = await loadGA({
        prod: false,
        measurementId: MEASUREMENT_ID
      });

      ga.init();
      ga.pageview('/patient');

      expect(ReactGA.gtag).not.toHaveBeenCalled();
      expect(ReactGA.initialize).not.toHaveBeenCalled();
      expect(ReactGA.send).not.toHaveBeenCalled();
    });
  });
});
