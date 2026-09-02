import './App.scss';

import * as Sentry from '@sentry/react';

import App from './App';
import React from 'react';
import { createRoot } from 'react-dom/client';

// Every event-level field capable of carrying arbitrary application data
// is stripped here - not just the ones populated today - because "empty
// today" and "structurally incapable of carrying patient data" are
// different guarantees, and only the second one survives a future change
// to this file without anyone revisiting this review.
//
// `request.data`, `extra`, `message`, `logentry`, `tags` and `user` are
// all places arbitrary state ends up if something ever calls
// Sentry.setExtra/setTag/setUser/captureMessage, or an error carries a
// request body. `contexts` is worse: it's an open `Record<string,
// Context>` (node_modules/@sentry/core/build/types/types/context.d.ts),
// so `Sentry.setContext('formSnapshot', values)` would add a brand new
// key this file has never seen. Rather than deny-list `state` (the one
// documented field for a React component's state) and hope nothing else
// gets added, SAFE_CONTEXT_KEYS allow-lists the built-in keys the SDK
// itself populates and drops everything else.
//
// None of the above is populated by this app today - zero calls to
// setExtra/setTag/setUser/setContext/captureMessage/addAttachment
// anywhere in src/, confirmed by grep - so all of this is hardening
// against a future change, not a fix for a live leak.
//
// Console breadcrumbs are dropped too: the default `breadcrumbs`
// integration's `console` instrumentation records console.log/warn/error
// arguments verbatim, so a future debug session doing
// `console.log(formValues)` would otherwise ship straight to Sentry.
// (DOM click/keypress breadcrumbs are left alone - checked against this
// version's actual implementation in
// node_modules/@sentry/browser/build/npm/esm/prod/integrations/breadcrumbs.js,
// `htmlTreeAsString`'s attribute set is hard-coded to id/className/
// aria-label/type/name/title/alt - it never reads `value`, with or
// without configuration - so they carry no patient data to begin with.)
//
// `hint.attachments` is the one place event data can ride along that
// `event` itself can never expose (see `EventHint` in
// node_modules/@sentry/core/build/types/types/event.d.ts), which is why
// both callers below now pass `hint` through instead of just `event`.
// Nothing calls Sentry.addAttachment today, so this is currently a
// no-op - but strip it anyway so a future attachment can't bypass every
// other scrub in this function.
const SAFE_CONTEXT_KEYS = new Set([
  // Everything `Contexts` declares (context.d.ts) except `state`, which
  // is the one field designed to hold a React component's state. Any key
  // outside this list - built-in or, more importantly, a future custom
  // one added via Sentry.setContext - is dropped.
  'app',
  'device',
  'os',
  'culture',
  'response',
  'trace',
  'cloud_resource',
  'profile',
  'flags'
]);

function stripSensitiveFields(
  event: Sentry.Event,
  hint: Sentry.EventHint
): void {
  delete event.request?.data;
  delete event.extra;
  delete event.message;
  delete event.logentry;
  delete event.tags;
  delete event.user;

  if (event.contexts) {
    for (const key of Object.keys(event.contexts)) {
      if (!SAFE_CONTEXT_KEYS.has(key)) {
        delete event.contexts[key];
      }
    }
  }

  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.filter(
      (breadcrumb) => breadcrumb.category !== 'console'
    );
  }

  delete hint.attachments;
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

    // `sendDefaultPii: false` is already this SDK's effective default,
    // but it does NOT mean "collect nothing extra" - checked the actual
    // resolution, not just the option's deprecation notice
    // (node_modules/@sentry/core/build/esm/utils/data-collection/
    // defaultPiiToCollectionOptions.js, deprecated in v10 in favour of
    // the finer-grained `dataCollection` option). With this flag false,
    // the SDK still resolves `stackFrameVariables: true`,
    // `frameContextLines: 7`, `graphQL: { document: true, variables:
    // true }`, and deny-list-based (not empty) capture of cookies, HTTP
    // headers and URL query params - only `userInfo`, `genAI` and
    // `databaseQueryData` actually flip to false/off.
    //
    // Those permissive defaults are harmless here only because nothing
    // in this browser-only install has a capture path for them:
    // stack-frame variable capture is Node/inspector-only; frameContextLines
    // only feeds the opt-in `contextLinesIntegration()`, which is absent
    // from `getDefaultIntegrations()`
    // (node_modules/@sentry/browser/build/npm/esm/prod/sdk.js); and
    // httpBodies/urlQueryParams/graphQL are read nowhere in the installed
    // @sentry/browser package. This is "inert today", not "collects
    // nothing" - if `contextLinesIntegration()` or a server-side SDK is
    // ever added, re-review this before doing so.
    sendDefaultPii: false,

    // Defence in depth beyond sendDefaultPii/breadcrumb config: run every
    // outgoing error and transaction through the same scrub, in case a
    // future change ever attaches request data, extra context, a stray
    // tag/user/message, a custom context, an attachment, or a console
    // breadcrumb carrying form state. `hint` is passed through (not just
    // `event`) because attachments live only on the hint - see
    // stripSensitiveFields above.
    beforeSend(event, hint) {
      stripSensitiveFields(event, hint);
      return event;
    },
    beforeSendTransaction(event, hint) {
      stripSensitiveFields(event, hint);
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
