import { TrackingController } from './tracking.controller';

const mockGetActiveDriversUseCase = { execute: jest.fn() };
const mockUpdateLocationUseCase = { execute: jest.fn() };

describe('TrackingController', () => {
  let controller: TrackingController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new TrackingController(
      mockGetActiveDriversUseCase as any,
      mockUpdateLocationUseCase as any,
    );
  });

  it('should get active drivers', async () => {
    mockGetActiveDriversUseCase.execute.mockResolvedValue([{ driverId: 'd-1' }]);
    const result = await controller.getActiveDrivers();
    expect(result).toHaveLength(1);
    expect(result[0].driverId).toBe('d-1');
  });

  it('should update location', async () => {
    mockUpdateLocationUseCase.execute.mockResolvedValue(undefined);
    const dto = { driverId: 'd-1', latitude: 1.0, longitude: 2.0 };
    const result = await controller.updateLocation(dto as any);
    expect(result).toEqual({ message: 'Location updated' });
    expect(mockUpdateLocationUseCase.execute).toHaveBeenCalledWith(dto);
  });
});
