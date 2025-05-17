import { Exclude } from 'class-transformer';
import { BannersEntity } from 'src/entities/banners.entity';

export class BannersSerializer extends BannersEntity {
  @Exclude()
  declare createdDate: Date;

  @Exclude()
  declare createdBy: string;

  @Exclude()
  declare updatedDate: Date;

  @Exclude()
  declare updatedBy: string;

  @Exclude()
  declare deletedAt: Date;

  @Exclude()
  declare deletedBy: string;

  constructor(partial: Partial<BannersEntity>) {
    super();
    Object.assign(this, partial);
  }
}
