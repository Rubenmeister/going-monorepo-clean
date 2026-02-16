import { TrackingController } from './tracking.controller';

const mockGetActiveDriversUseCase = { execute: jest.fn() };

describe('TrackingController', () => {
  let controller: TrackingController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new TrackingController(mockGetActiveDriversUseCase as any);
  });

  it('should get active drivers', async () => {
    mockGetActiveDriversUseCase.execute.mockResolvedValue([{ driverId: 'd-1' }]);
    const result = await controller.getActiveDrivers();
    expect(result).toHaveLength(1);
    expect(result[0].driverId).toBe('d-1');
  });
});
