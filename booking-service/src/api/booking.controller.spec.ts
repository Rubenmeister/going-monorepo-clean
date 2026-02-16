import { BookingController } from './booking.controller';

const mockCreateUseCase = { execute: jest.fn() };
const mockFindUseCase = { execute: jest.fn() };
const mockGetByIdUseCase = { execute: jest.fn() };
const mockConfirmUseCase = { execute: jest.fn() };
const mockCancelUseCase = { execute: jest.fn() };
const mockCompleteUseCase = { execute: jest.fn() };

describe('BookingController', () => {
  let controller: BookingController;

  beforeEach(() => {
    jest.resetAllMocks();
    controller = new BookingController(
      mockCreateUseCase as any,
      mockFindUseCase as any,
      mockGetByIdUseCase as any,
      mockConfirmUseCase as any,
      mockCancelUseCase as any,
      mockCompleteUseCase as any,
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

  it('should get booking by id', async () => {
    const mockBooking = { toPrimitives: () => ({ id: 'b-1', status: 'PENDING' }) };
    mockGetByIdUseCase.execute.mockResolvedValue(mockBooking);
    const result = await controller.getBookingById('b-1');
    expect(result).toEqual({ id: 'b-1', status: 'PENDING' });
    expect(mockGetByIdUseCase.execute).toHaveBeenCalledWith('b-1');
  });

  it('should confirm booking', async () => {
    mockConfirmUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.confirmBooking('b-1');
    expect(result).toEqual({ message: 'Booking confirmed' });
    expect(mockConfirmUseCase.execute).toHaveBeenCalledWith('b-1');
  });

  it('should cancel booking', async () => {
    mockCancelUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.cancelBooking('b-1');
    expect(result).toEqual({ message: 'Booking cancelled' });
    expect(mockCancelUseCase.execute).toHaveBeenCalledWith('b-1');
  });

  it('should complete booking', async () => {
    mockCompleteUseCase.execute.mockResolvedValue(undefined);
    const result = await controller.completeBooking('b-1');
    expect(result).toEqual({ message: 'Booking completed' });
    expect(mockCompleteUseCase.execute).toHaveBeenCalledWith('b-1');
  });
});
