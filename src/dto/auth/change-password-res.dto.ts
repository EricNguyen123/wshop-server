import { ApiProperty } from '@nestjs/swagger';
import { DUserRes } from '../user/user-res.dto';
import { DBaseRes } from '../base-res.dto';

export class DChangePasswordRes extends DBaseRes {
  @ApiProperty({ example: DUserRes, type: DUserRes })
  declare data?: DUserRes;

  @ApiProperty({ example: 'Change password successfully' })
  declare message: string;
}
