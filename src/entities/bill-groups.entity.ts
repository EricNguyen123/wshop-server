import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BillsEntity } from './bills.entity';
import { StoreEntity } from './stores.entity';
import { BillItemsEntity } from './bill-items.entity';
import { BaseModel } from './base-model';

@Entity('bill_groups')
export class BillGroupsEntity extends BaseModel {
  @Column({ name: 'reduced_taxable_amount', type: 'int' })
  reducedTaxableAmount: number;

  @Column({ name: 'reduced_tax', type: 'int' })
  reducedTax: number;

  @Column({ name: 'taxable_amount', type: 'int' })
  taxableAmount: number;

  @Column({ name: 'tax', type: 'int' })
  tax: number;

  @Column({ name: 'shipping_fee', type: 'int' })
  shippingFee: number;

  @Column({ name: 'amount', type: 'int' })
  amount: number;

  @Column({ name: 'discount', type: 'int' })
  discount: number;

  @Column({ name: 'total_amount', type: 'int' })
  totalAmount: number;

  @Column({ name: 'order_type', type: 'int' })
  orderType: number;

  @Column({ name: 'bill_id', type: 'uuid' })
  billId: string;

  @Column({ name: 'store_id', type: 'uuid' })
  storeId: string;

  @ManyToOne(() => BillsEntity, (bill) => bill.billGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'bill_id' })
  bill: BillsEntity;

  @ManyToOne(() => StoreEntity, (store) => store.billGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'store_id' })
  store: StoreEntity;

  @OneToMany(() => BillItemsEntity, (billItems) => billItems.billGroup, {
    cascade: true,
  })
  billItems: BillItemsEntity[];
}
