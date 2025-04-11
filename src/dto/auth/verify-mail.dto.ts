import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class DVerifyMail {
  @ApiProperty({ example: 'jane@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456' })
  token: string;
}
