import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DBlobRes {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: '' })
  filename: string;

  @ApiProperty({ example: '' })
  contentType: string;

  @ApiProperty({ example: 0 })
  byteSize: number;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  createdAt: Date;
}
