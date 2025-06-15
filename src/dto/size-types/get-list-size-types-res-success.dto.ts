import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DBaseGetListRes } from '../base-get-list-res.dto';
import { DSizeTypeRes } from './size-type-res-success.dto';

export class DGetListSizeTypesResSuccess extends DBaseRes {
  @ApiProperty({ example: DBaseGetListRes<DSizeTypeRes>, type: DBaseGetListRes<DSizeTypeRes> })
  declare data: DBaseGetListRes<DSizeTypeRes>;
}
