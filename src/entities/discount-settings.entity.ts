import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ProductsEntity } from './products.entity';
import { BaseModel } from './base-model';

@Entity('discount_settings')
export class DiscountSettingsEntity extends BaseModel {
  @Column({ name: 'custom_discount_type', type: 'int' })
  customDiscountValue: number;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => ProductsEntity, (product) => product.discountSettings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductsEntity;
}
