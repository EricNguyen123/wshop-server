import { ApiProperty } from '@nestjs/swagger';
import { DLoginGoogle } from './login-google.dto';

export class DGoogleCallback {
  @ApiProperty({ type: DLoginGoogle })
  user: DLoginGoogle;
}
