import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { StatusEnum, ValidRolesEnum } from 'src/common/enums/base.enum';

export class DUserRes {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsString()
  id?: string;

  @ApiProperty({ example: 'Jane' })
  name?: string;

  @ApiProperty({ example: 'jane@gmail.com' })
  @IsNotEmpty()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'USER' })
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
