import { PartialType } from '@nestjs/mapped-types';
import { DUser } from './user.dto';

export class DUserUpdate extends PartialType(DUser) {}
