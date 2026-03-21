/**
 * Database Migration Runner
 * Executes and tracks database migrations with rollback capability
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import {
  IMigration,
  IMigrationRunner,
  MigrationResult,
} from './migration.interface';

@Injectable()
export class MigrationRunner implements IMigrationRunner {
  private readonly logger = new Logger(MigrationRunner.name);
  private migrations: Map<string, IMigration> = new Map();
  private readonly MIGRATIONS_COLLECTION = '_migrations';

  constructor(@InjectConnection() private connection: Connection) {}

  /**
   * Register migrations
   */
  registerMigrations(migrations: IMigration[]): void {
    migrations.forEach((migration) => {
      this.migrations.set(migration.id, migration);
    });
    this.logger.debug(`Registered ${migrations.length} migrations`);
  }

  /**
   * Run all pending migrations
   */
  async runPendingMigrations(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];

    try {
      // Ensure migrations tracking collection exists
      await this.ensureMigrationsCollection();

      // Get applied migrations
      const applied = await this.getAppliedMigrations();

      for (const [migrationId, migration] of this.migrations.entries()) {
        if (applied.includes(migrationId)) {
          results.push({
            id: migrationId,
            description: migration.description,
            status: 'skipped',
            executedAt: new Date(),
            duration: 0,
          });
          continue;
        }

        const result = await this.runMigration(migrationId);
        results.push(result);

        if (result.status === 'failed') {
          this.logger.error(
            `Migration ${migrationId} failed, stopping further migrations`
          );
          break;
        }
      }

      return results;
    } catch (error) {
      this.logger.error(
        `Error running migrations: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
      throw error;
    }
  }

  /**
   * Run specific migration
   */
  async runMigration(id: string): Promise<MigrationResult> {
    const migration = this.migrations.get(id);
    const startTime = Date.now();

    if (!migration) {
      return {
        id,
        description: 'Unknown',
        status: 'failed',
        executedAt: new Date(),
        duration: 0,
        error: 'Migration not found',
      };
    }

    try {
      this.logger.log(`Running migration: ${id} - ${migration.description}`);

      // Execute migration
      await migration.up();

      // Record migration
      await this.recordMigration(id, migration.version, 'success');

      const duration = Date.now() - startTime;
      this.logger.log(`Migration completed: ${id} (${duration}ms)`);

      return {
        id,
        description: migration.description,
        status: 'success',
        executedAt: new Date(),
        duration,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Migration failed: ${id} - ${errorMsg}`);

      // Record failure
      await this.recordMigration(id, migration.version, 'failed', errorMsg);

      return {
        id,
        description: migration.description,
        status: 'failed',
        executedAt: new Date(),
        duration: Date.now() - startTime,
        error: errorMsg,
      };
    }
  }

  /**
   * Rollback migrations
   */
  async rollback(steps: number = 1): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    const applied = await this.getAppliedMigrationsSorted();

    for (let i = 0; i < Math.min(steps, applied.length); i++) {
      const migrationId = applied[i];
      const migration = this.migrations.get(migrationId);

      if (!migration) {
        results.push({
          id: migrationId,
          description: 'Unknown',
          status: 'failed',
          executedAt: new Date(),
          duration: 0,
          error: 'Migration not found for rollback',
        });
        continue;
      }

      const startTime = Date.now();

      try {
        this.logger.log(`Rolling back migration: ${migrationId}`);
        await migration.down();

        // Remove migration record
        await this.removeMigrationRecord(migrationId);

        results.push({
          id: migrationId,
          description: migration.description,
          status: 'success',
          executedAt: new Date(),
          duration: Date.now() - startTime,
        });
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.logger.error(`Rollback failed: ${migrationId} - ${errorMsg}`);

        results.push({
          id: migrationId,
          description: migration.description,
          status: 'failed',
          executedAt: new Date(),
          duration: Date.now() - startTime,
          error: errorMsg,
        });
      }
    }

    return results;
  }

  /**
   * Get migration status
   */
  async getStatus(): Promise<{
    applied: string[];
    pending: string[];
    failed: string[];
  }> {
    const applied = await this.getAppliedMigrations();
    const failed = await this.getFailedMigrations();

    const pending = Array.from(this.migrations.keys()).filter(
      (id) => !applied.includes(id)
    );

    return { applied, pending, failed };
  }

  /**
   * Private helper methods
   */

  private async ensureMigrationsCollection(): Promise<void> {
    const db = this.connection.getClient().db();
    const collections = await db.listCollections().toArray();

    if (!collections.some((c) => c.name === this.MIGRATIONS_COLLECTION)) {
      await db.createCollection(this.MIGRATIONS_COLLECTION);
      this.logger.log('Created migrations tracking collection');
    }
  }

  private async getAppliedMigrations(): Promise<string[]> {
    const db = this.connection.getClient().db();
    const collection = db.collection(this.MIGRATIONS_COLLECTION);

    const records = await collection
      .find({ status: 'success' })
      .project({ migrationId: 1 })
      .toArray();

    return records.map((r: any) => r.migrationId);
  }

  private async getAppliedMigrationsSorted(): Promise<string[]> {
    const db = this.connection.getClient().db();
    const collection = db.collection(this.MIGRATIONS_COLLECTION);

    const records = await collection
      .find({ status: 'success' })
      .sort({ executedAt: -1 })
      .project({ migrationId: 1 })
      .toArray();

    return records.map((r: any) => r.migrationId);
  }

  private async getFailedMigrations(): Promise<string[]> {
    const db = this.connection.getClient().db();
    const collection = db.collection(this.MIGRATIONS_COLLECTION);

    const records = await collection
      .find({ status: 'failed' })
      .project({ migrationId: 1 })
      .toArray();

    return records.map((r: any) => r.migrationId);
  }

  private async recordMigration(
    id: string,
    version: number,
    status: 'success' | 'failed',
    error?: string
  ): Promise<void> {
    const db = this.connection.getClient().db();
    const collection = db.collection(this.MIGRATIONS_COLLECTION);

    await collection.updateOne(
      { migrationId: id },
      {
        $set: {
          migrationId: id,
          version,
          status,
          executedAt: new Date(),
          error: error || null,
        },
      },
      { upsert: true }
    );
  }

  private async removeMigrationRecord(id: string): Promise<void> {
    const db = this.connection.getClient().db();
    const collection = db.collection(this.MIGRATIONS_COLLECTION);
    await collection.deleteOne({ migrationId: id });
  }
}
