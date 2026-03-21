import { useState, useCallback, useRef } from 'react';

interface TrackingState {
  active: boolean;
  consentGranted: boolean | null; // null = not yet asked
  bookingId: string | null;
  error: string | null;
}

interface StartTrackingOpts {
  bookingId: string;
  companyId: string;
  userId: string;
  employeeName: string;
  serviceType: string;
  wsUrl?: string;
}

/**
 * useCorporateTracking
 *
 * Custom hook that manages the full lifecycle of corporate trip tracking:
 * 1. Connects to the corporate tracking WebSocket
 * 2. Sends consent decision
 * 3. Streams GPS location updates
 * 4. Handles trip end and connection cleanup
 *
 * Usage in a trip screen:
 *   const { showConsentModal, startTracking, stopTracking, active } = useCorporateTracking();
 */
export function useCorporateTracking() {
  const [state, setState] = useState<TrackingState>({
    active: false,
    consentGranted: null,
    bookingId: null,
    error: null,
  });
  const [showConsentModal, setShowConsentModal] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingOptsRef = useRef<StartTrackingOpts | null>(null);

  /**
   * Step 1: Request to start a corporate tracked trip.
   * Shows consent modal if user hasn't decided yet for this booking.
   */
  const requestTracking = useCallback((opts: StartTrackingOpts) => {
    pendingOptsRef.current = opts;
    setShowConsentModal(true);
  }, []);

  /**
   * Step 2: Called by TrackingConsentModal with user's decision.
   */
  const handleConsentDecision = useCallback(async (granted: boolean) => {
    setShowConsentModal(false);
    const opts = pendingOptsRef.current;
    if (!opts) return;

    setState((prev) => ({
      ...prev,
      consentGranted: granted,
      bookingId: opts.bookingId,
    }));

    // Persist consent to backend before doing anything else
    try {
      await recordConsent({ ...opts, granted });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to record consent. Please try again.',
      }));
      return;
    }

    if (!granted) {
      // User declined — trip proceeds without tracking
      return;
    }

    // Step 3: connect WS and start streaming location
    await connectAndTrack(opts);
  }, []);

  /**
   * Stop tracking (called on trip end or revocation)
   */
  const stopTracking = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (wsRef.current) {
      const opts = pendingOptsRef.current;
      if (opts) {
        wsRef.current.send(
          JSON.stringify({
            event: 'employee:trip-end',
            data: {
              bookingId: opts.bookingId,
              companyId: opts.companyId,
              userId: opts.userId,
              status: 'completed',
              timestamp: new Date().toISOString(),
            },
          })
        );
      }
      wsRef.current.close();
      wsRef.current = null;
    }
    setState({
      active: false,
      consentGranted: null,
      bookingId: null,
      error: null,
    });
  }, []);

  // ── Private helpers ──────────────────────────────────────────

  async function recordConsent(opts: StartTrackingOpts & { granted: boolean }) {
    // POST to corporate service API
    // await fetch('/api/corporate/consent', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     bookingId: opts.bookingId,
    //     companyId: opts.companyId,
    //     userId: opts.userId,
    //     granted: opts.granted,
    //   }),
    // });
    console.log(
      `[Corporate] Consent recorded: ${opts.granted} for booking ${opts.bookingId}`
    );
  }

  async function connectAndTrack(opts: StartTrackingOpts) {
    const wsUrl = opts.wsUrl || 'ws://localhost:4005/corporate-tracking';

    return new Promise<void>((resolve) => {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        // Announce trip start with current position
        getCurrentPosition((lat, lng) => {
          ws.send(
            JSON.stringify({
              event: 'employee:trip-start',
              data: {
                bookingId: opts.bookingId,
                companyId: opts.companyId,
                userId: opts.userId,
                employeeName: opts.employeeName,
                serviceType: opts.serviceType,
                consentGranted: true,
                lat,
                lng,
              },
            })
          );

          setState((prev) => ({ ...prev, active: true }));

          // Stream location every 10 seconds
          intervalRef.current = setInterval(() => {
            getCurrentPosition((lat, lng) => {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(
                  JSON.stringify({
                    event: 'employee:location-update',
                    data: {
                      bookingId: opts.bookingId,
                      companyId: opts.companyId,
                      userId: opts.userId,
                      lat,
                      lng,
                      timestamp: new Date().toISOString(),
                    },
                  })
                );
              }
            });
          }, 10_000);

          resolve();
        });
      };

      ws.onerror = () => {
        setState((prev) => ({
          ...prev,
          active: false,
          error:
            'Tracking connection failed. Trip will continue without location sharing.',
        }));
        resolve();
      };
    });
  }

  function getCurrentPosition(cb: (lat: number, lng: number) => void) {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => cb(pos.coords.latitude, pos.coords.longitude),
        () => cb(0, 0), // fallback
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      // React Native: use expo-location or react-native-geolocation-service
      cb(0, 0);
    }
  }

  return {
    /** Whether location is currently being streamed */
    trackingActive: state.active,
    /** Whether the consent modal should be shown */
    showConsentModal,
    /** User's consent decision (null = not yet asked) */
    consentGranted: state.consentGranted,
    /** Error message if tracking failed */
    trackingError: state.error,
    /** Call to start a tracked trip (shows consent modal first) */
    requestTracking,
    /** Passed to TrackingConsentModal.onDecision */
    handleConsentDecision,
    /** Call when trip ends or employee wants to stop sharing */
    stopTracking,
  };
}
