import simpleGit, { SimpleGit } from 'simple-git';
import { config } from '../config';

export class GitTool {
  private git: SimpleGit;

  constructor() {
    this.git = simpleGit(config.repoPath);
  }

  async getDiff(): Promise<string> {
    return this.git.diff(['HEAD~1', 'HEAD']);
  }

  async getStatus(): Promise<string> {
    const status = await this.git.status();
    return JSON.stringify(status, null, 2);
  }

  async getRecentLog(lines = 10): Promise<string> {
    const log = await this.git.log({ maxCount: lines });
    return log.all.map(c => `${c.hash.slice(0, 8)} ${c.date} ${c.message}`).join('\n');
  }

  async getCurrentBranch(): Promise<string> {
    return this.git.revparse(['--abbrev-ref', 'HEAD']);
  }

  async createAgentBranch(): Promise<void> {
    const branches = await this.git.branchLocal();
    if (!branches.all.includes(config.agentBranch)) {
      await this.git.checkoutLocalBranch(config.agentBranch);
    } else {
      await this.git.checkout(config.agentBranch);
    }
  }

  async checkoutMain(): Promise<void> {
    await this.git.checkout('main');
    await this.git.pull('origin', 'main');
  }

  async commitAndPush(message: string, files: string[]): Promise<string> {
    // Verificar que ningún archivo esté en blacklist
    const blocked = files.filter(f =>
      config.blacklist.some(b => f.includes(b))
    );
    if (blocked.length > 0) {
      throw new Error(`Blocked: cannot modify protected files: ${blocked.join(', ')}`);
    }

    await this.git.add(files);
    const commit = await this.git.commit(`[agent] ${message}`);
    await this.git.push('origin', config.agentBranch, ['--set-upstream']);
    return commit.commit;
  }
}
