import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsStrongPassword, ValidateIf } from 'class-validator';
import { StatusEnum, ValidRolesEnum } from 'src/common/enums/base.enum';
import { ValidationConfig } from 'src/constants/common';

export class DUser {
  @ApiProperty({ example: 'John' })
  name?: string;

  @ApiProperty({ example: 'jane@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '123456@aA' })
  @ValidateIf((obj: DUser) => obj.encryptedPassword !== undefined)
  @IsStrongPassword({
    minLength: ValidationConfig.LENGTH_STRING,
    minNumbers: ValidationConfig.MIN_LENGTH_NUMBER,
    minLowercase: ValidationConfig.MIN_LENGTH_LOW_CASE,
    minUppercase: ValidationConfig.MIN_LENGTH_UP_CASE,
    minSymbols: ValidationConfig.MIN_SYMBOL,
  })
  encryptedPassword?: string;

  @ApiProperty({ example: ValidRolesEnum.ADMIN })
  role?: ValidRolesEnum;

  @ApiProperty({ example: StatusEnum.ACTIVE })
  status?: StatusEnum;

  @ApiProperty({ example: '123456' })
  zipcode?: string;

  @ApiProperty({ example: '0987654321' })
  phone?: string;

  @ApiProperty({ example: 'HN' })
  prefecture?: string;

  @ApiProperty({ example: 'HD' })
  city?: string;

  @ApiProperty({ example: '112 HD' })
  street?: string;

  @ApiProperty({ example: 'A1 112 QT' })
  building?: string;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  currentSignInAt?: Date;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  lastSignInAt?: Date;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6IjAwMDAyIiwiaWF0IjoxNzQ0MjcyMDU0LCJleHAiOjE3NzU4Mjk2NTR9.T3D4worEVyq2_DVU3GtQR2Ig6Fk2q1rkepTq8OSasEk',
  })
  tokens?: string;
}
