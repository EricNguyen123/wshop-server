import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { CampaignsEntity } from './campaigns.entity';
import { ProductsEntity } from './products.entity';
import { StoreEntity } from './stores.entity';
import { ProductTypesEntity } from './product-types.entity';
import { UserEntity } from './user.entity';
import { OrderItemsEntity } from './order-items.entity';
import { BaseModel } from './base-model';
import { CartStatusEnum } from 'src/common/enums/common.enum';

@Entity('cart_items')
export class CartItemsEntity extends BaseModel {
  @Column({ name: 'quantity', type: 'int', unsigned: true })
  quantity: number;

  @Column({
    name: 'status',
    type: 'smallint',
    default: CartStatusEnum.ADD_CART,
  })
  status: CartStatusEnum;

  @ManyToOne(() => CampaignsEntity, (campaign) => campaign.cartItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'campaign_id' })
  campaign: CampaignsEntity;

  @ManyToOne(() => ProductsEntity, (product) => product.cartItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductsEntity;

  @ManyToOne(() => StoreEntity, (store) => store.cartItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store: StoreEntity;

  @ManyToOne(() => ProductTypesEntity, (productType) => productType.cartItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_type_id' })
  productType: ProductTypesEntity;

  @ManyToOne(() => UserEntity, (user) => user.cartItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @OneToMany(() => OrderItemsEntity, (orderItems) => orderItems.cartItem, {
    cascade: true,
  })
  orderItems: OrderItemsEntity[];
}
