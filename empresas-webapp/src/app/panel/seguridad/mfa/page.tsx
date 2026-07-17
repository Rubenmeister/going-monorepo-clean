/**
 * Configuración de Verificación en Dos Pasos (MFA / TOTP)
 * Ruta: /panel/seguridad/mfa
 *
 * Flujo:
 *   - Si MFA NO activado:
 *       1. "Activar MFA" → llamada a /auth/mfa/setup
 *       2. Muestra QR + códigos manuales + 8 recovery codes (UNA SOLA VEZ)
 *       3. User escanea con Authenticator e ingresa primer código TOTP
 *       4. Activate → /auth/mfa/enable
 *   - Si MFA SÍ activado:
 *       - Ver fecha activación
 *       - Botón "Regenerar códigos de recuperación" (pide TOTP code)
 *       - Botón "Desactivar MFA" (pide password + TOTP/recovery code)
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/auth";
import {
  fetchMfaStatus,
  setupMfa,
  enableMfa,
  disableMfa,
  regenerateMfaCodes,
  type MfaStatus,
  type MfaSetupResponse,
} from "@/lib/api";

type Stage = "loading" | "off" | "setup" | "on" | "disabling" | "regenerating";

export default function MfaSettingsPage() {
  const { session } = useAuthRedirect();
  const [stage, setStage] = useState<Stage>("loading");
  const [status, setStatus] = useState<MfaStatus | null>(null);
  const [setupData, setSetupData] = useState<MfaSetupResponse | null>(null);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [newRecoveryCodes, setNewRecoveryCodes] = useState<string[] | null>(null);
  const [codesAcknowledged, setCodesAcknowledged] = useState(false);

  const token = session?.accessToken ?? "";

  useEffect(() => {
    if (!token) return;
    fetchMfaStatus(token)
      .then((s) => {
        setStatus(s);
        setStage(s.enabled ? "on" : "off");
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Error cargando estado MFA");
        setStage("off");
      });
  }, [token]);

  if (!session) return null;

  // ── Handlers ─────────────────────────────────────────────────────────

  async function startSetup() {
    setError(null);
    setBusy(true);
    try {
      const data = await setupMfa(token);
      setSetupData(data);
      setCodesAcknowledged(false);
      setStage("setup");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error iniciando setup");
    } finally {
      setBusy(false);
    }
  }

  async function confirmActivation() {
    if (!code || code.length < 6) {
      setError("Ingresa el código de 6 dígitos");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await enableMfa(token, code.trim());
      setSetupData(null);
      setCode("");
      const newStatus = await fetchMfaStatus(token);
      setStatus(newStatus);
      setStage("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Código inválido");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDisable() {
    if (!password) { setError("Password requerido"); return; }
    if (!code) { setError("Código requerido"); return; }
    setError(null);
    setBusy(true);
    try {
      await disableMfa(token, password, code.trim());
      setStatus({ enabled: false });
      setStage("off");
      setPassword("");
      setCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desactivando MFA");
    } finally {
      setBusy(false);
    }
  }

  async function confirmRegenerate() {
    if (!code) { setError("Código requerido"); return; }
    setError(null);
    setBusy(true);
    try {
      const res = await regenerateMfaCodes(token, code.trim());
      setNewRecoveryCodes(res.recoveryCodes);
      setCodesAcknowledged(false);
      setCode("");
      setStage("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error regenerando códigos");
    } finally {
      setBusy(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Verificación en dos pasos</h1>
        <p className="text-slate-600 mt-1">
          Protege tu cuenta corporativa con un código adicional al iniciar sesión.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {stage === "loading" && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
          Cargando…
        </div>
      )}

      {stage === "off" && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-full">
              Desactivado
            </span>
          </div>
          <p className="text-slate-700 mb-1 font-medium">MFA está apagado</p>
          <p className="text-sm text-slate-500 mb-5">
            Activa la verificación en dos pasos para que cada login requiera, además
            de tu contraseña, un código generado por una app autenticadora
            (Google Authenticator, Authy, 1Password). Recibirás también 8 códigos
            de recuperación por si pierdes acceso al dispositivo.
          </p>
          <button
            onClick={startSetup}
            disabled={busy}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg disabled:opacity-50"
          >
            {busy ? "Generando…" : "Activar MFA"}
          </button>
        </div>
      )}

      {stage === "setup" && setupData && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm space-y-5">
          <div>
            <h2 className="font-bold text-slate-900 mb-1">1. Escanea el QR</h2>
            <p className="text-sm text-slate-500 mb-3">
              Abre tu app autenticadora y escanea este código.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <img
                src={setupData.qrDataUrl}
                alt="MFA QR Code"
                className="w-44 h-44 border border-slate-200 rounded-lg"
              />
              <div className="text-sm">
                <p className="text-slate-500 mb-1">¿No puedes escanear? Ingrésalo manualmente:</p>
                <code className="block bg-slate-50 px-3 py-2 rounded font-mono text-xs break-all">
                  {setupData.manualEntryCode}
                </code>
              </div>
            </div>
          </div>

          <div>
            <h2 className="font-bold text-slate-900 mb-1">2. Guarda tus códigos de recuperación</h2>
            <p className="text-sm text-amber-700 mb-3">
              ⚠️ Solo verás estos códigos UNA VEZ. Guárdalos en un lugar seguro.
              Sirven para recuperar el acceso si pierdes el dispositivo.
            </p>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg">
              {setupData.recoveryCodes.map((c) => (
                <code key={c} className="font-mono text-sm text-slate-800 px-2 py-1">
                  {c}
                </code>
              ))}
            </div>
            <label className="flex items-center gap-2 mt-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={codesAcknowledged}
                onChange={(e) => setCodesAcknowledged(e.target.checked)}
              />
              He guardado mis códigos de recuperación
            </label>
          </div>

          <div>
            <h2 className="font-bold text-slate-900 mb-1">3. Verifica el primer código</h2>
            <p className="text-sm text-slate-500 mb-2">
              Ingresa el código de 6 dígitos que muestra tu app autenticadora ahora mismo.
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full max-w-xs px-4 py-2 border border-slate-300 rounded-lg font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600"
              placeholder="000000"
              inputMode="numeric"
              maxLength={6}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={confirmActivation}
              disabled={busy || !codesAcknowledged || code.length < 6}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
            >
              {busy ? "Activando…" : "Activar MFA"}
            </button>
            <button
              onClick={() => { setSetupData(null); setCode(""); setStage("off"); }}
              disabled={busy}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {stage === "on" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-green-200 p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                Activado ✓
              </span>
              {status?.activatedAt && (
                <span className="text-xs text-slate-500">
                  Desde {new Date(status.activatedAt).toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })}
                </span>
              )}
            </div>
            <p className="text-slate-700 font-medium">MFA está protegiendo tu cuenta</p>
            <p className="text-sm text-slate-500">
              Cada login pedirá tu password + un código de la app autenticadora.
            </p>
          </div>

          {newRecoveryCodes && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-5">
              <h3 className="font-bold text-amber-900 mb-2">
                Nuevos códigos de recuperación
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                Los códigos anteriores fueron invalidados. Guarda estos nuevos en un lugar seguro.
              </p>
              <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-lg mb-3">
                {newRecoveryCodes.map((c) => (
                  <code key={c} className="font-mono text-sm text-slate-800 px-2 py-1">
                    {c}
                  </code>
                ))}
              </div>
              <button
                onClick={() => setNewRecoveryCodes(null)}
                className="text-sm text-amber-900 hover:text-amber-700 font-semibold"
              >
                Ya los guardé →
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-1">Regenerar códigos de recuperación</h3>
            <p className="text-sm text-slate-500 mb-3">
              Genera 8 códigos nuevos e invalida los anteriores. Requiere un código TOTP actual.
            </p>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg font-mono w-32 text-center focus:outline-none focus:ring-2 focus:ring-blue-600"
                placeholder="000000"
                inputMode="numeric"
                maxLength={6}
              />
              <button
                onClick={confirmRegenerate}
                disabled={busy || code.length < 6}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-sm font-semibold rounded-lg"
              >
                {busy ? "Regenerando…" : "Regenerar"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-red-200 p-5 shadow-sm">
            <h3 className="font-bold text-red-900 mb-1">Desactivar MFA</h3>
            <p className="text-sm text-slate-500 mb-3">
              Tu cuenta volverá a usar solo contraseña. Requiere tu password actual +
              un código TOTP (o uno de recuperación).
            </p>
            <div className="flex gap-2 items-center flex-wrap">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg w-44 focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="Tu contraseña"
              />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg font-mono w-32 text-center focus:outline-none focus:ring-2 focus:ring-red-500"
                placeholder="000000"
                inputMode="text"
                maxLength={9}
              />
              <button
                onClick={confirmDisable}
                disabled={busy || !password || code.length < 6}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
              >
                {busy ? "Desactivando…" : "Desactivar MFA"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
