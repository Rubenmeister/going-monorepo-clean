/**
 * Database Migration Interface
 * Framework for versioning and managing database schema evolution
 * Supports both Mongoose schema updates and raw MongoDB operations
 */

export interface IMigration {
  /**
   * Unique migration identifier
   * Format: YYYYMMDD_HHmmss_description
   * Example: 20260222_150000_add_user_verification_status
   */
  id: string;

  /**
   * Human-readable description of the migration
   */
  description: string;

  /**
   * Migration version number for rollback tracking
   */
  version: number;

  /**
   * Execute the migration (upgrade)
   */
  up(): Promise<void>;

  /**
   * Rollback the migration (downgrade)
   */
  down(): Promise<void>;

  /**
   * Check if migration has been applied
   */
  isApplied?(): Promise<boolean>;
}

export interface MigrationResult {
  id: string;
  description: string;
  status: 'success' | 'failed' | 'skipped';
  executedAt: Date;
  duration: number;
  error?: string;
}

export interface IMigrationRunner {
  /**
   * Run all pending migrations
   */
  runPendingMigrations(): Promise<MigrationResult[]>;

  /**
   * Rollback the last N migrations
   */
  rollback(steps?: number): Promise<MigrationResult[]>;

  /**
   * Get migration status
   */
  getStatus(): Promise<{
    applied: string[];
    pending: string[];
    failed: string[];
  }>;

  /**
   * Run specific migration
   */
  runMigration(id: string): Promise<MigrationResult>;
}
