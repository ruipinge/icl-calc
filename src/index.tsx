import './App.scss';

import * as Sentry from '@sentry/react';

import App from './App';
import React from 'react';
import { createRoot } from 'react-dom/client';

// Strips anything that could carry patient-entered form state out of a
// Sentry event before it is sent.
//
// `request.data` and `extra` are where arbitrary application state ends up
// if something ever calls Sentry.setExtra or an error carries a request
// body; `contexts.state` is a first-class Sentry field for a React
// component's state (see this SDK's own
// node_modules/@sentry/core/build/types/types/context.d.ts: `StateContext`)
// and would be exactly the form's typed-in values if anything ever wired
// it up. None of these three are populated by this app today - there is
// no Sentry.setExtra/setContext call anywhere in src/, and no
// ErrorBoundary reporting component state - but this makes that a
// property that is enforced, not just currently true, so a future change
// here fails safe instead of silently starting to leak biometry.
//
// Console breadcrumbs are dropped too: the default `breadcrumbs`
// integration's `console` instrumentation records console.log/warn/error
// arguments verbatim, so a future debug session doing
// `console.log(formValues)` would otherwise ship straight to Sentry.
// (DOM click/keypress breadcrumbs are left alone - checked against this
// version's actual implementation in
// node_modules/@sentry/browser/build/npm/esm/prod/integrations/breadcrumbs.js,
// they record the target element's tag/id/class via `htmlTreeAsString`,
// not its value, so they carry no patient data to begin with.)
function stripSensitiveFields(event: Sentry.Event): void {
  delete event.request?.data;
  delete event.extra;
  delete event.contexts?.state;

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.filter(
      (breadcrumb) => breadcrumb.category !== 'console'
    );
  }
}

// Clinicians type patient biometry into this form - keratometry, anterior
// chamber depth, white-to-white, refraction, date of birth. Sentry has run
// here since 2021 with nothing configured to keep that data out of what it
// sends; every option below is chosen with that in mind.
if (import.meta.env.PROD) {
  Sentry.init({
    dsn:
      'https://2e937d9ae4044696992e8d4afba8d9b5@o551236.ingest.sentry.io/5674476',

    // `new Integrations.BrowserTracing()` (the removed @sentry/tracing v6
    // API) is replaced by this function in v10 - confirmed against this
    // installed package's own
    // node_modules/@sentry/browser/build/npm/types/tracing/browserTracingIntegration.d.ts
    // rather than assumed from an older API, since this has changed across
    // several majors.
    //
    // No session-replay integration is added here, deliberately: replay
    // records a DOM/video reconstruction of the page and would be a far
    // bigger leak of patient data than anything tracing or error reporting
    // captures. Do not add one without re-running the PII review below.
    integrations: [Sentry.browserTracingIntegration()],

    // This sent 100% of transactions since 2021 with no sign that volume
    // was ever needed. Performance monitoring only needs a representative
    // sample to spot regressions, so 0.1 keeps that signal while cutting
    // both the request volume and the amount of ambient page/session
    // context shipped off this page by 90%.
    tracesSampleRate: 0.1,

    // False is already this SDK's effective default (`sendDefaultPii` is
    // deprecated in v10 in favour of the more granular `dataCollection`
    // option, and both default to collecting nothing extra). Set
    // explicitly anyway so the decision is visible in this file and does
    // not silently change if a future Sentry upgrade ever flips it.
    sendDefaultPii: false,

    // Defence in depth beyond sendDefaultPii/breadcrumb config: run every
    // outgoing error and transaction through the same scrub, in case a
    // future change ever attaches request data, extra context, or a
    // console breadcrumb carrying form state.
    beforeSend(event) {
      stripSensitiveFields(event);
      return event;
    },
    beforeSendTransaction(event) {
      stripSensitiveFields(event);
      return event;
    }
  });
}

const container = document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
} else {
  // The old ReactDOM.render(<App />, document.getElementById('root'))
  // threw "Target container is not a DOM element" when #root was missing
  // or renamed, and Sentry.init above captured it. Preserve that loud
  // failure explicitly - createRoot's `if (container)` guard would
  // otherwise silently swallow the same condition into a blank page with
  // zero telemetry.
  throw new Error('Failed to mount: no DOM element with id "root" was found.');
}
