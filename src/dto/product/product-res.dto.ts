import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DProductRes {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  id?: string;

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
