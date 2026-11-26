import * as Sentry from '@sentry/react';

// Custom routing instrumentation for our hash-based router
const customRoutingInstrumentation = {
  startRouteTransaction: (route) => {
    // We handle routing via hash changes in StitchLayout
    return undefined;
  },
};

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV || 'development',
  release: import.meta.env.VITE_APP_VERSION || 'dev',
  
  // Performance monitoring
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  profilesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  
  // Session replay (10% of sessions in prod)
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  
  // Filter out noise
  ignoreErrors: [
    'Network Error',
    'Network request failed',
    'Failed to fetch',
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
  
  // Custom tags
  initialScope: {
    tags: {
      app: 'vamort-tcg',
      platform: 'web',
    },
  },
  
  // Before send - scrub sensitive data
  beforeSend(event, hint) {
    // Remove sensitive data from error context
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.request?.headers?.authorization) {
      event.request.headers.authorization = '[Filtered]';
    }
    return event;
  },
  
  // Integrations
  integrations: [
    Sentry.browserTracingIntegration({
      routingInstrumentation: customRoutingInstrumentation,
    }),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
    Sentry.feedbackIntegration({
      colorScheme: 'dark',
    }),
  ],
});