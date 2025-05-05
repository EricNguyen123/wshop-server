import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DUserRes } from './user-res.dto';

export class DUserResSuccess extends DBaseRes {
  @ApiProperty({ example: DUserRes, type: DUserRes })
  declare data: DUserRes;
}
