import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { OrdersEntity } from './orders.entity';
import { CartItemsEntity } from './cart-items.entity';
import { ShippingNoticesEntity } from './shipping-notices.entity';
import { ShippingInstructionsEntity } from './shipping-instructions.entity';
import { BaseModel } from './base-model';

@Entity('order_items')
export class OrderItemsEntity extends BaseModel {
  @Column({ name: 'price', type: 'bigint', unsigned: true })
  price: number;

  @Column({ name: 'status', type: 'smallint' })
  status: number;

  @Column({ name: 'shipping_date', type: 'datetime' })
  shippingDate: Date;

  @Column({ name: 'order_type', type: 'smallint' })
  order_type: number;

  @Column({ name: 'quantity', type: 'int', unsigned: true })
  quantity: number;

  @ManyToOne(() => OrdersEntity, (order) => order.orderItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_id' })
  order: OrdersEntity;

  @ManyToOne(() => CartItemsEntity, (cartItem) => cartItem.orderItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cart_item_id' })
  cartItem: CartItemsEntity;

  @OneToMany(() => ShippingNoticesEntity, (shippingNotices) => shippingNotices.orderItem, {
    cascade: true,
  })
  shippingNotices: ShippingNoticesEntity[];

  @OneToMany(
    () => ShippingInstructionsEntity,
    (shippingInstructions) => shippingInstructions.orderItem,
    {
      cascade: true,
    }
  )
  shippingInstructions: ShippingInstructionsEntity[];
}
