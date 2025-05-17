import { IsNotEmpty, IsUUID } from 'class-validator';

export class DDeleteFile {
  @IsNotEmpty()
  @IsUUID()
  id: string;
}
