import { ApiProperty, PartialType } from '@nestjs/swagger';
import { DCreateProduct } from './create-product.dto';

export class DUpdateProduct extends PartialType(DCreateProduct) {
  @ApiProperty({ type: Array, items: { type: 'string' }, example: ['1', '2'] })
  mediaIds?: string[];

  @ApiProperty({ isArray: true, example: ['d52af9ea-afb2-441e-b827-03df0c65c835'] })
  categoryIds?: string[];
}
