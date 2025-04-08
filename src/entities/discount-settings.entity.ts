import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ProductsEntity } from './products.entity';
import { BaseModel } from './base-model';

@Entity('discount_settings')
export class DiscountSettingsEntity extends BaseModel {
  @Column({ name: 'custom_discount_type', type: 'int' })
  customDiscountValue: number;

  @ManyToOne(() => ProductsEntity, (product) => product.discountSettings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductsEntity;
}
