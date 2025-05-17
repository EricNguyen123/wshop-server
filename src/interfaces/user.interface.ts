import { StatusEnum, ValidRolesEnum } from 'src/common/enums/base.enum';

export class IUser {
  name?: string;
  email: string;
  encryptedPassword?: string;
  role?: ValidRolesEnum;
  status?: StatusEnum;
  zipcode?: string;
  phone?: string;
  prefecture?: string;
  city?: string;
  street?: string;
  building?: string;
  currentSignInAt?: Date;
  lastSignInAt?: Date;
  tokens?: string;
}

export interface IUserRes {
  id?: string;
  name?: string;
  email?: string;
  role?: ValidRolesEnum;
  status?: StatusEnum;
  zipcode?: string;
  phone?: string;
  prefecture?: string;
  city?: string;
  street?: string;
  building?: string;
  currentSignInAt?: Date;
  lastSignInAt?: Date;
  avatarUrl?: string;
}

export type IUserUpdate = Partial<IUser>;
