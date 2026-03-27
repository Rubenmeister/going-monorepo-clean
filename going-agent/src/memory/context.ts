/**
 * MemoryStore — persistencia en Firestore
 *
 * Usa la colección `going_agent_memory`, documento `state`.
 * Esto sobrevive reinicios del Cloud Run Job (stateless).
 *
 * La cuenta de servicio del Job necesita el rol:
 *   Cloud Datastore User (roles/datastore.user)
 */

import { Firestore } from '@google-cloud/firestore';
import { config } from '../config';

const COLLECTION = 'going_agent_memory';
const DOC_ID = 'state';

const db = new Firestore({ projectId: config.gcpProject });

export interface AgentMemory {
  lastRun: string;
  fixesApplied: { date: string; description: string; commit: string }[];
  knownIssues: { id: string; description: string; status: 'open' | 'fixed' }[];
  stats: { totalFixes: number; totalRuns: number };
}

const DEFAULT: AgentMemory = {
  lastRun: '',
  fixesApplied: [],
  knownIssues: [],
  stats: { totalFixes: 0, totalRuns: 0 },
};

export class MemoryStore {
  private data: AgentMemory = { ...DEFAULT };
  private loaded = false;

  /** Carga el estado desde Firestore. Llamar antes de operar. */
  async load(): Promise<void> {
    try {
      const doc = await db.collection(COLLECTION).doc(DOC_ID).get();
      this.data = doc.exists ? (doc.data() as AgentMemory) : { ...DEFAULT };
      this.loaded = true;
    } catch (err) {
      console.warn('[Memory] No se pudo cargar desde Firestore, usando estado vacío:', err);
      this.data = { ...DEFAULT };
      this.loaded = true;
    }
  }

  get(): AgentMemory { return this.data; }

  async recordRun(): Promise<void> {
    if (!this.loaded) await this.load();
    this.data.lastRun = new Date().toISOString();
    this.data.stats.totalRuns++;
    await this.save();
  }

  async recordFix(description: string, commit: string): Promise<void> {
    if (!this.loaded) await this.load();
    this.data.fixesApplied.push({ date: new Date().toISOString(), description, commit });
    // Mantener solo los últimos 100 fixes para no crecer indefinidamente
    if (this.data.fixesApplied.length > 100) {
      this.data.fixesApplied = this.data.fixesApplied.slice(-100);
    }
    this.data.stats.totalFixes++;
    await this.save();
  }

  async addIssue(id: string, description: string): Promise<void> {
    if (!this.loaded) await this.load();
    if (!this.data.knownIssues.find(i => i.id === id)) {
      this.data.knownIssues.push({ id, description, status: 'open' });
      await this.save();
    }
  }

  async markFixed(id: string): Promise<void> {
    if (!this.loaded) await this.load();
    const issue = this.data.knownIssues.find(i => i.id === id);
    if (issue) {
      issue.status = 'fixed';
      await this.save();
    }
  }

  private async save(): Promise<void> {
    try {
      await db.collection(COLLECTION).doc(DOC_ID).set(this.data);
    } catch (err) {
      console.error('[Memory] Error guardando en Firestore:', err);
    }
  }

  summary(): string {
    return `Runs: ${this.data.stats.totalRuns} | Fixes: ${this.data.stats.totalFixes} | ` +
      `Open issues: ${this.data.knownIssues.filter(i => i.status === 'open').length} | ` +
      `Last run: ${this.data.lastRun || 'never'}`;
  }
}
