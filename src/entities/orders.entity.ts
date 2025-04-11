import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BillsEntity } from './bills.entity';
import { UserEntity } from './user.entity';
import { OrderItemsEntity } from './order-items.entity';
import { BaseModel } from './base-model';
import { OrderStatusEnum, ShippingStatusEnum } from 'src/common/enums/common.enum';

@Entity('orders')
export class OrdersEntity extends BaseModel {
  @Column({ name: 'orderer_type', type: 'varchar', length: 255 })
  ordererType: string;

  @Column({ name: 'receiver_type', type: 'varchar', length: 255 })
  receiverType: string;

  @Column({ name: 'order_status', type: 'varchar', default: OrderStatusEnum.NOT_ACTIVE })
  orderStatus: OrderStatusEnum;

  @Column({
    name: 'shipping_status',
    type: 'varchar',
    default: ShippingStatusEnum.WAITING_FOR_PICK_UP,
  })
  shippingStatus: ShippingStatusEnum;

  @Column({ name: 'order_id', type: 'varchar', length: 255 })
  orderId: string;

  @Column({ name: 'order_date', type: 'datetime' })
  orderDate: Date;

  @Column({ name: 'order_at', type: 'datetime' })
  orderAt: Date;

  @Column({ name: 'memo', type: 'text' })
  memo: string;

  @Column({ name: 'order_type', type: 'smallint' })
  orderType: number;

  @Column({ name: 'bill_id', type: 'uuid' })
  billId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'orderer_id', type: 'uuid' })
  ordererId: string;

  @Column({ name: 'receiver_id', type: 'uuid' })
  receiverId: string;

  @ManyToOne(() => BillsEntity, (bill) => bill.orders, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bill_id' })
  bill: BillsEntity;

  @ManyToOne(() => UserEntity, (user) => user.orders)
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @ManyToOne(() => UserEntity, (orderer) => orderer.ordersOrderer, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderer_id' })
  orderer: UserEntity;

  @ManyToOne(() => UserEntity, (receiver) => receiver.ordersReceiver)
  @JoinColumn({ name: 'receiver_id' })
  receiver: UserEntity;

  @OneToMany(() => OrderItemsEntity, (orderItems) => orderItems.order, {
    cascade: true,
  })
  orderItems: OrderItemsEntity[];
}
