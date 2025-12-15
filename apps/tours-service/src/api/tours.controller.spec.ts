import { Test, TestingModule } from '@nestjs/testing';
import { ToursController } from './tours.controller';
import { CreateTourUseCase, CreateTourDto } from '@going-monorepo-clean/domains-tour-application';

describe('ToursController', () => {
  let controller: ToursController;
  let createTourUseCase: CreateTourUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToursController],
      providers: [
        {
          provide: CreateTourUseCase,
          useValue: {
            execute: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ToursController>(ToursController);
    createTourUseCase = module.get<CreateTourUseCase>(CreateTourUseCase);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('createTour', () => {
    it('should call CreateTourUseCase.execute', async () => {
      const dto: CreateTourDto = {
        hostId: 'host-id',
        title: 'City Tour',
        description: 'A nice tour',
        pricePerPerson: 50,
        currency: 'USD',
        maxCapacity: 10,
        durationHours: 3,
        location: 'City Center',
        meetingPoint: 'Main Square',
      };
      
      const result = { id: 'tour-id' };
      jest.spyOn(createTourUseCase, 'execute').mockResolvedValue(result);

      expect(await controller.createTour(dto)).toBe(result);
      expect(createTourUseCase.execute).toHaveBeenCalledWith(dto);
    });
  });
});
