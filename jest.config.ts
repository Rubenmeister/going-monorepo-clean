import type { Config } from 'jest';
import { getJestProjectsAsync } from '@nx/jest';

export default async (): Promise<Config> => {
  const projects = await getJestProjectsAsync();
  // Excluimos los proyectos *-e2e: tienen globalSetup que espera servicios
  // reales escuchando (puerto 3000, etc.) y corren bajo el target `e2e`, no
  // `test`. Sin esto, el target raíz `test` intenta levantarlos y falla con
  // ECONNREFUSED en el job unitario.
  const unit = (projects as unknown[]).filter((p) => {
    const ref =
      typeof p === 'string' ? p : (p as { rootDir?: string }).rootDir ?? '';
    return !/-e2e(\/|$)/.test(ref);
  });
  return { projects: unit as Config['projects'] };
};
