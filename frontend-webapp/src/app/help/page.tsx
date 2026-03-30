'use client';

import { useState } from 'react';
import Link from 'next/link';

const CATEGORIES = [
  { id: 'primeros-pasos',  name: 'Primeros Pasos',          icon: '🚀' },
  { id: 'cuenta',          name: 'Cuenta y Configuración',  icon: '⚙️' },
  { id: 'pagos',           name: 'Reservas y Pagos',        icon: '💳' },
  { id: 'seguridad',       name: 'Seguridad y Soporte',     icon: '🛡️' },
  { id: 'tecnico',         name: 'Ayuda Técnica',           icon: '🔧' },
];

const FAQS: { category: string; q: string; a: string }[] = [
  // Primeros Pasos
  { category: 'primeros-pasos', q: '¿Qué es Going?', a: 'Going es la plataforma ecuatoriana de movilidad y servicios. Puedes reservar transporte interurbano, alojamiento, tours, experiencias y envíos — todo desde una sola app.' },
  { category: 'primeros-pasos', q: '¿Cómo descargo la app?', a: 'Descárgala gratis desde el App Store (iOS) o Google Play (Android). Busca "Going Ecuador" o usa los links en la sección de descarga de nuestra web.' },
  { category: 'primeros-pasos', q: '¿Cómo creo mi cuenta?', a: 'Toca "Registrarse" en la app o web, ingresa tu nombre, correo y contraseña. También puedes entrar con tu cuenta de Google. En menos de 2 minutos ya puedes reservar.' },
  { category: 'primeros-pasos', q: '¿Cómo reservo un viaje?', a: 'Selecciona "Transporte", elige tu ciudad de origen y destino, la fecha, el tipo de vehículo y el modo de viaje (compartido o privado). Confirma y paga. Recibirás los datos del conductor al instante.' },
  { category: 'primeros-pasos', q: '¿En qué ciudades opera Going?', a: 'Actualmente operamos rutas desde Quito hacia: Santo Domingo, Latacunga, Ambato, Riobamba, Baños y Salinas. Estamos expandiendo a nuevas rutas cada mes.' },

  // Cuenta
  { category: 'cuenta', q: '¿Cómo cambio mi contraseña?', a: 'Ve a Mi Cuenta → Seguridad → Cambiar Contraseña. También puedes usar "Olvidé mi contraseña" en la pantalla de inicio de sesión para recibir un enlace por correo.' },
  { category: 'cuenta', q: '¿Cómo actualizo mi foto y datos de perfil?', a: 'En la app: toca tu avatar → Editar Perfil. Puedes cambiar nombre, teléfono, foto y correo. Los cambios se guardan de inmediato.' },
  { category: 'cuenta', q: '¿Puedo tener varias cuentas?', a: 'No. Cada persona puede tener una sola cuenta de usuario. Si eres también conductor o anfitrión, tu misma cuenta tiene ambos roles.' },
  { category: 'cuenta', q: '¿Cómo elimino mi cuenta?', a: 'Ve a Mi Cuenta → Configuración → Zona de Peligro → Eliminar Cuenta. Esta acción es irreversible. Si tienes reservas activas, debes cancelarlas primero o contactarnos.' },
  { category: 'cuenta', q: '¿Cómo activo las notificaciones?', a: 'En la app: Mi Cuenta → Notificaciones. Puedes elegir qué notificaciones recibir (viajes, ofertas, actualizaciones). También asegúrate de tener los permisos activados en tu teléfono.' },

  // Pagos
  { category: 'pagos', q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos tarjetas de crédito y débito Visa, Mastercard y American Express a través de Datafast. También puedes pagar con DeUna (billetera digital ecuatoriana). Próximamente transferencia bancaria.' },
  { category: 'pagos', q: '¿Es seguro pagar en Going?', a: 'Sí. Todos los pagos están encriptados con SSL/TLS. No almacenamos datos de tu tarjeta. Los cobros los procesa Datafast, que cumple con estándares PCI-DSS.' },
  { category: 'pagos', q: '¿Puedo cancelar una reserva y recibir reembolso?', a: 'Sí, si cancelas con más de 2 horas de anticipación recibes reembolso completo. Cancelaciones con menos de 2 horas tienen un cargo del 20%. El reembolso llega en 3–5 días hábiles a tu tarjeta.' },
  { category: 'pagos', q: '¿Cómo veo mis compras y recibos?', a: 'En la app: Mi Cuenta → Mis Compras. Ahí encuentras el historial de todos tus viajes y servicios con su recibo descargable en PDF.' },
  { category: 'pagos', q: '¿Going cobra comisión?', a: 'Going cobra una comisión del 15% sobre el valor del servicio. Esta ya está incluida en el precio que ves al reservar — no hay cargos ocultos.' },

  // Seguridad
  { category: 'seguridad', q: '¿Cómo sé que el conductor es verificado?', a: 'Todos los conductores pasan por verificación de cédula, licencia, SOAT, matrícula y antecedentes penales. Verás el badge "Verificado ✓" en su perfil. También puedes ver sus calificaciones y reseñas de otros usuarios.' },
  { category: 'seguridad', q: '¿Qué hago si tengo una emergencia durante el viaje?', a: 'Usa el botón SOS dentro de la app activa. También puedes escribirnos al WhatsApp de emergencias. Siempre comparte tu ruta en tiempo real con un familiar desde la app.' },
  { category: 'seguridad', q: '¿Pueden ver mis datos personales los conductores?', a: 'Los conductores solo ven tu nombre y número de teléfono para coordinar el viaje. Nunca comparten ni almacenan tu información adicional. Ver nuestra Política de Privacidad para más detalles.' },
  { category: 'seguridad', q: '¿Cómo reporto un conductor o incidente?', a: 'Al finalizar el viaje puedes calificar y dejar un reporte. También puedes escribirnos directamente por WhatsApp. Todos los reportes son revisados por nuestro equipo en menos de 24 horas.' },

  // Técnico
  { category: 'tecnico', q: '¿La app no carga o está lenta. Qué hago?', a: 'Primero verifica tu conexión a internet. Si el problema persiste, cierra y vuelve a abrir la app. Si aún falla, desinstala y reinstala la última versión desde la tienda.' },
  { category: 'tecnico', q: '¿En qué versiones de iOS y Android funciona Going?', a: 'La app funciona en iOS 14 o superior y Android 8.0 (Oreo) o superior. Recomendamos tener siempre la última versión instalada.' },
  { category: 'tecnico', q: '¿Puedo usar Going desde el navegador web?', a: 'Sí, la versión web está disponible en going.com.ec. Tiene las mismas funciones que la app. Para mejor experiencia en móvil, recomendamos la app.' },
  { category: 'tecnico', q: '¿Cómo actualizo la app?', a: 'Ve al App Store o Google Play y busca "Going Ecuador". Si hay una actualización disponible aparecerá el botón "Actualizar". También puedes activar las actualizaciones automáticas en tu teléfono.' },
];

function AccordionItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-gray-900 text-sm pr-4">{q}</span>
        <svg
          className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 bg-white text-sm text-gray-600 leading-relaxed border-t border-gray-50">
          {a}
        </div>
      )}
    </div>
  );
}

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState('primeros-pasos');
  const [search, setSearch] = useState('');

  const filtered = FAQS.filter(f => {
    if (search.trim()) {
      const q = search.toLowerCase();
      return f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q);
    }
    return f.category === activeCategory;
  });

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="text-white py-14 px-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 70%, #ff4c4120 100%)' }}>
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-3">Centro de Ayuda</h1>
          <p className="text-gray-400 mb-6">Encuentra respuestas rápidas sobre Going</p>
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Busca una pregunta..."
            className="w-full px-5 py-3.5 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#ff4c41] text-sm"
          />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {!search.trim() && (
          /* Category tabs */
          <div className="flex flex-wrap gap-2 mb-8">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeCategory === cat.id
                    ? 'text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
                }`}
                style={activeCategory === cat.id ? { backgroundColor: '#ff4c41' } : {}}
              >
                <span>{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {search.trim() && (
          <p className="text-sm text-gray-500 mb-4">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "<strong>{search}</strong>"
          </p>
        )}

        <div className="space-y-2">
          {filtered.length > 0
            ? filtered.map((f, i) => <AccordionItem key={i} q={f.q} a={f.a} />)
            : (
              <div className="text-center py-16 text-gray-400">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-medium">No encontramos resultados para esa búsqueda.</p>
                <p className="text-sm mt-1">Prueba con otras palabras o contáctanos directamente.</p>
              </div>
            )
          }
        </div>

        {/* CTA */}
        <div className="mt-12 bg-white rounded-2xl border border-gray-100 p-8 text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-900 mb-2">¿No encontraste lo que buscabas?</h2>
          <p className="text-gray-500 text-sm mb-6">Nuestro equipo responde por WhatsApp en menos de 1 hora.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="https://wa.me/14705580432"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#25D366' }}
            >
              💬 Escribir por WhatsApp
            </Link>
            <Link
              href="https://wa.me/14705580432?text=SOS%20necesito%20ayuda%20urgente"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-sm border-2 border-red-200 text-red-600 hover:bg-red-50 transition-colors"
            >
              🚨 Emergencia SOS
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
