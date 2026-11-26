import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV || 'development',
  release: import.meta.env.VITE_APP_VERSION || 'dev',
  
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  profilesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  
  // Custom tags
  initialScope: {
    tags: {
      app: 'vamort-tcg',
      platform: 'server',
    },
  },
  
  // Before send
  beforeSend(event) {
    if (event.request?.cookies) {
      delete event.request.cookies;
    }
    if (event.request?.headers?.authorization) {
      event.request.headers.authorization = '[Filtered]';
    }
    return event;
  },
});