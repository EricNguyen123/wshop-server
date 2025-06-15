import { Test, TestingModule } from '@nestjs/testing';
import { SizeTypesController } from './size-types.controller';
import { SizeTypesService } from './size-types.service';

describe('SizeTypesController', () => {
  let controller: SizeTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SizeTypesController],
      providers: [SizeTypesService],
    }).compile();

    controller = module.get<SizeTypesController>(SizeTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
