import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DProductTypeRes } from './product-type-res.dto';

export class DProductTypeResSuccess extends DBaseRes {
  @ApiProperty({
    type: DProductTypeRes,
    example: DProductTypeRes,
  })
  declare data?: DProductTypeRes;
}
