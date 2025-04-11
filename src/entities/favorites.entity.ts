import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ProductsEntity } from './products.entity';
import { UserEntity } from './user.entity';
import { BaseModel } from './base-model';

@Entity('favorites')
export class FavoritesEntity extends BaseModel {
  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @ManyToOne(() => ProductsEntity, (product) => product.favorites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductsEntity;

  @ManyToOne(() => UserEntity, (user) => user.favorites, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;
}
