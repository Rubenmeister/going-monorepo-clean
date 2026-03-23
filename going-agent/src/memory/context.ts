import fs from 'fs';
import path from 'path';

const MEMORY_FILE = path.join(__dirname, '../../memory.json');

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
  private data: AgentMemory;

  constructor() {
    this.data = fs.existsSync(MEMORY_FILE)
      ? JSON.parse(fs.readFileSync(MEMORY_FILE, 'utf8'))
      : { ...DEFAULT };
  }

  get(): AgentMemory { return this.data; }

  recordRun(): void {
    this.data.lastRun = new Date().toISOString();
    this.data.stats.totalRuns++;
    this.save();
  }

  recordFix(description: string, commit: string): void {
    this.data.fixesApplied.push({ date: new Date().toISOString(), description, commit });
    this.data.stats.totalFixes++;
    this.save();
  }

  addIssue(id: string, description: string): void {
    if (!this.data.knownIssues.find(i => i.id === id)) {
      this.data.knownIssues.push({ id, description, status: 'open' });
      this.save();
    }
  }

  markFixed(id: string): void {
    const issue = this.data.knownIssues.find(i => i.id === id);
    if (issue) { issue.status = 'fixed'; this.save(); }
  }

  private save(): void {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(this.data, null, 2));
  }

  summary(): string {
    return `Runs: ${this.data.stats.totalRuns} | Fixes: ${this.data.stats.totalFixes} | ` +
      `Open issues: ${this.data.knownIssues.filter(i => i.status === 'open').length} | ` +
      `Last run: ${this.data.lastRun || 'never'}`;
  }
}
