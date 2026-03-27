import fs from 'fs';
import path from 'path';
import { config } from '../config';

const IGNORED_DIRS = ['node_modules', '.next', 'dist', '.git'];

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

  // FIX: indentación correcta en recursión — usar prefix en lugar de re-indentar strings ya procesados
  listDir(dirPath: string, depth = 1, prefix = ''): string[] {
    const full = path.join(config.repoPath, dirPath);
    if (!fs.existsSync(full)) return [`❌ Directorio no encontrado: ${dirPath}`];

    const entries = fs.readdirSync(full, { withFileTypes: true });
    const result: string[] = [];

    for (const e of entries) {
      if (IGNORED_DIRS.includes(e.name)) continue;

      const label = e.isDirectory() ? `${e.name}/` : e.name;
      result.push(`${prefix}${label}`);

      if (e.isDirectory() && depth > 1) {
        const subPath = path.join(dirPath, e.name);
        const subEntries = this.listDir(subPath, depth - 1, `${prefix}  `);
        result.push(...subEntries);
      }
    }
    return result;
  }

  findFiles(pattern: RegExp, baseDir = ''): string[] {
    const full = path.join(config.repoPath, baseDir);
    const results: string[] = [];
    const walk = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (IGNORED_DIRS.includes(e.name)) continue;
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p);
        else if (pattern.test(e.name)) results.push(p.replace(config.repoPath, ''));
      }
    };
    walk(full);
    return results;
  }
}
