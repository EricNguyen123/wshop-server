import { ApiProperty, OmitType } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { HttpStatus } from '@nestjs/common';
import { HTTP_RESPONSE } from 'src/constants/http-response';

export class DVerifyOtpRestoreRes extends OmitType(DBaseRes, ['data'] as const) {
  @ApiProperty({ example: HttpStatus.OK })
  status: number;

  @ApiProperty({ example: HTTP_RESPONSE.AUTH.VERIFY_OTP_SUCCESS.message })
  message: string;

  @ApiProperty({ example: HTTP_RESPONSE.AUTH.VERIFY_OTP_SUCCESS.code })
  code: number;
}
