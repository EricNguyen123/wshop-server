import { SetMetadata } from '@nestjs/common';
import { ValidRolesEnum } from '../enums/base.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: [ValidRolesEnum, ...ValidRolesEnum[]]) =>
  SetMetadata(ROLES_KEY, roles);
