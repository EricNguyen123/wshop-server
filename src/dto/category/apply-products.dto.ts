import { ApiProperty } from '@nestjs/swagger';

export class DApplyProducts {
  @ApiProperty({ example: ['d52af9ea-afb2-441e-b827-03df0c65c835'] })
  productIds: string[];
}
