import { ApiProperty } from '@nestjs/swagger';

export class DCreateProduct {
  @ApiProperty({ example: 'Product 1' })
  name: string;

  @ApiProperty({ example: 'P1' })
  code: string;

  @ApiProperty({ example: 1000 })
  price: number;

  @ApiProperty({ example: 10 })
  quantity: number;

  @ApiProperty({ example: 5 })
  quantityAlert: number;

  @ApiProperty({ example: 1 })
  orderUnit: number;

  @ApiProperty({ example: 'Description' })
  description: string;

  @ApiProperty({ example: 1 })
  status: number;

  @ApiProperty({ example: 1 })
  multiplicationRate: number;

  @ApiProperty({ example: 0 })
  discount: number;
}
