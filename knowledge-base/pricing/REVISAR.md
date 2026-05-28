# Lista consolidada de items pendientes de revisión

Esta es la **checklist para revisar con el equipo de operaciones Going**.
Todo lo que aparece acá tiene flag `revisar: true` en algún YAML y NO debe
ser usado por el loader (Fase B) sin antes ser validado.

> **Cómo usar este documento**: cuando revises con ops y confirmes un
> item, **bórralo de esta lista** y bumpea `last_updated` del YAML
> correspondiente.

---

## 🔴 BLOQUEANTES — necesarios antes de que Fase B vaya a producción

### Zonas de Quito

`pricing/zones.yaml` tiene **8 zonas tentativas**. Confirmar con ops:

- [ ] **Centro Norte** (base, sin recargo) — ¿está bien lo que cubre?
- [ ] **Norte Alto** (Calderón, Carcelén) — ¿aplica recargo o es centro_norte extendido?
- [ ] **Sur** (Chillogallo, Quitumbe) — recargo $5 confirmado ✓ / pendiente
- [ ] **Centro Histórico** — ¿aplica recargo por difícil acceso?
- [ ] **Cumbayá / Tumbaco** — recargo $5 confirmado ✓ / pendiente
- [ ] **Los Chillos / Valle** — recargo $5 confirmado ✓ / pendiente
- [ ] **Aeropuerto Tababela** — recargo $5 confirmado ✓ / pendiente
- [ ] **Mitad del Mundo / San Antonio de Pichincha** — ¿aplica recargo?
- [ ] ¿Falta alguna zona? (Cumbayá High Tech, Pomasqui, Llano Chico, etc.)

### Recargos dinámicos

`pricing/dynamic-surcharges.yaml`:

- [ ] **Hora pico mañana** (06-09): +15% privado / +8% compartido — confirmar %
- [ ] **Hora pico tarde** (17-20): +15% / +8% — confirmar %
- [ ] **Nocturno** (22-05): +20% / +10% — confirmar %
- [ ] **Fin de semana** (sáb+dom): +10% / +5% — confirmar %
- [ ] **Feriado**: +20% / +10% — confirmar %
- [ ] ¿Hay otros recargos? (lluvia intensa, paro, evento masivo manual)

### Tipos de cliente

`pricing/client-types.yaml`:

- [x] **Retail** — multiplier 1.00 ✓ (no requiere revisión)
- [x] **Corporate** — multiplier 1.25 (+25% recargo) — confirmado por dominio
- [ ] **Agency** — multiplier 1.20 (+20%) — confirmar con ops
- [ ] **Anfitrión** — multiplier 0.95 (-5%) — política a definir cuando se lance Going Anfitriones
- [ ] **Conductor off-duty** — multiplier 0.90 (-10%) — política a definir

### Tarifas de envíos

`pricing/envios.yaml`:

- [ ] **Urbano Quito** — Sobre $8 / Mediano $12 / Grande $15 — confirmar
- [ ] **Urbano otras ciudades** — ¿usa default Quito o varía?
- [ ] **Interurbano** — ¿modelo % sobre tarifa compartida, o tarifa fija?
- [ ] **Pickup fuera de horario** — +30%, confirmar
- [ ] **Paquete frágil** — +$2.00, confirmar

---

## 🟡 IMPORTANTE — para validar antes del lanzamiento comercial

### Tarifas por ruta — 47 rutas con `revisar: true`

**Corredor Sierra Norte** (`pricing/rutas/sierra-norte.yaml`, 16 rutas):

- [ ] Quito CN → Guayllabamba
- [ ] Quito CN → Cayambe
- [ ] Quito CN → Tabacundo
- [ ] Quito CN → El Quinche
- [ ] Quito CN → Otavalo
- [ ] Quito CN → Atuntaqui
- [ ] Quito CN → Ibarra
- [ ] Quito CN → Cotacachi
- [ ] Quito CN → Tulcán *(¿se ofrece HOY o se difiere hasta activar Tulcán?)*
- [ ] Aeropuerto → Quito CN
- [ ] Quito CN → Aeropuerto
- [ ] Aeropuerto → Cayambe
- [ ] Aeropuerto → Ibarra (incluye Otavalo y Atuntaqui)
- [ ] Ibarra ↔ Otavalo
- [ ] Quito Sur → Ibarra (incluye Otavalo y Atuntaqui)
- [ ] Cumbayá/Tumbaco → Atuntaqui

**Corredor Sierra Centro** (`pricing/rutas/sierra-centro.yaml`, 20 rutas):

- [x] Quito CN → Riobamba (compartido SUV $20) — ✅ confirmado 28-may
- [ ] Quito CN → Tambillo
- [ ] Quito CN → Machachi
- [ ] Quito CN → Latacunga
- [ ] Quito CN → Salcedo
- [ ] Quito CN → Píllaro
- [ ] Quito CN → Ambato
- [ ] Quito CN → Baños *(¿se ofrece HOY o se difiere hasta activar Baños?)*
- [ ] Quito CN → Guaranda
- [ ] Aeropuerto → Latacunga
- [ ] Aeropuerto → Ambato
- [ ] Aeropuerto → Baños
- [ ] Aeropuerto → Riobamba
- [ ] Quito Sur → Latacunga
- [ ] Quito Sur → Ambato
- [ ] Quito Sur → Riobamba
- [ ] Latacunga ↔ Salcedo
- [ ] Latacunga ↔ Ambato
- [ ] Ambato ↔ Baños
- [ ] Ambato ↔ Riobamba
- [ ] Baños ↔ Riobamba

**Corredor Costa Noroeste** (`pricing/rutas/costa-noroeste.yaml`, 10 rutas):

- [ ] Quito CN → Santo Domingo
- [ ] Quito CN → La Concordia
- [ ] Quito CN → El Carmen
- [ ] Aeropuerto → Santo Domingo
- [ ] Aeropuerto → La Concordia
- [ ] Aeropuerto → El Carmen
- [ ] Quito Sur → El Carmen
- [ ] Santo Domingo ↔ La Concordia
- [ ] La Concordia ↔ El Carmen
- [ ] El Carmen ↔ Santo Domingo

### Calendario de feriados Ecuador

- [ ] Crear `pricing/feriados_ecuador.yaml` con calendario nacional + fechas
      móviles (Carnaval, Viernes Santo) por año.

---

## 🟢 NICE TO HAVE — para sesiones próximas

- [ ] Rutas faltantes detectadas: ¿operan corredores cortos como
      Cayambe↔Otavalo, Cotacachi↔Otavalo, Tabacundo↔Cayambe?
- [ ] **Promos de bienvenida** — definir si existen y con qué descuento.
- [ ] **Referidos** — definir política (X dólares para invitador, X para invitado).
- [ ] **Cupones** — modelo de cupones (¿código alfanumérico?, validación,
      límite de uso, ventana de vigencia).
- [ ] **Política de cancelación con cargo** — montos en
      `policies/cancelacion.md`.
- [ ] **Política de reembolsos parciales** — `policies/reembolsos.md`.

---

## ⚙️ DEUDA TÉCNICA RELACIONADA

A resolver en Fase B (loader) o Fase C (admin UI):

- [ ] **Sincronizar / borrar FARES** en `libs/pricing/src/lib/fares.ts` —
      hoy duplicado con este YAML.
- [ ] **Sincronizar / borrar la tabla `pricing` en
      `customer-support-service/src/knowledge-base/going-services.ts`** —
      tercera copia.
- [ ] **UI admin para editar tarifas** desde el navegador. Hoy todo es
      por commit en GitHub.
- [ ] **Audit log de cambios de tarifa** — cada cambio debería quedar
      registrado con quién lo hizo y por qué (`historial_cambios` en cada
      ruta ya tiene formato).
- [ ] **Validación CI**: que un PR que cambie tarifas dispare validación
      automática del schema YAML y haga match con el cálculo del loader.
