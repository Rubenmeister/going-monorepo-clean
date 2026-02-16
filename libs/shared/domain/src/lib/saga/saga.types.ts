/**
 * Saga step status tracking
 */
export enum SagaStepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATED = 'compensated',
}

/**
 * Saga overall status
 */
export enum SagaStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATING = 'compensating',
  COMPENSATED = 'compensated',
}

/**
 * A saga step definition for the orchestrator
 */
export interface SagaStep<TContext> {
  name: string;
  execute(context: TContext): Promise<TContext>;
  compensate(context: TContext): Promise<TContext>;
}
