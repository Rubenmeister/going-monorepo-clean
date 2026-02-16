import { ParcelController } from './parcel.controller';

const mockCreateUseCase = { execute: jest.fn() };
const mockFindUseCase = { execute: jest.fn() };
const mockGetByIdUseCase = { execute: jest.fn() };
const mockAssignDriverUseCase = { execute: jest.fn() };
const mockMarkInTransitUseCase = { execute: jest.fn() };
const mockDeliverUseCase = { execute: jest.fn() };

describe('ParcelController', () => {
  let controller: ParcelController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new ParcelController(
      mockCreateUseCase as any,
      mockFindUseCase as any,
      mockGetByIdUseCase as any,
      mockAssignDriverUseCase as any,
      mockMarkInTransitUseCase as any,
      mockDeliverUseCase as any,
    );
  });

  it('should create parcel', async () => {
    mockCreateUseCase.execute.mockResolvedValue({ id: 'parcel-1' });
    const result = await controller.createParcel({} as any);
    expect(result).toEqual({ id: 'parcel-1' });
  });

  it('should get parcels by user', async () => {
    mockFindUseCase.execute.mockResolvedValue([{ id: 'p-1' }]);
    const result = await controller.getParcelsByUser('user-1');
    expect(result).toHaveLength(1);
    expect(mockFindUseCase.execute).toHaveBeenCalledWith('user-1');
  });

  it('should get parcel by id', async () => {
    const mockParcel = { toPrimitives: () => ({ id: 'p-1', status: 'pending' }) };
    mockGetByIdUseCase.execute.mockResolvedValue(mockParcel);
    const result = await controller.getParcelById('p-1');
    expect(result).toEqual({ id: 'p-1', status: 'pending' });
    expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith('p-1');
  });

  it('should assign driver to parcel', async () => {
    mockAssignDriverUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.assignDriver('p-1', 'driver-1');
    expect(result).toEqual({ message: 'Driver assigned' });
    expect(mockAssignDriverUseCase.execute).toHaveBeenCalledWith('p-1', 'driver-1');
  });

  it('should mark parcel in transit', async () => {
    mockMarkInTransitUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.markInTransit('p-1');
    expect(result).toEqual({ message: 'Parcel in transit' });
    expect(mockMarkInTransitUseCase.execute).toHaveBeenCalledWith('p-1');
  });

  it('should deliver parcel', async () => {
    mockDeliverUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.deliver('p-1');
    expect(result).toEqual({ message: 'Parcel delivered' });
    expect(mockDeliverUseCase.execute).toHaveBeenCalledWith('p-1');
  });
});
