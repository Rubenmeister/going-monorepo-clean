/**
 * Zonas dentro de Quito — recargo por destino (cuando el viaje termina
 * en Quito). Compartido suma este surcharge al precio base de la ruta.
 */
import { QuitoZone } from './types';

export interface QuitoZoneInfo {
  id:        QuitoZone;
  label:     string;
  surcharge: number;
  examples:  string;
}

export const QUITO_ZONES: QuitoZoneInfo[] = [
  { id: 'quito_norte',  label: 'Quito Norte',  surcharge: 0,  examples: 'La Y, Cotocollao, Carapungo, El Condado' },
  { id: 'quito_centro', label: 'Quito Centro', surcharge: 1,  examples: 'Centro Histórico, La Marín, El Ejido'    },
  { id: 'quito_sur',    label: 'Quito Sur',    surcharge: 1,  examples: 'El Recreo, Quitumbe, Guajaló'            },
  { id: 'valles',       label: 'Los Valles',   surcharge: 2,  examples: 'Cumbayá, Tumbaco, Sangolquí, Los Chillos'},
  { id: 'aeropuerto',   label: 'Aeropuerto',   surcharge: 15, examples: 'Tababela (Aeropuerto Internacional)'      },
];
