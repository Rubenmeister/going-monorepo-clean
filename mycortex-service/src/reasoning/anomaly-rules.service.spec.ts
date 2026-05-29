/**
 * AnomalyRulesService — unit tests
 *
 * Service puro (sin Mongoose ni HTTP) — tests directos por instanciación
 * sin TestingModule. Verifica:
 *  - Empty input → empty output
 *  - Cada regla genera la Intention correcta con shape estable
 *  - Anomalies sin matching rule no producen Intentions
 *  - Errors en una regla NO rompen el ciclo (las otras siguen)
 *  - Urgency clamping funciona en bordes
 */

import { AnomalyRulesService } from './anomaly-rules.service';

interface AnomalyInput {
  agentId:    string;
  type:       string;
  severity:   string;
  message:    string;
  detectedAt: string;
  data?:      Record<string, unknown>;
}

const baseAnomaly = (overrides: Partial<AnomalyInput>): AnomalyInput => ({
  agentId:    'test-agent',
  type:       'unknown',
  severity:   'warning',
  message:    'test',
  detectedAt: new Date().toISOString(),
  ...overrides,
});

describe('AnomalyRulesService', () => {
  let service: AnomalyRulesService;

  beforeEach(() => {
    service = new AnomalyRulesService();
  });

  describe('translate()', () => {
    it('returns empty array for empty input', () => {
      expect(service.translate([])).toEqual([]);
    });

    it('returns empty array for null input (defensive)', () => {
      expect(service.translate(null as any)).toEqual([]);
    });

    it('ignores anomalies without matching rule', () => {
      const anomalies = [
        baseAnomaly({ type: 'unknown_type', data: { foo: 'bar' } }),
        baseAnomaly({ type: 'another_unknown' }),
      ];
      expect(service.translate(anomalies)).toEqual([]);
    });

    it('produces multiple Intentions when multiple anomalies match different rules', () => {
      const anomalies = [
        baseAnomaly({
          type: 'suspicious_call_pattern',
          data: { from: '+593987654321', count: 8 },
        }),
        baseAnomaly({
          type: 'high_pending_red_handoffs',
          data: { count: 15 },
        }),
      ];
      const intentions = service.translate(anomalies);
      expect(intentions.length).toBe(2);
      const types = intentions.map((i) => i.type).sort();
      expect(types).toEqual([
        'block_voice_caller',
        'cleanup_stale_customer_handoffs',
      ]);
    });
  });

  describe('rule: spammer-voice-caller', () => {
    it('matches suspicious_call_pattern with from + count and emits block_voice_caller', () => {
      const anomaly = baseAnomaly({
        type: 'suspicious_call_pattern',
        data: { from: '+593984037949', count: 7 },
      });
      const [intention] = service.translate([anomaly]);
      expect(intention).toBeDefined();
      expect(intention.type).toBe('block_voice_caller');
      expect(intention.target).toBe('+593984037949');
      expect(intention.data?.from).toBe('+593984037949');
      expect(intention.data?.durationMinutes).toBe(60);
      expect(intention.data?.sourceAnomaly).toBe('suspicious_call_pattern');
      // urgency = clamp(0.7-0.95, 0.7 + (7-5)/10) = 0.9
      expect(intention.urgency).toBe(0.9);
    });

    it('clamps urgency to 0.95 max for high counts', () => {
      const anomaly = baseAnomaly({
        type: 'suspicious_call_pattern',
        data: { from: '+593900000000', count: 50 }, // muy alto
      });
      const [intention] = service.translate([anomaly]);
      expect(intention.urgency).toBe(0.95);
    });

    it('clamps urgency to 0.7 min for low counts', () => {
      const anomaly = baseAnomaly({
        type: 'suspicious_call_pattern',
        data: { from: '+593900000000', count: 5 }, // threshold mínimo
      });
      const [intention] = service.translate([anomaly]);
      expect(intention.urgency).toBe(0.7);
    });

    it('does NOT match if from or count missing', () => {
      const noFrom = baseAnomaly({
        type: 'suspicious_call_pattern',
        data: { count: 10 },
      });
      const noCount = baseAnomaly({
        type: 'suspicious_call_pattern',
        data: { from: '+593900000000' },
      });
      expect(service.translate([noFrom, noCount])).toEqual([]);
    });
  });

  describe('rule: stale-customer-handoffs', () => {
    it('matches high_pending_red_handoffs and emits cleanup intention', () => {
      const anomaly = baseAnomaly({
        type: 'high_pending_red_handoffs',
        data: { count: 13 },
      });
      const [intention] = service.translate([anomaly]);
      expect(intention).toBeDefined();
      expect(intention.type).toBe('cleanup_stale_customer_handoffs');
      // urgency = clamp(0.85-0.98, 0.85 + (13-10)/100) = 0.88
      expect(intention.urgency).toBe(0.88);
      expect(intention.data?.count).toBe(13);
    });

    it('clamps urgency to 0.98 max for very high counts', () => {
      const anomaly = baseAnomaly({
        type: 'high_pending_red_handoffs',
        data: { count: 500 },
      });
      const [intention] = service.translate([anomaly]);
      expect(intention.urgency).toBe(0.98);
    });
  });

  describe('rule: voice-handoff-stuck', () => {
    it('matches voice_handoff_stuck and emits force_handoff intention', () => {
      const anomaly = baseAnomaly({
        type: 'voice_handoff_stuck',
        data: { callId: 'CA1234567890abcdef', ageSeconds: 120 },
      });
      const [intention] = service.translate([anomaly]);
      expect(intention).toBeDefined();
      expect(intention.type).toBe('force_handoff_voice_call');
      expect(intention.target).toBe('CA1234567890abcdef');
      expect(intention.urgency).toBe(0.9); // siempre alta
      expect(intention.data?.callId).toBe('CA1234567890abcdef');
      expect(intention.data?.ageSeconds).toBe(120);
    });

    it('defaults ageSeconds to 90 if not provided', () => {
      const anomaly = baseAnomaly({
        type: 'voice_handoff_stuck',
        data: { callId: 'CA9999' },
      });
      const [intention] = service.translate([anomaly]);
      expect(intention.data?.ageSeconds).toBe(90);
    });

    it('does NOT match if callId missing', () => {
      const anomaly = baseAnomaly({
        type: 'voice_handoff_stuck',
        data: { ageSeconds: 120 },
      });
      expect(service.translate([anomaly])).toEqual([]);
    });
  });

  describe('registeredRules()', () => {
    it('lists all rule IDs', () => {
      const ids = service.registeredRules();
      expect(ids).toContain('spammer-voice-caller');
      expect(ids).toContain('stale-customer-handoffs');
      expect(ids).toContain('voice-handoff-stuck');
      expect(ids.length).toBe(3);
    });
  });

  describe('robustness', () => {
    it('produces Intentions with shape compatible with IntentionInputSchema', () => {
      const anomaly = baseAnomaly({
        type: 'suspicious_call_pattern',
        data: { from: '+593987654321', count: 8 },
      });
      const [intention] = service.translate([anomaly]);

      // Schema fields (from intentions-parser.service.ts IntentionInputSchema):
      expect(typeof intention.type).toBe('string');
      expect(intention.type.length).toBeGreaterThan(0);
      expect(intention.type.length).toBeLessThanOrEqual(80);
      expect(typeof intention.urgency).toBe('number');
      expect(intention.urgency).toBeGreaterThanOrEqual(0);
      expect(intention.urgency).toBeLessThanOrEqual(1);
      expect(typeof intention.reason).toBe('string');
      expect(intention.reason.length).toBeGreaterThan(0);
      expect(typeof intention.suggestedAction).toBe('string');
      expect(intention.suggestedAction.length).toBeGreaterThan(0);
      // expiresAt es ISO-8601
      expect(intention.expiresAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });
});
