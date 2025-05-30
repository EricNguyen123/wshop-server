import { ApiProperty } from '@nestjs/swagger';

export class DCreateCategory {
  @ApiProperty({ example: 'Category 1' })
  name: string;

  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  parentCategoryId?: string;

  @ApiProperty({ example: '["d52af9ea-afb2-441e-b827-03df0c65c835"]', type: 'array' })
  subCategoryIds?: string[];
}
