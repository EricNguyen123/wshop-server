import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { RecordTypeFileEnum } from 'src/common/enums/common.enum';

export class DUploadFile {
  @IsNotEmpty()
  @IsString()
  name?: string;

  @IsNotEmpty()
  @IsString()
  recordType: RecordTypeFileEnum;

  @IsNotEmpty()
  @IsUUID()
  recordId: string;
}
