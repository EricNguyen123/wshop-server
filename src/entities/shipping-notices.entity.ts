import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { ShippingCompaniesEntity } from './shipping-companies.entity';
import { OrderItemsEntity } from './order-items.entity';
import { BaseModel } from './base-model';

@Entity('shipping_notices')
export class ShippingNoticesEntity extends BaseModel {
  @Column({ name: 'document_number', type: 'varchar', length: 255 })
  documentNumber: string;

  @Column({ name: 'subject', type: 'text' })
  subject: string;

  @Column({ name: 'content', type: 'text' })
  content: string;

  @Column({ name: 'memo', type: 'text' })
  memo: string;

  @ManyToOne(() => ShippingCompaniesEntity, (shippingCompany) => shippingCompany.shippingNotices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'shipping_company_id' })
  shippingCompany: ShippingCompaniesEntity;

  @ManyToOne(() => OrderItemsEntity, (orderItem) => orderItem.shippingNotices, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItemsEntity;
}
