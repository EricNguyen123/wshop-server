import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DUserRes } from './user-res.dto';
import { DBaseGetListRes } from '../base-get-list-res.dto';

export class DGetListUsersResSuccess extends DBaseRes {
  @ApiProperty({ example: DBaseGetListRes<DUserRes>, type: DBaseGetListRes<DUserRes> })
  declare data: DBaseGetListRes<DUserRes>;
}
