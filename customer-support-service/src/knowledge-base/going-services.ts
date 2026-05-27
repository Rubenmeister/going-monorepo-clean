/**
 * GOING Services Knowledge Base
 * Fuente de verdad para los agentes de Going (chat soporte + voice phone agent).
 *
 * Política: SOLO afirmar lo que es verdad operativa hoy. Productos en
 * desarrollo (turismo, tours, alojamiento) NO deben anunciarse como activos.
 * Para precios: SIEMPRE delegar a la función get_quote / get_quote_phone.
 * NUNCA mostrar tarifas estáticas en respuestas al usuario.
 */
export const GOING_SERVICES_KB = {
  summary_es: 'Going es la app de movilidad del Ecuador: viajes dentro de la ciudad, viajes compartidos y privados entre ciudades, y envío de paquetes puerta a puerta. Conductoras y conductores verificados, tracking en vivo y precio fijo antes de viajar.',
  summary_en: 'Going is Ecuador\'s mobility app: rides within the city, shared and private rides between cities, and door-to-door parcel delivery. Verified drivers, live tracking, and fixed prices before the trip.',

  // Productos ACTIVOS hoy (los que el agente puede ofrecer)
  services_es: [
    'Viaje Compartido: Comparte un SUV o VAN entre ciudades con otras personas que van a la misma ruta — pagas solo tu asiento',
    'Viaje Privado: Auto, SUV, VAN, Minibús o Bus exclusivo para ti y tu grupo, dentro o entre ciudades (de 1 a 30 personas)',
    'Envíos: Envío de sobres, documentos y paquetes puerta a puerta, dentro de la ciudad o entre ciudades',
    'Transporte Corporativo: Servicio para empresas con facturación consolidada, política y reportes',
  ],

  services_en: [
    'Shared Ride: Share a SUV or VAN with other passengers on the same intercity route — pay only your seat',
    'Private Ride: Auto, SUV, VAN, Minibus or Bus exclusive for you and your group, within or between cities (1 to 30 people)',
    'Parcel Delivery: Door-to-door delivery of envelopes, documents and packages, within the city or between cities',
    'Corporate Transport: Business service with consolidated invoicing, policy and reports',
  ],

  // Productos en desarrollo — NO ofrecer como disponibles
  services_coming_soon_es: [
    'Tours y Experiencias',
    'Alojamiento',
  ],

  payments_es: [
    'Tarjeta de crédito o débito en la app',
    'Datafast (pago seguro Ecuador)',
    'DeUna (pago instantáneo Ecuador)',
    'Precio fijo antes del viaje — sin sorpresas',
    // Going opera sin efectivo: el cobro siempre va por la app.
  ],

  safety_es: [
    'Todas las conductoras y conductores Going tienen documentación verificada (licencia profesional, matrícula, antecedentes)',
    'Tracking GPS en tiempo real, compartible con familia y soporte',
    'Calificación de conductoras/conductores por pasajeras/pasajeros anteriores',
    'Botón de emergencia SOS en la app — conecta directo con operador',
    'Soporte 24/7 humano + IA dentro de la app',
  ],

  faq_es: [
    { q: '¿Cómo reservo un viaje?', a: 'Descarga la app Going desde Google Play, crea tu cuenta, escribe origen y destino y elige Compartido o Privado. También puedes reservar desde app.goingec.com.' },
    { q: '¿Puedo cancelar?', a: 'Sí. Las políticas de cancelación dependen del tipo de viaje y de cuánto falta para la salida. Te las muestra la app antes de confirmar.' },
    { q: '¿Qué pasa si el conductor no llega?', a: 'Contáctanos por la app o por WhatsApp. Te asignamos otro vehículo o procesamos el reembolso si corresponde.' },
    { q: '¿Aceptan mascotas?', a: 'Algunas conductoras y conductores aceptan mascotas pequeñas en transportadora. Indícalo al reservar y te asignamos un vehículo compatible.' },
    { q: '¿Pagan en efectivo?', a: 'No. Going opera sin efectivo: pagas con tarjeta, Datafast o DeUna dentro de la app. Esto da seguridad a pasajeras, pasajeros y conductoras/conductores.' },
    { q: '¿Tienen servicio a Galápagos?', a: 'Going opera por carretera en Ecuador continental. Para Galápagos te recomendamos coordinar con la aerolínea y el operador local de las islas.' },
  ],

  // ── Rutas activas de GOING ────────────────────────────────────────────────
  routes: [
    {
      id: 'ruta1',
      name: 'Quito ↔ Santo Domingo ↔ El Carmen / La Concordia',
      stops: ['Aeropuerto Quito (Tababela)', 'Quito', 'Santo Domingo', 'El Carmen', 'La Concordia'],
    },
    {
      id: 'ruta2',
      name: 'Ambato ↔ Latacunga ↔ Salcedo ↔ Quito ↔ Aeropuerto',
      stops: ['Ambato', 'Latacunga', 'Salcedo', 'Quito', 'Aeropuerto Quito (Tababela)'],
    },
    {
      id: 'ruta3',
      name: 'Quito ↔ Otavalo ↔ Ibarra',
      stops: ['Aeropuerto Quito (Tababela)', 'Quito', 'Tabacundo', 'Cayambe', 'Otavalo', 'Atuntaqui', 'Ibarra'],
    },
  ],

  coverage_cities: [
    'Quito', 'Aeropuerto Quito', 'Aeropuerto Tababela',
    'Santo Domingo', 'El Carmen', 'La Concordia',
    'Ambato', 'Latacunga', 'Salcedo',
    'Otavalo', 'Ibarra', 'Atuntaqui', 'Tabacundo', 'Cayambe',
  ],

  // Ciudades próximamente — el bot informa que aún no hay servicio
  coming_soon_cities: [
    // Sierra Norte (extensión Ibarra → Tulcán)
    'Pimampiro', 'Mira', 'El Ángel', 'Bolívar', 'San Gabriel',
    'Huaca', 'Tulcán', 'Carchi',
    // Sierra Centro (extensión Ambato → Riobamba)
    'Mocha', 'Tisaleo', 'Cevallos', 'Píllaro', 'Baños',
    'Riobamba', 'Guano', 'Penipe', 'Chambo',
    // Cercanas a rutas pero fuera del camino principal
    'Sigchos', 'Saquisilí', 'Pujilí', 'Pangua',
    'Pedro Vicente Maldonado', 'Puerto Quito',
    // Sierra Sur y Costa
    'Cuenca', 'Loja', 'Azogues', 'Cañar',
    'Guayaquil', 'Manta', 'Esmeraldas', 'Portoviejo', 'Machala',
    // Amazonía
    'Tena', 'Puyo', 'Macas', 'Lago Agrio', 'Coca',
  ],

  /**
   * TABLA DE PRECIOS — Referencia completa para la IA de atención al cliente
   * Compartido = precio por pasajero | Privado = vehículo completo
   * Recargo +$5 cuando el PICKUP es: Quito Sur, Cumbayá/Tumbaco, Los Chillos, Aeropuerto Tababela
   */
  pricing: {
    nota_compartido: 'Precio por pasajero. SUV (hasta 4 pax) y SUV XL (hasta 5 pax) tienen el mismo precio compartido.',
    nota_privado: 'Precio por vehículo completo. Factores: SUV ×1.0 · SUV XL ×1.4 · VAN ×2.0 · VAN XL ×3.0 · Minibús ×5.0 · Bus ×10.0',
    nota_recargo: '+$5 en todos los precios cuando el origen es: Quito Sur, Cumbayá/Tumbaco, Los Chillos o Aeropuerto Tababela.',
    nota_premium: 'Premium SUV = Privado SUV + $10. Mayor confort, conductor seleccionado.',
    nota_empresas: 'Transporte corporativo = +30% sobre tarifa privada Confort.',

    // ── RUTA NORTE: Quito ↔ Ibarra / Otavalo / Cayambe ────────────────────
    ruta_norte: [
      // { ruta, comp_suv, comp_suvxl, priv_suv, priv_suvxl, priv_van, priv_vanxl, priv_minibus, priv_bus, prem_suv, nota? }
      { ruta: 'Quito CN → Guayllabamba',                    comp_suv: 10, comp_suvxl: 10, priv_suv: 20,  priv_suvxl: 30,  priv_van: 50,  priv_vanxl: 70,  priv_minibus: 120, priv_bus: 240, prem_suv: 30  },
      { ruta: 'Quito CN → Cayambe',                         comp_suv: 10, comp_suvxl: 10, priv_suv: 30,  priv_suvxl: 40,  priv_van: 60,  priv_vanxl: 80,  priv_minibus: 140, priv_bus: 280, prem_suv: 40  },
      { ruta: 'Quito CN → Tabacundo',                       comp_suv: 10, comp_suvxl: 10, priv_suv: 30,  priv_suvxl: 40,  priv_van: 60,  priv_vanxl: 100, priv_minibus: 160, priv_bus: 320, prem_suv: 40  },
      { ruta: 'Quito CN → El Quinche',                      comp_suv: 10, comp_suvxl: 10, priv_suv: 30,  priv_suvxl: 40,  priv_van: 60,  priv_vanxl: 80,  priv_minibus: 140, priv_bus: 280, prem_suv: 40  },
      { ruta: 'Quito CN → Otavalo / Peguche',               comp_suv: 15, comp_suvxl: 15, priv_suv: 40,  priv_suvxl: 60,  priv_van: 90,  priv_vanxl: 130, priv_minibus: 200, priv_bus: 300, prem_suv: 50  },
      { ruta: 'Quito CN → Atuntaqui',                       comp_suv: 11, comp_suvxl: 11, priv_suv: 50,  priv_suvxl: 60,  priv_van: 90,  priv_vanxl: 130, priv_minibus: 200, priv_bus: 300, prem_suv: 60  },
      { ruta: 'Quito CN → Ibarra',                          comp_suv: 11, comp_suvxl: 11, priv_suv: 50,  priv_suvxl: 60,  priv_van: 90,  priv_vanxl: 130, priv_minibus: 200, priv_bus: 300, prem_suv: 60  },
      { ruta: 'Quito CN → Cotacachi',                       comp_suv: 11, comp_suvxl: 11, priv_suv: 50,  priv_suvxl: 60,  priv_van: 90,  priv_vanxl: 130, priv_minibus: 200, priv_bus: 300, prem_suv: 60  },
      { ruta: 'Quito CN → Tulcán',                          comp_suv: 24, comp_suvxl: 24, priv_suv: 100, priv_suvxl: 130, priv_van: 190, priv_vanxl: 290, priv_minibus: 300, priv_bus: 350, prem_suv: 110 },
      { ruta: 'Aeropuerto → Quito CN',                      comp_suv: 10, comp_suvxl: 10, priv_suv: 20,  priv_suvxl: 25,  priv_van: 60,  priv_vanxl: 70,  priv_minibus: 120, priv_bus: 200, prem_suv: 40,  nota: 'Precio fijo especial' },
      { ruta: 'Quito CN → Aeropuerto',                      comp_suv: 10, comp_suvxl: 10, priv_suv: 25,  priv_suvxl: 25,  priv_van: 50,  priv_vanxl: 75,  priv_minibus: 125, priv_bus: 250, prem_suv: 30,  nota: 'Precio fijo especial' },
      { ruta: 'Aeropuerto → Cayambe',                       comp_suv: 14, comp_suvxl: 14, priv_suv: 45,  priv_suvxl: 55,  priv_van: 75,  priv_vanxl: 115, priv_minibus: 185, priv_bus: 365, prem_suv: 55,  nota: '+$5 recargo origen' },
      { ruta: 'Aeropuerto → Otavalo / Atuntaqui / Ibarra',  comp_suv: 19, comp_suvxl: 19, priv_suv: 65,  priv_suvxl: 80,  priv_van: 120, priv_vanxl: 150, priv_minibus: 200, priv_bus: 250, prem_suv: 75,  nota: '+$5 recargo origen' },
      { ruta: 'Ibarra ↔ Otavalo',                           comp_suv: 5,  comp_suvxl: 5,  priv_suv: 20,  priv_suvxl: 30,  priv_van: 40,  priv_vanxl: 60,  priv_minibus: 100, priv_bus: 200, prem_suv: 30  },
      { ruta: 'Quito Sur → Ibarra / Otavalo / Atuntaqui',   comp_suv: 19, comp_suvxl: 19, priv_suv: 65,  priv_suvxl: 85,  priv_van: 120, priv_vanxl: 175, priv_minibus: 285, priv_bus: 565, prem_suv: 75,  nota: '+$5 recargo origen' },
      { ruta: 'Cumbayá/Tumbaco → Atuntaqui',                comp_suv: 24, comp_suvxl: 24, priv_suv: 85,  priv_suvxl: 115, priv_van: 155, priv_vanxl: 235, priv_minibus: 385, priv_bus: 765, prem_suv: 95,  nota: '+$5 recargo origen' },
    ],

    // ── RUTA SIERRA CENTRO: Quito ↔ Ambato / Latacunga / Riobamba ─────────
    ruta_sierra_centro: [
      { ruta: 'Quito CN → Tambillo',      comp_suv: 8,  comp_suvxl: 8,  priv_suv: 30,  priv_suvxl: 40,  priv_van: 60,  priv_vanxl: 100, priv_minibus: 160, priv_bus: 250, prem_suv: 40  },
      { ruta: 'Quito CN → Machachi',      comp_suv: 9,  comp_suvxl: 9,  priv_suv: 40,  priv_suvxl: 50,  priv_van: 70,  priv_vanxl: 110, priv_minibus: 180, priv_bus: 250, prem_suv: 50  },
      { ruta: 'Quito CN → Latacunga',     comp_suv: 13, comp_suvxl: 13, priv_suv: 50,  priv_suvxl: 70,  priv_van: 100, priv_vanxl: 160, priv_minibus: 260, priv_bus: 350, prem_suv: 60  },
      { ruta: 'Quito CN → Salcedo',       comp_suv: 10, comp_suvxl: 10, priv_suv: 40,  priv_suvxl: 60,  priv_van: 80,  priv_vanxl: 120, priv_minibus: 200, priv_bus: 350, prem_suv: 50  },
      { ruta: 'Quito CN → Píllaro',       comp_suv: 11, comp_suvxl: 11, priv_suv: 40,  priv_suvxl: 60,  priv_van: 90,  priv_vanxl: 130, priv_minibus: 220, priv_bus: 350, prem_suv: 50  },
      { ruta: 'Quito CN → Ambato',        comp_suv: 15, comp_suvxl: 15, priv_suv: 60,  priv_suvxl: 80,  priv_van: 120, priv_vanxl: 180, priv_minibus: 300, priv_bus: 350, prem_suv: 70  },
      { ruta: 'Quito CN → Baños',         comp_suv: 17, comp_suvxl: 17, priv_suv: 70,  priv_suvxl: 100, priv_van: 140, priv_vanxl: 200, priv_minibus: 340, priv_bus: 350, prem_suv: 80  },
      { ruta: 'Quito CN → Riobamba',      comp_suv: 20, comp_suvxl: 20, priv_suv: 80,  priv_suvxl: 110, priv_van: 160, priv_vanxl: 240, priv_minibus: 400, priv_bus: 500, prem_suv: 90  },
      { ruta: 'Quito CN → Guaranda',      comp_suv: 24, comp_suvxl: 24, priv_suv: 100, priv_suvxl: 130, priv_van: 190, priv_vanxl: 290, priv_minibus: 480, priv_bus: 500, prem_suv: 110 },
      { ruta: 'Aeropuerto → Latacunga',   comp_suv: 20, comp_suvxl: 20, priv_suv: 65,  priv_suvxl: 85,  priv_van: 125, priv_vanxl: 185, priv_minibus: 305, priv_bus: 500, prem_suv: 75,  nota: '+$5 recargo origen' },
      { ruta: 'Aeropuerto → Ambato',      comp_suv: 23, comp_suvxl: 23, priv_suv: 75,  priv_suvxl: 105, priv_van: 145, priv_vanxl: 225, priv_minibus: 365, priv_bus: 500, prem_suv: 85,  nota: '+$5 recargo origen' },
      { ruta: 'Aeropuerto → Baños',       comp_suv: 23, comp_suvxl: 23, priv_suv: 75,  priv_suvxl: 105, priv_van: 145, priv_vanxl: 225, priv_minibus: 365, priv_bus: 500, prem_suv: 85,  nota: '+$5 recargo origen' },
      { ruta: 'Aeropuerto → Riobamba',    comp_suv: 28, comp_suvxl: 28, priv_suv: 95,  priv_suvxl: 135, priv_van: 185, priv_vanxl: 285, priv_minibus: 465, priv_bus: 500, prem_suv: 105, nota: '+$5 recargo origen' },
      { ruta: 'Quito Sur → Latacunga',    comp_suv: 15, comp_suvxl: 15, priv_suv: 45,  priv_suvxl: 65,  priv_van: 85,  priv_vanxl: 125, priv_minibus: 205, priv_bus: 250, prem_suv: 55,  nota: '+$5 recargo origen' },
      { ruta: 'Quito Sur → Ambato',       comp_suv: 18, comp_suvxl: 18, priv_suv: 55,  priv_suvxl: 75,  priv_van: 105, priv_vanxl: 165, priv_minibus: 265, priv_bus: 250, prem_suv: 65,  nota: '+$5 recargo origen' },
      { ruta: 'Quito Sur → Riobamba',     comp_suv: 23, comp_suvxl: 23, priv_suv: 75,  priv_suvxl: 105, priv_van: 145, priv_vanxl: 225, priv_minibus: 365, priv_bus: 300, prem_suv: 85,  nota: '+$5 recargo origen' },
      { ruta: 'Latacunga ↔ Salcedo',      comp_suv: 3,  comp_suvxl: 3,  priv_suv: 10,  priv_suvxl: 20,  priv_van: 20,  priv_vanxl: 40,  priv_minibus: 60,  priv_bus: 120, prem_suv: 20  },
      { ruta: 'Latacunga ↔ Ambato',       comp_suv: 5,  comp_suvxl: 5,  priv_suv: 20,  priv_suvxl: 30,  priv_van: 40,  priv_vanxl: 60,  priv_minibus: 100, priv_bus: 200, prem_suv: 30  },
      { ruta: 'Ambato ↔ Baños',           comp_suv: 5,  comp_suvxl: 5,  priv_suv: 20,  priv_suvxl: 30,  priv_van: 40,  priv_vanxl: 60,  priv_minibus: 100, priv_bus: 200, prem_suv: 30  },
      { ruta: 'Ambato ↔ Riobamba',        comp_suv: 7,  comp_suvxl: 7,  priv_suv: 30,  priv_suvxl: 40,  priv_van: 60,  priv_vanxl: 80,  priv_minibus: 100, priv_bus: 150, prem_suv: 40  },
      { ruta: 'Baños ↔ Riobamba',         comp_suv: 10, comp_suvxl: 10, priv_suv: 40,  priv_suvxl: 60,  priv_van: 80,  priv_vanxl: 120, priv_minibus: 150, priv_bus: 200, prem_suv: 50  },
    ],

    // ── RUTA SANTO DOMINGO / EL CARMEN: Quito ↔ Costa Noroeste ────────────
    ruta_sto_domingo: [
      { ruta: 'Quito CN → Santo Domingo',      comp_suv: 14, comp_suvxl: 14, priv_suv: 60,  priv_suvxl: 80,  priv_van: 110, priv_vanxl: 170, priv_minibus: 250, priv_bus: 350, prem_suv: 70  },
      { ruta: 'Quito CN → La Concordia',       comp_suv: 17, comp_suvxl: 17, priv_suv: 70,  priv_suvxl: 100, priv_van: 140, priv_vanxl: 200, priv_minibus: 250, priv_bus: 350, prem_suv: 80  },
      { ruta: 'Quito CN → El Carmen',          comp_suv: 20, comp_suvxl: 20, priv_suv: 80,  priv_suvxl: 110, priv_van: 160, priv_vanxl: 240, priv_minibus: 250, priv_bus: 350, prem_suv: 90  },
      { ruta: 'Aeropuerto → Santo Domingo',    comp_suv: 22, comp_suvxl: 22, priv_suv: 75,  priv_suvxl: 105, priv_van: 145, priv_vanxl: 205, priv_minibus: 250, priv_bus: 350, prem_suv: 85,  nota: '+$5 recargo origen' },
      { ruta: 'Aeropuerto → La Concordia',     comp_suv: 25, comp_suvxl: 25, priv_suv: 85,  priv_suvxl: 115, priv_van: 165, priv_vanxl: 245, priv_minibus: 250, priv_bus: 350, prem_suv: 95,  nota: '+$5 recargo origen' },
      { ruta: 'Aeropuerto → El Carmen',        comp_suv: 27, comp_suvxl: 27, priv_suv: 95,  priv_suvxl: 125, priv_van: 185, priv_vanxl: 265, priv_minibus: 250, priv_bus: 350, prem_suv: 105, nota: '+$5 recargo origen' },
      { ruta: 'Quito Sur → El Carmen',         comp_suv: 23, comp_suvxl: 23, priv_suv: 75,  priv_suvxl: 105, priv_van: 145, priv_vanxl: 225, priv_minibus: 250, priv_bus: 350, prem_suv: 85,  nota: '+$5 recargo origen' },
      { ruta: 'Santo Domingo ↔ La Concordia',  comp_suv: 8,  comp_suvxl: 8,  priv_suv: 30,  priv_suvxl: 40,  priv_van: 60,  priv_vanxl: 70,  priv_minibus: 100, priv_bus: 150, prem_suv: 40  },
      { ruta: 'La Concordia ↔ El Carmen',      comp_suv: 7,  comp_suvxl: 7,  priv_suv: 30,  priv_suvxl: 40,  priv_van: 60,  priv_vanxl: 70,  priv_minibus: 100, priv_bus: 150, prem_suv: 40  },
      { ruta: 'El Carmen ↔ Santo Domingo',     comp_suv: 8,  comp_suvxl: 8,  priv_suv: 30,  priv_suvxl: 40,  priv_van: 60,  priv_vanxl: 70,  priv_minibus: 100, priv_bus: 150, prem_suv: 40  },
    ],
  },

  contact: {
    // Línea operativa Going (NO usar el teléfono personal del fundador en
    // ninguna respuesta — esto es para Going, no para Thorn AI).
    whatsapp: '+593 98 403 7949',
    email: 'soporte@goingec.com',
    website: 'https://app.goingec.com',
    business_website: 'https://empresas.goingec.com',
    app_ios: null, // pendiente de Apple Developer account
    app_android: 'https://play.google.com/store/apps/details?id=com.thornai.goingmobile',
    privacy: 'privacidad@goingec.com',
  },

  /**
   * Identidad del agente — usado por system prompts.
   * Going es ecuatoriana: usar tú (no vos, no usted).
   * Lenguaje claro, cálido, sin tecnicismos como "carpooling".
   */
  agent_identity: {
    name_male_es:   'Carlos',
    name_female_es: 'Sofía',
    name_male_en:   'James',
    name_female_en: 'Sarah',
    name_phone:     'Uyari', // agente telefónico
    register_es:    'español ecuatoriano (tú, no vos). Cálido, directo, sin "vosotros" ni "che".',
    register_en:    'natural English, friendly and concise.',
    /** Frase de marca — repetir solo cuando corresponde, no en cada respuesta. */
    tagline_es:     'Nos movemos contigo.',
  },
};
