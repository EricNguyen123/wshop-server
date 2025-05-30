import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { IsUUID, IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class DDataCategory {
  @ApiProperty({
    example: 'd52af9ea-afb2-441e-b827-03df0c65c835',
    description: 'Category unique identifier',
  })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'Category name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'd52af9ea-afb2-441e-b827-03df0c65c835',
    description: 'Parent category ID',
  })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string;
}

export class DDataCategoryRes extends DDataCategory {
  @ApiPropertyOptional({
    type: () => DDataCategory,
    description: 'Parent category information',
  })
  @IsOptional()
  @Type(() => DDataCategory)
  parentCategory?: DDataCategory;

  @ApiPropertyOptional({
    type: [DDataCategory],
    description: 'Sub categories list',
  })
  @IsOptional()
  @Type(() => DDataCategory)
  subCategories?: DDataCategory[];
}

export class DCategoryResSuccess extends DBaseRes {
  @ApiProperty({
    type: DDataCategoryRes,
    description: 'Category response data',
    example: {
      id: 'd52af9ea-afb2-441e-b827-03df0c65c835',
      name: 'Electronics',
      parentCategoryId: 'a42bf8da-bfb1-332d-c716-02ef1d64d836',
      subCategories: [
        {
          id: 'e63cf0eb-cfc3-552e-d827-04fg2e75e946',
          name: 'Smartphones',
          parentCategoryId: 'd52af9ea-afb2-441e-b827-03df0c65c835',
        },
        {
          id: 'f74dg1fc-dfd4-663f-e938-05gh3f86f057',
          name: 'Laptops',
          parentCategoryId: 'd52af9ea-afb2-441e-b827-03df0c65c835',
        },
      ],
    },
  })
  declare data: DDataCategoryRes;
}
