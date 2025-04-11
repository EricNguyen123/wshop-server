import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Match } from 'src/common/decorators/validation.decorator';
import { ValidationConfig } from 'src/constants/common';

export class DRegister {
  @ApiProperty({ example: 'Jane' })
  @IsNotEmpty()
  @IsString()
  @MinLength(ValidationConfig.MIN_LENGTH_STRING)
  @MaxLength(ValidationConfig.MEDIUM_LENGTH_STRING)
  name: string;

  @ApiProperty({ example: 'huyhuhyhoa@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456@aA' })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: ValidationConfig.LENGTH_STRING,
    minNumbers: ValidationConfig.MIN_LENGTH_NUMBER,
    minLowercase: ValidationConfig.MIN_LENGTH_LOW_CASE,
    minUppercase: ValidationConfig.MIN_LENGTH_UP_CASE,
    minSymbols: ValidationConfig.MIN_SYMBOL,
  })
  password: string;

  @ApiProperty({ example: '123456@aA' })
  @IsString()
  @IsNotEmpty()
  @IsStrongPassword({
    minLength: ValidationConfig.LENGTH_STRING,
    minNumbers: ValidationConfig.MIN_LENGTH_NUMBER,
    minLowercase: ValidationConfig.MIN_LENGTH_LOW_CASE,
    minUppercase: ValidationConfig.MIN_LENGTH_UP_CASE,
    minSymbols: ValidationConfig.MIN_SYMBOL,
  })
  @Match('password', { message: 'Passwords do not match' })
  confirmPassword: string;
}
