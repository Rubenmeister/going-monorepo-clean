'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

// ─── Legal — Términos, Privacidad, Cookies, Contrato conductor ──────────────
// Accesible desde Perfil → Ajustes → Legal
// También se muestra al registrarse (checkbox de aceptación)
// ────────────────────────────────────────────────────────────────────────────

type Section = 'terms' | 'privacy' | 'cookies' | 'driver';

const SECTIONS: { id: Section; icon: string; title: string }[] = [
  { id: 'terms',   icon: '📋', title: 'Términos y Condiciones' },
  { id: 'privacy', icon: '🔒', title: 'Política de Privacidad' },
  { id: 'cookies', icon: '🍪', title: 'Política de Cookies' },
  { id: 'driver',  icon: '🚗', title: 'Contrato de Conductor' },
];

const CONTENT: Record<Section, { updated: string; body: { heading: string; text: string }[] }> = {
  terms: {
    updated: '1 de enero de 2026',
    body: [
      {
        heading: '1. Aceptación de los términos',
        text: 'Al usar Going Ecuador ("Going", "la Plataforma"), aceptas estos Términos y Condiciones. Si no estás de acuerdo, no uses la aplicación.',
      },
      {
        heading: '2. Descripción del servicio',
        text: 'Going es una plataforma tecnológica que conecta pasajeros con conductores para viajes interurbanos compartidos o privados en Ecuador, así como servicios de envío de paquetes.',
      },
      {
        heading: '3. Registro y cuenta',
        text: 'Debes ser mayor de 18 años para usar Going. Eres responsable de mantener la confidencialidad de tu cuenta y contraseña. Notifica a Going de inmediato ante cualquier uso no autorizado.',
      },
      {
        heading: '4. Tarifas y pagos',
        text: 'Las tarifas se calculan según la distancia, tipo de vehículo y demanda. Going puede modificar las tarifas con previo aviso. Los pagos se procesan a través de Datafast, DeUna o en efectivo al conductor.',
      },
      {
        heading: '5. Cancelaciones',
        text: 'Puedes cancelar un viaje hasta 30 minutos antes de la salida sin cargo. Cancelaciones posteriores pueden generar una penalidad de hasta el 20% del valor del viaje.',
      },
      {
        heading: '6. Responsabilidad',
        text: 'Going actúa como intermediario tecnológico. Los conductores son prestadores de servicios independientes. Going no es responsable por accidentes, pérdidas o daños ocurridos durante el viaje más allá de lo establecido por la ley ecuatoriana.',
      },
      {
        heading: '7. Going Rewards',
        text: 'Los puntos Going Rewards no tienen valor monetario, no son transferibles y pueden expirar tras 12 meses de inactividad. Going se reserva el derecho de modificar o cancelar el programa.',
      },
      {
        heading: '8. Modificaciones',
        text: 'Going puede modificar estos términos en cualquier momento. Te notificaremos por email o mediante la app. El uso continuado después de los cambios implica aceptación.',
      },
      {
        heading: '9. Ley aplicable',
        text: 'Estos términos se rigen por las leyes de la República del Ecuador. Cualquier disputa se resolverá en los tribunales competentes de Quito, Ecuador.',
      },
    ],
  },
  privacy: {
    updated: '1 de enero de 2026',
    body: [
      {
        heading: '1. Datos que recopilamos',
        text: 'Recopilamos: nombre, email, número de teléfono, ubicación GPS durante viajes activos, historial de viajes, método de pago (tokenizado), y datos de uso de la app.',
      },
      {
        heading: '2. Cómo usamos tus datos',
        text: 'Usamos tus datos para: conectarte con conductores, procesar pagos, mejorar el servicio, enviarte notificaciones relevantes, cumplir obligaciones legales y prevenir fraudes.',
      },
      {
        heading: '3. Compartición de datos',
        text: 'Compartimos datos limitados con conductores (nombre, foto, ubicación de recogida). No vendemos tus datos a terceros. Podemos compartirlos con autoridades ante requerimiento legal.',
      },
      {
        heading: '4. Ubicación GPS',
        text: 'La ubicación se solicita solo durante viajes activos o al buscar servicios cercanos. Puedes desactivarla desde la configuración de tu dispositivo, aunque esto puede limitar funciones de la app.',
      },
      {
        heading: '5. Número de teléfono',
        text: 'Tu número se usa para verificación OTP y para comunicarte con el conductor mediante números proxy de Twilio. Ningún conductor tiene acceso a tu número real.',
      },
      {
        heading: '6. Retención de datos',
        text: 'Conservamos tus datos mientras tu cuenta esté activa. Puedes solicitar eliminación de tu cuenta en Perfil → Ajustes → Eliminar cuenta. Ciertos datos se conservan por obligación legal por hasta 7 años.',
      },
      {
        heading: '7. Seguridad',
        text: 'Usamos encriptación TLS, tokens de sesión seguros y nunca almacenamos datos completos de tarjetas. Los pagos son procesados por Datafast y DeUna bajo estándares PCI-DSS.',
      },
      {
        heading: '8. Tus derechos',
        text: 'Tienes derecho a acceder, rectificar y eliminar tus datos personales conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador. Contacta: privacidad@goingec.com',
      },
    ],
  },
  cookies: {
    updated: '1 de enero de 2026',
    body: [
      {
        heading: '¿Qué son las cookies?',
        text: 'Las cookies son pequeños archivos que se almacenan en tu dispositivo para mejorar tu experiencia. En la app móvil usamos tecnologías similares (almacenamiento local).',
      },
      {
        heading: 'Cookies esenciales',
        text: 'Necesarias para el funcionamiento de la app: sesión de usuario, preferencias de idioma, token de autenticación. No pueden desactivarse.',
      },
      {
        heading: 'Cookies de rendimiento',
        text: 'Nos ayudan a entender cómo se usa la app (pantallas más visitadas, errores). Usamos datos anonimizados. Puedes desactivarlas en Ajustes → Privacidad.',
      },
      {
        heading: 'Cookies de marketing',
        text: 'Going no usa cookies de seguimiento publicitario de terceros en su app. Los productos Going son libres de publicidad de terceros.',
      },
      {
        heading: 'Control de cookies',
        text: 'Puedes gestionar tus preferencias en Perfil → Ajustes → Privacidad → Gestión de datos. Para la web goingec.com, usa el banner de cookies al ingresar.',
      },
    ],
  },
  driver: {
    updated: '1 de enero de 2026',
    body: [
      {
        heading: '1. Naturaleza de la relación',
        text: 'El conductor es un prestador de servicios independiente, no empleado de Going Ecuador. Going provee la plataforma tecnológica para conectar conductores con pasajeros.',
      },
      {
        heading: '2. Requisitos del conductor',
        text: 'Para operar en Going debes: tener licencia de conducir vigente tipo C o superior, vehículo SUV modelo 2015 o posterior, SOAT vigente, matrícula al día, y aprobación del proceso de verificación Going.',
      },
      {
        heading: '3. Comisión Going',
        text: 'Going retiene el 15% de cada viaje completado como comisión por el uso de la plataforma. El 85% restante se acredita al conductor según el ciclo de pago acordado (semanal).',
      },
      {
        heading: '4. Estándares de calidad',
        text: 'Debes mantener una calificación mínima de 4.5 estrellas. Calificaciones por debajo de 4.0 por más de 30 días pueden resultar en suspensión temporal o permanente de la cuenta.',
      },
      {
        heading: '5. Obligaciones del conductor',
        text: 'Cumplir el itinerario publicado, verificar el PIN del pasajero antes del abordaje, mantener el vehículo limpio y en buen estado, no fumar durante el viaje, y respetar las leyes de tránsito.',
      },
      {
        heading: '6. Seguro',
        text: 'Going no provee seguro de accidentes. El conductor es responsable de contar con seguro privado de pasajeros vigente conforme a la ley ecuatoriana.',
      },
      {
        heading: '7. Datos del conductor',
        text: 'Tu nombre, foto y calificación son visibles para los pasajeros. Tu número de teléfono real nunca se comparte — las llamadas se enrutan a través de números proxy de Going.',
      },
      {
        heading: '8. Terminación',
        text: 'Cualquiera de las partes puede terminar la relación en cualquier momento. Going puede suspender cuentas por violaciones a estos términos, fraude o comportamiento inapropiado.',
      },
    ],
  },
};

export default function LegalPage() {
  const router = useRouter();
  const [active, setActive] = useState<Section | null>(null);

  if (active) {
    const section = SECTIONS.find(s => s.id === active)!;
    const content = CONTENT[active];
    return (
      <div className="min-h-screen bg-[#080a0e] text-white flex flex-col">
        <div className="flex items-center gap-4 px-5 pt-12 pb-4 border-b border-white/5">
          <button onClick={() => setActive(null)}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95">
            <span className="text-lg">←</span>
          </button>
          <div>
            <h1 className="text-[17px] font-black text-white">{section.icon} {section.title}</h1>
            <p className="text-[11px] text-white/30">Última actualización: {content.updated}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6 pb-16 space-y-6">
          {content.body.map((item, i) => (
            <div key={i}>
              <h2 className="text-[14px] font-black text-white mb-2">{item.heading}</h2>
              <p className="text-[13px] text-white/60 leading-relaxed">{item.text}</p>
            </div>
          ))}
          <div className="pt-4 border-t border-white/5">
            <p className="text-[11px] text-white/25 text-center">
              Going Ecuador · goingec.com · contacto@goingec.com
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080a0e] text-white flex flex-col">
      <div className="flex items-center gap-4 px-5 pt-12 pb-4">
        <button onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center active:scale-95">
          <span className="text-lg">←</span>
        </button>
        <div>
          <h1 className="text-[18px] font-black text-white">Legal</h1>
          <p className="text-[12px] text-white/40">Documentos legales de Going Ecuador</p>
        </div>
      </div>

      <div className="px-5 pt-2 pb-10 space-y-3">
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setActive(s.id)}
            className="w-full flex items-center gap-4 p-4 bg-[#0d1117] border border-white/8 rounded-2xl text-left active:scale-98 transition-all hover:border-white/15">
            <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl flex-shrink-0">
              {s.icon}
            </div>
            <div className="flex-1">
              <div className="text-[14px] font-black text-white">{s.title}</div>
              <div className="text-[11px] text-white/30 mt-0.5">Actualizado: {CONTENT[s.id].updated}</div>
            </div>
            <span className="text-white/20">›</span>
          </button>
        ))}

        <div className="pt-4">
          <p className="text-[11px] text-white/20 text-center leading-relaxed">
            Al usar Going aceptas estos documentos.{'\n'}
            Contacto legal: legal@goingec.com
          </p>
        </div>
      </div>
    </div>
  );
}
