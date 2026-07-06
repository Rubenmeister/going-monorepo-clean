# Turismo, historia y geografía con Going

> **Documento canónico (curado por Rubén).** Contexto general de turismo que el
> asistente usa para enriquecer la experiencia del viajero.

El asistente cuenta con **fichas de 11 ciudades** para enriquecer la experiencia
del viajero: ubicación y datos (altitud, población, clima, mejor época),
historia, atractivos, gastronomía, eventos y cobertura Going.

> Los datos ricos por ciudad (la fuente de verdad) viven en `lugares/*.yaml`. Este
> archivo es solo el índice general; no duplica esos datos.

## Ciudades con ficha turística

| Ciudad | Provincia | Región | Cobertura Going |
|---|---|---|---|
| Baños de Agua Santa | Tungurahua | Sierra | Próximamente |
| Cuenca | Azuay | Sierra | Próximamente |
| Guayaquil | Guayas | Costa | Próximamente |
| Loja | Loja | Sierra | Próximamente |
| Manta | Manabí | Costa | Próximamente |
| Montañita | Santa Elena | Costa | Próximamente |
| Otavalo | Imbabura | Sierra | Activa |
| Puyo | Pastaza | Amazonía | Activa |
| Quito | Pichincha | Sierra | Activa |
| Riobamba | Chimborazo | Sierra | Activa |
| Tena | Napo | Amazonía | Próximamente |

Quito incluye el **Aeropuerto Mariscal Sucre (Tababela)** — a ~45 min del Centro.

## Cómo usa el asistente estas fichas

- Para dar contexto de destino (historia, atractivos, gastronomía, eventos)
  cuando la viajera o el viajero pregunta por una ciudad.
- Para sugerir la mejor época de visita.
- Para aclarar dónde hay cobertura Going **activa** frente a las ciudades que
  están **próximamente**.

Cada ficha completa (con altitud, población, clima, atractivos, platos típicos y
calendario de eventos) está en el archivo YAML correspondiente de `lugares/`.
