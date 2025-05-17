import { RecordTypeFileEnum } from 'src/common/enums/common.enum';
import { DBlobRes } from './blob-res.dto';
import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DAttachmentRes {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'avatar.png' })
  name: string;

  @ApiProperty({ example: 'USER' })
  recordType: RecordTypeFileEnum;

  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  recordId: string;

  @ApiProperty({ example: DBlobRes })
  blob: DBlobRes;

  @ApiProperty({ example: '2025-04-10 15:34:54.726739' })
  createdAt: Date;
}
