import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class DLoginGoogle {
  @ApiProperty({ example: 'jane@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
