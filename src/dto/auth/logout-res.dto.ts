import { ApiProperty, OmitType } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';

export class DLogoutRes extends OmitType(DBaseRes, ['data'] as const) {
  @ApiProperty({ example: 'Logout successfully', type: String })
  declare message: string;
}
