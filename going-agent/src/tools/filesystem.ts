import fs from 'fs';
import path from 'path';
import { config } from '../config';

const IGNORED_DIRS = ['node_modules', '.next', 'dist', '.git'];

export class FilesystemTool {

  isBlacklisted(filePath: string): boolean {
    return config.blacklist.some(b => filePath.includes(b));
  }

  readFile(filePath: string): string {
    try {
      const full = path.isAbsolute(filePath)
        ? filePath
        : path.join(config.repoPath, filePath);
      const resolved = path.resolve(config.repoPath, full);
      if (!resolved.startsWith(path.resolve(config.repoPath))) {
        return `error: Path traversal not allowed`;
      }
      return fs.readFileSync(resolved, 'utf8');
    } catch (e: any) {
      return `error: ${e.message}`;
    }
  }

  writeFile(filePath: string, content: string): void {
    if (this.isBlacklisted(filePath)) {
      throw new Error(`Blocked: ${filePath} is protected`);
    }
    try {
      const full = path.isAbsolute(filePath)
        ? filePath
        : path.join(config.repoPath, filePath);
      const resolved = path.resolve(config.repoPath, full);
      if (!resolved.startsWith(path.resolve(config.repoPath))) {
        throw new Error('Path traversal not allowed');
      }
      fs.writeFileSync(resolved, content, 'utf8');
    } catch (e: any) {
      throw new Error(`Write failed: ${e.message}`);
    }
  }

  // FIX: indentación correcta en recursión — usar prefix en lugar de re-indentar strings ya procesados
  listDir(dirPath: string, depth = 1, prefix = ''): string[] {
    try {
      const full = path.join(config.repoPath, dirPath);
      const resolved = path.resolve(config.repoPath, full);
      if (!resolved.startsWith(path.resolve(config.repoPath))) {
        return [`❌ Path traversal not allowed: ${dirPath}`];
      }
      if (!fs.existsSync(resolved)) return [`❌ Directorio no encontrado: ${dirPath}`];

      const entries = fs.readdirSync(resolved, { withFileTypes: true });
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
    } catch (e: any) {
      return [`❌ Error: ${e.message}`];
    }
  }

  findFiles(pattern: RegExp, baseDir = ''): string[] {
    try {
      const full = path.join(config.repoPath, baseDir);
      const resolved = path.resolve(config.repoPath, full);
      if (!resolved.startsWith(path.resolve(config.repoPath))) {
        return [];
      }
      const results: string[] = [];
      const walk = (dir: string) => {
        try {
          for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            if (IGNORED_DIRS.includes(e.name)) continue;
            const p = path.join(dir, e.name);
            if (e.isDirectory()) walk(p);
            else if (pattern.test(e.name)) results.push(p.replace(config.repoPath, ''));
          }
        } catch (e: any) {
          console.error(`Error scanning ${dir}: ${e.message}`);
        }
      };
      walk(resolved);
      return results;
    } catch (e: any) {
      console.error(`findFiles error: ${e.message}`);
      return [];
    }
  }
}
