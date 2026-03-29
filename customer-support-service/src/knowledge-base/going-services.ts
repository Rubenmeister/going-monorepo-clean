/**
 * GOING Services Knowledge Base
 * Fuente de verdad para el agente de atención al cliente
 */
export const GOING_SERVICES_KB = {
  summary_es: 'GOING es la plataforma ecuatoriana de transporte interurbano y turismo. Conecta pasajeros con conductores verificados para viajes compartidos, privados, y ofrece paquetes de tours y alojamiento en todo el Ecuador.',
  summary_en: 'GOING is Ecuador\'s intercity transportation and tourism platform. It connects passengers with verified drivers for shared and private rides, and offers tour packages and accommodation throughout Ecuador.',

  services_es: [
    'Viaje Compartido (Carpooling): Comparte el viaje con otros pasajeros en la misma ruta — más económico',
    'Viaje Privado: Vehículo exclusivo para ti y tu grupo — más rápido y cómodo',
    'Paquetes Turísticos: Tours organizados a destinos populares del Ecuador',
    'Alojamiento: Reserva de hospedaje en destinos turísticos',
    'Envíos: Envío de paquetes y encomiendas entre ciudades',
    'Transporte Corporativo: Servicio para empresas con facturación y reportes',
  ],

  services_en: [
    'Shared Ride (Carpooling): Share the trip with other passengers on the same route — more affordable',
    'Private Ride: Exclusive vehicle for you and your group — faster and more comfortable',
    'Tour Packages: Organized tours to popular destinations in Ecuador',
    'Accommodation: Hotel and lodging bookings at tourist destinations',
    'Parcel Delivery: Sending packages and parcels between cities',
    'Corporate Transport: Business service with invoicing and reports',
  ],

  payments_es: [
    'Pago en efectivo al conductor',
    'Tarjeta de crédito/débito en la app',
    'Transferencia bancaria',
    'Precio fijo antes del viaje — sin sorpresas',
  ],

  safety_es: [
    'Todos los conductores tienen licencia profesional verificada',
    'Seguro de viajero incluido en cada trayecto',
    'Rastreo GPS en tiempo real compartible con familia',
    'Calificación de conductores por pasajeros anteriores',
    'Botón de emergencia SOS en la app',
  ],

  faq_es: [
    { q: '¿Cómo reservo un viaje?', a: 'Descarga la app GOING, crea tu cuenta, elige tu destino y selecciona el tipo de viaje. ¡Listo!' },
    { q: '¿Puedo cancelar?', a: 'Sí, puedes cancelar hasta 30 minutos antes sin costo. Cancelaciones tardías pueden tener una tarifa mínima.' },
    { q: '¿Qué pasa si el conductor no llega?', a: 'Contáctanos por WhatsApp o en la app. Te asignamos otro conductor o te hacemos el reembolso completo.' },
    { q: '¿Aceptan mascotas?', a: 'Algunos conductores aceptan mascotas pequeñas en carrier. Puedes indicarlo al reservar y te asignamos un conductor compatible.' },
    { q: '¿Tienen servicio a las islas Galápagos?', a: 'Tenemos servicio en las islas principales. Te recomendamos reservar con anticipación por alta demanda.' },
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
    whatsapp: '+593 99 XXX XXXX',
    email: 'soporte@goingec.com',
    website: 'https://going.com.ec',
    app_ios: 'https://apps.apple.com/going-ec',
    app_android: 'https://play.google.com/going-ec',
  },
};
