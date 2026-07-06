// ⚠️ ARCHIVO GENERADO por scripts/import-fares.py desde el Excel
// (knowledge-base/pricing/source/Going_Matriz_Precios_Limpia.xlsx).
// FUENTE ÚNICA: no editar a mano. Para cambiar un precio: editar el Excel y
// re-correr `python scripts/import-fares.py`.
//
// Precios FIJOS de mercado (compartido y privado explícito por vehículo).
// Sin fórmulas, sin recargo de origen, sin surcharge sobre estos valores.

export interface PrivatePrices {
  suv: number; suv_xl: number; van: number; van_xl: number;
  minibus: number; bus: number; bus_40: number;
}

export const FARES = {
  shared: {
    'aeropuerto-ambato': 15,
    'aeropuerto-atuntaqui': 15,
    'aeropuerto-banos': 20,
    'aeropuerto-el_carmen': 35,
    'aeropuerto-ibarra': 20,
    'aeropuerto-la_concordia': 35,
    'aeropuerto-latacunga': 15,
    'aeropuerto-otavalo': 20,
    'aeropuerto-peguche': 20,
    'aeropuerto-quito': 20,
    'aeropuerto-riobamba': 35,
    'aeropuerto-santo_domingo': 25,
    'aloasi-quito': 15,
    'ambato-puyo': 10,
    'ambato-quito': 15,
    'ambato-riobamba': 10,
    'atuntaqui-quito': 15,
    'banos-guayaquil': 35,
    'banos-quito': 20,
    'cayambe-quito': 10,
    'cotacachi-quito': 15,
    'cuenca-guayaquil': 15,
    'cuenca-loja': 15,
    'cuenca-macas': 15,
    'cuenca-machala': 15,
    'cuenca-quito': 25,
    'cuenca-riobamba': 20,
    'el_carmen-quito': 20,
    'esmeraldas-quito': 35,
    'guaranda-quito': 20,
    'guayaquil-machala': 15,
    'guayaquil-manta': 25,
    'guayaquil-quito': 45,
    'guayaquil-riobamba': 25,
    'guayaquil-santo_domingo': 35,
    'ibarra-quito': 15,
    'ibarra-tulcan': 25,
    'la_concordia-quito': 25,
    'la_concordia-santo_domingo': 5,
    'lago_agrio-quito': 45,
    'latacunga-quito': 13,
    'macas-quito': 35,
    'manta-quito': 45,
    'mocha-quito': 25,
    'otavalo-quito': 15,
    'peguche-quito': 15,
    'puyo-quito': 25,
    'quito-riobamba': 20,
    'quito-salcedo': 12,
    'quito-santo_domingo': 15,
  },
  private: {
    'aeropuerto-ambato': { suv: 70, suv_xl: 80, van: 120, van_xl: 140, minibus: 200, bus: 300, bus_40: 400 },
    'aeropuerto-atuntaqui': { suv: 70, suv_xl: 80, van: 120, van_xl: 140, minibus: 200, bus: 300, bus_40: 400 },
    'aeropuerto-banos': { suv: 80, suv_xl: 90, van: 120, van_xl: 140, minibus: 200, bus: 300, bus_40: 350 },
    'aeropuerto-cayambe': { suv: 40, suv_xl: 50, van: 60, van_xl: 80, minibus: 150, bus: 200, bus_40: 250 },
    'aeropuerto-cuenca': { suv: 250, suv_xl: 300, van: 350, van_xl: 400, minibus: 450, bus: 500, bus_40: 550 },
    'aeropuerto-el_carmen': { suv: 80, suv_xl: 90, van: 100, van_xl: 120, minibus: 140, bus: 200, bus_40: 300 },
    'aeropuerto-el_quinche': { suv: 20, suv_xl: 30, van: 40, van_xl: 60, minibus: 100, bus: 140, bus_40: 200 },
    'aeropuerto-guayaquil': { suv: 350, suv_xl: 400, van: 450, van_xl: 500, minibus: 550, bus: 600, bus_40: 650 },
    'aeropuerto-guayllabamba': { suv: 20, suv_xl: 25, van: 35, van_xl: 50, minibus: 80, bus: 100, bus_40: 150 },
    'aeropuerto-ibarra': { suv: 70, suv_xl: 80, van: 120, van_xl: 140, minibus: 200, bus: 300, bus_40: 400 },
    'aeropuerto-la_concordia': { suv: 90, suv_xl: 100, van: 120, van_xl: 140, minibus: 200, bus: 300, bus_40: 400 },
    'aeropuerto-latacunga': { suv: 60, suv_xl: 70, van: 100, van_xl: 120, minibus: 140, bus: 200, bus_40: 300 },
    'aeropuerto-otavalo': { suv: 70, suv_xl: 80, van: 120, van_xl: 140, minibus: 200, bus: 300, bus_40: 400 },
    'aeropuerto-peguche': { suv: 70, suv_xl: 80, van: 120, van_xl: 140, minibus: 200, bus: 300, bus_40: 400 },
    'aeropuerto-pifo': { suv: 20, suv_xl: 25, van: 35, van_xl: 50, minibus: 80, bus: 100, bus_40: 120 },
    'aeropuerto-quito': { suv: 20, suv_xl: 30, van: 70, van_xl: 100, minibus: 120, bus: 180, bus_40: 200 },
    'aeropuerto-riobamba': { suv: 100, suv_xl: 120, van: 150, van_xl: 180, minibus: 200, bus: 250, bus_40: 300 },
    'aeropuerto-santo_domingo': { suv: 60, suv_xl: 70, van: 130, van_xl: 150, minibus: 200, bus: 250, bus_40: 300 },
    'alausi-cuenca': { suv: 68, suv_xl: 85, van: 120, van_xl: 150, minibus: 200, bus: 250, bus_40: 300 },
    'alausi-guayaquil': { suv: 90, suv_xl: 120, van: 170, van_xl: 200, minibus: 250, bus: 300, bus_40: 350 },
    'alausi-quito': { suv: 200, suv_xl: 230, van: 250, van_xl: 300, minibus: 350, bus: 400, bus_40: 450 },
    'alausi-riobamba': { suv: 50, suv_xl: 60, van: 70, van_xl: 100, minibus: 120, bus: 180, bus_40: 250 },
    'aloasi-quito': { suv: 40, suv_xl: 50, van: 70, van_xl: 100, minibus: 120, bus: 150, bus_40: 200 },
    'ambato-banos': { suv: 20, suv_xl: 25, van: 35, van_xl: 50, minibus: 80, bus: 100, bus_40: 150 },
    'ambato-cevallos': { suv: 15, suv_xl: 20, van: 25, van_xl: 30, minibus: 40, bus: 80, bus_40: 150 },
    'ambato-cuenca': { suv: 120, suv_xl: 140, van: 180, van_xl: 200, minibus: 220, bus: 250, bus_40: 300 },
    'ambato-guayaquil': { suv: 200, suv_xl: 220, van: 240, van_xl: 280, minibus: 350, bus: 400, bus_40: 450 },
    'ambato-latacunga': { suv: 15, suv_xl: 25, van: 35, van_xl: 50, minibus: 83, bus: 100, bus_40: 150 },
    'ambato-mocha': { suv: 15, suv_xl: 25, van: 35, van_xl: 50, minibus: 83, bus: 100, bus_40: 150 },
    'ambato-pillaro': { suv: 10, suv_xl: 12, van: 15, van_xl: 20, minibus: 50, bus: 100, bus_40: 150 },
    'ambato-puyo': { suv: 50, suv_xl: 70, van: 90, van_xl: 100, minibus: 150, bus: 180, bus_40: 200 },
    'ambato-quito': { suv: 60, suv_xl: 75, van: 105, van_xl: 150, minibus: 250, bus: 300, bus_40: 350 },
    'ambato-riobamba': { suv: 50, suv_xl: 60, van: 70, van_xl: 80, minibus: 100, bus: 120, bus_40: 150 },
    'ambato-salcedo': { suv: 20, suv_xl: 25, van: 35, van_xl: 50, minibus: 80, bus: 100, bus_40: 150 },
    'ambato-tena': { suv: 60, suv_xl: 80, van: 100, van_xl: 150, minibus: 200, bus: 250, bus_40: 300 },
    'ambato-tisaleo': { suv: 15, suv_xl: 20, van: 30, van_xl: 40, minibus: 80, bus: 150, bus_40: 200 },
    'atuntaqui-quito': { suv: 60, suv_xl: 70, van: 90, van_xl: 120, minibus: 150, bus: 200, bus_40: 250 },
    'azogues-cuenca': { suv: 20, suv_xl: 25, van: 35, van_xl: 50, minibus: 80, bus: 100, bus_40: 120 },
    'banos-cevallos': { suv: 20, suv_xl: 25, van: 35, van_xl: 50, minibus: 80, bus: 100, bus_40: 120 },
    'banos-guayaquil': { suv: 130, suv_xl: 150, van: 180, van_xl: 200, minibus: 250, bus: 300, bus_40: 350 },
    'banos-mocha': { suv: 15, suv_xl: 20, van: 30, van_xl: 40, minibus: 70, bus: 100, bus_40: 150 },
    'banos-pillaro': { suv: 15, suv_xl: 20, van: 30, van_xl: 40, minibus: 80, bus: 150, bus_40: 200 },
    'banos-quito': { suv: 70, suv_xl: 80, van: 120, van_xl: 150, minibus: 200, bus: 250, bus_40: 300 },
    'banos-tisaleo': { suv: 20, suv_xl: 25, van: 35, van_xl: 50, minibus: 80, bus: 100, bus_40: 120 },
    'cayambe-ibarra': { suv: 60, suv_xl: 70, van: 100, van_xl: 120, minibus: 150, bus: 200, bus_40: 250 },
    'cayambe-quito': { suv: 30, suv_xl: 40, van: 60, van_xl: 80, minibus: 120, bus: 150, bus_40: 200 },
    'cevallos-latacunga': { suv: 30, suv_xl: 40, van: 50, van_xl: 60, minibus: 100, bus: 120, bus_40: 150 },
    'cevallos-quito': { suv: 60, suv_xl: 70, van: 80, van_xl: 120, minibus: 150, bus: 200, bus_40: 250 },
    'cotacachi-ibarra': { suv: 20, suv_xl: 30, van: 40, van_xl: 50, minibus: 70, bus: 100, bus_40: 120 },
    'cotacachi-quito': { suv: 60, suv_xl: 75, van: 100, van_xl: 120, minibus: 150, bus: 200, bus_40: 250 },
    'cuenca-guayaquil': { suv: 90, suv_xl: 120, van: 150, van_xl: 170, minibus: 200, bus: 300, bus_40: 350 },
    'cuenca-latacunga': { suv: 300, suv_xl: 320, van: 320, van_xl: 350, minibus: 350, bus: 400, bus_40: 400 },
    'cuenca-loja': { suv: 90, suv_xl: 120, van: 150, van_xl: 180, minibus: 200, bus: 250, bus_40: 300 },
    'cuenca-macas': { suv: 120, suv_xl: 130, van: 150, van_xl: 180, minibus: 200, bus: 250, bus_40: 300 },
    'cuenca-machala': { suv: 90, suv_xl: 120, van: 150, van_xl: 180, minibus: 200, bus: 220, bus_40: 250 },
    'cuenca-quito': { suv: 220, suv_xl: 220, van: 250, van_xl: 280, minibus: 300, bus: 350, bus_40: 400 },
    'cuenca-riobamba': { suv: 100, suv_xl: 120, van: 150, van_xl: 200, minibus: 220, bus: 250, bus_40: 300 },
    'cuenca-zaruma': { suv: 120, suv_xl: 140, van: 180, van_xl: 200, minibus: 250, bus: 300, bus_40: 400 },
    'el_carmen-la_concordia': { suv: 60, suv_xl: 70, van: 80, van_xl: 120, minibus: 150, bus: 200, bus_40: 250 },
    'el_carmen-quito': { suv: 80, suv_xl: 100, van: 140, van_xl: 200, minibus: 250, bus: 300, bus_40: 350 },
    'el_carmen-santo_domingo': { suv: 20, suv_xl: 30, van: 40, van_xl: 80, minibus: 120, bus: 160, bus_40: 200 },
    'el_quinche-quito': { suv: 20, suv_xl: 30, van: 40, van_xl: 50, minibus: 80, bus: 90, bus_40: 100 },
    'esmeraldas-guayaquil': { suv: 200, suv_xl: 250, van: 280, van_xl: 300, minibus: 350, bus: 400, bus_40: 450 },
    'esmeraldas-manta': { suv: 150, suv_xl: 200, van: 250, van_xl: 300, minibus: 350, bus: 400, bus_40: 450 },
    'esmeraldas-quito': { suv: 120, suv_xl: 140, van: 180, van_xl: 200, minibus: 250, bus: 300, bus_40: 400 },
    'guaranda-quito': { suv: 90, suv_xl: 100, van: 120, van_xl: 150, minibus: 200, bus: 250, bus_40: 300 },
    'guayaquil-ibarra': { suv: 200, suv_xl: 250, van: 280, van_xl: 300, minibus: 350, bus: 400, bus_40: 450 },
    'guayaquil-latacunga': { suv: 250, suv_xl: 250, van: 280, van_xl: 280, minibus: 300, bus: 350, bus_40: 400 },
    'guayaquil-loja': { suv: 180, suv_xl: 200, van: 220, van_xl: 250, minibus: 300, bus: 350, bus_40: 400 },
    'guayaquil-machala': { suv: 120, suv_xl: 130, van: 140, van_xl: 160, minibus: 200, bus: 250, bus_40: 300 },
    'guayaquil-manta': { suv: 120, suv_xl: 130, van: 140, van_xl: 160, minibus: 200, bus: 250, bus_40: 300 },
    'guayaquil-montanita': { suv: 70, suv_xl: 80, van: 100, van_xl: 150, minibus: 200, bus: 250, bus_40: 300 },
    'guayaquil-naranjal': { suv: 40, suv_xl: 50, van: 70, van_xl: 100, minibus: 120, bus: 150, bus_40: 200 },
    'guayaquil-portoviejo': { suv: 120, suv_xl: 130, van: 140, van_xl: 160, minibus: 200, bus: 250, bus_40: 300 },
    'guayaquil-quito': { suv: 230, suv_xl: 250, van: 280, van_xl: 300, minibus: 350, bus: 400, bus_40: 450 },
    'guayaquil-riobamba': { suv: 120, suv_xl: 140, van: 180, van_xl: 200, minibus: 250, bus: 300, bus_40: 400 },
    'guayaquil-salinas': { suv: 80, suv_xl: 90, van: 120, van_xl: 140, minibus: 200, bus: 250, bus_40: 300 },
    'guayaquil-santo_domingo': { suv: 120, suv_xl: 140, van: 180, van_xl: 200, minibus: 250, bus: 300, bus_40: 350 },
    'guayaquil-zaruma': { suv: 110, suv_xl: 130, van: 150, van_xl: 180, minibus: 250, bus: 300, bus_40: 350 },
    'guayllabamba-quito': { suv: 24, suv_xl: 30, van: 42, van_xl: 60, minibus: 100, bus: 140, bus_40: 150 },
    'ibarra-latacunga': { suv: 90, suv_xl: 120, van: 150, van_xl: 200, minibus: 250, bus: 300, bus_40: 350 },
    'ibarra-otavalo': { suv: 20, suv_xl: 25, van: 35, van_xl: 50, minibus: 80, bus: 110, bus_40: 150 },
    'ibarra-quito': { suv: 60, suv_xl: 75, van: 105, van_xl: 150, minibus: 250, bus: 350, bus_40: 400 },
    'ibarra-tulcan': { suv: 56, suv_xl: 70, van: 98, van_xl: 140, minibus: 230, bus: 280, bus_40: 350 },
    'la_concordia-quito': { suv: 80, suv_xl: 100, van: 140, van_xl: 200, minibus: 250, bus: 300, bus_40: 350 },
    'la_concordia-santo_domingo': { suv: 30, suv_xl: 40, van: 60, van_xl: 80, minibus: 120, bus: 150, bus_40: 180 },
    'lago_agrio-quito': { suv: 160, suv_xl: 180, van: 250, van_xl: 300, minibus: 350, bus: 400, bus_40: 450 },
    'lago_agrio-tena': { suv: 130, suv_xl: 150, van: 180, van_xl: 250, minibus: 300, bus: 350, bus_40: 400 },
    'latacunga-pillaro': { suv: 15, suv_xl: 20, van: 30, van_xl: 50, minibus: 80, bus: 100, bus_40: 150 },
    'latacunga-quito': { suv: 50, suv_xl: 60, van: 70, van_xl: 100, minibus: 150, bus: 200, bus_40: 250 },
    'latacunga-riobamba': { suv: 90, suv_xl: 100, van: 120, van_xl: 150, minibus: 200, bus: 250, bus_40: 300 },
    'latacunga-salcedo': { suv: 10, suv_xl: 15, van: 20, van_xl: 25, minibus: 50, bus: 70, bus_40: 100 },
    'loja-machala': { suv: 120, suv_xl: 140, van: 180, van_xl: 200, minibus: 250, bus: 300, bus_40: 350 },
    'loja-quito': { suv: 350, suv_xl: 400, van: 450, van_xl: 500, minibus: 500, bus: 600, bus_40: 600 },
    'loja-zaruma': { suv: 70, suv_xl: 90, van: 110, van_xl: 150, minibus: 200, bus: 250, bus_40: 300 },
    'macas-puyo': { suv: 110, suv_xl: 120, van: 150, van_xl: 180, minibus: 200, bus: 220, bus_40: 250 },
    'macas-quito': { suv: 250, suv_xl: 270, van: 300, van_xl: 340, minibus: 380, bus: 400, bus_40: 450 },
    'macas-tena': { suv: 100, suv_xl: 120, van: 150, van_xl: 200, minibus: 250, bus: 300, bus_40: 400 },
    'machachi-quito': { suv: 30, suv_xl: 35, van: 40, van_xl: 80, minibus: 100, bus: 150, bus_40: 200 },
    'machala-quito': { suv: 250, suv_xl: 280, van: 300, van_xl: 350, minibus: 400, bus: 500, bus_40: 600 },
    'machala-zaruma': { suv: 80, suv_xl: 95, van: 90, van_xl: 120, minibus: 150, bus: 200, bus_40: 250 },
    'manta-portoviejo': { suv: 20, suv_xl: 30, van: 60, van_xl: 80, minibus: 100, bus: 150, bus_40: 200 },
    'manta-quito': { suv: 200, suv_xl: 220, van: 240, van_xl: 280, minibus: 300, bus: 350, bus_40: 400 },
    'manta-salinas': { suv: 80, suv_xl: 95, van: 90, van_xl: 120, minibus: 150, bus: 200, bus_40: 250 },
    'mocha-quito': { suv: 80, suv_xl: 95, van: 90, van_xl: 120, minibus: 150, bus: 200, bus_40: 250 },
    'montanita-quito': { suv: 250, suv_xl: 270, van: 300, van_xl: 350, minibus: 400, bus: 450, bus_40: 500 },
    'montanita-salinas': { suv: 35, suv_xl: 45, van: 60, van_xl: 70, minibus: 100, bus: 150, bus_40: 200 },
    'otavalo-quito': { suv: 60, suv_xl: 75, van: 105, van_xl: 150, minibus: 250, bus: 350, bus_40: 400 },
    'peguche-quito': { suv: 60, suv_xl: 75, van: 105, van_xl: 150, minibus: 250, bus: 350, bus_40: 400 },
    'pifo-quito': { suv: 24, suv_xl: 30, van: 40, van_xl: 60, minibus: 100, bus: 140, bus_40: 180 },
    'pillaro-quito': { suv: 60, suv_xl: 75, van: 105, van_xl: 150, minibus: 250, bus: 350, bus_40: 400 },
    'portoviejo-quito': { suv: 200, suv_xl: 220, van: 240, van_xl: 280, minibus: 300, bus: 350, bus_40: 400 },
    'puyo-quito': { suv: 130, suv_xl: 150, van: 180, van_xl: 200, minibus: 250, bus: 300, bus_40: 400 },
    'puyo-tena': { suv: 40, suv_xl: 50, van: 70, van_xl: 100, minibus: 120, bus: 150, bus_40: 200 },
    'quito-riobamba': { suv: 90, suv_xl: 110, van: 130, van_xl: 200, minibus: 250, bus: 300, bus_40: 350 },
    'quito-salcedo': { suv: 50, suv_xl: 60, van: 70, van_xl: 100, minibus: 150, bus: 200, bus_40: 250 },
    'quito-salinas': { suv: 240, suv_xl: 280, van: 280, van_xl: 300, minibus: 350, bus: 400, bus_40: 450 },
    'quito-santo_domingo': { suv: 60, suv_xl: 70, van: 100, van_xl: 150, minibus: 250, bus: 350, bus_40: 400 },
    'quito-tabacundo': { suv: 25, suv_xl: 25, van: 50, van_xl: 70, minibus: 120, bus: 160, bus_40: 200 },
    'quito-tambillo': { suv: 30, suv_xl: 40, van: 56, van_xl: 80, minibus: 140, bus: 160, bus_40: 200 },
    'quito-tena': { suv: 120, suv_xl: 140, van: 180, van_xl: 220, minibus: 250, bus: 300, bus_40: 400 },
    'quito-tisaleo': { suv: 50, suv_xl: 60, van: 80, van_xl: 120, minibus: 160, bus: 200, bus_40: 250 },
    'quito-tulcan': { suv: 90, suv_xl: 120, van: 150, van_xl: 200, minibus: 250, bus: 300, bus_40: 350 },
    'quito-zaruma': { suv: 240, suv_xl: 280, van: 280, van_xl: 300, minibus: 350, bus: 400, bus_40: 450 },
  },
  vehicles: {
    suv:     { label: 'SUV',     capacity: 4 },
    suv_xl:  { label: 'SUV XL',  capacity: 5 },
    van:     { label: 'VAN',     capacity: 7 },
    van_xl:  { label: 'VAN XL',  capacity: 12 },
    minibus: { label: 'Minibús', capacity: 20 },
    bus:     { label: 'Bus',     capacity: 30 },
    bus_40:  { label: 'Bus 40',  capacity: 40 },
  },
} as {
  shared: Record<string, number>;
  private: Record<string, PrivatePrices>;
  vehicles: Record<string, { label: string; capacity: number }>;
};

function normalize(city: string): string {
  const s = city.split(',')[0].trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '').trim();
  if (s.startsWith('aeropuerto')) return 'aeropuerto';
  // Zonas de Quito colapsan a 'quito' (misma tarifa; la diferencia de zona
  // ya no cobra recargo — precios fijos de mercado).
  if (/^(quito|cumbaya|tumbaco|los chillos|sangolqui|valle)/.test(s)) return 'quito';
  return s.replace(/\s+/g, '_');
}

function pair(a: string, b: string): string { return `${normalize(a)}-${normalize(b)}`; }

// ── Snapshot del MOTOR DE TARIFAS (runtime) ───────────────────────────────────
// El webapp baja /snapshot al cargar y sobrescribe la tabla local con los datos
// AUTORITATIVOS del motor (Atlas) → cierra la última divergencia de precios en
// pantallas. Si el fetch falla, se usa el bundle `FARES` de fallback (offline/robusto).
let motorShared: Record<string, number> | null = null;
let motorPrivate: Record<string, PrivatePrices> | null = null;

export function setMotorFares(
  shared?: Record<string, number> | null,
  priv?: Record<string, PrivatePrices> | null,
): void {
  if (shared && Object.keys(shared).length) motorShared = shared;
  if (priv && Object.keys(priv).length) motorPrivate = priv;
}

/** Baja el snapshot del motor y sobrescribe la tabla local. Fire-and-forget. */
export async function loadMotorSnapshot(): Promise<boolean> {
  try {
    const API = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'https://api.goingec.com';
    const res = await fetch(`${API}/snapshot`, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return false;
    const d = await res.json() as {
      compartido?: { shared?: Record<string, number> };
      privado?: { private?: Record<string, PrivatePrices> };
    };
    setMotorFares(d.compartido?.shared, d.privado?.private);
    return true;
  } catch {
    return false;
  }
}

/** Precio compartido/persona (motor si está, si no el bundle; null si no existe). */
export function getFare(origin: string, destination: string): number | null {
  const k1 = pair(origin, destination), k2 = pair(destination, origin);
  if (motorShared) {
    const m = motorShared[k1] ?? motorShared[k2];
    if (m != null) return m;
  }
  return FARES.shared[k1] ?? FARES.shared[k2] ?? null;
}

/** Precios privados por vehículo (motor si está, si no el bundle). */
export function getPrivatePrices(origin: string, destination: string): PrivatePrices | null {
  const k1 = pair(origin, destination), k2 = pair(destination, origin);
  if (motorPrivate) {
    const m = motorPrivate[k1] ?? motorPrivate[k2];
    if (m != null) return m;
  }
  return FARES.private[k1] ?? FARES.private[k2] ?? null;
}
