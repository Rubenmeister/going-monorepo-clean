# Plan de refactor AUTH — pendiente post-AAB

**Status**: Diseño · pendiente implementación post-AAB
**Creado**: 2026-05-13
**Contexto**: durante la revisión final pre-AAB se detectó que el path activo
de login en producción no devuelve `refreshToken`, y existen versiones
duplicadas (dead code) de `LoginUserUseCase` y `AuthController`.

## Estado actual (post quick fix)

### Quick fix aplicado (2026-05-13)

- `JWT_ACCESS_TOKEN_EXPIRES_IN=7d` en Cloud Run `user-auth-service`
- `JWT_REFRESH_TOKEN_EXPIRES_IN=30d` (para cuando refresh exista)
- Verificado: JWT decodificado expira a +7d desde `iat`

Mobile/web pueden operar 7 días por login sin necesidad de refresh.

### Lo que aún está roto / mal arquitecturado

1. **Login no devuelve `refreshToken` ni `expiresIn`**
   El `LoginUserUseCase` activo es el de `domains-user-core`, que solo
   genera access token (vía `tokenService.generateAuthToken`, marcado
   `@deprecated`). El barrel `domains-user-application` re-exporta el
   core, no el application.

2. **Dos `LoginUserUseCase`** distintos:
   - **CORE activo** (`libs/domains/user/core/src/lib/use-cases/login-user.use-case.ts`):
     simple, sin lockout, sin refresh. Es el que corre.
   - **APPLICATION muerto** (`libs/domains/user/application/src/lib/use-cases/login-user.use-case.ts`):
     completo (lockout, refresh, TokenManager), pero **nunca se ejecuta**
     porque el barrel no lo expone.

3. **Dos `auth.controller.ts`** en `user-auth-service`:
   - **`src/api/auth.controller.ts`** — registrado en `AppModule`, activo.
   - **`src/presentation/controllers/auth.controller.ts`** — no registrado, dead code.

4. **JwtTokenService.generateAuthToken**
   - Marcado `@deprecated`, solo delega a `generateAccessToken`.
   - Aún lo usa el CORE use case → el flujo "correcto" (TokenManager + refresh
     repository en Redis) está implementado pero inalcanzable desde login.

5. **Mobile `authService` espera refresh tokens**:
   - `expo-secure-store` guarda `auth_refresh_token`
   - In-flight dedup, 60s proactive refresh
   - Toda esta lógica nunca se dispara porque `refreshToken` no llega del backend

## Refactor propuesto

### Fase 1 — Unificar `LoginUserUseCase`

Decisión: la versión "buena" vive en **`domains-user-application`** (depende
de `ITokenManager` que es infra), no en core. Esto respeta el principio DDD
de que `core` no conoce infraestructura.

Pasos:

1. Borrar `libs/domains/user/core/src/lib/use-cases/login-user.use-case.ts`.
2. Actualizar `libs/domains/user/application/src/index.ts` para exportar
   `LoginUserUseCase` desde la versión local de application, no re-exportada
   desde core:
   ```ts
   // Antes
   export { LoginUserUseCase } from '@going-monorepo-clean/domains-user-core';

   // Después
   export { LoginUserUseCase } from './lib/use-cases/login-user.use-case';
   ```
3. Verificar que la versión application no importe del propio
   `user-auth-service` (cycle). El `AccountLockoutService` que usa debe
   moverse a `libs/domains/user/infrastructure/` o se debe inyectar por
   interface.

### Fase 2 — Limpiar `auth.controller.ts` duplicado

1. Borrar `user-auth-service/src/presentation/controllers/auth.controller.ts`.
   Es dead code (no está en `AppModule.controllers`).
2. Revisar `user-auth-service/src/presentation/dtos/auth-refresh.dto.ts`:
   si solo lo usa el controller muerto, borrar también.

### Fase 3 — Wire refresh tokens end-to-end

Tras Fase 1, el use case devuelve `{token, refreshToken, expiresIn, user}`.
El controller ya lo spread-a en su return — debería propagar automáticamente.

Validación:

- [ ] `POST /auth/login` devuelve `refreshToken` no vacío
- [ ] `POST /auth/refresh` con ese refreshToken devuelve 200 + nuevo
      `accessToken`
- [ ] Refresh token está persistido en Redis (`refresh_token:<id>`)
- [ ] Mobile authService refresca antes del expiry (test manual con
      `JWT_ACCESS_TOKEN_EXPIRES_IN=1m`)
- [ ] Logout revoca el refresh token (Redis key se borra)

### Fase 4 — Reducir expiración del access token

Una vez refresh funciona end-to-end:

- `JWT_ACCESS_TOKEN_EXPIRES_IN=15m` (volver al default seguro)
- `JWT_REFRESH_TOKEN_EXPIRES_IN=7d` (estándar de la industria)
- 30 días es excesivo para refresh; 7 días basta y reduce ventana de
  exposición si un device se compromete

### Fase 5 — Marcar `generateAuthToken` para borrar

Tras Fase 1, ningún código activo lo llama. Es seguro borrarlo del
`JwtTokenService` y del `ITokenService` interface.

## Testing checklist

Antes de merge:

- [ ] Unit tests del `LoginUserUseCase` (application) pasan
- [ ] Integration test: POST /auth/login retorna refreshToken
- [ ] Integration test: POST /auth/refresh acepta el refreshToken y retorna nuevo accessToken
- [ ] Integration test: POST /auth/logout revoca el refreshToken
- [ ] Integration test: refresh con token revocado → 401
- [ ] Manual: mobile flow con JWT corto (60s) refresca sin que el usuario lo note
- [ ] Manual: web flow con JWT corto refresca via cookie httpOnly

## Riesgos

- **Cambiar el barrel** puede romper otros consumidores que esperan la
  shape `{accessToken, user}` del CORE. Buscar todos los lugares que
  llaman `loginUserUseCase.execute()` o consumen `LoginResponseDto` y
  validar que aceptan los campos extra (TS permite extras por defecto).

- **Redis disponibilidad**: si Redis cae, el refresh token no se puede
  guardar y login fallaría. El use case application maneja esto con `Result`
  pero hay que confirmar que el fallback es razonable (¿devolver
  accessToken sin refresh? ¿401?). Decisión de producto.

- **Sesiones existentes** con JWT viejos seguirán válidas hasta su
  expiración (7d post quick-fix). Los clientes no harán refresh porque
  no tienen refreshToken — se re-loguearán cuando el access expire.

## Referencias

- Quick fix: commit (post-AAB review 2026-05-13)
- Bugs originales detectados en revisión final pre-AAB
- Mobile auth service: `mobile-user-app/src/services/authService.ts`
- Cloud Run env vars: `user-auth-service` revision 00249-gnl en adelante
