import { ApiProperty, PartialType } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DBaseGetListRes } from '../base-get-list-res.dto';
import { DMediaProductRes } from './product-res-success.dto';
import { DProductRes } from './product-res.dto';

export class DGetProduct extends PartialType(DProductRes) {
  @ApiProperty({
    type: [DMediaProductRes],
    example: [
      {
        id: 'd52af9ea-afb2-441e-b827-03df0c65c835',
        mediaUrl: 'https://i.pravatar.cc/300',
        fileName: 'name.png',
        fileSize: '5000',
      },
    ],
  })
  medias?: DMediaProductRes[];
}

export class DGetListProductsResSuccess extends DBaseRes {
  @ApiProperty({
    example: DBaseGetListRes<DGetProduct>,
    type: DBaseGetListRes<DGetProduct>,
  })
  declare data: DBaseGetListRes<DGetProduct>;
}
