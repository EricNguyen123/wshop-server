import { IsEmail, IsString } from 'class-validator';
import { StatusEnum } from 'src/common/enums/base.enum';

export class DGoogle {
  @IsString()
  name: string;

  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  encryptedPassword: string;

  @IsString()
  provider: string;

  @IsString()
  uid: string;

  status: StatusEnum;
}
