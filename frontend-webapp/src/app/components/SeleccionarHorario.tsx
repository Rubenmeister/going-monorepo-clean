import { useState, useEffect } from 'react';

interface Horario {
  hora: Date;
  disponible: boolean;
  cupo: number;
}

const SeleccionarHorario = ({ origen, destino, tipoVehiculo }) => {
  const [horarios, setHorarios] = useState<Horario[]>([]);

  useEffect(() => {
    if (tipoVehiculo === 'VAN' && origen && destino) {
      // Llamar al endpoint de horarios
      fetch(`/api/transport/schedules?origen=${origen}&destino=${destino}&tipoVehiculo=VAN`)
        .then(res => res.json())
        .then(data => {
          // Mapear respuesta a Horario[]
          const horariosMapeados = data.horarios.map(hora => ({
            hora: new Date(hora),
            disponible: true, // Asumiendo que siempre están disponibles
            cupo: 7, // Asumiendo que todos parten con cupo completo
          }));
          setHorarios(horariosMapeados);
        });
    }
  }, [origen, destino, tipoVehiculo]);

  return (
    <div>
      <h3>Horarios disponibles:</h3>
      <div className="horarios-grid">
        {horarios.map((h, index) => (
          <button
            key={index}
            className={`horario-btn ${!h.disponible ? 'disabled' : ''}`}
            disabled={!h.disponible}
            // onClick={() => onSelect(hora)}
          >
            {h.hora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <span className="cupo">({h.cupo} cupos)</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SeleccionarHorario;