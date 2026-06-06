"use client";

/**
 * PWARegister
 *
 * Registra el Service Worker al montar la app.
 * Se importa una sola vez en RootLayoutClient.
 * No renderiza nada visible — solo efectos de fondo.
 */

import { useEffect } from "react";

export function PWARegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        // Verificar actualizaciones cuando el usuario navega
        reg.addEventListener("updatefound", () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              // Nueva versión disponible — se activará en la próxima visita
              console.info("[Going App SW] Nueva versión disponible.");
            }
          });
        });
      })
      .catch((err) => {
        console.warn("[Going App SW] Registro fallido:", err);
      });
  }, []);

  return null;
}
