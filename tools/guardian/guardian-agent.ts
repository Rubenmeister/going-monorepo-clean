import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Guardian Agent Core Logic
 * 
 * Goals:
 * 1. Audit: Run nx affected to find errors.
 * 2. Analyze: Use AI to understand errors.
 * 3. Fix: Apply automated fixes (WIP).
 * 4. Report: Generate a daily briefing.
 */

interface AuditResult {
  target: string;
  success: boolean;
  output: string;
}

class GuardianAgent {
  private reportPath: string = path.join(process.cwd(), 'GUARDIAN_REPORT.md');
  private auditResults: AuditResult[] = [];

  constructor() {
    console.log('🛡️ Guardian Agent Initialized');
  }

  async runAudit() {
    const targets = ['lint', 'test', 'build'];
    console.log('🔍 Starting Audit...');

    for (const target of targets) {
      try {
        console.log(`📡 Checking target: ${target}...`);
        // Using --all for the initial full audit, but in CI it should use --affected
        const output = execSync(`npx nx run-many --target=${target} --all --parallel=3`, { encoding: 'utf-8', stdio: 'pipe' });
        this.auditResults.push({ target, success: true, output });
      } catch (error: any) {
        console.error(`❌ Audit failed for target: ${target}`);
        this.auditResults.push({ target, success: false, output: error.stdout || error.message });
      }
    }
  }

  generateReport() {
    let report = `# 🛡️ Guardian Agent Daily Briefing - ${new Date().toLocaleDateString()}\n\n`;
    report += `## 📊 Audit Status\n\n`;

    const allSuccess = this.auditResults.every(r => r.success);
    report += allSuccess 
      ? `✅ **All systems operational.** No major issues detected in the monorepo.\n\n`
      : `⚠️ **Issues detected.** Some targets require attention.\n\n`;

    report += `| Target | Status | Details |\n`;
    report += `| :--- | :--- | :--- |\n`;

    for (const result of this.auditResults) {
      const status = result.success ? '✅ Pass' : '❌ Fail';
      const summary = result.success ? 'No issues' : 'Click "Details" for logs';
      report += `| ${result.target} | ${status} | ${summary} |\n`;
    }

    if (!allSuccess) {
      report += `\n## 🔍 Error Logs Analysis\n\n`;
      for (const result of this.auditResults) {
        if (!result.success) {
          report += `### ❌ Failure in: ${result.target}\n\n`;
          report += '```text\n' + result.output.slice(-2000) + '\n```\n\n';
        }
      }
    }

    report += `\n---\n*This report was generated automatically by the Guardian Agent.*`;

    fs.writeFileSync(this.reportPath, report);
    console.log(`📝 Report generated at: ${this.reportPath}`);
  }
}

const agent = new GuardianAgent();
agent.runAudit().then(() => {
  agent.generateReport();
}).catch(err => {
  console.error('Fatal Guardian error:', err);
  process.exit(1);
});
