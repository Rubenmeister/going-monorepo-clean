#!/usr/bin/env python3
"""
Updates MyCortex system prompt via PUT /mycortex/config.

Usage:
    python scripts/cerebro/update-mycortex-prompt.py [operational_state]

operational_state options (default: ACTIVE_LOW_DEMAND):
    PAUSED_MAINTENANCE  — sistema pausado intencionalmente
    ACTIVE_LOW_DEMAND   — operando normalmente con demanda real cero
    INVESTIGATING       — hay problema real no resuelto

Reads the default prompt from /mycortex/config/default, augments it with:
  1. An operational state hint at the top (responde la pregunta de MyCortex)
  2. A canonical types section before the "Formato de output" header

Then PUTs the augmented prompt as the new active config.
"""

import json
import sys
import urllib.request

MYCORTEX = "https://mycortex-service-780842550857.us-central1.run.app"

OPERATIONAL_STATE = sys.argv[1] if len(sys.argv) > 1 else "ACTIVE_LOW_DEMAND"

# ─── Bloque 1: hint de estado operacional ─────────────────────
# Va al top, antes del "# Las 4 capas". MyCortex preguntó explícitamente
# por respuesta A/B/C — esta es la respuesta vía prompt.
OPERATIONAL_STATE_HINT = f"""# 🔵 Estado operacional declarado por el operador

State actual: **{OPERATIONAL_STATE}**

Significado:
- PAUSED_MAINTENANCE — Going pausado intencionalmente (deploys, mantenimiento, vacaciones)
- ACTIVE_LOW_DEMAND  — sistema corriendo, pero demanda real es cero o muy baja (período pre-launch, hora valle, día lento)
- INVESTIGATING      — hay un problema real, alguien está mirando

**Calibrá tu razonamiento**: si el state es ACTIVE_LOW_DEMAND, NO tratés métricas en cero como anomalías — son esperadas. NO repitas intenciones tipo "verificar pipeline / data validation / emergency" mientras el state esté así. Tu valor en este state es VER OPORTUNIDADES (drivers que se podrían activar, contenido que generaría engagement, patrones de demanda emergente).

Si el state cambia a INVESTIGATING o ves evidencia clara de fallo (anomalías 'critical' nuevas, status='failure' en agentes), ahí sí escalá urgencia.

"""

# ─── Bloque 2: tipos canónicos ────────────────────────────────
# Va antes del "Formato de output (OBLIGATORIO)". Le dice a MyCortex
# qué tipos están en RULES y por ende son ejecutables — preferilos.
CANONICAL_TYPES = """# Tipos canónicos (preferí estos cuando apliquen)

El Orchestrator tiene reglas configuradas para estos `type` strings. Si
emitís intenciones con estos types, se ejecutan automáticamente (Cat 1/2)
o se mandan a aprobación humana (Cat 3). Con types fuera de este set
caen a `human_only` (operador decide manual).

## Cat 1 — info-only (auto-ejecuta sin notificar)

- `log_anomaly` — registra una anomalía cross-agente que vos detectaste
   pero ningún agente individual reportó. Útil cuando ves un patrón que
   solo se nota agregando data de varios agentes. payload: `{type, severity, message, data}`.

## Cat 2 — reversibles (auto-ejecuta + notifica)

- `open_ticket` — abre handoff a humanos en customer-support. payload:
   `{userId?, reason, priority?: 'RED'|'ORANGE'|'NORMAL'}`. Si no pasás userId,
   se crea uno virtual `cerebro:<decisionId>`.
- `investigate_driver` — handoff específico para investigación de un conductor.
   target = driverId. data ={...evidencia}.
- `page_oncall_operator` — alerta a operadores via Telegram (no abre ticket,
   solo despierta guardia). payload: `{message, priority?}`.
- `cleanup_stale_customer_handoffs` — cierra tickets fantasma sin operatorId.
   Útil cuando ves handoffs con updatedAt de hace >7d. data: `{olderThanDays?: 7}`.

## Cat 3 — irreversibles (requieren ack humano via Telegram, 15min timeout)

- `boost_driver_supply` — bono a conductores en una zona específica.
   target = zona/sector. data = `{amount?, durationMin?}`.

## Tipos human_only (NO ejecutables, solo reportes)

Estos se reportan al operador para decisión manual. Si no encaja en los
canónicos, podés inventar tipo (snake_case) y el operador lo verá:

- `replicate_viral_format`, `add_more_operators`, `configure_operators`,
  `schedule_content_review_session`, `review_platform_content`,
  `request_human_decision_on_zero_state`, `confirm_system_operational_state`,
  `establish_manual_monitoring_fallback`, `audit_snapshot_generation_logic`,
  `request_going_agent_deep_dive`, `emergency_data_validation`.

Preferí siempre los canónicos cuando apliquen. Inventá tipos solo cuando
realmente no encaja ninguno y necesitás decir algo al operador.

"""


def main():
    # 1. Fetch default prompt
    print(f"[*] Fetching default prompt...")
    req = urllib.request.Request(f"{MYCORTEX}/mycortex/config/default")
    with urllib.request.urlopen(req, timeout=30) as resp:
        default = json.loads(resp.read().decode())["systemPrompt"]
    print(f"   default: {len(default)} chars")

    # 2. Compose new prompt
    # Insertamos los 2 bloques. El hint operacional al inicio (después del párrafo
    # introductorio "Eres MyCortex..."). Los canonical types antes del formato output.
    intro_split = default.split("\n# Las 4 capas del sistema", 1)
    if len(intro_split) != 2:
        print("[!] No se pudo encontrar '# Las 4 capas del sistema' para insertar hint")
        sys.exit(1)
    after_intro = "\n# Las 4 capas del sistema" + intro_split[1]

    format_split = after_intro.split("\n# Formato de output", 1)
    if len(format_split) != 2:
        print("[!] No se pudo encontrar '# Formato de output' para insertar canonical types")
        sys.exit(1)

    new_prompt = (
        intro_split[0]
        + "\n"
        + OPERATIONAL_STATE_HINT
        + format_split[0]
        + "\n"
        + CANONICAL_TYPES
        + "\n# Formato de output"
        + format_split[1]
    )
    print(f"   new:     {len(new_prompt)} chars (+{len(new_prompt) - len(default)})")

    # 3. PUT
    print(f"[*] PUT /mycortex/config (state={OPERATIONAL_STATE})...")
    body = json.dumps({
        "systemPrompt": new_prompt,
        "updatedBy":    f"calibration-script:{OPERATIONAL_STATE}",
    }).encode()
    req = urllib.request.Request(
        f"{MYCORTEX}/mycortex/config",
        data=body,
        method="PUT",
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        result = json.loads(resp.read().decode())
    if not result.get("ok"):
        print(f"[!] PUT failed: {result}")
        sys.exit(1)
    print(f"[OK] Updated. updatedAt={result.get('updatedAt')} updatedBy={result.get('updatedBy')}")
    print(f"   prompt now: {len(result.get('systemPrompt', ''))} chars in DB")
    print()
    print(f"Próximo run de MyCortex (max 30min, o force con):")
    print(f"   curl -X POST -H 'Content-Type: application/json' -d '{{}}' \\")
    print(f"     {MYCORTEX}/mycortex/run-now")


if __name__ == "__main__":
    main()
