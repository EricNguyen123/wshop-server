import { Test, TestingModule } from '@nestjs/testing';
import { ColorTypesController } from './color-types.controller';
import { ColorTypesService } from './color-types.service';

describe('ColorTypesController', () => {
  let controller: ColorTypesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ColorTypesController],
      providers: [ColorTypesService],
    }).compile();

    controller = module.get<ColorTypesController>(ColorTypesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
