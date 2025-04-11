import { ApiProperty } from '@nestjs/swagger';
import { DUserRes } from '../user/user-res.dto';

export class DLoginRes {
  @ApiProperty({ example: DUserRes, type: DUserRes })
  user: DUserRes;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6Miwicm9sZSI6IjAwMDAyIiwiaWF0IjoxNzQ0MjcyMDU0LCJleHAiOjE3NzU4Mjk2NTR9.T3D4worEVyq2_DVU3GtQR2Ig6Fk2q1rkepTq8OSasEk',
    type: String,
    description: 'JWT authentication token',
  })
  token: string;
}
