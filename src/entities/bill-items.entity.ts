import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BillGroupsEntity } from './bill-groups.entity';
import { ProductTypesEntity } from './product-types.entity';
import { BaseModel } from './base-model';

@Entity('bill_items')
export class BillItemsEntity extends BaseModel {
  @Column({ name: 'quantity', type: 'int' })
  quantity: number;

  @Column({ name: 'price', type: 'bigint' })
  price: number;

  @Column({ name: 'order_id', type: 'varchar', length: 255 })
  orderId: string;

  @Column({ name: 'order_at', type: 'datetime' })
  orderAt: Date;

  @ManyToOne(() => BillGroupsEntity, (billGroup) => billGroup.billItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bill_group_id' })
  billGroup: BillGroupsEntity;

  @ManyToOne(() => ProductTypesEntity, (productType) => productType.billItems, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_type_id' })
  productType: ProductTypesEntity;
}
