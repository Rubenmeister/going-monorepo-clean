// Anfitriones is a public marketing page — el RoleGuard 'host' bloqueaba
// a no-hosts (incluidos visitantes anónimos) de leer la propuesta de valor
// antes de registrarse. /anfitriones/registro también es público (form
// para SER host). La guarda por rol va en /anfitriones/panel cuando exista.
export default function AnfitrioneLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
