import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { DBaseRes } from '../base-res.dto';

export class DDataVerifyOtpRes {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  userId: string;
}

export class DVerifyOtpRes extends DBaseRes {
  @ApiProperty({ example: DDataVerifyOtpRes, type: DDataVerifyOtpRes })
  declare data?: DDataVerifyOtpRes;
}
