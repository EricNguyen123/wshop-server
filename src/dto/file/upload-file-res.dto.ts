import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DAttachmentRes } from './attachment-res.dto';

export class DUploadFileRes extends DBaseRes {
  @ApiProperty({ type: DAttachmentRes, example: DAttachmentRes })
  declare data?: DAttachmentRes;
}
