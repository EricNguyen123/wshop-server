import { ValidRolesEnum } from 'src/common/enums/base.enum';
import { IUserRes } from './user.interface';
import { IResponse } from './base.interface';

export interface IUser {
  id: string;
  role: ValidRolesEnum;
  name: string;
  email: string;
}

export interface IRegister {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ILogin {
  email: string;
  password: string;
}

export interface ILoginRes {
  user: IUserRes;
  token: string;
  refreshToken: string;
}

export interface ILoginReq {
  user: IUserRes;
}

export type ILogoutRes = Omit<IResponse, 'data'>;

export interface IChangePasswordRes extends IResponse {
  data?: IUserRes;
}

export interface IChangeForgotPassword {
  password: string;
  confirmPassword: string;
}

export interface IChangePassword {
  currentPassword: string;
  password: string;
  confirmPassword: string;
}

export interface IVerifyEmail {
  email: string;
  token: string;
}

export type ICheckUser = ILogin;

export interface IRefreshReq {
  user: IUserRes;
}

export interface IRefreshRes {
  token: string;
}
