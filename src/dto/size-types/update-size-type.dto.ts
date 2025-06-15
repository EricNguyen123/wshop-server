import { ApiProperty } from '@nestjs/swagger';

export class DUpdateSizeType {
  @ApiProperty({ example: 'Small' })
  name?: string;

  @ApiProperty({ example: 'SM' })
  sizeCode?: string;

  @ApiProperty({ example: 'A' })
  sizeType?: string;
}
