import { Test, TestingModule } from '@nestjs/testing';
import { ColorTypesService } from './color-types.service';

describe('ColorTypesService', () => {
  let service: ColorTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ColorTypesService],
    }).compile();

    service = module.get<ColorTypesService>(ColorTypesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
