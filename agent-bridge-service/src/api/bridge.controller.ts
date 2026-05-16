import { Body, Controller, Get, HttpCode, Param, Post } from '@nestjs/common';
import { lookupAgent, AGENT_REGISTRY } from '../infrastructure/agent-registry';
import { CloudRunJobsClient } from '../infrastructure/cloud-run-jobs.client';
import { HttpServiceClient } from '../infrastructure/http-service.client';

interface CommandBody {
  decisionId: string;
  action:     string;
  payload?:   Record<string, unknown>;
}

@Controller()
export class BridgeController {
  constructor(
    private readonly jobs: CloudRunJobsClient,
    private readonly http: HttpServiceClient,
  ) {}

  /**
   * GET /agents — listado de agentes registrados (para debug / discovery).
   */
  @Get('agents')
  list() {
    return {
      total: Object.keys(AGENT_REGISTRY).length,
      agents: Object.entries(AGENT_REGISTRY).map(([id, cfg]) => ({
        agentId: id,
        kind:    cfg.kind,
        target:  cfg.kind === 'cloud-run-job'
          ? cfg.jobName
          : `${cfg.serviceUrl}${cfg.commandPath || '/command'}`,
      })),
    };
  }

  /**
   * POST /agents/:agentId/command
   * Recibe del Orchestrator y dispatch al kind correcto.
   */
  @Post('agents/:agentId/command')
  @HttpCode(200)
  async command(
    @Param('agentId') agentId: string,
    @Body() body: CommandBody,
  ) {
    const config = lookupAgent(agentId);
    if (!config) {
      return {
        ok: false,
        error: `agent_unknown: ${agentId}. Registrar en AGENT_REGISTRY.`,
      };
    }

    if (!body || !body.decisionId || !body.action) {
      return {
        ok: false,
        error: 'missing_required_fields: decisionId + action',
      };
    }

    if (config.kind === 'cloud-run-job') {
      const result = await this.jobs.triggerJob({
        jobName:    config.jobName!,
        decisionId: body.decisionId,
        action:     body.action,
        payload:    body.payload || {},
      });
      return {
        ok: result.ok,
        data: result.executionName ? { executionName: result.executionName } : undefined,
        error: result.error,
      };
    }

    if (config.kind === 'http-service') {
      const result = await this.http.sendCommand({
        agentId,
        config,
        decisionId: body.decisionId,
        action:     body.action,
        payload:    body.payload || {},
      });
      return result;
    }

    return { ok: false, error: `unknown_agent_kind: ${(config as { kind: string }).kind}` };
  }
}
