# Scripts operativos Going

Utilidades de mantenimiento del monorepo. Cada script es **idempotente** y
**reversible** cuando aplica.

## Catálogo

| Script | Propósito |
|---|---|
| `seed-synthetic-drivers.mjs` | Crear conductoras/conductores sintéticos en Mongo + Redis para pre-launch |
| `seed-catalog.mjs` | Sembrar catálogo de ciudades y corredores |
| `publish-catalog.mjs` | Publicar catálogo a transport-service |
| `test-trip.mjs` | Smoke test de un viaje completo |
| `voice-smoke-curl.js` | Smoke test del voice-call-service |
| `intensive-field-test.mjs` | Test intensivo de carga (legacy) |
| `check-admin.js` / `reset-admin.js` | Administrar cuenta admin |
| `code-agent.ts` | Agente que mantiene el monorepo |
| `load-test-account-lockout.js` | Test de protección anti-fuerza-bruta |

---

## seed-synthetic-drivers.mjs

**Cuándo usarlo:** estrategia pre-launch — mientras se onboardean
conductoras/es reales, los sintéticos permiten que la app pasajero muestre
una red "viva" con drivers visibles en el mapa.

### Uso

```bash
# Crear 30 drivers distribuidos en 8 ciudades activas (default):
node scripts/seed-synthetic-drivers.mjs

# Crear N drivers:
node scripts/seed-synthetic-drivers.mjs --count=50

# Borrar TODOS los drivers sintéticos (los identificados con prefix SYN_):
node scripts/seed-synthetic-drivers.mjs --clean

# Preview sin escribir nada:
node scripts/seed-synthetic-drivers.mjs --dry-run
```

### Variables de entorno requeridas

```bash
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/going-platform
REDIS_URL=redis://default:pass@host:port
```

Se cargan automáticamente desde `.env` o `.env.local` en la raíz del
monorepo. También se pueden pasar inline:

```bash
MONGODB_URL="..." REDIS_URL="..." node scripts/seed-synthetic-drivers.mjs
```

### Distribución por defecto

30 drivers en 8 ciudades activas:

| Ciudad | Drivers |
|---|---|
| Quito | 8 |
| Otavalo | 3 |
| Ibarra | 3 |
| Cayambe | 2 |
| Ambato | 4 |
| Latacunga | 3 |
| Riobamba | 3 |
| Santo Domingo | 4 |

Mix de vehículos: 70% SUV, 20% VAN, 10% Minibús (proporcional a la flota
real esperada).

### Identificación de drivers sintéticos

Todos tienen `driverId` y `baseId` con prefijo `SYN_`. Ejemplos:

```
SYN_drv_quito_00         → driverId
SYN_base_quito_00        → baseId del registro driver_bases
```

Esto permite filtrarlos en queries, dashboards y borrarlos con `--clean`
sin afectar drivers reales.

### ⚠️ Importante

- **Estos drivers APARECEN en el matching** porque están en Redis con
  `status: online`. Pero **NO aceptan reservas** porque no hay app
  conductor real conectada.
- Cuando un pasajero reserva, el viaje quedará "buscando conductor" hasta
  timeout. Para que el smoke end-to-end funcione, se necesita
  emparejar con un auto-accept job (no incluido en este MVP).
- **NO usar en producción real** con tráfico de usuarios — solo para
  UX/visual testing en pre-launch.
- Los drivers sintéticos **NO tienen documentación de compliance**
  (driver_documents). Si el matching exige `complianceStatus === 'verified'`,
  agregar ese gate en el script.

### Cleanup antes del lanzamiento público

Antes de lanzar al público (~16 jun), correr:

```bash
node scripts/seed-synthetic-drivers.mjs --clean
```

Y verificar en logs que cero drivers sintéticos quedan en el sistema.
