/**
 * Visual indicator that the employee has explicitly consented to tracking.
 * Rendered on each trip card in the live tracking dashboard.
 *
 * LOPD Ecuador: consent must be explicit and logged.
 */
export default function TrackingConsentBadge() {
  return (
    <span
      title="Employee has explicitly consented to location sharing for this trip (LOPD Ecuador)"
      className="ml-auto inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-medium px-1.5 py-0.5 rounded-full shrink-0"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
      Consented
    </span>
  );
}
