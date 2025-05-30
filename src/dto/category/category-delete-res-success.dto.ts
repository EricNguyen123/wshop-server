import { ApiProperty, OmitType } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { HttpStatus } from '@nestjs/common';
import { HTTP_RESPONSE } from 'src/constants/http-response';

export class DCategoryDeleteResSuccess extends OmitType(DBaseRes, ['data'] as const) {
  @ApiProperty({ example: HttpStatus.OK })
  declare status: number;

  @ApiProperty({ example: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.message })
  declare message: string;

  @ApiProperty({ example: HTTP_RESPONSE.COMMON.DELETE_SUCCESS.code })
  declare code: number;
}
