/**
 * Seed catalog data - goes directly to each service (no JWT needed).
 * Usage: node scripts/seed-catalog.mjs
 */

const BASE = 'https://{svc}-780842550857.us-central1.run.app';
const svcUrl = (svc) => BASE.replace('{svc}', svc);
const HOST_ID = '00000000-0000-4000-8000-000000000001';

async function post(svc, path, body) {
  const url = svcUrl(svc) + path;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    console.error('  FAIL ' + svc + path + ' -> ' + res.status + ':', JSON.stringify(json).slice(0, 200));
    return null;
  }
  return json;
}

const TOURS = [
  {
    hostId: HOST_ID, title: 'Tour Centro Historico Quito',
    description: 'Calles coloniales del Centro Historico Patrimonio UNESCO. Iglesias, plazas y museos con guia experto.',
    location: { address: 'Plaza de la Independencia', city: 'Quito', country: 'Ecuador', latitude: -0.2201641, longitude: -78.5123274 },
    price: { amount: 35, currency: 'USD' }, durationHours: 4, maxGuests: 10, category: 'CULTURAL',
  },
  {
    hostId: HOST_ID, title: 'Aventura Volcan Cotopaxi',
    description: 'Trekking de alta montana al refugio del Cotopaxi 4800m. Equipo, transporte y guia certificado incluidos.',
    location: { address: 'Parque Nacional Cotopaxi', city: 'Latacunga', country: 'Ecuador', latitude: -0.6829, longitude: -78.4360 },
    price: { amount: 85, currency: 'USD' }, durationHours: 8, maxGuests: 8, category: 'ADVENTURE',
  },
  {
    hostId: HOST_ID, title: 'Ruta del Cacao y Chocolate Mindo',
    description: 'Haciendas cacaoteras de Mindo y proceso artesanal del chocolate fino de aroma ecuatoriano.',
    location: { address: 'Mindo Cloud Forest', city: 'Mindo', country: 'Ecuador', latitude: -0.0500, longitude: -78.7750 },
    price: { amount: 55, currency: 'USD' }, durationHours: 6, maxGuests: 12, category: 'GASTRONOMY',
  },
  {
    hostId: HOST_ID, title: 'Tren de la Nariz del Diablo',
    description: 'El viaje en tren mas emocionante de Ecuador con zig-zags sobre la montana desde Alausi hasta Sibambe.',
    location: { address: 'Estacion Alausi', city: 'Alausi', country: 'Ecuador', latitude: -2.1930, longitude: -78.8440 },
    price: { amount: 45, currency: 'USD' }, durationHours: 5, maxGuests: 20, category: 'CULTURAL',
  },
  {
    hostId: HOST_ID, title: 'Colibries en Tandayapa',
    description: 'Mas de 30 especies de colibries en el bosque nublado andino de Tandayapa. Guia ornitologo incluido.',
    location: { address: 'Reserva Tandayapa', city: 'Tandayapa', country: 'Ecuador', latitude: 0.0050, longitude: -78.6800 },
    price: { amount: 65, currency: 'USD' }, durationHours: 7, maxGuests: 6, category: 'NATURE',
  },
];

const ACCOMMODATIONS = [
  {
    hostId: HOST_ID, title: 'Casa Gangotena Boutique Hotel',
    description: 'Hotel boutique de lujo en el Centro Historico de Quito. Mansion restaurada con vistas a la Plaza San Francisco.',
    location: { address: 'Plaza San Francisco 7', city: 'Quito', country: 'Ecuador', latitude: -0.2229, longitude: -78.5160 },
    pricePerNight: { amount: 120, currency: 'USD' }, capacity: 2, amenities: ['WiFi', 'Desayuno incluido', 'Spa', 'Restaurante'],
  },
  {
    hostId: HOST_ID, title: 'Mashpi Lodge Bosque Nublado',
    description: 'Ecolodge de lujo en el bosque nublado de Mashpi. Todo incluido con guias naturalistas y gastronomia de autor.',
    location: { address: 'Reserva Mashpi', city: 'Pacto', country: 'Ecuador', latitude: 0.1667, longitude: -78.8667 },
    pricePerNight: { amount: 280, currency: 'USD' }, capacity: 2, amenities: ['Todo incluido', 'Piscina', 'Spa', 'Observatorio'],
  },
  {
    hostId: HOST_ID, title: 'Hotel Patio Andaluz Quito',
    description: 'Hotel Heritage en edificio republicano del siglo XVIII en el corazon del Centro Historico.',
    location: { address: 'Garcia Moreno 6-52', city: 'Quito', country: 'Ecuador', latitude: -0.2198, longitude: -78.5142 },
    pricePerNight: { amount: 95, currency: 'USD' }, capacity: 2, amenities: ['WiFi', 'Desayuno', 'Restaurante', 'Bar'],
  },
  {
    hostId: HOST_ID, title: 'Hacienda Cusin Otavalo',
    description: 'Hacienda colonial del siglo XVII a orillas de la Laguna San Pablo. Caballos, jardines y cocina andina.',
    location: { address: 'Laguna San Pablo', city: 'Otavalo', country: 'Ecuador', latitude: 0.2167, longitude: -78.2667 },
    pricePerNight: { amount: 150, currency: 'USD' }, capacity: 2, amenities: ['WiFi', 'Desayuno', 'Equitacion', 'Jardines'],
  },
];

const EXPERIENCES = [
  {
    hostId: HOST_ID, title: 'Kayak y Rafting Rio Pastaza',
    description: 'Adrenalina pura en las aguas del Pastaza. Niveles II-IV aptos para principiantes y avanzados. Instructor certificado.',
    location: { address: 'Orillas del Pastaza', city: 'Banos', country: 'Ecuador', latitude: -1.3964, longitude: -78.4230 },
    price: { amount: 45, currency: 'USD' }, durationHours: 3,
  },
  {
    hostId: HOST_ID, title: 'Canopy y Zip-line Mindo',
    description: 'Sobrevola el bosque tropical en 8 cables de canopy hasta 300m con vista panoramica de Mindo.',
    location: { address: 'Complejo Canopy Mindo', city: 'Mindo', country: 'Ecuador', latitude: -0.0500, longitude: -78.7750 },
    price: { amount: 30, currency: 'USD' }, durationHours: 2,
  },
  {
    hostId: HOST_ID, title: 'Clase de Cocina Ecuatoriana',
    description: 'Aprende a preparar locro de papa, seco de pollo y mas con una chef experta. Degustacion incluida.',
    location: { address: 'La Floresta', city: 'Quito', country: 'Ecuador', latitude: -0.2050, longitude: -78.4900 },
    price: { amount: 60, currency: 'USD' }, durationHours: 4,
  },
  {
    hostId: HOST_ID, title: 'Parapente sobre Tungurahua',
    description: 'Despega desde Runtun y vuela sobre Banos con el Tungurahua de fondo. Tandem con piloto certificado FAI.',
    location: { address: 'Mirador Runtun', city: 'Banos', country: 'Ecuador', latitude: -1.3900, longitude: -78.4050 },
    price: { amount: 75, currency: 'USD' }, durationHours: 1,
  },
  {
    hostId: HOST_ID, title: 'Sandboard en el Quilotoa',
    description: 'Deslizate por las laderas volcanicas del Quilotoa y navega en bote por la laguna esmeralda.',
    location: { address: 'Laguna Quilotoa', city: 'Sigchos', country: 'Ecuador', latitude: -0.8625, longitude: -78.9000 },
    price: { amount: 40, currency: 'USD' }, durationHours: 5,
  },
];

async function seed() {
  console.log('\n Seeding tours -> tours-service...');
  for (const t of TOURS) {
    const r = await post('tours-service', '/tours', t);
    if (r) console.log('  OK: ' + t.title);
  }

  console.log('\n Seeding accommodations -> anfitriones-service...');
  for (const a of ACCOMMODATIONS) {
    const r = await post('anfitriones-service', '/accommodations', a);
    if (r) console.log('  OK: ' + a.title);
  }

  console.log('\n Seeding experiences -> experiencias-service...');
  for (const e of EXPERIENCES) {
    const r = await post('experiencias-service', '/experiences', e);
    if (r) console.log('  OK: ' + e.title);
  }

  console.log('\n Verifying counts...');
  const [tours, accs, exps] = await Promise.all([
    fetch(svcUrl('tours-service') + '/tours/search').then((r) => r.json()).catch(() => []),
    fetch(svcUrl('anfitriones-service') + '/accommodations/search').then((r) => r.json()).catch(() => []),
    fetch(svcUrl('experiencias-service') + '/experiences/search').then((r) => r.json()).catch(() => []),
  ]);
  console.log('  Tours:', Array.isArray(tours) ? tours.length : tours);
  console.log('  Accommodations:', Array.isArray(accs) ? accs.length : accs);
  console.log('  Experiences:', Array.isArray(exps) ? exps.length : exps);
  console.log('\n Done!');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
