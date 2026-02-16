import { TransportController } from './transport.controller';

const mockRequestTripUseCase = { execute: jest.fn() };
const mockAcceptTripUseCase = { execute: jest.fn() };
const mockGetActiveTripUseCase = { execute: jest.fn() };

describe('TransportController', () => {
  let controller: TransportController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new TransportController(
      mockRequestTripUseCase as any,
      mockAcceptTripUseCase as any,
      mockGetActiveTripUseCase as any,
    );
  });

  it('should request a trip', async () => {
    mockRequestTripUseCase.execute.mockResolvedValue({ id: 'trip-1' });
    const result = await controller.requestTrip({} as any);
    expect(result).toEqual({ id: 'trip-1' });
  });

  it('should get active trip (found)', async () => {
    const mockTrip = { toPrimitives: () => ({ id: 'trip-1', status: 'pending' }) };
    mockGetActiveTripUseCase.execute.mockResolvedValue(mockTrip);
    const result = await controller.getActiveTrip('user-1');
    expect(result).toEqual({ id: 'trip-1', status: 'pending' });
  });

  it('should return null when no active trip', async () => {
    mockGetActiveTripUseCase.execute.mockResolvedValue(null);
    const result = await controller.getActiveTrip('user-1');
    expect(result).toBeNull();
  });

  it('should accept a trip', async () => {
    mockAcceptTripUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.acceptTrip('trip-1', 'driver-1');
    expect(result).toEqual({ message: 'Trip accepted' });
    expect(mockAcceptTripUseCase.execute).toHaveBeenCalledWith('trip-1', 'driver-1');
  });
});
