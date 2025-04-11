import { IsEmail } from 'class-validator';

export class DSendMailReq {
  name?: string;

  @IsEmail()
  email: string;
}
