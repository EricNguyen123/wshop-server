import { Exclude } from 'class-transformer';
import { ColorTypesEntity } from 'src/entities/color-types.entity';

export class ColorTypesSerializer extends ColorTypesEntity {
  @Exclude()
  declare createdBy: string;

  @Exclude()
  declare updatedBy: string;

  @Exclude()
  declare deletedAt: Date;

  @Exclude()
  declare deletedBy: string;

  constructor(partial: Partial<ColorTypesEntity>) {
    super();
    Object.assign(this, partial);
  }
}
