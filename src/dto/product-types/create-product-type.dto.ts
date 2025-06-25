import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DCreateProductType {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  colorTypeId: string;

  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  sizeTypeId: string;

  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @ApiProperty({ example: 10 })
  quantity: number;
}
