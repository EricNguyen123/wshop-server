import { PartialType, OmitType } from '@nestjs/mapped-types';
import { DUser } from './user.dto';
import { ApiProperty } from '@nestjs/swagger';
import { StatusEnum, ValidRolesEnum } from 'src/common/enums/base.enum';
import { IsEmail } from 'class-validator';

export class DUserCreate extends PartialType(
  OmitType(DUser, ['encryptedPassword', 'tokens'] as const)
) {
  @ApiProperty({ example: 'John' })
  name: string;

  @ApiProperty({ example: 'jane@gmail.com' })
  @IsEmail()
  email: string;

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
}
