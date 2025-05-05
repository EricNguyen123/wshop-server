import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DOtpEmailRes } from './otp-email-res.dto';

export class DOtpEmailResSuccess extends DBaseRes {
  @ApiProperty({ example: DOtpEmailRes, type: DOtpEmailRes })
  declare data: DOtpEmailRes;
}
