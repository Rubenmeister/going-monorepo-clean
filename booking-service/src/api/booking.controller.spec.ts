import { BookingController } from './booking.controller';

const mockCreateUseCase = { execute: jest.fn() };
const mockFindUseCase = { execute: jest.fn() };

describe('BookingController', () => {
  let controller: BookingController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new BookingController(
      mockCreateUseCase as any,
      mockFindUseCase as any,
    );
  });

  it('should create booking', async () => {
    mockCreateUseCase.execute.mockResolvedValue({ id: 'booking-1' });
    const result = await controller.createBooking({} as any);
    expect(result).toEqual({ id: 'booking-1' });
  });

  it('should get bookings by user', async () => {
    mockFindUseCase.execute.mockResolvedValue([{ id: 'b-1' }]);
    const result = await controller.getBookingsByUser('user-1');
    expect(result).toHaveLength(1);
    expect(mockFindUseCase.execute).toHaveBeenCalledWith('user-1');
  });
});
