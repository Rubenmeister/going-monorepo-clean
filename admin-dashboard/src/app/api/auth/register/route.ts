import { NextResponse } from 'next/server';

/**
 * ⚠️ Endpoint RETIRADO por seguridad (2026-06-10).
 *
 * Antes este proxy inyectaba roles:['admin'] y reenviaba a /auth/register,
 * permitiendo que CUALQUIERA creara una cuenta de administrador sin
 * autenticación (privilege escalation crítico). Ver:
 *   - admin-dashboard/src/app/login/crear-admin/page.tsx (alta protegida)
 *   - admin-dashboard/src/app/api/auth/bootstrap-admin/route.ts (flujo seguro)
 *
 * La creación de admins ahora va EXCLUSIVAMENTE por el flujo con bootstrap-token:
 * POST /api/auth/bootstrap-admin.
 *
 * No se borra el handler: se deja respondiendo 410 Gone para que cualquier
 * cliente cacheado que aún lo invoque falle de forma explícita y segura, sin
 * poder crear cuentas ni asignar roles.
 */
export async function POST() {
  return NextResponse.json(
    {
      message:
        'Este endpoint fue retirado. La creación de administradores requiere un token de autorización (POST /api/auth/bootstrap-admin).',
    },
    { status: 410 }
  );
}
