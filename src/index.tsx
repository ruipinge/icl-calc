import './App.scss';

import * as Sentry from '@sentry/react';

import App from './App';
import { Integrations } from '@sentry/tracing';
import React from 'react';
import { createRoot } from 'react-dom/client';

if (import.meta.env.PROD) {
  Sentry.init({
    dsn:
      'https://2e937d9ae4044696992e8d4afba8d9b5@o551236.ingest.sentry.io/5674476',
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0
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
