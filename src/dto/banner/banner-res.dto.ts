import { ApiProperty } from '@nestjs/swagger';
import { IsUrl, IsUUID } from 'class-validator';

export class DBannerRes {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'Description' })
  descriptions?: string;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  startDate?: string;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  endDate?: string;

  @ApiProperty({ example: 1 })
  numberOrder?: number;

  @ApiProperty({ example: 'https://www.google.com' })
  @IsUrl()
  url?: string;
}
