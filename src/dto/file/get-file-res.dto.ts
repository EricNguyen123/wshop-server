import { ApiProperty, OmitType } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { DAttachmentRes } from './attachment-res.dto';
import { DBlobRes } from './blob-res.dto';
import { HttpStatus } from '@nestjs/common';
import { HTTP_RESPONSE } from 'src/constants/http-response';

export class DAttachmentData extends OmitType(DAttachmentRes, ['blob'] as const) {}

export class DGetFileResData {
  @ApiProperty({
    type: DAttachmentData,
  })
  attachment: DAttachmentData;

  @ApiProperty({
    example: DBlobRes,
    type: DBlobRes,
  })
  blob: DBlobRes;
}

export class DGetFileRes extends DBaseRes {
  @ApiProperty({ example: HttpStatus.OK })
  declare status: number;

  @ApiProperty({ example: HTTP_RESPONSE.COMMON.GET_SUCCESS.message })
  declare message: string;

  @ApiProperty({ example: HTTP_RESPONSE.COMMON.GET_SUCCESS.code })
  declare code: number;

  @ApiProperty({
    example: DGetFileResData,
    type: DGetFileResData,
  })
  declare data?: DGetFileResData;
}
