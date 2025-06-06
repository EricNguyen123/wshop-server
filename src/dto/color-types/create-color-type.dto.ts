import { ApiProperty } from '@nestjs/swagger';

export class DCreateColorType {
  @ApiProperty({ example: 'Red' })
  name?: string;

  @ApiProperty({ example: '#FF0000' })
  colorCode?: string;
}
