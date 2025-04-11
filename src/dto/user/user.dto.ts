import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword, ValidateIf } from 'class-validator';
import { StatusEnum, ValidRolesEnum } from 'src/common/enums/base.enum';
import { ValidationConfig } from 'src/constants/common';

export class DUser {
  @ApiProperty()
  name?: string;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @ValidateIf((obj: DUser) => obj.encryptedPassword !== undefined)
  @IsStrongPassword({
    minLength: ValidationConfig.LENGTH_STRING,
    minNumbers: ValidationConfig.MIN_LENGTH_NUMBER,
    minLowercase: ValidationConfig.MIN_LENGTH_LOW_CASE,
    minUppercase: ValidationConfig.MIN_LENGTH_UP_CASE,
    minSymbols: ValidationConfig.MIN_SYMBOL,
  })
  encryptedPassword?: string;

  @ApiProperty()
  role?: ValidRolesEnum;

  @ApiProperty()
  status?: StatusEnum;

  @ApiProperty()
  zipcode?: string;

  @ApiProperty()
  phone?: string;

  @ApiProperty()
  prefecture?: string;

  @ApiProperty()
  city?: string;

  @ApiProperty()
  street?: string;

  @ApiProperty()
  building?: string;

  @ApiProperty()
  currentSignInAt?: Date;

  @ApiProperty()
  lastSignInAt?: Date;

  @ApiProperty()
  tokens?: string;
}
