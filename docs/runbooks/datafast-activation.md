# Runbook — Activar Datafast en producción

**Cuándo usar**: cuando llegue el nombramiento de Gerente de la Super de
Compañías y Datafast te entregue las credenciales API.

**Tiempo total**: 30-45 min (si todo va bien).

**Pre-requisitos**:
- Nombramiento vigente subido a la cuenta Datafast (vía pagina merchant)
- Credenciales recibidas: Entity ID, Access Token, Webhook Secret
- Acceso a `gcloud` con proyecto `going-5d1ae`
- Acceso a Cloud Run para los servicios `payment-service` y `transport-service`

---

## Pasos

### 1. Almacenar secrets en Secret Manager (5 min)

Las credenciales NUNCA van en código ni env vars planos.

```bash
# Reemplaza los valores con lo que te entregue Datafast
echo -n "TU_ENTITY_ID_AQUI" | gcloud secrets create DATAFAST_ENTITY_ID \
  --data-file=- --project=going-5d1ae

echo -n "TU_ACCESS_TOKEN_AQUI" | gcloud secrets create DATAFAST_ACCESS_TOKEN \
  --data-file=- --project=going-5d1ae

echo -n "TU_WEBHOOK_SECRET_AQUI" | gcloud secrets create DATAFAST_WEBHOOK_SECRET \
  --data-file=- --project=going-5d1ae
```

Si los secrets ya existen (versiones de prueba), agrega versión nueva:

```bash
echo -n "VALOR_NUEVO" | gcloud secrets versions add DATAFAST_ENTITY_ID \
  --data-file=- --project=going-5d1ae
```

### 2. Conectar secrets a payment-service (5 min)

```bash
gcloud run services update payment-service \
  --region=us-central1 \
  --project=going-5d1ae \
  --update-secrets="DATAFAST_ENTITY_ID=DATAFAST_ENTITY_ID:latest,DATAFAST_ACCESS_TOKEN=DATAFAST_ACCESS_TOKEN:latest,DATAFAST_WEBHOOK_SECRET=DATAFAST_WEBHOOK_SECRET:latest"
```

Verifica que se aplicaron:

```bash
gcloud run services describe payment-service --region=us-central1 \
  --project=going-5d1ae --format="value(spec.template.spec.containers[0].env)" \
  | tr ';' '\n' | grep DATAFAST
```

Debe mostrar 3 entries con `valueFrom.secretKeyRef`.

### 3. Switch del provider de mock → datafast (5 min)

```bash
gcloud run services update payment-service \
  --region=us-central1 \
  --project=going-5d1ae \
  --update-env-vars="PAYMENT_PROVIDER=datafast"
```

Igual para transport-service (que también usa el provider para rides):

```bash
gcloud run services update transport-service \
  --region=us-central1 \
  --project=going-5d1ae \
  --update-env-vars="PAYMENT_PROVIDER=datafast"
```

### 4. Configurar webhook URL en panel de Datafast (5 min)

Inicia sesión en el merchant portal de Datafast y configura el webhook:

```
URL: https://api.goingec.com/webhooks/datafast
Método: POST
Header firma: X-Datafast-Signature (HMAC-SHA256 con DATAFAST_WEBHOOK_SECRET)
Eventos a suscribir: payment.approved, payment.rejected
```

### 5. Smoke test con monto pequeño (10 min)

Crea un parcel con esquema A (sender + card) desde la app o web:

```bash
# Login como tester
TOKEN=$(curl -s -X POST https://api.goingec.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"staging@going.test","password":"Staging123!"}' \
  | grep -oE '"accessToken":"[^"]+"' | cut -d'"' -f4)

# Crear parcel monto bajo ($1)
curl -X POST https://api.goingec.com/parcels \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "origin":{"address":"Quito Test","latitude":-0.18,"longitude":-78.48},
    "destination":{"address":"Quito Test","latitude":-0.21,"longitude":-78.43},
    "description":"DATAFAST_SMOKE_TEST",
    "price":{"amount":1,"currency":"USD"},
    "paymentMethod":"card",
    "payerRole":"sender",
    "recipientName":"Test","recipientPhone":"+593900000000"
  }'
```

Esperado:
- Status 201
- Response incluye `paymentUrl` (apunta al widget de Datafast)
- Abrir paymentUrl en browser → ver widget Datafast (no error)
- Pagar con tarjeta de prueba que Datafast te haya dado
- Webhook llega: revisa logs de payment-service (`gcloud logging read`)
- parcel.paymentStatus pasa a 'paid' (revisa Mongo o `GET /parcels/:id`)

### 6. Verificar que rides también funcionan (5 min)

Crea un ride con tarjeta y verifica el mismo flow.

### 7. Monitoreo primeras 24h

Logs a vigilar:

```bash
# Errores en payment-service relacionados a Datafast
gcloud logging read 'resource.type="cloud_run_revision"
  resource.labels.service_name="payment-service"
  severity>=ERROR
  textPayload:datafast' \
  --project=going-5d1ae --limit=20 --freshness=24h

# Webhooks recibidos
gcloud logging read 'resource.type="cloud_run_revision"
  resource.labels.service_name="payment-service"
  textPayload:"Datafast pago"' \
  --project=going-5d1ae --limit=50 --freshness=24h
```

Si ves errores HTTP 401/403 → secret incorrecto.
Si ves "signature mismatch" → DATAFAST_WEBHOOK_SECRET no coincide con el que pusiste en panel.
Si los webhooks no llegan → URL incorrecta en panel o firewall.

---

## Rollback

Si Datafast falla en producción y necesitas volver a mock mientras
investigas:

```bash
gcloud run services update payment-service \
  --region=us-central1 \
  --project=going-5d1ae \
  --update-env-vars="PAYMENT_PROVIDER=mock"

gcloud run services update transport-service \
  --region=us-central1 \
  --project=going-5d1ae \
  --update-env-vars="PAYMENT_PROVIDER=mock"
```

Los pagos en flight quedan en estado `pending_payment` hasta que vuelvas
a Datafast. NO se pierden — webhooks pendientes se procesan cuando vuelve.

## Checklist final

- [ ] Secrets en Secret Manager (3 entries)
- [ ] Secrets conectados a payment-service
- [ ] PAYMENT_PROVIDER=datafast en payment-service y transport-service
- [ ] Webhook URL configurada en Datafast merchant portal
- [ ] Smoke test caso A con $1 funcionó
- [ ] Smoke test ride con $1 funcionó
- [ ] Logs sin errores en últimos 30 min
- [ ] Closed test users notificados que ya pueden pagar real (si se quiere)
