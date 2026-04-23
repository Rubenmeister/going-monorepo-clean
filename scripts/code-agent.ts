#!/usr/bin/env npx ts-node
/**
 * GOING Code Quality Agent
 * Powered by Claude — finds bugs, security issues, and code smells.
 * Optionally auto-fixes them.
 *
 * Usage:
 *   npx ts-node scripts/code-agent.ts --path=user-auth-service/src
 *   npx ts-node scripts/code-agent.ts --path=api-gateway/src --fix
 *   npx ts-node scripts/code-agent.ts --diff          (only changed files vs main)
 */

import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';
import { execSync } from 'child_process';

// ─── Config ────────────────────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) {
  console.error('❌ Set ANTHROPIC_API_KEY env var before running.');
  process.exit(1);
}

const client = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
const args = process.argv.slice(2);
const autoFix = args.includes('--fix');
const diffMode = args.includes('--diff');
const pathArg = args.find(a => a.startsWith('--path='))?.split('=')[1];
const ROOT = path.resolve(__dirname, '..');

const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];
const IGNORE_DIRS = ['node_modules', 'dist', '.nx', '.git', 'coverage', '__mocks__'];
const MAX_FILE_SIZE_KB = 100;

// ─── Issue types ───────────────────────────────────────────────────────────
interface Issue {
  file: string;
  line?: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: 'bug' | 'security' | 'performance' | 'quality' | 'style';
  description: string;
  suggestion: string;
  fixedCode?: string;  // full file content after fix (if applicable)
}

interface AgentReport {
  scannedFiles: number;
  issues: Issue[];
  fixesApplied: number;
  summary: string;
}

// ─── Collect files ─────────────────────────────────────────────────────────
function collectFiles(dir: string): string[] {
  const results: string[] = [];

  function walk(current: string) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      if (IGNORE_DIRS.includes(entry.name)) continue;
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (EXTENSIONS.includes(path.extname(entry.name))) {
        const sizeKb = fs.statSync(full).size / 1024;
        if (sizeKb <= MAX_FILE_SIZE_KB) results.push(full);
      }
    }
  }

  walk(dir);
  return results;
}

function getChangedFiles(): string[] {
  try {
    const output = execSync('git diff --name-only main...HEAD 2>/dev/null || git diff --name-only HEAD~1 HEAD', {
      cwd: ROOT,
      encoding: 'utf8',
    });
    return output
      .split('\n')
      .filter(f => EXTENSIONS.includes(path.extname(f)) && f.trim())
      .map(f => path.join(ROOT, f))
      .filter(f => fs.existsSync(f));
  } catch {
    console.warn('⚠️  Could not get git diff — scanning all files instead.');
    return [];
  }
}

// ─── Analyze a single file with Claude ────────────────────────────────────
async function analyzeFile(filePath: string, fix: boolean): Promise<Issue[]> {
  const rel = path.relative(ROOT, filePath);
  const content = fs.readFileSync(filePath, 'utf8');

  const prompt = `You are a senior software engineer reviewing code in a NestJS/TypeScript monorepo (Nx) for a transportation and tourism platform.

Analyze this file and identify ALL issues: bugs, security vulnerabilities, performance problems, bad practices, and code smells.
${fix ? 'For each fixable issue, provide the corrected code snippet.' : ''}

File: ${rel}
\`\`\`typescript
${content}
\`\`\`

Respond ONLY with a JSON array of issues. If no issues found, return [].
Each issue must have this exact shape:
{
  "line": <number or null>,
  "severity": "critical" | "high" | "medium" | "low",
  "type": "bug" | "security" | "performance" | "quality" | "style",
  "description": "<clear description of the problem>",
  "suggestion": "<how to fix it>",
  "fixedCode": "<corrected snippet — only the changed lines, not the whole file>"
}

Focus on real problems. Skip stylistic nits unless they cause issues. Return valid JSON only.`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '[]';

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return [];

    const raw = JSON.parse(jsonMatch[0]) as Omit<Issue, 'file'>[];
    return raw.map(i => ({ ...i, file: rel }));
  } catch (err) {
    console.warn(`  ⚠️  Could not analyze ${rel}: ${(err as Error).message}`);
    return [];
  }
}

// ─── Apply fix interactively ───────────────────────────────────────────────
async function applyFix(issue: Issue): Promise<boolean> {
  if (!issue.fixedCode) return false;

  const filePath = path.join(ROOT, issue.file);
  const original = fs.readFileSync(filePath, 'utf8');

  console.log(`\n📋 Issue in ${issue.file}:${issue.line || ''}`);
  console.log(`   ${issue.description}`);
  console.log(`\n🔧 Proposed fix:\n${issue.fixedCode}\n`);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const answer = await new Promise<string>(resolve => rl.question('Apply fix? (y/n/skip all) ', resolve));
  rl.close();

  if (answer.toLowerCase() === 'y') {
    // Replace matching snippet in the file
    const updated = original.replace(
      issue.fixedCode.split('\n')[0].trim(),
      issue.fixedCode.trim()
    );
    if (updated !== original) {
      fs.writeFileSync(filePath, updated, 'utf8');
      return true;
    } else {
      console.log('  ℹ️  Could not automatically apply — fix manually.');
    }
  } else if (answer.toLowerCase().startsWith('skip')) {
    return false;
  }
  return false;
}

// ─── Render report ─────────────────────────────────────────────────────────
function renderReport(report: AgentReport) {
  const SEVERITY_ICON: Record<string, string> = {
    critical: '🔴',
    high: '🟠',
    medium: '🟡',
    low: '🔵',
  };
  const TYPE_ICON: Record<string, string> = {
    bug: '🐛',
    security: '🔐',
    performance: '⚡',
    quality: '✨',
    style: '🎨',
  };

  console.log('\n' + '═'.repeat(60));
  console.log('  GOING Code Agent — Report');
  console.log('═'.repeat(60));
  console.log(`📂 Files scanned : ${report.scannedFiles}`);
  console.log(`🐛 Issues found  : ${report.issues.length}`);
  console.log(`🔧 Fixes applied : ${report.fixesApplied}`);

  if (report.issues.length === 0) {
    console.log('\n✅ No issues found. Code looks clean!\n');
    return;
  }

  // Group by file
  const byFile = new Map<string, Issue[]>();
  for (const issue of report.issues) {
    if (!byFile.has(issue.file)) byFile.set(issue.file, []);
    byFile.get(issue.file)!.push(issue);
  }

  for (const [file, issues] of byFile) {
    console.log(`\n📄 ${file}`);
    for (const issue of issues) {
      const icon = `${SEVERITY_ICON[issue.severity]} ${TYPE_ICON[issue.type]}`;
      const loc = issue.line ? `:${issue.line}` : '';
      console.log(`  ${icon} [${issue.severity.toUpperCase()}] ${issue.description}`);
      console.log(`     → ${issue.suggestion}`);
      if (issue.line) console.log(`     (line${loc})`);
    }
  }

  // Summary by severity
  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  for (const i of report.issues) counts[i.severity]++;
  console.log('\n📊 Summary:');
  for (const [sev, count] of Object.entries(counts)) {
    if (count > 0) console.log(`  ${SEVERITY_ICON[sev]} ${sev}: ${count}`);
  }

  // Save report to file
  const reportPath = path.join(ROOT, 'code-agent-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`\n💾 Full report saved: code-agent-report.json`);
  console.log('═'.repeat(60) + '\n');
}

// ─── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('🤖 GOING Code Agent starting...\n');

  // Determine which files to scan
  let files: string[] = [];

  if (diffMode) {
    files = getChangedFiles();
    console.log(`📌 Diff mode: ${files.length} changed file(s)`);
  } else if (pathArg) {
    const target = path.resolve(ROOT, pathArg);
    if (fs.statSync(target).isDirectory()) {
      files = collectFiles(target);
    } else {
      files = [target];
    }
    console.log(`📂 Scanning: ${pathArg} (${files.length} files)`);
  } else {
    // Default: scan all services
    const services = [
      'user-auth-service/src',
      'api-gateway/src',
      'customer-support-service/src',
      'libs/shared',
    ];
    for (const svc of services) {
      const full = path.join(ROOT, svc);
      if (fs.existsSync(full)) files.push(...collectFiles(full));
    }
    console.log(`📂 Scanning core services (${files.length} files)`);
  }

  if (files.length === 0) {
    console.log('No files to scan.');
    return;
  }

  const allIssues: Issue[] = [];
  let fixesApplied = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const rel = path.relative(ROOT, file);
    process.stdout.write(`  [${i + 1}/${files.length}] ${rel}...`);
    const issues = await analyzeFile(file, autoFix);
    process.stdout.write(issues.length > 0 ? ` ⚠️  ${issues.length} issue(s)\n` : ' ✅\n');
    allIssues.push(...issues);

    // Auto-fix interactively if --fix flag
    if (autoFix) {
      for (const issue of issues) {
        if (issue.severity === 'critical' || issue.severity === 'high') {
          const fixed = await applyFix(issue);
          if (fixed) fixesApplied++;
        }
      }
    }
  }

  const report: AgentReport = {
    scannedFiles: files.length,
    issues: allIssues,
    fixesApplied,
    summary: `Found ${allIssues.length} issues across ${files.length} files.`,
  };

  renderReport(report);

  // Exit with error code if critical issues found (useful for CI)
  const hasCritical = allIssues.some(i => i.severity === 'critical');
  if (hasCritical && !autoFix) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
