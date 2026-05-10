/**
 * Cerebro Tracker — captura JS errors runtime y los manda al cerebro-service.
 *
 * Importarlo UNA vez en `app/layout.tsx` (o equivalente) para que registre
 * los listeners. Es side-effect: solo importarlo activa el tracking.
 *
 *   // app/layout.tsx
 *   import '@/lib/cerebro-tracker';
 *
 * Lo que captura:
 *   - window.onerror (uncaught synchronous JS errors)
 *   - window.onunhandledrejection (uncaught async / promise errors)
 *
 * Sampling: 10% por sesión por default. Override con NEXT_PUBLIC_CEREBRO_SAMPLE_RATE.
 *
 * Para más detalle ver admin-dashboard/src/lib/cerebro-tracker.ts (gemelo).
 */

const APP_ID = 'frontend-webapp';
const CEREBRO_URL =
  (typeof window !== 'undefined' && (window as any).__CEREBRO_URL__) ||
  process.env.NEXT_PUBLIC_CEREBRO_URL ||
  'https://cerebro-service-780842550857.us-central1.run.app';
const SAMPLE_RATE = parseFloat(process.env.NEXT_PUBLIC_CEREBRO_SAMPLE_RATE || '0.1');

const recentlySent = new Map<string, number>();
const RESEND_COOLDOWN_MS = 60_000;

if (typeof window !== 'undefined') {
  const sessionSampled = Math.random() < SAMPLE_RATE;
  if (sessionSampled) install();
}

function install() {
  window.addEventListener('error', (event) => {
    captureError({
      errorType: 'js_error',
      message:   event.message || event.error?.message || 'Unknown error',
      stack:     event.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    captureError({
      errorType: 'unhandled_rejection',
      message:   typeof reason === 'string'
                  ? reason
                  : (reason?.message || 'Unhandled promise rejection'),
      stack:     reason?.stack,
    });
  });
}

interface CaptureArgs {
  errorType: 'js_error' | 'unhandled_rejection';
  message:   string;
  stack?:    string;
}

function captureError(args: CaptureArgs) {
  try {
    const url = location.pathname + location.hash;
    const dedupKey = computeDedup({ ...args, url });
    const now = Date.now();
    const lastSent = recentlySent.get(dedupKey) ?? 0;
    if (now - lastSent < RESEND_COOLDOWN_MS) return;
    recentlySent.set(dedupKey, now);

    const body = {
      appId:     APP_ID,
      errorType: args.errorType,
      message:   args.message.slice(0, 500),
      stack:     args.stack?.slice(0, 2000),
      url,
      userAgent: navigator.userAgent.slice(0, 200),
      dedupKey,
    };

    const data = JSON.stringify(body);
    const target = `${CEREBRO_URL.replace(/\/$/, '')}/cerebro/web-event`;
    if (navigator.sendBeacon) {
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(target, blob);
    } else {
      fetch(target, {
        method:      'POST',
        headers:     { 'Content-Type': 'application/json' },
        body:        data,
        keepalive:   true,
        credentials: 'omit',
      }).catch(() => {});
    }
  } catch {
    // Tracker errors → ignorar (recursión).
  }
}

function computeDedup(args: CaptureArgs & { url: string }): string {
  const topFrame = (args.stack || args.message).split('\n')[0].trim().slice(0, 200);
  const fingerprint = `${APP_ID}|${args.errorType}|${args.url}|${topFrame}`;
  return cheapHash(fingerprint);
}

function cheapHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h) + s.charCodeAt(i);
    h |= 0;
  }
  return (h >>> 0).toString(16).padStart(16, '0').slice(0, 16);
}
