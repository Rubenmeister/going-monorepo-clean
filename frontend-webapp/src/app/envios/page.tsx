'use client';

import Link from 'next/link';

export default function EnviosPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="relative py-24 px-4 text-white text-center" style={{ background: 'linear-gradient(135deg, #1e3a8a, #0f172a)' }}>
        <div className="max-w-3xl mx-auto">
          <span className="inline-block text-xs font-bold uppercase tracking-widest mb-4 px-3 py-1.5 rounded-full" style={{ backgroundColor: '#ff4c41' }}>Mismo día</span>
          <h1 className="font-black text-5xl mb-4">Envíos de Paquetes</h1>
          <p className="text-blue-200 text-xl mb-8 leading-relaxed">
            Envía sobres, documentos o paquetes a cualquier ciudad del Ecuador. Cotiza en segundos, rastrea en tiempo real, entrega garantizada.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/envios/cotizar" className="bg-white text-gray-900 font-black px-8 py-4 rounded-2xl text-lg hover:bg-gray-100 transition-all hover:scale-105">
              Cotizar ahora →
            </Link>
            <Link href="/auth/login" className="border-2 border-white text-white font-bold px-8 py-4 rounded-2xl text-lg hover:bg-white/10 transition-all">
              Ya tengo cuenta
            </Link>
          </div>
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-gray-900 font-black text-4xl mb-3">¿Cómo funciona?</h2>
            <p className="text-gray-500 text-lg">En 3 pasos tienes tu envío en camino</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', icon: '📦', title: 'Cotiza tu envío', desc: 'Ingresa origen, destino y tamaño del paquete. La app te muestra el precio al instante.' },
              { step: '02', icon: '🚗', title: 'Un conductor lo recoge', desc: 'Un conductor verificado recoge tu paquete en la dirección que indiques.' },
              { step: '03', icon: '📍', title: 'Entrega con tracking', desc: 'Sigue el envío en tiempo real. El destinatario recibe una foto de confirmación.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl mb-5" style={{ backgroundColor: '#1e3a8a' }}>
                  <span className="text-3xl">{item.icon}</span>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-black flex items-center justify-center">{item.step}</span>
                </div>
                <h3 className="font-black text-xl text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tipos de envío */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-gray-900 font-black text-4xl text-center mb-12">¿Qué puedes enviar?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: '📄', title: 'Documentos y sobres', desc: 'Contratos, facturas, cartas y cualquier tipo de documento importante.', price: 'Desde $3' },
              { icon: '📦', title: 'Paquetes pequeños', desc: 'Ropa, electrónicos, regalos y artículos que quepan en una maleta de mano.', price: 'Desde $5' },
              { icon: '🛍️', title: 'Paquetes medianos', desc: 'Cajas hasta 20kg para envíos entre ciudades el mismo día.', price: 'Desde $8' },
            ].map((type) => (
              <div key={type.title} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 text-center">
                <span className="text-5xl mb-4 block">{type.icon}</span>
                <h3 className="font-black text-gray-900 text-xl mb-2">{type.title}</h3>
                <p className="text-gray-500 text-sm mb-4 leading-relaxed">{type.desc}</p>
                <span className="font-black text-2xl" style={{ color: '#ff4c41' }}>{type.price}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ventajas */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-gray-900 font-black text-4xl text-center mb-12">¿Por qué enviar con Going?</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: '⚡', text: 'Entrega mismo día' },
              { icon: '📡', text: 'Tracking en vivo' },
              { icon: '🛡️', text: 'Seguro incluido' },
              { icon: '💰', text: 'Precio sin sorpresas' },
              { icon: '📸', text: 'Foto de confirmación' },
              { icon: '🔔', text: 'Notificación al receptor' },
              { icon: '⭐', text: 'Conductores verificados' },
              { icon: '📲', text: 'Cotiza desde la app' },
            ].map((v) => (
              <div key={v.text} className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 border border-gray-100">
                <span className="text-2xl">{v.icon}</span>
                <span className="text-gray-700 text-sm font-medium">{v.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 text-center" style={{ background: 'linear-gradient(135deg, #1e3a8a, #0f172a)' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-white font-black text-4xl mb-4">¿Listo para enviar?</h2>
          <p className="text-blue-200 text-lg mb-8">Regístrate gratis y cotiza tu primer envío en segundos.</p>
          <Link href="/envios/cotizar" className="inline-flex items-center gap-2 bg-white text-gray-900 font-black px-10 py-4 rounded-2xl text-lg hover:bg-gray-100 transition-all hover:scale-105">
            Cotizar ahora →
          </Link>
        </div>
      </section>
    </div>
  );
}
