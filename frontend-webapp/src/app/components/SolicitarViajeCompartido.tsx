import { useState } from 'react';
import { useMonorepoApp } from '@myorg/frontend/providers';

const SolicitarViajeCompartido = () => {
  const [origen, setOrigen] = useState('');
  const [destino, setDestino] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState<'SUV' | 'VAN'>('SUV');
  const [modo, setModo] = useState<'PUERTA_A_PUERTA' | 'PUNTO_A_PUNTO'>('PUERTA_A_PUERTA');
  const [asientoDelantero, setAsientoDelantero] = useState(false);

  const { domain } = useMonorepoApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const resultado = await domain.transport.solicitarViajeCompartido({
        userId: 'user-actual-id',
        origen: { lat: -0.1807, lng: -78.4678 }, // Ejemplo
        destino: { lat: -1.8312, lng: -78.1834 }, // Ejemplo
        tipoVehiculo,
        modo,
        solicitaAsientoDelantero: asientoDelantero,
        estacionOrigen: modo === 'PUNTO_A_PUNTO' ? 'Terminal Norte' : undefined,
        estacionDestino: modo === 'PUNTO_A_PUNTO' ? 'Terminal Sur' : undefined,
      });

      alert(`Viaje solicitado exitosamente. ID: ${resultado.id.value}`);
    } catch (error) {
      alert('Error al solicitar el viaje: ' + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Tipo de vehículo:</label>
        <select value={tipoVehiculo} onChange={(e) => setTipoVehiculo(e.target.value as any)}>
          <option value="SUV">SUV (Puerta a Puerta)</option>
          <option value="VAN">VAN (Punto a Punto)</option>
        </select>
      </div>

      <div>
        <label>Modo:</label>
        <select value={modo} onChange={(e) => setModo(e.target.value as any)}>
          <option value="PUERTA_A_PUERTA">Puerta a Puerta</option>
          <option value="PUNTO_A_PUNTO">Punto a Punto</option>
        </select>
      </div>

      {tipoVehiculo === 'SUV' && (
        <div>
          <label>
            <input
              type="checkbox"
              checked={asientoDelantero}
              onChange={(e) => setAsientoDelantero(e.target.checked)}
            />
            Solicitar asiento delantero (+$3)
          </label>
        </div>
      )}

      <button type="submit">Solicitar Viaje</button>
    </form>
  );
};

export default SolicitarViajeCompartido;