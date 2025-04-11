import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';
import { Match } from 'src/common/decorators/validation.decorator';
import { ValidationConfig } from 'src/constants/common';

export class DChangeForgotPassword {
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
