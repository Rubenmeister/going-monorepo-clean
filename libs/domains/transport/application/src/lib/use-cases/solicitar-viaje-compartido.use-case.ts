// ... imports anteriores ...
import { CreatePaymentIntentUseCase } from '@myorg/domains/payment/application';

export class SolicitarViajeCompartidoUseCase {
  constructor(
    private tripRepository: ITripRepository,
    private driverService: DriverService,
    private calcularPrecioUseCase: CalcularPrecioUseCase,
    private createPaymentIntentUseCase: CreatePaymentIntentUseCase, // <--- Añadir
  ) {}

  async execute(command: SolicitarViajeCompartidoCommand): Promise<Trip> {
    // ... lógica anterior ...

    // Al agregar un pasajero (nuevo o existente)
    // 1. Calcular precio
    // 2. Crear viaje o añadir al existente
    // 3. AHORA: Crear intención de pago para el pasajero
    const precio = await this.calcularPrecioUseCase.execute({
      distancia: command.origen.distanceTo(command.destino),
      tipoVehiculo: command.tipoVehiculo,
      modo: command.modo,
      pasajerosActuales: viajeConCupo ? viajeConCupo.pasajeros.length + 1 : 1,
    });

    // Suponiendo que el usuario tiene un método para obtener su método de pago por defecto
    const paymentMethod = await this.obtenerMetodoPagoPorDefecto(command.userId);

    await this.createPaymentIntentUseCase.execute({
      userId: command.userId,
      tripId: viajeConCupo ? viajeConCupo.id.value : nuevoViaje.id.value,
      amount: precio,
      paymentMethod,
    });

    // ... retornar viaje ...
  }

  private async obtenerMetodoPagoPorDefecto(userId: string): Promise<PaymentMethodVO> {
    // Lógica para obtener el método de pago del usuario (de su perfil, por ejemplo)
    // Puede ser una inyección de otro servicio
    return new PaymentMethodVO('CARD', 'pm_1234567890');
  }
}