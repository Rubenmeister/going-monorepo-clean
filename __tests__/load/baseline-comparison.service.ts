/**
 * Baseline Comparison Service
 * Compares load test results against established baselines
 * Detects performance regressions
 */

import * as fs from 'fs';
import * as path from 'path';

export interface LoadTestMetrics {
  testType: 'normal' | 'stress' | 'spike';
  timestamp: string;
  duration: number; // in seconds
  metrics: {
    p50Latency: number; // in ms
    p95Latency: number; // in ms
    p99Latency: number; // in ms
    avgLatency: number; // in ms
    errorRate: number; // as percentage
    throughput: number; // requests per second
    cacheHitRate?: number; // as percentage
    peakMemory?: number; // in MB
    peakCPU?: number; // as percentage
  };
  results?: {
    passed: number;
    failed: number;
    skipped: number;
  };
}

export interface BaselineComparison {
  testType: string;
  currentMetrics: LoadTestMetrics['metrics'];
  baselineMetrics: LoadTestMetrics['metrics'];
  comparison: {
    p50Change: number; // percentage
    p95Change: number; // percentage
    p99Change: number; // percentage
    errorRateChange: number; // percentage
    throughputChange: number; // percentage
    overallRegression: boolean;
    regressionLevel: 'none' | 'minor' | 'moderate' | 'severe';
  };
}

export class BaselineComparisonService {
  private baselineDir = path.join(
    process.cwd(),
    '__tests__',
    'load',
    'baselines'
  );
  private resultsDir = path.join(process.cwd(), '__tests__', 'load', 'results');

  constructor() {
    this.ensureDirectories();
  }

  /**
   * Ensure baseline and results directories exist
   */
  private ensureDirectories(): void {
    [this.baselineDir, this.resultsDir].forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Save test results
   */
  async saveResults(testType: string, metrics: LoadTestMetrics): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${testType}-${timestamp}.json`;
    const filepath = path.join(this.resultsDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2));
    console.log(`✅ Results saved: ${filename}`);
  }

  /**
   * Save baseline
   */
  async saveBaseline(
    testType: string,
    metrics: LoadTestMetrics
  ): Promise<void> {
    const filename = `${testType}-baseline.json`;
    const filepath = path.join(this.baselineDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(metrics, null, 2));
    console.log(`✅ Baseline saved: ${filename}`);
  }

  /**
   * Get baseline for comparison
   */
  async getBaseline(testType: string): Promise<LoadTestMetrics | null> {
    const filename = `${testType}-baseline.json`;
    const filepath = path.join(this.baselineDir, filename);

    if (!fs.existsSync(filepath)) {
      console.warn(`⚠️  No baseline found for ${testType}`);
      return null;
    }

    const data = fs.readFileSync(filepath, 'utf8');
    return JSON.parse(data);
  }

  /**
   * Compare current metrics against baseline
   */
  async compareWithBaseline(
    testType: string,
    currentMetrics: LoadTestMetrics
  ): Promise<BaselineComparison> {
    const baseline = await this.getBaseline(testType);

    if (!baseline) {
      // First run, establish baseline
      await this.saveBaseline(testType, currentMetrics);
      return {
        testType,
        currentMetrics: currentMetrics.metrics,
        baselineMetrics: currentMetrics.metrics,
        comparison: {
          p50Change: 0,
          p95Change: 0,
          p99Change: 0,
          errorRateChange: 0,
          throughputChange: 0,
          overallRegression: false,
          regressionLevel: 'none',
        },
      };
    }

    const comparison = this.calculateComparison(
      baseline.metrics,
      currentMetrics.metrics
    );

    return {
      testType,
      currentMetrics: currentMetrics.metrics,
      baselineMetrics: baseline.metrics,
      comparison,
    };
  }

  /**
   * Calculate percentage change between baseline and current
   */
  private calculateComparison(
    baseline: LoadTestMetrics['metrics'],
    current: LoadTestMetrics['metrics']
  ) {
    const calculateChange = (
      baseValue: number,
      currentValue: number
    ): number => {
      if (baseValue === 0) return 0;
      return ((currentValue - baseValue) / baseValue) * 100;
    };

    const p50Change = calculateChange(baseline.p50Latency, current.p50Latency);
    const p95Change = calculateChange(baseline.p95Latency, current.p95Latency);
    const p99Change = calculateChange(baseline.p99Latency, current.p99Latency);
    const errorRateChange = calculateChange(
      baseline.errorRate,
      current.errorRate
    );
    const throughputChange = calculateChange(
      baseline.throughput,
      current.throughput
    );

    // Determine regression level
    let regressionLevel: 'none' | 'minor' | 'moderate' | 'severe' = 'none';
    let overallRegression = false;

    // Latency regressions are critical
    if (p99Change > 20) {
      regressionLevel = 'severe';
      overallRegression = true;
    } else if (p99Change > 10) {
      regressionLevel = 'moderate';
      overallRegression = true;
    } else if (p99Change > 5) {
      regressionLevel = 'minor';
      overallRegression = true;
    }

    // Error rate increase is critical
    if (errorRateChange > 0) {
      regressionLevel = 'severe';
      overallRegression = true;
    }

    // Throughput degradation
    if (throughputChange < -10) {
      if (regressionLevel === 'none') regressionLevel = 'moderate';
      overallRegression = true;
    }

    return {
      p50Change,
      p95Change,
      p99Change,
      errorRateChange,
      throughputChange,
      overallRegression,
      regressionLevel,
    };
  }

  /**
   * Generate comparison report
   */
  generateReport(comparison: BaselineComparison): string {
    const {
      testType,
      currentMetrics,
      baselineMetrics,
      comparison: comp,
    } = comparison;

    const formatNumber = (num: number): string => {
      return num.toFixed(2);
    };

    const formatChange = (change: number): string => {
      const sign = change > 0 ? '+' : '';
      const emoji = change > 5 ? '🔴' : change > 0 ? '🟡' : '🟢';
      return `${emoji} ${sign}${formatNumber(change)}%`;
    };

    let report = `
# Load Test Comparison Report - ${testType.toUpperCase()}

## Summary
- **Regression Level**: ${comp.regressionLevel.toUpperCase()}
- **Overall Regression Detected**: ${
      comp.overallRegression ? '❌ YES' : '✅ NO'
    }
- **Test Type**: ${testType}
- **Timestamp**: ${new Date().toISOString()}

## Metrics Comparison

| Metric | Baseline | Current | Change |
|--------|----------|---------|--------|
| P50 Latency (ms) | ${formatNumber(
      baselineMetrics.p50Latency
    )} | ${formatNumber(currentMetrics.p50Latency)} | ${formatChange(
      comp.p50Change
    )} |
| P95 Latency (ms) | ${formatNumber(
      baselineMetrics.p95Latency
    )} | ${formatNumber(currentMetrics.p95Latency)} | ${formatChange(
      comp.p95Change
    )} |
| P99 Latency (ms) | ${formatNumber(
      baselineMetrics.p99Latency
    )} | ${formatNumber(currentMetrics.p99Latency)} | ${formatChange(
      comp.p99Change
    )} |
| Avg Latency (ms) | ${formatNumber(
      baselineMetrics.avgLatency
    )} | ${formatNumber(currentMetrics.avgLatency)} | ${formatChange(
      calculateChange(baselineMetrics.avgLatency, currentMetrics.avgLatency)
    )} |
| Error Rate (%) | ${formatNumber(baselineMetrics.errorRate)} | ${formatNumber(
      currentMetrics.errorRate
    )} | ${formatChange(comp.errorRateChange)} |
| Throughput (RPS) | ${formatNumber(
      baselineMetrics.throughput
    )} | ${formatNumber(currentMetrics.throughput)} | ${formatChange(
      comp.throughputChange
    )} |
`;

    if (baselineMetrics.cacheHitRate && currentMetrics.cacheHitRate) {
      const cacheChange = calculateChange(
        baselineMetrics.cacheHitRate,
        currentMetrics.cacheHitRate
      );
      report += `| Cache Hit Rate (%) | ${formatNumber(
        baselineMetrics.cacheHitRate
      )} | ${formatNumber(currentMetrics.cacheHitRate)} | ${formatChange(
        cacheChange
      )} |\n`;
    }

    report += `

## Analysis

${this.generateAnalysis(comp, currentMetrics, baselineMetrics)}

## Recommendations

${this.generateRecommendations(comp)}

---
*Report generated on ${new Date().toISOString()}*
    `;

    return report;
  }

  /**
   * Generate analysis based on comparison
   */
  private generateAnalysis(
    comp: any,
    current: LoadTestMetrics['metrics'],
    baseline: LoadTestMetrics['metrics']
  ): string {
    let analysis = '';

    if (comp.regressionLevel === 'severe') {
      analysis += `### 🔴 SEVERE REGRESSION DETECTED\n\n`;
      analysis += `The current metrics show significant degradation compared to the baseline:\n`;
      if (comp.p99Change > 20) {
        analysis += `- **P99 Latency**: Increased by ${comp.p99Change.toFixed(
          1
        )}% (critical for user experience)\n`;
      }
      if (comp.errorRateChange > 0) {
        analysis += `- **Error Rate**: Increased from ${baseline.errorRate.toFixed(
          2
        )}% to ${current.errorRate.toFixed(2)}%\n`;
      }
      if (comp.throughputChange < -10) {
        analysis += `- **Throughput**: Degraded by ${Math.abs(
          comp.throughputChange
        ).toFixed(1)}%\n`;
      }
      analysis += `\nImmediate investigation and remediation required.\n`;
    } else if (comp.regressionLevel === 'moderate') {
      analysis += `### 🟡 MODERATE REGRESSION\n\n`;
      analysis += `The metrics show some performance degradation:\n`;
      analysis += `- P99 Latency increased by ${comp.p99Change.toFixed(1)}%\n`;
      analysis += `- Further investigation recommended\n`;
    } else if (comp.regressionLevel === 'minor') {
      analysis += `### 🟡 MINOR REGRESSION\n\n`;
      analysis += `Small performance variations detected:\n`;
      analysis += `- P99 Latency: ${
        comp.p99Change > 0 ? '+' : ''
      }${comp.p99Change.toFixed(1)}%\n`;
      analysis += `- Within acceptable variance. Monitor closely.\n`;
    } else {
      analysis += `### 🟢 NO REGRESSION DETECTED\n\n`;
      analysis += `Performance metrics are stable or improved:\n`;
      if (comp.throughputChange > 0) {
        analysis += `- Throughput improved by ${comp.throughputChange.toFixed(
          1
        )}%\n`;
      }
      if (comp.p99Change <= 0) {
        analysis += `- Latency stable or improved\n`;
      }
      analysis += `- System is performing well\n`;
    }

    return analysis;
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(comp: any): string {
    let recommendations = '';

    if (comp.regressionLevel === 'severe') {
      recommendations += `1. **URGENT**: Roll back the latest changes\n`;
      recommendations += `2. Investigate database query performance\n`;
      recommendations += `3. Check for memory leaks or resource exhaustion\n`;
      recommendations += `4. Review recent dependency updates\n`;
      recommendations += `5. Scale up resources if hitting capacity limits\n`;
    } else if (comp.regressionLevel === 'moderate') {
      recommendations += `1. Investigate the cause of latency increase\n`;
      recommendations += `2. Profile the application for bottlenecks\n`;
      recommendations += `3. Review recent code changes\n`;
      recommendations += `4. Consider optimization opportunities\n`;
      recommendations += `5. Schedule performance review meeting\n`;
    } else if (comp.regressionLevel === 'minor') {
      recommendations += `1. Monitor performance trends over time\n`;
      recommendations += `2. Run additional benchmarks to confirm stability\n`;
      recommendations += `3. Optimize if variance continues\n`;
    } else {
      recommendations += `1. Maintain current optimization efforts\n`;
      recommendations += `2. Continue monitoring performance\n`;
      recommendations += `3. Consider establishing new baselines\n`;
    }

    return recommendations;
  }

  /**
   * Helper function to calculate change
   */
  private calculateChange(baseValue: number, currentValue: number): number {
    if (baseValue === 0) return 0;
    return ((currentValue - baseValue) / baseValue) * 100;
  }
}

export default new BaselineComparisonService();
