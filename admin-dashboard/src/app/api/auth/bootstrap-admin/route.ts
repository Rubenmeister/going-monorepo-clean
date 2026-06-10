import { NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env.AUTH_SERVICE_URL || 'https://api.goingec.com';

/**
 * POST /api/auth/bootstrap-admin — alta de administradora/administrador PROTEGIDA.
 *
 * Reemplaza al viejo /api/auth/register, que inyectaba roles:['admin'] sin
 * ninguna verificación (cualquiera podía crear un admin → privilege escalation).
 *
 * Ahora exige el bootstrap-token compartido: se reenvía al endpoint seguro del
 * backend (POST /auth/bootstrap-admin), que lo compara en tiempo constante
 * contra la env var BOOTSTRAP_TOKEN. Sin token válido → 403.
 *
 * El token NO se guarda en este servidor ni se loguea: lo provee quien opera el
 * alta (equipo de plataforma) y solo se reenvía en el header x-bootstrap-token.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { bootstrapToken, firstName, lastName, email, password } = body ?? {};

    if (!bootstrapToken) {
      return NextResponse.json(
        { message: 'Falta el token de autorización para crear administradores.' },
        { status: 400 }
      );
    }
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email y contraseña son obligatorios.' },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND}/auth/bootstrap-admin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-bootstrap-token': String(bootstrapToken),
      },
      body: JSON.stringify({ email, password, firstName, lastName }),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error('[admin proxy /api/auth/bootstrap-admin]', err);
    return NextResponse.json(
      { message: 'No se pudo conectar con el servidor.' },
      { status: 503 }
    );
  }
}
