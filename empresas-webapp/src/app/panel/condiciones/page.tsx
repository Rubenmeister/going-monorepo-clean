/**
 * Página de Condiciones Contractuales
 * Ruta: /condiciones
 *
 * Muestra las condiciones específicas del tipo de cuenta del usuario autenticado.
 */

"use client";

import { useAuthRedirect } from "@/lib/auth";

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TipoCuenta = "grande" | "negocio" | "agencia";

interface Seccion {
  titulo: string;
  contenido: (string | { tipo: "lista"; items: string[] } | { tipo: "tabla"; encabezados: string[]; filas: string[][] })[];
}

// ─── Contenido por tipo ───────────────────────────────────────────────────────

const CONDICIONES: Record<TipoCuenta, { subtitulo: string; secciones: Seccion[] }> = {
  grande: {
    subtitulo: "Movilidad corporativa con crédito a 40 días · Aprobaciones multinivel · Wallet consolidada",
    secciones: [
      {
        titulo: "Resumen de tu Cuenta",
        contenido: [{ tipo: "tabla", encabezados: ["Condición", "Detalle"], filas: [
          ["Tipo de cuenta",    "Empresa Grande"],
          ["Plazo de pago",     "40 días calendario desde la fecha de factura"],
          ["Crédito corporativo","Definido en tu contrato individual"],
          ["Aprobaciones",      "Requeridas (flujo multinivel configurable)"],
          ["Penalidad por mora", "Según contrato individual"],
          ["Duración",          "12 meses, renovación automática"],
        ]}],
      },
      {
        titulo: "Crédito Corporativo",
        contenido: [
          "Tu cuenta dispone de una línea de crédito corporativo para cubrir los Bookings aprobados durante el período de facturación. El límite específico fue acordado en tu contrato y puedes consultarlo en la sección de Configuración.",
          "Going App podrá revisar el límite de crédito periódicamente en función de tu historial de pagos.",
        ],
      },
      {
        titulo: "Plazo y Condiciones de Pago",
        contenido: [
          "Recibirás una factura mensual consolidada con todos los Bookings del período. El pago deberá realizarse dentro de los 40 días calendario siguientes a la fecha de emisión.",
          { tipo: "lista", items: [
            "Transferencia bancaria a la cuenta designada por Going App.",
            "Débito automático (si está habilitado en tu cuenta).",
            "Otros medios autorizados según tu contrato.",
          ]},
          "En caso de mora se generarán intereses según lo estipulado en tu contrato individual.",
        ],
      },
      {
        titulo: "Aprobaciones",
        contenido: [
          "Todo Booking puede estar sujeto a aprobación previa según los umbrales que tu administrador haya configurado. Los Bookings pendientes de aprobación por más de 48 horas serán cancelados automáticamente sin cargo.",
          "Puedes configurar flujos de aprobación multinivel desde el panel de Configuración.",
        ],
      },
      {
        titulo: "Cancelaciones",
        contenido: [
          "La política de cancelación aplica según el tiempo de anticipación. Consulta la tabla de penalidades en tu contrato.",
          { tipo: "lista", items: [
            "Cancelaciones con suficiente anticipación: sin cargo.",
            "Cancelaciones tardías o no presentación (no-show): se aplica penalidad según contrato.",
          ]},
        ],
      },
      {
        titulo: "Suspensión de Cuenta",
        contenido: [
          "Going App podrá suspender temporalmente tu cuenta en caso de:",
          { tipo: "lista", items: [
            "Mora en el pago de facturas por más de 15 días.",
            "Superación del límite de crédito sin regularización.",
            "Incumplimiento grave de las condiciones.",
          ]},
        ],
      },
    ],
  },
  negocio: {
    subtitulo: "Pago inmediato por viaje · Sin crédito · Sin aprobaciones · Factura al instante",
    secciones: [
      {
        titulo: "Resumen de tu Cuenta",
        contenido: [{ tipo: "tabla", encabezados: ["Condición", "Detalle"], filas: [
          ["Tipo de cuenta",  "Negocio / PyME"],
          ["Modalidad",       "Pago por viaje — inmediato"],
          ["Crédito",         "No aplica"],
          ["Aprobaciones",    "No requeridas"],
          ["Factura",         "Emitida al completar cada Viaje"],
          ["Permanencia",     "Sin plazo mínimo"],
        ]}],
      },
      {
        titulo: "Cómo Funciona el Pago",
        contenido: [
          "Cada Booking se cobra de forma inmediata al momento de su confirmación. No existe período de crédito: el Viaje se confirma únicamente una vez procesado el pago satisfactoriamente.",
          { tipo: "lista", items: [
            "Tarjeta de crédito o débito (Visa, Mastercard, American Express).",
            "Transferencia bancaria anticipada.",
            "Otros medios habilitados en la Plataforma.",
          ]},
        ],
      },
      {
        titulo: "Facturación",
        contenido: [
          "Going App emite una factura electrónica por cada Booking completado, a nombre del RUC registrado en tu cuenta. Las facturas están disponibles en el panel de Facturación dentro de las 24 horas siguientes al servicio.",
        ],
      },
      {
        titulo: "Cancelaciones y Reembolsos",
        contenido: [
          "Si cancelas dentro del plazo sin penalidad, el reembolso se procesará al mismo medio de pago original dentro de 3 a 7 días hábiles, según tu entidad financiera.",
          "Las cancelaciones fuera de plazo o no presentación están sujetas a penalidad según la política general de cancelaciones.",
        ],
      },
      {
        titulo: "Cierre de Cuenta",
        contenido: [
          "Puedes cancelar tu cuenta en cualquier momento sin penalidad, siempre que no existan Bookings pendientes de ejecución ni pagos en disputa.",
        ],
      },
    ],
  },
  agencia: {
    subtitulo: "Comisión 10% · Liquidación a 15 días · Reservas a nombre de terceros",
    secciones: [
      {
        titulo: "Resumen de tu Cuenta",
        contenido: [{ tipo: "tabla", encabezados: ["Condición", "Detalle"], filas: [
          ["Tipo de cuenta",  "Agencia de Viajes"],
          ["Comisión",        "10% sobre el valor neto de cada Viaje ejecutado"],
          ["Liquidación",     "15 días calendario desde la fecha del Viaje"],
          ["Reservas",        "A nombre propio o de clientes terceros"],
          ["Crédito",         "No aplica"],
          ["Aprobaciones",    "No requeridas"],
          ["Duración",        "12 meses, renovación automática"],
        ]}],
      },
      {
        titulo: "Comisiones",
        contenido: [
          "Recibes una comisión del 10% sobre el valor neto (sin IVA) de cada Viaje efectivamente ejecutado. La comisión se calcula sobre el precio base del servicio.",
          { tipo: "lista", items: [
            "Se excluyen recargos, tasas, cargos por espera y servicios adicionales.",
            "No se genera comisión sobre Bookings cancelados, independientemente de la causa.",
            "La comisión acumulada se puede consultar en tiempo real en el panel de Comisiones.",
          ]},
        ],
      },
      {
        titulo: "Liquidación",
        contenido: [
          "Going App liquida las comisiones acumuladas dentro de los 15 días calendario siguientes a la fecha de ejecución del último Viaje del período. Recibirás una notificación con el detalle de la liquidación.",
          "Para recibir el pago deberás emitir tu factura a Going App dentro de los 3 días hábiles siguientes a la notificación.",
        ],
      },
      {
        titulo: "Reservas a Nombre de Terceros",
        contenido: [
          "Puedes realizar Bookings indicando los datos del pasajero o beneficiario final. Como Agencia, eres responsable de:",
          { tipo: "lista", items: [
            "Verificar la identidad y datos del pasajero al reservar.",
            "Informar al pasajero sobre las condiciones del Viaje.",
            "Gestionar cualquier modificación o cancelación solicitada por el pasajero.",
            "Los cargos por cancelaciones tardías o no presentación del pasajero son tu responsabilidad.",
          ]},
        ],
      },
      {
        titulo: "Retención de Comisiones",
        contenido: [
          "Going App puede retener o recuperar comisiones ya pagadas en caso de:",
          { tipo: "lista", items: [
            "Bookings cancelados con posterioridad al pago de la comisión.",
            "Disputas de pago no resueltas en 30 días.",
            "Incumplimiento de tus obligaciones como Agencia.",
          ]},
        ],
      },
      {
        titulo: "Obligaciones de la Agencia",
        contenido: [
          { tipo: "lista", items: [
            "Mantener vigente tu Registro de Turismo y comunicar a Going App cualquier suspensión.",
            "No delegar el acceso a tu cuenta a personas ajenas a la Agencia sin autorización.",
            "Emitir facturas de comisión dentro de los plazos establecidos.",
            "Mantener confidencialidad sobre tarifas y condiciones comerciales acordadas.",
          ]},
        ],
      },
    ],
  },
};

const COMMON_SECTIONS: Seccion[] = [
  {
    titulo: "Privacidad y Datos",
    contenido: [
      "Going App trata tus datos conforme a su Política de Privacidad y a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP).",
    ],
  },
  {
    titulo: "Legislación Aplicable",
    contenido: [
      "Estos términos se rigen por las leyes de la República del Ecuador. Cualquier controversia se resolverá mediante arbitraje ante el Centro de Arbitraje y Mediación de la Cámara de Comercio correspondiente.",
    ],
  },
];

// ─── Componentes de renderizado ───────────────────────────────────────────────

function RenderContenido({ item }: { item: Seccion["contenido"][number] }) {
  if (typeof item === "string") {
    return <p className="text-sm text-slate-700 leading-relaxed mb-3">{item}</p>;
  }
  if (item.tipo === "lista") {
    return (
      <ul className="mb-3 space-y-1.5">
        {item.items.map((i, idx) => (
          <li key={idx} className="flex gap-2 text-sm text-slate-700">
            <span className="text-blue-500 mt-0.5 shrink-0">•</span>
            <span>{i}</span>
          </li>
        ))}
      </ul>
    );
  }
  if (item.tipo === "tabla") {
    return (
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr>
              {item.encabezados.map((h, i) => (
                <th key={i} className="px-4 py-2 text-left text-xs font-semibold text-white uppercase tracking-wide bg-slate-700">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {item.filas.map((fila, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                {fila.map((celda, ci) => (
                  <td key={ci} className={`px-4 py-2.5 border-b border-slate-100 text-slate-700 ${ci === 0 ? "font-medium text-slate-900" : ""}`}>
                    {celda}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

// ─── Página ───────────────────────────────────────────────────────────────────

export default function CondicionesPage() {
  const { session } = useAuthRedirect();

  if (!session) return null;

  const tipoCuenta = (session!.user.tipoCuenta ?? "negocio") as TipoCuenta;
  const data = CONDICIONES[tipoCuenta] ?? CONDICIONES.negocio;

  const TIPO_COLORS: Record<TipoCuenta, string> = {
    grande:  "bg-blue-600",
    negocio: "bg-slate-600",
    agencia: "bg-indigo-600",
  };

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-bold text-slate-900">Condiciones Contractuales</h1>
          <span className={`px-3 py-1 text-xs font-semibold text-white rounded-full ${TIPO_COLORS[tipoCuenta]}`}>
            {{ grande: "Empresa Grande", negocio: "Negocio / PyME", agencia: "Agencia de Viajes" }[tipoCuenta]}
          </span>
        </div>
        <p className="text-slate-500 text-sm">{data.subtitulo}</p>
      </div>

      {/* Secciones específicas del tipo */}
      <div className="space-y-6">
        {data.secciones.map((sec, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
              <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">{sec.titulo}</h2>
            </div>
            <div className="px-5 py-4">
              {sec.contenido.map((item, j) => (
                <RenderContenido key={j} item={item} />
              ))}
            </div>
          </div>
        ))}

        {/* Secciones comunes */}
        <div className="border-t border-slate-200 pt-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Disposiciones Comunes</p>
          <div className="space-y-4">
            {COMMON_SECTIONS.map((sec, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                <div className="px-5 py-3 bg-slate-50 border-b border-slate-200">
                  <h2 className="text-sm font-semibold text-slate-800 uppercase tracking-wide">{sec.titulo}</h2>
                </div>
                <div className="px-5 py-4">
                  {sec.contenido.map((item, j) => (
                    <RenderContenido key={j} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-400 text-center pb-4">
          Versión 1.0 · {new Date().getFullYear()} Going App · Para el contrato completo con sus anexos, contacta a tu ejecutivo de cuenta.
        </p>
      </div>
    </div>
  );
}
