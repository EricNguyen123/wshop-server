import { Exclude, Expose } from 'class-transformer';
import { CategoriesEntity } from 'src/entities/categories.entity';

export class CategorySerializer extends CategoriesEntity {
  @Exclude()
  declare createdBy: string;

  @Exclude()
  declare updatedBy: string;

  @Exclude()
  declare deletedAt: Date;

  @Exclude()
  declare deletedBy: string;

  @Expose()
  productCount: number;

  constructor(partial: Partial<CategoriesEntity>) {
    super();
    Object.assign(this, partial);
  }
}
