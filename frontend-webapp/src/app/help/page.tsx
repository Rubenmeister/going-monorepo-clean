'use client';

export default function HelpPage() {
  const faqs = [
    { q: '¿Cómo realizo una reserva?', a: 'Completa el formulario de búsqueda y sigue los pasos para confirmar tu reserva.' },
    { q: '¿Qué métodos de pago aceptan?', a: 'Aceptamos tarjetas de crédito, transferencias bancarias y billeteras digitales.' },
    { q: '¿Puedo cancelar mi reserva?', a: 'Sí, puedes cancelar con hasta 24 horas de anticipación.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold text-gray-900 mb-8">Centro de Ayuda</h1>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q} className="bg-white rounded-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{faq.q}</h3>
              <p className="text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
