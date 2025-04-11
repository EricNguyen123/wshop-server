import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { OrderItemsEntity } from './order-items.entity';
import { IsEmail } from 'class-validator';
import { ShippingMakerManagersEntity } from './shipping-maker-managers.entity';
import { BaseModel } from './base-model';

@Entity('shipping_instructions')
export class ShippingInstructionsEntity extends BaseModel {
  @Column({ name: 'shipping_department', type: 'int' })
  shippingDepartment: number;

  @Column({ name: 'shipping_source', type: 'int' })
  shippingSource: number;

  @Column({ name: 'email', type: 'varchar', length: 255 })
  @IsEmail()
  email: string;

  @Column({ name: 'subject', type: 'text' })
  subject: string;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'memo', type: 'text' })
  memo: string;

  @Column({ name: 'order_item_id', type: 'uuid' })
  orderItemId: string;

  @ManyToOne(() => OrderItemsEntity, (orderItem) => orderItem.shippingInstructions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItemsEntity;

  @OneToMany(
    () => ShippingMakerManagersEntity,
    (shippingMakerManagers) => shippingMakerManagers.shippingInstruction,
    {
      cascade: true,
    }
  )
  shippingMakerManagers: ShippingMakerManagersEntity[];
}
