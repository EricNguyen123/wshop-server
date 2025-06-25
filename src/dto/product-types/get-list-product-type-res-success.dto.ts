import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DBaseGetListRes } from '../base-get-list-res.dto';
import { IsUUID } from 'class-validator';

export class DColorType {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  id?: string;

  @ApiProperty({ example: '#FF0000' })
  colorCode?: string;

  @ApiProperty({ example: 'Red' })
  name?: string;
}

export class DSizeType {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'SM' })
  sizeCode?: string;

  @ApiProperty({ example: 'Small' })
  name?: string;

  @ApiProperty({ example: 'A' })
  sizeType?: string;
}

export class DGetProductTypeRes {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  id?: string;

  @ApiProperty({
    type: DColorType,
    example: DColorType,
  })
  color?: DColorType;

  @ApiProperty({
    type: DSizeType,
    example: DSizeType,
  })
  size?: DSizeType;

  @ApiProperty({ example: 10 })
  quantity?: number;
}

export class DGetListProductTypeResSuccess extends DBaseRes {
  @ApiProperty({
    example: DBaseGetListRes<DGetProductTypeRes>,
    type: DBaseGetListRes<DGetProductTypeRes>,
  })
  declare data: DBaseGetListRes<DGetProductTypeRes>;
}
