import { ApiProperty, PartialType } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DBaseGetListRes } from '../base-get-list-res.dto';
import { DDataCategoryRes } from './category-res-success.dto';

export class DGetCategory extends PartialType(DDataCategoryRes) {}

export class DGetListCategoriesResSuccess extends DBaseRes {
  @ApiProperty({
    example: DBaseGetListRes<DGetCategory>,
    type: DBaseGetListRes<DGetCategory>,
  })
  declare data: DBaseGetListRes<DGetCategory>;
}
