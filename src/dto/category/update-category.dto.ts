import { PartialType } from '@nestjs/swagger';
import { DCreateCategory } from './create-category.dto';

export class DUpdateCategory extends PartialType(DCreateCategory) {}
