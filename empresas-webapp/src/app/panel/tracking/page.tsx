/**
 * /panel/tracking — redirect a /panel/mapa.
 *
 * "Tracking en Vivo" (detalle por viaje) y "Mapa en Vivo" (flota) se unificaron
 * en una sola sección "Seguimiento en Vivo" (/panel/mapa): mapa de flota + clic
 * en un viaje para volar a su posición. Esta ruta se conserva como redirect para
 * enlaces y marcadores antiguos.
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TrackingRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/panel/mapa");
  }, [router]);
  return (
    <div className="flex items-center justify-center py-20">
      <p className="text-slate-500 text-sm">Redirigiendo a Seguimiento en Vivo…</p>
    </div>
  );
}
