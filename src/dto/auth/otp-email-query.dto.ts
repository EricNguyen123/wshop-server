import { ApiProperty } from '@nestjs/swagger';
import { BusinessTypeOtpEnum } from 'src/common/enums/common.enum';

export class DQueryOtpEmail {
  @ApiProperty({
    example: 'FORGOT_PASSWORD',
    type: BusinessTypeOtpEnum,
    enumName: 'BusinessTypeOtpEnum',
  })
  businessType?: BusinessTypeOtpEnum;
}
