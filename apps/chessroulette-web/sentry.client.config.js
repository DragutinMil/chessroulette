// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import { init, browserApiErrorsIntegration } from '@sentry/nextjs';
import { config } from './config';

config.SENTRY_DSN &&
  init({
    dsn: config.SENTRY_DSN,

    // bez tracesSampleRate - i vrednost 0 bi ucitala BrowserTracing; Sentry sluzi samo za greske
    // ne obmotava svaki event listener - to je kocilo pointer dogadjaje na tabli
    integrations: [browserApiErrorsIntegration({ eventTarget: false })],

    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: config.DEBUG_MODE,

    replaysOnErrorSampleRate: 1.0,

    // This sets the sample rate to be 10%. You may want this to be 100% while
    // in development and sample at a lower rate in production
    replaysSessionSampleRate: 0.1,

    // You can remove this option if you're not planning to use the Sentry Session Replay feature:
    // integrations: [
    //   replayIntegration({
    //     // Additional Replay configuration goes in here, for example:
    //     maskAllText: true,
    //     blockAllMedia: true,
    //   }),
    // ],
  });
