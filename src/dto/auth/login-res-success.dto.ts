import { ApiProperty } from '@nestjs/swagger';
import { DLoginRes } from './login-res.dto';
import { DBaseRes } from '../base-res.dto';

export class DLoginResSuccess extends DBaseRes {
  @ApiProperty({ example: DLoginRes, type: DLoginRes })
  declare data: DLoginRes;
}
