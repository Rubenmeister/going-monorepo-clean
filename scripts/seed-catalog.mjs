/**
 * Seed catalog data for tours, accommodations & experiences.
 * Usage: node scripts/seed-catalog.mjs
 */

const API = 'https://api-gateway-780842550857.us-central1.run.app';
const EMAIL = 'staging@going.test';
const PASS = 'Staging123!';

// Fake host UUID (valid v4) — used as hostId since services require UUID
const HOST_ID = '00000000-0000-4000-8000-000000000001';

async function login() {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const token = data.token ?? data.access_token ?? data.accessToken;
  if (!token) throw new Error(`No token in response: ${JSON.stringify(data)}`);
  console.log('✅ Logged in');
  return token;
}

async function post(token, path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    console.error(`  ❌ POST ${path} → ${res.status}:`, JSON.stringify(json).slice(0, 200));
    return null;
  }
  return json;
}

// ── Tours ───────────────────────────────────────────────────────────────────
const TOURS = [
  {
    hostId: HOST_ID,
    title: 'Tour Centro Histórico de Quito',
    description: 'Recorre las calles coloniales del Centro Histórico, Patrimonio de la Humanidad. Visita iglesias, plazas y museos con guía experto.',
    location: { address: 'Plaza de la Independencia', city: 'Quito', country: 'Ecuador', latitude: -0.2201641, longitude: -78.5123274 },
    price: { amount: 35, currency: 'USD' },
    durationHours: 4,
    maxGuests: 10,
    category: 'CULTURAL',
  },
  {
    hostId: HOST_ID,
    title: 'Aventura en el Volcán Cotopaxi',
    description: 'Trekking de alta montaña al refugio del Cotopaxi (4800 m). Incluye equipo, transporte y guía certificado.',
    location: { address: 'Parque Nacional Cotopaxi', city: 'Latacunga', country: 'Ecuador', latitude: -0.6829, longitude: -78.4360 },
    price: { amount: 85, currency: 'USD' },
    durationHours: 8,
    maxGuests: 8,
    category: 'ADVENTURE',
  },
  {
    hostId: HOST_ID,
    title: 'Ruta del Cacao y Chocolate',
    description: 'Explora las haciendas cacaoteras de Mindo y aprende el proceso artesanal del chocolate fino de aroma.',
    location: { address: 'Mindo Cloud Forest', city: 'Mindo', country: 'Ecuador', latitude: -0.0500, longitude: -78.7750 },
    price: { amount: 55, currency: 'USD' },
    durationHours: 6,
    maxGuests: 12,
    category: 'GASTRONOMY',
  },
  {
    hostId: HOST_ID,
    title: 'Tren de la Nariz del Diablo',
    description: 'El viaje en tren más emocionante de Ecuador: zig-zags sobre la montaña desde Alausí hasta Sibambe.',
    location: { address: 'Estación Alausí', city: 'Alausí', country: 'Ecuador', latitude: -2.1930, longitude: -78.8440 },
    price: { amount: 45, currency: 'USD' },
    durationHours: 5,
    maxGuests: 20,
    category: 'CULTURAL',
  },
  {
    hostId: HOST_ID,
    title: 'Observación de Colibríes en Tandayapa',
    description: 'El paraíso de los colibríes: más de 30 especies en la nublada andina de Tandayapa. Con guía ornitólogo.',
    location: { address: 'Reserva Tandayapa', city: 'Tandayapa', country: 'Ecuador', latitude: 0.0050, longitude: -78.6800 },
    price: { amount: 65, currency: 'USD' },
    durationHours: 7,
    maxGuests: 6,
    category: 'NATURE',
  },
];

// ── Accommodations ──────────────────────────────────────────────────────────
const ACCOMMODATIONS = [
  {
    hostId: HOST_ID,
    title: 'Casa Gangotena Boutique Hotel',
    description: 'Hotel boutique de lujo en pleno Centro Histórico de Quito. Restaurado mansión del siglo XX con vistas espectaculares a la Plaza San Francisco.',
    location: { address: 'Plaza San Francisco 7', city: 'Quito', country: 'Ecuador', latitude: -0.2229, longitude: -78.5160 },
    pricePerNight: { amount: 120, currency: 'USD' },
    capacity: 2,
    amenities: ['WiFi', 'Desayuno incluido', 'Spa', 'Restaurante', 'Concierge 24h'],
  },
  {
    hostId: HOST_ID,
    title: 'Mashpi Lodge — Bosque Nublado',
    description: 'Ecolodge de lujo en el bosque nublado de Mashpi. Todo incluido: excursiones, guías naturalistas y gastronomía de autor.',
    location: { address: 'Reserva Mashpi', city: 'Pacto', country: 'Ecuador', latitude: 0.1667, longitude: -78.8667 },
    pricePerNight: { amount: 280, currency: 'USD' },
    capacity: 2,
    amenities: ['Todo incluido', 'Guías naturalistas', 'Piscina', 'Spa', 'Observatorio'],
  },
  {
    hostId: HOST_ID,
    title: 'Hotel Patio Andaluz',
    description: 'Hotel Heritage en un edificio republicano del siglo XVIII en el corazón del Centro Histórico. Patios coloniales y gastronomía ecuatoriana.',
    location: { address: 'García Moreno 6-52', city: 'Quito', country: 'Ecuador', latitude: -0.2198, longitude: -78.5142 },
    pricePerNight: { amount: 95, currency: 'USD' },
    capacity: 2,
    amenities: ['WiFi', 'Desayuno', 'Restaurante', 'Bar', 'Lavandería'],
  },
  {
    hostId: HOST_ID,
    title: 'Hacienda Cusin — Otavalo',
    description: 'Hacienda colonial del siglo XVII a orillas de la Laguna San Pablo. Caballos, jardines históricos y cocina andina tradicional.',
    location: { address: 'Laguna San Pablo', city: 'Otavalo', country: 'Ecuador', latitude: 0.2167, longitude: -78.2667 },
    pricePerNight: { amount: 150, currency: 'USD' },
    capacity: 2,
    amenities: ['WiFi', 'Desayuno', 'Equitación', 'Jardines', 'Chimenea'],
  },
];

// ── Experiences ──────────────────────────────────────────────────────────────
const EXPERIENCES = [
  {
    hostId: HOST_ID,
    title: 'Kayak y Rafting en el Río Pastaza',
    description: 'Adrenalina pura en las aguas del Pastaza. Niveles II-IV aptos para principiantes y avanzados. Instructor certificado incluido.',
    location: { address: 'Orillas del Pastaza', city: 'Baños', country: 'Ecuador', latitude: -1.3964, longitude: -78.4230 },
    price: { amount: 45, currency: 'USD' },
    durationHours: 3,
  },
  {
    hostId: HOST_ID,
    title: 'Canopy y Zip-line en Mindo',
    description: 'Sobrevolá el bosque tropical en 8 cables de canopy hasta 300m. Vista panorámica de la biodiversidad de Mindo.',
    location: { address: 'Complejo Canopy Mindo', city: 'Mindo', country: 'Ecuador', latitude: -0.0500, longitude: -78.7750 },
    price: { amount: 30, currency: 'USD' },
    durationHours: 2,
  },
  {
    hostId: HOST_ID,
    title: 'Clase de Cocina Ecuatoriana',
    description: 'Aprende a preparar locro de papa, seco de pollo y tronco de Navidad con una chef experta. Degustación incluida.',
    location: { address: 'La Floresta', city: 'Quito', country: 'Ecuador', latitude: -0.2050, longitude: -78.4900 },
    price: { amount: 60, currency: 'USD' },
    durationHours: 4,
  },
  {
    hostId: HOST_ID,
    title: 'Parapente sobre Tungurahua',
    description: 'Despega desde Runtún y vuela sobre Baños con el Tungurahua de fondo. Tandem con piloto certificado FAI.',
    location: { address: 'Mirador Runtún', city: 'Baños', country: 'Ecuador', latitude: -1.3900, longitude: -78.4050 },
    price: { amount: 75, currency: 'USD' },
    durationHours: 1,
  },
  {
    hostId: HOST_ID,
    title: 'Sandboard en el Volcán Quilotoa',
    description: 'Deslízate por las laderas de arena volcánica del Quilotoa y luego tómate un bote en la laguna esmeralda.',
    location: { address: 'Laguna Quilotoa', city: 'Sigchos', country: 'Ecuador', latitude: -0.8625, longitude: -78.9000 },
    price: { amount: 40, currency: 'USD' },
    durationHours: 5,
  },
];

async function seed() {
  const token = await login();

  console.log('\n🎫 Creating tours…');
  for (const t of TOURS) {
    const res = await post(token, '/tours', t);
    if (res) console.log(`  ✅ ${t.title}`);
  }

  console.log('\n🏠 Creating accommodations…');
  for (const a of ACCOMMODATIONS) {
    const res = await post(token, '/accommodations', a);
    if (res) console.log(`  ✅ ${a.title}`);
  }

  console.log('\n🎭 Creating experiences…');
  for (const e of EXPERIENCES) {
    const res = await post(token, '/experiences', e);
    if (res) console.log(`  ✅ ${e.title}`);
  }

  console.log('\n✨ Seed complete!');
}

seed().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
