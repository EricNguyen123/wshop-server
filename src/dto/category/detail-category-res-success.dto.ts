import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DGetProduct } from '../product/get-list-products-res-success.dto';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class DDetailCategory {
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

  @ApiPropertyOptional({
    type: [DDetailCategory],
    description: 'Sub categories list',
    example: [
      {
        id: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
        name: 'Sub Category 1',
        parentCategoryId: 'd52af9ea-afb2-441e-b827-03df0c65c835',
        subCategories: [],
        products: [],
      },
    ],
  })
  @IsOptional()
  @Type(() => DDetailCategory)
  subCategories?: DDetailCategory[];

  @ApiPropertyOptional({
    type: [DGetProduct],
    description: 'Products list',
  })
  @IsOptional()
  @Type(() => DGetProduct)
  products: DGetProduct[];
}

export class DDetailCategoryResSuccess extends DBaseRes {
  @ApiProperty({ type: DDetailCategory, example: DDetailCategory })
  declare data?: DDetailCategory;
}
