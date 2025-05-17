import { ApiProperty } from '@nestjs/swagger';

export class DCreateBanner {
  @ApiProperty({ example: 'Description' })
  descriptions: string;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  startDate: string;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  endDate: string;

  @ApiProperty({ example: 1 })
  numberOrder: number;

  @ApiProperty({ example: 'https://www.google.com' })
  url?: string;
}
