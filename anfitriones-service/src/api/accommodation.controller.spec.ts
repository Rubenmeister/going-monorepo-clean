import { AccommodationController } from './accommodation.controller';

const mockCreateUseCase = { execute: jest.fn() };
const mockSearchUseCase = { execute: jest.fn() };
const mockGetByIdUseCase = { execute: jest.fn() };
const mockPublishUseCase = { execute: jest.fn() };
const mockGetByHostUseCase = { execute: jest.fn() };

describe('AccommodationController', () => {
  let controller: AccommodationController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new AccommodationController(
      mockCreateUseCase as any,
      mockSearchUseCase as any,
      mockGetByIdUseCase as any,
      mockPublishUseCase as any,
      mockGetByHostUseCase as any,
    );
  });

  it('should create accommodation', async () => {
    mockCreateUseCase.execute.mockResolvedValue({ id: 'acc-1' });
    const result = await controller.createAccommodation({} as any);
    expect(result).toEqual({ id: 'acc-1' });
    expect(mockCreateUseCase.execute).toHaveBeenCalled();
  });

  it('should search accommodations', async () => {
    mockSearchUseCase.execute.mockResolvedValue([{ title: 'Casa' }]);
    const result = await controller.searchAccommodations({ city: 'Cuenca' } as any);
    expect(result).toHaveLength(1);
    expect(mockSearchUseCase.execute).toHaveBeenCalledWith({ city: 'Cuenca' });
  });

  it('should get accommodation by id', async () => {
    const mockAcc = { toPrimitives: () => ({ id: 'acc-1', title: 'Casa' }) };
    mockGetByIdUseCase.execute.mockResolvedValue(mockAcc);
    const result = await controller.getById('acc-1');
    expect(result).toEqual({ id: 'acc-1', title: 'Casa' });
    expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith('acc-1');
  });

  it('should get accommodations by host', async () => {
    mockGetByHostUseCase.execute.mockResolvedValue([{ id: 'acc-1' }, { id: 'acc-2' }]);
    const result = await controller.getByHost('host-1');
    expect(result).toHaveLength(2);
    expect(mockGetByHostUseCase.execute).toHaveBeenCalledWith('host-1');
  });

  it('should publish accommodation', async () => {
    mockPublishUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.publish('acc-1');
    expect(result).toEqual({ message: 'Accommodation published' });
    expect(mockPublishUseCase.execute).toHaveBeenCalledWith('acc-1');
  });
});
