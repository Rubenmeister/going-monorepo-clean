import { render, screen } from '@testing-library/react';

/**
 * Smoke test mínimo de frontend-webapp.
 *
 * El spec original de scaffolding (Nx) renderizaba `src/app/page` entera —
 * toda la home con sus decenas de dependencias, imágenes y proveedores— lo
 * que la volvía frágil y, combinado con la config de jest rota
 * (jest.config.cts no era reconocido por jest + .swcrc excluía specs), nunca
 * llegó a ejecutarse en CI. Lo sustituimos por un test autocontenido que
 * verifica que el pipeline de testing (SWC + JSX/TSX + jsdom) funciona.
 */
function Hello({ name }: { name: string }) {
  return <p>Hola, {name}</p>;
}

describe('frontend-webapp testing pipeline', () => {
  it('renderiza un componente con JSX/TSX', () => {
    render(<Hello name="Going" />);
    expect(screen.getByText('Hola, Going')).toBeTruthy();
  });
});
