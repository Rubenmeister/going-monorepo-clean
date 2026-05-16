import { Injectable } from '@nestjs/common';
import { WorldSnapshotEntity } from '../infrastructure/schemas/world-snapshot.schema';

/**
 * Compara dos snapshots y detecta cambios significativos. Conservador
 * a propósito: el objetivo NO es alertar de cada perturbación menor sino
 * marcar transiciones que el equipo de ops debería ver.
 *
 * Reglas:
 *   1. Cambio de systemHealth (healthy ↔ degraded ↔ critical).
 *   2. Aparición de NUEVAS anomalías críticas (mismo agentId+type que
 *      antes no estaba presente).
 *   3. Anomalías críticas que se RESOLVIERON (estaban antes y ya no).
 *
 * Lo deja en `changedSinceLast` del snapshot actual para que el cerebro
 * pueda mostrarlo en /cerebro/state y MyCortex pueda razonar sobre la
 * trayectoria sin tener que cargar dos snapshots.
 */
@Injectable()
export class DiffDetectorService {

  detect(
    previous: WorldSnapshotEntity,
    current:  Pick<WorldSnapshotEntity, 'systemHealth' | 'activeAnomalies'>,
  ): {
    healthChanged:        boolean;
    newCriticalCount:     number;
    resolvedCriticalCount: number;
    description:          string;
  } {
    const healthChanged = previous.systemHealth !== current.systemHealth;

    const prevCritKeys = new Set(
      previous.activeAnomalies
        .filter(a => a.severity === 'critical')
        .map(a => this.anomalyKey(a.agentId, a.type)),
    );
    const currCritKeys = new Set(
      current.activeAnomalies
        .filter(a => a.severity === 'critical')
        .map(a => this.anomalyKey(a.agentId, a.type)),
    );

    const newCritical: string[] = [];
    for (const k of currCritKeys) {
      if (!prevCritKeys.has(k)) newCritical.push(k);
    }
    const resolvedCritical: string[] = [];
    for (const k of prevCritKeys) {
      if (!currCritKeys.has(k)) resolvedCritical.push(k);
    }

    const parts: string[] = [];
    if (healthChanged) {
      parts.push(`health: ${previous.systemHealth} → ${current.systemHealth}`);
    }
    if (newCritical.length > 0) {
      parts.push(`+${newCritical.length} critical: ${newCritical.slice(0, 3).join(', ')}`);
    }
    if (resolvedCritical.length > 0) {
      parts.push(`-${resolvedCritical.length} resolved: ${resolvedCritical.slice(0, 3).join(', ')}`);
    }

    return {
      healthChanged,
      newCriticalCount:     newCritical.length,
      resolvedCriticalCount: resolvedCritical.length,
      description: parts.length > 0 ? parts.join(' | ') : 'sin cambios significativos',
    };
  }

  private anomalyKey(agentId: string, type: string): string {
    return `${agentId}::${type}`;
  }
}
