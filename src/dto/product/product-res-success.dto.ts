import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DProductRes } from './product-res.dto';
import { DCategory, DGetProduct } from './get-list-products-res-success.dto';

export class DMediaProductRes {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  id?: string;

  @ApiProperty({ example: 'https://i.pravatar.cc/300' })
  mediaUrl?: string;

  @ApiProperty({ example: 'name.png' })
  fileName?: string;

  @ApiProperty({ example: '5000' })
  fileSize?: string;
}

export class DDataProductRes {
  @ApiProperty({ type: DProductRes, example: DProductRes })
  product?: DProductRes;

  @ApiProperty({ type: [DMediaProductRes] })
  medias?: DMediaProductRes[];

  @ApiProperty({
    type: [DCategory],
    example: [
      {
        id: 'd52af9ea-afb2-441e-b827-03df0c65c835',
        name: 'Category 1',
      },
    ],
  })
  categories?: DCategory[];
}

export class DProductResSuccess extends DBaseRes {
  @ApiProperty({
    type: DGetProduct,
    example: {
      id: 'd52af9ea-afb2-441e-b827-03df0c65c835',
      name: 'Product 1',
      code: 'P1',
      price: 1000,
      quantity: 10,
      quantityAlert: 5,
      orderUnit: 1,
      description: 'Description',
      status: 1,
      multiplicationRate: 1,
      discount: 0,
      medias: [
        {
          id: 'd52af9ea-afb2-441e-b827-03df0c65c835',
          mediaUrl: 'https://i.pravatar.cc/300',
          fileName: 'name.png',
          fileSize: '5000',
        },
      ],
      categories: [
        {
          id: 'd52af9ea-afb2-441e-b827-03df0c65c835',
          name: 'Category 1',
        },
      ],
    },
  })
  declare data?: DGetProduct;
}

export class DProductUpdateResSuccess extends DBaseRes {
  @ApiProperty({
    type: DGetProduct,
    example: {
      id: 'd52af9ea-afb2-441e-b827-03df0c65c835',
      name: 'Product 1',
      code: 'P1',
      price: 1000,
      quantity: 10,
      quantityAlert: 5,
      orderUnit: 1,
      description: 'Description',
      status: 1,
      multiplicationRate: 1,
      discount: 0,
      medias: [
        {
          id: 'd52af9ea-afb2-441e-b827-03df0c65c835',
          mediaUrl: 'https://i.pravatar.cc/300',
          fileName: 'name.png',
          fileSize: '5000',
        },
      ],
      categories: [
        {
          id: 'd52af9ea-afb2-441e-b827-03df0c65c835',
          name: 'Category 1',
        },
      ],
    },
  })
  declare data?: DGetProduct;
}
