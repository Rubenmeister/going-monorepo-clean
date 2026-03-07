import React from 'react';
import Link from 'next/link';

type Service = {
  icon: string;
  name: string;
  desc: string;
  features: string[];
  photo: string;
  color: string;
  href: string;
};

const SERVICES = [
  {
    icon: '🚗',
    name: 'Transporte',
    desc: 'Viaja cómodo y seguro a cualquier destino. Conductores verificados, tarifas transparentes y seguimiento en tiempo real.',
    features: [
      'Conductores verificados',
      'Precios transparentes',
      'Seguimiento GPS en tiempo real',
      'Disponible 24/7',
    ],
    photo:
      'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&q=80&auto=format',
    color: '#ff4c41',
    href: '/services/transport',
  },
  {
    icon: '🏨',
    name: 'Alojamiento',
    desc: 'Hospedaje verificado en las mejores ubicaciones. Desde hostales económicos hasta hoteles boutique de lujo.',
    features: [
      'Anfitriones verificados',
      'Reserva flexible',
      'Mejores tarifas garantizadas',
      'Fotos reales del espacio',
    ],
    photo:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&q=80&auto=format',
    color: '#10B981',
    href: '/services/accommodation',
  },
  {
    icon: '🗺️',
    name: 'Tours',
    desc: 'Descubre Ecuador con guías locales expertos. Aventura, cultura, naturaleza e historia en cada recorrido.',
    features: [
      'Guías locales certificados',
      'Itinerarios personalizados',
      'Tours grupales e individuales',
      'Equipamiento incluido',
    ],
    photo:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=600&q=80&auto=format',
    color: '#3B82F6',
    href: '/services/tours',
  },
  {
    icon: '🎭',
    name: 'Experiencias',
    desc: 'Gastronomía ecuatoriana, aventura extrema, artesanía local, surf, senderismo. Crea recuerdos únicos.',
    features: [
      'Experiencias verificadas',
      'Anfitriones expertos',
      'Reseñas reales',
      'Grupos pequeños',
    ],
    photo:
      'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=600&q=80&auto=format',
    color: '#F59E0B',
    href: '/services/experiences',
  },
  {
    icon: '📦',
    name: 'Envíos',
    desc: 'Envía tus paquetes de forma rápida y segura a cualquier rincón del país. Seguimiento en tiempo real.',
    features: [
      'Entrega el mismo día',
      'Seguimiento en vivo',
      'Seguro de paquetes',
      'Cobertura nacional',
    ],
    photo:
      'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&q=80&auto=format',
    color: '#8B5CF6',
    href: '/services',
  },
  {
    icon: '💳',
    name: 'Pagos Seguros',
    desc: 'Múltiples métodos de pago aceptados. Todas las transacciones protegidas y facturación electrónica.',
    features: [
      'Múltiples métodos de pago',
      'Transferencias instantáneas',
      'Protección al comprador',
      'Facturación electrónica',
    ],
    photo:
      'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80&auto=format',
    color: '#EC4899',
    href: '/services',
  },
];

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section
        className="relative py-20 px-4 text-white text-center overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #ff4c41 0%, #e63a2f 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full bg-white opacity-5 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-white opacity-5 translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-5xl font-bold mb-4">Nuestros Servicios</h1>
          <p className="text-xl text-white/85">
            Todo lo que necesitas para moverte, alojarte y explorar Ecuador en
            un solo lugar.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICES.map((service: Service) => (
            <div
              key={service.name}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 group"
            >
              {/* Photo */}
              <div className="relative h-44 overflow-hidden">
                <img
                  src={service.photo}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                />
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background: `linear-gradient(to top, ${service.color}, transparent)`,
                  }}
                />
                <div className="absolute bottom-3 left-4 text-3xl">
                  {service.icon}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {service.name}
                </h3>
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                  {service.desc}
                </p>

                <ul className="space-y-2 mb-6">
                  {service.features.map((feature) => (
                    <li
                      key={feature}
                      className="text-sm text-gray-600 flex items-center gap-2"
                    >
                      <span className="font-bold" style={{ color: '#ff4c41' }}>
                        ✓
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={service.href}
                  className="block w-full py-2.5 text-white rounded-xl font-semibold text-sm transition-all hover:shadow-md text-center"
                  style={{ backgroundColor: '#ff4c41' }}
                >
                  Ver {service.name}
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-red-50 border-t border-red-100 py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            ¿Listo para comenzar?
          </h2>
          <p className="text-gray-500 mb-8 text-lg">
            Descarga la app Going y accede a todos nuestros servicios desde tu
            teléfono.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/auth/register"
              className="px-8 py-3.5 text-white font-bold rounded-xl transition-all hover:shadow-md text-sm"
              style={{ backgroundColor: '#ff4c41' }}
            >
              Crear cuenta gratis
            </Link>
            <Link
              href="/"
              className="px-8 py-3.5 border-2 font-bold rounded-xl transition-all text-sm"
              style={{ borderColor: '#ff4c41', color: '#ff4c41' }}
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
