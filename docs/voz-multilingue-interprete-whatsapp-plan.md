# Voz multilingüe, intérprete y WhatsApp Calling — plan

> Estado y hoja de ruta de la atención por VOZ de Going (1-jul-2026).

## Estado actual (lo que YA está)

- **Agente multilingüe (Uyari)** — `voice-call-service`, OpenAI Realtime (`gpt-realtime-mini`).
  El cliente **llama y pregunta**; Uyari **entiende y responde con conocimiento Going**.
  Reforzado 1-jul con una **regla universal de idioma** (responde SIEMPRE en el idioma del
  cliente: es/en/fr/de/kichwa; el modelo Realtime es multilingüe nativo — NO se pivota por
  Gemini para no romper el tiempo real). Número US Uyari: `+1 786 610 5889` (el local +593
  sigue pendiente de ARCOTEL).
- **Intérprete conductor↔pasajero (MVP)** — modo `mode='interpreter'` en el gateway +
  `gemini-live.adapter` + `interpreter-bridge` + codec μ-law↔PCM. Ruta
  `POST /twilio/interpreter-webhook`. Unidireccional (1 persona habla, oye traducción).
  Motor validado en formato-teléfono (TTFB ~2.4s). Falta apuntar un número Twilio libre.

Diferencia clave: **agente** = te responde tus preguntas; **intérprete** = solo traduce
entre dos personas.

## Fase 1 — Intérprete conductor↔pasajero de 2 personas (conferencia)

Objetivo: viajera extranjera y conductor se entienden en vivo, cada uno en su idioma.

Arquitectura:
1. Twilio **Conference** con los 2 participantes (o 2 legs puenteados).
2. **DOS** sesiones Gemini Live por llamada (una por sentido): A→B (es→en) y B→A (en→es).
3. Ruteo de audio: el audio del participante A entra a la sesión A→B; su salida se reproduce
   al participante B; y viceversa. Requiere separar tracks por participante (Media Streams
   con `track` por leg, o conference con coaching/whisper).
4. Turn-taking / eco: evitar que la traducción de A reingrese como input de la sesión B→A
   (gating por VAD + no realimentar el audio sintetizado).
5. Costo: 2 sesiones Gemini Live simultáneas por llamada + Twilio conference/min.

Complejidad: alta (ruteo de audio bidireccional + anti-eco). Reusa `gemini-live.adapter`.

## Fase 2 — WhatsApp Calling (canal ideal a mediano plazo)

Por qué: el cliente llama al **+593 98 403 7949** (el número que ya conoce), en tiempo real,
**gratis para el cliente**, y las llamadas **entrantes no le cuestan a la empresa** (Meta solo
cobra salientes). Sirve para AMBAS funciones (agente multilingüe e intérprete).

Requisitos y pasos:
1. **Desbloquear Meta (lo primero, gestión — NO código)**: WhatsApp Business Platform con
   verificación de negocio + solicitar acceso a la **WhatsApp Business Calling API** en el
   número. El WABA de Going estuvo restringido → resolver eso es el bloqueo #1.
2. **Puente de media**: webhook recibe `connect` con `call_id` + `session.sdp` (oferta SDP) →
   establecer WebRTC (ICE + DTLS + **SRTP**, códec **Opus**) → puentear el audio a
   Uyari/Gemini (mismo patrón que el bridge de Twilio, + handshake WebRTC). Alternativa: SIP
   (Asterisk/PJSIP) con Opus+SRTP.
3. **Ruteo por idioma**: es/en → Uyari directo; fr/de/kichwa → Uyari con la regla universal
   (o pivote para texto). Intérprete: 2 sesiones Gemini.
4. **Costo**: entrante gratis (cliente y empresa); solo la IA (Gemini/OpenAI). Mucho más
   barato que Twilio internacional (que además muestra caller-ID US).

Fuentes: Meta Calling API pricing (developers.facebook.com), WebRTC.ventures (integración
WebRTC/SDP), wuseller (SIP/límites 2026).

## Pendiente operativo transversal
- **Base de conocimiento** del agente (tarifas, regulación, turismo, geografía) — ver
  [[going-support-knowledge-base]]. Sin esto, el agente responde genérico en cualquier idioma.
- **ARCOTEL**: número local EC +593 para Uyari sigue pendiente.
