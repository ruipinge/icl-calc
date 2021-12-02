import './App.scss';

import * as Sentry from '@sentry/react';

import App from './App';
import { Integrations } from '@sentry/tracing';
import React from 'react';
import ReactDOM from 'react-dom';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: 'https://2e937d9ae4044696992e8d4afba8d9b5@o551236.ingest.sentry.io/5674476',
    integrations: [new Integrations.BrowserTracing()],

    // Set tracesSampleRate to 1.0 to capture 100%
    // of transactions for performance monitoring.
    // We recommend adjusting this value in production
    tracesSampleRate: 1.0
  });
}

ReactDOM.render(<App />, document.getElementById('root'));
