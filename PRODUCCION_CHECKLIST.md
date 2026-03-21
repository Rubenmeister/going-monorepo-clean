# Checklist Going → Producción

Fecha: 2026-03-16 | Branch: `claude/complete-going-platform-TJOI8`

---

## 1. Variables de entorno — transport-service

| Variable | Valor requerido | Estado |
|---|---|---|
| `NODE_ENV` | `production` | ☐ |
| `PORT` | `3001` | ☐ |
| `MONGODB_URI` | URI Atlas producción | ☐ |
| `JWT_SECRET` | string aleatorio ≥ 64 chars | ☐ |
| `PAYMENT_PROVIDER` | `mock` (sandbox) → `datafast` (prod) | ☐ |
| `DATAFAST_MERCHANT_ID` | De tu cuenta DATAFAST | ☐ |
| `DATAFAST_TERMINAL_ID` | De tu cuenta DATAFAST | ☐ |
| `DATAFAST_API_KEY` | De tu cuenta DATAFAST | ☐ |
| `DATAFAST_API_URL` | `https://ccapi-test.datafast.com.ec` (sandbox) | ☐ |
| `DATAFAST_MODE` | `redirect` | ☐ |
| `DATAFAST_WEBHOOK_SECRET` | String secreto que registras en DATAFAST | ☐ |
| `APP_BASE_URL` | URL pública del backend (Cloud Run) | ☐ |
| `TWILIO_ACCOUNT_SID` | De Twilio | ☐ |
| `TWILIO_AUTH_TOKEN` | De Twilio | ☐ |
| `TWILIO_PROXY_SERVICE_SID` | De Twilio | ☐ |

## 2. Variables de entorno — frontend-webapp y admin-dashboard

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL pública del backend |
| `NEXT_PUBLIC_GOOGLE_MAPS_KEY` | Clave Maps |

## 3. DATAFAST — Configuración sandbox (antes de producción)

1. Registrar cuenta en [DATAFAST Ecuador](https://www.datafast.com.ec)
2. Obtener `Merchant ID`, `Terminal ID` y `API Key` del portal sandbox
3. Configurar webhook en el portal DATAFAST → URL: `POST https://TU_BACKEND/payments/webhook`
4. Copiar `Webhook Secret` → `DATAFAST_WEBHOOK_SECRET`
5. Cambiar `DATAFAST_API_URL` a `https://ccapi-test.datafast.com.ec`
6. Probar flujo completo con tarjeta de prueba DATAFAST
7. Cambiar a producción: `DATAFAST_API_URL=https://ccapi.datafast.com.ec`

## 4. Docker / Cloud Run

```bash
# Build transport-service
docker build -f transport-service/Dockerfile -t gcr.io/PROJECT_ID/transport-service .

# Deploy
gcloud run deploy transport-service \
  --image gcr.io/PROJECT_ID/transport-service \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars NODE_ENV=production,MONGODB_URI=...,JWT_SECRET=...
```

## 5. Base de datos MongoDB Atlas

- [ ] Cluster de producción creado (M10 mínimo)
- [ ] IP Whitelist: agregar IPs de Cloud Run (0.0.0.0/0 o IP estática)
- [ ] Usuario de BD con permisos `readWrite` sobre la DB de producción
- [ ] Backup automático habilitado
- [ ] Connection string en `MONGODB_URI`

## 6. Pruebas pre-producción

- [ ] `npm test` en transport-service — todos los tests pasan
- [ ] Flujo mock pago: solicitar viaje → pagar → `/payment/result?status=approved`
- [ ] Flujo DATAFAST sandbox con tarjeta de prueba
- [ ] Login admin dashboard → redirige correctamente tras autenticarse
- [ ] Rutas protegidas (sin sesión) redirigen a `/login`
- [ ] Webhook DATAFAST recibe y verifica firma HMAC

## 7. Seguridad

- [ ] `JWT_SECRET` es único y ≥ 64 caracteres aleatorios
- [ ] Rate limiting activo (ThrottlerGuard en transport-service)
- [ ] Middleware de rutas activo (admin-dashboard y frontend-webapp)
- [ ] `DATAFAST_WEBHOOK_SECRET` configurado (rechaza webhooks sin firma)
- [ ] Headers CORS configurados para el dominio final
- [ ] HTTPS en todos los endpoints (Cloud Run lo provee automáticamente)

## 8. Comandos útiles

```bash
# Generar JWT_SECRET seguro
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Generar DATAFAST_WEBHOOK_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Test webhook local
curl -X POST http://localhost:3001/payments/webhook \
  -H "Content-Type: application/json" \
  -H "x-datafast-signature: TEST" \
  -d '{"transactionId":"test","status":"approved"}'
```

## 9. Branch y deploy

```bash
# Hacer push del branch con todos los cambios
git push origin claude/complete-going-platform-TJOI8

# O merge a main
git checkout main && git merge claude/complete-going-platform-TJOI8
git push origin main
```

---

**Estado del branch:** listo para staging. Cambiar `PAYMENT_PROVIDER=mock → datafast` cuando lleguen las credenciales DATAFAST.
