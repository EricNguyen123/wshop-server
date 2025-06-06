import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DBaseGetListRes } from '../base-get-list-res.dto';
import { DColorTypeRes } from './color-type-res-success.dto';

export class DGetListColorTypesResSuccess extends DBaseRes {
  @ApiProperty({ example: DBaseGetListRes<DColorTypeRes>, type: DBaseGetListRes<DColorTypeRes> })
  declare data: DBaseGetListRes<DColorTypeRes>;
}
