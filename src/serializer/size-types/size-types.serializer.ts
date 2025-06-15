import { Exclude } from 'class-transformer';
import { SizeTypesEntity } from 'src/entities/size-types.entity';

export class SizeTypesSerializer extends SizeTypesEntity {
  @Exclude()
  declare createdBy: string;

  @Exclude()
  declare updatedBy: string;

  @Exclude()
  declare deletedAt: Date;

  @Exclude()
  declare deletedBy: string;

  constructor(partial: Partial<SizeTypesEntity>) {
    super();
    Object.assign(this, partial);
  }
}
