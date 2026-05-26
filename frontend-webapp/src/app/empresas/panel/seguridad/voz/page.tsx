/**
 * Preferencias de voz del usuario corporativo.
 * Ruta: /empresas/panel/seguridad/voz
 *
 * El usuario escoge:
 *   - Idioma (es / en / qu Kichwa)
 *   - Voz preferida OpenAI Realtime (opcional; null = auto por idioma)
 *
 * Estas preferencias se aplican a:
 *   - Llamadas telefónicas entrantes (Twilio + voice-call-service)
 *   - Voz in-app (customer-support voice gateway)
 *   - TTS de respuestas WhatsApp/Telegram (donde aplica)
 *
 * Default: si el user no configura nada, el sistema infiere por phone
 * country code (EC=es, US=en, fallback es). Kichwa requiere opt-in.
 */

"use client";

import { useEffect, useState } from "react";
import { useAuthRedirect } from "@/lib/empresas/auth";
import {
  fetchVoicePreference,
  updateVoicePreference,
  type VoicePreference,
  type VoiceLanguage,
} from "@/lib/empresas/api";

const LANGUAGE_OPTIONS: Array<{ value: VoiceLanguage; label: string; sub: string; flag: string }> = [
  { value: "es", label: "Español",  sub: "Castellano ecuatoriano", flag: "🇪🇨" },
  { value: "en", label: "English",  sub: "International English",  flag: "🇺🇸" },
  { value: "qu", label: "Kichwa",   sub: "Runa shimi (Kichwa unificado)", flag: "🪶" },
];

const VOICE_OPTIONS: Array<{ value: string; label: string; description: string }> = [
  { value: "shimmer", label: "Shimmer", description: "Femenina, cálida — recomendada para español" },
  { value: "sage",    label: "Sage",    description: "Neutral, profesional — recomendada para inglés" },
  { value: "alloy",   label: "Alloy",   description: "Neutral, balanceada" },
  { value: "coral",   label: "Coral",   description: "Femenina, joven" },
  { value: "ash",     label: "Ash",     description: "Masculina, suave" },
  { value: "verse",   label: "Verse",   description: "Versátil, expresiva" },
  { value: "ballad",  label: "Ballad",  description: "Masculina, narrativa" },
  { value: "marin",   label: "Marin",   description: "Femenina, clara" },
  { value: "cedar",   label: "Cedar",   description: "Masculina, gravedad" },
];

export default function VozPreferenciasPage() {
  const { session } = useAuthRedirect();
  const [pref, setPref] = useState<VoicePreference | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Borradores en UI antes de guardar
  const [language, setLanguage] = useState<VoiceLanguage>("es");
  const [voice, setVoice] = useState<string | "">("");

  const token = session?.accessToken ?? "";

  useEffect(() => {
    if (!token) return;
    fetchVoicePreference(token)
      .then((p) => {
        setPref(p);
        setLanguage(p.language);
        setVoice(p.voice ?? "");
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error cargando"))
      .finally(() => setLoading(false));
  }, [token]);

  if (!session) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const updated = await updateVoicePreference(token, {
        language,
        voice: voice || null,
      });
      setPref(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error guardando");
    } finally {
      setSaving(false);
    }
  }

  const dirty = !!pref && (pref.language !== language || (pref.voice ?? "") !== voice);

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Preferencias de voz</h1>
        <p className="text-slate-600 mt-1">
          Configura el idioma y la voz que Going usa al hablar contigo en
          llamadas telefónicas y en la app.
        </p>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-slate-500">
          Cargando…
        </div>
      )}

      {!loading && (
        <div className="space-y-5">
          {/* Idioma */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-1">Idioma</h2>
            <p className="text-sm text-slate-500 mb-4">
              Going te hablará en este idioma. Kichwa está disponible como parte
              de nuestra identidad cultural.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {LANGUAGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setLanguage(opt.value)}
                  className={`text-left p-4 rounded-lg border-2 transition-colors ${
                    language === opt.value
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="text-2xl mb-1">{opt.flag}</div>
                  <div className="font-semibold text-slate-900">{opt.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Voz */}
          <section className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-1">Voz</h2>
            <p className="text-sm text-slate-500 mb-4">
              Opcional. Si dejas <strong>Automática</strong>, Going elige la
              mejor voz según tu idioma.
            </p>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 text-slate-900"
            >
              <option value="">🤖 Automática (recomendado)</option>
              {VOICE_OPTIONS.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.label} — {v.description}
                </option>
              ))}
            </select>
          </section>

          {/* Footer */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
            <div className="text-sm">
              {pref?.configured ? (
                <span className="text-slate-500">
                  Tu preferencia actual:{" "}
                  <strong className="text-slate-900">
                    {LANGUAGE_OPTIONS.find((o) => o.value === pref.language)?.label}
                  </strong>
                  {pref.voice ? ` · ${pref.voice}` : " · voz automática"}
                </span>
              ) : (
                <span className="text-amber-700">
                  ⚠️ Aún no has configurado tus preferencias.
                </span>
              )}
            </div>
            <div className="flex gap-3 items-center">
              {saved && <span className="text-sm text-green-600 font-medium">✅ Guardado</span>}
              <button
                onClick={handleSave}
                disabled={!dirty || saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg"
              >
                {saving ? "Guardando…" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
