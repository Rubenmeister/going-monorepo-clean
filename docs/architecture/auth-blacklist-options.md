# Token Blacklist Strategy — Opciones A1 / A2 / A3

**Status**: A3 implementado · A1 / A2 documentados para retomar post-AAB
**Última actualización**: 2026-05-17

## Contexto

Cuando una persona usuaria hace logout (o un admin revoca su sesión), el access
token JWT sigue siendo válido hasta su `exp` por la naturaleza stateless del
JWT. Para invalidarlo antes, hay 3 estrategias.

`BaseJwtStrategy` (libs/shared/infrastructure/src/strategies/base-jwt.strategy.ts)
solo valida firma + expiración. **No consulta blacklist**. La revocación real
solo vive en `api-gateway` (que tiene Redis via `gateway-token-manager.service.ts`).

Riesgo: services tienen URLs Cloud Run públicas (`*.run.app`) con
`--allow-unauthenticated`. Un atacante con un access token revocado puede
hitearlas directamente y bypassear el chequeo del gateway.

## A1 — Ingress lockdown (servicios privados, gateway único entry)

**Idea**: Los services dejan de ser públicos. Solo api-gateway es accesible
desde Internet. api-gateway invoca services con OIDC token de service account.

**Pasos**:
1. Quitar `--allow-unauthenticated` de `cloudbuild-microservices.yaml` para
   todos los services excepto api-gateway
2. Crear service account `api-gateway-invoker` con role
   `roles/run.invoker` sobre cada service
3. En el proxy de api-gateway, adjuntar OIDC token a cada request upstream:
   ```ts
   const auth = new GoogleAuth();
   const client = await auth.getIdTokenClient(targetServiceUrl);
   const idToken = await client.idTokenProvider.fetchIdToken(targetServiceUrl);
   headers['Authorization-Internal'] = `Bearer ${idToken}`;
   ```
4. Cada service valida el OIDC token de la IAM layer (Cloud Run lo hace
   automáticamente cuando IAM-restricted)

**Pros**:
- Sin latencia extra en la ruta de validación JWT
- Blacklist sigue solo en api-gateway (1 lugar)
- Defensa fuerte: aunque alguien obtenga URL Cloud Run de un service, IAM
  rechaza sin OIDC válido

**Contras**:
- 1-2h de trabajo infra (service accounts, IAM bindings, OIDC propagation)
- Tests directos contra services Cloud Run dejan de funcionar; hay que pasar
  por gateway o usar `gcloud run services proxy`
- agent-bridge, cerebro y otros que invocan service-to-service también
  requieren OIDC

**Costo**: $0/mo · 1-2h ingeniería

## A2 — Distributed Redis blacklist (defense in depth)

**Idea**: `BaseJwtStrategy.validate()` consulta Redis en CADA request. Cualquier
service revoca igual.

**Pasos**:
1. Inyectar Redis client en `BaseJwtStrategy` (vía DI o como dependencia
   peer del Module que registra la strategy)
2. En `validate(payload)`, consultar `SISMEMBER blacklist:${payload.jti}`
3. Si está blacklisted → `throw new UnauthorizedException('Token revoked')`
4. Cuando `/auth/logout` revoca, agrega a Redis el jti del access token con
   TTL = remaining exp del token
5. Cada service necesita `REDIS_URL` en env vars

**Pros**:
- Defense in depth — cada service valida independiente
- Revocación efectiva en <100ms desde logout

**Contras**:
- +1-5ms por request × N services (Redis lookup)
- Redis es SPOF — si cae, qué hacemos? (fail-open = inseguro · fail-closed = DoS)
- Tests aislados de services necesitan Redis mock o test container

**Costo**: $0/mo (Redis ya provisionado) · 2-3h ingeniería · ops siempre online

## A3 — Short TTL + refresh-based revocation (IMPLEMENTADO 2026-05-17)

**Idea moderna estándar (Auth0/Okta-style)**: access tokens muy cortos
(15 min), refresh tokens largos (7-30 días) revocables en Redis. Cuando se
revoca el refresh, el siguiente intento de refresh falla → user efectivamente
loggeado out tras < TTL del access.

**Pasos**:
1. Confirmar que `/auth/login` retorna `refreshToken` (pre-fix tarea: el
   barrel exportaba CORE LoginUserUseCase sin TokenManager)
2. Confirmar que mobile authService refresca antes del expiry
   (mobile-user-app/src/services/authService.ts ya tiene 60s proactive refresh)
3. Bajar `JWT_ACCESS_TOKEN_EXPIRES_IN` de 7d → 15m en Cloud Run env
4. Mantener `JWT_REFRESH_TOKEN_EXPIRES_IN` en 30d
5. Refresh repository ya existe (`redis-refresh-token.repository.ts`) →
   `/auth/logout` revoca el refresh → user logged out

**Pros**:
- Cero infra nueva
- Estándar industria — facil de auditar
- Ya construido parcialmente

**Contras**:
- Ventana de exposición: 15 min entre logout y access token expirando
- Para apps de muy alta sensibilidad (banca) sería insuficiente
- Mobile DEBE refrescar correctamente o user ve sesiones expirando

**Costo**: $0/mo · 1-2h (fix login + cambio env var) · cero ops nuevo

## Decisión 2026-05-17

Going implementa **A3** porque:
1. Menor obra para AAB ready
2. Ventana de 15 min es aceptable para una app de ride-sharing pre-AAB
3. La infra de refresh + revocación ya estaba parcialmente construida
4. Mobile authService ya soporta refresh proactivo

**A1 o A2 quedan para topar cuando**:
- Hagamos compliance review (PCI/SOC2)
- Tengamos un incidente de access token leak
- Crezca el equipo de security
- Empezar transacciones financieras de mayor monto (Datafast activo)

## Smoke contract para A3

```yaml
# docs/contracts/security.yaml (futuro)
- id: login-returns-refresh-token
  test: 'POST /auth/login with valid creds'
  expect: 'response.refreshToken length > 20'
  severity: P0
- id: refresh-returns-valid-access
  test: 'POST /auth/refresh with valid refreshToken'
  expect: 'decoded JWT has email + roles non-empty'
  severity: P0
- id: logout-revokes-refresh
  test: 'POST /auth/logout, then POST /auth/refresh with same refreshToken'
  expect: '401 Unauthorized'
  severity: P0
- id: access-token-ttl
  test: 'decode JWT from login'
  expect: '(exp - iat) <= 16 * 60'
  severity: P1
```
