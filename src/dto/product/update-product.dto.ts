import { ApiProperty, PartialType } from '@nestjs/swagger';
import { DCreateProduct } from './create-product.dto';

export class DUpdateProduct extends PartialType(DCreateProduct) {
  @ApiProperty({ type: Array, items: { type: 'string' }, example: ['1', '2'] })
  mediaIds?: string[];
}
