import { ApiProperty } from '@nestjs/swagger';

export class DOtpEmailRes {
  @ApiProperty({ example: 1000 })
  timeOut: number | undefined;

  @ApiProperty({ example: 1000 })
  timeLine: number | undefined;

  @ApiProperty({ example: 'jane@gmail.com' })
  email: string;
}
