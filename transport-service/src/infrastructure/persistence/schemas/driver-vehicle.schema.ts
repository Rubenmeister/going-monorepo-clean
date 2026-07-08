import { Schema, SchemaFactory, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * DriverVehicle — datos estructurados del vehículo de una conductora o conductor
 * (marca/modelo/año/placa). El app del conductor los captura al registrarse y los
 * envía a PUT /drivers/me/vehicle. Vive en `going-transport` (misma DB que el
 * matching) para que la tarjeta del pasajero los lea SIN cross-DB.
 *
 * Complementa la asignación día-anterior: cuando el conductor queda asignado
 * (sin haber "aceptado" por la app), la tarjeta del pasajero puede mostrar placa
 * y modelo reales desde aquí, no solo el tipo de vehículo.
 */
@Schema({ timestamps: true, collection: 'driver_vehicles' })
export class DriverVehicleModel {
  @Prop({ required: true, unique: true, index: true }) driverId: string;
  @Prop() brand: string;
  @Prop() model: string;
  @Prop() year: string;
  @Prop() plate: string;
  @Prop() color: string;
}

export type DriverVehicleDocument = DriverVehicleModel & Document;
export const DriverVehicleSchema = SchemaFactory.createForClass(DriverVehicleModel);
