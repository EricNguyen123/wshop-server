import { Exclude } from 'class-transformer';
import { ProductsEntity } from 'src/entities/products.entity';

export class ProductSerializer extends ProductsEntity {
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

  constructor(partial: Partial<ProductsEntity>) {
    super();
    Object.assign(this, partial);
  }
}
