import { ApiProperty } from '@nestjs/swagger';
import { DUserRes } from '../user/user-res.dto';
import { DBaseRes } from '../base-res.dto';

export class DVerifyMailRes extends DBaseRes {
  @ApiProperty({ type: DUserRes })
  declare data?: DUserRes;
}
