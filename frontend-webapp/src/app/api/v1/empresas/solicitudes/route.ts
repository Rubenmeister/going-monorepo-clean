/**
 * Endpoint POST /api/v1/empresas/solicitudes
 * Crea una nueva solicitud de cuenta (prospect)
 *
 * TODO: Integrar con MongoDB en Fase 1
 * TODO: Validar RUC contra SENADI API en Fase 2
 */

import { NextRequest, NextResponse } from "next/server";

// Mock: Simular almacenamiento en memoria para Fase 1
// TODO: Reemplazar con MongoDB en producción
const solicitudes: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validación básica
    const requiredFields = [
      "tipoCuenta",
      "razonSocial",
      "ruc",
      "contactoEmail",
      "contactoNombre",
    ];

    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          {
            error: `Campo requerido: ${field}`,
          },
          { status: 400 }
        );
      }
    }

    // Crear documento
    const solicitud = {
      _id: `sol_${Date.now()}`,
      ...body,
      estado: "prospect",
      creadaEn: new Date(),
      actualizadaEn: new Date(),
    };

    // TODO: Guardar en MongoDB
    solicitudes.push(solicitud);

    // TODO: Enviar email de confirmación
    // TODO: Notificar al equipo de ventas (Slack, email, CRM)

    return NextResponse.json(
      {
        success: true,
        id: solicitud._id,
        message: "Solicitud creada exitosamente",
        solicitud,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating solicitud:", error);
    return NextResponse.json(
      {
        error: "Error al crear la solicitud",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/v1/empresas/solicitudes
 * Lista todas las solicitudes (solo para admin/ventas)
 * TODO: Agregar autenticación en Fase 2
 */
export async function GET(request: NextRequest) {
  try {
    // TODO: Validar token JWT y permisos
    // TODO: Leer de MongoDB

    return NextResponse.json({
      solicitudes,
      total: solicitudes.length,
    });
  } catch (error) {
    console.error("Error fetching solicitudes:", error);
    return NextResponse.json(
      {
        error: "Error al obtener solicitudes",
      },
      { status: 500 }
    );
  }
}
