/**
 * Going — Shared App Constants (User App)
 * Single source of truth for brand colors, API URL, and timing constants.
 */

// ─── Brand Colors ─────────────────────────────────────────────────────────────
export const GOING_RED    = '#ff4c41';
export const GOING_BLUE   = '#0033A0';
export const GOING_YELLOW = '#FFCD00';

// ─── API ──────────────────────────────────────────────────────────────────────
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL
  ?? 'https://api-gateway-780842550857.us-central1.run.app';

// ─── Polling Intervals (ms) ───────────────────────────────────────────────────
export const RIDE_STATUS_POLL_MS   = 5_000;
export const CHAT_POLL_MS          = 3_000;
export const DRIVER_LOCATION_INTERVAL_MS = 5_000;
export const NETWORK_CHECK_TIMEOUT_MS    = 2_500;
export const NETWORK_CHECK_LATENCY_MS    = 300; // threshold for good VoIP connection
