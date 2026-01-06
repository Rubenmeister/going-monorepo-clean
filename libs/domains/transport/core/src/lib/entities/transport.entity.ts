export class Transport {
  id: string;
  driverId: string;
  vehicleType: string;
  mode: string;
  originCity: string;
  originAddress: string;
  destCity: string;
  destAddress: string;
  departureTime: Date;
  basePrice: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;

  static create(props: Partial<Transport>): Transport {
    const transport = new Transport();
    Object.assign(transport, props);
    transport.id = transport.id || crypto.randomUUID();
    transport.createdAt = new Date();
    transport.updatedAt = new Date();
    return transport;
  }

  toPrimitives() {
    return {
      id: this.id,
      driverId: this.driverId,
      vehicleType: this.vehicleType,
      mode: this.mode,
      originCity: this.originCity,
      originAddress: this.originAddress,
      destCity: this.destCity,
      destAddress: this.destAddress,
      departureTime: this.departureTime.toISOString(),
      basePrice: this.basePrice,
      currency: this.currency,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
    };
  }
}
