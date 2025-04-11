import { ApiProperty } from '@nestjs/swagger';

export class DLogout {
  @ApiProperty({ example: 'token', type: String })
  token: string;
}
