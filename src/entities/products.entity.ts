import { Column, Entity, OneToMany } from 'typeorm';
import { CategoryTinyEntity } from './category-tinies.entity';
import { DiscountSettingsEntity } from './discount-settings.entity';
import { ProductResourceEntity } from './product-resources.entity';
import { CampaignProductsEntity } from './campaign-products.entity';
import { CartItemsEntity } from './cart-items.entity';
import { ProductTypesEntity } from './product-types.entity';
import { FavoritesEntity } from './favorites.entity';
import { BaseModel } from './base-model';

@Entity('products')
export class ProductsEntity extends BaseModel {
  @Column({ name: 'name', type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'code', type: 'varchar', length: 255 })
  code: string;

  @Column({ name: 'price', type: 'bigint' })
  price: number;

  @Column({ name: 'quantity', type: 'int', unsigned: true })
  quantity: number;

  @Column({ name: 'quantity_alert', type: 'int', unsigned: true })
  quantityAlert: number;

  @Column({ name: 'order_unit', type: 'int', unsigned: true })
  orderUnit: number;

  @Column({ name: 'description', type: 'text' })
  description: string;

  @Column({ name: 'status', type: 'int' })
  status: number;

  @Column({ name: 'multiplication_rate', type: 'int' })
  multiplicationRate: number;

  @Column({ name: 'discount', type: 'float' })
  discount: number;

  @OneToMany(() => CategoryTinyEntity, (categoryTinies) => categoryTinies.product, {
    cascade: true,
  })
  categoryTinies: CategoryTinyEntity[];

  @OneToMany(() => DiscountSettingsEntity, (discountSettings) => discountSettings.product, {
    cascade: true,
  })
  discountSettings: DiscountSettingsEntity[];

  @OneToMany(() => ProductResourceEntity, (productResources) => productResources.product, {
    cascade: true,
  })
  productResources: ProductResourceEntity[];

  @OneToMany(() => CampaignProductsEntity, (campaignProducts) => campaignProducts.product, {
    cascade: true,
  })
  campaignProducts: CampaignProductsEntity[];

  @OneToMany(() => CartItemsEntity, (cartItems) => cartItems.product, {
    cascade: true,
  })
  cartItems: CartItemsEntity[];

  @OneToMany(() => ProductTypesEntity, (productTypes) => productTypes.product, {
    cascade: true,
  })
  productTypes: ProductTypesEntity[];

  @OneToMany(() => FavoritesEntity, (favorites) => favorites.product, {
    cascade: true,
  })
  favorites: FavoritesEntity[];
}
