import fs from 'fs';
import path from 'path';
import { config } from '../config';

export class FilesystemTool {

  isBlacklisted(filePath: string): boolean {
    return config.blacklist.some(b => filePath.includes(b));
  }

  readFile(filePath: string): string {
    const full = path.isAbsolute(filePath)
      ? filePath
      : path.join(config.repoPath, filePath);
    return fs.readFileSync(full, 'utf8');
  }

  writeFile(filePath: string, content: string): void {
    if (this.isBlacklisted(filePath)) {
      throw new Error(`Blocked: ${filePath} is protected`);
    }
    const full = path.isAbsolute(filePath)
      ? filePath
      : path.join(config.repoPath, filePath);
    fs.writeFileSync(full, content, 'utf8');
  }

  listDir(dirPath: string, depth = 1): string[] {
    const full = path.join(config.repoPath, dirPath);
    const entries = fs.readdirSync(full, { withFileTypes: true });
    const result: string[] = [];
    for (const e of entries) {
      if (['node_modules', '.next', 'dist', '.git'].includes(e.name)) continue;
      result.push(e.isDirectory() ? `${e.name}/` : e.name);
      if (e.isDirectory() && depth > 1) {
        const sub = this.listDir(path.join(dirPath, e.name), depth - 1);
        result.push(...sub.map(s => `  ${s}`));
      }
    }
    return result;
  }

  findFiles(pattern: RegExp, baseDir = ''): string[] {
    const full = path.join(config.repoPath, baseDir);
    const results: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (['node_modules', '.next', 'dist', '.git'].includes(e.name)) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (pattern.test(e.name)) results.push(p.replace(config.repoPath, ''));
      }
    };
    walk(full);
    return results;
  }
}
