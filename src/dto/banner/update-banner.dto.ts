import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { DBannerRes } from './banner-res.dto';

export class DUpdateBanner extends PartialType(OmitType(DBannerRes, ['id', 'url'] as const)) {
  @ApiProperty({ example: 'Description' })
  descriptions?: string;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  startDate?: string;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  endDate?: string;

  @ApiProperty({ example: 1 })
  numberOrder?: number;
}
