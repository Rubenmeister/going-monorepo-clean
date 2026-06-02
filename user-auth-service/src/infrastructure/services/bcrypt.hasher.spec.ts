import { BcryptHasher } from './bcrypt.hasher';

describe('BcryptHasher', () => {
  const hasher = new BcryptHasher();

  it('hashea la contraseña (no la guarda en claro) y la verifica', async () => {
    const hash = await hasher.hash('s3cr3t-passw0rd');
    expect(hash).not.toBe('s3cr3t-passw0rd');
    expect(await hasher.compare('s3cr3t-passw0rd', hash)).toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const hash = await hasher.hash('correcta');
    expect(await hasher.compare('incorrecta', hash)).toBe(false);
  });

  it('genera hashes distintos para la misma contraseña (salt aleatorio)', async () => {
    const h1 = await hasher.hash('misma');
    const h2 = await hasher.hash('misma');
    expect(h1).not.toBe(h2);
    // pero ambos verifican
    expect(await hasher.compare('misma', h1)).toBe(true);
    expect(await hasher.compare('misma', h2)).toBe(true);
  });
});
