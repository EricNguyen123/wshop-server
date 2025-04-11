import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

export class DOtpEmailRes {
  @ApiProperty({ example: HttpStatus.OK })
  status: number;

  @ApiProperty({ example: 'Send OTP successfully' })
  message: string;

  @ApiProperty({ example: 1000 })
  timeOut: number | undefined;

  @ApiProperty({ example: 1000 })
  timeLine: number | undefined;
}
