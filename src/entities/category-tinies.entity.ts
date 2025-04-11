import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { CategoriesEntity } from './categories.entity';
import { ProductsEntity } from './products.entity';
import { BaseModel } from './base-model';

@Entity('category_tinies')
export class CategoryTinyEntity extends BaseModel {
  @Column({ name: 'category_id', type: 'uuid' })
  categoryId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => CategoriesEntity, (category) => category.categoryTinies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'category_id' })
  category: CategoriesEntity;

  @ManyToOne(() => ProductsEntity, (product) => product.categoryTinies, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductsEntity;
}
