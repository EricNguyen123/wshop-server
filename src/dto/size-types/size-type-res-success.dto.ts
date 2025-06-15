import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { IsUUID } from 'class-validator';

export class DSizeTypeRes {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'SM' })
  sizeCode?: string;

  @ApiProperty({ example: 'Small' })
  name?: string;

  @ApiProperty({ example: 'A' })
  sizeType?: string;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  createdAt?: Date;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  updatedAt?: Date;
}

export class DSizeTypeResSuccess extends DBaseRes {
  @ApiProperty({ type: DSizeTypeRes, example: DSizeTypeRes })
  declare data?: DSizeTypeRes;
}
