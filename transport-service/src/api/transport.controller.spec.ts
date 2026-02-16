import { TransportController } from './transport.controller';

const mockRequestTripUseCase = { execute: jest.fn() };
const mockAcceptTripUseCase = { execute: jest.fn() };
const mockGetActiveTripUseCase = { execute: jest.fn() };
const mockGetTripByIdUseCase = { execute: jest.fn() };
const mockCancelTripUseCase = { execute: jest.fn() };
const mockStartTripUseCase = { execute: jest.fn() };
const mockCompleteTripUseCase = { execute: jest.fn() };
const mockGetTripsByUserUseCase = { execute: jest.fn() };

describe('TransportController', () => {
  let controller: TransportController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new TransportController(
      mockRequestTripUseCase as any,
      mockAcceptTripUseCase as any,
      mockGetActiveTripUseCase as any,
      mockGetTripByIdUseCase as any,
      mockCancelTripUseCase as any,
      mockStartTripUseCase as any,
      mockCompleteTripUseCase as any,
      mockGetTripsByUserUseCase as any,
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

  it('should get trip by id', async () => {
    const mockTrip = { toPrimitives: () => ({ id: 'trip-1', status: 'in_progress' }) };
    mockGetTripByIdUseCase.execute.mockResolvedValue(mockTrip);
    const result = await controller.getTripById('trip-1');
    expect(result).toEqual({ id: 'trip-1', status: 'in_progress' });
    expect(mockGetTripByIdUseCase.execute).toHaveBeenCalledWith('trip-1');
  });

  it('should get trips by user', async () => {
    mockGetTripsByUserUseCase.execute.mockResolvedValue([{ id: 'trip-1' }, { id: 'trip-2' }]);
    const result = await controller.getTripsByUser('user-1');
    expect(result).toHaveLength(2);
    expect(mockGetTripsByUserUseCase.execute).toHaveBeenCalledWith('user-1');
  });

  it('should start a trip', async () => {
    mockStartTripUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.startTrip('trip-1');
    expect(result).toEqual({ message: 'Trip started' });
    expect(mockStartTripUseCase.execute).toHaveBeenCalledWith('trip-1');
  });

  it('should complete a trip', async () => {
    mockCompleteTripUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.completeTrip('trip-1');
    expect(result).toEqual({ message: 'Trip completed' });
    expect(mockCompleteTripUseCase.execute).toHaveBeenCalledWith('trip-1');
  });

  it('should cancel a trip', async () => {
    mockCancelTripUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.cancelTrip('trip-1');
    expect(result).toEqual({ message: 'Trip cancelled' });
    expect(mockCancelTripUseCase.execute).toHaveBeenCalledWith('trip-1');
  });
});
