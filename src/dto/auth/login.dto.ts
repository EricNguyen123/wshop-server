import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsStrongPassword } from 'class-validator';
import { ValidationConfig } from 'src/constants/common';

export class DLogin {
  @ApiProperty({ example: 'huyhuhyhoa@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456@aA' })
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: ValidationConfig.LENGTH_STRING,
    minNumbers: ValidationConfig.MIN_LENGTH_NUMBER,
    minLowercase: ValidationConfig.MIN_LENGTH_LOW_CASE,
    minUppercase: ValidationConfig.MIN_LENGTH_UP_CASE,
    minSymbols: ValidationConfig.MIN_SYMBOL,
  })
  password: string;
}
