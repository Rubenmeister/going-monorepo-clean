import { Test, TestingModule } from '@nestjs/testing';
import { TransportController } from './transport.controller';
import { RequestTripUseCase, AcceptTripUseCase, RequestTripDto } from '@going-monorepo-clean/domains-transport-application';

describe('TransportController', () => {
  let controller: TransportController;
  let requestTripUseCase: RequestTripUseCase;
  let acceptTripUseCase: AcceptTripUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TransportController],
      providers: [
        {
          provide: RequestTripUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
        {
          provide: AcceptTripUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<TransportController>(TransportController);
    requestTripUseCase = module.get<RequestTripUseCase>(RequestTripUseCase);
    acceptTripUseCase = module.get<AcceptTripUseCase>(AcceptTripUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('requestTrip', () => {
    it('should call RequestTripUseCase.execute', async () => {
      const dto: RequestTripDto = {
        userId: 'user-id',
        driverId: 'driver-id',
        vehicleType: 'SUV',
        mode: 'DOOR_TO_DOOR',
        departureTime: new Date().toISOString(),
        origin: {
          city: 'A',
          address: 'Addr A',
          latitude: 40.7128,
          longitude: -74.0060,
        },
        destination: {
          city: 'B',
          address: 'Addr B',
          latitude: 42.3601,
          longitude: -71.0589,
        },
        price: {
          amount: 100,
          currency: 'USD',
        },
      };
      
      const result = { id: 'trip-id' };
      jest.spyOn(requestTripUseCase, 'execute').mockResolvedValue(result as any);

      expect(await controller.requestTrip(dto)).toBe(result);
      expect(requestTripUseCase.execute).toHaveBeenCalledWith(dto);
    });
  });

  describe('acceptTrip', () => {
    it('should call AcceptTripUseCase.execute', async () => {
      const id = 'trip-id';
      const driverId = 'driver-id';
      
      jest.spyOn(acceptTripUseCase, 'execute').mockResolvedValue(undefined);

      await controller.acceptTrip(id, driverId);
      expect(acceptTripUseCase.execute).toHaveBeenCalledWith(id, driverId);
    });
  });
});
