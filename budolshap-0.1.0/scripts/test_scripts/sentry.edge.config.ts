// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is only required if you're using a
// feature that requires edge-specific Sentry configuration.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// Check if error tracking is enabled via environment variable
const isEnabled = process.env.ERROR_TRACKING_ENABLED === "true";
const dsn = process.env.SENTRY_DSN;

// Only initialize if enabled and DSN is provided
if (isEnabled && dsn) {
  Sentry.init({
    dsn: dsn,
    
    // Adjust this value in production, or use tracesSampler for greater control
    tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || "0.1"),
    
    // Setting this option to true will print useful information to the console while you're setting up Sentry.
    debug: false,
    
    environment: process.env.SENTRY_ENVIRONMENT || "production",
  });
} else {
  // Sentry is disabled or not configured
  console.log('[Sentry] Error tracking is disabled or not configured');
}

