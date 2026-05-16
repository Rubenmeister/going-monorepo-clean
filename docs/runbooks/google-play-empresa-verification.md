# Runbook — Migrar Google Play Console de cuenta personal a Empresa

**Cuándo usar**: cuando el nombramiento de Gerente de la Super de Compañías
salga vigente y quieras verificar Going como **Organization** en Google
Play (en lugar de **Personal account** que tienes hoy).

**Por qué importa**:
- Mejor reputación frente a Google (menos chance de baneo arbitrario)
- En algunos casos la regla 12-testers/14-días se relaja
- Múltiples usuarios pueden gestionar (tu equipo)
- Requerido si vas a publicar features que requieran verificación
  comercial (ej. pagos in-app, suscripciones)

**Tiempo total**: 1-3 semanas (Google revisa documentación; no es algo
inmediato, es burocrático).

---

## Pre-requisitos

- Empresa constituida (en tu caso GOING SAS o como esté formalmente)
- **Nombramiento de Gerente vigente** (sello de la Super de Compañías)
- RUC ecuatoriano vigente
- Identificación del representante legal (cédula y/o pasaporte)
- D-U-N-S Number (gratis en Dun & Bradstreet) — toma ~30 días, mejor
  iniciar en paralelo
- Cuenta Google de la empresa (recomendado, no la personal)

---

## Pasos

### 1. Crear cuenta Google empresarial dedicada (15 min)

Si todavía estás usando `rubenmeister@gmail.com`, esto puede traerte
problemas más adelante. Recomendado: crear `play@goingec.com` (Google
Workspace) y migrar.

Si no quieres mover la cuenta, puedes verificar la actual como
Organization. Pero la opción de cuenta empresa-dedicada es más limpia.

### 2. Solicitar D-U-N-S Number (si no lo tienes — paralelo)

Inicia ANTES de empezar la verificación, porque tarda ~30 días:

- Ir a https://www.dnb.com/duns-number/get-a-duns.html
- Seleccionar país: Ecuador
- Ingresar datos de la empresa (RUC, dirección, teléfono)
- Esperar email de confirmación
- Es gratis. NO pagues si te ofrecen "premium"

### 3. Cambiar tipo de cuenta a Organization en Play Console (15 min)

1. Play Console → **Cuenta de desarrollador** (sidebar izquierdo)
2. Sección **Tipo de cuenta** → **Cambiar a organización**
3. Ingresa:
   - Nombre legal de la empresa (exactamente como en RUC)
   - DUNS Number (cuando lo tengas)
   - Sitio web: https://goingec.com
   - Email de contacto: oficial@goingec.com (o uno tuyo)
   - Teléfono de la empresa
   - Dirección registrada

### 4. Subir documentación de verificación (30 min)

Google pedirá:
- **Certificado de existencia** de la empresa (Super de Compañías)
- **Nombramiento de Gerente** vigente
- **RUC** vigente
- **Identificación** del representante legal (ambos lados de la cédula
  + selfie sosteniendo la cédula)
- **Comprobante de domicilio** (planilla de luz/agua de la dirección
  de la empresa, no más de 3 meses)

Subir todos en formato PDF claro, no fotos borrosas (Google rechaza
docs ilegibles y vuelves a cero).

### 5. Esperar verificación de Google (1-3 semanas)

Llega un email "Cuenta verificada" o solicita más documentación.

Si te piden más docs:
- Lee con cuidado qué piden — es específico
- Subes y vuelves a esperar
- Cada ronda son 3-7 días extra

### 6. Una vez verificado: actualizar firma de apps (1 hora)

Las apps que ya están en el Closed Test están firmadas con tu cuenta
personal. Para que se asocien a la organización, hay opciones:

**Opción A (recomendada): mantener firma actual**
- La firma se mantiene válida — no necesitas re-firmar
- Solo el "publisher account" cambia a Organization
- Apps existentes siguen funcionando para usuarios actuales
- Cero downtime

**Opción B: re-publicar bajo nueva cuenta** (NO RECOMENDADO)
- Solo si tu cuenta personal queda completamente inactiva
- Implica que TODOS los usuarios deben re-instalar (mala UX)
- Solo hacer si Google lo exige explícitamente

### 7. Configurar usuarios y permisos (10 min)

Una vez Organization, puedes invitar a tu equipo:

- Play Console → **Usuarios y permisos** → **Invitar nuevos usuarios**
- Roles típicos:
  - **Admin**: tú + 1 socio máximo
  - **Release manager**: dev lead que sube AABs
  - **Customer Support**: ve crashes, reviews, no toca releases
  - **Marketing**: solo edita Store Listing (textos, imágenes)

### 8. Re-evaluar reglas de Closed Test

Algunas (no todas) las cuentas Organization tienen reglas relajadas:

- Verifica en Producción → "Solicitar acceso" si los criterios cambiaron
- Si todavía piden 12 testers/14 días, sigue igual
- Si bajan los criterios, ¡aprovecha y publica!

---

## Plan B mientras esperas verificación

No tienes que parar. Puedes:

1. Seguir con cuenta personal en Closed Test → cumplir 14 días/12 testers
2. Salir a Producción con cuenta personal
3. Migrar a Organization después (Google permite "transfer" de apps a
   nueva cuenta, aunque es delicado)

La verificación Organization te da beneficios pero NO es bloqueante para
salir a Producción si tu cuenta personal cumple los requisitos.

---

## Errores comunes

| Error | Causa | Solución |
|---|---|---|
| "Documents illegible" | Foto borrosa de cédula | Re-escanear con scanner real, no celular |
| "Address mismatch" | RUC tiene una dirección, planilla otra | Subir planilla con dirección IDÉNTICA al RUC |
| "DUNS not found" | DUNS muy reciente (no propagó) | Esperar 1 semana después de recibir DUNS |
| "Nombramiento expired" | Caducó mientras esperabas | Renovar en Super de Cías y re-subir |
| "Cannot verify business name" | Nombre legal en RUC no coincide con el que escribiste | Copy-paste exacto del RUC, incluyendo "S.A.S." o "S.A." |

---

## Checklist final post-verificación

- [ ] Email de Google "verified Organization" recibido
- [ ] Cuenta Play Console muestra "Tipo: Organización"
- [ ] DUNS asociado correctamente
- [ ] Equipo invitado con permisos correctos
- [ ] Apps existentes siguen visibles y funcionales
- [ ] Producción Closed Test re-evaluada si los criterios cambian
