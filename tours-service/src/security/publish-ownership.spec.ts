import 'reflect-metadata';
import { ok } from 'neverthrow';
import { PublishTourUseCase } from '@going-monorepo-clean/domains-tour-application';
import { ITourRepository } from '@going-monorepo-clean/domains-tour-core';

/**
 * Captura el status HTTP de la excepción lanzada. Robusto ante duplicación de
 * módulos (instanceof ForbiddenException falla si @nestjs/common viene de dos
 * copias); comparamos el status (403/404) que expone HttpException.
 */
async function statusOf(fn: () => Promise<unknown>): Promise<number | 'no-throw'> {
  try {
    await fn();
    return 'no-throw';
  } catch (e: any) {
    return typeof e?.getStatus === 'function' ? e.getStatus() : e?.status;
  }
}

/**
 * Regresión de seguridad (auditoría Bloque 2 #19): PATCH /tours/:id/publish NO
 * debe permitir que un usuario publique el tour de OTRO host (BOLA). Solo el
 * host dueño o un admin.
 */
describe('PublishTourUseCase — ownership (#19 BOLA)', () => {
  const OWNER = 'host-owner-uuid';
  const OTHER = 'other-user-uuid';

  const makeTour = () => ({ hostId: OWNER, publish: jest.fn(() => ok(undefined)) });

  const makeRepo = (tour: any): ITourRepository =>
    ({
      findById: jest.fn().mockResolvedValue(ok(tour)),
      update: jest.fn().mockResolvedValue(ok(undefined)),
    } as unknown as ITourRepository);

  it('rechaza a quien NO es el dueño (403)', async () => {
    const tour = makeTour();
    const repo = makeRepo(tour);
    const useCase = new PublishTourUseCase(repo);
    const status = await statusOf(() => useCase.execute('tour-1' as any, OTHER, false));
    expect(status).toBe(403);
    expect(tour.publish).not.toHaveBeenCalled();
    expect(repo.update).not.toHaveBeenCalled();
  });

  it('permite al host DUEÑO publicar', async () => {
    const tour = makeTour();
    const repo = makeRepo(tour);
    const useCase = new PublishTourUseCase(repo);
    const res = await useCase.execute('tour-1' as any, OWNER, false);
    expect(res.status).toBe('published');
    expect(tour.publish).toHaveBeenCalledTimes(1);
    expect(repo.update).toHaveBeenCalledTimes(1);
  });

  it('permite a un ADMIN aunque no sea el dueño', async () => {
    const tour = makeTour();
    const repo = makeRepo(tour);
    const useCase = new PublishTourUseCase(repo);
    const res = await useCase.execute('tour-1' as any, OTHER, true);
    expect(res.status).toBe('published');
    expect(tour.publish).toHaveBeenCalledTimes(1);
  });

  it('sin requesterId (anónimo) rechaza (403)', async () => {
    const useCase = new PublishTourUseCase(makeRepo(makeTour()));
    const status = await statusOf(() => useCase.execute('tour-1' as any, undefined, false));
    expect(status).toBe(403);
  });

  it('tour inexistente → 404', async () => {
    const useCase = new PublishTourUseCase(makeRepo(null));
    const status = await statusOf(() => useCase.execute('missing' as any, OWNER, false));
    expect(status).toBe(404);
  });
});
