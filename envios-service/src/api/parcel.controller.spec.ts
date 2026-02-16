import { ParcelController } from './parcel.controller';

const mockCreateUseCase = { execute: jest.fn() };
const mockFindUseCase = { execute: jest.fn() };

describe('ParcelController', () => {
  let controller: ParcelController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new ParcelController(
      mockCreateUseCase as any,
      mockFindUseCase as any,
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
});
