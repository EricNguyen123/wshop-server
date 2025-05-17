import { ApiProperty } from '@nestjs/swagger';
import { DBaseRes } from '../base-res.dto';
import { IsUUID } from 'class-validator';

export class DMediaRes {
  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  id: string;

  @ApiProperty({ example: 'https://i.pravatar.cc/300' })
  avatarUrl: string;

  @ApiProperty({ example: 'd52af9ea-afb2-441e-b827-03df0c65c835' })
  @IsUUID()
  userId: string;
}

export class DUserAvatarResSuccess extends DBaseRes {
  @ApiProperty({ example: DMediaRes, type: DMediaRes })
  declare data: DMediaRes;
}
