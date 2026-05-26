# Fase A — Cerebro autónomo con allowlist

**Estado**: skeleton implementado, no integrado todavía al dispatcher.
**Branch**: `feat/cerebro-autonomous-phase-a`.

## Qué se hizo en esta sesión

### Archivos nuevos

1. **`src/decision/autonomous-allowlist.ts`**
   Lista explícita de qué `intent.type` puede auto-ejecutar. Segunda capa
   defensiva sobre `MAX_AUTO_LEVEL`. Hoy contiene **una sola entrada**:
   `cleanup_stale_customer_handoffs` (la del incidente del 26 may).

2. **`src/decision/action-verifier.service.ts`**
   Servicio que toma snapshot de una métrica antes de ejecutar, espera
   `waitMs`, vuelve a medir, y persiste si la acción convergió. Sin
   integración real al Mongo de customer-support todavía
   (`measureMetric()` devuelve -1 como sentinel).

3. **`src/infrastructure/schemas/action-verification.schema.ts`**
   Mongoose schema para `action_verifications` collection. Una row por
   verificación, con before/after/delta/converged.

### Lo que NO está hecho todavía

1. **Cableado al dispatcher.** `dispatcher.service.ts` aún no llama al
   verifier. Antes de la línea `await this.executeNow(...)` para Cat 2,
   habría que:

   ```ts
   const allowEntry = findAutonomousEntry(intent.type);
   if (!allowEntry) {
     baseDecision.status = 'dormant';
     baseDecision.dormantReason = 'not_in_autonomous_allowlist';
     // log + persist + return
   }
   if ((intent.urgency ?? 0) < allowEntry.minUrgency) {
     baseDecision.status = 'dormant';
     baseDecision.dormantReason = `urgency_below_threshold:${allowEntry.minUrgency}`;
     // ...
   }
   const { verificationId } = await this.verifier.snapshotBefore({ decisionId, entry: allowEntry });
   // ejecutar...
   this.verifier.scheduleVerification({ verificationId, entry: allowEntry });
   ```

2. **`measureMetric('pending_red_handoffs')`** sigue devolviendo -1.
   Necesita conexión al Mongo de customer-support. Opciones:
   - **A**: agregar `CUSTOMER_SUPPORT_MONGO_URL` como env var del
     orchestrator (mismo cluster Atlas, mismo VPC connector
     `going-connector` que ya tiene).
   - **B**: exponer un endpoint admin en customer-support-service:
     `GET /admin/metrics/pending-red-handoffs?olderThanH=24` y que el
     verifier lo consuma vía HTTP. Más limpio arquitectónicamente
     porque el orchestrator no conoce el schema de Mongo de otro
     servicio.

   **Recomiendo B** — sigue el principio de "agents are bounded contexts".

3. **Rollback automático**. Hoy `onVerifyFail` solo soporta `alert_only`
   en la práctica (la rama `rollback` en `runVerification` es un TODO).
   Para activarlo:
   - Implementar `rollback_cleanup_handoffs` en customer-support: revertir
     status='auto_closed_stale' → 'handoff' para los docs cerrados en
     los últimos N min.
   - Cambiar la entry en allowlist a `onVerifyFail: 'rollback'`.

4. **Notificación a Telegram cuando una verificación falla**. Hoy solo se
   loguea. Cuando confiemos en el verifier (zero false positives), conectar
   a `telegram-approval.service.ts` para emitir un alert.

5. **Cola persistente para `scheduleVerification`**. Hoy usa `setTimeout`
   in-memory — si la API se reinicia entre el dispatch y el `waitMs`,
   se pierde la verificación. Para producción real, mover a BullMQ o
   Cloud Tasks. Para Fase A es aceptable: el peor caso es "el doc en
   Mongo queda con `status: 'pending_verification'` para siempre" — el
   operador lo ve en el dashboard y revisa manualmente.

6. **Module wiring**. Hay que agregar:
   - `ActionVerifierService` a los providers de `app.module.ts`
   - `ActionVerificationSchema` a `MongooseModule.forFeature([...])`

7. **Tests**:
   - Unit: `autonomous-allowlist.findAutonomousEntry()`
   - Unit: `action-verifier.measureMetric` con mock Mongo
   - Integration: dispatcher con intent que pasa allowlist → verifica
     que `action_verifications` se crea con status pending_verification.

## Plan de rollout

| Día | Acción |
|---|---|
| D+0 (hoy) | Skeleton mergeado a main en branch separada |
| D+1 | Cablear dispatcher (gate de allowlist + minUrgency) + module wiring |
| D+2 | Implementar `measureMetric` real vía endpoint en customer-support |
| D+3 | Deploy a Cloud Run, `MAX_AUTO_LEVEL=0` todavía (dormant) |
| D+4 | Inyectar manualmente una intention de prueba → ver que el flow llega a `executed` + `action_verifications` doc |
| D+7 | Subir `MAX_AUTO_LEVEL=2` con horario restringido (solo 22h-6h Ecuador) |
| D+14 | Si zero false positives en 7 días, agregar 2da entrada a allowlist |
| D+30 | Activar rollback automático para `cleanup_handoffs` |

## Por qué este diseño es seguro

1. **Defensa en profundidad**: aún si alguien clasifica una regla en
   Cat 2 por error, si su `intent.type` no está en `AUTONOMOUS_ALLOWLIST`
   queda dormant.
2. **Urgency gate**: MyCortex debe estar al menos 0.85 seguro. Los
   intents de "FYI" suelen ser ≤ 0.5.
3. **Audit completo**: cada ejecución autónoma deja 2 rows en Mongo
   (`decisions` + `action_verifications`) con before/after measurable.
4. **Reversibilidad**: el cleanup actual marca status='auto_closed_stale'
   en lugar de borrar. Un operador puede reabrir un doc cerrado por error
   con un update query trivial.
5. **Master switch**: `ORCHESTRATOR_EXECUTE_ENABLED=false` corta todo el
   flujo autónomo en 1 segundo (env var update en Cloud Run).

## Por qué NO usar este código para acciones que mueven dinero

Cualquier cosa que toque pagos, payouts a drivers, gasto de marketing,
o que envíe mass-comms a usuarios NO debe estar en `AUTONOMOUS_ALLOWLIST`
hasta que tengamos:
  - rollback automático probado
  - rate limit por hora (ej. máx 1 acción autónoma/hora del mismo type)
  - notificación instantánea a Telegram con opción "deshacer" en 60s
  - 30 días de observación en dormant mode

Esas restricciones llegarían en Fase B/C del roadmap, no Fase A.
