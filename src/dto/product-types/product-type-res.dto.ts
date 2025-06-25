import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class DProductTypeRes {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  id?: string;

  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  colorTypeId: string;

  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  sizeTypeId: string;

  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 10 })
  quantity: number;
}
