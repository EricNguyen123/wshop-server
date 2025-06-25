import { Exclude } from 'class-transformer';
import { ProductTypesEntity } from 'src/entities/product-types.entity';

export class ProductTypesSerializer extends ProductTypesEntity {
  @Exclude()
  declare createdAt: Date;

  @Exclude()
  declare createdBy: string;

  @Exclude()
  declare updatedAt: Date;

  @Exclude()
  declare updatedBy: string;

  @Exclude()
  declare deletedAt: Date;

  @Exclude()
  declare deletedBy: string;

  constructor(partial: Partial<ProductTypesEntity>) {
    super();
    Object.assign(this, partial);
  }
}
