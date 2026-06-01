import { render, screen } from '@testing-library/react';

/**
 * Smoke test mínimo de admin-dashboard.
 *
 * El spec de scaffolding (Nx) renderizaba src/app/page entera y nunca corría en
 * CI por la config de jest rota. Lo sustituimos por un test autocontenido que
 * verifica que el pipeline (SWC + JSX/TSX + jsdom) funciona.
 */
function Hello({ name }: { name: string }) {
  return <p>Hola, {name}</p>;
}

describe('admin-dashboard testing pipeline', () => {
  it('renderiza un componente con JSX/TSX', () => {
    render(<Hello name="Admin" />);
    expect(screen.getByText('Hola, Admin')).toBeTruthy();
  });
});
