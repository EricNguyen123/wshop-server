import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DBannerRes } from './banner-res.dto';

export class DBannerResSuccess extends DBaseRes {
  @ApiProperty({ type: DBannerRes, example: DBannerRes })
  declare data?: DBannerRes;
}
