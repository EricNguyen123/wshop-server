import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DBaseGetListRes } from '../base-get-list-res.dto';
import { DBannerRes } from './banner-res.dto';

export class DGetListBannersResSuccess extends DBaseRes {
  @ApiProperty({ example: DBaseGetListRes<DBannerRes>, type: DBaseGetListRes<DBannerRes> })
  declare data: DBaseGetListRes<DBannerRes>;
}
